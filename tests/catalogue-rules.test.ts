import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countDistinctVerifiedModels, evaluateMedia, evaluatePublication, buildCategoryProgress, catalogueIsComplete,
  type MediaRecord, type ProductDossier,
} from '../src/lib/core/catalogue-rules';

const image = (n: number, overrides: Partial<MediaRecord> = {}): MediaRecord => ({
  id: n, kind: 'image', url: `/media/${n}.jpg`, width: 1600, height: 1600, altText: `Angle ${n}`,
  sourceUrl: 'https://manufacturer.example/media', sourceName: 'Manufacturer', license: 'Authorized reseller use',
  permissionStatus: 'granted', reviewStatus: 'approved', sequenceKey: '', isPrimary: n === 1, sortOrder: n,
  ...overrides,
});

const video = (n: number): MediaRecord => ({ ...image(n), kind: 'video', url: `/media/${n}.mp4`, width: 1920, height: 1080 });

function dossier(overrides: Partial<ProductDossier> = {}): ProductDossier {
  const template = ['General', 'Model', 'Category-specific attributes', 'Compatibility', 'Included accessories', 'Warranty'];
  return {
    id: 1, slug: 'test-model', brandId: 1, modelName: 'Test Model', sku: 'SKU-1', mpn: 'MPN-1', status: 'draft',
    isDemo: false, verificationStatus: 'verified', sourceUrl: 'https://manufacturer.example/spec', sourceName: 'Manufacturer',
    priceAmount: null, priceVerified: false, priceSourceUrl: '', priceSourceName: '',
    specs: template.map((k) => ({ specKey: k, specValue: 'verified value', verified: true, sourceUrl: 'https://manufacturer.example/spec' })),
    media: [image(1), image(2), image(3), video(4)],
    seo: { title: 'Test Model — verified specifications | The Dreamer IT Express', metaDescription: 'A verified product description with enough detail to be useful and unique for search engines.', canonicalPath: '/products/test-model', indexable: true, reviewedAt: '2026-11-02T00:00:00Z' },
    publicationApprovedAt: '2026-11-02T00:00:00Z', publicationApprovedBy: 1, detailPageExists: true,
    specTemplate: 'generic', inventoryVerified: true,
    ...overrides,
  };
}

test('15 distinct verified models are required; demo, duplicate SKUs and variants do not count', () => {
  const models = Array.from({ length: 15 }, (_, i) => ({ brandId: 1, modelName: `Model ${i}`, sku: `SKU-${i}`, isDemo: false, verificationStatus: 'verified', status: 'published' }));
  assert.equal(countDistinctVerifiedModels(models), 15);
  assert.equal(countDistinctVerifiedModels(models.slice(0, 14)), 14);
  // Duplicate SKU with a different model name is still one real product.
  assert.equal(countDistinctVerifiedModels([...models, { ...models[0], modelName: 'Colour variant', sku: 'SKU-0' }]), 15);
  // Demo and unverified records never count.
  assert.equal(countDistinctVerifiedModels([...models.map((m) => ({ ...m, isDemo: true }))]), 0);
  assert.equal(countDistinctVerifiedModels([...models.map((m) => ({ ...m, verificationStatus: 'unverified' }))]), 0);
  // Case/whitespace variants of the same model name are duplicates.
  assert.equal(countDistinctVerifiedModels([{ brandId: 1, modelName: 'ThinkPad X1', sku: 'A', isDemo: false, verificationStatus: 'verified', status: 'published' }, { brandId: 1, modelName: 'thinkpad  x1', sku: 'B', isDemo: false, verificationStatus: 'verified', status: 'published' }]), 1);
});

test('static photographs are not reported as a 3D model or a 360 sequence', () => {
  const photos = evaluateMedia([image(1), image(2), image(3)]);
  assert.equal(photos.tier, 'photos');
  assert.equal(photos.has3d, false);
  assert.equal(photos.has360, false);
  assert.match(photos.label, /no suitable product video/i);
  const withVideo = evaluateMedia([image(1), image(2), image(3), video(4)]);
  assert.equal(withVideo.tier, 'photos_video');
  const withModel = evaluateMedia([image(1), image(2), image(3), { ...image(9), kind: 'model_3d', url: '/media/model.glb' }]);
  assert.equal(withModel.tier, 'model_3d');
  assert.equal(withModel.has3d, true);
});

