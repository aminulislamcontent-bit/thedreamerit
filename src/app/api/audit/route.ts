// Audit log API
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'system.audit' as any)) return forbidden();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const severity = url.searchParams.get('severity');
  const action = url.searchParams.get('action');
  const userId = url.searchParams.get('userId');
  const entityType = url.searchParams.get('entityType');

  const where: Prisma.AuditEventWhereInput = {};
  if (severity) where.severity = severity;
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;

  const [events, total] = await Promise.all([
    db.auditEvent.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditEvent.count({ where }),
  ]);

  return ok({
    events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
