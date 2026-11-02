/** Valid order lifecycle and the payment-verification gate. */

export const ORDER_STATUSES = ['draft', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'refunded', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: ['refunded'],
  refunded: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** An order may only be marked paid on the back of a verified payment event. */
export function canMarkPaid(input: {
  currentStatus: OrderStatus;
  orderTotal: number;
  verifiedPayments: Array<{ amount: number; status: string; gatewayEventId: string | null; verifiedAt: string | null }>;
  authorizedReconciliation: boolean;
}): { allowed: boolean; reason: string; verifiedTotal: number } {
  if (!canTransition(input.currentStatus, 'paid')) return { allowed: false, reason: `Transition ${input.currentStatus} → paid is not valid.`, verifiedTotal: 0 };
  const verifiedTotal = input.verifiedPayments
    .filter((p) => p.status === 'verified' && p.verifiedAt && (p.gatewayEventId || input.authorizedReconciliation))
    .reduce((sum, p) => sum + p.amount, 0);
  if (verifiedTotal < input.orderTotal) {
    return { allowed: false, reason: `Verified payment ${verifiedTotal} poysha is below the order total ${input.orderTotal} poysha.`, verifiedTotal };
  }
  return { allowed: true, reason: 'Verified payment event covers the order total.', verifiedTotal };
}

export function nextAllowedStatuses(status: OrderStatus): OrderStatus[] {
  return TRANSITIONS[status] ?? [];
}
