/** Upload validation and media provenance rules. */

import type { MediaTier } from './catalogue-rules';

export const ALLOWED_UPLOADS: Record<string, { mime: string[]; maxBytes: number; label: string }> = {
  image: { mime: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], maxBytes: 15 * 1024 * 1024, label: 'photograph' },
  video: { mime: ['video/mp4', 'video/webm'], maxBytes: 250 * 1024 * 1024, label: 'video' },
  model_3d: { mime: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'], maxBytes: 80 * 1024 * 1024, label: '3D model' },
  spin_frame: { mime: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], maxBytes: 15 * 1024 * 1024, label: '360° frame' },
  document: { mime: ['application/pdf'], maxBytes: 20 * 1024 * 1024, label: 'document' },
};

export function validateUpload(input: { kind: string; mimeType: string; sizeBytes: number; fileName: string }): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const rule = ALLOWED_UPLOADS[input.kind];
  if (!rule) blockers.push(`Unknown media kind "${input.kind}".`);
  else {
    if (!rule.mime.includes(input.mimeType)) blockers.push(`MIME type ${input.mimeType} is not allowed for ${rule.label}.`);
    if (input.sizeBytes <= 0) blockers.push('File is empty.');
    if (input.sizeBytes > rule.maxBytes) blockers.push(`File exceeds the ${Math.round(rule.maxBytes / 1024 / 1024)} MB limit for ${rule.label}.`);
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(input.fileName)) blockers.push('File name contains unsafe characters.');
  if (input.kind === 'model_3d' && !/\.(glb|gltf)$/i.test(input.fileName)) blockers.push('3D models must be .glb or .gltf files.');
  return { allowed: blockers.length === 0, blockers };
}

/** External media is never published automatically: it needs recorded permission and review. */
export function canPublishExternalMedia(input: { sourceUrl: string; permissionStatus: string; reviewStatus: string }): boolean {
  return !!input.sourceUrl.trim() && input.permissionStatus === 'granted' && input.reviewStatus === 'approved';
}

export function mediaPresentationLabel(tier: MediaTier): string {
  switch (tier) {
    case 'model_3d': return 'Interactive 3D model (verified, product-specific)';
    case 'spin_360': return 'Interactive 360° photographic sequence';
    case 'photos_video': return 'Multi-angle photographs with product video';
    case 'photos': return 'Multi-angle photographs — no suitable product video available';
    default: return 'Media pending approval — no interactive viewer shown';
  }
}
