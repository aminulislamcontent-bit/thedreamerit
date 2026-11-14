import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { get, all } from '@/lib/server/database';
import { Badge, Card, Crumbs, PageHead, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const orderId = Number.parseInt(id, 10);
  const order = get<{ id: number; order_number: string; status: string; total_amount: number; created_at: string; user_id: number | null }>('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order || order.user_id !== user.id) notFound();
  const items = all<{ model_name: string; quantity: number; unit_price: number; line_total: number }>(
    'SELECT oi.*, p.model_name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?', [orderId]);
  const payments = all<{ amount: number; status: string; method: string; created_at: string }>('SELECT * FROM payments WHERE order_id = ?', [orderId]);
  const tracking = all<{ status: string; note: string; created_at: string }>('SELECT * FROM delivery_tracking WHERE order_id = ? ORDER BY created_at', [orderId]);
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'অ্যাকাউন্ট', href: '/account' }, { label: 'অর্ডার', href: '/account/orders' }, { label: order.order_number }]} />
      <PageHead title={order.order_number} subtitle={`তৈরি: ${order.created_at}`} actions={<Badge tone={order.status === 'paid' ? 'ok' : 'warn'}>{order.status}</Badge>} />
      <div className="grid grid-2">
        <Card><h2>আইটেম</h2><Table headers={['পণ্য', 'পরিমাণ', 'একক মূল্য', 'মোট']}>{items.map((i, n) => <tr key={n}><td>{i.model_name}</td><td>{i.quantity}</td><td>৳ {(i.unit_price / 100).toFixed(2)}</td><td>৳ {(i.line_total / 100).toFixed(2)}</td></tr>)}</Table><p><strong>মোট: ৳ {(order.total_amount / 100).toFixed(2)}</strong></p></Card>
        <Card><h2>পেমেন্ট ও ট্র্যাকিং</h2>{payments.length ? <Table headers={['পদ্ধতি', 'অঙ্ক', 'অবস্থা']}>{payments.map((p, n) => <tr key={n}><td>{p.method}</td><td>৳ {(p.amount / 100).toFixed(2)}</td><td>{p.status}</td></tr>)}</Table> : <p className="muted">কোনো যাচাইকৃত পেমেন্ট রেকর্ড নেই।</p>}
          <h3 style={{ marginTop: 16 }}>ডেলিভারি আপডেট</h3>{tracking.length ? <ul>{tracking.map((t, n) => <li key={n}>{t.status} — {t.note} ({t.created_at})</li>)}</ul> : <p className="muted">কোনো ট্র্যাকিং ইভেন্ট নেই।</p>}
          <div className="row" style={{ marginTop: 14 }}><Link className="btn btn-sm" href="/account/warranty">ওয়ারেন্টি অনুরোধ</Link><Link className="btn btn-sm" href="/account/returns">রিটার্ন অনুরোধ</Link></div>
        </Card>
      </div>
    </>
  );
}
