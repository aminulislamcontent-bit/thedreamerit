/** Cart persistence tied to an httpOnly-free random cart key cookie. */

import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { all, get, run, nowIso } from './database';
import { assessPrice } from '../core/pricing-rules';
import { availableFor } from './inventory';

export const CART_COOKIE = 'dit_cart';

export async function cartKey(): Promise<string> {
  const jar = await cookies();
  let key = jar.get(CART_COOKIE)?.value;
  if (!key || !/^[a-f0-9]{32}$/.test(key)) {
    key = randomBytes(16).toString('hex');
    jar.set(CART_COOKIE, key, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  }
  return key;
}

export async function ensureCart(userId: number | null = null): Promise<number> {
  const key = await cartKey();
  const cart = get<{ id: number }>("SELECT id FROM carts WHERE cart_key = ? AND status = 'active'", [key]);
  if (cart) return cart.id;
  const result = run('INSERT INTO carts (cart_key, user_id, status, created_at) VALUES (?, ?, ?, ?)', [key, userId, 'active', nowIso()]);
  return Number(result.lastInsertRowid);
}

export type CartView = {
  id: number;
  items: Array<{ id: number; product_id: number; variant_id: number; quantity: number; unit_price: number; model_name: string; slug: string; sku: string; price_verified: number }>;
  subtotal: number;
};

export async function getCartView(): Promise<CartView | null> {
  const jar = await cookies();
  const key = jar.get(CART_COOKIE)?.value;
  if (!key) return null;
  const cart = get<{ id: number }>("SELECT id FROM carts WHERE cart_key = ? AND status = 'active'", [key]);
  if (!cart) return null;
  const items = all<CartView['items'][number]>(
    `SELECT ci.*, p.model_name, p.slug, p.sku FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`, [cart.id]);
  return { id: cart.id, items, subtotal: items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0) };
}

/** Only published products with a verified, sourced price can enter a cart. */
export async function addToCart(productId: number, quantity: number): Promise<{ ok: boolean; error?: string }> {
  if (quantity <= 0 || quantity > 99) return { ok: false, error: 'Invalid quantity.' };
  const p = get<{ id: number; status: string; is_demo: number; price_amount: number | null; price_verified: number; price_source_url: string; minimum_selling_amount: number | null; model_name: string }>(
    'SELECT id, status, is_demo, price_amount, price_verified, price_source_url, minimum_selling_amount, model_name FROM products WHERE id = ?', [productId]);
  if (!p || p.status !== 'published' || p.is_demo) return { ok: false, error: 'This product is not published in the live catalogue.' };
  const price = assessPrice({ sellingAmount: p.price_amount, minimumSellingAmount: p.minimum_selling_amount, unitCost: null, priceVerified: !!p.price_verified, priceSourceUrl: p.price_source_url });
  if (!price.displayPrice || price.amount === null) return { ok: false, error: `Verified price unavailable: ${price.blockers.join(' ')}` };
  if (availableFor(productId) < quantity) return { ok: false, error: 'Not enough verified stock available.' };
  const cartId = await ensureCart();
  const existing = get<{ id: number; quantity: number }>('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = 0', [cartId, productId]);
  if (existing) run('UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?', [existing.quantity + quantity, price.amount, existing.id]);
  else run('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, price_verified) VALUES (?, ?, 0, ?, ?, 1)', [cartId, productId, quantity, price.amount]);
  return { ok: true };
}

export async function removeFromCart(itemId: number): Promise<void> {
  run('DELETE FROM cart_items WHERE id = ?', [itemId]);
}

export async function clearCart(cartId: number): Promise<void> {
  run("UPDATE carts SET status = 'converted' WHERE id = ?", [cartId]);
}
