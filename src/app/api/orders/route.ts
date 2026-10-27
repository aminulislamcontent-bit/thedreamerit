// Orders API
// POST /api/orders - create new order (from cart checkout)
// GET  /api/orders - list orders (admin: all; customer: own only)
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, notFound, unauthorized, forbidden, apiHandler, getClientIp } from '@/lib/api';
import { getSession, hasPermission, hasAnyPermission } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateOrderNumber, generateInvoiceNumber, roundMoney } from '@/lib/security';
import { Prisma } from '@prisma/client';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const status = url.searchParams.get('status');
  const branchId = url.searchParams.get('branchId');
  const customerId = url.searchParams.get('customerId');
  const search = url.searchParams.get('q');

  const where: Prisma.OrderWhereInput = {};

  // Customers see only their own orders
  if (user.customer && !hasAnyPermission(user, ['orders.view'] as any)) {
    where.customerId = user.customer.id;
  } else if (customerId) {
    where.customerId = customerId;
  }

  if (status) where.status = status;
  if (branchId) where.branchId = branchId;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        items: true,
        branch: true,
        customer: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return ok({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      itemCount: o.items.length,
      branch: o.branch,
      createdAt: o.createdAt,
      deliveredAt: o.deliveredAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user) return unauthorized();

  const body = await req.json();
  const {
    customerName, customerPhone, customerEmail,
    shippingAddress, shippingCity,
    billingAddress,
    notes, branchId, items: bodyItems,
    paymentMethod,
  } = body;

  // Validate
  if (!customerName || !customerPhone) return badRequest('Customer name and phone are required');
  if (!bodyItems || !Array.isArray(bodyItems) || bodyItems.length === 0) {
    return badRequest('Cart is empty');
  }

  // If the user is a customer, use their cart from DB; otherwise use the items provided
  let cartItems: any[] = [];
  let customerId: string | undefined = undefined;

  if (user.customer) {
    customerId = user.customer.id;
    const cart = await db.cart.findUnique({
      where: { customerId: user.customer.id },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) return badRequest('Your cart is empty');
    cartItems = cart.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      configuration: i.configuration,
      product: i.product,
    }));
  } else if (bodyItems) {
    // POS or admin-created order - items provided directly
    for (const bi of bodyItems) {
      const product = await db.product.findUnique({ where: { id: bi.productId } });
      if (!product) return badRequest(`Invalid product: ${bi.productId}`);
      cartItems.push({
        productId: bi.productId,
        quantity: bi.quantity,
        unitPrice: bi.unitPrice || product.sellingPrice,
        configuration: bi.configuration ? JSON.stringify(bi.configuration) : null,
        product,
      });
    }
  }

  // Validate stock for each item (transactional check)
  // Compute totals
  let subtotal = 0;
  let taxAmount = 0;
  const orderItemsData: any[] = [];

  for (const item of cartItems) {
    const product = item.product;
    if (product.status !== 'PUBLISHED' && !hasPermission(user, 'pos.sell' as any)) {
      return badRequest(`Product ${product.name} is not available for sale`);
    }

    // Price floor check
    if (product.minSellingPrice > 0 && item.unitPrice < product.minSellingPrice) {
      if (!hasPermission(user, 'pricing.approve' as any)) {
        return badRequest(`Price for ${product.name} is below the minimum selling price. Approval required.`);
      }
    }

    const itemTotal = roundMoney(item.unitPrice * item.quantity);
    const itemTax = roundMoney(itemTotal * (product.taxRate / 100));
    subtotal += itemTotal;
    taxAmount += itemTax;

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: 0,
      taxAmount: itemTax,
      totalAmount: itemTotal,
      costPrice: product.costPrice,
      configuration: item.configuration,
      warrantyMonths: product.warrantyMonths,
    });
  }

  subtotal = roundMoney(subtotal);
  taxAmount = roundMoney(taxAmount);
  const shippingAmount = roundMoney(body.shippingAmount || 0);
  const discountAmount = roundMoney(body.discountAmount || 0);
  const totalAmount = roundMoney(subtotal + taxAmount + shippingAmount - discountAmount);

  // Generate sequential order number
  const orderCount = await db.order.count();
  const orderNumber = generateOrderNumber(orderCount + 1);

  // Use transaction for atomic order creation + stock reservation
  const result = await db.$transaction(async (tx) => {
    // 1. Verify stock and reserve
    for (const item of orderItemsData) {
      const totalAvailable = await tx.inventory.aggregate({
        where: { productId: item.productId },
        _sum: { quantityAvailable: true },
      });
      if (totalAvailable._sum.quantityAvailable < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName}. Available: ${totalAvailable._sum.quantityAvailable}, requested: ${item.quantity}`);
      }

      // Reserve stock by deducting from available and adding to reserved
      // Find the inventory locations and decrement proportionally
      const inventories = await tx.inventory.findMany({
        where: { productId: item.productId, quantityAvailable: { gt: 0 } },
      });
      let remaining = item.quantity;
      for (const inv of inventories) {
        if (remaining <= 0) break;
        const take = Math.min(inv.quantityAvailable, remaining);
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantityReserved: { increment: take },
            quantityAvailable: { decrement: take },
          },
        });
        // Record reservation movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            branchId: inv.branchId,
            warehouseId: inv.warehouseId,
            quantity: -take,
            movementType: 'RESERVATION',
            referenceType: 'ORDER',
            referenceId: orderNumber,
            unitCost: item.costPrice,
            reason: `Reserved for ${orderNumber}`,
            performedBy: user.id,
          },
        });
        remaining -= take;
      }
    }

    // 2. Create order
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId,
        branchId: branchId || null,
        type: user.customer ? 'ONLINE' : 'POS',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'UNFULFILLED',
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        paidAmount: 0,
        currency: 'BDT',
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        billingAddress: billingAddress || null,
        notes: notes || null,
        createdById: user.id,
        salespersonId: hasPermission(user, 'pos.sell' as any) ? user.id : null,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    // 3. Add order status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        changedById: user.id,
        notes: 'Order created',
      },
    });

    // 4. Record initial payment (if provided - for POS)
    if (paymentMethod && totalAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: paymentMethod,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          paidAmount: totalAmount,
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });
    }

    // 5. Create invoice
    const invoiceCount = await tx.invoice.count();
    await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(invoiceCount + 1),
        orderId: order.id,
        type: 'SALES',
        amount: subtotal,
        taxAmount,
        totalAmount,
      },
    });

    // 6. Clear the cart if this was a customer checkout
    if (user.customer) {
      await tx.cartItem.deleteMany({
        where: { cart: { customerId: user.customer.id } },
      });
    }

    return order;
  });

  await logAudit({
    userId: user.id,
    action: 'order.create',
    entityType: 'Order',
    entityId: result.id,
    metadata: { orderNumber, totalAmount, itemCount: orderItemsData.length },
    ipAddress: getClientIp(req),
  });

  return ok({ order: result });
});
