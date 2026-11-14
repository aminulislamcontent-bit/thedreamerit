import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContentSecurityPolicy, buildSecurityHeaders, randomNonce } from '../src/lib/core/security-headers';

test('nonce CSP allows only nonce-rooted scripts and keeps media viewer sources local', () => {
  const nonce = randomNonce();
  const csp = buildContentSecurityPolicy(nonce);
  assert.ok(nonce.length >= 16);
  assert.notEqual(randomNonce(), nonce);
  assert.ok(csp.includes(`'nonce-${nonce}'`));
  assert.ok(csp.includes("script-src 'self' 'nonce-"));
  assert.ok(csp.includes("'strict-dynamic'"));
  assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"));
  assert.ok(csp.includes("style-src 'self' 'unsafe-inline'"));
  assert.ok(csp.includes("img-src 'self' data: blob:"));
  assert.ok(csp.includes("media-src 'self' data: blob:"));
  assert.ok(csp.includes("worker-src 'self' blob:"));
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
});

test('hardening headers are present and HSTS is sent only for HTTPS', () => {
  const csp = buildContentSecurityPolicy('testnonce');
  const https = buildSecurityHeaders(csp, true);
  assert.equal(https['Content-Security-Policy'], csp);
  assert.equal(https['Strict-Transport-Security'], 'max-age=31536000');
  assert.equal(https['X-Content-Type-Options'], 'nosniff');
  assert.equal(https['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(https['X-Frame-Options'], 'DENY');
  assert.ok(https['Permissions-Policy']?.includes('camera=()'));

  const http = buildSecurityHeaders(csp, false);
  assert.equal(http['Strict-Transport-Security'], undefined);
  assert.equal(http['Content-Security-Policy'], csp);
});
