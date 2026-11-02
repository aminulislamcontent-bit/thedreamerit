import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { get } from '@/lib/server/database';
import { getCurrentUser } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.pdf': 'application/pdf',
};

type MediaApproval = { review_status: string; permission_status: string };

/** Public product media and generated derivatives are served only after permission + review approval. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) return new NextResponse('Invalid file name', { status: 400 });
  const url = `/media/${file}`;

  let approval = get<MediaApproval>(
    'SELECT review_status, permission_status FROM product_media WHERE url = ? LIMIT 1', [url],
  );
  let derivativeMime: string | null = null;
  if (!approval) {
    const derivative = get<{ media_id: number; mime_type: string }>(
      'SELECT media_id, mime_type FROM media_derivatives WHERE url = ? LIMIT 1', [url],
    );
    if (derivative) {
      approval = get<MediaApproval>(
        'SELECT review_status, permission_status FROM product_media WHERE id = ? LIMIT 1', [derivative.media_id],
      );
      derivativeMime = derivative.mime_type;
    }
  }
  if (!approval) return new NextResponse('Media record not found', { status: 404 });

  const user = await getCurrentUser().catch(() => null);
  const privileged = !!user && (user.permissions.includes('media.view') || user.permissions.includes('media.review'));
  const approved = approval.review_status === 'approved' && approval.permission_status === 'granted';
  if (!approved && !privileged) return new NextResponse('Media not approved', { status: 403 });

  const full = path.join(process.cwd(), 'uploads', file);
  if (!fs.existsSync(full)) return new NextResponse('Not found', { status: 404 });
  const ext = path.extname(file).toLowerCase();
  const data = fs.readFileSync(full);
  return new NextResponse(data, {
    headers: {
      'Content-Type': derivativeMime || MIME[ext] || 'application/octet-stream',
      'Cache-Control': approved ? 'public, max-age=3600' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
