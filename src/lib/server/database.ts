/**
 * Dual-driver database layer.
 *
 * When DATABASE_URL is set (Postgres, e.g. Supabase), queries go through `pg.Pool`.
 * Otherwise we fall back to a local SQLite file via node:sqlite (dev/offline).
 *
 * Transactions are transparent: any `run`/`get`/`all`/`scalar` issued inside
 * `transaction(() => ...)` reuses the same client via AsyncLocalStorage, so
 * existing call sites don't need to thread a `tx` object through.
 */

import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

export type SqlValue = string | number | bigint | boolean | null | Uint8Array | Date;
export type Row = Record<string, unknown>;

let pgPool: import('pg').Pool | null = null;
async function getPgPool(): Promise<import('pg').Pool> {
  if (pgPool) return pgPool;
  const { Pool } = await import('pg');
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pgPool.query('SELECT 1');
  return pgPool;
}

function hasPgUrl() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_PATH;
}

let sqliteInstance: import('node:sqlite').DatabaseSync | null = null;
function getSqliteSync(): import('node:sqlite').DatabaseSync {
  if (sqliteInstance) return sqliteInstance;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite');
  const file = resolveSqlitePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  try { db.exec('PRAGMA journal_mode = WAL;'); } catch { /* some FS disallow WAL */ }
  sqliteInstance = db;
  return db;
}

function resolveSqlitePath(): string {
  const configured = process.env.DATABASE_PATH || './data/app.db';
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Driver init                                                        */
/* ------------------------------------------------------------------ */

type Driver =
  | { kind: 'pg'; pool: import('pg').Pool; migrationsApplied: string[]; seeded: boolean }
  | { kind: 'sqlite'; db: import('node:sqlite').DatabaseSync; migrationsApplied: string[]; seeded: boolean };

let driverPromise: Promise<Driver> | null = null;

export async function getDriver(): Promise<Driver> {
  if (!driverPromise) driverPromise = buildDriver();
  return driverPromise;
}

async function buildDriver(): Promise<Driver> {
  if (hasPgUrl()) {
    const pool = await getPgPool();
    const migrationsApplied = await applyPostgresMigrations(pool);
    const seeded = await applyPostgresSeed(pool);
    return { kind: 'pg', pool, migrationsApplied, seeded };
  }
  const db = getSqliteSync();
  const migrationsApplied = applySqliteMigrationsSync(db);
  const catRow = db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number } | undefined;
  const catCount = Number(catRow?.n ?? 0);
  const seeded = catCount === 0;
  if (seeded) {
    const { seedBaseline } = await import('./seed');
    seedBaseline(db, resolveSqlitePath());
  }
  return { kind: 'sqlite', db, migrationsApplied, seeded };
}

/* ------------------------------------------------------------------ */
/* Migrations (Postgres path)                                         */
/* ------------------------------------------------------------------ */

function sqlLiteToPostgres(sql: string): string {
  let out = sql;
  out = out.replace(
    /(?<!\w)("?\w+"?)\s+INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi,
    '$1 SERIAL PRIMARY KEY'
  );
  out = out.replace(
    /(?<!\w)("?\w+"?)\s+INTEGER\s+NOT\s+NULL\s+PRIMARY\s+KEY(?!\s*DEFAULT)/gi,
    '$1 SERIAL PRIMARY KEY'
  );
  out = out.replace(/\bBLOB\b/gi, 'BYTEA');
  out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  out = translatePlaceholders(out);
  return out;
}

function translatePlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function applyPostgresMigrations(pool: import('pg').Pool): Promise<string[]> {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const dir = path.join(process.cwd(), 'db', 'migrations');
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort(); } catch { files = []; }
  const applied: string[] = [];
  for (const file of files) {
    const existing = await pool.query<{ name: string }>('SELECT name FROM _migrations WHERE name = $1', [file]);
    if (existing.rowCount && existing.rowCount > 0) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const pgSql = sqlLiteToPostgres(raw);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(pgSql);
      await client.query('INSERT INTO _migrations (name, applied_at) VALUES ($1, $2)', [file, nowIso()]);
      await client.query('COMMIT');
      applied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  return applied;
}

async function applyPostgresSeed(pool: import('pg').Pool): Promise<boolean> {
  const res = await pool.query<{ n: string }>('SELECT COUNT(*)::text AS n FROM categories');
  if (Number(res.rows[0]?.n ?? 0) > 0) return false;
  const mod = await import('./seed-pg');
  const seed = (mod.seedBaselinePgImpl ?? mod.seedBaselinePg);
  await seed(pool);
  return true;
}

