/** Application logging, failed-job tracking and backup records. */

import { all, get, run, nowIso } from './database';

export async function log(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}): Promise<void> {
  await run('INSERT INTO app_logs (level, message, context_json, created_at) VALUES (?, ?, ?, ?)', [level, message, JSON.stringify(context), nowIso()]);
}

export async function recordFailedJob(jobType: string, payload: Record<string, unknown>, error: string): Promise<void> {
  await run('INSERT INTO failed_jobs (job_type, payload_json, error, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [jobType, JSON.stringify(payload), error, 'open', nowIso()]);
  await log('error', `Failed job: ${jobType}`, { error, payload });
}

export async function resolveFailedJob(id: number): Promise<void> {
  await run("UPDATE failed_jobs SET status = 'resolved', resolved_at = ? WHERE id = ?", [nowIso(), id]);
}

export async function listFailedJobs() {
  return await all('SELECT * FROM failed_jobs ORDER BY created_at DESC LIMIT 200');
}

export async function registerBackup(filePath: string, checksum: string, sizeBytes: number): Promise<number> {
  const result = await run('INSERT INTO backups (file_path, checksum, size_bytes, integrity_status, created_at) VALUES (?, ?, ?, ?, ?)',
    [filePath, checksum, sizeBytes, 'unchecked', nowIso()]);
  return Number(result.lastInsertRowid);
}

export async function markBackupIntegrity(id: number, status: 'verified' | 'corrupt'): Promise<void> {
  await run('UPDATE backups SET integrity_status = ? WHERE id = ?', [status, id]);
}

export async function markRestoreTested(id: number): Promise<void> {
  await run('UPDATE backups SET restore_tested_at = ? WHERE id = ?', [nowIso(), id]);
}

export async function listBackups() {
  return await all('SELECT * FROM backups ORDER BY created_at DESC LIMIT 100');
}

export async function healthSnapshot() {
  const dbOk = !!await get('SELECT 1 AS ok');
  return {
    status: dbOk ? 'ok' : 'error',
    checkedAt: nowIso(),
    database: dbOk ? 'reachable' : 'unreachable',
    openFailedJobs: Number(((await get<{ n: number }>("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'"))?.n ?? 0)),
    lastBackup: await get<{ created_at: string; integrity_status: string; restore_tested_at: string | null }>('SELECT created_at, integrity_status, restore_tested_at FROM backups ORDER BY created_at DESC LIMIT 1') ?? null,
    integrations: await all('SELECT name, status, last_checked_at FROM integration_status ORDER BY name'),
  };
}
