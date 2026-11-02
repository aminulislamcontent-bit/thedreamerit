/** Backup creation + verification shared by CLI scripts and the admin action. */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { db, openDatabase } from './database';
import { registerBackup, listBackups, markBackupIntegrity, markRestoreTested, log } from './monitoring';

export function databasePath(): string {
  const configured = process.env.DATABASE_PATH || './data/app.db';
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function performBackup(): { id: number; file: string; checksum: string; size: number; uploadsSnapshot: string | null } {
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  db().exec('PRAGMA wal_checkpoint(TRUNCATE);'); // consistent copy
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(dir, `app-${stamp}.db`);
  fs.copyFileSync(databasePath(), target);
  const checksum = createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  const size = fs.statSync(target).size;
  const uploads = path.join(process.cwd(), 'uploads');
  let uploadsSnapshot: string | null = null;
  const mediaTarget = path.join(dir, `uploads-${stamp}`);
  if (fs.existsSync(uploads)) { fs.cpSync(uploads, mediaTarget, { recursive: true }); uploadsSnapshot = path.relative(process.cwd(), mediaTarget); }
  const id = registerBackup(path.relative(process.cwd(), target), checksum, size);
  log('info', 'Database backup created', { id, checksum, size });
  return { id, file: path.relative(process.cwd(), target), checksum, size, uploadsSnapshot };
}

export function verifyBackup(relativePath: string): { ok: boolean; reason?: string; tables?: number; checksum?: string } {
  const file = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(file)) return { ok: false, reason: 'Backup file not found.' };
  const checksum = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const record = listBackups().find((b) => String(b.file_path) === relativePath);
  if (record && String(record.checksum) !== checksum) {
    markBackupIntegrity(Number(record.id), 'corrupt');
    return { ok: false, reason: 'Checksum mismatch — backup marked corrupt.' };
  }
  const scratch = path.join(process.cwd(), 'data', `restore-test-${Date.now()}.db`);
  fs.copyFileSync(file, scratch);
  let integrity = 'error';
  let tables = 0;
  try {
    const d = openDatabase(scratch);
    integrity = String((d.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check);
    tables = Number((d.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get() as { n: number }).n);
    d.close();
  } finally {
    fs.rmSync(scratch, { force: true });
  }
  if (integrity !== 'ok' || tables === 0) {
    if (record) markBackupIntegrity(Number(record.id), 'corrupt');
    return { ok: false, reason: `Restore test failed (integrity=${integrity}, tables=${tables}).` };
  }
  if (record) { markBackupIntegrity(Number(record.id), 'verified'); markRestoreTested(Number(record.id)); }
  log('info', 'Backup integrity and test restore verified', { relativePath, tables });
  return { ok: true, tables, checksum };
}
