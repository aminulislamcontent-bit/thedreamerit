'use server';

import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { guard, field, intField, done, fail } from '@/lib/server/action-utils';
import { addMedia, grantMediaPermission, removeMedia, reviewMedia, setPrimary, validateIncomingUpload } from '@/lib/server/media';

export async function addMediaUrlAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.upload');
  const productId = intField(fd, 'productId');
  const kind = field(fd, 'kind');
  const url = field(fd, 'url');
  if (!productId || !url) fail('/admin/media', 'Product and media URL are required.');
  const result = await addMedia(productId, {
    kind, url, altText: field(fd, 'altText'), caption: field(fd, 'caption'),
    sourceUrl: field(fd, 'sourceUrl'), sourceName: field(fd, 'sourceName'), license: field(fd, 'license'),
    permissionStatus: field(fd, 'permissionStatus') || 'unknown',
    sequenceKey: field(fd, 'sequenceKey'), sortOrder: intField(fd, 'sortOrder'),
    width: null, height: null,
  }, user.id);
  if (!result.ok) fail('/admin/media', result.error || 'Media rejected.');
  revalidatePath('/admin/media');
  done('/admin/media', 'Media record created as pending review. External media is never published automatically.');
}

export async function uploadMediaAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.upload');
  const productId = intField(fd, 'productId');
  const kind = field(fd, 'kind');
  const file = fd.get('file');
  if (!productId || !(file instanceof File) || file.size === 0) fail('/admin/media', 'Select a product and a non-empty file.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const validation = validateIncomingUpload({ kind, mimeType: file.type, sizeBytes: file.size, fileName: safeName });
  if (!validation.allowed) fail('/admin/media', validation.blockers.join(' '));
  const ext = path.extname(safeName) || '.bin';
  const stored = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
  const dir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, stored), Buffer.from(await file.arrayBuffer()));
  const result = await addMedia(productId, {
    kind, url: `/media/${stored}`, altText: field(fd, 'altText'), caption: field(fd, 'caption'),
    sourceUrl: field(fd, 'sourceUrl'), sourceName: field(fd, 'sourceName'), license: field(fd, 'license'),
    permissionStatus: 'pending', sequenceKey: field(fd, 'sequenceKey'), sortOrder: intField(fd, 'sortOrder'),
    width: null, height: null,
  }, user.id);
  if (!result.ok) fail('/admin/media', result.error || 'Upload rejected.');
  revalidatePath('/admin/media');
  done('/admin/media', 'File uploaded, validated and queued for permission + quality review.');
}

export async function reviewMediaAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.review');
  const id = intField(fd, 'mediaId');
  const decision = field(fd, 'decision') === 'rejected' ? 'rejected' : 'approved';
  const result = await reviewMedia(id, decision, user.id);
  if (!result.ok) fail('/admin/media', result.error || 'Review failed.');
  revalidatePath('/admin/media');
  done('/admin/media', decision === 'approved' ? 'Media approved for use.' : 'Media rejected.');
}

export async function grantPermissionAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.review');
  const id = intField(fd, 'mediaId');
  const result = await grantMediaPermission(id, field(fd, 'license'), field(fd, 'sourceUrl'), user.id);
  if (!result.ok) fail('/admin/media', result.error || 'Permission not recorded.');
  revalidatePath('/admin/media');
  done('/admin/media', 'Usage permission and source recorded.');
}

export async function setPrimaryAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.review');
  await setPrimary(intField(fd, 'mediaId'), user.id);
  revalidatePath('/admin/media');
  done('/admin/media', 'Primary image updated.');
}

export async function removeMediaAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'media.review');
  await removeMedia(intField(fd, 'mediaId'), user.id);
  revalidatePath('/admin/media');
  done('/admin/media', 'Media record removed.');
}
