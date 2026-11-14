'use server';

import { revalidatePath } from 'next/cache';
import { guard, field, intField, done, fail } from '@/lib/server/action-utils';
import { generateContentDraft, reviewDraft } from '@/lib/server/content';
import { approvePublishingJob, confirmPublication, createPublishingJob, submitPublishingJob } from '@/lib/server/social';
import { addRedirect, checkInternalLinks, runSeoChecks } from '@/lib/server/seo';
import { performBackup, verifyBackup } from '@/lib/server/backup';
import { resolveFailedJob } from '@/lib/server/monitoring';
import { run, nowIso } from '@/lib/server/database';
import type { DraftKind } from '@/lib/core/content-rules';

export async function generateDraftAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'content.generate');
  const productId = intField(fd, 'productId');
  const kind = field(fd, 'kind') as DraftKind;
  const locale = field(fd, 'locale') === 'en' ? 'en' : 'bn';
  if (!productId) fail('/admin/content', 'Select a product.');
  const result = await generateContentDraft(kind, locale, productId, user.id);
  if (!result.ok) fail('/admin/content', result.error || 'Draft generation failed.');
  revalidatePath('/admin/content');
  done('/admin/content', 'Draft created from verified fields only. Human approval is still required.');
}

export async function reviewDraftAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'content.approve');
  const id = intField(fd, 'draftId');
  const decision = field(fd, 'decision') === 'rejected' ? 'rejected' : 'approved';
  const result = await reviewDraft(id, decision, user.id);
  if (!result.ok) fail('/admin/content', result.error || 'Review failed.');
  revalidatePath('/admin/content');
  done('/admin/content', decision === 'approved' ? 'Draft approved for use.' : 'Draft rejected.');
}

export async function createPublishingJobAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'marketing.publish');
  const result = await createPublishingJob({
    platform: field(fd, 'platform'), draftId: intField(fd, 'draftId') || null,
    scheduledAt: field(fd, 'scheduledAt') || null,
  }, user.id);
  if (!result.ok) fail('/admin/social', result.error || 'Job rejected.');
  revalidatePath('/admin/social');
  done('/admin/social', 'Publishing job created and held for human approval.');
}

export async function approveJobAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'marketing.publish');
  const result = await approvePublishingJob(intField(fd, 'jobId'), user.id);
  if (!result.ok) fail('/admin/social', result.error || 'Approval failed.');
  revalidatePath('/admin/social');
  done('/admin/social', 'Job approved by a human; still not published.');
}

export async function submitJobAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'marketing.publish');
  const result = await submitPublishingJob(intField(fd, 'jobId'), user.id);
  if (!result.ok) fail('/admin/social', result.error || 'Submission failed.');
  revalidatePath('/admin/social');
  done('/admin/social', 'Submitted to platform; publication is recorded only after platform confirmation.');
}

export async function confirmPublicationAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'marketing.publish');
  const result = await confirmPublication(intField(fd, 'jobId'), {
    platformPostId: field(fd, 'platformPostId'), platformResponseJson: field(fd, 'platformResponseJson'),
  }, user.id);
  if (!result.ok) fail('/admin/social', result.error || 'Confirmation rejected.');
  revalidatePath('/admin/social');
  done('/admin/social', 'Publication confirmed with a recorded platform response.');
}

export async function runSeoChecksAction(fd: FormData): Promise<void> {
  await guard(fd, 'seo.manage');
  const result = runSeoChecks();
  const links = checkInternalLinks();
  revalidatePath('/admin/seo');
  done('/admin/seo', `${result.checked} pages checked, ${result.failures} failures; ${links.broken.length} unresolved internal links.`);
}

export async function addRedirectAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'seo.manage');
  const result = await addRedirect(field(fd, 'fromPath'), field(fd, 'toPath'), user.id);
  if (!result.ok) fail('/admin/seo', result.error || 'Redirect rejected.');
  revalidatePath('/admin/seo');
  done('/admin/seo', '301 redirect recorded.');
}

export async function createBackupAction(fd: FormData): Promise<void> {
  await guard(fd, 'backups.manage');
  try {
    const result = performBackup();
    revalidatePath('/admin/backups');
    done('/admin/backups', `Backup #${result.id} created (${result.size} bytes). Verify it before relying on it.`);
  } catch (error) { fail('/admin/backups', error instanceof Error ? error.message : 'Backup failed.'); }
}

export async function verifyBackupAction(fd: FormData): Promise<void> {
  await guard(fd, 'backups.manage');
  const result = verifyBackup(field(fd, 'file'));
  revalidatePath('/admin/backups');
  if (!result.ok) fail('/admin/backups', result.reason || 'Verification failed.');
  done('/admin/backups', `Checksum and test restore verified (${result.tables} tables).`);
}

export async function resolveFailedJobAction(fd: FormData): Promise<void> {
  await guard(fd, 'security.manage');
  resolveFailedJob(intField(fd, 'jobId'));
  revalidatePath('/admin/backups');
  done('/admin/backups', 'Failed job marked resolved.');
}

export async function createLeadAction(fd: FormData): Promise<void> {
  await guard(fd, 'crm.manage');
  const name = field(fd, 'name');
  if (!name) fail('/admin/crm', 'Lead name required.');
  run('INSERT INTO leads (name, phone, email, source, status, consent_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, field(fd, 'phone'), field(fd, 'email'), field(fd, 'source'), 'new', 0, nowIso()]);
  revalidatePath('/admin/crm');
  done('/admin/crm', 'Lead recorded; marketing consent is not assumed.');
}

export async function createTicketAction(fd: FormData): Promise<void> {
  await guard(fd, 'crm.manage');
  const subject = field(fd, 'subject');
  if (!subject) fail('/admin/crm', 'Ticket subject required.');
  run('INSERT INTO support_tickets (customer_id, subject, body, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [intField(fd, 'customerId') || null, subject, field(fd, 'body'), 'open', field(fd, 'priority') || 'normal', nowIso()]);
  revalidatePath('/admin/crm');
  done('/admin/crm', 'Support ticket created.');
}

export async function recordConsentAction(fd: FormData): Promise<void> {
  await guard(fd, 'customers.edit');
  const customerId = intField(fd, 'customerId');
  if (!customerId) fail('/admin/crm', 'Customer required.');
  run('INSERT INTO consent_records (customer_id, kind, granted, source, recorded_at) VALUES (?, ?, ?, ?, ?)',
    [customerId, field(fd, 'kind') || 'marketing', field(fd, 'granted') === '1' ? 1 : 0, field(fd, 'source') || 'in-person', nowIso()]);
  run('UPDATE customers SET consent_marketing = ? WHERE id = ?', [field(fd, 'granted') === '1' ? 1 : 0, customerId]);
  revalidatePath('/admin/crm');
  done('/admin/crm', 'Consent record stored with its source.');
}
