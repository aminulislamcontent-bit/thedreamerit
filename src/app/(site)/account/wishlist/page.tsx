import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/auth';
import { all } from '@/lib/server/database';
import { Crumbs, EmptyState, PageHead, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/wishlist');
  const items = all<{ slug: string; model_name: string; brand_name: string }>(`SELECT p.slug, p.model_name, b.name AS brand_name FROM wishlist_items w JOIN products p ON p.id = w.product_id JOIN brands b ON b.id = p.brand_id WHERE w.user_id = ?`, [user.id]);
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'অ্যাকাউন্ট', href: '/account' }, { label: 'উইশলিস্ট' }]} /><PageHead title="উইশলিস্ট" subtitle="আপনার সংরক্ষিত পণ্য।" />
      {items.length ? <div className="grid grid-auto">{items.map((i) => <Card key={i.slug}><h3><Link href={`/products/${i.slug}`}>{i.model_name}</Link></h3><p className="muted">{i.brand_name}</p></Card>)}</div> : <EmptyState title="উইশলিস্ট খালি"><p><Link href="/products">পণ্য দেখুন</Link></p></EmptyState>}
    </>
  );
}