test('a 360 sequence requires at least eight ordered, approved, licensed frames', () => {
  const frames = Array.from({ length: 8 }, (_, i) => ({ ...image(100 + i), kind: 'spin_frame' as const, sequenceKey: 'spin-a', sortOrder: i }));
  const result = evaluateMedia([image(1), image(2), image(3), ...frames]);
  assert.equal(result.has360, true);
  assert.equal(result.tier, 'spin_360');
  const unordered = frames.map((f) => ({ ...f, sortOrder: 0 }));
  assert.equal(evaluateMedia([image(1), image(2), image(3), ...unordered]).has360, false);
  const unlicensed = frames.map((f, i) => ({ ...f, permissionStatus: i === 0 ? 'unknown' as const : f.permissionStatus }));
  assert.equal(evaluateMedia([image(1), image(2), image(3), ...unlicensed]).has360, false);
});

test('publication gate blocks incomplete dossiers and allows a fully verified one', () => {
  const complete = evaluatePublication(dossier());
  assert.equal(complete.allowed, true, `unexpected blockers: ${complete.blockers.join(', ')}`);
  const demo = evaluatePublication(dossier({ isDemo: true }));
  assert.equal(demo.allowed, false);
  assert.ok(demo.blockers.some((b) => /demonstration/i.test(b)));
  const noMedia = evaluatePublication(dossier({ media: [] }));
  assert.equal(noMedia.allowed, false);
  assert.ok(noMedia.blockers.some((b) => /media|photograph/i.test(b)));
  const fakePrice = evaluatePublication(dossier({ priceAmount: 12500000, priceVerified: false }));
  assert.equal(fakePrice.allowed, false);
  assert.ok(fakePrice.blockers.some((b) => /Price verified/i.test(b)));
  const noApproval = evaluatePublication(dossier({ publicationApprovedAt: null, publicationApprovedBy: null }));
  assert.equal(noApproval.allowed, false);
  const noInventory = evaluatePublication(dossier({ inventoryVerified: false }));
  assert.equal(noInventory.allowed, false);
  const unverifiedSpecs = evaluatePublication(dossier({ specs: [] }));
  assert.equal(unverifiedSpecs.allowed, false);
});

test('category progress reports the exact shortfall and never marks an incomplete active category complete', () => {
  const products = Array.from({ length: 6 }, (_, i) => ({ brandId: 1, modelName: `Model ${i}`, sku: `S-${i}`, isDemo: false, verificationStatus: 'verified', status: 'published', detailPageExists: true, mediaComplete: true }));
  const progress = buildCategoryProgress({ id: 1, slug: 'business-laptops', name: 'Business laptops', group: 'Computers', active: true, products });
  assert.equal(progress.distinctVerifiedModels, 6);
  assert.equal(progress.missingModels, 9);
  assert.equal(progress.complete, false);
  assert.equal(catalogueIsComplete([progress]), false);
  const full = buildCategoryProgress({ id: 1, slug: 'business-laptops', name: 'Business laptops', group: 'Computers', active: true, products: Array.from({ length: 15 }, (_, i) => ({ ...products[0], modelName: `Model ${i}`, sku: `S-${i}` })) });
  assert.equal(full.missingModels, 0);
  assert.equal(full.complete, true);
  // A single published product without media keeps the category incomplete.
  const badMedia = buildCategoryProgress({ id: 1, slug: 'x', name: 'X', group: 'G', active: true, products: Array.from({ length: 15 }, (_, i) => ({ ...products[0], modelName: `Model ${i}`, sku: `S-${i}`, mediaComplete: i > 0 })) });
  assert.equal(badMedia.complete, false);
  // An empty set of activated categories is not a "complete catalogue".
  assert.equal(catalogueIsComplete([]), false);
});
