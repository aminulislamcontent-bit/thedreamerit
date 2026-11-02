# Scheduled jobs

The app has a DB-backed maintenance runner. Jobs are defined in `src/lib/server/jobs.ts`, registered idempotently in `scheduled_jobs`, and each execution is recorded in `scheduled_job_runs`. `runDueJobs()` claims due rows inside a `BEGIN IMMEDIATE` transaction, so multiple workers cannot run the same due job twice.

## Jobs

| Job | Interval | Effect |
| --- | --- | --- |
| `expired_session_cleanup` | 60 min | Deletes expired sessions. |
| `rate_limit_cleanup` | 60 min | Deletes rate-limit hits older than 24 h. |
| `failed_job_alert` | 60 min | Logs a warning when open failed jobs need operator attention. Does not resolve them. |
| `backup_freshness_check` | 6 h | Checks for a verified backup in the last 24 h and logs a warning if none exists. Does not create or claim an off-site backup. |
| `catalogue_gate_snapshot` | 24 h | Records actual active-category, verified-model and published-product counts. Per-category shortfall remains in `Admin → Catalogue`. |
| `job_run_retention` | 24 h | Deletes job-run records older than 30 days. |

## Runners

- **In-process:** `ENABLE_INTERNAL_SCHEDULER=1` (default) starts a `setInterval` tick from `src/instrumentation.ts`. Set `ENABLE_INTERNAL_SCHEDULER=0` when an external scheduler is the only desired runner. `SCHEDULER_INTERVAL_MS` defaults to `60000` and is clamped to a minimum of `30000`.
- **CLI / cron:** `npm run jobs:tick` performs exactly one tick and prints the result plus `schedulerStatus()`.
- **Health:** `GET /api/health` includes `scheduler` with job definitions, last run, internal-runner flag and open failed jobs.
- **Admin:** `Admin → Security` shows the same status.

Example crontab when the internal runner is disabled:

```cron
*/5 * * * * cd /srv/dreamerit && npm run jobs:tick >> /var/log/dreamerit-jobs.log 2>&1
0 2 * * *  cd /srv/dreamerit && npm run backup >> /var/log/dreamerit-backup.log 2>&1
5 2 * * *  cd /srv/dreamerit && npm run verify:backup -- "$(ls -t backups/app-*.db | head -1)" >> /var/log/dreamerit-backup.log 2>&1
0 3 * * *  cd /srv/dreamerit && npm run media:derivatives >> /var/log/dreamerit-media.log 2>&1
```

External email/SMS delivery, off-site backup upload, social scheduling and payment reconciliation remain blocked until the owner supplies authorized credentials. The scheduler never marks those integrations as connected.
