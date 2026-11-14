import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/', request.url), 303);
}
