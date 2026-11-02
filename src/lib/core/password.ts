/** Password hashing with Node's built-in scrypt. No plaintext or reversible storage. */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;
const N = 16384;
const R = 8;
const P = 1;

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P }).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const expected = Buffer.from(hash, 'hex');
    const actual = scryptSync(password, salt, expected.length, { N, r: R, p: P });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function generatePassword(length = 20): string {
  // Excludes ambiguous characters; used only for local bootstrap credentials.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}
