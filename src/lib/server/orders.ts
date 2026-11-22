/** Order processing, POS, verified payments, returns and commission reversals. */

import { all, get, run, nowIso, transaction, scalar } from './database';
import { recordAudit } from './auth';
import { reserveStockTx, releaseReservationTx, availableFor } from './inventory';
import { assessPrice, validateDiscount } from '../core/pricing-rules';
import { canMarkPaid, canTransition, type OrderStatus } from '../core/order-state';
import { computeCommission, type CommissionRule } from '../core/commission-rules';

export type OrderLineInput = { productId: number; variantId?: number; quantity: number; discountAmount?: number };

async function nextOrderNumber(): Promise<string> {
  const date = await nowIso().slice(0, 10).replace(/-/g, '');
  const seq = await scalar("SELECT COUNT(*) AS n FROM orders WHERE order_number LIKE ?", [`DIT-${date}-%`]) + 1;
  return `DIT-${date}-${String(seq).padStart(4, '0')}`;
}

export async function createOrder(input: {
  lines: OrderLineInput[];
  channel: 'web' | 'pos';
  branchId?: number | null;
  customerId?: number | null;
  userId?: number | null;
  employeeId?: number | null;
  discountApproverId?: number | null;
}): Promise<{ ok: boolean; orderId?: number; orderNumber?: string; errors: string[] }> {
  const errors: string[] = [];
  if (!input.lines.length) return { ok: false, errors: ['An order needs at least one line.'] };

  const prepared = await Promise.all(input.lines.map(async (line) => {
    const p = await get<{ id: number; model_name: string; status: string; is_demo: number; price_amount: number | null; price_verified: number; price_source_url: string; minimum_selling_amount: number | null }>(
      'SELECT id, model_name, status, is_demo, price_amount, price_verified, price_source_url, minimum_selling_amount FROM products WHERE id = ?', [line.productId]);
    if (!p) { errors.push(`Product ${line.productId} does not exist.`); return null; }
    if (p.status !== 'published' || p.is_demo) { errors.push(`${p.model_name} is not published in the live catalogue.`); return null; }
    const price = assessPrice({ sellingAmount: p.price_amount, minimumSellingAmount: p.minimum_selling_amount, unitCost: null, priceVerified: !!p.price_verified, priceSourceUrl: p.price_source_url });
    if (!price.displayPrice || price.amount === null) { errors.push(...price.blockers.map((b) => `${p.model_name}: ${b}`)); return null; }
    const cost = await scalar('SELECT COALESCE(MAX(unit_cost), 0) AS n FROM purchase_order_items WHERE product_id = ?', [p.id]);
    const lineAmount = price.amount * line.quantity;
    const discount = validateDiscount({
      lineAmount, discountAmount: line.discountAmount ?? 0, minimumSellingAmount: p.minimum_selling_amount === null ? null : p.minimum_selling_amount * line.quantity,
      approvalRecorded: !!input.discountApproverId, approverId: input.discountApproverId ?? null,
    });
    if (!discount.allowed) { errors.push(...discount.blockers.map((b) => `${p.model_name}: ${b}`)); return null; }
    const available = await availableFor(p.id, line.variantId ?? 0);
    if (available < line.quantity) { errors.push(`${p.model_name}: only ${available} units available across verified inventory.`); return null; }
    return { productId: p.id, variantId: line.variantId ?? 0, quantity: line.quantity, unitPrice: price.amount, unitCost: cost, discountAmount: line.discountAmount ?? 0, lineTotal: discount.effectiveAmount, name: p.model_name };
  }));
  if (errors.length || prepared.some((p) => p === null)) return { ok: false, errors };
  const valid = prepared as NonNullable<(typeof prepared)[number]>[];
  const subtotal = valid.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discountAmount = valid.reduce((sum, l) => sum + l.discountAmount, 0);
  const orderNumber = await nextOrderNumber();

  const orderId = await transaction(async () => {
    const result = await run(`INSERT INTO orders (order_number, customer_id, user_id, branch_id, channel, status, subtotal, discount_amount, total_amount, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?)`,
      [orderNumber, input.customerId ?? null, input.userId ?? null, input.branchId ?? null, input.channel, subtotal, discountAmount, subtotal - discountAmount, input.userId ?? null, nowIso(), nowIso()]);
    const id = Number(result.lastInsertRowid);
    for (const line of valid) {
      await run(`INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, unit_cost, discount_amount, line_total, price_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`, [id, line.productId, line.variantId, line.quantity, line.unitPrice, line.unitCost, line.discountAmount, line.lineTotal]);
      // Reserve from the warehouse that actually holds the stock.
      const balance = await all<{ warehouse_id: number; available: number }>(
        'SELECT warehouse_id, (on_hand - reserved) AS available FROM inventory_balances WHERE product_id = ? AND variant_id = ? AND (on_hand - reserved) > 0 ORDER BY available DESC',
        [line.productId, line.variantId]);
      let remaining = line.quantity;
      for (const b of balance) {
        const take = Math.min(remaining, b.available);
        if (take <= 0) break;
        await reserveStockTx({ productId: line.productId, variantId: line.variantId, warehouseId: b.warehouse_id, quantity: take }, id);
        remaining -= take;
      }
      if (remaining > 0) throw new Error(`Could not reserve ${line.quantity} units of ${line.name}.`);
    }
    await run('INSERT INTO order_state_history (order_id, from_status, to_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)', [id, 'draft', 'pending_payment', input.userId ?? null, nowIso()]);
    if (input.employeeId) {
      await run('INSERT INTO sales_attributions (order_id, employee_id, share_bps) VALUES (?, ?, 10000)', [id, input.employeeId]);
    }
    return id;
  });

  await recordAudit('order.created', 'order', orderId, { orderNumber, channel: input.channel, total: subtotal - discountAmount }, input.userId ?? null);
  return { ok: true, orderId, orderNumber, errors: [] };
}

