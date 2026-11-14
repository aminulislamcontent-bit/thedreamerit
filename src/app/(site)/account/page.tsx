import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { all, get } from '@/lib/server/database';
import { updatePreferencesAction } from '@/app/actions/customer';
import { Badge, Card, Crumbs, PageHead, PageNotices } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');
  const customer = get<{ id: number; name: string; phone: string; consent_marketing: number }>('SELECT * FROM customers WHERE user_id = ?', [user.id]);
  const orders = all<{ id: number; order_number: string; status: string; total_amount: number; created_at: string }>('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'আমার অ্যাকাউন্ট' }]} />
      <PageNotices searchParams={sp} />
      <PageHead title={`স্বাগতম, ${user.name}`} subtitle={user.email} actions={<Badge tone="info">{user.roles.join(', ') || 'customer'}</Badge>} />
      <div className="grid grid-2">
        <Card><h2>আমার অ্যাকাউন্ট</h2><p className="muted">ফোন: {customer?.phone || 'রেকর্ড করা হয়নি'} · মার্কেটিং সম্মতি: {customer?.consent_marketing ? 'দেওয়া হয়েছে' : 'দেওয়া হয়নি'}</p>
          <div className="tag-list"><Link className="btn btn-sm" href="/account/orders">অর্ডার ইতিহাস</Link><Link className="btn btn-sm" href="/account/wishlist">উইশলিস্ট</Link><Link className="btn btn-sm" href="/account/warranty">ওয়ারেন্টি</Link><Link className="btn btn-sm" href="/account/returns">রিটার্ন</Link></div>
          {user.permissions.length ? <p style={{ marginTop: 14 }}><Link className="btn btn-sm btn-primary" href="/admin">অ্যাডমিন প্যানেল →</Link></p> : null}
        </Card>
        <Card><h2>মার্কেটিং পছন্দ</h2><p className="muted">কোনো চ্যানেল ডিফল্টভাবে সক্রিয় নয়; পরিবর্তন রেকর্ড করা হয়।</p>
          <form action={updatePreferencesAction}>
            <input type="hidden" name="customerId" value={customer?.id ?? 0} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="email" value="1" style={{ width: 'auto' }} /> ইমেইল</label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="sms" value="1" style={{ width: 'auto' }} /> SMS</label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="whatsapp" value="1" style={{ width: 'auto' }} /> WhatsApp</label>
            <button className="btn btn-sm btn-primary" style={{ marginTop: 10 }} type="submit">সংরক্ষণ</button>
          </form>
        </Card>
      </div>
      <h2 style={{ marginTop: 26 }}>সাম্প্রতিক অর্ডার</h2>
      {orders.length ? <div className="table-wrap"><table><thead><tr><th>অর্ডার</th><th>অবস্থা</th><th>মোট</th><th>তারিখ</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td><Link href={`/account/orders/${o.id}`}>{o.order_number}</Link></td><td>{o.status}</td><td>৳ {(o.total_amount / 100).toFixed(2)}</td><td>{o.created_at}</td></tr>)}</tbody></table></div> : <p className="muted">কোনো অর্ডার এখনো তৈরি হয়নি।</p>}
    </>
  );
}
