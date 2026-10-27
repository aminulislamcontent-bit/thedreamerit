// GET /api/dashboard - aggregate metrics for Super Admin dashboard
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, unauthorized, forbidden, apiHandler } from '@/lib/api';
import { getSession, hasAnyPermission } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();
  if (!hasAnyPermission(user, ['reports.view'] as any)) return forbidden();

  const url = new URL(req.url);
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const branchId = url.searchParams.get('branchId');

  const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toParam ? new Date(toParam) : new Date();
  const whereOrder: Prisma.OrderWhereInput = { createdAt: { gte: from, lte: to } };
  if (branchId) whereOrder.branchId = branchId;

  const [
    totalOrders,
    totalSalesRows,
    pendingPayments,
    totalProducts,
    totalCustomers,
    pendingReviews,
    pendingApprovals,
    openTickets,
    pendingCommissions,
    branchCount,
    employeeCount,
    supplierCount,
    failedJobs,
    recentOrders,
    topProducts,
    branchPerformance,
    salesTrend,
    lowStockItems,
    inventoryTotal,
  ] = await Promise.all([
    db.order.count({ where: whereOrder }),
    db.order.aggregate({
      where: { ...whereOrder, status: { in: ['CONFIRMED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'DELIVERED'] } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.order.aggregate({
      where: { ...whereOrder, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.product.count(),
    db.customer.count(),
    db.contentDraft.count({ where: { status: 'IN_REVIEW' } }),
    db.product.count({ where: { status: 'PENDING_REVIEW' } }),
    db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    db.commissionTransaction.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    }),
    db.branch.count({ where: { isActive: true } }),
    db.employee.count({ where: { isActive: true } }),
    db.supplier.count({ where: { isActive: true } }),
    db.publishingJob.count({ where: { status: 'FAILED' } }),
    db.order.findMany({
      where: whereOrder,
      include: { items: true, branch: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.orderItem.groupBy({
      by: ['productId'],
      where: { order: whereOrder },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    db.order.groupBy({
      by: ['branchId'],
      where: whereOrder,
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as orders, CAST(SUM(totalAmount) AS REAL) as revenue
      FROM "Order"
      WHERE createdAt >= ${from} AND createdAt <= ${to}
      ${branchId ? Prisma.sql`AND branchId = ${branchId}` : Prisma.sql``}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 30
    `,
    db.inventory.findMany({
      where: { quantityAvailable: { lte: 5 } },
      include: { product: { include: { brand: true } }, branch: true },
      take: 10,
    }),
    db.inventory.findMany({ include: { product: true } }),
  ]);

  // Resolve top products names
  const topProductIds = topProducts.map((tp) => tp.productId);
  const productDetails = await db.product.findMany({
    where: { id: { in: topProductIds } },
    include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
  });
  const productMap = new Map(productDetails.map((p) => [p.id, p]));

  // Resolve branch names
  const branches = await db.branch.findMany();
  const branchMap = new Map(branches.map((b) => [b.id, b]));

  const totalInventoryValue = inventoryTotal.reduce(
    (sum, i) => sum + (i.valuationUnit * i.quantityOnHand), 0
  );

  return ok({
    metrics: {
      totalOrders,
      totalSales: totalSalesRows._sum.totalAmount || 0,
      totalPaid: totalSalesRows._sum.paidAmount || 0,
      pendingPayments: (pendingPayments._sum.totalAmount || 0) - (pendingPayments._sum.paidAmount || 0),
      totalProducts,
      totalCustomers,
      totalInventoryValue,
      lowStockCount: lowStockItems.length,
      pendingReviews,
      pendingApprovals,
      openTickets,
      pendingCommission: pendingCommissions._sum.amount || 0,
      pendingCommissionCount: pendingCommissions._count,
      failedJobs,
      branchCount,
      employeeCount,
      supplierCount,
    },
    lowStockItems: lowStockItems.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      brand: i.product.brand?.name || null,
      sku: i.product.sku,
      branchName: i.branch?.name || null,
      quantityOnHand: i.quantityOnHand,
      quantityAvailable: i.quantityAvailable,
      reorderThreshold: i.reorderThreshold,
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      branch: o.branch?.name || null,
      itemCount: o.items.length,
      createdAt: o.createdAt,
    })),
    topProducts: topProducts.map((tp) => {
      const p = productMap.get(tp.productId);
      return {
        productId: tp.productId,
        productName: p?.name || 'Unknown',
        brand: p?.brand?.name || null,
        primaryImage: p?.images[0]?.url || null,
        unitsSold: tp._sum.quantity,
        revenue: tp._sum.totalAmount,
      };
    }),
    branchPerformance: branchPerformance.map((bp) => ({
      branchId: bp.branchId,
      branchName: bp.branchId ? branchMap.get(bp.branchId)?.name : 'Online',
      totalOrders: bp._count,
      totalRevenue: bp._sum.totalAmount,
    })),
    salesTrend: Array.isArray(salesTrend)
      ? salesTrend.map((row: any) => ({
          date: String(row.date),
          orders: Number(row.orders),
          revenue: Number(row.revenue),
        }))
      : [],
    period: { from, to },
  });
});
