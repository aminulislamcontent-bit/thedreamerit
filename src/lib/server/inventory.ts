/**
 * Inventory ledger. Every write is serialised with BEGIN IMMEDIATE so two concurrent
 * orders cannot both reserve the last unit (overselling). No stock balance is seeded:
 * on_hand only changes through a receiving, transfer, adjustment, sale or return event.
 */

import { all, get, run, nowIso, transaction, scalar } from './database';
import { recordAudit } from './auth';

export type StockLine = { productId: number; variantId?: number; warehouseId: number; quantity: number };

function ensureBalance(line: StockLine) {
  const balance = get<{ id: number; on_hand: number; reserved: number }>(
    'SELECT id, on_hand, reserved FROM inventory_balances WHERE product_id = ? AND variant_id = ? AND warehouse_id = ?',
    [line.productId, line.variantId ?? 0, line.warehouseId]);
  if (!balance) throw new Error(`No inventory record exists for product ${line.productId} at warehouse ${line.warehouseId}. Stock cannot be invented.`);
  return balance;
}

function movement(line: StockLine, kind: string, extra: { from?: number; to?: number; referenceType?: string; referenceId?: string; note?: string; userId?: number | null; serials?: string[] } = {}) {
  run(`INSERT INTO stock_movements (product_id, variant_id, warehouse_id, from_warehouse_id, to_warehouse_id, quantity, kind, reference_type, reference_id, serial_numbers_json, note, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [line.productId, line.variantId ?? 0, line.warehouseId, extra.from ?? null, extra.to ?? null, line.quantity, kind,
      extra.referenceType ?? '', extra.referenceId ?? '', JSON.stringify(extra.serials ?? []), extra.note ?? '', extra.userId ?? null, nowIso()]);
}

/** Internal (transaction-free) helpers for composition inside a larger transaction. */
export function reserveStockTx(line: StockLine, orderId: number | null, expiresAt: string | null = null): number {
  if (line.quantity <= 0) throw new Error('Reservation quantity must be positive.');
  const balance = ensureBalance(line);
  if (balance.on_hand - balance.reserved < line.quantity) {
    throw new Error(`Insufficient unreserved stock: requested ${line.quantity}, available ${balance.on_hand - balance.reserved}.`);
  }
  run('UPDATE inventory_balances SET reserved = reserved + ?, updated_at = ? WHERE id = ?', [line.quantity, nowIso(), balance.id]);
  const result = run('INSERT INTO stock_reservations (order_id, product_id, variant_id, warehouse_id, quantity, status, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [orderId, line.productId, line.variantId ?? 0, line.warehouseId, line.quantity, 'active', expiresAt, nowIso()]);
  movement({ ...line, quantity: line.quantity }, 'reservation', { referenceType: 'order', referenceId: orderId ? String(orderId) : '' });
  return Number(result.lastInsertRowid);
}

export function releaseReservationTx(reservationId: number, consume = false): void {
  const r = get<{ id: number; product_id: number; variant_id: number; warehouse_id: number; quantity: number; status: string }>(
    'SELECT * FROM stock_reservations WHERE id = ?', [reservationId]);
  if (!r || r.status !== 'active') return;
  const available = scalar('SELECT COALESCE(SUM(on_hand - reserved), 0) AS n FROM inventory_balances WHERE product_id = ?', [r.product_id]);
  if (consume) {
    run('UPDATE inventory_balances SET on_hand = on_hand - ?, reserved = reserved - ?, updated_at = ? WHERE product_id = ? AND variant_id = ? AND warehouse_id = ?',
      [r.quantity, r.quantity, nowIso(), r.product_id, r.variant_id, r.warehouse_id]);
    run("UPDATE stock_reservations SET status = 'consumed' WHERE id = ?", [reservationId]);
    movement({ productId: r.product_id, variantId: r.variant_id, warehouseId: r.warehouse_id, quantity: -r.quantity }, 'sale', { referenceType: 'reservation', referenceId: String(reservationId) });
  } else {
    run('UPDATE inventory_balances SET reserved = reserved - ?, updated_at = ? WHERE product_id = ? AND variant_id = ? AND warehouse_id = ?',
      [r.quantity, nowIso(), r.product_id, r.variant_id, r.warehouse_id]);
    run("UPDATE stock_reservations SET status = 'released' WHERE id = ?", [reservationId]);
    movement({ productId: r.product_id, variantId: r.variant_id, warehouseId: r.warehouse_id, quantity: -r.quantity }, 'release', { referenceType: 'reservation', referenceId: String(reservationId) });
  }
  if (available < 0) throw new Error('Inventory invariant violated.');
}

export function receiveStockTx(line: StockLine, opts: { unitCost: number; poId?: number; serials?: string[]; userId?: number | null; note?: string }): void {
  if (line.quantity <= 0) throw new Error('Received quantity must be positive.');
  const existing = get<{ id: number; on_hand: number }>('SELECT id, on_hand FROM inventory_balances WHERE product_id = ? AND variant_id = ? AND warehouse_id = ?',
    [line.productId, line.variantId ?? 0, line.warehouseId]);
  if (existing) {
    run('UPDATE inventory_balances SET on_hand = on_hand + ?, updated_at = ? WHERE id = ?', [line.quantity, nowIso(), existing.id]);
  } else {
    run('INSERT INTO inventory_balances (product_id, variant_id, warehouse_id, on_hand, reserved, damaged, reorder_threshold, updated_at) VALUES (?, ?, ?, ?, 0, 0, 0, ?)',
      [line.productId, line.variantId ?? 0, line.warehouseId, line.quantity, nowIso()]);
  }
  movement(line, 'receipt', { referenceType: 'purchase_order', referenceId: opts.poId ? String(opts.poId) : '', userId: opts.userId, serials: opts.serials, note: `Landed unit cost ${opts.unitCost} poysha. ${opts.note ?? ''}` });
  for (const serial of opts.serials ?? []) {
    run('INSERT INTO serial_numbers (product_id, variant_id, serial, warehouse_id, status) VALUES (?, ?, ?, ?, ?)',
      [line.productId, line.variantId ?? 0, serial, line.warehouseId, 'in_stock']);
  }
  if (opts.poId) run('UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE po_id = ? AND product_id = ?', [line.quantity, opts.poId, line.productId]);
}

export async function reserveStock(line: StockLine, orderId: number | null, userId: number): Promise<number> {
  const id = transaction(() => reserveStockTx(line, orderId));
  await recordAudit('inventory.reserved', 'product', line.productId, { quantity: line.quantity, warehouseId: line.warehouseId, orderId }, userId);
  return id;
}

export async function releaseReservation(id: number, consume: boolean, userId: number): Promise<void> {
  transaction(() => releaseReservationTx(id, consume));
  await recordAudit(consume ? 'inventory.dispatch_confirmed' : 'inventory.reservation_released', 'reservation', id, {}, userId);
}

export async function receiveStock(line: StockLine, opts: { unitCost: number; poId?: number; serials?: string[]; note?: string }, userId: number): Promise<void> {
  transaction(() => receiveStockTx(line, { ...opts, userId }));
  await recordAudit('inventory.goods_received', 'product', line.productId, { quantity: line.quantity, poId: opts.poId ?? null }, userId);
}

export async function transferStock(line: StockLine, toWarehouseId: number, userId: number): Promise<void> {
  transaction(() => {
    const source = ensureBalance(line);
    if (source.on_hand - source.reserved < line.quantity) throw new Error('Cannot transfer reserved or unavailable stock.');
    run('UPDATE inventory_balances SET on_hand = on_hand - ?, updated_at = ? WHERE id = ?', [line.quantity, nowIso(), source.id]);
    const target = get<{ id: number }>('SELECT id FROM inventory_balances WHERE product_id = ? AND variant_id = ? AND warehouse_id = ?', [line.productId, line.variantId ?? 0, toWarehouseId]);
    if (target) run('UPDATE inventory_balances SET on_hand = on_hand + ?, updated_at = ? WHERE id = ?', [line.quantity, nowIso(), target.id]);
    else run('INSERT INTO inventory_balances (product_id, variant_id, warehouse_id, on_hand, updated_at) VALUES (?, ?, ?, ?, ?)', [line.productId, line.variantId ?? 0, toWarehouseId, line.quantity, nowIso()]);
    movement(line, 'transfer_out', { to: toWarehouseId, userId });
    movement({ ...line, warehouseId: toWarehouseId }, 'transfer_in', { from: line.warehouseId, userId });
  });
  await recordAudit('inventory.branch_transfer', 'product', line.productId, { quantity: line.quantity, from: line.warehouseId, to: toWarehouseId }, userId);
}

export async function adjustStock(line: StockLine, reason: string, userId: number): Promise<void> {
  transaction(() => {
    const b = ensureBalance(line);
    if (b.on_hand + line.quantity < b.reserved) throw new Error('Adjustment would break the reserved-stock invariant.');
    if (b.on_hand + line.quantity < 0) throw new Error('Adjustment would make on-hand stock negative.');
    run('UPDATE inventory_balances SET on_hand = on_hand + ?, updated_at = ? WHERE id = ?', [line.quantity, nowIso(), b.id]);
    movement(line, 'adjustment', { note: reason, userId });
  });
  await recordAudit('inventory.adjusted', 'product', line.productId, { quantity: line.quantity, reason }, userId);
}

export function getBalances() {
  return all<{ id: number; product_name: string; sku: string; warehouse: string; branch: string; on_hand: number; reserved: number; damaged: number; available: number; reorder_threshold: number }>(
    `SELECT ib.id, p.model_name AS product_name, p.sku, w.name AS warehouse, b.name AS branch,
      ib.on_hand, ib.reserved, ib.damaged, (ib.on_hand - ib.reserved) AS available, ib.reorder_threshold
     FROM inventory_balances ib JOIN products p ON p.id = ib.product_id
     JOIN warehouses w ON w.id = ib.warehouse_id JOIN branches b ON b.id = w.branch_id
     ORDER BY p.model_name`);
}

export function lowStockItems() {
  return all<{ product_name: string; warehouse: string; available: number; reorder_threshold: number }>(
    `SELECT p.model_name AS product_name, w.name AS warehouse, (ib.on_hand - ib.reserved) AS available, ib.reorder_threshold
     FROM inventory_balances ib JOIN products p ON p.id = ib.product_id JOIN warehouses w ON w.id = ib.warehouse_id
     WHERE ib.reorder_threshold > 0 AND (ib.on_hand - ib.reserved) <= ib.reorder_threshold`);
}

export function availableFor(productId: number, variantId = 0): number {
  return scalar('SELECT COALESCE(SUM(on_hand - reserved), 0) AS n FROM inventory_balances WHERE product_id = ? AND variant_id = ?', [productId, variantId]);
}
