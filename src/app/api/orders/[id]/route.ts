// GET  /api/orders/[id] - get order details
// POST /api/orders/[id]/status - update order status (with state-machine validation)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp, conflict } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { ORDER_STATUS_FLOW } from '@/lib/config';

export const GET = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { brand: true } } } },
      branch: true,
      customer: true,
      payments: true,
      refunds: true,
      invoices: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      returns: true,
      warrantyClaims: true,
    },
  });

  if (!order) return notFound('Order not found');

  // Customers can only view their own orders
  if (user.customer && order.customerId !== user.customer.id) {
    return forbidden();
  }
  // Staff with orders.view can see all
  if (!user.customer && !hasPermission(user, 'orders.view' as any)) {
    return forbidden();
  }

  return ok({ order });
});
