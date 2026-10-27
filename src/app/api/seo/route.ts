// SEO API
// GET /api/seo - SEO dashboard data (issues, sitemap, etc.)
// POST /api/seo/sitemap - generate sitemap
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'seo.view' as any)) return forbidden();

  // Gather SEO issues from real data
  const [
    totalProducts,
    publishedProducts,
    productsMissingMeta,
    productsMissingDescription,
    productsMissingImages,
    productsMissingAltText,
    productsMissingStructuredData,
    duplicateSlugs,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: 'PUBLISHED' } }),
    db.product.count({ where: { status: 'PUBLISHED', OR: [{ metaTitle: null }, { metaDescription: null }] } }),
    db.product.count({ where: { status: 'PUBLISHED', fullDescription: null } }),
    db.product.count({
      where: { status: 'PUBLISHED', images: { none: {} } },
    }),
    db.product.count({
      where: {
        status: 'PUBLISHED',
        images: { some: { altText: null } },
      },
    }),
    db.product.count({
      where: {
        status: 'PUBLISHED',
        OR: [{ brandId: null }, { shortDescription: null }],
      },
    }),
    db.product.groupBy({
      by: ['slug'],
      where: { status: 'PUBLISHED' },
      _count: true,
      having: { _count: { gt: 1 } },
    }),
  ]);

  const issues = [
    { code: 'MISSING_META', severity: 'HIGH', count: productsMissingMeta, recommendation: 'Add meta title and description to published products' },
    { code: 'MISSING_DESCRIPTION', severity: 'HIGH', count: productsMissingDescription, recommendation: 'Add full product descriptions (use AI Content Studio)' },
    { code: 'MISSING_IMAGES', severity: 'CRITICAL', count: productsMissingImages, recommendation: 'Add at least one product image' },
    { code: 'MISSING_ALT_TEXT', severity: 'MEDIUM', count: productsMissingAltText, recommendation: 'Add descriptive alt text to all product images' },
    { code: 'MISSING_STRUCTURED_DATA', severity: 'MEDIUM', count: productsMissingStructuredData, recommendation: 'Add brand and short description for proper structured data' },
    { code: 'DUPLICATE_SLUGS', severity: 'CRITICAL', count: duplicateSlugs.length, recommendation: 'Fix duplicate URL slugs' },
  ];

  return ok({
    summary: {
      totalProducts,
      publishedProducts,
      issuesCount: issues.reduce((s, i) => s + i.count, 0),
      healthScore: Math.max(0, 100 - (issues.reduce((s, i) => s + (i.severity === 'CRITICAL' ? i.count * 5 : i.count * 2), 0))),
    },
    issues,
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'seo.manage' as any)) return forbidden();

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'sitemap') {
    // Generate XML sitemap from published products
    const products = await db.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    const brands = await db.brand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://thedreamerit.com';
    const urls: string[] = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ];

    for (const p of products) {
      urls.push(`<url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
    for (const c of categories) {
      urls.push(`<url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    }
    for (const b of brands) {
      urls.push(`<url><loc>${baseUrl}/brand/${b.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return ok({ sitemap, urlCount: urls.length });
  }

  return ok({ success: true });
});
