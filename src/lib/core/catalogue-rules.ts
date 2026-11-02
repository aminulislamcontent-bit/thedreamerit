/**
 * Catalogue integrity rules. Pure functions — no database or framework imports — so
 * they can be unit tested and reused by API routes, server actions and CLI scripts.
 *
 * The overriding rule: a product may only be published when its own dossier is
 * complete and verified. Demo, fabricated, duplicate or unverified records never
 * satisfy the 15-model minimum.
 */

import { MIN_MODELS_PER_CATEGORY, type SpecTemplate, SPEC_TEMPLATES } from './identity';

export type ProductDossier = {
  id: number;
  slug: string;
  brandId: number;
  modelName: string;
  sku: string;
  mpn: string;
  status: string;
  isDemo: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  sourceUrl: string;
  sourceName: string;
  priceAmount: number | null;
  priceVerified: boolean;
  priceSourceUrl: string;
  priceSourceName: string;
  specs: { specKey: string; specValue: string; verified: boolean; sourceUrl: string }[];
  media: MediaRecord[];
  seo: { title: string; metaDescription: string; canonicalPath: string; indexable: boolean; reviewedAt: string | null } | null;
  publicationApprovedAt: string | null;
  publicationApprovedBy: number | null;
  detailPageExists: boolean;
  specTemplate: SpecTemplate;
  inventoryVerified: boolean;
};

