'use server';

import { redirect } from 'next/navigation';
import { destroySession, login, registerCustomer } from '@/lib/server/auth';
import { loginSchema } from '@/lib/core/validation';
import { field } from '@/lib/server/action-utils';

export type AuthState = { error?: string; mfaRequired?: boolean };

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: field(fd, 'email'), password: String(fd.get('password') ?? ''), totp: field(fd, 'totp') || undefined });
  if (!parsed.success) return { error: 'সঠিক ইমেইল ও পাসওয়ার্ড দিন।' };
  const result = await login(parsed.data.email, parsed.data.password, parsed.data.totp);
  if (!result.ok) return { error: result.error || 'লগইন ব্যর্থ।', mfaRequired: result.mfaRequired };
  const next = field(fd, 'next');
  // Prevent open redirects: only local absolute paths are allowed.
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  redirect(target);
}

export async function registerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const result = await registerCustomer({ name: field(fd, 'name'), email: field(fd, 'email'), password: String(fd.get('password') ?? '') });
  if (!result.ok) return { error: result.error };
  redirect('/account');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}

export async function setupMfaAction(fd: FormData): Promise<void> {
  const { getCurrentUser, requireCsrf } = await import('@/lib/server/auth');
  const { generateTotpSecret } = await import('@/lib/core/totp');
  const { run } = await import('@/lib/server/database');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await requireCsrf(fd.get('_csrf') === null ? null : String(fd.get('_csrf')));
  run('UPDATE users SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?', [generateTotpSecret(), user.id]);
  redirect('/admin/security?ok=' + encodeURIComponent('MFA সক্রিয় হয়েছে। নিচের provisioning URI অথেনটিকেটরে যোগ করুন এবং পরবর্তী লগইনে ৬-সংখ্যার কোড দিন।'));
}

export async function disableMfaAction(fd: FormData): Promise<void> {
  const { getCurrentUser, requireCsrf } = await import('@/lib/server/auth');
  const { run } = await import('@/lib/server/database');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await requireCsrf(fd.get('_csrf') === null ? null : String(fd.get('_csrf')));
  run('UPDATE users SET mfa_secret = NULL, mfa_enabled = 0 WHERE id = ?', [user.id]);
  redirect('/admin/security?ok=' + encodeURIComponent('MFA নিষ্ক্রিয় করা হয়েছে।'));
}

export async function changePasswordAction(fd: FormData): Promise<void> {
  const { getCurrentUser, requireCsrf } = await import('@/lib/server/auth');
  const { verifyPassword, hashPassword } = await import('@/lib/core/password');
  const { get, run } = await import('@/lib/server/database');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await requireCsrf(fd.get('_csrf') === null ? null : String(fd.get('_csrf')));
  const current = String(fd.get('currentPassword') ?? '');
  const next = String(fd.get('newPassword') ?? '');
  const row = get<{ password_hash: string; password_salt: string }>('SELECT password_hash, password_salt FROM users WHERE id = ?', [user.id]);
  if (!row || !verifyPassword(current, row.password_hash, row.password_salt)) redirect('/admin/security?error=' + encodeURIComponent('বর্তমান পাসওয়ার্ড মিলছে না।'));
  if (next.length < 12) redirect('/admin/security?error=' + encodeURIComponent('নতুন পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।'));
  const { hash, salt } = hashPassword(next);
  run('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?', [hash, salt, user.id]);
  redirect('/admin/security?ok=' + encodeURIComponent('পাসওয়ার্ড পরিবর্তন হয়েছে (scrypt, নতুন সল্ট)।'));
}
