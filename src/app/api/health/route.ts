import { NextResponse } from 'next/server';
import { healthSnapshot } from '@/lib/server/monitoring';
import { schedulerStatus } from '@/lib/server/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await healthSnapshot();
  return NextResponse.json(
    { ...snapshot, scheduler: await schedulerStatus() },
    { status: snapshot.status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
