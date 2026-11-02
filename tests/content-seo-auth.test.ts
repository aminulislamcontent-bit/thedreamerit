import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDraft, assertNoFabrication, type VerifiedProductBundle } from '../src/lib/core/content-rules';
import { buildProductStructuredData, buildSitemapEntries, findDuplicateContent, validateMetadata, type SeoProduct } from '../src/lib/core/seo-rules';
import { hashPassword, verifyPassword } from '../src/lib/core/password';
import { generateTotpSecret, totpCode, verifyTotp, totpProvisioningUri } from '../src/lib/core/totp';
import { validateUpload, canPublishExternalMedia } from '../src/lib/core/media-rules';
import { CATEGORIES, BUSINESS } from '../src/lib/core/identity';

const bundle: VerifiedProductBundle = {
  productName: 'Example Laptop 14', brand: 'Example', model: 'Example Laptop 14', sku: 'EX-14', mpn: 'EX14-001',
  category: 'Business laptops', overview: 'A business laptop record.',
  verifiedSpecs: [{ key: 'Processor and generation', value: 'Example CPU', sourceUrl: 'https://manufacturer.example/spec' }],
  priceBdt: null, availability: null, warranty: null, mediaTier: 'Multi-angle photographs — no suitable product video available',
};

const seoProduct = (overrides: Partial<SeoProduct> = {}): SeoProduct => ({
  name: 'Example Laptop 14', brand: 'Example', sku: 'EX-14', mpn: 'EX14-001', description: 'Verified specs',
  canonicalUrl: 'https://example.test/products/ex-14', imageUrls: ['https://example.test/a.jpg'],
  priceAmount: null, priceVerified: false, priceSourceUrl: '', currency: 'BDT',
  availabilityVerified: false, stockState: null, verifiedReviews: [],
  breadcrumbs: [{ name: 'Home', url: 'https://example.test' }],
  ...overrides,
});

test('content drafts never fabricate price, stock, reviews, certifications or specs', () => {
  const draft = generateDraft('description', 'bn', bundle);
  assert.match(draft.body, /যাচাই করা হয়নি|প্রদর্শন করা হয়নি/);
  assert.equal(assertNoFabrication(draft.body, bundle).allowed, true);
  assert.equal(draft.requiresHumanReview, true);
  assert.ok(draft.missingClaims.includes('price'));
  assert.ok(draft.missingClaims.includes('availability'));

  const fabrications = [
    'Only ৳ 45,000 today!',
    'In stock now at our branch',
    'Rated 4.9 / 5 stars by verified buyers',
    'Certified by the manufacturer as award-winning',
    'Comes with 32GB RAM and a 1TB SSD',
  ];
  for (const body of fabrications) {
    const check = assertNoFabrication(`${draft.body}\n${body}`, bundle);
    assert.equal(check.allowed, false, `should block: ${body}`);
    assert.ok(check.violations.length > 0);
  }
  const withPrice = generateDraft('faq', 'en', { ...bundle, priceBdt: 'BDT 45,000.00 (Authorized distributor)' });
  assert.match(withPrice.body, /BDT 45,000.00/);
  assert.equal(assertNoFabrication(withPrice.body, { ...bundle, priceBdt: 'BDT 45,000.00 (Authorized distributor)' }).allowed, true);
});

test('structured data omits price, availability and aggregateRating unless verified', () => {
  const bare = buildProductStructuredData(seoProduct());
  const product = (bare['@graph'] as Array<Record<string, unknown>>)[0];
  assert.equal(product.offers, undefined);
  assert.equal(product.aggregateRating, undefined);
  const priced = buildProductStructuredData(seoProduct({ priceAmount: 4500000, priceVerified: true, priceSourceUrl: 'https://distributor.example/price', availabilityVerified: true, stockState: 'InStock' }));
  const offer = ((priced['@graph'] as Array<Record<string, unknown>>)[0].offers) as Record<string, unknown>;
  assert.equal(offer.price, '45000.00');
  assert.equal(offer.availability, 'https://schema.org/InStock');
  const unrated = buildProductStructuredData(seoProduct({ priceAmount: 4500000, priceVerified: false }));
  assert.equal((unrated['@graph'] as Array<Record<string, unknown>>)[0].offers, undefined);
  const rated = buildProductStructuredData(seoProduct({ verifiedReviews: [{ rating: 5, body: 'Real', author: 'Buyer' }] }));
  assert.ok((rated['@graph'] as Array<Record<string, unknown>>)[0].aggregateRating);
});

