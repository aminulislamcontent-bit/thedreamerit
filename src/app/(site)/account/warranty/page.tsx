import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { all } from '@/lib/server/database';
import { warrantyRequestAction } from '@/app/actions/customer';
import { Crumbs, PageHead, PageNotices, Card, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function WarrantyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/warranty');
  const orders = all<{ id: number; order_number: string }>('SELECT id, order_number FROM orders WHERE user_id = ?', [user.id]);
  const claims = all<{ id: number; order_id: number; issue: string; status: string; created_at: string }>('SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT 50');
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'অ্যাকাউন্ট', href: '/account' }, { label: 'ওয়ারেন্টি' }]} /><PageNotices searchParams={sp} />
      <PageHead title="ওয়ারেন্টি অনুরোধ" subtitle="সিরিয়াল নাম্বার ও ক্রয় রেকর্ডের ভিত্তিতে অনুরোধ যাচাই করা হয়।" />
      <div className="grid grid-2">
        <Card><h2>নতুন অনুরোধ</h2>{orders.length ? <form action={warrantyRequestAction} className="stack">
          <div className="field"><label htmlFor="orderId">অর্ডার</label><select id="orderId" name="orderId">{orders.map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}</select></div>
          <div className="field"><label htmlFor="productId">পণ্য আইডি</label><input id="productId" name="productId" type="number" min="1" required /></div>
          <div className="field"><label htmlFor="serial">সিরিয়াল নাম্বার</label><input id="serial" name="serial" /></div>
          <div className="field"><label htmlFor="issue">সমস্যা</label><textarea id="issue" name="issue" required /></div>
          <button className="btn btn-primary" type="submit">অনুরোধ পাঠান</button>
        </form> : <p className="muted">কোনো অর্ডার নেই — <Link href="/products">পণ্য দেখুন</Link>।</p>}</Card>
        <Card><h2>আগের অনুরোধ</h2>{claims.length ? <Table headers={['অর্ডার', 'সমস্যা', 'অবস্থা']}>{claims.map((c) => <tr key={c.id}><td>#{c.order_id}</td><td>{c.issue}</td><td>{c.status}</td></tr>)}</Table> : <p className="muted">কোনো ওয়ারেন্টি দাবি নেই।</p>}</Card>
      </div>
    </>
  );
}
