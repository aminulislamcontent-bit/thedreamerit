// POST /api/orders/[id]/status - update order status with state machine validation
// Body: { status: 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED', notes?: string }
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, conflict, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { ORDER_STATUS_FLOW } from '@/lib/config';

export const POST = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { status: newStatus, notes } = body;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return notFound('Order not found');

  // State machine validation
  const allowedTransitions = ORDER_STATUS_FLOW[order.status as keyof typeof ORDER_STATUS_FLOW] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return conflict(`Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`);
  }

  // Permission check
  const requiresApproval = ['CANCELLED', 'RETURNED'].includes(newStatus);
  if (requiresApproval && !hasPermission(user, 'orders.cancel' as any)) {
    return forbidden('You do not have permission to cancel orders');
  }
  if (!requiresApproval && !hasPermission(user, 'orders.process' as any)) {
    return forbidden('You do not have permission to process orders');
  }

  const now = new Date();
  const updateData: any = { status: newStatus };
  if (newStatus === 'CONFIRMED') updateData.confirmedAt = now;
  if (newStatus === 'PACKED') updateData.packedAt = now;
  if (newStatus === 'DISPATCHED') updateData.dispatchedAt = now;
  if (newStatus === 'DELIVERED') updateData.deliveredAt = now;
  if (newStatus === 'CANCELLED') updateData.cancelledAt = now;

  // If delivered, deduct reserved stock (final sale)
  // If cancelled, release reserved stock
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: updateData,
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newStatus,
        notes: notes || null,
        changedById: user.id,
      },
    });

    if (newStatus === 'CANCELLED') {
      // Release reserved stock
      for (const item of order.items) {
        const movements = await tx.stockMovement.findMany({
          where: {
            productId: item.productId,
            movementType: 'RESERVATION',
            referenceId: order.orderNumber,
          },
        });
        for (const m of movements) {
          // Release reservation
          await tx.inventory.updateMany({
            where: {
              productId: item.productId,
              OR: [
                { branchId: m.branchId },
                { warehouseId: m.warehouseId },
              ],
            },
            data: {
              quantityReserved: { decrement: Math.abs(m.quantity) },
              quantityAvailable: { increment: Math.abs(m.quantity) },
            },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId: m.branchId,
              warehouseId: m.warehouseId,
              quantity: Math.abs(m.quantity),
              movementType: 'RESERVATION_RELEASE',
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              reason: `Released due to order cancellation`,
              performedBy: user.id,
            },
          });
        }
      }
    }

    if (newStatus === 'DELIVERED') {
      // Final sale: convert reserved -> sold (deduct from onHand)
      for (const item of order.items) {
        const reservations = await tx.stockMovement.findMany({
          where: {
            productId: item.productId,
            movementType: 'RESERVATION',
            referenceId: order.orderNumber,
          },
        });
        for (const r of reservations) {
          await tx.inventory.updateMany({
            where: {
              productId: item.productId,
              OR: [
                { branchId: r.branchId },
                { warehouseId: r.warehouseId },
              ],
            },
            data: {
              quantityOnHand: { decrement: Math.abs(r.quantity) },
              quantityReserved: { decrement: Math.abs(r.quantity) },
            },
          });
          // Record the sale movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId: r.branchId,
              warehouseId: r.warehouseId,
              quantity: r.quantity, // negative
              movementType: 'SALE',
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              unitCost: item.costPrice,
              reason: `Sale - Order ${order.orderNumber}`,
              performedBy: user.id,
            },
          });
        }

        // Calculate commission if salesperson
        if (order.salespersonId) {
          // Find applicable commission rules
          const rules = await tx.commissionRule.findMany({
            where: {
              isActive: true,
              AND: [
                { OR: [{ startDate: null }, { startDate: { lte: now } }] },
                { OR: [{ endDate: null }, { endDate: { gte: now } }] },
              ],
            },
          });
          let commissionAmount = 0;
          let appliedRuleId: string | null = null;

          for (const rule of rules) {
            let applicable = false;
            if (rule.appliesTo === 'ALL') applicable = true;
            else if (rule.appliesTo === 'PRODUCT' && rule.productId === item.productId) applicable = true;
            else if (rule.appliesTo === 'CATEGORY' && rule.categoryId) {
              const product = await tx.product.findUnique({ where: { id: item.productId } });
              if (product?.categoryId === rule.categoryId) applicable = true;
            }

            if (!applicable) continue;

            if (rule.type === 'PERCENTAGE') {
              commissionAmount = (item.totalAmount * rule.value) / 100;
            } else if (rule.type === 'FIXED') {
              commissionAmount = rule.value * item.quantity;
            } else if (rule.type === 'MARGIN_BASED') {
              const margin = item.totalAmount - (item.costPrice * item.quantity);
              if (margin >= rule.minMargin) {
                commissionAmount = (margin * rule.value) / 100;
              }
            }

            if (commissionAmount > 0) {
              appliedRuleId = rule.id;
              break;
            }
          }

          if (commissionAmount > 0) {
            const period = now.toISOString().slice(0, 7); // YYYY-MM
            // Find employee record for salesperson
            const employee = await tx.employee.findFirst({ where: { userId: order.salespersonId! } });
            if (employee) {
              // Check for duplicate commission entry
              const existing = await tx.commissionTransaction.findFirst({
                where: {
                  employeeId: employee.id,
                  orderItemId: item.id,
                },
              });
              if (!existing) {
                await tx.commissionTransaction.create({
                  data: {
                    employeeId: employee.id,
                    orderId: order.id,
                    orderItemId: item.id,
                    ruleId: appliedRuleId,
                    amount: commissionAmount,
                    status: 'PENDING',
                    period,
                  },
                });
              }
            }
          }
        }
      }

      // Update customer totals
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: order.totalAmount },
            loyaltyPoints: { increment: Math.floor(order.totalAmount / 100) },
          },
        });
      }
    }

    return updated;
  });

  await logAudit({
    userId: user.id,
    action: 'order.status_change',
    entityType: 'Order',
    entityId: id,
    metadata: { from: order.status, to: newStatus, notes },
    ipAddress: getClientIp(req),
  });

  return ok({ order: result });
});
