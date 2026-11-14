/** Super Admin aggregates. Every number is calculated from actual application records. */

import { all, scalar, type SqlValue } from './database';
import { catalogueIsComplete } from '../core/catalogue-rules';
import { getCategoryProgress } from './catalogue';

function n(sql: string, params: SqlValue[] = []): number {
  return scalar(sql, params);
}

export function dashboardMetrics() {
  const progress = getCategoryProgress();
  const active = progress.filter((p) => p.active);
  const paidOrderIds = all<{ id: number }>("SELECT id FROM orders WHERE status IN ('paid','processing','shipped','delivered')").map((r) => r.id);
  const revenue = n("SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE status = 'verified'");
  const cogs = paidOrderIds.length
    ? n(`SELECT COALESCE(SUM(oi.unit_cost * oi.quantity),0) AS n FROM order_items oi WHERE oi.order_id IN (${paidOrderIds.map(() => '?').join(',')})`, paidOrderIds)
    : 0;
  const mediaApproved = n("SELECT COUNT(*) AS n FROM product_media WHERE review_status = 'approved' AND permission_status = 'granted'");
  return {
    revenue,
    // Revenue is not profit: gross profit uses recorded landed costs only.
    grossProfit: revenue - cogs,
    netProfit: null as number | null,
    netProfitNote: 'Unavailable until actual operating expenses are recorded.',
    orders: n('SELECT COUNT(*) AS n FROM orders'),
    openOrders: n("SELECT COUNT(*) AS n FROM orders WHERE status IN ('draft','pending_payment','processing')"),
    products: n('SELECT COUNT(*) AS n FROM products'),
    publishedProducts: n("SELECT COUNT(*) AS n FROM products WHERE status = 'published' AND is_demo = 0"),
    verifiedModels: n("SELECT COUNT(*) AS n FROM products WHERE verification_status = 'verified' AND is_demo = 0"),
    demoProducts: n('SELECT COUNT(*) AS n FROM products WHERE is_demo = 1'),
    categoriesActive: active.length,
    categoriesProposed: progress.length - active.length,
    categoryMissingModels: active.reduce((sum, p) => sum + p.missingModels, 0),
    catalogueComplete: catalogueIsComplete(progress),
    mediaItemsApproved: mediaApproved,
    mediaItemsPending: n("SELECT COUNT(*) AS n FROM product_media WHERE review_status = 'pending'"),
    inventoryUnits: n('SELECT COALESCE(SUM(on_hand),0) AS n FROM inventory_balances'),
    reservedUnits: n('SELECT COALESCE(SUM(reserved),0) AS n FROM inventory_balances'),
    branches: n('SELECT COUNT(*) AS n FROM branches'),
    warehouses: n('SELECT COUNT(*) AS n FROM warehouses'),
    employees: n('SELECT COUNT(*) AS n FROM employees'),
    commissionAccrued: n("SELECT COALESCE(SUM(commission_amount),0) AS n FROM commission_records WHERE status = 'accrued'"),
    suppliers: n('SELECT COUNT(*) AS n FROM suppliers'),
    purchaseOrders: n('SELECT COUNT(*) AS n FROM purchase_orders'),
    customers: n('SELECT COUNT(*) AS n FROM customers'),
    returns: n('SELECT COUNT(*) AS n FROM return_requests'),
    warrantyClaims: n('SELECT COUNT(*) AS n FROM warranty_claims'),
    refunds: n('SELECT COUNT(*) AS n FROM refunds'),
    contentDrafts: n('SELECT COUNT(*) AS n FROM content_drafts'),
    approvedDrafts: n("SELECT COUNT(*) AS n FROM content_drafts WHERE status = 'approved'"),
    seoFailures: n("SELECT COUNT(*) AS n FROM seo_checks WHERE status = 'fail'"),
    publishingJobs: n('SELECT COUNT(*) AS n FROM publishing_jobs'),
    publishedPosts: n("SELECT COUNT(*) AS n FROM publishing_jobs WHERE status = 'published'"),
    integrationsHealthy: n("SELECT COUNT(*) AS n FROM integration_status WHERE status = 'healthy'"),
    integrationsNotConfigured: n("SELECT COUNT(*) AS n FROM integration_status WHERE status = 'not_configured'"),
    openFailedJobs: n("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'"),
    backups: n('SELECT COUNT(*) AS n FROM backups'),
    testedRestores: n('SELECT COUNT(*) AS n FROM backups WHERE restore_tested_at IS NOT NULL'),
    securityAlerts: n("SELECT COUNT(*) AS n FROM audit_events WHERE action LIKE 'auth.%failed%' OR action LIKE '%rate_limited%'"),
    auditEvents: n('SELECT COUNT(*) AS n FROM audit_events'),
    progress,
  };
}

export function recentAuditEvents(limit = 50) {
  return all(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ${Math.min(limit, 200)}`);
}

export function salesByStatus() {
  return all<{ status: string; orders: number; total: number }>(
    'SELECT status, COUNT(*) AS orders, COALESCE(SUM(total_amount),0) AS total FROM orders GROUP BY status ORDER BY orders DESC');
}
