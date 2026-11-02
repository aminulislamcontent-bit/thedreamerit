/** SEO automation: sitemap, metadata checks, duplicate detection, redirects, internal link checks. */

import { all, get, run, nowIso } from './database';
import { recordAudit } from './auth';
import { buildProductStructuredData, buildSitemapEntries, findDuplicateContent, renderSitemap, validateMetadata, type SeoProduct } from '../core/seo-rules';
import { getMedia, getSpecs } from './catalogue';

export const STATIC_PATHS = ['/', '/products', '/categories', '/compare', '/search', '/about', '/contact', '/faq', '/guides', '/blog', '/policies/delivery', '/policies/returns', '/policies/terms', '/policies/privacy'];

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function sitemapXml(): string {
  const products = all<{ canonical_path: string; updated_at: string; status: string; indexable: number }>(
    `SELECT COALESCE(s.canonical_path, '/products/' || p.slug) AS canonical_path, p.updated_at, p.status, COALESCE(s.indexable,0) AS indexable
     FROM products p LEFT JOIN product_seo s ON s.product_id = p.id`);
  const entries = buildSitemapEntries(products.map((p) => ({ canonicalPath: p.canonical_path, updatedAt: p.updated_at, published: p.status === 'published', indexable: !!p.indexable })), STATIC_PATHS, siteUrl());
  return renderSitemap(entries);
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /account/\nDisallow: /api/\nSitemap: ${siteUrl()}/sitemap.xml\n`;
}

/** Structured data for a published product, using only verified fields. */
export function productStructuredData(productId: number): Record<string, unknown> | null {
  const p = get<{ slug: string; model_name: string; brand_name: string; sku: string; mpn: string; overview: string; price_amount: number | null; price_verified: number; price_source_url: string; category_name: string }>(
    `SELECT p.*, b.name AS brand_name, c.name_en AS category_name FROM products p
     JOIN brands b ON b.id = p.brand_id JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [productId]);
  if (!p) return null;
  const images = getMedia(productId).filter((m) => m.kind === 'image' && m.reviewStatus === 'approved' && m.permissionStatus === 'granted').map((m) => `${siteUrl()}${m.url}`);
  const stockRows = Number((get<{ n: number }>('SELECT COUNT(*) AS n FROM inventory_balances WHERE product_id = ?', [productId])?.n ?? 0));
  const available = Number((get<{ n: number }>('SELECT COALESCE(SUM(on_hand - reserved),0) AS n FROM inventory_balances WHERE product_id = ?', [productId])?.n ?? 0));
  // Only verified-purchase, approved reviews are used. There are none by default.
  const reviews = all<{ rating: number; body: string; author: string }>(
    `SELECT r.rating, r.body, u.name AS author FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.verified_purchase = 1 AND r.moderation_status = 'approved'`, [productId]);
  const data: SeoProduct = {
    name: p.model_name, brand: p.brand_name, sku: p.sku, mpn: p.mpn,
    description: p.overview || `Verified product page for ${p.model_name}.`,
    canonicalUrl: `${siteUrl()}/products/${p.slug}`, imageUrls: images,
    priceAmount: p.price_amount, priceVerified: !!p.price_verified, priceSourceUrl: p.price_source_url,
    currency: 'BDT', availabilityVerified: stockRows > 0, stockState: stockRows > 0 ? (available > 0 ? 'InStock' : 'OutOfStock') : null,
    verifiedReviews: reviews,
    breadcrumbs: [
      { name: 'Home', url: siteUrl() },
      { name: 'Products', url: `${siteUrl()}/products` },
      { name: p.category_name, url: `${siteUrl()}/categories/${p.category_name.toLowerCase().replace(/\s+/g, '-')}` },
      { name: p.model_name, url: `${siteUrl()}/products/${p.slug}` },
    ],
  };
  return buildProductStructuredData(data);
}

export function runSeoChecks(): { checked: number; failures: number } {
  const products = all<{ id: number; slug: string; status: string; title: string; description: string; canonical_path: string }>(
    `SELECT p.id, p.slug, p.status, COALESCE(s.title,'') AS title, COALESCE(s.meta_description,'') AS description,
      COALESCE(s.canonical_path,'') AS canonical_path FROM products p LEFT JOIN product_seo s ON s.product_id = p.id`);
  let checked = 0;
  let failures = 0;
  for (const p of products) {
    const result = validateMetadata({ title: p.title, description: p.description, canonicalPath: p.canonical_path });
    const status = result.valid ? 'pass' : 'fail';
    run('INSERT INTO seo_checks (entity_type, entity_id, check_name, status, detail, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['product', String(p.id), 'metadata_validation', status, result.blockers.join(' ') || 'Metadata valid', nowIso()]);
    checked++;
    if (!result.valid) failures++;
    const specCount = getSpecs(p.id).filter((s) => s.verified).length;
    run('INSERT INTO seo_checks (entity_type, entity_id, check_name, status, detail, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['product', String(p.id), 'structured_data_specs', specCount >= 5 ? 'pass' : 'warning', `${specCount} verified specifications`, nowIso()]);
  }
  const duplicates = findDuplicateContent(products.map((p) => ({ id: String(p.id), title: p.title, description: p.description })));
  for (const d of duplicates) {
    run('INSERT INTO seo_checks (entity_type, entity_id, check_name, status, detail, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['catalogue', '0', 'duplicate_content', 'fail', d, nowIso()]);
    failures++;
  }
  return { checked, failures };
}

/** Internal link integrity: verifies that referenced product/category paths exist. */
export function checkInternalLinks(): { checked: number; broken: string[] } {
  const products = all<{ slug: string }>('SELECT slug FROM products');
  const categories = all<{ slug: string }>('SELECT slug FROM categories');
  const known = new Set([...STATIC_PATHS, ...products.map((p) => `/products/${p.slug}`), ...categories.map((c) => `/categories/${c.slug}`)]);
  const referenced = all<{ canonical_path: string }>('SELECT canonical_path FROM product_seo');
  const broken: string[] = [];
  for (const r of referenced) {
    if (r.canonical_path && !known.has(r.canonical_path)) {
      broken.push(r.canonical_path);
      run('INSERT INTO broken_links (url, found_on_path, status_code, checked_at) VALUES (?, ?, ?, ?)', [r.canonical_path, 'product_seo', 404, nowIso()]);
    }
  }
  return { checked: referenced.length, broken };
}

export async function addRedirect(fromPath: string, toPath: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  if (!fromPath.startsWith('/') || !toPath.startsWith('/')) return { ok: false, error: 'Both paths must start with /.' };
  if (get('SELECT id FROM redirects WHERE from_path = ?', [fromPath])) return { ok: false, error: 'A redirect for this path already exists.' };
  run('INSERT INTO redirects (from_path, to_path, status_code, created_at) VALUES (?, ?, 301, ?)', [fromPath, toPath, nowIso()]);
  await recordAudit('seo.redirect_added', 'redirect', fromPath, { toPath }, userId);
  return { ok: true };
}

export function recentSeoChecks() {
  return all('SELECT * FROM seo_checks ORDER BY checked_at DESC LIMIT 100');
}
