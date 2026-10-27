// Security utilities - password hashing, session tokens, MFA support
import crypto from 'crypto';

// Use Node's built-in scrypt for password hashing (no external deps)
const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_LEN = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SCRYPT_SALT_LEN);
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algorithm, saltHex, keyHex] = stored.split('$');
    if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
    // Constant-time comparison
    return crypto.timingSafeEqual(derivedKey, storedKey);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOpaqueId(prefix: string = ''): string {
  const id = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

// Generate sequential, business-readable order numbers
export function generateOrderNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `DIT-${year}-${String(seq).padStart(5, '0')}`;
}

export function generatePoNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `PO-${year}-${String(seq).padStart(4, '0')}`;
}

export function generateGrnNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `GRN-${year}-${String(seq).padStart(4, '0')}`;
}

export function generateTicketNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `TK-${year}-${String(seq).padStart(5, '0')}`;
}

export function generateTransferCode(seq: number): string {
  const year = new Date().getFullYear();
  return `TR-${year}-${String(seq).padStart(4, '0')}`;
}

export function generateInvoiceNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(seq).padStart(5, '0')}`;
}

// Input validation helpers
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/\u0000/g, '');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidBangladeshPhone(phone: string): boolean {
  // Accept formats: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+?880|0)?1[3-9]\d{8}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+880')) return '0' + cleaned.slice(4);
  if (cleaned.startsWith('880')) return '0' + cleaned.slice(3);
  return cleaned;
}

// CSRF token generation
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Constant-time string comparison (for tokens)
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Decimal-safe monetary calculations (BDT has 2 decimal places)
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((acc, v) => acc + roundMoney(v), 0));
}
