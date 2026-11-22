/** Backup creation + verification shared by CLI scripts and the admin action. */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { all, getDriver } from './database';
import { registerBackup, listBackups, markBackupIntegrity, markRestoreTested, log } from './monitoring';

export function databasePath(): string {
  const configured = process.env.DATABASE_PATH || './data/app.db';
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

async function isSqlite(): Promise<boolean> {
  return (await getDriver()).kind === 'sqlite';
}

export async function performBackup(): Promise<{ id: number; file: string; checksum: string; size: number; uploadsSnapshot: string | null }> {
  const dir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  let file = '';
  let checksum = '';
  let size = 0;
  if (await isSqlite()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    const d = new DatabaseSync(databasePath());
    d.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    d.close();
    const target = path.join(dir, `app-${stamp}.db`);
    fs.copyFileSync(databasePath(), target);
    checksum = createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    size = fs.statSync(target).size;
    file = path.relative(process.cwd(), target);
  } else {
    file = `pg-logical-${stamp}.json`;
    const tables = await all<{ n: number }>("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    const meta = JSON.stringify({ note: 'Postgres relies on Supabase managed backups/PITR; this entry is a marker.', tables: tables[0]?.n ?? 0, takenAt: new Date().toISOString() });
    fs.writeFileSync(path.join(dir, file), meta);
    checksum = createHash('sha256').update(meta).digest('hex');
    size = Buffer.byteLength(meta);
  }
  const uploads = path.join(process.cwd(), 'uploads');
  let uploadsSnapshot: string | null = null;
  const mediaTarget = path.join(dir, `uploads-${stamp}`);
  if (fs.existsSync(uploads)) { fs.cpSync(uploads, mediaTarget, { recursive: true }); uploadsSnapshot = path.relative(process.cwd(), mediaTarget); }
  const id = await registerBackup(file, checksum, size);
  await log('info', 'Database backup created', { id, checksum, size });
  return { id, file, checksum, size, uploadsSnapshot };
}

/** Sync helper retained for CLI/backup scripts to open an isolated SQLite file (PG path ignores). */
function openSqlite(file: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA foreign_keys = ON;');
  return d;
}

export async function verifyBackup(relativePath: string): Promise<{ ok: boolean; reason?: string; tables?: number; checksum?: string }> {
  const file = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(file)) return { ok: false, reason: 'Backup file not found.' };
  const checksum = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const backups = await listBackups();
  const record = backups.find((b) => String((b as Record<string, unknown>).file_path) === relativePath) as Record<string, unknown> | undefined;
  if (record && String(record.checksum) !== checksum) {
    await markBackupIntegrity(Number(record.id), 'corrupt');
    return { ok: false, reason: 'Checksum mismatch — backup marked corrupt.' };
  }
  let tables: number | undefined;
  if (await isSqlite()) {
    const scratch = path.join(process.cwd(), 'data', `restore-test-${Date.now()}.db`);
    fs.copyFileSync(file, scratch);
    let integrity = 'error';
    tables = 0;
    try {
      const d = openSqlite(scratch);
      const row = d.prepare('PRAGMA integrity_check').get() as { integrity_check: string } | undefined;
      integrity = row ? String(row.integrity_check) : 'error';
      const t = d.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get() as { n: number } | undefined;
      tables = Number(t?.n ?? 0);
      d.close();
    } finally {
      fs.rmSync(scratch, { force: true });
    }
    if (integrity !== 'ok' || tables === 0) {
      if (record) await markBackupIntegrity(Number(record.id), 'corrupt');
      return { ok: false, reason: `Restore test failed (integrity=${integrity}, tables=${tables}).` };
    }
  } else {
    const ts = await all<{ n: number }>("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    tables = Number(ts[0]?.n ?? 0);
    if (tables === 0) return { ok: false, reason: 'No tables visible in public schema.' };
  }
  if (record) { await markBackupIntegrity(Number(record.id), 'verified'); await markRestoreTested(Number(record.id)); }
  await log('info', 'Backup integrity verified', { relativePath, tables });
  return { ok: true, tables, checksum };
}
