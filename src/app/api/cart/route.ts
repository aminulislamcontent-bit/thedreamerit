// Cart API - server-side cart stored in DB (one cart per customer)
// GET    /api/cart      - get current user's cart
// POST   /api/cart      - add item to cart
// PUT    /api/cart      - update item quantity
// DELETE /api/cart      - clear cart
// DELETE /api/cart/item - remove specific item
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, unauthorized, apiHandler } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

async function getOrCreateCart(customerId: string) {
  return db.cart.upsert({
    where: { customerId },
    update: {},
    create: { customerId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });
}

export const GET = apiHandler(async () => {
  const user = await getSession();
  if (!user || !user.customer) {
    // Guest cart - return empty (cart stored client-side via localStorage)
    return ok({ cart: null, items: [], total: 0, itemCount: 0 });
  }

  const cart = await getOrCreateCart(user.customer.id);
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    slug: item.product.slug,
    brand: item.product.brand?.name || null,
    primaryImage: item.product.images[0]?.url || null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.unitPrice * item.quantity,
    configuration: item.configuration ? JSON.parse(item.configuration) : null,
  }));
  const total = items.reduce((sum, i) => sum + i.total, 0);

  return ok({ cart, items, total, itemCount: items.reduce((s, i) => s + i.quantity, 0) });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user || !user.customer) return unauthorized('Login required to add items to cart');

  const body = await req.json();
  const { productId, quantity = 1, configuration } = body;

  if (!productId) return badRequest('Product ID is required');

  const product = await db.product.findUnique({
    where: { id: productId, status: 'PUBLISHED' },
  });
  if (!product) return badRequest('Product not available');

  // Check stock
  const totalStock = await db.inventory.aggregate({
    where: { productId },
    _sum: { quantityAvailable: true },
  });
  if (product.trackInventory && totalStock._sum.quantityAvailable < quantity) {
    return badRequest(`Only ${totalStock._sum.quantityAvailable} units available`);
  }

  const cart = await getOrCreateCart(user.customer.id);

  // Check if same product (with same config) already in cart
  const configJson = configuration ? JSON.stringify(configuration) : null;
  const existing = cart.items.find((i) =>
    i.productId === productId && i.configuration === configJson
  );

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.sellingPrice,
        configuration: configJson,
      },
    });
  }

  const updatedCart = await getOrCreateCart(user.customer.id);
  const items = updatedCart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.unitPrice * item.quantity,
  }));

  return ok({
    items,
    total: items.reduce((s, i) => s + i.total, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  });
});

export const PUT = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user || !user.customer) return unauthorized();

  const body = await req.json();
  const { itemId, quantity } = body;

  if (!itemId || quantity < 1) return badRequest('Invalid item or quantity');

  const cart = await db.cart.findUnique({ where: { customerId: user.customer.id } });
  if (!cart) return badRequest('Cart not found');

  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) return badRequest('Item not in cart');

  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return ok({ success: true });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
  const user = await getSession();
  if (!user || !user.customer) return unauthorized();

  const url = new URL(req.url);
  const itemId = url.searchParams.get('itemId');

  const cart = await db.cart.findUnique({ where: { customerId: user.customer.id } });
  if (!cart) return ok({ success: true });

  if (itemId) {
    await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  } else {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return ok({ success: true });
});
