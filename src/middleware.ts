import { NextRequest, NextResponse } from 'next/server';
import { buildContentSecurityPolicy, buildSecurityHeaders, randomNonce } from '@/lib/core/security-headers';

/** Adds a fresh nonce CSP and transport/security headers to every rendered response. */
export function middleware(request: NextRequest) {
  const nonce = randomNonce();
  const csp = buildContentSecurityPolicy(nonce);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const https = request.nextUrl.protocol === 'https:' || forwardedProto === 'https';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [key, value] of Object.entries(buildSecurityHeaders(csp, https))) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