export type MediaRecord = {
  id: number;
  kind: 'image' | 'video' | 'model_3d' | 'spin_frame' | 'document';
  url: string;
  width: number | null;
  height: number | null;
  altText: string;
  sourceUrl: string;
  sourceName: string;
  license: string;
  permissionStatus: 'unknown' | 'pending' | 'granted' | 'denied';
  reviewStatus: 'pending' | 'approved' | 'rejected';
  sequenceKey: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type CheckResult = { name: string; pass: boolean; detail: string };
export type PublicationEvaluation = { allowed: boolean; blockers: string[]; checks: CheckResult[] };

export function normalizeModelKey(brandId: number, modelName: string): string {
  return `${brandId}:${modelName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')}`;
}

/** Distinct verified real models. Variants and duplicate SKUs never add to the count. */
export function countDistinctVerifiedModels(products: Array<{
  brandId: number; modelName: string; sku: string; isDemo: boolean;
  verificationStatus: string; status: string;
}>): number {
  const seen = new Set<string>();
  const skus = new Set<string>();
  for (const p of products) {
    if (p.isDemo) continue;
    if (p.verificationStatus !== 'verified') continue;
    if (p.status === 'archived') continue;
    const sku = p.sku.trim().toLowerCase();
    if (!sku || skus.has(sku)) continue;
    skus.add(sku);
    seen.add(normalizeModelKey(p.brandId, p.modelName));
  }
  return seen.size;
}

export type MediaTier = 'model_3d' | 'spin_360' | 'photos_video' | 'photos' | 'none';

export const MEDIA_TIER_LABEL: Record<MediaTier, string> = {
  model_3d: 'Verified product-specific 3D model',
  spin_360: 'Verified 360° photographic sequence',
  photos_video: 'Multi-angle photographs and product video',
  photos: 'Multi-angle photographs (no suitable product video available)',
  none: 'No approved media — publication blocked',
};

/**
 * Media priority from the specification: 3D > 360° > photos+video > photos.
 * A static gallery is never reported as an interactive 3D model or 360° sequence.
 */
export function evaluateMedia(media: MediaRecord[]): {
  tier: MediaTier;
  label: string;
  satisfiesMinimum: boolean;
  imageCount: number;
  minResolutionMet: boolean;
  has3d: boolean;
  has360: boolean;
  hasVideo: boolean;
  spinFrameCount: number;
  blockers: string[];
} {
  const approved = (m: MediaRecord) => m.reviewStatus === 'approved' && m.permissionStatus === 'granted';
  const usable = media.filter(approved);
  const images = usable.filter((m) => m.kind === 'image');
  const videos = usable.filter((m) => m.kind === 'video');
  const models = usable.filter((m) => m.kind === 'model_3d');
  const framesBySequence = new Map<string, MediaRecord[]>();
  for (const frame of usable.filter((m) => m.kind === 'spin_frame')) {
    const key = frame.sequenceKey || 'default';
    framesBySequence.set(key, [...(framesBySequence.get(key) ?? []), frame]);
  }
  const spinFrameCount = Math.max(0, ...[...framesBySequence.values()].map((f) => f.length));
  // A genuine 360° sequence needs a consistent, ordered set of angles.
  const has360 = spinFrameCount >= 8 && [...framesBySequence.values()].some((frames) => {
    const orders = frames.map((f) => f.sortOrder);
    return new Set(orders).size === orders.length;
  });
  const has3d = models.length > 0;
  const hasVideo = videos.length > 0;
  const minResolutionMet = images.some((i) => (i.width ?? 0) >= 1000 && (i.height ?? 0) >= 1000);
  const imageCount = images.length;
  const blockers: string[] = [];

  let tier: MediaTier = 'none';
  if (has3d) tier = 'model_3d';
  else if (has360) tier = 'spin_360';
  else if (imageCount >= 3 && hasVideo) tier = 'photos_video';
  else if (imageCount >= 3) tier = 'photos';

  if (!has3d && !has360 && imageCount < 3) blockers.push('At least three approved, licensed multi-angle product photographs are required when no 3D model or 360° sequence exists.');
  if (images.some((i) => !i.altText.trim())) blockers.push('Every product image needs descriptive alt text.');
  if (usable.some((m) => !m.sourceUrl.trim())) blockers.push('Every media item must record its source.');
  if (!minResolutionMet && imageCount > 0) blockers.push('At least one image must be high-resolution (1000px or more on both axes) from an authorized source.');

  return {
    tier,
    label: MEDIA_TIER_LABEL[tier],
    satisfiesMinimum: tier !== 'none' && blockers.length === 0,
    imageCount,
    minResolutionMet,
    has3d,
    has360,
    hasVideo,
    spinFrameCount,
    blockers,
  };
}

export function evaluateSpecifications(dossier: ProductDossier): CheckResult[] {
  const required = SPEC_TEMPLATES[dossier.specTemplate];
  const verified = dossier.specs.filter((s) => s.verified && s.sourceUrl.trim() && s.specValue.trim());
  return [
    {
      name: 'Category-appropriate verified specifications',
      pass: verified.length >= Math.min(5, required.length),
      detail: `${verified.length} verified sourced specifications; template "${dossier.specTemplate}" lists ${required.length} expected fields.`,
    },
    ...required.map((field) => ({
      name: `Spec: ${field}`,
      pass: verified.some((s) => s.specKey === field),
      detail: verified.some((s) => s.specKey === field) ? 'Verified with source' : 'Missing or unverified',
    })),
  ];
}

/** Publication gate. Every published product must pass every check. */
export function evaluatePublication(d: ProductDossier): PublicationEvaluation {
  const media = evaluateMedia(d.media);
  const specChecks = evaluateSpecifications(d);
  const checks: CheckResult[] = [
    { name: 'Not demonstration data', pass: !d.isDemo, detail: d.isDemo ? 'Demonstration records are excluded from the live catalogue.' : 'Live record' },
    { name: 'Model verified against an authorized source', pass: d.verificationStatus === 'verified' && !!d.sourceUrl && !!d.sourceName, detail: `verification=${d.verificationStatus}; source=${d.sourceName || 'none'}` },
    { name: 'SKU and manufacturer part number present', pass: !!d.sku.trim() && !!d.mpn.trim(), detail: `SKU=${d.sku}; MPN=${d.mpn || 'missing'}` },
    { name: 'Individual detail page exists', pass: d.detailPageExists, detail: d.detailPageExists ? 'Route /products/[slug] resolves to this product' : 'Missing individual page' },
    { name: 'Required media approved and licensed', pass: media.satisfiesMinimum, detail: `${media.label}. ${media.blockers.join(' ') || 'No media blockers.'}` },
    { name: 'Technical specifications verified', pass: specChecks.every((c) => c.pass), detail: `${specChecks.filter((c) => c.pass).length}/${specChecks.length} specification checks passed` },
    { name: 'Price verified or price intentionally hidden', pass: d.priceAmount === null || (d.priceVerified && !!d.priceSourceUrl && !!d.priceSourceName), detail: d.priceAmount === null ? 'No price displayed' : `priceVerified=${d.priceVerified}; source=${d.priceSourceName || 'none'}` },
    { name: 'Availability based on real inventory', pass: d.inventoryVerified, detail: d.inventoryVerified ? 'Inventory record verified' : 'No verified inventory record — availability must not be claimed' },
    { name: 'SEO fields reviewed', pass: !!d.seo && !!d.seo.title.trim() && !!d.seo.metaDescription.trim() && !!d.seo.canonicalPath.trim() && !!d.seo.reviewedAt, detail: d.seo ? `title=${d.seo.title.length} chars; reviewed=${d.seo.reviewedAt ?? 'no'}` : 'No SEO record' },
    { name: 'Publication approval recorded', pass: !!d.publicationApprovedAt && !!d.publicationApprovedBy, detail: `approvedAt=${d.publicationApprovedAt ?? 'none'}` },
  ];
  const blockers = [
    ...checks.filter((c) => !c.pass).map((c) => c.name),
    ...media.blockers,
    ...specChecks.filter((c) => !c.pass).map((c) => c.name),
  ];
  return { allowed: blockers.length === 0, blockers: [...new Set(blockers)], checks };
}

export type CategoryProgress = {
  categoryId: number;
  slug: string;
  name: string;
  group: string;
  active: boolean;
  minModels: number;
  distinctVerifiedModels: number;
  publishedModels: number;
  detailPages: number;
  mediaComplete: number;
  missingModels: number;
  complete: boolean;
};

export function buildCategoryProgress(input: {
  id: number; slug: string; name: string; group: string; active: boolean; minModels?: number;
  products: Array<{
    brandId: number; modelName: string; sku: string; isDemo: boolean;
    verificationStatus: string; status: string; detailPageExists: boolean; mediaComplete: boolean;
  }>;
}): CategoryProgress {
  const minModels = input.minModels ?? MIN_MODELS_PER_CATEGORY;
  const real = input.products.filter((p) => !p.isDemo);
  const distinctVerifiedModels = countDistinctVerifiedModels(real);
  const published = real.filter((p) => p.status === 'published');
  return {
    categoryId: input.id,
    slug: input.slug,
    name: input.name,
    group: input.group,
    active: input.active,
    minModels,
    distinctVerifiedModels,
    publishedModels: published.length,
    detailPages: published.filter((p) => p.detailPageExists).length,
    mediaComplete: published.filter((p) => p.mediaComplete).length,
    missingModels: Math.max(0, minModels - distinctVerifiedModels),
    // Never mark complete when the activated category is below the minimum.
    complete: distinctVerifiedModels >= minModels && published.every((p) => p.detailPageExists && p.mediaComplete),
  };
}

export function catalogueIsComplete(progress: CategoryProgress[]): boolean {
  const active = progress.filter((p) => p.active);
  return active.length > 0 && active.every((p) => p.complete);
}
