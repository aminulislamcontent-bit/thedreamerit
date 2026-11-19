/**
 * Phase 2: run tsc repeatedly and add `async` only to genuine function headers,
 * avoiding if/for/while/switch/catch blocks.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const BLOCK_KEYWORDS = new Set(['if','for','while','switch','catch','do','try','finally','return','throw','new','typeof','void','delete','in','of','instanceof','else','case','default','var','let','const','class','export','import','type','interface','implements','extends','yield','function','async']);

function runTsc() {
  try {
    execSync('npx tsc --noEmit 2>&1', { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 50*1024*1024, stdio: ['ignore','pipe','pipe'] });
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

function findEnclosingFn(src, errLine) {
  const lines = src.split('\n');
  for (let up = errLine-1; up >= Math.max(0, errLine-80); up--) {
    const l = lines[up];
    // Function decl/expr: [export] [default] [async] function
    let m = l.match(/^(\s*)(export\s+)?(export\s+default\s+)?(async\s+)?function\b/);
    if (m) {
      if (!m[4]) return { line: up, kind: 'fn' };
      return null;
    }
    // Arrow in const/let/var
    if ((m = l.match(/^(\s*)(export\s+)?(const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?/))) {
      let sawArrow = false;
      for (let f=up; f<=Math.min(lines.length-1, up+8); f++) {
        if (/=>/.test(lines[f])) { sawArrow = true; break; }
        if (/;\s*$/.test(lines[f])) break;
      }
      if (sawArrow && !m[4]) return { line: up, kind: 'arrow' };
    }
    // Class/object method: identifier ( but not block keyword.
    // Match: leading whitespace, optional modifiers, name (
    if ((m = l.match(/^(\s*)(static\s+|get\s+|set\s+)?(async\s+)?([A-Za-z_$][\w$]*)\s*\(/))) {
      const name = m[4];
      if (BLOCK_KEYWORDS.has(name)) continue;
      if (m[3]) continue;
      // Confirm there's a '{' within a few lines (body), not a call statement ending in ';'
      let hasBrace = false;
      for (let f=up; f<=Math.min(lines.length-1, up+4); f++) {
        if (/\{/.test(lines[f])) { hasBrace = true; break; }
        if (/;\s*$/.test(lines[f])) break;
      }
      if (hasBrace) return { line: up, kind: 'method' };
    }
    // Inline arrow  (args) =>   or   , args =>   in arg lists
    if ((m = l.match(/(\(|,\s*)(async\s*)?(\([^)]*\)|\w+)\s*=>/))) {
      if (m[2]) continue;
      // Ensure this arrow is on a line at or above errLine and contains it (roughly: errLine >= up)
      if (errLine - 1 >= up) return { line: up, kind: 'inlineArrow', col: l.indexOf(m[1]) + m[1].length };
    }
  }
  return null;
}

function applyFix(src, fix) {
  const lines = src.split('\n');
  const l = lines[fix.line];
  if (fix.kind === 'fn') {
    lines[fix.line] = l.replace(/\bfunction\b/, 'async function');
  } else if (fix.kind === 'arrow') {
    lines[fix.line] = l.replace(/(=\s*)/, '$1async ');
  } else if (fix.kind === 'method') {
    lines[fix.line] = l.replace(/^(\s*)/, '$1async ');
  } else if (fix.kind === 'inlineArrow') {
    lines[fix.line] = l.slice(0, fix.col) + 'async ' + l.slice(fix.col);
  }
  return lines.join('\n');
}

let totalAdds = 0;
for (let iter = 0; iter < 40; iter++) {
  const errs = runTsc();
  if (!errs) break;
  const targets = errs.filter(e => e.code === '1308');
  if (!targets.length) break;
  const byFile = new Map();
  for (const e of targets) {
    if (!byFile.has(e.file)) byFile.set(e.file, new Set());
    byFile.get(e.file).add(e.line);
  }
  let progress = false;
  for (const [file, lineSet] of byFile) {
    let src = readFileSync(file, 'utf8');
    // For each line, find its enclosing function and apply async from bottom to top.
    const fixes = [];
    for (const ln of lineSet) {
      const fx = findEnclosingFn(src, ln);
      if (fx) fixes.push(fx);
    }
    // Deduplicate: apply each fix once per line, ordered bottom-up
    const seen = new Set();
    fixes.sort((a,b)=>b.line - a.line);
    for (const fx of fixes) {
      const key = `${fx.line}:${fx.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const nxt = applyFix(src, fx);
      if (nxt !== src) { src = nxt; totalAdds++; progress = true; }
    }
    writeFileSync(file, src);
  }
  if (!progress) break;
}
console.log('Added async', totalAdds, 'times');
