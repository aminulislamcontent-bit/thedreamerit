/** Configurable commission engine. Cancelled orders, returns and refunds reverse accruals. */

export type CommissionRule = {
  id: number;
  name: string;
  basis: 'line_margin' | 'revenue' | 'flat_per_unit';
  rateBps: number;
  flatAmount: number;
  minMarginBps: number;
  appliesToReturns: boolean;
  active: boolean;
};

export type CommissionLine = {
  lineTotal: number;
  unitCost: number;
  quantity: number;
  orderStatus: string;
  reversed: boolean;
  shareBps: number; // sales attribution share, 10000 = 100%
};

const REVERSING_STATUSES = new Set(['cancelled', 'returned', 'refunded']);

export function computeCommission(rule: CommissionRule, line: CommissionLine): { amount: number; base: number; status: 'accrued' | 'reversed' | 'none'; reason: string } {
  if (!rule.active) return { amount: 0, base: 0, status: 'none', reason: 'Rule is inactive.' };
  if (line.reversed || REVERSING_STATUSES.has(line.orderStatus)) {
    return { amount: 0, base: 0, status: 'reversed', reason: 'Cancelled, returned or refunded lines do not earn commission.' };
  }
  if (line.shareBps < 0 || line.shareBps > 10000) return { amount: 0, base: 0, status: 'none', reason: 'Invalid attribution share.' };

  let base = 0;
  let amount = 0;
  const margin = line.lineTotal - line.unitCost * line.quantity;
  const marginBps = line.lineTotal === 0 ? 0 : Math.round((margin / line.lineTotal) * 10000);

  if (rule.basis === 'line_margin') {
    if (marginBps < rule.minMarginBps) return { amount: 0, base: margin, status: 'none', reason: `Margin ${marginBps} bps is below the configured minimum ${rule.minMarginBps} bps.` };
    base = margin;
    amount = Math.round((base * rule.rateBps) / 10000);
  } else if (rule.basis === 'revenue') {
    base = line.lineTotal;
    amount = Math.round((base * rule.rateBps) / 10000);
  } else {
    base = line.quantity;
    amount = rule.flatAmount * line.quantity;
  }
  amount = Math.round((amount * line.shareBps) / 10000);
  return { amount, base, status: amount > 0 ? 'accrued' : 'none', reason: `${rule.basis} basis at ${rule.rateBps} bps, attribution ${line.shareBps} bps.` };
}

export function netCommissionForPeriod(records: Array<{ amount: number; status: string }>): number {
  return records.reduce((sum, r) => sum + (r.status === 'reversed' ? 0 : r.amount), 0);
}
