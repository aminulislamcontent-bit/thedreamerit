import Link from 'next/link';
import { listProducts } from '@/lib/server/catalogue';
import { Card, Crumbs, EmptyState, PageHead } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const results = q ? listProducts({ search: q, status: 'published' }) : [];
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'খোঁজা' }]} />
      <PageHead title="পণ্য খোঁজা" subtitle="মডেল নাম, SKU ও ব্র্যান্ডে খোঁজা হয়। ফলাফলে শুধুমাত্র প্রকাশিত যাচাইকৃত পণ্য আসে।" />
      <form method="get" className="inline-form" style={{ marginBottom: 20 }}><div className="field" style={{ flex: 3 }}><label htmlFor="q">অনুসন্ধান</label><input id="q" name="q" defaultValue={q} placeholder="যেমন: laptop" /></div><button className="btn btn-primary" type="submit">খুঁজুন</button></form>
      {q ? (results.length ? <div className="grid grid-auto">{results.map((p) => <Card key={p.id}><h3><Link href={`/products/${p.slug}`}>{p.model_name}</Link></h3><p className="muted">{p.brand_name} · {p.category_name} · SKU {p.sku}</p></Card>)}</div> : <EmptyState title="কোনো প্রকাশিত পণ্য পাওয়া যায়নি"><p>বর্তমানে লাইভ ক্যাটালগে কোনো যাচাইকৃত পণ্য নেই। <Link href="/products?demo=1">ডেমো রেকর্ড</Link> লাইভ ক্যাটালগের অংশ নয়।</p></EmptyState>) : <p className="muted">খোঁজার জন্য একটি শব্দ লিখুন।</p>}
    </>
  );
}
