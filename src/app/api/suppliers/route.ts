// Suppliers API
// GET /api/suppliers - list suppliers
// POST /api/suppliers - create supplier
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'procurement.view' as any)) return forbidden();

  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { purchaseOrders: true, products: true } },
    },
    orderBy: { name: 'asc' },
  });
  return ok({ suppliers });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'procurement.view' as any)) return forbidden();

  const body = await req.json();
  const { name, legalName, taxId, contactName, email, phone, address, paymentTerms } = body;

  if (!name) return badRequest('Supplier name is required');

  const code = `SUP-${Date.now().toString(36).toUpperCase()}`;
  const supplier = await db.supplier.create({
    data: {
      code,
      name,
      legalName: legalName || null,
      taxId: taxId || null,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      paymentTerms: paymentTerms || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'supplier.create',
    entityType: 'Supplier',
    entityId: supplier.id,
    metadata: { name, code },
    ipAddress: getClientIp(req),
  });

  return ok({ supplier });
});
