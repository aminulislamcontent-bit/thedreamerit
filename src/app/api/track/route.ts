// Track order by order number or phone (public, no auth required)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, apiHandler } from '@/lib/api';

export const GET = apiHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get('orderNumber');
  const phone = url.searchParams.get('phone');

  if (!orderNumber && !phone) {
    return badRequest('Order number or phone is required');
  }

  const where: any = {};
  if (orderNumber) where.orderNumber = { contains: orderNumber };
  if (phone) where.customerPhone = { contains: phone };

  const orders = await db.order.findMany({
    where,
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (orders.length === 0) {
    return notFound('No orders found with the provided information');
  }

  return ok({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      createdAt: o.createdAt,
      deliveredAt: o.deliveredAt,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalAmount: i.totalAmount,
        primaryImage: i.product?.images[0]?.url || null,
      })),
      statusHistory: o.statusHistory,
    })),
  });
});
