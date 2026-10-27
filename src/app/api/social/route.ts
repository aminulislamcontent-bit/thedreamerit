// Social Media Publishing API
// GET  /api/social - list publishing jobs
// POST /api/social - create / schedule / publish
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'marketing.view' as any)) return forbidden();

  const jobs = await db.publishingJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return ok({ jobs });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasPermission(user, 'marketing.manage' as any)) return forbidden();

  const body = await req.json();
  const { platform, title, content, mediaUrls, scheduledAt, campaignId } = body;

  if (!platform || !content) return badRequest('Platform and content are required');

  // Validate platform
  const validPlatforms = ['FACEBOOK', 'INSTAGROUP', 'YOUTUBE', 'WHATSAPP', 'WEBSITE'];
  if (!validPlatforms.includes(platform)) {
    return badRequest('Invalid platform. Supported: ' + validPlatforms.join(', '));
  }

  // Check if integration is configured
  const integration = await db.integrationConfig.findUnique({
    where: { name: platform + (platform === 'FACEBOOK' ? '_PAGES' : '') },
  });
  const integrationActive = integration?.status === 'ACTIVE';

  const job = await db.publishingJob.create({
    data: {
      platform,
      title: title || null,
      content,
      mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      campaignId: campaignId || null,
      createdById: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'social.job_create',
    entityType: 'PublishingJob',
    entityId: job.id,
    metadata: { platform, scheduledAt, integrationActive },
    ipAddress: getClientIp(req),
  });

  // IMPORTANT: We do NOT auto-publish to real platforms here.
  // Actual publishing requires authorized API credentials (Facebook Graph API, etc.)
  // which must be configured in IntegrationConfig by an admin.
  // If integration is not active, the job stays in DRAFT/SCHEDULED state
  // and an admin must manually approve + trigger publishing once the API is connected.

  return ok({
    job,
    warning: integrationActive
      ? null
      : `Integration for ${platform} is not active. Job created but cannot be auto-published until an authorized API connection is configured by an administrator.`,
  });
});
