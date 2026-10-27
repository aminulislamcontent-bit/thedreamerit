// Brands API
import { db } from '@/lib/db';
import { ok, apiHandler } from '@/lib/api';

export const GET = apiHandler(async () => {
  const brands = await db.brand.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  return ok({ brands });
});
