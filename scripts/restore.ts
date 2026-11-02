/**
 * Restores a verified backup. By default it restores into a scratch database only.
 * Use --apply to replace the live database (stop the application first).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { openDatabase } from '../src/lib/server/database';

const args = process.argv.slice(2).filter((a) => a !== '--apply');
const apply = process.argv.includes('--apply');
const relative = args[0];
if (!relative) { console.error('Usage: npm run restore -- backups/app-<timestamp>.db [--apply]'); process.exit(1); }
const file = path.resolve(process.cwd(), relative);
if (!fs.existsSync(file)) { console.error('Backup not found:', file); process.exit(1); }
const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/app.db');
const scratch = path.join(process.cwd(), 'data', `restore-staging-${Date.now()}.db`);
fs.copyFileSync(file, scratch);
const d = openDatabase(scratch);
const integrity = (d.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check;
const count = Number((d.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n);
d.close();
if (integrity !== 'ok' || count === 0) { console.error('Restore validation failed:', { integrity, count }); fs.rmSync(scratch, { force: true }); process.exit(1); }
console.log('Restore validation passed:', { integrity, categories: count, sha256: createHash('sha256').update(fs.readFileSync(scratch)).digest('hex') });
if (apply) {
  fs.copyFileSync(scratch, dbPath);
  console.log('Live database replaced. Restart the application.');
} else {
  console.log('Dry run only. Add --apply to replace the live database (after stopping the app).');
}
fs.rmSync(scratch, { force: true });
