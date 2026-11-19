import fs from 'node:fs';
import ts from 'typescript';

const files = process.argv.slice(2);
const ASYNC_IDENTS = new Set(['all','get','scalar','getSpecs','getMedia','getProductById','listOrders','listUsers','listPermissions','getOrder','listRecentActivity','search','listBackups','findDuplicateContent','recentFailedJobs','listEmployees','upcomingShifts','listProducts','getDashboard','checkRateLimit','getUserPermissions']);

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    // Look for CallExpression whose expression is an ASYNC_IDENT and whose parent is PropertyAccessExpression or ElementAccess (chained)
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let name = null;
      if (ts.isIdentifier(expr)) name = expr.text;
      else if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name)) name = expr.name.text;
      if (name && ASYNC_IDENTS.has(name)) {
        const parent = node.parent;
        const isChained =
          (ts.isPropertyAccessExpression(parent) && parent.expression === node) ||
          (ts.isElementAccessExpression(parent) && parent.expression === node);
        if (isChained) {
          // Need to wrap (await <call>).
          edits.push({ start: node.getStart(sf), end: node.getEnd(), text: `(await ${src.slice(node.getStart(sf), node.getEnd())})` });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  // Apply in reverse order
  edits.sort((a,b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  // Also wrap length access which the chain wraps: (await x()).length, but our edit only wraps call; need await keyword too! Add await prefix inside wrapper.
  fs.writeFileSync(f, out);
  console.log(`Fixed ${edits.length} chains in ${f}`);
}
