# Backup, integrity & restore

## What is backed up

- SQLite database (`DATABASE_PATH`, default `data/app.db`) — copied after `PRAGMA wal_checkpoint(TRUNCATE)` so the file is consistent.
- Uploaded product media (`uploads/`) copied to `backups/uploads-<timestamp>/`.
- A registry row in the `backups` table with file path, SHA-256 checksum, size, integrity status and restore-test timestamp.

## Create

```bash
npm run backup
# or: Admin → Backups → "এখনই ব্যাকআপ তৈরি করুন"
```

Output (actual run, 2026-11-02):

```
Backup #1 created: backups/app-2026-11-02T11-31-54-592Z.db
SHA-256: 8fb43e7696fd0d9b775c0a4d46040d6e340ae8a1b66eee766a2ba30cc71dfa87
Size: 581632 bytes
Media snapshot: backups/uploads-2026-11-02T11-31-54-592Z
```

## Verify integrity and perform a real test restore

```bash
npm run verify:backup -- backups/app-<timestamp>.db
```

The script (1) recomputes SHA-256 and compares it with the registry, (2) copies the backup to a scratch database, (3) runs `PRAGMA integrity_check`, (4) counts restored tables, (5) only then marks `integrity_status=verified` and `restore_tested_at`. A mismatch marks the backup `corrupt`.

Actual result: `Verified: checksum matches, integrity_check=ok, 74 tables restored into a scratch database.`

## Restore

```bash
# 1. Stop the application.
# 2. Dry run — validates integrity and categories without touching the live DB:
npm run restore -- backups/app-<timestamp>.db

# 3. Apply only after a successful dry run:
npm run restore -- backups/app-<timestamp>.db --apply

# 4. Restore uploaded media if needed (stop the app first):
cp -a backups/uploads-<timestamp>/. uploads/

# 5. Restart and check:
curl http://localhost:3000/api/health
```

Actual dry-run result: `Restore validation passed: { integrity: 'ok', categories: 105, sha256: '8fb43e76…' }`.

`--apply` was **not** executed. A backup is never described as restorable until the checksum and a scratch restore have both passed.

## Retention, off-site copies, monitoring

- Local retention is manual: keep N daily copies in `backups/` (excluded from Git). Automate with cron/systemd timer: `0 2 * * * cd /app && npm run backup && npm run verify:backup -- "$(ls -t backups/app-*.db | head -1)"`.
- Off-site encrypted storage (`OFFSITE_BACKUP_TARGET`) is **not configured** — an owner-provided destination is required before this can be called a production backup strategy.
- `/api/health` reports `lastBackup`, `integrity_status`, `restore_tested_at`, open failed jobs, integration status and `scheduler` state.
- The `backup_freshness_check` scheduled job logs a warning when no verified backup exists in the last 24 h; it does not create an off-site copy or claim one was tested.
- Failed backup/verification attempts are written to `app_logs` and `failed_jobs`.
- Deployment rollback: stop app → restore verified backup with `--apply` → redeploy the previous build/commit → verify `/api/health` and a few critical pages.

## Postgres / Supabase note

The local runtime uses Node's built-in SQLite. For production Postgres, port all three migrations in `db/migrations/` (types such as `INTEGER PRIMARY KEY` → `GENERATED ALWAYS AS IDENTITY`, `INSERT OR IGNORE` → `ON CONFLICT DO NOTHING`, `PRAGMA` → `pg_dump`/`pg_restore`, `strftime` → `to_char`). Backups would then use `pg_dump` + checksum + `pg_restore` into a scratch database. This porting work is **not implemented** and requires the owner's database decision/credentials.
