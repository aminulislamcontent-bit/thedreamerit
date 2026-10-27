// Reviews API
// GET  /api/reviews?productId=X - list reviews for a product
// POST /api/reviews - submit a review (verified purchase check)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');
  const status = url.searchParams.get('status') || 'APPROVED';

  if (!productId) return badRequest('Product ID is required');

  const user = await getSession();
  const isAdmin = user && hasPermission(user, 'products.view' as any);

  const reviews = await db.review.findMany({
    where: {
      productId,
      status: isAdmin ? (status || undefined) : 'APPROVED',
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return ok({
    reviews,
    summary: {
      total: reviews.length,
      average: Math.round(avgRating * 10) / 10,
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
      })),
    },
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user || !user.customer) return unauthorized('Login required to submit reviews');

  const body = await req.json();
  const { productId, rating, title, content } = body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return badRequest('Product ID and rating (1-5) are required');
  }
  if (!content || content.length < 10) {
    return badRequest('Review content must be at least 10 characters');
  }

  // Verify purchase
  const hasPurchased = await db.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerId: user.customer.id,
        status: 'DELIVERED',
      },
    },
  });

  const review = await db.review.create({
    data: {
      productId,
      customerId: user.customer.id,
      rating,
      title: title || null,
      content,
      isVerifiedPurchase: !!hasPurchased,
      status: 'PENDING', // All reviews require moderation
    },
  });

  await logAudit({
    userId: user.id,
    action: 'review.submit',
    entityType: 'Review',
    entityId: review.id,
    metadata: { productId, rating, verifiedPurchase: !!hasPurchased },
    ipAddress: getClientIp(req),
  });

  return ok({ review });
});
