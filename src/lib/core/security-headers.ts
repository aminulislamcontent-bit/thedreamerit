/** Central CSP and hardening-header policy. Dependency-free so it works in Edge middleware and unit tests. */

export function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Per-request nonce CSP. Next.js uses the `x-nonce` request header to add the same nonce
 * to its inline bootstrap scripts. `style-src` still allows inline style attributes because
 * several viewer components set dynamic transforms; scripts never fall back to `unsafe-inline`.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
  ].join('; ') + ';';
}

export function buildSecurityHeaders(csp: string, https: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
  // Do not send HSTS over plain HTTP. The reverse proxy may add includeSubDomains/preload
  // only after the owner has verified the production domain.
  if (https) headers['Strict-Transport-Security'] = 'max-age=31536000';
  return headers;
}
