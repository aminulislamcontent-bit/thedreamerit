import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Iteratively run tsc and add 'async' at the correct function header for TS1308 errors.
// Only add async when the preceding construct is actually a function/method/arrow.

const RESERVED = new Set(['if','for','while','switch','catch','return','throw','new','typeof','void','delete','in','of','instanceof','else','do','try','finally','case','default','var','let','const','class','export','import','type','interface','implements','extends','yield']);

function runTsc() {
  try {
    execSync('npx tsc --noEmit 2>&1', { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    return null;
  } catch (e) {
    const errs = [];
    for (const line of (e.stdout||'').split('\n')) {
      const m = line.match(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$/);
      if (m) errs.push({ file:m[1], line:+m[2], col:+m[3], code:m[4], msg:m[5] });
    }
    return errs;
  }
}

function addAsync(src, line) {
  const lines = src.split('\n');
  for (let up = line-1; up >= Math.max(0, line-60); up--) {
    const l = lines[up];
    // Case 1: function declaration / expression
    let m = l.match(/^(\s*)(export\s+)?(export\s+default\s+)?(async\s+)?function\b/);
    if (m && !m[4]) {
      lines[up] = l.replace(/\bfunction\b/, 'async function');
      return lines.join('\n');
    }
    // Case 2: const/let/var ... =  arrow; scan for => within next ~6 lines
    if ((m = l.match(/^(\s*)(export\s+)?(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(async\s*)?/))) {
      if (!m[5]) {
        for (let f=up; f<=Math.min(lines.length-1, up+6); f++) if (/=>/.test(lines[f])) {
          lines[up] = l.replace(/(=\s*)/, '$1async ');
          return lines.join('\n');
        }
      }
    }
    // Case 3: object/class method — start-of-line identifier followed by '(' then '{', NOT a keyword
    if ((m = l.match(/^(\s*)(static\s+|get\s+|set\s+)?(async\s+)?([A-Za-z_$][\w$]*)\s*\(/))) {
      const name = m[4];
      if (!RESERVED.has(name) && !m[3]) {
        // Look ahead for opening '{'
        let sawBrace = false;
        for (let f=up; f<=Math.min(lines.length-1, up+4); f++) { if (/\{/.test(lines[f])) { sawBrace = true; break; } if (/;\s*$/.test(lines[f])) break; }
        if (sawBrace) {
          lines[up] = l.replace(/^(\s*)/, '$1async ');
          return lines.join('\n');
        }
      }
    }
    // Case 4: inline arrow in args (.map(async ...)), but ONLY when we see `(` or `,` before it on the same line
    if ((m = l.match(/(\(|,\s*)(async\s*)?(\([^)]*\)|\w+)\s*=>/))) {
      // Need to confirm this arrow is on a line within the function we're trying to fix and isn't already async
      if (!m[2]) {
        const idx = l.indexOf(m[1]) + m[1].length;
        lines[up] = l.slice(0, idx) + 'async ' + l.slice(idx);
        return lines.join('\n');
      }
    }
  }
  return null;
}

let iter = 0;
let totalAdds = 0;
while (iter++ < 20) {
  const errs = runTsc();
  if (!errs) break;
  const ts1308 = errs.filter(e => e.code === '1308');
  if (!ts1308.length) break;
  const byFile = new Map();
  for (const e of ts1308) {
    if (!byFile.has(e.file)) byFile.set(e.file, new Set());
    byFile.get(e.file).add(e.line);
  }
  let progress = false;
  for (const [file, lineSet] of byFile) {
    let src = readFileSync(file, 'utf8');
    for (const ln of [...lineSet].sort((a,b)=>b-a)) {
      const nxt = addAsync(src, ln);
      if (nxt && nxt !== src) { src = nxt; totalAdds++; progress = true; }
    }
    writeFileSync(file, src);
  }
  if (!progress) break;
}
console.log('Added async', totalAdds, 'times; iterations', iter-1);
