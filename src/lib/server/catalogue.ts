/** Catalogue persistence + publication enforcement. */

import { all, get, run, nowIso, transaction, scalar } from './database';
import { recordAudit } from './auth';
import { productImportSchema, type ProductImport } from '../core/validation';
import { buildCategoryProgress, evaluateMedia, evaluatePublication, type CategoryProgress, type MediaRecord, type ProductDossier, type PublicationEvaluation } from '../core/catalogue-rules';
import { type SpecTemplate } from '../core/identity';

export type ProductRow = {
  id: number; slug: string; model_name: string; sku: string; mpn: string;
  brand_id: number; brand_name: string; category_id: number; category_name: string; category_slug: string;
  spec_template: SpecTemplate; status: string; is_demo: number; verification_status: string;
  source_name: string; source_url: string; price_amount: number | null; price_verified: number;
  price_source_name: string; price_source_url: string; minimum_selling_amount: number | null;
  overview: string; limitations: string; intended_use: string; included_accessories: string;
  warranty_months: number | null; warranty_source_url: string;
  publication_approved_at: string | null; publication_approved_by: number | null; updated_at: string;
  seo_title: string; seo_description: string; seo_canonical: string; seo_indexable: number; seo_reviewed_at: string | null;
  image_count: number;
};

const PRODUCT_SELECT = `SELECT p.*, b.name AS brand_name, c.name_en AS category_name, c.slug AS category_slug,
  c.spec_template AS spec_template,
  COALESCE(s.title,'') AS seo_title, COALESCE(s.meta_description,'') AS seo_description,
  COALESCE(s.canonical_path,'') AS seo_canonical, COALESCE(s.indexable,0) AS seo_indexable, s.reviewed_at AS seo_reviewed_at,
  (SELECT COUNT(*) FROM product_media m WHERE m.product_id = p.id AND m.kind = 'image' AND m.review_status = 'approved') AS image_count
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_seo s ON s.product_id = p.id`;

export function listProducts(opts: { status?: string; categorySlug?: string; brandSlug?: string; search?: string; includeDemo?: boolean; limit?: number } = {}): ProductRow[] {
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (!opts.includeDemo) where.push('p.is_demo = 0');
  if (opts.status) { where.push('p.status = ?'); params.push(opts.status); }
  if (opts.categorySlug) { where.push('c.slug = ?'); params.push(opts.categorySlug); }
  if (opts.brandSlug) { where.push('b.slug = ?'); params.push(opts.brandSlug); }
  if (opts.search) { where.push('(p.model_name LIKE ? OR p.sku LIKE ? OR b.name LIKE ?)'); const q = `%${opts.search}%`; params.push(q, q, q); }
  const sql = `${PRODUCT_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.updated_at DESC LIMIT ${Math.min(opts.limit ?? 200, 500)}`;
  return all<ProductRow>(sql, params);
}

export function getProductBySlug(slug: string): ProductRow | undefined {
  return get<ProductRow>(`${PRODUCT_SELECT} WHERE p.slug = ?`, [slug]);
}

export function getProductById(id: number): ProductRow | undefined {
  return get<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
}

export function getSpecs(productId: number) {
  return all<{ id: number; group_name: string; spec_key: string; spec_value: string; unit: string; verified: number; source_url: string; source_name: string }>(
    'SELECT * FROM product_specs WHERE product_id = ? ORDER BY group_name, spec_key', [productId]);
}

export function getMedia(productId: number): MediaRecord[] {
  const rows = all<Record<string, unknown>>('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order, id', [productId]);
  return rows.map((m) => ({
    id: Number(m.id),
    kind: m.kind as MediaRecord['kind'],
    url: String(m.url),
    width: m.width === null ? null : Number(m.width),
    height: m.height === null ? null : Number(m.height),
    altText: String(m.alt_text ?? ''),
    sourceUrl: String(m.source_url ?? ''),
    sourceName: String(m.source_name ?? ''),
    license: String(m.license ?? ''),
    permissionStatus: m.permission_status as MediaRecord['permissionStatus'],
    reviewStatus: m.review_status as MediaRecord['reviewStatus'],
    sequenceKey: String(m.sequence_key ?? ''),
    isPrimary: !!m.is_primary,
    sortOrder: Number(m.sort_order ?? 0),
  }));
}

