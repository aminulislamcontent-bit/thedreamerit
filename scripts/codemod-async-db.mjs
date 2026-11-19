#!/usr/bin/env node
/**
 * Phase 1 ONLY: insert `await ` in front of bare all/get/run/scalar/exec/transaction calls.
 * Very conservative. We also add await before `transaction(` calls since transaction() is now async too.
 * Does NOT add `async` keywords — those will be handled separately.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

// Note: 'transaction' returns Promise now too.
const METHODS = ['all','get','run','scalar','exec','transaction'];
// Match a bare identifier (not preceded by dot or word char) that is one of the methods.
// But we also want to avoid matching method names on OTHER objects — e.g. `result.lastInsertRowid`
// doesn't match. We also avoid adding duplicate `await`s.
const METHOD_RE = new RegExp(`(?<![.\\w])\\b(${METHODS.join('|')})\\(`, 'g');

const TARGETS = [
  'src/lib/server/**/*.ts',
  'src/app/actions/**/*.ts',
  'src/app/api/**/*.ts',
  'src/app/**/page.tsx',
  'scripts/*.ts',
  'backup.ts',
];

async function fileList() {
  const out = [];
  for (const pat of TARGETS) for await (const f of glob(pat)) if (!out.includes(f)) out.push(f);
  return out.sort();
}

function insertAwaits(src) {
  const parts = [];
  let last = 0, added = 0;
  for (const m of src.matchAll(METHOD_RE)) {
    const idx = m.index;
    parts.push(src.slice(last, idx));
    // Examine up to 120 chars before the call.
    const before = src.slice(Math.max(0, idx - 120), idx);
    const trimmed = before.trimEnd();
    const prevChar = trimmed[trimmed.length - 1] || '';
    const alreadyAwaited = /\bawait$/.test(trimmed);
    // 'return' is OK (await after return). `yield` too (unused here).
    const prevIsDotOrIdent = prevChar === '.' || /\w/.test(prevChar);
    // Also check we aren't inside a member-access chain where the method name is
    // a property (e.g., `result.run`); the preceding char check handles `.run`.
    if (alreadyAwaited || prevIsDotOrIdent) {
      parts.push(m[0]);
    } else {
      parts.push('await ' + m[0]);
      added++;
    }
    last = idx + m[0].length;
  }
  parts.push(src.slice(last));
  return { out: parts.join(''), added };
}

let total = 0;
for (const f of await fileList()) {
  const src = readFileSync(f, 'utf8');
  if (!/from ['"]@\/lib\/server\/database['"]|from ['"]\.\.?\/.*database['"]/.test(src)) continue;
  const { out, added } = insertAwaits(src);
  if (added) { writeFileSync(f, out); total += added; }
}
console.log('Inserted', total, 'awaits');
