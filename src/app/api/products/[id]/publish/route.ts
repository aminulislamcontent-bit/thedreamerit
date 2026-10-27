// POST /api/products/[id]/publish - publish or unpublish
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const POST = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'products.publish' as any)) return forbidden();

  const body = await req.json();
  const { publish } = body as { publish: boolean };

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound('Product not found');

  if (publish) {
    if (product.status !== 'APPROVED') {
      return badRequest('Only approved products can be published');
    }
    const updated = await db.product.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await logAudit({
      userId: user.id,
      action: 'product.publish',
      entityType: 'Product',
      entityId: id,
      metadata: { sku: product.sku },
      ipAddress: getClientIp(req),
    });
    return ok({ product: updated });
  } else {
    if (product.status !== 'PUBLISHED') {
      return badRequest('Product is not currently published');
    }
    const updated = await db.product.update({
      where: { id },
      data: { status: 'APPROVED' }, // back to approved state
    });
    await logAudit({
      userId: user.id,
      action: 'product.unpublish',
      entityType: 'Product',
      entityId: id,
      metadata: { sku: product.sku },
      ipAddress: getClientIp(req),
    });
    return ok({ product: updated });
  }
});
