// GET /api/branches - list branches
// POST /api/branches - create branch (admin)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async () => {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { employees: true, orders: true, warehouses: true } },
    },
    orderBy: { name: 'asc' },
  });
  return ok({ branches });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'system.settings' as any)) return forbidden();

  const body = await req.json();
  const { code, name, address, phone, email, isHeadOffice } = body;

  if (!code || !name) return badRequest('Branch code and name are required');

  const existing = await db.branch.findUnique({ where: { code } });
  if (existing) return badRequest('Branch code already exists');

  const branch = await db.branch.create({
    data: { code, name, address, phone, email, isHeadOffice: isHeadOffice || false },
  });

  await logAudit({
    userId: user.id,
    action: 'branch.create',
    entityType: 'Branch',
    entityId: branch.id,
    metadata: { code, name },
    ipAddress: getClientIp(req),
  });

  return ok({ branch });
});
