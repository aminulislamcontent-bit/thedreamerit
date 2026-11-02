import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder } from '@/lib/server/orders';
import { nextAllowedStatuses, type OrderStatus } from '@/lib/core/order-state';
import { getProductById } from '@/lib/server/catalogue';
import { requestRefundAction, transitionOrderAction, verifyPaymentAction } from '@/app/actions/orders';
import { adminOrderNoteAction } from '@/app/actions/customer';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const order = getOrder(Number.parseInt(id, 10));
  if (!order) notFound();
  const items = order.items as Array<Record<string, unknown>>;
  const payments = order.payments as Array<Record<string, unknown>>;
  const history = order.history as Array<Record<string, unknown>>;
  const tracking = order.tracking as Array<Record<string, unknown>>;
  const commissions = order.commissions as Array<Record<string, unknown>>;
  const next = nextAllowedStatuses(String(order.status) as OrderStatus);
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title={`অর্ডার ${String(order.order_number)}`} subtitle={`চ্যানেল ${String(order.channel)} · তৈরি ${String(order.created_at)}`} actions={<Badge tone={order.status === 'paid' ? 'ok' : 'warn'}>{String(order.status)}</Badge>} />
      <div className="grid grid-2">
        <Card><h2>আইটেম</h2><Table headers={['পণ্য', 'SKU', 'পরিমাণ', 'একক মূল্য', 'লাইন মোট', 'মূল্য যাচাই']}>{items.map((i, n) => <tr key={n}><td>{String(i.model_name)}</td><td>{String(i.sku)}</td><td>{String(i.quantity)}</td><td>৳ {(Number(i.unit_price) / 100).toFixed(2)}</td><td>৳ {(Number(i.line_total) / 100).toFixed(2)}</td><td>{i.price_verified ? 'হ্যাঁ' : 'না'}</td></tr>)}</Table>
          <p><strong>সাবটোটাল ৳ {(Number(order.subtotal) / 100).toFixed(2)} · ছাড় ৳ {(Number(order.discount_amount) / 100).toFixed(2)} · মোট ৳ {(Number(order.total_amount) / 100).toFixed(2)}</strong></p>
          <h3 style={{ marginTop: 16 }}>কমিশন রেকর্ড</h3>{commissions.length ? <Table headers={['কর্মচারী', 'অঙ্ক', 'অবস্থা']}>{commissions.map((c, n) => <tr key={n}><td>#{String(c.employee_id)}</td><td>৳ {(Number(c.commission_amount) / 100).toFixed(2)}</td><td>{String(c.status)}</td></tr>)}</Table> : <p className="muted">কোনো কমিশন অ্যাক্রুয়াল নেই (বিক্রয় অ্যাট্রিবিউশন বা কমিশন নিয়ম নেই)।</p>}
        </Card>
        <Card><h2>যাচাইকৃত পেমেন্ট রেকর্ড করুন</h2>
          <Notice tone="warn">কোনো পেমেন্ট ইভেন্ট বা অনুমোদিত ক্যাশ রিকনসিলিয়েশন ছাড়া পেমেন্ট যাচাই করা যায় না। ডুপ্লিকেট গেটওয়ে ইভেন্ট প্রত্যাখ্যাত হয়।</Notice>
          <form action={verifyPaymentAction} className="stack"><CsrfInput /><input type="hidden" name="orderId" value={String(order.id)} />
            <div className="form-grid">
              <div className="field"><label htmlFor="amountBdt">অঙ্ক (BDT) *</label><input id="amountBdt" name="amountBdt" type="number" step="0.01" min="0.01" required /></div>
              <div className="field"><label htmlFor="method">পদ্ধতি *</label><select id="method" name="method"><option value="cash">নগদ (অনুমোদিত রিকনসিলিয়েশন)</option><option value="card">কার্ড</option><option value="bank_transfer">ব্যাংক ট্রান্সফার</option><option value="mobile_banking">মোবাইল ব্যাংকিং</option><option value="gateway">গেটওয়ে</option></select></div>
              <div className="field"><label htmlFor="reference">রেফারেন্স</label><input id="reference" name="reference" /></div>
              <div className="field"><label htmlFor="gatewayEventId">Gateway event id</label><input id="gatewayEventId" name="gatewayEventId" /></div>
            </div>
            <button className="btn btn-primary btn-sm" type="submit">যাচাইকৃত পেমেন্ট রেকর্ড করুন</button>
          </form>
          <h3 style={{ marginTop: 18 }}>পেমেন্টসমূহ</h3>{payments.length ? <Table headers={['অঙ্ক', 'পদ্ধতি', 'অবস্থা', 'ইভেন্ট']}>{payments.map((p, n) => <tr key={n}><td>৳ {(Number(p.amount) / 100).toFixed(2)}</td><td>{String(p.method)}</td><td>{String(p.status)}</td><td className="muted">{String(p.gateway_event_id || '—')}</td></tr>)}</Table> : <p className="muted">কোনো পেমেন্ট নেই — অর্ডার পরিশোধিত নয়।</p>}
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <Card><h2>অবস্থা পরিবর্তন</h2><div className="row">{next.map((s) => <form key={s} action={transitionOrderAction}><CsrfInput /><input type="hidden" name="orderId" value={String(order.id)} /><input type="hidden" name="to" value={s} /><button className="btn btn-sm" type="submit">→ {s}</button></form>)}</div>
          <h3 style={{ marginTop: 16 }}>ইতিহাস</h3><Table headers={['সময়', 'থেকে', 'তে']}>{history.map((h, n) => <tr key={n}><td className="muted">{String(h.created_at)}</td><td>{String(h.from_status)}</td><td>{String(h.to_status)}</td></tr>)}</Table>
          <h3 style={{ marginTop: 16 }}>ট্র্যাকিং নোট</h3><form action={adminOrderNoteAction} className="inline-form"><CsrfInput /><input type="hidden" name="orderId" value={String(order.id)} />
            <div className="field"><label htmlFor="note">নোট</label><input id="note" name="note" required /></div><button className="btn btn-sm" type="submit">যোগ করুন</button></form>
          {tracking.length ? <ul>{tracking.map((t, n) => <li key={n}>{String(t.status)} — {String(t.note)}</li>)}</ul> : null}
        </Card>
        <Card><h2>রিফান্ড ও ইনভয়েস</h2><form action={requestRefundAction} className="inline-form"><CsrfInput /><input type="hidden" name="orderId" value={String(order.id)} />
          <div className="field"><label htmlFor="refundAmount">অঙ্ক (BDT)</label><input id="refundAmount" name="amountBdt" type="number" step="0.01" min="0.01" required /></div>
          <div className="field"><label htmlFor="refundReason">কারণ</label><input id="refundReason" name="reason" required /></div>
          <button className="btn btn-sm btn-danger" type="submit">রিফান্ড অনুরোধ</button>
        </form>
        <p className="muted" style={{ fontSize: '.82rem' }}>রিফান্ড যাচাইকৃত পেমেন্টের অঙ্কের বেশি হতে পারে না। বাতিল/রিটার্ন/রিফান্ডে রিজার্ভেশন মুক্ত ও কমিশন বিপরীত করা হয়।</p>
        <h3 style={{ marginTop: 16 }}>পণ্য লিংক</h3><div className="tag-list">{items.map((i, n) => { const p = getProductById(Number(i.product_id)); return p ? <Link key={n} className="badge badge-info" href={`/admin/products/${p.id}`}>{p.model_name}</Link> : null; })}</div>
        <p style={{ marginTop: 14 }}><Link className="btn btn-sm" href="/admin/orders">← সব অর্ডার</Link></p>
        </Card>
      </div>
    </>
  );
}
