import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files "src/app/**/page.tsx" "src/app/**/route.ts" "src/app/**/default.tsx" 2>/dev/null', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

// Add `async` before `export default function`/`export async function` GET/POST etc in route files.
// Simple approach: ensure every `export default function` becomes `export default async function`, and every `export function GET/POST/PUT/DELETE` becomes async.
let changed = 0;
for (const f of files) {
  let s = readFileSync(f, 'utf8');
  const orig = s;
  s = s.replace(/(export\s+default\s+)(function\s+)/g, (_m, a, b) => {
    if (/async\s+/.test(a + b)) return _m;
    changed++;
    return a + 'async ' + b;
  });
  s = s.replace(/(export\s+)(function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|generateMetadata|generateStaticParams)\b)/g, (_m, a, b) => {
    // check if async already before `function`
    if (/async\s+$/.test(a)) return _m;
    changed++;
    return a + 'async ' + b;
  });
  // Already-async top-level arrow like `const GET = async (...) =>` - OK.
  if (s !== orig) writeFileSync(f, s);
}
console.log('Made', changed, 'page/route functions async');
