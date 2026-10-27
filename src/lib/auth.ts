// Server-side auth context - reads session token from cookie, validates, returns user + permissions
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { ROLE_PERMISSIONS, type PermissionCode, type SystemRole } from '@/lib/config';
import { generateSessionToken } from '@/lib/security';
import type { User, Role, UserRole, Permission, RolePermission, Employee, Customer } from '@prisma/client';

export type AuthUser = User & {
  roles: (UserRole & { role: Role & { permissions: (RolePermission & { permission: Permission })[] } })[];
  employee: Employee | null;
  customer: Customer | null;
};

const SESSION_COOKIE = 'dit_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8; // 8 hours

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
          employee: true,
          customer: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.revokedAt) return null;

  return session.user as AuthUser;
}

export async function requireSession(): Promise<AuthUser> {
  const user = await getSession();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requirePermission(
  permission: PermissionCode
): Promise<AuthUser> {
  const user = await requireSession();
  if (!hasPermission(user, permission)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export function getUserRoles(user: AuthUser): SystemRole[] {
  return user.roles.map((ur) => ur.role.name as SystemRole);
}

export function hasPermission(user: AuthUser, permission: PermissionCode): boolean {
  const roles = getUserRoles(user);
  if (roles.includes('SUPER_ADMIN')) return true;
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] || [];
    if (perms.includes(permission)) return true;
  }
  return false;
}

export function hasAnyPermission(user: AuthUser, permissions: PermissionCode[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

// Check if user can access a specific branch's data
export function canAccessBranch(user: AuthUser, branchId: string | null): boolean {
  const roles = getUserRoles(user);
  if (roles.includes('SUPER_ADMIN') || roles.includes('ADMINISTRATOR')) return true;
  if (!branchId) return false;
  // Branch managers, employees can access their own branch
  if (user.employee?.branchId === branchId) return true;
  return false;
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await db.session.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