test('sitemap includes only published, indexable pages; metadata and duplicates are validated', () => {
  const entries = buildSitemapEntries([
    { canonicalPath: '/products/live', updatedAt: '2026-11-02T00:00:00Z', published: true, indexable: true },
    { canonicalPath: '/products/draft', updatedAt: '2026-11-02T00:00:00Z', published: false, indexable: true },
    { canonicalPath: '/products/noindex', updatedAt: '2026-11-02T00:00:00Z', published: true, indexable: false },
  ], ['/', '/products'], 'https://example.test');
  assert.equal(entries.length, 3);
  assert.ok(entries.some((e) => e.loc.endsWith('/products/live')));
  assert.ok(!entries.some((e) => e.loc.includes('draft') || e.loc.includes('noindex')));
  assert.equal(validateMetadata({ title: 'Short', description: 'Too short', canonicalPath: '/Bad Path' }).valid, false);
  assert.equal(findDuplicateContent([{ id: '1', title: 'Same', description: 'Same' }, { id: '2', title: 'same', description: 'same' }]).length, 1);
});

test('password hashing uses a salted scrypt digest; TOTP matches RFC-style rolling windows', () => {
  const { hash, salt } = hashPassword('Correct Horse Battery Staple');
  assert.equal(verifyPassword('Correct Horse Battery Staple', hash, salt), true);
  assert.equal(verifyPassword('wrong', hash, salt), false);
  assert.notEqual(hash, 'Correct Horse Battery Staple');
  const secret = generateTotpSecret();
  const t = 1_700_000_000;
  const code = totpCode(secret, t);
  assert.match(code, /^\d{6}$/);
  assert.equal(verifyTotp(secret, code, t), true);
  assert.equal(verifyTotp(secret, code, t + 35), true);
  assert.equal(verifyTotp(secret, code, t + 300), false);
  assert.equal(verifyTotp(secret, '000000', t), code === '000000');
  assert.match(totpProvisioningUri(secret, 'admin@example.test'), /^otpauth:\/\/totp\//);
});

test('uploads are type/size checked; external media needs recorded permission', () => {
  assert.equal(validateUpload({ kind: 'image', mimeType: 'image/jpeg', sizeBytes: 1024, fileName: 'front.jpg' }).allowed, true);
  assert.equal(validateUpload({ kind: 'image', mimeType: 'application/x-msdownload', sizeBytes: 1024, fileName: 'virus.exe' }).allowed, false);
  assert.equal(validateUpload({ kind: 'model_3d', mimeType: 'model/gltf-binary', sizeBytes: 1024, fileName: 'model.glb' }).allowed, true);
  assert.equal(validateUpload({ kind: 'model_3d', mimeType: 'model/gltf-binary', sizeBytes: 1024, fileName: 'model.obj' }).allowed, false);
  assert.equal(validateUpload({ kind: 'image', mimeType: 'image/jpeg', sizeBytes: 99 * 1024 * 1024, fileName: 'huge.jpg' }).allowed, false);
  assert.equal(canPublishExternalMedia({ sourceUrl: 'https://x/y.jpg', permissionStatus: 'unknown', reviewStatus: 'approved' }), false);
  assert.equal(canPublishExternalMedia({ sourceUrl: 'https://x/y.jpg', permissionStatus: 'granted', reviewStatus: 'approved' }), true);
});

test('the full proposed taxonomy is present and domain claims are not asserted', () => {
  assert.equal(CATEGORIES.length, 105);
  assert.equal(new Set(CATEGORIES.map((c) => c.name)).size, 105);
  assert.equal(BUSINESS.currency, 'BDT');
  assert.equal(BUSINESS.timezone, 'Asia/Dhaka');
  assert.match(BUSINESS.domainVerification.registrationStatus, /not_registered/);
});
