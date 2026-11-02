import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedBaseline } from './seed';

export type SqlValue = string | number | bigint | null | Uint8Array;
export type Row = Record<string, unknown>;

let instance: DatabaseSync | null = null;

export function nowIso(): string {
  return new Date().toISOString();
}

function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH || './data/app.db';
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function applyMigrations(db: DatabaseSync): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  const dir = path.join(process.cwd(), 'db', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    const exists = db.prepare('SELECT 1 FROM _migrations WHERE name = ?').get(file);
    if (exists) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(file, nowIso());
      db.exec('COMMIT');
      applied.push(file);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return applied;
}

/** Opens the database, applies pending migrations and seeds baseline configuration. */
export function initializeDatabase(): { db: DatabaseSync; migrationsApplied: string[]; seeded: boolean } {
  const file = resolveDatabasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  try { db.exec('PRAGMA journal_mode = WAL;'); } catch { /* some filesystems disallow WAL */ }
  const migrationsApplied = applyMigrations(db);
  const categoryCount = (db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n;
  const seeded = categoryCount === 0;
  if (seeded) seedBaseline(db, file);
  return { db, migrationsApplied, seeded };
}

export function db(): DatabaseSync {
  if (!instance) instance = initializeDatabase().db;
  return instance;
}

/** Test/CLI helper: use an isolated database file. */
export function openDatabase(file: string): DatabaseSync {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA foreign_keys = ON;');
  return d;
}

export function all<T = Row>(sql: string, params: SqlValue[] = []): T[] {
  return db().prepare(sql).all(...params) as T[];
}

export function get<T = Row>(sql: string, params: SqlValue[] = []): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SqlValue[] = []): { changes: number; lastInsertRowid: number } {
  const result = db().prepare(sql).run(...params);
  return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
}

/** Serialised write transaction (BEGIN IMMEDIATE) to prevent overselling and lost updates. */
export function transaction<T>(fn: () => T): T {
  const d = db();
  d.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    d.exec('COMMIT');
    return result;
  } catch (error) {
    try { d.exec('ROLLBACK'); } catch { /* already rolled back */ }
    throw error;
  }
}

export function scalar(sql: string, params: SqlValue[] = []): number {
  const row = get<{ n: number | bigint | null }>(sql, params);
  return Number(row?.n ?? 0);
}
