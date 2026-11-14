import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { all } from '@/lib/server/database';
import { returnRequestAction } from '@/app/actions/customer';
import { Crumbs, PageHead, PageNotices, Card, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/returns');
  const orders = all<{ id: number; order_number: string }>('SELECT id, order_number FROM orders WHERE user_id = ?', [user.id]);
  const requests = all<{ id: number; order_id: number; reason: string; status: string }>('SELECT * FROM return_requests ORDER BY created_at DESC LIMIT 50');
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'অ্যাকাউন্ট', href: '/account' }, { label: 'রিটার্ন' }]} /><PageNotices searchParams={sp} />
      <PageHead title="রিটার্ন অনুরোধ" subtitle="রিটার্ন অনুমোদনের পর স্টক ও কমিশন সংশোধন করা হয়।" />
      <div className="grid grid-2">
        <Card><h2>নতুন অনুরোধ</h2><form action={returnRequestAction} className="stack">
          <div className="field"><label htmlFor="orderId">অর্ডার</label><select id="orderId" name="orderId">{orders.map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}</select></div>
          <div className="field"><label htmlFor="productId">পণ্য আইডি</label><input id="productId" name="productId" type="number" min="1" required /></div>
          <div className="field"><label htmlFor="reason">কারণ</label><textarea id="reason" name="reason" required /></div>
          <button className="btn btn-primary" type="submit">অনুরোধ পাঠান</button>
        </form></Card>
        <Card><h2>অনুরোধসমূহ</h2>{requests.length ? <Table headers={['অর্ডার', 'কারণ', 'অবস্থা']}>{requests.map((r) => <tr key={r.id}><td>#{r.order_id}</td><td>{r.reason}</td><td>{r.status}</td></tr>)}</Table> : <p className="muted">কোনো রিটার্ন অনুরোধ নেই।</p>}</Card>
      </div>
    </>
  );
}
