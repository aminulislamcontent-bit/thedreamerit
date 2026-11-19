import fs from 'node:fs';
import path from 'node:path';

function sqlLiteToPostgres(sql) {
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
  // Convert ? to $N
  let i = 0;
  out = out.replace(/\?/g, () => `$${++i}`);
  // Fix INTEGER DEFAULT (strftime ...) for created_at columns → TIMESTAMPTZ DEFAULT NOW()
  out = out.replace(/TEXT\s+NOT\s+NULL\s+DEFAULT\s*\(strftime\([^)]+\)\)/gi, 'TIMESTAMPTZ NOT NULL DEFAULT NOW()');
  return out;
}

const dir = 'db/migrations';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let combined = '';
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  combined += `\n-- === ${f} ===\n` + sqlLiteToPostgres(raw) + '\n';
}
fs.writeFileSync('/tmp/pg-migrations.sql', combined);
console.log('wrote /tmp/pg-migrations.sql, bytes=' + combined.length);
