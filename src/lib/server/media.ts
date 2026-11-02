/** Product media administration: uploads, provenance, permission, review and ordering. */

import { all, get, run, nowIso } from './database';
import { recordAudit } from './auth';
import { mediaMetadataSchema } from '../core/validation';
import { canPublishExternalMedia, validateUpload } from '../core/media-rules';

export async function addMedia(productId: number, input: unknown, userId: number): Promise<{ ok: boolean; error?: string; id?: number }> {
  const parsed = mediaMetadataSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  const m = parsed.data;
  // External URLs are never published automatically.
  const permission = m.url.startsWith('/media/') ? m.permissionStatus : 'unknown';
  const result = run(`INSERT INTO product_media (product_id, kind, url, sequence_key, width, height, alt_text, caption, source_url, source_name, license,
    permission_status, review_status, is_primary, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?)`,
    [productId, m.kind, m.url, m.sequenceKey, m.width, m.height, m.altText, m.caption, m.sourceUrl, m.sourceName, m.license,
      permission, m.sortOrder, nowIso(), nowIso()]);
  const id = Number(result.lastInsertRowid);
  run('INSERT INTO media_jobs (media_id, status, created_at) VALUES (?, ?, ?)', [id, m.url.startsWith('/media/') ? 'completed' : 'pending', nowIso()]);
  await recordAudit('media.added', 'media', id, { productId, kind: m.kind, permission }, userId);
  return { ok: true, id };
}

export async function reviewMedia(id: number, decision: 'approved' | 'rejected', userId: number): Promise<{ ok: boolean; error?: string }> {
  const media = get<{ id: number; url: string; source_url: string; permission_status: string; product_id: number }>('SELECT * FROM product_media WHERE id = ?', [id]);
  if (!media) return { ok: false, error: 'Media not found.' };
  if (decision === 'approved') {
    if (!canPublishExternalMedia({ sourceUrl: media.source_url, permissionStatus: media.permission_status, reviewStatus: 'approved' })) {
      return { ok: false, error: 'Approval requires a recorded source, granted usage permission and a quality review.' };
    }
  }
  run('UPDATE product_media SET review_status = ?, updated_at = ? WHERE id = ?', [decision, nowIso(), id]);
  run('UPDATE media_jobs SET status = ?, resolved_at = ? WHERE media_id = ?', [decision === 'approved' ? 'completed' : 'failed', nowIso(), id]);
  await recordAudit('media.reviewed', 'media', id, { decision, productId: media.product_id }, userId);
  return { ok: true };
}

export async function grantMediaPermission(id: number, license: string, sourceUrl: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  if (!license.trim() || !sourceUrl.trim()) return { ok: false, error: 'Record both the licence/permission and the source URL.' };
  run('UPDATE product_media SET permission_status = ?, license = ?, source_url = ?, updated_at = ? WHERE id = ?', ['granted', license, sourceUrl, nowIso(), id]);
  await recordAudit('media.permission_granted', 'media', id, { license }, userId);
  return { ok: true };
}

export async function setPrimary(id: number, userId: number): Promise<void> {
  const media = get<{ product_id: number }>('SELECT product_id FROM product_media WHERE id = ?', [id]);
  if (!media) return;
  run('UPDATE product_media SET is_primary = 0 WHERE product_id = ?', [media.product_id]);
  run('UPDATE product_media SET is_primary = 1, updated_at = ? WHERE id = ?', [nowIso(), id]);
  await recordAudit('media.primary_set', 'media', id, {}, userId);
}

export async function reorderMedia(ids: number[], userId: number): Promise<void> {
  ids.forEach((id, index) => run('UPDATE product_media SET sort_order = ?, updated_at = ? WHERE id = ?', [index, nowIso(), id]));
  await recordAudit('media.reordered', 'media', 0, { count: ids.length }, userId);
}

export async function removeMedia(id: number, userId: number): Promise<void> {
  run('DELETE FROM product_media WHERE id = ?', [id]);
  await recordAudit('media.removed', 'media', id, {}, userId);
}

export function mediaQueue() {
  return all<{ id: number; product_id: number; model_name: string; kind: string; url: string; review_status: string; permission_status: string; source_url: string; license: string; job_status: string; error: string }>(
    `SELECT m.*, p.model_name, COALESCE(j.status,'pending') AS job_status, COALESCE(j.error,'') AS error
     FROM product_media m JOIN products p ON p.id = m.product_id
     LEFT JOIN media_jobs j ON j.media_id = m.id ORDER BY m.created_at DESC`);
}

export function validateIncomingUpload(input: { kind: string; mimeType: string; sizeBytes: number; fileName: string }) {
  return validateUpload(input);
}
