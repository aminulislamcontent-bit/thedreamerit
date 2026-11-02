/** DB-backed maintenance jobs. Every due job is claimed and recorded in one serialized transaction. */

import { all, get, nowIso, run, scalar, transaction } from './database';
import { log } from './monitoring';

export type ScheduledJobDefinition = {
  name: string;
  description: string;
  intervalMinutes: number;
};

export const SCHEDULED_JOB_DEFINITIONS: readonly ScheduledJobDefinition[] = [
  { name: 'expired_session_cleanup', description: 'Delete expired session rows.', intervalMinutes: 60 },
  { name: 'rate_limit_cleanup', description: 'Delete rate-limit hits older than 24 hours.', intervalMinutes: 60 },
  { name: 'failed_job_alert', description: 'Log a warning when open failed jobs require operator attention.', intervalMinutes: 60 },
  { name: 'backup_freshness_check', description: 'Check whether a verified backup exists in the last 24 hours.', intervalMinutes: 360 },
  { name: 'catalogue_gate_snapshot', description: 'Record actual catalogue counts without publishing or inferring data.', intervalMinutes: 1440 },
  { name: 'job_run_retention', description: 'Delete scheduled-job run records older than 30 days.', intervalMinutes: 1440 },
];

type ScheduledJobRow = {
  id: number;
  name: string;
  interval_minutes: number;
  enabled: number;
  next_run_at: string;
  last_run_at: string | null;
};

export type JobRunSummary = { at: string; due: number; ran: string[]; failed: string[] };

function plusMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

function minusMillis(iso: string, millis: number): string {
  return new Date(Date.parse(iso) - millis).toISOString();
}

export function ensureScheduledJobs(at: string = nowIso()): void {
  for (const definition of SCHEDULED_JOB_DEFINITIONS) {
    run(`INSERT OR IGNORE INTO scheduled_jobs
      (name, description, interval_minutes, enabled, next_run_at, created_at)
      VALUES (?, ?, ?, 1, ?, ?)`,
      [definition.name, definition.description, definition.intervalMinutes, at, at]);
  }
}

type JobHandler = (at: string) => string;

const HANDLERS: Record<string, JobHandler> = {
  expired_session_cleanup: (at) => {
    const result = run('DELETE FROM sessions WHERE expires_at <= ?', [at]);
    return `Deleted ${result.changes} expired session(s).`;
  },
  rate_limit_cleanup: (at) => {
    const cutoff = minusMillis(at, 24 * 60 * 60 * 1000);
    const result = run('DELETE FROM rate_limit_hits WHERE created_at < ?', [cutoff]);
    return `Deleted ${result.changes} rate-limit hit(s) older than 24h.`;
  },
  failed_job_alert: () => {
    const open = scalar("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'");
    if (open > 0) log('warn', 'Open failed jobs require operator attention', { open });
    return `${open} open failed job(s).`;
  },
  backup_freshness_check: (at) => {
    const cutoff = minusMillis(at, 24 * 60 * 60 * 1000);
    const verified = scalar("SELECT COUNT(*) AS n FROM backups WHERE integrity_status = 'verified' AND created_at >= ?", [cutoff]);
    if (verified === 0) log('warn', 'No verified backup in the last 24 hours', { checkedAfter: cutoff });
    else log('info', 'Backup freshness check', { verifiedBackupsLast24h: verified });
    return `${verified} verified backup(s) in the last 24h.`;
  },
  catalogue_gate_snapshot: () => {
    const active = scalar('SELECT COUNT(*) AS n FROM categories WHERE is_active = 1');
    const verified = scalar("SELECT COUNT(*) AS n FROM products WHERE is_demo = 0 AND verification_status = 'verified'");
    const published = scalar("SELECT COUNT(*) AS n FROM products WHERE is_demo = 0 AND status = 'published'");
    log('info', 'Scheduled catalogue gate snapshot', { activeCategories: active, verifiedModels: verified, publishedProducts: published });
    return `active=${active}, verified non-demo models=${verified}, published=${published}; per-category shortfall is computed by Admin → Catalogue.`;
  },
  job_run_retention: (at) => {
    const cutoff = minusMillis(at, 30 * 24 * 60 * 60 * 1000);
    const result = run('DELETE FROM scheduled_job_runs WHERE started_at < ?', [cutoff]);
    return `Deleted ${result.changes} job-run record(s) older than 30 days.`;
  },
};

