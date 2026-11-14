'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { guard, field, intField, done, fail, withQuery } from '@/lib/server/action-utils';
import { getCurrentUser, checkRateLimit, clientIp } from '@/lib/server/auth';
import { addToCart, clearCart, getCartView, removeFromCart } from '@/lib/server/cart';
import { createOrder } from '@/lib/server/orders';
import { run, nowIso } from '@/lib/server/database';
import { addressSchema } from '@/lib/core/validation';

export async function cartAddAction(fd: FormData): Promise<void> {
  const result = await addToCart(intField(fd, 'productId'), intField(fd, 'quantity', 1));
  if (!result.ok) fail('/products', result.error || 'Could not add to cart.');
  done('/cart', 'Product added to cart.');
}

export async function cartRemoveAction(fd: FormData): Promise<void> {
  await removeFromCart(intField(fd, 'itemId'));
  revalidatePath('/cart');
  done('/cart', 'Item removed.');
}

export async function checkoutAction(fd: FormData): Promise<void> {
  const cart = await getCartView();
  if (!cart || !cart.items.length) fail('/cart', 'Your cart is empty.');
  const parsed = addressSchema.safeParse({ name: field(fd, 'name'), phone: field(fd, 'phone'), email: field(fd, 'email'), address: field(fd, 'address') });
  if (!parsed.success) fail('/checkout', parsed.error.issues.map((i) => i.message).join(' '));
  const user = await getCurrentUser();
  const result = run('INSERT INTO customers (user_id, name, phone, email, address, consent_marketing, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [user?.id ?? null, parsed.data.name, parsed.data.phone, parsed.data.email, parsed.data.address, nowIso()]);
  const order = await createOrder({
    lines: cart.items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
    channel: 'web', customerId: Number(result.lastInsertRowid), userId: user?.id ?? null, branchId: 1,
  });
  if (!order.ok) fail('/checkout', order.errors.join(' | '));
  await clearCart(cart.id);
  revalidatePath('/account/orders');
  redirect(withQuery(`/checkout`, { order: order.orderNumber, placed: '1' }));
}

export async function warrantyRequestAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) fail('/login', 'Please sign in to submit a warranty request.');
  const orderId = intField(fd, 'orderId');
  if (!orderId) fail('/account/warranty', 'Order id required.');
  run('INSERT INTO warranty_claims (order_id, product_id, serial_number, issue, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [orderId, intField(fd, 'productId'), field(fd, 'serial'), field(fd, 'issue'), 'open', nowIso()]);
  revalidatePath('/account/warranty');
  done('/account/warranty', 'Warranty request recorded.');
}

export async function returnRequestAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) fail('/login', 'Please sign in to request a return.');
  run('INSERT INTO return_requests (order_id, product_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?)',
    [intField(fd, 'orderId'), intField(fd, 'productId'), field(fd, 'reason'), 'requested', nowIso()]);
  revalidatePath('/account/returns');
  done('/account/returns', 'Return request recorded for review.');
}

export async function wishlistAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) fail('/login', 'Sign in to save a wishlist.');
  const productId = intField(fd, 'productId');
  if (!productId) fail('/products', 'Product required.');
  run('INSERT OR IGNORE INTO wishlist_items (user_id, product_id, created_at) VALUES (?, ?, ?)', [user.id, productId, nowIso()]);
  revalidatePath('/account/wishlist');
  done('/account/wishlist', 'Saved to your wishlist.');
}

/** Public contact/enquiry form: rate limited, no permission gate, no assumed consent. */
export async function contactAction(fd: FormData): Promise<void> {
  const ip = await clientIp();
  const limit = checkRateLimit('contact', ip || 'unknown', 5, 3600);
  if (!limit.allowed) fail('/contact', 'Too many enquiries. Please try again later.');
  if (field(fd, 'website')) fail('/contact', 'Spam check failed.'); // honeypot
  const name = field(fd, 'name');
  const message = field(fd, 'message');
  if (!name || !message) fail('/contact', 'Name and message are required.');
  run('INSERT INTO leads (name, phone, email, source, status, consent_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, field(fd, 'phone'), field(fd, 'email'), 'website-contact', 'new', field(fd, 'consent') === '1' ? 1 : 0, nowIso()]);
  done('/contact', 'আপনার বার্তা রেকর্ড করা হয়েছে। আমরা যত দ্রুত সম্ভব যোগাযোগ করব।');
}

export async function supportTicketAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) fail('/login', 'Sign in to open a support ticket.');
  const subject = field(fd, 'subject');
  if (!subject) fail('/faq', 'Subject required.');
  run('INSERT INTO support_tickets (customer_id, subject, body, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [null, subject, field(fd, 'body'), 'open', 'normal', nowIso()]);
  done('/faq', 'Support ticket recorded.');
}

export async function updatePreferencesAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) fail('/login', 'Sign in to change preferences.');
  const customerId = intField(fd, 'customerId');
  run(`INSERT INTO marketing_preferences (customer_id, email, sms, whatsapp) VALUES (?, ?, ?, ?)
    ON CONFLICT(customer_id) DO UPDATE SET email = excluded.email, sms = excluded.sms, whatsapp = excluded.whatsapp`,
    [customerId, field(fd, 'email') === '1' ? 1 : 0, field(fd, 'sms') === '1' ? 1 : 0, field(fd, 'whatsapp') === '1' ? 1 : 0]);
  done('/account', 'Marketing preferences updated.');
}

export async function adminOrderNoteAction(fd: FormData): Promise<void> {
  const user = await guard(fd, 'orders.manage');
  const orderId = intField(fd, 'orderId');
  run('INSERT INTO delivery_tracking (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
    [orderId, field(fd, 'status') || 'note', field(fd, 'note'), nowIso()]);
  void user;
  done(`/admin/orders/${orderId}`, 'Tracking note added.');
}
