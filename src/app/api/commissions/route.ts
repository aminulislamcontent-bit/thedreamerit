// Commissions API
import { db } from '@/lib/db';
import { ok, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'commission.view' as any)) return forbidden();

  const [transactions, rules] = await Promise.all([
    db.commissionTransaction.findMany({
      include: { employee: true, order: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.commissionRule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return ok({ transactions, rules });
});