export function getProductDossier(id: number): ProductDossier | null {
  const p = getProductById(id);
  if (!p) return null;
  const inventoryVerified = scalar('SELECT COUNT(*) AS n FROM inventory_balances WHERE product_id = ?', [id]) > 0;
  return {
    id: p.id,
    slug: p.slug,
    brandId: p.brand_id,
    modelName: p.model_name,
    sku: p.sku,
    mpn: p.mpn,
    status: p.status,
    isDemo: !!p.is_demo,
    verificationStatus: p.verification_status as ProductDossier['verificationStatus'],
    sourceUrl: p.source_url,
    sourceName: p.source_name,
    priceAmount: p.price_amount,
    priceVerified: !!p.price_verified,
    priceSourceUrl: p.price_source_url,
    priceSourceName: p.price_source_name,
    specs: getSpecs(p.id).map((s) => ({ specKey: s.spec_key, specValue: s.spec_value, verified: !!s.verified, sourceUrl: s.source_url })),
    media: getMedia(p.id),
    seo: { title: p.seo_title, metaDescription: p.seo_description, canonicalPath: p.seo_canonical, indexable: !!p.seo_indexable, reviewedAt: p.seo_reviewed_at },
    publicationApprovedAt: p.publication_approved_at,
    publicationApprovedBy: p.publication_approved_by,
    detailPageExists: !!p.slug,
    specTemplate: p.spec_template,
    inventoryVerified,
  };
}

export function evaluateProduct(id: number): PublicationEvaluation | null {
  const dossier = getProductDossier(id);
  return dossier ? evaluatePublication(dossier) : null;
}

/** Gate used by every publication path. Throws with the exact blockers when refused. */
export async function publishProduct(id: number, userId: number): Promise<{ ok: boolean; blockers: string[] }> {
  const evaluation = evaluateProduct(id);
  if (!evaluation) return { ok: false, blockers: ['Product not found.'] };
  if (!evaluation.allowed) {
    await recordAudit('catalogue.publish_blocked', 'product', id, { blockers: evaluation.blockers }, userId);
    return { ok: false, blockers: evaluation.blockers };
  }
  run("UPDATE products SET status = 'published', publication_approved_by = ?, publication_approved_at = ?, updated_at = ? WHERE id = ?",
    [userId, nowIso(), nowIso(), id]);
  run('INSERT INTO product_revisions (product_id, changed_by, change_json, created_at) VALUES (?, ?, ?, ?)',
    [id, userId, JSON.stringify({ status: 'published', checks: evaluation.checks.filter((c) => c.pass).length }), nowIso()]);
  await recordAudit('catalogue.published', 'product', id, { checks: evaluation.checks.length }, userId);
  return { ok: true, blockers: [] };
}

export async function unpublishProduct(id: number, userId: number): Promise<void> {
  run("UPDATE products SET status = 'draft', updated_at = ? WHERE id = ?", [nowIso(), id]);
  await recordAudit('catalogue.unpublished', 'product', id, {}, userId);
}