export async function verifyPayment(input: {
  orderId: number; amount: number; method: 'cash' | 'card' | 'bank_transfer' | 'mobile_banking' | 'gateway' | 'reconciliation';
  reference?: string; gatewayEventId?: string | null; authorizedReconciliation?: boolean; userId: number;
}): Promise<{ ok: boolean; error?: string; paid?: boolean }> {
  if (input.amount <= 0) return { ok: false, error: 'Payment amount must be positive.' };
  if (!input.gatewayEventId && !input.authorizedReconciliation) {
    return { ok: false, error: 'A verified gateway event id or an authorized cash reconciliation is required.' };
  }
  const order = await get<{ id: number; status: string; total_amount: number }>('SELECT id, status, total_amount FROM orders WHERE id = ?', [input.orderId]);
  if (!order) return { ok: false, error: 'Order not found.' };
  const duplicate = await get('SELECT id FROM payments WHERE gateway_event_id = ?', [input.gatewayEventId || `recon:${input.orderId}:${input.reference}`]);
  if (duplicate) return { ok: false, error: 'This payment event was already recorded.' };

  await transaction(async () => {
    await run(`INSERT INTO payments (order_id, amount, method, status, reference, gateway_event_id, verified_by, verified_at, created_at)
      VALUES (?, ?, ?, 'verified', ?, ?, ?, ?, ?)`,
      [input.orderId, input.amount, input.method, input.reference ?? '', input.gatewayEventId || `recon:${input.orderId}:${input.reference}`, input.userId, nowIso(), nowIso()]);
  });

  const payments = await all<{ amount: number; status: string; gateway_event_id: string | null; verified_at: string | null }>(
    'SELECT amount, status, gateway_event_id, verified_at FROM payments WHERE order_id = ?', [input.orderId]);
  const gate = canMarkPaid({
    currentStatus: order.status as OrderStatus, orderTotal: order.total_amount,
    verifiedPayments: payments.map((p) => ({ amount: p.amount, status: p.status, gatewayEventId: p.gateway_event_id, verifiedAt: p.verified_at })),
    authorizedReconciliation: !!input.authorizedReconciliation,
  });
  if (gate.allowed) {
    await transaction(async () => {
      await run("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?", [nowIso(), input.orderId]);
      await run('INSERT INTO order_state_history (order_id, from_status, to_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)',
        [input.orderId, order.status, 'paid', input.userId, nowIso()]);
      for (const r of await all<{ id: number }>("SELECT id FROM stock_reservations WHERE order_id = ? AND status = 'active'", [input.orderId])) await releaseReservationTx(r.id, true);
      await accrueCommissions(input.orderId);
    });
  }
  await recordAudit('payment.verified', 'order', input.orderId, { amount: input.amount, method: input.method, paid: gate.allowed }, input.userId);
  return { ok: true, paid: gate.allowed };
}

