import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPrice, validateDiscount, summariseTrading } from '../src/lib/core/pricing-rules';
import { canTransition, canMarkPaid } from '../src/lib/core/order-state';
import { computeCommission, netCommissionForPeriod, type CommissionRule } from '../src/lib/core/commission-rules';
import { validateBuild } from '../src/lib/core/compatibility';

const rule: CommissionRule = { id: 1, name: 'Margin share', basis: 'line_margin', rateBps: 500, flatAmount: 0, minMarginBps: 0, appliesToReturns: false, active: true };

test('price is hidden unless verified, sourced and above the authorized floor', () => {
  const unverified = assessPrice({ sellingAmount: 100000, minimumSellingAmount: 90000, unitCost: 70000, priceVerified: false, priceSourceUrl: '' });
  assert.equal(unverified.displayPrice, false);
  assert.equal(unverified.amount, null);
  const belowFloor = assessPrice({ sellingAmount: 80000, minimumSellingAmount: 90000, unitCost: 70000, priceVerified: true, priceSourceUrl: 'https://distributor.example/price' });
  assert.equal(belowFloor.displayPrice, false);
  const valid = assessPrice({ sellingAmount: 100000, minimumSellingAmount: 90000, unitCost: 70000, priceVerified: true, priceSourceUrl: 'https://distributor.example/price' });
  assert.equal(valid.displayPrice, true);
  assert.equal(valid.amount, 100000);
  assert.equal(valid.grossMarginAmount, 30000);
  assert.equal(valid.grossMarginBps, 3000);
});

test('discounts below the price floor require recorded authorization', () => {
  const denied = validateDiscount({ lineAmount: 100000, discountAmount: 20000, minimumSellingAmount: 90000, approvalRecorded: false, approverId: null });
  assert.equal(denied.allowed, false);
  const approved = validateDiscount({ lineAmount: 100000, discountAmount: 20000, minimumSellingAmount: 90000, approvalRecorded: true, approverId: 7 });
  assert.equal(approved.allowed, true);
  assert.equal(approved.effectiveAmount, 80000);
  assert.equal(validateDiscount({ lineAmount: 100000, discountAmount: 110000, minimumSellingAmount: null, approvalRecorded: true, approverId: 7 }).allowed, false);
});

test('revenue is not reported as profit; net profit needs real expense records', () => {
  const s = summariseTrading({ revenueAmount: 500000, costOfGoodsAmount: 380000, operatingExpenseAmount: null });
  assert.equal(s.grossProfitAmount, 120000);
  assert.equal(s.netProfitAmount, null);
  const withExpenses = summariseTrading({ revenueAmount: 500000, costOfGoodsAmount: 380000, operatingExpenseAmount: 40000 });
  assert.equal(withExpenses.netProfitAmount, 80000);
});

test('invalid order transitions are rejected and paid requires a verified payment event', () => {
  assert.equal(canTransition('draft', 'paid'), false);
  assert.equal(canTransition('pending_payment', 'paid'), true);
  assert.equal(canTransition('refunded', 'delivered'), false);
  const unpaid = canMarkPaid({ currentStatus: 'pending_payment', orderTotal: 100000, verifiedPayments: [], authorizedReconciliation: false });
  assert.equal(unpaid.allowed, false);
  const partial = canMarkPaid({ currentStatus: 'pending_payment', orderTotal: 100000, verifiedPayments: [{ amount: 40000, status: 'verified', gatewayEventId: 'evt_1', verifiedAt: '2026-11-02T00:00:00Z' }], authorizedReconciliation: false });
  assert.equal(partial.allowed, false);
  const noEvent = canMarkPaid({ currentStatus: 'pending_payment', orderTotal: 100000, verifiedPayments: [{ amount: 100000, status: 'verified', gatewayEventId: null, verifiedAt: '2026-11-02T00:00:00Z' }], authorizedReconciliation: false });
  assert.equal(noEvent.allowed, false);
  const reconciled = canMarkPaid({ currentStatus: 'pending_payment', orderTotal: 100000, verifiedPayments: [{ amount: 100000, status: 'verified', gatewayEventId: null, verifiedAt: '2026-11-02T00:00:00Z' }], authorizedReconciliation: true });
  assert.equal(reconciled.allowed, true);
  const paid = canMarkPaid({ currentStatus: 'pending_payment', orderTotal: 100000, verifiedPayments: [{ amount: 100000, status: 'verified', gatewayEventId: 'evt_1', verifiedAt: '2026-11-02T00:00:00Z' }], authorizedReconciliation: false });
  assert.equal(paid.allowed, true);
});

test('commission uses margin, respects attribution and reverses on returns/cancellations', () => {
  const earned = computeCommission(rule, { lineTotal: 100000, unitCost: 60000, quantity: 1, orderStatus: 'paid', reversed: false, shareBps: 10000 });
  assert.equal(earned.base, 40000);
  assert.equal(earned.amount, 2000);
  assert.equal(earned.status, 'accrued');
  const split = computeCommission(rule, { lineTotal: 100000, unitCost: 60000, quantity: 1, orderStatus: 'paid', reversed: false, shareBps: 5000 });
  assert.equal(split.amount, 1000);
  for (const status of ['cancelled', 'returned', 'refunded']) {
    assert.equal(computeCommission(rule, { lineTotal: 100000, unitCost: 60000, quantity: 1, orderStatus: status, reversed: false, shareBps: 10000 }).status, 'reversed');
  }
  assert.equal(netCommissionForPeriod([{ amount: 2000, status: 'reversed' }, { amount: 1500, status: 'accrued' }]), 1500);
  const minMargin = computeCommission({ ...rule, minMarginBps: 5000 }, { lineTotal: 100000, unitCost: 90000, quantity: 1, orderStatus: 'paid', reversed: false, shareBps: 10000 });
  assert.equal(minMargin.status, 'none');
});

test('PC configurator validates compatibility from verified component data', () => {
  const good = validateBuild({
    cpu: { socket: 'AM5', tdpW: 105, verified: true },
    motherboard: { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', verified: true },
    ram: { type: 'DDR5', verified: true },
    gpu: { lengthMm: 300, recommendedPsuW: 750, verified: true },
    psu: { wattage: 850, verified: true },
    case: { maxGpuLengthMm: 350, formFactor: 'ATX', verified: true },
  });
  assert.equal(good.compatible, true);
  const bad = validateBuild({
    cpu: { socket: 'AM5', tdpW: 105, verified: true },
    motherboard: { socket: 'LGA1700', ramType: 'DDR4', formFactor: 'ATX', verified: true },
    ram: { type: 'DDR5', verified: true },
    gpu: { lengthMm: 400, recommendedPsuW: 850, verified: true },
    psu: { wattage: 650, verified: true },
    case: { maxGpuLengthMm: 320, formFactor: 'ATX', verified: true },
  });
  assert.equal(bad.compatible, false);
  assert.ok(bad.blockers.length >= 4);
  const unverified = validateBuild({ cpu: { socket: 'AM5', tdpW: 65, verified: false } });
  assert.equal(unverified.compatible, true);
  assert.ok(unverified.warnings.length === 1);
});