export function getCategoryProgress(): CategoryProgress[] {
  const categories = all<{ id: number; slug: string; name_en: string; group_name: string; is_active: number; min_models: number }>(
    'SELECT * FROM categories ORDER BY sort_order');
  const rows = all<{ category_id: number; brand_id: number; model_name: string; sku: string; is_demo: number; verification_status: string; status: string; media_complete: number }>(
    `SELECT p.category_id, p.brand_id, p.model_name, p.sku, p.is_demo, p.verification_status, p.status,
      CASE WHEN (SELECT COUNT(*) FROM product_media m WHERE m.product_id = p.id AND m.review_status = 'approved' AND m.permission_status = 'granted' AND m.kind = 'image') >= 3 THEN 1 ELSE 0 END AS media_complete
     FROM products p`);
  return categories.map((c) => buildCategoryProgress({
    id: c.id, slug: c.slug, name: c.name_en, group: c.group_name, active: !!c.is_active, minModels: c.min_models,
    products: rows.filter((r) => r.category_id === c.id).map((r) => ({
      brandId: r.brand_id, modelName: r.model_name, sku: r.sku, isDemo: !!r.is_demo,
      verificationStatus: r.verification_status, status: r.status,
      detailPageExists: true, mediaComplete: !!r.media_complete,
    })),
  }));
}