/* ------------------------------------------------------------------ */
/* Migrations (SQLite path — sync)                                    */
/* ------------------------------------------------------------------ */

function applySqliteMigrationsSync(db: import('node:sqlite').DatabaseSync): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
  const dir = path.join(process.cwd(), 'db', 'migrations');
  let files: string[] = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort(); } catch { files = []; }
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

/* ------------------------------------------------------------------ */
/* AsyncLocalStorage transaction context                              */
/* ------------------------------------------------------------------ */

const txStorage = new AsyncLocalStorage<import('pg').PoolClient>();

type PgQueryable = import('pg').PoolClient | import('pg').Pool;
async function pgQueryable(): Promise<PgQueryable> {
  return txStorage.getStore() ?? (await getDriver() as Extract<Driver, { kind: 'pg' }>).pool;
}

type PgParam = string | number | bigint | boolean | null | Buffer | Date;

async function queryOnPg<T extends Row = Row>(sql: string, params: PgParam[] = []): Promise<T[]> {
  const q = await pgQueryable();
  const pgSql = translatePlaceholders(sql);
  const res = await q.query(pgSql, params);
  return (res.rows ?? []) as T[];
}

function toPgParams(params: SqlValue[]): PgParam[] {
  return params.map((v) => {
    if (v instanceof Uint8Array) return Buffer.from(v);
    return v as PgParam;
  });
}

/* ------------------------------------------------------------------ */
/* Public query API                                                   */
/* ------------------------------------------------------------------ */

export async function all<T extends Row = Row>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  const driver = await getDriver();
  if (driver.kind === 'pg') {
    return queryOnPg<T>(sql, toPgParams(params));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return driver.db.prepare(sql).all(...(params as any)) as T[];
}

export async function get<T extends Row = Row>(sql: string, params: SqlValue[] = []): Promise<T | undefined> {
  const driver = await getDriver();
  if (driver.kind === 'pg') {
    const rows = await queryOnPg<T>(sql, toPgParams(params));
    return rows[0];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return driver.db.prepare(sql).get(...(params as any)) as T | undefined;
}

export async function run(sql: string, params: SqlValue[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const driver = await getDriver();
  if (driver.kind === 'pg') {
    const q = await pgQueryable();
    const pgSql = translatePlaceholders(sql);
    const res = await q.query(pgSql, toPgParams(params));
    const lastInsertRowid = res.rows?.[0]?.id != null ? Number(res.rows[0].id) : 0;
    return { changes: res.rowCount ?? 0, lastInsertRowid };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (driver.db.prepare(sql) as any).run(...params);
  return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
}

export async function transaction<T>(fn: () => Promise<T> | T): Promise<T> {
  const driver = await getDriver();
  if (driver.kind === 'sqlite') {
    driver.db.exec('SAVEPOINT sp');
    try {
      const result = await fn();
      driver.db.exec('RELEASE sp');
      return result;
    } catch (err) {
      try { driver.db.exec('ROLLBACK TO sp'); } catch { /* ignore */ }
      throw err;
    }
  }
  const client = await driver.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await txStorage.run(client, fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* already rolled back */ }
    throw error;
  } finally {
    client.release();
  }
}

export async function scalar(sql: string, params: SqlValue[] = []): Promise<number> {
  const row = await get<Record<string, unknown>>(sql, params);
  if (!row) return 0;
  const v = Object.values(row)[0];
  return Number(v ?? 0);
}

export async function exec(sql: string): Promise<void> {
  const driver = await getDriver();
  if (driver.kind === 'pg') {
    await driver.pool.query(sqlLiteToPostgres(sql));
  } else {
    driver.db.exec(sql);
  }
}

export async function initializeDatabase(): Promise<{ driver: 'pg' | 'sqlite'; migrationsApplied: string[]; seeded: boolean }> {
  const d = await getDriver();
  return { driver: d.kind, migrationsApplied: d.migrationsApplied, seeded: d.seeded };
}

/* ------------------------------------------------------------------ */
/* Sync helpers retained for CLI/test usage (SQLite only)             */
/* ------------------------------------------------------------------ */

export function openDatabase(file: string): import('node:sqlite').DatabaseSync {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA foreign_keys = ON;');
  return d;
}

/** Sync SQLite handle — only usable when DATABASE_URL is NOT set. Legacy for tests/scripts. */
export function db(): import('node:sqlite').DatabaseSync {
  if (hasPgUrl()) throw new Error('db() sync handle is unavailable when DATABASE_URL is set');
  return getSqliteSync();
}
