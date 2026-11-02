import { NextResponse } from 'next/server';
import { addToCart } from '@/lib/server/cart';
import { checkRateLimit, clientIp } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip = await clientIp();
  const limit = checkRateLimit('cart', ip || 'unknown', 60, 60);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: 'Too many requests.' }, { status: 429 });
  let body: { productId?: number; quantity?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 }); }
  if (!Number.isInteger(body.productId)) return NextResponse.json({ ok: false, error: 'Invalid product id.' }, { status: 400 });
  const result = await addToCart(body.productId as number, Math.min(Math.max(body.quantity ?? 1, 1), 99));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
