import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { all } from '@/lib/server/database';
import { Crumbs, EmptyState, PageHead, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/orders');
  const orders = all<{ id: number; order_number: string; status: string; total_amount: number; created_at: string; channel: string }>(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'অ্যাকাউন্ট', href: '/account' }, { label: 'অর্ডার' }]} />
      <PageHead title="অর্ডার ইতিহাস ও ট্র্যাকিং" subtitle="অবস্থা প্রকৃত অর্ডার রেকর্ড থেকে আসে; কোনো পেমেন্ট যাচাই ছাড়া অর্ডারকে পরিশোধিত দেখানো হয় না।" />
      {orders.length ? <Table headers={['অর্ডার', 'চ্যানেল', 'অবস্থা', 'মোট', 'তারিখ', '']}>{orders.map((o) => <tr key={o.id}><td>{o.order_number}</td><td>{o.channel}</td><td>{o.status}</td><td>৳ {(o.total_amount / 100).toFixed(2)}</td><td>{o.created_at}</td><td><Link href={`/account/orders/${o.id}`}>বিস্তারিত →</Link></td></tr>)}</Table> : <EmptyState title="কোনো অর্ডার নেই"><p><Link href="/products">পণ্য দেখুন</Link></p></EmptyState>}
    </>
  );
}
