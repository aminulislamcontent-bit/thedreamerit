// Inventory APIs
// GET /api/inventory - list inventory (with filters)
// POST /api/inventory/adjust - adjust stock (with audit + reason)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'inventory.view' as any)) return forbidden();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const branchId = url.searchParams.get('branchId');
  const warehouseId = url.searchParams.get('warehouseId');
  const productId = url.searchParams.get('productId');
  const lowStock = url.searchParams.get('lowStock') === '1';

  const where: Prisma.InventoryWhereInput = {};
  if (branchId) where.branchId = branchId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (lowStock) where.quantityAvailable = { lte: 5 };

  const [items, total] = await Promise.all([
    db.inventory.findMany({
      where,
      include: {
        product: { include: { brand: true, category: true } },
        branch: true,
        warehouse: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.inventory.count({ where }),
  ]);

  return ok({
    inventory: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  // Adjust stock
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'inventory.adjust' as any)) return forbidden();

  const body = await req.json();
  const { inventoryId, newQuantity, reason, movementType = 'ADJUSTMENT_IN' } = body;

  if (!inventoryId || newQuantity === undefined || !reason) {
    return badRequest('Inventory ID, new quantity, and reason are required');
  }

  const inv = await db.inventory.findUnique({
    where: { id: inventoryId },
    include: { product: true },
  });
  if (!inv) return badRequest('Inventory record not found');

  const diff = newQuantity - inv.quantityOnHand;
  if (diff === 0) return badRequest('No change in quantity');

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.inventory.update({
      where: { id: inventoryId },
      data: {
        quantityOnHand: newQuantity,
        quantityAvailable: { increment: diff },
      },
    });

    await tx.stockMovement.create({
      data: {
        productId: inv.productId,
        branchId: inv.branchId,
        warehouseId: inv.warehouseId,
        quantity: diff,
        movementType: diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
        referenceType: 'MANUAL_ADJUST',
        reason,
        performedBy: user.id,
      },
    });

    return updated;
  });

  await logAudit({
    userId: user.id,
    action: 'inventory.adjust',
    entityType: 'Inventory',
    entityId: inventoryId,
    metadata: {
      productId: inv.productId,
      productName: inv.product.name,
      from: inv.quantityOnHand,
      to: newQuantity,
      reason,
    },
    ipAddress: getClientIp(req),
  });

  return ok({ inventory: result });
});
