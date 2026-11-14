import Link from 'next/link';
import { listProducts, type ProductRow } from '@/lib/server/catalogue';
import { all } from '@/lib/server/database';
import { Badge, Card, Crumbs, EmptyState, PageHead, PageNotices } from '@/components/ui';
import { moneyToBdt } from '@/lib/core/identity';

export const dynamic = 'force-dynamic';

function ProductCard({ p }: { p: ProductRow }) {
  const price = p.price_amount !== null && p.price_verified && p.price_source_url;
  return (
    <Card className="card-hover">
      <div className="spread" style={{ marginBottom: 10 }}>
        <Badge tone={p.status === 'published' ? 'ok' : 'warn'}>{p.status}</Badge>
        {p.is_demo ? <Badge tone="danger">DEMO — লাইভ নয়</Badge> : null}
      </div>
      <h3><Link href={`/products/${p.slug}`}>{p.model_name}</Link></h3>
      <p className="muted" style={{ fontSize: '.84rem' }}>{p.brand_name} · {p.category_name}<br />SKU: {p.sku}</p>
      {price ? <div className="product-price">৳ {moneyToBdt(p.price_amount as number)}</div> : <p className="muted">যাচাইকৃত মূল্য প্রকাশ করা হয়নি</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <Link className="btn btn-sm" href={`/products/${p.slug}`}>বিস্তারিত</Link>
        <Link className="btn btn-sm" href={`/compare?ids=${p.id}`}>তুলনা</Link>
      </div>
    </Card>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const read = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : (v ?? ''); };
  const category = all<{ slug: string; name_en: string }>('SELECT slug, name_en FROM categories ORDER BY sort_order');
  const brands = all<{ slug: string; name: string }>('SELECT slug, name FROM brands ORDER BY name');
  const sort = read('sort');
  let products = listProducts({ status: 'published', categorySlug: read('category') || undefined, brandSlug: read('brand') || undefined, search: read('q') || undefined });
  if (sort === 'name') products = [...products].sort((a, b) => a.model_name.localeCompare(b.model_name));
  if (sort === 'price_asc') products = [...products].sort((a, b) => (a.price_amount ?? Infinity) - (b.price_amount ?? Infinity));
  if (sort === 'price_desc') products = [...products].sort((a, b) => (b.price_amount ?? -1) - (a.price_amount ?? -1));
  const demo = read('demo') === '1' ? listProducts({ includeDemo: true }).filter((p) => p.is_demo) : [];

  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'পণ্য' }]} />
      <PageNotices searchParams={sp} />
      <PageHead title="পণ্য ক্যাটালগ" subtitle="শুধুমাত্র প্রকাশনার সবগুলো যাচাই-গেট পাস করা পণ্য এখানে দেখানো হয়। কোনো খসড়া, ডেমো বা অযাচাইকৃত মডেল লাইভ ক্যাটালগে আসে না।" />
      <form className="card" method="get" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div className="field"><label htmlFor="q">খোঁজা</label><input id="q" name="q" defaultValue={read('q')} placeholder="মডেল, SKU বা ব্র্যান্ড" /></div>
          <div className="field"><label htmlFor="category">ক্যাটাগরি</label><select id="category" name="category" defaultValue={read('category')}><option value="">সব ক্যাটাগরি</option>{category.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select></div>
          <div className="field"><label htmlFor="brand">ব্র্যান্ড</label><select id="brand" name="brand" defaultValue={read('brand')}><option value="">সব ব্র্যান্ড</option>{brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</select></div>
          <div className="field"><label htmlFor="sort">সাজানো</label><select id="sort" name="sort" defaultValue={sort}><option value="">নতুনতম</option><option value="name">নাম (A–Z)</option><option value="price_asc">দাম: কম → বেশি</option><option value="price_desc">দাম: বেশি → কম</option></select></div>
        </div>
        <div className="row"><button className="btn btn-primary btn-sm" type="submit">ফিল্টার প্রয়োগ</button><Link className="btn btn-sm" href="/products">রিসেট</Link><Link className="btn btn-sm" href="/compare">তুলনা টেবিল</Link></div>
      </form>

      {products.length ? (
        <>
          <p className="muted">{products.length} টি প্রকাশিত পণ্য পাওয়া গেছে। দাম শুধুমাত্র অনুমোদিত উৎস যাচাই করা থাকলে দেখানো হয়।</p>
          <div className="grid grid-auto">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </>
      ) : (
        <EmptyState title="এখনো কোনো যাচাইকৃত পণ্য প্রকাশিত হয়নি">
          <p>এটি কোনো ভুল নয়, বরং ইচ্ছাকৃত নীতি: প্রস্তুতকারক/অনুমোদিত পরিবেশকের নথি, স্পেসিফিকেশন, লাইসেন্সকৃত মিডিয়া, মূল্য-উৎস, প্রকৃত ইনভেন্টরি ও মানব অনুমোদন ছাড়া পণ্য প্রকাশ করা হয় না।</p>
          <p>প্রতিটি সক্রিয় ক্যাটাগরিতে কমপক্ষে ১৫টি স্বতন্ত্র যাচাইকৃত মডেল প্রয়োজন। অনুমোদিত ডেটা আমদানি ও যাচাইয়ের কাজ <Link href="/admin/catalogue">ক্যাটালগ প্রগ্রেস ড্যাশবোর্ডে</Link> করা হয়।</p>
          <Link className="btn btn-sm" href="/products?demo=1">ডেমোনস্ট্রেশন রেকর্ড দেখুন (লাইভ নয়)</Link>
        </EmptyState>
      )}

      {demo.length ? (
        <section className="section">
          <h2>⚠️ ডেমোনস্ট্রেশন রেকর্ড (লাইভ ক্যাটালগ থেকে বাদ)</h2>
          <p className="muted">এগুলো বাস্তব পণ্য নয়; কোনো মডেল নাম, স্পেসিফিকেশন, দাম বা স্টক দাবি করা হয়নি। ডেভেলপমেন্ট পরীক্ষার জন্য স্পষ্টভাবে চিহ্নিত।</p>
          <div className="grid grid-auto">{demo.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      ) : null}
    </>
  );
}
