// Customers API
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'crm.view' as any)) return forbidden();

  const customers = await db.customer.findMany({
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return ok({ customers });
});
