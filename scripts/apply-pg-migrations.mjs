import fs from 'node:fs';
import path from 'node:path';

function sqlLiteToPostgres(sql) {
  let out = sql;
  out = out.replace(/(?<!\w)("?\w+"?)\s+INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, '$1 SERIAL PRIMARY KEY');
  // `id INTEGER PRIMARY KEY` alone should become SERIAL
  out = out.replace(/(?<![A-Za-z_])id\s+INTEGER\s+PRIMARY\s+KEY(?!\s*AUTOINCREMENT)(?![A-Za-z_])/gi, 'id SERIAL PRIMARY KEY');
  out = out.replace(/\bBLOB\b/gi, 'BYTEA');
  out = out.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  out = out.replace(/\bCOLLATE\s+NOCASE\b/gi, '');
  out = out.replace(/\(strftime\('%Y-%m-%dT%H:%M:%fZ',\s*'now'\)\)/gi, 'NOW()');
  out = out.replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, 'DEFAULT NOW()');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(is_demo IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(is_active IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(is_published IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(verified IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(price_verified IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(enabled IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(mfa_enabled IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(mfa_passed IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 0 CHECK \(is_system IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT FALSE');
  out = out.replace(/INTEGER NOT NULL DEFAULT 1 CHECK \(is_system IN \(0,1\)\)/gi, 'BOOLEAN NOT NULL DEFAULT TRUE');
  out = out.replace(/INTEGER\s+NOT\s+NULL\s+DEFAULT\s+([01])\s+CHECK\s*\(\s*\w+\s+IN\s*\(0,1\)\s*\)/gi, (m, d) => `BOOLEAN NOT NULL DEFAULT ${d === '1' ? 'TRUE' : 'FALSE'}`);
  // Parameter placeholders
  let i = 0;
  out = out.replace(/\?/g, () => `$${++i}`);
  return out;
}

const dir = 'db/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
let out = '';
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir,f),'utf8');
  out += `\n-- ${f}\n` + sqlLiteToPostgres(raw) + '\n';
}
fs.writeFileSync('/tmp/pg-migrations.sql', out);
console.log('Total bytes:', out.length);
