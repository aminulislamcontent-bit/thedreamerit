// POST /api/products/[id]/approve - submit for review / approve / reject (workflow)
// Body: { action: 'submit' | 'approve' | 'reject', reason?: string }
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const POST = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { action, reason } = body as { action: string; reason?: string };

  const product = await db.product.findUnique({ where: { id } });
  if (!product) return notFound('Product not found');

  let newStatus: string;
  let auditAction: string;

  if (action === 'submit') {
    if (!hasPermission(user, 'products.edit' as any)) return forbidden();
    if (product.status !== 'DRAFT') return badRequest('Only draft products can be submitted for review');
    newStatus = 'PENDING_REVIEW';
    auditAction = 'product.submit_for_review';
  } else if (action === 'approve') {
    if (!hasPermission(user, 'products.approve' as any)) return forbidden();
    if (product.status !== 'PENDING_REVIEW') return badRequest('Only pending review products can be approved');
    newStatus = 'APPROVED';
    auditAction = 'product.approve';
  } else if (action === 'reject') {
    if (!hasPermission(user, 'products.approve' as any)) return forbidden();
    if (product.status !== 'PENDING_REVIEW') return badRequest('Only pending review products can be rejected');
    newStatus = 'DRAFT';
    auditAction = 'product.reject';
  } else {
    return badRequest('Invalid action. Use: submit, approve, or reject');
  }

  const updated = await db.product.update({
    where: { id },
    data: { status: newStatus },
  });

  await logAudit({
    userId: user.id,
    action: auditAction,
    entityType: 'Product',
    entityId: id,
    metadata: { sku: product.sku, name: product.name, newStatus, reason },
    ipAddress: getClientIp(req),
  });

  return ok({ product: updated });
});