/** Runs all due jobs once. Safe to call from CLI, cron, or the in-process scheduler. */
export function runDueJobs(at: string = nowIso()): JobRunSummary {
  ensureScheduledJobs(at);
  return transaction(() => {
    const due = all<ScheduledJobRow>(
      'SELECT id, name, interval_minutes, enabled, next_run_at, last_run_at FROM scheduled_jobs WHERE enabled = 1 AND next_run_at <= ? ORDER BY next_run_at, id',
      [at],
    );
    const ran: string[] = [];
    const failed: string[] = [];

    for (const job of due) {
      const startedAt = nowIso();
      const runId = Number(run(
        "INSERT INTO scheduled_job_runs (job_id, started_at, status, detail) VALUES (?, ?, 'running', '')",
        [job.id, startedAt],
      ).lastInsertRowid);
      try {
        const handler = HANDLERS[job.name];
        if (!handler) throw new Error(`No handler registered for ${job.name}`);
        const detail = handler(startedAt);
        const finishedAt = nowIso();
        run("UPDATE scheduled_job_runs SET finished_at = ?, status = 'succeeded', detail = ? WHERE id = ?", [finishedAt, detail, runId]);
        run('UPDATE scheduled_jobs SET last_run_at = ?, next_run_at = ? WHERE id = ?', [finishedAt, plusMinutes(at, job.interval_minutes), job.id]);
        ran.push(job.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const finishedAt = nowIso();
        run("UPDATE scheduled_job_runs SET finished_at = ?, status = 'failed', detail = '', error = ? WHERE id = ?", [finishedAt, message, runId]);
        // Retry a failed job sooner than its normal interval, but never in a tight loop.
        run('UPDATE scheduled_jobs SET last_run_at = ?, next_run_at = ? WHERE id = ?', [finishedAt, plusMinutes(at, Math.min(job.interval_minutes, 15)), job.id]);
        log('error', `Scheduled job failed: ${job.name}`, { error: message });
        failed.push(job.name);
      }
    }
    return { at, due: due.length, ran, failed };
  });
}

/** Starts an optional in-process scheduler. External cron is still recommended for production. */
export function startInternalScheduler(): void {
  if (process.env.ENABLE_INTERNAL_SCHEDULER === '0') return;
  const globalState = globalThis as typeof globalThis & { __dreameritSchedulerStarted?: boolean };
  if (globalState.__dreameritSchedulerStarted) return;
  globalState.__dreameritSchedulerStarted = true;

  const configured = Number(process.env.SCHEDULER_INTERVAL_MS || 60_000);
  const intervalMs = Number.isFinite(configured) ? Math.max(30_000, configured) : 60_000;
  const tick = () => {
    try { runDueJobs(); }
    catch (error) { console.error('[scheduler] tick failed', error); }
  };
  const initial = setTimeout(tick, 5_000);
  const timer = setInterval(tick, intervalMs);
  initial.unref?.();
  timer.unref?.();
}

export function schedulerStatus() {
  ensureScheduledJobs();
  const jobs = all<{ name: string; description: string; interval_minutes: number; enabled: number; last_run_at: string | null; next_run_at: string }>(
    'SELECT name, description, interval_minutes, enabled, last_run_at, next_run_at FROM scheduled_jobs ORDER BY name',
  );
  const lastRun = get<{ job_id: number; started_at: string; finished_at: string | null; status: string; detail: string; error: string | null }>(
    'SELECT job_id, started_at, finished_at, status, detail, error FROM scheduled_job_runs ORDER BY id DESC LIMIT 1',
  ) ?? null;
  return {
    internalEnabled: process.env.ENABLE_INTERNAL_SCHEDULER !== '0',
    intervalMs: (() => {
      const configured = Number(process.env.SCHEDULER_INTERVAL_MS || 60_000);
      return Number.isFinite(configured) ? Math.max(30_000, configured) : 60_000;
    })(),
    jobs,
    lastRun,
    openFailedJobs: scalar("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'"),
  };
}
