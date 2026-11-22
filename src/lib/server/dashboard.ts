/** Super Admin aggregates. Every number is calculated from actual application records. */

import { all, scalar } from './database';
import { catalogueIsComplete } from '../core/catalogue-rules';
import { getCategoryProgress } from './catalogue';

async function n(sql: string, params: Array<string | number> = []): Promise<number> {
  return await scalar(sql, params);
}

export async function dashboardMetrics() {
  const progress = await getCategoryProgress();
  const active = progress.filter((p) => p.active);
  const paidOrders = await all<{ id: number }>("SELECT id FROM orders WHERE status IN ('paid','processing','shipped','delivered')");
  const paidOrderIds = paidOrders.map((r) => r.id);
  const revenue = await n("SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE status = 'verified'");
  const cogs = paidOrderIds.length
    ? await n(`SELECT COALESCE(SUM(oi.unit_cost * oi.quantity),0) AS n FROM order_items oi WHERE oi.order_id IN (${paidOrderIds.map(() => '?').join(',')})`, paidOrderIds)
    : 0;
  const mediaApproved = await n("SELECT COUNT(*) AS n FROM product_media WHERE review_status = 'approved' AND permission_status = 'granted'");
  return {
    revenue,
    grossProfit: revenue - cogs,
    netProfit: null as number | null,
    netProfitNote: 'Unavailable until actual operating expenses are recorded.',
    orders: await n('SELECT COUNT(*) AS n FROM orders'),
    openOrders: await n("SELECT COUNT(*) AS n FROM orders WHERE status IN ('draft','pending_payment','processing')"),
    products: await n('SELECT COUNT(*) AS n FROM products'),
    publishedProducts: await n("SELECT COUNT(*) AS n FROM products WHERE status = 'published' AND is_demo = 0"),
    verifiedModels: await n("SELECT COUNT(*) AS n FROM products WHERE verification_status = 'verified' AND is_demo = 0"),
    demoProducts: await n('SELECT COUNT(*) AS n FROM products WHERE is_demo = 1'),
    categoriesActive: active.length,
    categoriesProposed: progress.length - active.length,
    categoryMissingModels: active.reduce((sum, p) => sum + p.missingModels, 0),
    catalogueComplete: catalogueIsComplete(progress),
    mediaItemsApproved: mediaApproved,
    mediaItemsPending: await n("SELECT COUNT(*) AS n FROM product_media WHERE review_status = 'pending'"),
    inventoryUnits: await n('SELECT COALESCE(SUM(on_hand),0) AS n FROM inventory_balances'),
    reservedUnits: await n('SELECT COALESCE(SUM(reserved),0) AS n FROM inventory_balances'),
    branches: await n('SELECT COUNT(*) AS n FROM branches'),
    warehouses: await n('SELECT COUNT(*) AS n FROM warehouses'),
    employees: await n('SELECT COUNT(*) AS n FROM employees'),
    commissionAccrued: await n("SELECT COALESCE(SUM(commission_amount),0) AS n FROM commission_records WHERE status = 'accrued'"),
    suppliers: await n('SELECT COUNT(*) AS n FROM suppliers'),
    purchaseOrders: await n('SELECT COUNT(*) AS n FROM purchase_orders'),
    customers: await n('SELECT COUNT(*) AS n FROM customers'),
    returns: await n('SELECT COUNT(*) AS n FROM return_requests'),
    warrantyClaims: await n('SELECT COUNT(*) AS n FROM warranty_claims'),
    refunds: await n('SELECT COUNT(*) AS n FROM refunds'),
    contentDrafts: await n('SELECT COUNT(*) AS n FROM content_drafts'),
    approvedDrafts: await n("SELECT COUNT(*) AS n FROM content_drafts WHERE status = 'approved'"),
    seoFailures: await n("SELECT COUNT(*) AS n FROM seo_checks WHERE status = 'fail'"),
    publishingJobs: await n('SELECT COUNT(*) AS n FROM publishing_jobs'),
    publishedPosts: await n("SELECT COUNT(*) AS n FROM publishing_jobs WHERE status = 'published'"),
    integrationsHealthy: await n("SELECT COUNT(*) AS n FROM integration_status WHERE status = 'healthy'"),
    integrationsNotConfigured: await n("SELECT COUNT(*) AS n FROM integration_status WHERE status = 'not_configured'"),
    openFailedJobs: await n("SELECT COUNT(*) AS n FROM failed_jobs WHERE status = 'open'"),
    backups: await n('SELECT COUNT(*) AS n FROM backups'),
    testedRestores: await n('SELECT COUNT(*) AS n FROM backups WHERE restore_tested_at IS NOT NULL'),
    securityAlerts: await n("SELECT COUNT(*) AS n FROM audit_events WHERE action LIKE 'auth.%failed%' OR action LIKE '%rate_limited%'"),
    auditEvents: await n('SELECT COUNT(*) AS n FROM audit_events'),
    progress,
  };
}

export async function recentAuditEvents(limit = 50) {
  return await all(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ${Math.min(limit, 200)}`);
}

export async function salesByStatus() {
  return await all<{ status: string; orders: number; total: number }>(
    'SELECT status, COUNT(*) AS orders, COALESCE(SUM(total_amount),0) AS total FROM orders GROUP BY status ORDER BY orders DESC');
}