async function accrueCommissions(orderId: number): Promise<void> {
  const rule = await get<{ id: number; basis: string; rate_bps: number; flat_amount: number; min_margin_bps: number; applies_to_returns: number; active: number; name: string }>(
    'SELECT * FROM commission_rules WHERE active = 1 ORDER BY id LIMIT 1');
  if (!rule) return;
  const castRule: CommissionRule = {
    id: rule.id, name: rule.name, basis: rule.basis as CommissionRule['basis'], rateBps: rule.rate_bps,
    flatAmount: rule.flat_amount, minMarginBps: rule.min_margin_bps, appliesToReturns: !!rule.applies_to_returns, active: !!rule.active,
  };
  const attribution = await get<{ employee_id: number; share_bps: number }>('SELECT employee_id, share_bps FROM sales_attributions WHERE order_id = ? LIMIT 1', [orderId]);
  if (!attribution) return;
  const lines = await all<{ id: number; line_total: number; unit_cost: number; quantity: number }>('SELECT id, line_total, unit_cost, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const line of lines) {
    const result = computeCommission(castRule, { lineTotal: line.line_total, unitCost: line.unit_cost, quantity: line.quantity, orderStatus: 'paid', reversed: false, shareBps: attribution.share_bps });
    if (result.status === 'accrued') {
      await run('INSERT INTO commission_records (employee_id, order_id, order_item_id, rule_id, base_amount, commission_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [attribution.employee_id, orderId, line.id, rule.id, result.base, result.amount, 'accrued', nowIso()]);
    }
  }
}

export async function transitionOrder(orderId: number, to: OrderStatus, userId: number): Promise<{ ok: boolean; error?: string }> {
  const order = await get<{ status: string }>('SELECT status FROM orders WHERE id = ?', [orderId]);
  if (!order) return { ok: false, error: 'Order not found.' };
  if (!canTransition(order.status as OrderStatus, to)) return { ok: false, error: `Invalid transition ${order.status} → ${to}.` };
  await transaction(async () => {
    await run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [to, nowIso(), orderId]);
    await run('INSERT INTO order_state_history (order_id, from_status, to_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)', [orderId, order.status, to, userId, nowIso()]);
    if (to === 'shipped' || to === 'delivered') {
      await run('INSERT INTO delivery_tracking (order_id, status, note, created_at) VALUES (?, ?, ?, ?)', [orderId, to, 'Status recorded by authorized staff', nowIso()]);
    }
    if (['cancelled', 'returned', 'refunded'].includes(to)) {
      for (const r of await all<{ id: number }>("SELECT id FROM stock_reservations WHERE order_id = ? AND status = 'active'", [orderId])) await releaseReservationTx(r.id, false);
      await run("UPDATE commission_records SET status = 'reversed' WHERE order_id = ? AND status = 'accrued'", [orderId]);
    }
  });
  await recordAudit('order.status_changed', 'order', orderId, { from: order.status, to }, userId);
  return { ok: true };
}

export async function requestReturn(orderId: number, productId: number, reason: string, userId: number): Promise<void> {
  await run('INSERT INTO return_requests (order_id, product_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?)', [orderId, productId, reason, 'requested', nowIso()]);
  await recordAudit('return.requested', 'order', orderId, { productId }, userId);
}

export async function requestRefund(orderId: number, amount: number, reason: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  const verified = await scalar("SELECT COALESCE(SUM(amount), 0) AS n FROM payments WHERE order_id = ? AND status = 'verified'", [orderId]);
  if (amount > verified) return { ok: false, error: 'Refund cannot exceed verified payments.' };
  await run('INSERT INTO refunds (order_id, amount, reason, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)', [orderId, amount, reason, 'requested', userId, nowIso()]);
  await recordAudit('refund.requested', 'order', orderId, { amount }, userId);
  return { ok: true };
}

export async function listOrders() {
  return await all<{ id: number; order_number: string; status: string; channel: string; total_amount: number; created_at: string; customer_name: string | null }>(
    `SELECT o.*, c.name AS customer_name FROM orders o LEFT JOIN customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT 200`);
}

export async function getOrder(id: number) {
  const order = await get<Record<string, unknown>>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return null;
  return {
    ...order,
    items: await all('SELECT oi.*, p.model_name, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?', [id]),
    payments: await all('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at', [id]),
    history: await all('SELECT * FROM order_state_history WHERE order_id = ? ORDER BY created_at', [id]),
    tracking: await all('SELECT * FROM delivery_tracking WHERE order_id = ? ORDER BY created_at', [id]),
    commissions: await all('SELECT * FROM commission_records WHERE order_id = ?', [id]),
  } as Record<string, unknown>;
}
