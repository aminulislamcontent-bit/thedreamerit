'use server';

import { revalidatePath } from 'next/cache';
import { guard, field, intField, done, fail } from '@/lib/server/action-utils';
import { createOrder, requestRefund, requestReturn, transitionOrder, verifyPayment } from '@/lib/server/orders';
import { all, run, nowIso } from '@/lib/server/database';
import type { OrderStatus } from '@/lib/core/order-state';

export async function createPosOrderAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'pos.use');
  const productId = intField(fd, 'productId');
  const quantity = intField(fd, 'quantity', 1);
  if (!productId || quantity <= 0) fail('/admin/pos', 'Select a published product and a positive quantity.');
  const employeeId = intField(fd, 'employeeId') || undefined;
  const result = await createOrder({ lines: [{ productId, quantity }], channel: 'pos', branchId: intField(fd, 'branchId') || 1, userId: user.id, employeeId });
  if (!result.ok) fail('/admin/pos', result.errors.join(' | '));
  revalidatePath('/admin/orders');
  done(`/admin/orders/${result.orderId}`, `Order ${result.orderNumber} created. It is NOT paid until a verified payment event is recorded.`);
}

export async function verifyPaymentAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'payments.verify');
  const orderId = intField(fd, 'orderId');
  const method = field(fd, 'method') || 'cash';
  const allowed = ['cash', 'card', 'bank_transfer', 'mobile_banking', 'gateway', 'reconciliation'] as const;
  if (!allowed.includes(method as (typeof allowed)[number])) fail(`/admin/orders/${orderId}`, 'Unknown payment method.');
  const amount = Math.round(Number(field(fd, 'amountBdt')) * 100);
  if (!Number.isFinite(amount) || amount <= 0) fail(`/admin/orders/${orderId}`, 'Enter a positive amount.');
  const result = await verifyPayment({
    orderId, amount, method: method as (typeof allowed)[number], reference: field(fd, 'reference'),
    // A cash entry is only verified when the staff member explicitly confirms an authorized reconciliation.
    authorizedReconciliation: method === 'cash' || method === 'reconciliation',
    gatewayEventId: field(fd, 'gatewayEventId') || null, userId: user.id,
  });
  if (!result.ok) fail(`/admin/orders/${orderId}`, result.error || 'Payment not verified.');
  revalidatePath(`/admin/orders/${orderId}`);
  done(`/admin/orders/${orderId}`, result.paid ? 'Payment verified; order marked paid and stock dispatched.' : 'Payment recorded; order total not yet covered.');
}

export async function transitionOrderAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'orders.manage');
  const orderId = intField(fd, 'orderId');
  const to = field(fd, 'to') as OrderStatus;
  const result = await transitionOrder(orderId, to, user.id);
  if (!result.ok) fail(`/admin/orders/${orderId}`, result.error || 'Transition rejected.');
  revalidatePath(`/admin/orders/${orderId}`);
  done(`/admin/orders/${orderId}`, `Order moved to ${to}.`);
}

export async function requestReturnAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'orders.manage');
  const orderId = intField(fd, 'orderId');
  await requestReturn(orderId, intField(fd, 'productId'), field(fd, 'reason'), user.id);
  revalidatePath('/admin/orders');
  done('/admin/orders', 'Return request recorded.');
}

export async function requestRefundAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'payments.verify');
  const orderId = intField(fd, 'orderId');
  const amount = Math.round(Number(field(fd, 'amountBdt')) * 100);
  const result = await requestRefund(orderId, amount, field(fd, 'reason'), user.id);
  if (!result.ok) fail(`/admin/orders/${orderId}`, result.error || 'Refund rejected.');
  revalidatePath(`/admin/orders/${orderId}`);
  done(`/admin/orders/${orderId}`, 'Refund request recorded against verified payments.');
}

export async function recordAttendanceAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'employees.edit');
  const employeeId = intField(fd, 'employeeId');
  const date = field(fd, 'date') || nowIso().slice(0, 10);
  if (!employeeId) fail('/admin/employees', 'Employee required.');
  run(`INSERT INTO attendance (employee_id, business_date, status, check_in) VALUES (?, ?, 'present', ?)
    ON CONFLICT(employee_id, business_date) DO UPDATE SET status = 'present', check_in = excluded.check_in`,
    [employeeId, date, nowIso().slice(11, 16)]);
  void user;
  revalidatePath('/admin/employees');
  done('/admin/employees', 'Attendance recorded.');
}

export async function createEmployeeAction(fd: FormData): Promise<void> {
  await guard(fd, 'employees.edit');
  const code = field(fd, 'employeeCode');
  if (!code) fail('/admin/employees', 'Employee code required.');
  run('INSERT INTO employees (employee_code, department, designation, branch_id, joined_at, status) VALUES (?, ?, ?, ?, ?, ?)',
    [code, field(fd, 'department'), field(fd, 'designation'), intField(fd, 'branchId') || 1, nowIso().slice(0, 10), 'active']);
  revalidatePath('/admin/employees');
  done('/admin/employees', 'Employee profile created.');
}

export async function updateCommissionRuleAction(fd: FormData): Promise<void> {
  await guard(fd, 'commission.manage');
  const basis = field(fd, 'basis');
  if (!['line_margin', 'revenue', 'flat_per_unit'].includes(basis)) fail('/admin/employees', 'Invalid commission basis.');
  const id = intField(fd, 'ruleId');
  if (id) {
    run('UPDATE commission_rules SET name = ?, basis = ?, rate_bps = ?, flat_amount = ?, min_margin_bps = ? WHERE id = ?',
      [field(fd, 'name'), basis, intField(fd, 'rateBps'), Math.round(Number(field(fd, 'flatBdt') || 0) * 100), intField(fd, 'minMarginBps'), id]);
  } else {
    run('INSERT INTO commission_rules (name, basis, rate_bps, flat_amount, min_margin_bps, applies_to_returns, active, created_at) VALUES (?, ?, ?, ?, ?, 0, 1, ?)',
      [field(fd, 'name'), basis, intField(fd, 'rateBps'), Math.round(Number(field(fd, 'flatBdt') || 0) * 100), intField(fd, 'minMarginBps'), nowIso()]);
  }
  revalidatePath('/admin/employees');
  done('/admin/employees', 'Commission rule saved; returns and cancellations continue to reverse accruals.');
}

export async function exportPayrollAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'commission.manage');
  const period = field(fd, 'period');
  if (!period) fail('/admin/employees', 'Period required (YYYY-MM).');
  const rows = all(
    `SELECT e.employee_code, SUM(cr.commission_amount) AS total FROM commission_records cr JOIN employees e ON e.id = cr.employee_id
     WHERE cr.status = 'accrued' AND substr(cr.created_at, 1, 7) = ? GROUP BY e.employee_code`, [period]);
  run('INSERT INTO payroll_exports (period, payload_json, created_by, created_at) VALUES (?, ?, ?, ?)', [period, JSON.stringify(rows), user.id, nowIso()]);
  revalidatePath('/admin/employees');
  done('/admin/employees', `Payroll export for ${period} generated from accrued commission records.`);
}
