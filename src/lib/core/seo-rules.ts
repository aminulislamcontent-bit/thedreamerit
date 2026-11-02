/** SEO automation: structured data must match the actual page. No fabricated facts. */

export type SeoProduct = {
  name: string;
  brand: string;
  sku: string;
  mpn: string;
  description: string;
  canonicalUrl: string;
  imageUrls: string[];
  priceAmount: number | null; // poysha
  priceVerified: boolean;
  priceSourceUrl: string;
  currency: string;
  availabilityVerified: boolean;
  stockState: 'InStock' | 'OutOfStock' | null;
  verifiedReviews: Array<{ rating: number; body: string; author: string }>;
  breadcrumbs: Array<{ name: string; url: string }>;
};

export function validateMetadata(input: { title: string; description: string; canonicalPath: string }): { valid: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (input.title.trim().length < 10 || input.title.length > 70) blockers.push('Title must be 10–70 characters.');
  if (input.description.trim().length < 50 || input.description.length > 165) blockers.push('Meta description must be 50–165 characters.');
  if (!/^\/[a-z0-9/_-]+$/.test(input.canonicalPath)) blockers.push('Canonical path must be a lowercase, relative, search-friendly URL.');
  return { valid: blockers.length === 0, blockers };
}

/** Product + Breadcrumb structured data. Omits price, availability and ratings unless verified. */
export function buildProductStructuredData(p: SeoProduct): Record<string, unknown> {
  const product: Record<string, unknown> = {
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.description,
    url: p.canonicalUrl,
    brand: { '@type': 'Brand', name: p.brand },
  };
  if (p.mpn) product.mpn = p.mpn;
  if (p.imageUrls.length) product.image = p.imageUrls;
  if (p.priceAmount !== null && p.priceVerified && p.priceSourceUrl) {
    product.offers = {
      '@type': 'Offer',
      priceCurrency: p.currency,
      price: (p.priceAmount / 100).toFixed(2),
      url: p.canonicalUrl,
      priceSpecification: { '@type': 'UnitPriceSpecification', priceSource: p.priceSourceUrl },
    };
    if (p.availabilityVerified && p.stockState) {
      (product.offers as Record<string, unknown>).availability = `https://schema.org/${p.stockState}`;
    }
  }
  // aggregateRating is deliberately omitted: no verified reviews exist by default.
  if (p.verifiedReviews.length > 0) {
    const ratings = p.verifiedReviews.map((r) => r.rating);
    product.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
      reviewCount: ratings.length,
    };
    product.review = p.verifiedReviews.map((r) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: r.rating }, author: { '@type': 'Person', name: r.author }, reviewBody: r.body }));
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      product,
      {
        '@type': 'BreadcrumbList',
        itemListElement: p.breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
      },
    ],
  };
}

export function buildSitemapEntries(products: Array<{ canonicalPath: string; updatedAt: string; published: boolean; indexable: boolean }>, staticPaths: string[], baseUrl: string) {
  const paths = staticPaths.map((path) => ({ loc: `${baseUrl}${path}`, lastmod: undefined as string | undefined, published: true }));
  const productPaths = products
    .filter((p) => p.published && p.indexable)
    .map((p) => ({ loc: `${baseUrl}${p.canonicalPath}`, lastmod: p.updatedAt.slice(0, 10), published: true }));
  return [...paths, ...productPaths];
}

export function renderSitemap(entries: Array<{ loc: string; lastmod?: string }>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((e) => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);
}

export function findDuplicateContent(items: Array<{ id: string; title: string; description: string }>): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const item of items) {
    const key = `${item.title.trim().toLowerCase()}|${item.description.trim().toLowerCase()}`;
    if (seen.has(key)) duplicates.push(`${item.id} duplicates ${seen.get(key)}`);
    else seen.set(key, item.id);
  }
  return duplicates;
}
