import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get } from '@/lib/server/database';
import { listProducts } from '@/lib/server/catalogue';
import { Card, Crumbs, EmptyState, PageHead, Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = get<{ id: number; name: string; website: string; verification_status: string }>('SELECT * FROM brands WHERE slug = ?', [slug]);
  if (!b) notFound();
  const products = listProducts({ brandSlug: slug, status: 'published' });
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'পণ্য', href: '/products' }, { label: b.name }]} />
      <PageHead title={`${b.name} — ব্র্যান্ড`} subtitle="এই পৃষ্ঠায় শুধুমাত্র প্রকাশিত, যাচাইকৃত পণ্য দেখানো হয়। ব্র্যান্ড নাম একটি ট্যাক্সোনমি এন্ট্রি; পণ্যের দাবি নয়।" />
      <p><Badge tone={b.verification_status === 'verified' ? 'ok' : 'warn'}>ব্র্যান্ড তথ্য: {b.verification_status}</Badge> {b.website ? <a href={b.website} rel="noopener nofollow">অফিশিয়াল সাইট</a> : null}</p>
      {products.length ? <div className="grid grid-auto">{products.map((p) => <Card key={p.id}><h3><Link href={`/products/${p.slug}`}>{p.model_name}</Link></h3><p className="muted">{p.category_name} · SKU {p.sku}</p></Card>)}</div> : <EmptyState title="এই ব্র্যান্ডের কোনো প্রকাশিত পণ্য নেই"><p>কোনো বানোয়াট পণ্য যোগ করা হয়নি। <Link href="/products">সব পণ্য</Link>।</p></EmptyState>}
    </>
  );
}
