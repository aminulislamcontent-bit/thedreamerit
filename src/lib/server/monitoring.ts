/** Application logging, failed-job tracking and backup records. */

import { all, get, run, nowIso } from './database';

export function log(level: 'info' | 'warn' | 'error', message: string, context: Record<string, unknown> = {}): void {
  run('INSERT INTO app_logs (level, message, context_json, created_at) VALUES (?, ?, ?, ?)', [level, message, JSON.stringify(context), nowIso()]);
}

export async function recordFailedJob(jobType: string, payload: Record<string, unknown>, error: string): Promise<void> {
  run('INSERT INTO failed_jobs (job_type, payload_json, error, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [jobType, JSON.stringify(payload), error, 'open', nowIso()]);
  log('error', `Failed job: ${jobType}`, { error, payload });
}

export function resolveFailedJob(id: number): void {
  run("UPDATE failed_jobs SET status = 'resolved', resolved_at = ? WHERE id = ?", [nowIso(), id]);
}

export function listFailedJobs() {
  return all('SELECT * FROM failed_jobs ORDER BY created_at DESC LIMIT 200');
}

export function registerBackup(filePath: string, checksum: string, sizeBytes: number): number {
  const result = run('INSERT INTO backups (file_path, checksum, size_bytes, integrity_status, created_at) VALUES (?, ?, ?, ?, ?)',
    [filePath, checksum, sizeBytes, 'unchecked', nowIso()]);
  return Number(result.lastInsertRowid);
}

export function markBackupIntegrity(id: number, status: 'verified' | 'corrupt'): void {
  run('UPDATE backups SET integrity_status = ? WHERE id = ?', [status, id]);
}

export function markRestoreTested(id: number): void {
  run('UPDATE backups SET restore_tested_at = ? WHERE id = ?', [nowIso(), id]);
}

export function listBackups() {
  return all('SELECT * FROM backups ORDER BY created_at DESC LIMIT 100');
}

export function healthSnapshot() {
  const dbOk = !!get('SELECT 1 AS ok');
  return {
    status: dbOk ? 'ok' : 'error',
    checkedAt: nowIso(),
    database: dbOk ? 'reachable' : 'unreachable',
    openFailedJobs: Number((get<{ n: number }>("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'")?.n ?? 0)),
    lastBackup: get<{ created_at: string; integrity_status: string; restore_tested_at: string | null }>('SELECT created_at, integrity_status, restore_tested_at FROM backups ORDER BY created_at DESC LIMIT 1') ?? null,
    integrations: all('SELECT name, status, last_checked_at FROM integration_status ORDER BY name'),
  };
}
