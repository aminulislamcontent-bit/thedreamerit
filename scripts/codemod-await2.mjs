import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// All database helpers that became async. Plus a few library-level helpers we know are called with `.map(...)` etc.
// We deliberately exclude names that commonly appear as methods on other objects and as TS keywords.
const ASYNC_FNS = [
  'all','get','run','scalar','exec','transaction',
];

// Match an ASYNC_FN name followed by optional generics and then '('. Only insert await when
// the character before the name is whitespace/start/operator/punctuator — not `.` or a word char.
// Also skip if the immediately preceding token is `function` (declaration), `=>`, or `async`.
function isBareCall(src, idx, name) {
  // skip if char before name is `.` or a word character (property/method)
  if (idx > 0) {
    const prev = src[idx - 1];
    if (prev === '.' || /\w/.test(prev)) return false;
  }
  // Look back through whitespace for the preceding token; reject if it's `function` or `async`.
  let k = idx - 1;
  while (k >= 0 && /\s/.test(src[k])) k--;
  if (k < 0) return true;
  // Read preceding word
  let e = k + 1;
  while (k >= 0 && /\w/.test(src[k])) k--;
  const prevWord = src.slice(k + 1, e);
  if (prevWord === 'function' || prevWord === 'async' || prevWord === 'class') return false;
  return true;
}

const files = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx" "scripts/*.ts" "tests/*.ts" 2>/dev/null', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

let total = 0;
const out = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  // Quick skip: files that don't import database helpers (or scripts which may call them unqualified)
  const importsDb = /from ['"]@\/lib\/server\/database['"]|from ['"]\.\.?\/.*database['"]/.test(src);
  if (!importsDb && !f.startsWith('scripts/')) continue;
  if (f.endsWith("src/lib/server/database.ts")) continue;
  // Build a replacement carefully by walking.
  let i = 0;
  const parts = [];
  let last = 0;
  let added = 0;

  const nameAlt = ASYNC_FNS.join('|');
  const re = new RegExp(`\\b(${nameAlt})\\s*(<[^>]*>)?\\s*\\(`, 'g');
  for (const m of src.matchAll(re)) {
    const idx = m.index;
    const name = m[1];
    const alreadyAwaited = (function () {
      let k = idx - 1;
      while (k >= 0 && /\s/.test(src[k])) k--;
      if (k < 4) return false;
      const wEnd = k + 1;
      while (k >= 0 && /\w/.test(src[k])) k--;
      return src.slice(k + 1, wEnd) === 'await';
    })();
    const isBare = isBareCall(src, idx, name);
    parts.push(src.slice(last, idx));
    if (isBare && !alreadyAwaited) { parts.push('await '); added++; total++; }
    parts.push(m[0]);
    last = idx + m[0].length;
  }
  parts.push(src.slice(last));
  if (added) writeFileSync(f, parts.join(''));
}
console.log('Inserted', total, 'awaits');