export async function setCategoryActive(id: number, active: boolean, userId: number): Promise<void> {
  run('UPDATE categories SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
  await recordAudit(active ? 'catalogue.category_activated' : 'catalogue.category_deactivated', 'category', id, { minModels: 15 }, userId);
}

export async function updateProductField(id: number, field: string, value: string | number | null, userId: number): Promise<void> {
  const allowed = new Set(['model_name', 'mpn', 'overview', 'limitations', 'intended_use', 'included_accessories', 'source_url', 'source_name', 'verification_status', 'status', 'minimum_selling_amount', 'warranty_months', 'warranty_source_url', 'price_amount', 'price_source_url', 'price_source_name']);
  if (!allowed.has(field)) throw new Error(`Field "${field}" is not editable through this action.`);
  const before = get<{ [key: string]: unknown }>('SELECT * FROM products WHERE id = ?', [id]);
  run(`UPDATE products SET ${field} = ?, updated_at = ? WHERE id = ?`, [value, nowIso(), id]);
  run('INSERT INTO product_revisions (product_id, changed_by, change_json, created_at) VALUES (?, ?, ?, ?)',
    [id, userId, JSON.stringify({ field, before: before?.[field] ?? null, after: value }), nowIso()]);
  await recordAudit('catalogue.product_updated', 'product', id, { field }, userId);
}

export async function setPrice(id: number, amount: number | null, sourceUrl: string, sourceName: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  if (amount !== null && (!Number.isInteger(amount) || amount <= 0)) return { ok: false, error: 'Price must be a positive integer in poysha.' };
  if (amount !== null && (!sourceUrl.trim() || !sourceName.trim())) return { ok: false, error: 'An authorized price source is required before a price can be displayed.' };
  const before = get<{ price_amount: number | null; minimum_selling_amount: number | null }>('SELECT price_amount, minimum_selling_amount FROM products WHERE id = ?', [id]);
  if (before?.minimum_selling_amount !== null && before?.minimum_selling_amount !== undefined && amount !== null && amount < before.minimum_selling_amount) {
    return { ok: false, error: 'Price is below the authorized minimum selling price.' };
  }
  transaction(() => {
    run('UPDATE products SET price_amount = ?, price_verified = ?, price_source_url = ?, price_source_name = ?, updated_at = ? WHERE id = ?',
      [amount, amount !== null ? 1 : 0, sourceUrl, sourceName, nowIso(), id]);
    run('INSERT INTO price_change_logs (product_id, old_amount, new_amount, reason, approved_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, before?.price_amount ?? null, amount, 'Authorized price source recorded', userId, nowIso()]);
  });
  await recordAudit('pricing.changed', 'product', id, { amount, sourceName }, userId);
  return { ok: true };
}

export async function upsertSpec(productId: number, input: { specKey: string; specValue: string; unit?: string; groupName?: string; verified: boolean; sourceUrl: string; sourceName: string }, userId: number): Promise<{ ok: boolean; error?: string }> {
  if (input.verified && !input.sourceUrl.trim()) return { ok: false, error: 'A verified specification needs a source URL.' };
  const existing = get<{ id: number }>('SELECT id FROM product_specs WHERE product_id = ? AND spec_key = ?', [productId, input.specKey]);
  if (existing) {
    run('UPDATE product_specs SET spec_value = ?, unit = ?, group_name = ?, verified = ?, source_url = ?, source_name = ?, verified_by = ?, verified_at = ? WHERE id = ?',
      [input.specValue, input.unit ?? '', input.groupName ?? 'General', input.verified ? 1 : 0, input.sourceUrl, input.sourceName, input.verified ? userId : null, input.verified ? nowIso() : null, existing.id]);
  } else {
    run('INSERT INTO product_specs (product_id, group_name, spec_key, spec_value, unit, verified, source_url, source_name, verified_by, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, input.groupName ?? 'General', input.specKey, input.specValue, input.unit ?? '', input.verified ? 1 : 0, input.sourceUrl, input.sourceName, input.verified ? userId : null, input.verified ? nowIso() : null]);
  }
  run('UPDATE products SET updated_at = ? WHERE id = ?', [nowIso(), productId]);
  await recordAudit('catalogue.spec_upserted', 'product', productId, { specKey: input.specKey, verified: input.verified }, userId);
  return { ok: true };
}

export async function importProducts(records: unknown[], userId: number): Promise<{ imported: number; rejected: Array<{ index: number; reason: string }>; duplicates: string[] }> {
  const rejected: Array<{ index: number; reason: string }> = [];
  const duplicates: string[] = [];
  let imported = 0;
  const valid: ProductImport[] = [];
  records.forEach((raw, index) => {
    const parsed = productImportSchema.safeParse(raw);
    if (!parsed.success) { rejected.push({ index, reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }); return; }
    if (get('SELECT id FROM products WHERE sku = ?', [parsed.data.sku]) || get('SELECT id FROM products WHERE brand_id = (SELECT id FROM brands WHERE slug = ?) AND model_name = ?', [parsed.data.brandSlug, parsed.data.modelName])) {
      duplicates.push(parsed.data.sku);
      return;
    }
    valid.push(parsed.data);
  });
  transaction(() => {
    for (const item of valid) {
      const brand = get<{ id: number }>('SELECT id FROM brands WHERE slug = ?', [item.brandSlug]);
      const category = get<{ id: number }>('SELECT id FROM categories WHERE slug = ?', [item.categorySlug]);
      if (!brand || !category) continue;
      const result = run(`INSERT INTO products (slug, brand_id, category_id, model_name, sku, mpn, status, is_demo, verification_status, source_url, source_name,
        price_amount, price_verified, price_source_url, price_source_name, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.slug, brand.id, category.id, item.modelName, item.sku, item.mpn, item.isDemo ? 1 : 0, item.verificationStatus,
          item.sourceUrl, item.sourceName, item.priceAmount, item.priceAmount !== null && !!item.priceSourceUrl ? 1 : 0,
          item.priceSourceUrl, '', userId, nowIso(), nowIso()]);
      const id = Number(result.lastInsertRowid);
      run('INSERT INTO product_seo (product_id, canonical_path, indexable) VALUES (?, ?, 0)', [id, `/products/${item.slug}`]);
      const specStmt = 'INSERT INTO product_specs (product_id, group_name, spec_key, spec_value, unit, verified, source_url, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      for (const spec of item.specs) {
        run(specStmt, [id, 'General', spec.specKey, spec.specValue, spec.unit, spec.verified ? 1 : 0, spec.sourceUrl, spec.verified ? nowIso() : null]);
      }
      imported++;
    }
  });
  await recordAudit('catalogue.bulk_import', 'catalogue', 0, { imported, rejected: rejected.length, duplicates: duplicates.length }, userId);
  return { imported, rejected, duplicates };
}

export function mediaCompletenessFor(productId: number) {
  return evaluateMedia(getMedia(productId));
}
