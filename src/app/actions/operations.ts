'use server';

import { revalidatePath } from 'next/cache';
import { guard, field, intField, done, fail } from '@/lib/server/action-utils';
import { run, nowIso } from '@/lib/server/database';
import { adjustStock, receiveStock, transferStock } from '@/lib/server/inventory';

export async function receiveStockAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'inventory.adjust');
  const productId = intField(fd, 'productId');
  const warehouseId = intField(fd, 'warehouseId');
  const quantity = intField(fd, 'quantity');
  if (!productId || !warehouseId || quantity <= 0) fail('/admin/inventory', 'Product, warehouse and a positive quantity are required.');
  const serials = field(fd, 'serials').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  try {
    await receiveStock({ productId, warehouseId, quantity }, { unitCost: Math.round(Number(field(fd, 'unitCostBdt') || 0) * 100), serials, poId: intField(fd, 'poId') || undefined }, user.id);
  } catch (error) { fail('/admin/inventory', error instanceof Error ? error.message : 'Receiving failed.'); }
  revalidatePath('/admin/inventory');
  done('/admin/inventory', `${quantity} units received with a stock movement record.`);
}

export async function transferStockAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'inventory.transfer');
  const productId = intField(fd, 'productId');
  const from = intField(fd, 'fromWarehouseId');
  const to = intField(fd, 'toWarehouseId');
  const quantity = intField(fd, 'quantity');
  if (!productId || !from || !to || from === to || quantity <= 0) fail('/admin/inventory', 'Select distinct warehouses and a positive quantity.');
  try { await transferStock({ productId, warehouseId: from, quantity }, to, user.id); }
  catch (error) { fail('/admin/inventory', error instanceof Error ? error.message : 'Transfer failed.'); }
  revalidatePath('/admin/inventory');
  done('/admin/inventory', 'Branch transfer recorded with dispatch and receipt movements.');
}

export async function adjustStockAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'inventory.adjust');
  const quantity = intField(fd, 'quantity');
  if (!quantity || !field(fd, 'reason')) fail('/admin/inventory', 'A signed quantity and a reason are required.');
  try { await adjustStock({ productId: intField(fd, 'productId'), warehouseId: intField(fd, 'warehouseId'), quantity }, field(fd, 'reason'), user.id); }
  catch (error) { fail('/admin/inventory', error instanceof Error ? error.message : 'Adjustment failed.'); }
  revalidatePath('/admin/inventory');
  done('/admin/inventory', 'Stock adjustment recorded.');
}

export async function setReorderThresholdAction(fd: FormData): Promise<void> {
  await guard(fd, 'inventory.adjust');
  const id = intField(fd, 'balanceId');
  const threshold = intField(fd, 'threshold');
  if (!id || threshold < 0) fail('/admin/inventory', 'Invalid threshold.');
  run('UPDATE inventory_balances SET reorder_threshold = ?, updated_at = ? WHERE id = ?', [threshold, nowIso(), id]);
  revalidatePath('/admin/inventory');
  done('/admin/inventory', 'Low-stock threshold saved.');
}

export async function createBranchAction(fd: FormData): Promise<void> {
  await guard(fd, 'settings.manage');
  const code = field(fd, 'code');
  const name = field(fd, 'name');
  if (!code || !name) fail('/admin/operations', 'Branch code and name are required.');
  run('INSERT INTO branches (code, name, address, phone, is_active) VALUES (?, ?, ?, ?, 1)', [code, name, field(fd, 'address'), field(fd, 'phone')]);
  revalidatePath('/admin/operations');
  done('/admin/operations', 'Branch created. No stock was assumed for it.');
}

export async function createWarehouseAction(fd: FormData): Promise<void> {
  await guard(fd, 'settings.manage');
  const code = field(fd, 'code');
  if (!code || !intField(fd, 'branchId')) fail('/admin/operations', 'Warehouse code and branch are required.');
  run('INSERT INTO warehouses (branch_id, code, name, is_active) VALUES (?, ?, ?, 1)', [intField(fd, 'branchId'), code, field(fd, 'name') || code]);
  revalidatePath('/admin/operations');
  done('/admin/operations', 'Warehouse created with zero stock.');
}

export async function createSupplierAction(fd: FormData): Promise<void> {
  await guard(fd, 'procurement.edit');
  const name = field(fd, 'name');
  if (!name) fail('/admin/operations', 'Supplier name is required.');
  run('INSERT INTO suppliers (name, contact_person, phone, email, address, payment_terms, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, field(fd, 'contact'), field(fd, 'phone'), field(fd, 'email'), field(fd, 'address'), field(fd, 'terms'), 'active']);
  revalidatePath('/admin/operations');
  done('/admin/operations', 'Supplier profile created.');
}

export async function createPurchaseOrderAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'procurement.edit');
  const supplierId = intField(fd, 'supplierId');
  const productId = intField(fd, 'productId');
  const quantity = intField(fd, 'quantity');
  if (!supplierId || !productId || quantity <= 0) fail('/admin/operations', 'Supplier, product and quantity are required.');
  const branchId = intField(fd, 'branchId') || 1;
  const number = `PO-${Date.now().toString().slice(-8)}`;
  const result = run('INSERT INTO purchase_orders (po_number, supplier_id, branch_id, status, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [number, supplierId, branchId, 'draft', field(fd, 'notes'), user.id, nowIso()]);
  run('INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_cost) VALUES (?, ?, ?, ?)',
    [result.lastInsertRowid, productId, quantity, Math.round(Number(field(fd, 'unitCostBdt') || 0) * 100)]);
  revalidatePath('/admin/operations');
  done('/admin/operations', `Purchase order ${number} created as draft.`);
}

export async function createSupplierInvoiceAction(fd: FormData): Promise<void> {
  await guard(fd, 'procurement.edit');
  const poId = intField(fd, 'poId');
  const number = field(fd, 'invoiceNumber');
  if (!poId || !number) fail('/admin/operations', 'Purchase order and invoice number are required.');
  run('INSERT INTO supplier_invoices (po_id, invoice_number, amount, issued_at, status) VALUES (?, ?, ?, ?, ?)',
    [poId, number, Math.round(Number(field(fd, 'amountBdt') || 0) * 100), nowIso().slice(0, 10), 'open']);
  revalidatePath('/admin/operations');
  done('/admin/operations', 'Supplier invoice recorded with outstanding balance.');
}
