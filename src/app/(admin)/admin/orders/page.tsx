import Link from 'next/link';
import { listOrders } from '@/lib/server/orders';
import { all } from '@/lib/server/database';
import { Badge, Card, PageHead, Table, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = listOrders();
  const refunds = all<{ id: number; order_id: number; amount: number; status: string }>('SELECT * FROM refunds ORDER BY id DESC');
  const returns = all<{ id: number; order_id: number; status: string; reason: string }>('SELECT * FROM return_requests ORDER BY id DESC');
  const reconciliations = all<{ id: number; business_date: string; expected_amount: number; counted_amount: number; variance: number }>('SELECT * FROM cash_reconciliations ORDER BY id DESC');
  return (
    <>
      <PageHead title="অর্ডার, পেমেন্ট ও রিফান্ড" subtitle="বৈধ অর্ডার স্টেট মেশিন, সার্ভার-সাইড অথোরাইজেশন, যাচাইকৃত পেমেন্ট ইভেন্ট, রিটার্ন/রিফান্ড, ক্যাশ রিকনসিলিয়েশন ও অবস্থার ইতিহাস।" />
      <div className="grid grid-4"><Stat label="মোট অর্ডার" value={orders.length} /><Stat label="যাচাইকৃত পেমেন্ট" value={all('SELECT * FROM payments').length} /><Stat label="রিফান্ড অনুরোধ" value={refunds.length} /><Stat label="রিটার্ন অনুরোধ" value={returns.length} /></div>
      <h2 style={{ marginTop: 22 }}>অর্ডার</h2>
      {orders.length ? <Table headers={['অর্ডার', 'গ্রাহক', 'চ্যানেল', 'অবস্থা', 'মোট', 'তারিখ', '']}>{orders.map((o) => <tr key={o.id}><td>{o.order_number}</td><td>{o.customer_name || '—'}</td><td>{o.channel}</td><td><Badge tone={o.status === 'paid' ? 'ok' : 'warn'}>{o.status}</Badge></td><td>৳ {(o.total_amount / 100).toFixed(2)}</td><td className="muted">{o.created_at}</td><td><Link className="btn btn-sm" href={`/admin/orders/${o.id}`}>খুলুন →</Link></td></tr>)}</Table> : <Card><p className="muted">কোনো অর্ডার নেই। অর্ডার শুধুমাত্র প্রকাশিত পণ্য ও যাচাইকৃত স্টক থেকে তৈরি হয়।</p></Card>}
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card><h2>রিটার্ন ও রিফান্ড</h2>{returns.length || refunds.length ? <Table headers={['ধরন', 'অর্ডার', 'অঙ্ক / কারণ', 'অবস্থা']}>
          {returns.map((r) => <tr key={`ret-${r.id}`}><td>return</td><td>#{r.order_id}</td><td>{r.reason}</td><td>{r.status}</td></tr>)}
          {refunds.map((r) => <tr key={`ref-${r.id}`}><td>refund</td><td>#{r.order_id}</td><td>৳ {(r.amount / 100).toFixed(2)}</td><td>{r.status}</td></tr>)}
        </Table> : <p className="muted">কোনো রিটার্ন/রিফান্ড নেই।</p>}</Card>
        <Card><h2>ক্যাশ রিকনসিলিয়েশন</h2>{reconciliations.length ? <Table headers={['তারিখ', 'প্রত্যাশিত', 'গণনা', 'পার্থক্য']}>{reconciliations.map((r) => <tr key={r.id}><td>{r.business_date}</td><td>৳ {(r.expected_amount / 100).toFixed(2)}</td><td>৳ {(r.counted_amount / 100).toFixed(2)}</td><td>৳ {(r.variance / 100).toFixed(2)}</td></tr>)}</Table> : <p className="muted">কোনো রিকনসিলিয়েশন রেকর্ড নেই। অনুমোদিত রিকনসিলিয়েশন ছাড়া ক্যাশ পেমেন্ট যাচাই হয় না।</p>}</Card>
      </div>
    </>
  );
}
