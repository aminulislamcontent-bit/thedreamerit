// POST /api/auth/login - login with email + password
// GET  /api/auth      - get current session user
// DELETE /api/auth    - logout
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, apiHandler, getClientIp, getUserAgent } from '@/lib/api';
import { verifyPassword } from '@/lib/security';
import { createSession, SESSION_COOKIE_NAME, getSession, destroySession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { cookies } from 'next/headers';

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { email, password } = body as { email: string; password: string };

  if (!email || !password) {
    return badRequest('Email and password are required');
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      roles: { include: { role: true } },
      employee: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (user) {
      const newCount = user.failedLoginCount + 1;
      const updateData: any = { failedLoginCount: newCount };
      if (newCount >= 5) {
        updateData.status = 'SUSPENDED';
      }
      await db.user.update({ where: { id: user.id }, data: updateData });
    }
    await logAudit({
      action: 'user.login_failed',
      entityType: 'User',
      entityId: user?.id,
      severity: 'WARN',
      metadata: { email },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    return unauthorized('Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    return unauthorized(`Account is ${user.status.toLowerCase()}. Contact administrator.`);
  }

  const token = await createSession(user.id);
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lastLoginAt: new Date(),
      lastLoginIp: getClientIp(req),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  await logAudit({
    userId: user.id,
    action: 'user.login_success',
    entityType: 'User',
    entityId: user.id,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      roles: user.roles.map((r) => r.role.name),
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            designation: user.employee.designation,
            department: user.employee.department,
            branchId: user.employee.branchId,
          }
        : null,
    },
  });
});

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return ok({ user: null });
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      roles: user.roles.map((r) => r.role.name),
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            designation: user.employee.designation,
            department: user.employee.department,
            branchId: user.employee.branchId,
          }
        : null,
    },
  });
});

export const DELETE = apiHandler(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  return ok({ success: true });
});
