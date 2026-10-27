// PATCH /api/content/[id] - update content draft (review, approve, reject, publish)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const PATCH = apiHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const { action, content: newContent, reviewNotes } = body;

  const draft = await db.contentDraft.findUnique({ where: { id } });
  if (!draft) return notFound('Content draft not found');

  const updateData: any = { reviewedBy: user.id };

  if (action === 'submit_review') {
    if (!hasPermission(user, 'content.create' as any)) return forbidden();
    updateData.status = 'IN_REVIEW';
  } else if (action === 'approve') {
    if (!hasPermission(user, 'content.review' as any)) return forbidden();
    updateData.status = 'APPROVED';
  } else if (action === 'reject') {
    if (!hasPermission(user, 'content.review' as any)) return forbidden();
    updateData.status = 'REJECTED';
  } else if (action === 'publish') {
    if (!hasPermission(user, 'content.publish' as any)) return forbidden();
    if (draft.status !== 'APPROVED') return badRequest('Only approved content can be published');
    updateData.status = 'PUBLISHED';

    // If this is a product description, update the product
    if (draft.productId) {
      if (draft.type === 'PRODUCT_DESC_BN' || draft.type === 'PRODUCT_DESC_EN') {
        await db.product.update({
          where: { id: draft.productId },
          data: { fullDescription: draft.content },
        });
      } else if (draft.type === 'SEO_TITLE') {
        await db.product.update({
          where: { id: draft.productId },
          data: { metaTitle: draft.content.slice(0, 60) },
        });
      } else if (draft.type === 'META_DESC') {
        await db.product.update({
          where: { id: draft.productId },
          data: { metaDescription: draft.content.slice(0, 155) },
        });
      }
    }
  } else if (action === 'edit') {
    if (!hasPermission(user, 'content.create' as any)) return forbidden();
    updateData.content = newContent;
    updateData.version = { increment: 1 };
  } else {
    return badRequest('Invalid action');
  }

  const updated = await db.contentDraft.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    userId: user.id,
    action: `content.${action}`,
    entityType: 'ContentDraft',
    entityId: id,
    metadata: { type: draft.type, productId: draft.productId },
    ipAddress: getClientIp(req),
  });

  return ok({ draft: updated });
});
