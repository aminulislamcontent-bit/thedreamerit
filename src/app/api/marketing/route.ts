// Marketing Campaigns API
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'marketing.view' as any)) return forbidden();

  const campaigns = await db.marketingCampaign.findMany({
    include: { _count: { select: { coupons: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok({ campaigns });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'marketing.manage' as any)) return forbidden();

  const body = await req.json();
  const { name, description, type, startDate, endDate, budget } = body;

  if (!name || !type || !startDate || !endDate) {
    return badRequest('Name, type, start date, and end date are required');
  }

  const campaign = await db.marketingCampaign.create({
    data: {
      name,
      description: description || null,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: budget || 0,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'campaign.create',
    entityType: 'MarketingCampaign',
    entityId: campaign.id,
    metadata: { name, type },
    ipAddress: getClientIp(req),
  });

  return ok({ campaign });
});
