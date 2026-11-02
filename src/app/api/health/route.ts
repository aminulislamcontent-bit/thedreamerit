import { NextResponse } from 'next/server';
import { healthSnapshot } from '@/lib/server/monitoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = healthSnapshot();
  return NextResponse.json(snapshot, { status: snapshot.status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
