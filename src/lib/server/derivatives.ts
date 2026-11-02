/** Responsive WebP derivatives for approved, licensed, locally stored product images. */

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { all, get, nowIso, run } from './database';

export const DERIVATIVE_VARIANTS = [
  { name: 'thumb', width: 320, quality: 78 },
  { name: 'medium', width: 800, quality: 82 },
  { name: 'large', width: 1600, quality: 86 },
] as const;

type MediaSource = { id: number; url: string };
type DerivativeRow = {
  id: number;
  file_name: string;
  url: string;
  source_checksum: string;
  variant: string;
};

export type DerivativeSummary = {
  processed: number;
  created: number;
  skipped: number;
  errors: string[];
};

function sha256(data: Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

function localPathFor(url: string): string | null {
  if (!url.startsWith('/media/')) return null;
  const name = url.slice('/media/'.length);
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return path.join(process.cwd(), 'uploads', name);
}

/**
 * Only approved + permission-granted local images are processed. The generated files are
 * flat, safe basenames served through the same permission-checked `/media/[file]` route.
 */
export async function generateDerivatives(): Promise<DerivativeSummary> {
  const summary: DerivativeSummary = { processed: 0, created: 0, skipped: 0, errors: [] };
  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const sources = all<MediaSource>(
    `SELECT id, url FROM product_media
     WHERE kind = 'image' AND review_status = 'approved' AND permission_status = 'granted'
       AND url LIKE '/media/%' ORDER BY id`,
  );

  for (const source of sources) {
    const sourcePath = localPathFor(source.url);
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      summary.errors.push(`Media #${source.id}: local source file is missing or unsafe.`);
      continue;
    }
    try {
      const input = fs.readFileSync(sourcePath);
      const sourceChecksum = sha256(input);
      for (const variant of DERIVATIVE_VARIANTS) {
        const existing = get<DerivativeRow>(
          'SELECT id, file_name, url, source_checksum, variant FROM media_derivatives WHERE media_id = ? AND variant = ?',
          [source.id, variant.name],
        );
        if (existing && existing.source_checksum === sourceChecksum && fs.existsSync(path.join(uploadsDir, existing.file_name))) {
          summary.skipped += 1;
          continue;
        }
        const { data, info } = await sharp(input, { failOn: 'error' })
          .rotate()
          .resize({ width: variant.width, withoutEnlargement: true })
          .webp({ quality: variant.quality })
          .toBuffer({ resolveWithObject: true });
        const fileName = `derivative-${source.id}-${variant.name}-${sourceChecksum.slice(0, 12)}.webp`;
        const url = `/media/${fileName}`;
        fs.writeFileSync(path.join(uploadsDir, fileName), data);
        const checksum = sha256(data);
        const createdAt = nowIso();
        run(`INSERT INTO media_derivatives
          (media_id, variant, file_name, url, width, height, mime_type, size_bytes, checksum, source_checksum, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'image/webp', ?, ?, ?, ?)
          ON CONFLICT(media_id, variant) DO UPDATE SET
            file_name = excluded.file_name, url = excluded.url, width = excluded.width,
            height = excluded.height, mime_type = excluded.mime_type, size_bytes = excluded.size_bytes,
            checksum = excluded.checksum, source_checksum = excluded.source_checksum,
            created_at = excluded.created_at`,
          [source.id, variant.name, fileName, url, info.width, info.height, data.length, checksum, sourceChecksum, createdAt]);
        if (existing && existing.file_name !== fileName) {
          fs.rmSync(path.join(uploadsDir, existing.file_name), { force: true });
        }
        summary.created += 1;
      }
      summary.processed += 1;
    } catch (error) {
      summary.errors.push(`Media #${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return summary;
}
