import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, scalar } from '@/lib/server/database';
import { listProducts } from '@/lib/server/catalogue';
import { SPEC_TEMPLATES, type SpecTemplate } from '@/lib/core/identity';
import { Badge, Card, Crumbs, EmptyState, PageHead } from '@/components/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = get<{ name_en: string }>('SELECT name_en FROM categories WHERE slug = ?', [slug]);
  return { title: c ? `${c.name_en} — পণ্য ক্যাটাগরি` : 'ক্যাটাগরি' };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = get<{ id: number; name_en: string; group_name: string; is_active: number; spec_template: SpecTemplate; description: string }>(
    'SELECT * FROM categories WHERE slug = ?', [slug]);
  if (!c) notFound();
  const verified = scalar("SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND verification_status = 'verified' AND is_demo = 0", [c.id]);
  const published = listProducts({ categorySlug: slug, status: 'published' });
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'ক্যাটাগরি', href: '/categories' }, { label: c.name_en }]} />
      <PageHead title={c.name_en} subtitle={`${c.group_name} · ${c.is_active ? 'সক্রিয় ক্যাটাগরি' : 'প্রস্তাবিত ক্যাটাগরি (এখনো সক্রিয় নয়)'}`} />
      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <Card><div className="label muted">স্বতন্ত্র যাচাইকৃত মডেল</div><div className="product-price">{verified} / 15</div><p className="muted">{Math.max(0, 15 - verified)}টি মডেলের ঘাটতি</p></Card>
        <Card><div className="label muted">প্রকাশিত পণ্য</div><div className="product-price">{published.length}</div><p className="muted">প্রতিটির নিজস্ব পৃষ্ঠা ও অনুমোদিত মিডিয়া থাকতে হবে</p></Card>
        <Card><div className="label muted">অবস্থা</div><Badge tone={c.is_active ? 'ok' : 'warn'}>{c.is_active ? 'সক্রিয়' : 'প্রস্তাবিত'}</Badge><p className="muted" style={{ marginTop: 10 }}>{c.description}</p></Card>
      </div>
      <h2>এই ক্যাটাগরির প্রয়োজনীয় স্পেসিফিকেশন</h2>
      <div className="tag-list" style={{ marginBottom: 22 }}>{SPEC_TEMPLATES[c.spec_template].map((f) => <span key={f} className="badge">{f}</span>)}</div>
      <h2>প্রকাশিত পণ্য</h2>
      {published.length ? (
        <div className="grid grid-auto">{published.map((p) => <Card key={p.id}><h3><Link href={`/products/${p.slug}`}>{p.model_name}</Link></h3><p className="muted">{p.brand_name} · SKU {p.sku}</p></Card>)}</div>
      ) : <EmptyState title="এই ক্যাটাগরিতে এখনো প্রকাশিত পণ্য নেই"><p>যাচাইকৃত ও অনুমোদিত তথ্য ছাড়া পণ্য প্রকাশ করা হয় না। <Link href="/products">সব পণ্য দেখুন</Link>।</p></EmptyState>}
    </>
  );
}
