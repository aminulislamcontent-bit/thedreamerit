import { redirect } from 'next/navigation';
import { requireCsrf, requirePermission } from './auth';
import type { Permission } from '../core/permissions';
import type { CurrentUser } from './auth';

export function field(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

export function intField(fd: FormData, key: string, fallback = 0): number {
  const raw = field(fd, key);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function boolField(fd: FormData, key: string): boolean {
  const v = field(fd, key).toLowerCase();
  return v === '1' || v === 'on' || v === 'true' || v === 'yes';
}

export function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function done(path: string, message?: string): never {
  redirect(withQuery(path, { ok: message }));
}

export function fail(path: string, message: string): never {
  redirect(withQuery(path, { error: message }));
}

/** Permission + CSRF guard shared by every privileged server action. */
export async function guard(fd: FormData, permission: Permission): Promise<CurrentUser> {
  const user = await requirePermission(permission);
  await requireCsrf(fd.get('_csrf') === null ? null : String(fd.get('_csrf')));
  return user;
}

export function statusNotice(searchParams: Record<string, string | string[] | undefined>): { ok?: string; error?: string } {
  const read = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return { ok: read('ok'), error: read('error') };
}
