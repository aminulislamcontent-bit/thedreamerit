/**
 * Social publishing workflow. A job is NEVER reported as published without a
 * confirmed response from the platform API. Without owner credentials, submission
 * fails explicitly and is recorded as a failed job.
 */

import { all, get, run, nowIso } from './database';
import { recordAudit } from './auth';
import { recordFailedJob } from './monitoring';

const PLATFORM_ENV: Record<string, string> = {
  facebook: 'FACEBOOK_PAGE_TOKEN',
  instagram: 'INSTAGRAM_BUSINESS_TOKEN',
  youtube: 'YOUTUBE_API_KEY',
  whatsapp: 'WHATSAPP_BUSINESS_TOKEN',
};

export async function createPublishingJob(input: { platform: string; draftId: number | null; scheduledAt: string | null; campaignId?: number | null }, userId: number): Promise<{ ok: boolean; error?: string; jobId?: number }> {
  const draft = input.draftId ? get<{ id: number; status: string }>('SELECT id, status FROM content_drafts WHERE id = ?', [input.draftId]) : null;
  if (input.draftId && (!draft || draft.status !== 'approved')) return { ok: false, error: 'Only an approved content draft can be scheduled.' };
  if (!(input.platform in PLATFORM_ENV)) return { ok: false, error: 'Unsupported platform.' };
  const result = run(`INSERT INTO publishing_jobs (platform, content_draft_id, campaign_id, scheduled_at, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'awaiting_approval', ?, ?, ?)`,
    [input.platform, input.draftId, input.campaignId ?? null, input.scheduledAt, userId, nowIso(), nowIso()]);
  await recordAudit('social.job_created', 'publishing_job', Number(result.lastInsertRowid), { platform: input.platform }, userId);
  return { ok: true, jobId: Number(result.lastInsertRowid) };
}

export async function approvePublishingJob(jobId: number, userId: number): Promise<{ ok: boolean; error?: string }> {
  const job = get<{ id: number; status: string }>('SELECT id, status FROM publishing_jobs WHERE id = ?', [jobId]);
  if (!job) return { ok: false, error: 'Job not found.' };
  if (job.status !== 'awaiting_approval') return { ok: false, error: 'Only jobs awaiting approval can be approved.' };
  run("UPDATE publishing_jobs SET status = 'approved', approved_by = ?, updated_at = ? WHERE id = ?", [userId, nowIso(), jobId]);
  await recordAudit('social.job_approved', 'publishing_job', jobId, {}, userId);
  return { ok: true };
}

/** Attempts submission. Fails loudly (never fabricates posting) when credentials are absent. */
export async function submitPublishingJob(jobId: number, userId: number): Promise<{ ok: boolean; error?: string; status: string }> {
  const job = get<{ id: number; platform: string; status: string; content_draft_id: number | null }>('SELECT * FROM publishing_jobs WHERE id = ?', [jobId]);
  if (!job) return { ok: false, error: 'Job not found.', status: 'failed' };
  if (job.status !== 'approved') return { ok: false, error: 'Human approval is required before submission.', status: job.status };
  const envName = PLATFORM_ENV[job.platform];
  if (!process.env[envName]) {
    const reason = `${envName} is not configured. Owner-authorized platform credentials are required.`;
    run("UPDATE publishing_jobs SET status = 'failed', failure_reason = ?, updated_at = ? WHERE id = ?", [reason, nowIso(), jobId]);
    await recordFailedJob('social_publishing', { jobId, platform: job.platform }, reason);
    await recordAudit('social.submission_failed', 'publishing_job', jobId, { reason }, userId);
    return { ok: false, error: reason, status: 'failed' };
  }
  run("UPDATE publishing_jobs SET status = 'submitted', updated_at = ? WHERE id = ?", [nowIso(), jobId]);
  await recordAudit('social.submitted', 'publishing_job', jobId, { note: 'Awaiting platform confirmation; not yet published' }, userId);
  return { ok: true, status: 'submitted' };
}

/** Only a recorded platform response may move a job to published. */
export async function confirmPublication(jobId: number, input: { platformPostId: string; platformResponseJson: string }, userId: number): Promise<{ ok: boolean; error?: string }> {
  const job = get<{ status: string }>('SELECT status FROM publishing_jobs WHERE id = ?', [jobId]);
  if (!job) return { ok: false, error: 'Job not found.' };
  if (job.status !== 'submitted') return { ok: false, error: 'Only submitted jobs can be confirmed.' };
  if (!input.platformPostId.trim() || !input.platformResponseJson.trim()) return { ok: false, error: 'A platform post id and the raw platform response are required.' };
  try { JSON.parse(input.platformResponseJson); } catch { return { ok: false, error: 'Platform response must be valid JSON.' }; }
  run("UPDATE publishing_jobs SET status = 'published', platform_post_id = ?, platform_response_json = ?, updated_at = ? WHERE id = ?",
    [input.platformPostId, input.platformResponseJson, nowIso(), jobId]);
  await recordAudit('social.published_confirmed', 'publishing_job', jobId, { platformPostId: input.platformPostId }, userId);
  return { ok: true };
}

export function listJobs() {
  return all(`SELECT j.*, d.locale, d.kind AS draft_kind FROM publishing_jobs j LEFT JOIN content_drafts d ON d.id = j.content_draft_id ORDER BY j.created_at DESC LIMIT 200`);
}
