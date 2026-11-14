/** Pricing rules: authorized price floors, discount approval, margin (never revenue as profit). */

export type PriceContext = {
  sellingAmount: number | null; // poysha
  minimumSellingAmount: number | null; // poysha
  unitCost: number | null; // poysha, landed cost from a supplier invoice
  priceVerified: boolean;
  priceSourceUrl: string;
};

export type PriceAssessment = {
  displayPrice: boolean;
  amount: number | null;
  grossMarginAmount: number | null;
  grossMarginBps: number | null;
  blockers: string[];
};

export function assessPrice(ctx: PriceContext): PriceAssessment {
  const blockers: string[] = [];
  if (ctx.sellingAmount === null) {
    return { displayPrice: false, amount: null, grossMarginAmount: null, grossMarginBps: null, blockers: [] };
  }
  if (!Number.isInteger(ctx.sellingAmount) || ctx.sellingAmount <= 0) blockers.push('Selling price must be a positive integer amount in poysha.');
  if (!ctx.priceVerified) blockers.push('Price has not been verified against an authorized price source.');
  if (!ctx.priceSourceUrl.trim()) blockers.push('Price source URL is missing.');
  if (ctx.minimumSellingAmount !== null && ctx.sellingAmount < ctx.minimumSellingAmount) {
    blockers.push('Price is below the authorized minimum selling price.');
  }
  const grossMarginAmount = ctx.unitCost === null ? null : ctx.sellingAmount - ctx.unitCost;
  const grossMarginBps = grossMarginAmount === null || ctx.sellingAmount === 0 ? null : Math.round((grossMarginAmount / ctx.sellingAmount) * 10000);
  return {
    displayPrice: blockers.length === 0,
    amount: blockers.length === 0 ? ctx.sellingAmount : null,
    grossMarginAmount,
    grossMarginBps,
    blockers,
  };
}

/** A discount can never push a line below the authorized floor without recorded approval. */
export function validateDiscount(input: {
  lineAmount: number;
  discountAmount: number;
  minimumSellingAmount: number | null;
  approvalRecorded: boolean;
  approverId: number | null;
}): { allowed: boolean; effectiveAmount: number; blockers: string[] } {
  const blockers: string[] = [];
  if (!Number.isInteger(input.discountAmount) || input.discountAmount < 0) blockers.push('Discount must be a non-negative integer.');
  if (input.discountAmount > input.lineAmount) blockers.push('Discount cannot exceed the line amount.');
  const effectiveAmount = input.lineAmount - input.discountAmount;
  if (input.minimumSellingAmount !== null && effectiveAmount < input.minimumSellingAmount) {
    // Below-floor sales are permitted only with a recorded, authorized approval.
    // The approval itself is logged by the caller and retained in the audit trail.
    if (!input.approvalRecorded || !input.approverId) {
      blockers.push('A recorded, authorized discount approval is required below the price floor.');
    }
  }
  return { allowed: blockers.length === 0, effectiveAmount, blockers };
}

/** Revenue is not profit. Net profit needs actual accounting records, which the app does not invent. */
export function summariseTrading(input: { revenueAmount: number; costOfGoodsAmount: number; operatingExpenseAmount: number | null }) {
  const grossProfit = input.revenueAmount - input.costOfGoodsAmount;
  return {
    revenueAmount: input.revenueAmount,
    costOfGoodsAmount: input.costOfGoodsAmount,
    grossProfitAmount: grossProfit,
    netProfitAmount: input.operatingExpenseAmount === null ? null : grossProfit - input.operatingExpenseAmount,
    note: input.operatingExpenseAmount === null ? 'Net profit is unavailable until actual operating expenses are recorded.' : 'Net profit uses recorded operating expenses only.',
  };
}
