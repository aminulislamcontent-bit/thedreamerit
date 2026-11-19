import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ASYNC_IDENTS = new Set([
  'all','get','run','scalar','exec','transaction',
  'checkRateLimit','login','registerCustomer','recordAudit','getCurrentUser','createSession','destroySession','requireUser','requirePermission','requireCsrf','csrfToken','clientIp','userAgent',
  'listProducts','getProductBySlug','getProductById','getSpecs','getMedia','getProductDossier','evaluateProduct','publishProduct','unpublishProduct','getCategoryProgress','setCategoryActive','updateProductField','setPrice','upsertSpec','importProducts','mediaCompletenessFor',
  'buildVerifiedBundle','generateContentDraft','reviewDraft','listDrafts',
  'reserveStock','releaseReservation','receiveStock','transferStock','adjustStock','reserveStockTx','releaseReservationTx','receiveStockTx','getBalances','lowStockItems','availableFor',
  'ensureScheduledJobs','runDueJobs','schedulerStatus',
  'addMedia','reviewMedia','grantMediaPermission','setPrimary','reorderMedia','removeMedia','mediaQueue',
  'log','recordFailedJob','resolveFailedJob','registerBackup','markBackupIntegrity','markRestoreTested','listBackups','healthSnapshot',
  'createOrder','verifyPayment','transitionOrder','requestReturn','requestRefund','listOrders','getOrder',
  'sitemapXml','productStructuredData','runSeoChecks','checkInternalLinks','addRedirect','recentSeoChecks',
  'addToCart','cartWithItems','removeFromCart','mergeCart','clearCart','dashboardMetrics','processDerivatives','postSocial','socialQueue',
  'initializeDatabase','recentAuditEvents','salesByStatus','performBackup','verifyBackup','listFailedJobs',
  // route-level helpers from Next
  'cookies','headers',
  // utility methods we know return promises in this codebase
]);

function isAwaitContext(src, idx) {
  if (idx > 0) {
    const p = src[idx-1];
    if (p === '.' || /\w/.test(p)) return false;
  }
  let k = idx - 1;
  while (k >= 0 && /\s/.test(src[k])) k--;
  if (k < 0) return true;
  let end = k + 1;
  while (k >= 0 && /\w/.test(src[k])) k--;
  const w = src.slice(k+1, end);
  if (w === 'await' || w === 'function' || w === 'class' || w === 'async' || w === 'yield' || w === 'new' || w === 'typeof' || w === 'void' || w === 'delete' || w === 'case') return false;
  return true;
}

const files = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx" "scripts/*.ts" 2>/dev/null', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

let total = 0;
for (const f of files) {
  if (f.endsWith('src/lib/server/database.ts')) continue;
  let src = readFileSync(f, 'utf8');
  // Insert `await ` before bare identifier calls for async functions.
  // Match: identifier optionally followed by <...> then '('
  const re = /\b([A-Za-z_$][\w$]*)\s*(<[^>]*>)?\s*\(/g;
  const parts = [];
  let last = 0;
  let added = 0;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    const idx = m.index;
    parts.push(src.slice(last, idx));
    if (ASYNC_IDENTS.has(name) && isAwaitContext(src, idx)) {
      parts.push('await ');
      added++;
      total++;
    }
    parts.push(m[0]);
    last = idx + m[0].length;
  }
  parts.push(src.slice(last));
  if (added) {
    // Repeatedly collapse `await await` to `await` (when multiple passes would double-add)
    let out = parts.join('');
    while (/await\s+await\s+/.test(out)) out = out.replace(/await\s+await\s+/g, 'await ');
    writeFileSync(f, out);
  }
}
console.log('Inserted', total, 'awaits');
