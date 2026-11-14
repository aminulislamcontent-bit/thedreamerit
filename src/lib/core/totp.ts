/** RFC 6238 TOTP for optional admin MFA. Uses only Node's built-in crypto. */

import { createHmac, randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20): string {
  const buf = randomBytes(bytes);
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function decodeBase32(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = '';
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx < 0) throw new Error('Invalid base32 secret');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpCode(secret: string, unixSeconds = Math.floor(Date.now() / 1000), period = 30, digits = 6): string {
  const counter = Math.floor(unixSeconds / period);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', decodeBase32(secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

export function verifyTotp(secret: string, code: string, unixSeconds = Math.floor(Date.now() / 1000), window = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  for (let drift = -window; drift <= window; drift++) {
    if (totpCode(secret, unixSeconds + drift * 30) === code) return true;
  }
  return false;
}

export function totpProvisioningUri(secret: string, account: string, issuer = 'The Dreamer IT Express'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
