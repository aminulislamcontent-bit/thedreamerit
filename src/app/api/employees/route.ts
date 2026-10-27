// Employees API
// GET /api/employees - list employees
// POST /api/employees - create employee (with linked user account)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { hashPassword } from '@/lib/security';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'hr.view' as any)) return forbidden();

  const url = new URL(req.url);
  const branchId = url.searchParams.get('branchId');
  const department = url.searchParams.get('department');

  const where: any = { isActive: true };
  if (branchId) where.branchId = branchId;
  if (department) where.department = department;

  const employees = await db.employee.findMany({
    where,
    include: {
      branch: true,
      user: { include: { roles: { include: { role: true } } } },
    },
    orderBy: { fullName: 'asc' },
  });

  // Hide salary info from non-HR managers
  const canSeeSalary = hasPermission(user, 'hr.salary.view' as any);

  return ok({
    employees: employees.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      fullName: e.fullName,
      designation: e.designation,
      department: e.department,
      phone: e.phone,
      email: e.email,
      employmentStatus: e.employmentStatus,
      joinDate: e.joinDate,
      branch: e.branch,
      user: e.user ? {
        id: e.user.id,
        email: e.user.email,
        roles: e.user.roles.map((r) => r.role.name),
        status: e.user.status,
      } : null,
      basicSalary: canSeeSalary ? e.basicSalary : undefined,
    })),
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'hr.manage' as any)) return forbidden();

  const body = await req.json();
  const {
    fullName, email, phone, password, designation, department, branchId,
    basicSalary, address, emergencyContact, roles = [],
  } = body;

  if (!fullName || !email || !designation || !department) {
    return badRequest('Full name, email, designation, and department are required');
  }

  // Check email uniqueness
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return badRequest('Email already in use');

  // Generate employee code
  const empCount = await db.employee.count();
  const employeeCode = `EMP-${String(empCount + 1).padStart(4, '0')}`;

  // Create user + employee in transaction
  const result = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        name: fullName,
        phone: phone || null,
        passwordHash: hashPassword(password || 'Welcome@2026'),
        status: 'ACTIVE',
      },
    });

    // Assign roles
    for (const roleName of roles) {
      const role = await tx.role.findUnique({ where: { name: roleName } });
      if (role) {
        await tx.userRole.create({
          data: { userId: newUser.id, roleId: role.id },
        }).catch(() => {});
      }
    }

    const employee = await tx.employee.create({
      data: {
        userId: newUser.id,
        employeeCode,
        fullName,
        designation,
        department,
        branchId: branchId || null,
        basicSalary: basicSalary || 0,
        phone: phone || null,
        email: email.toLowerCase(),
        address: address || null,
        emergencyContact: emergencyContact || null,
      },
      include: { branch: true },
    });

    return { user: newUser, employee };
  });

  await logAudit({
    userId: user.id,
    action: 'employee.create',
    entityType: 'Employee',
    entityId: result.employee.id,
    metadata: { employeeCode, fullName, email, designation, department },
    ipAddress: getClientIp(req),
  });

  return ok({ employee: result.employee, user: { id: result.user.id, email: result.user.email } });
});
