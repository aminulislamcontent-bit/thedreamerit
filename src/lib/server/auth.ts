import { cookies, headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { all, get, run, nowIso, scalar } from './database';
import { hashPassword, verifyPassword } from '../core/password';
import { verifyTotp } from '../core/totp';
import type { Permission } from '../core/permissions';

export const SESSION_COOKIE = 'dit_session';
export const CSRF_COOKIE = 'dit_csrf';
const SESSION_HOURS = 12;

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  status: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '';
}

export async function userAgent(): Promise<string> {
  const h = await headers();
  return h.get('user-agent') || '';
}

export async function createSession(userId: number, mfaPassed: boolean): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString();
  run('INSERT INTO sessions (user_id, token_hash, csrf_token, ip, user_agent, expires_at, mfa_passed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, sha256(token), csrf, await clientIp(), await userAgent(), expires, mfaPassed ? 1 : 0, nowIso()]);
  const jar = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure, path: '/', expires: new Date(expires) });
  jar.set(CSRF_COOKIE, csrf, { httpOnly: false, sameSite: 'lax', secure, path: '/' });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL', [nowIso(), sha256(token)]);
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = get<{ user_id: number; expires_at: string; revoked_at: string | null; mfa_passed: number }>(
    'SELECT user_id, expires_at, revoked_at, mfa_passed FROM sessions WHERE token_hash = ?', [sha256(token)]);
  if (!session || session.revoked_at || session.expires_at < nowIso()) return null;
  const user = get<{ id: number; email: string; name: string; status: string; mfa_enabled: number }>(
    'SELECT id, email, name, status, mfa_enabled FROM users WHERE id = ?', [session.user_id]);
  if (!user || user.status !== 'active') return null;
  const roles = all<{ slug: string }>('SELECT r.slug FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?', [user.id]).map((r) => r.slug);
  const permissions = all<{ slug: string }>(`SELECT DISTINCT p.slug FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ?`, [user.id]).map((r) => r.slug);
  return { id: user.id, email: user.email, name: user.name, status: user.status, mfaEnabled: !!user.mfa_enabled, roles, permissions };
}

export function hasPermission(user: CurrentUser | null, permission: Permission): boolean {
  return !!user && user.permissions.includes(permission);
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) redirect(`/admin?denied=${encodeURIComponent(permission)}`);
  return user;
}

/** Double-submit CSRF check for server actions. */
export async function requireCsrf(formToken: string | null): Promise<void> {
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  if (!formToken || !cookieToken || formToken !== cookieToken) throw new Error('Invalid or missing CSRF token. Please reload the page.');
}

export async function csrfToken(): Promise<string> {
  const jar = await cookies();
  return jar.get(CSRF_COOKIE)?.value ?? '';
}

/** Fixed-window rate limiting persisted in the database (survives restarts). */
export function checkRateLimit(bucket: string, subject: string, limit: number, windowSeconds: number): { allowed: boolean; remaining: number } {
  const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
  run('DELETE FROM rate_limit_hits WHERE created_at < ?', [cutoff]);
  const hits = scalar('SELECT COUNT(*) AS n FROM rate_limit_hits WHERE bucket = ? AND subject = ? AND created_at >= ?', [bucket, subject, cutoff]);
  if (hits >= limit) return { allowed: false, remaining: 0 };
  run('INSERT INTO rate_limit_hits (bucket, subject, created_at) VALUES (?, ?, ?)', [bucket, subject, nowIso()]);
  return { allowed: true, remaining: limit - hits - 1 };
}

export async function login(email: string, password: string, totp?: string): Promise<{ ok: boolean; error?: string; mfaRequired?: boolean }> {
  const subject = `${email.toLowerCase()}|${await clientIp()}`;
  const limit = checkRateLimit('login', subject, 8, 15 * 60);
  if (!limit.allowed) {
    await recordAudit('auth.login_rate_limited', 'user', email, { email }, null);
    return { ok: false, error: 'Too many attempts. Please wait 15 minutes.' };
  }
  const user = get<{ id: number; email: string; password_hash: string; password_salt: string; status: string; mfa_enabled: number; mfa_secret: string | null; failed_login_count: number }>(
    'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    if (user) run('UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = ?', [user.id]);
    await recordAudit('auth.login_failed', 'user', email, {}, null);
    return { ok: false, error: 'Invalid email or password.' };
  }
  if (user.status !== 'active') return { ok: false, error: 'This account is not active.' };
  if (user.mfa_enabled && user.mfa_secret) {
    if (!totp) return { ok: false, mfaRequired: true, error: 'Enter the six-digit code from your authenticator.' };
    if (!verifyTotp(user.mfa_secret, totp)) {
      await recordAudit('auth.mfa_failed', 'user', String(user.id), {}, user.id);
      return { ok: false, error: 'Invalid authentication code.', mfaRequired: true };
    }
  }
  run('UPDATE users SET failed_login_count = 0, last_login_at = ? WHERE id = ?', [nowIso(), user.id]);
  await createSession(user.id, !!user.mfa_enabled);
  await recordAudit('auth.login_success', 'user', String(user.id), {}, user.id);
  return { ok: true };
}

export async function registerCustomer(input: { name: string; email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  if (input.password.length < 10) return { ok: false, error: 'Use at least 10 characters.' };
  const existing = get('SELECT id FROM users WHERE email = ?', [input.email.toLowerCase()]);
  if (existing) return { ok: false, error: 'An account with this email already exists.' };
  const { hash, salt } = hashPassword(input.password);
  const result = run('INSERT INTO users (email, name, password_hash, password_salt, status) VALUES (?, ?, ?, ?, ?)',
    [input.email.toLowerCase(), input.name, hash, salt, 'active']);
  const roleId = get<{ id: number }>("SELECT id FROM roles WHERE slug = 'customer'");
  if (roleId) run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [result.lastInsertRowid, roleId.id]);
  run('INSERT INTO customers (user_id, name, email, consent_marketing) VALUES (?, ?, ?, 0)', [result.lastInsertRowid, input.name, input.email.toLowerCase()]);
  await createSession(result.lastInsertRowid, false);
  await recordAudit('auth.customer_registered', 'user', String(result.lastInsertRowid), {}, result.lastInsertRowid);
  return { ok: true };
}

export async function recordAudit(action: string, entityType: string, entityId: string | number, detail: Record<string, unknown> = {}, actorId: number | null = null): Promise<void> {
  let actor = actorId;
  let label = 'system';
  if (actor === null) {
    const current = await getCurrentUser().catch(() => null);
    actor = current?.id ?? null;
    label = current?.email ?? 'anonymous';
  } else {
    const u = get<{ email: string }>('SELECT email FROM users WHERE id = ?', [actor]);
    label = u?.email ?? 'system';
  }
  run('INSERT INTO audit_events (actor_user_id, actor_label, action, entity_type, entity_id, detail_json, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [actor, label, action, entityType, String(entityId), JSON.stringify(detail), await clientIp().catch(() => ''), nowIso()]);
}
