import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { run, nowIso } from '@/lib/server/database';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Sign in to save a wishlist.' }, { status: 401 });
  let body: { productId?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 }); }
  if (!Number.isInteger(body.productId)) return NextResponse.json({ ok: false, error: 'Invalid product id.' }, { status: 400 });
  run('INSERT OR IGNORE INTO wishlist_items (user_id, product_id, created_at) VALUES (?, ?, ?)', [user.id, body.productId as number, nowIso()]);
  return NextResponse.json({ ok: true });
}
