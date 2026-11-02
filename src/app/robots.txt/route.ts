import { robotsTxt } from '@/lib/server/seo';

export const runtime = 'nodejs';

export async function GET() {
  return new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
