import Link from 'next/link';
import { all } from '@/lib/server/database';
import { listProducts } from '@/lib/server/catalogue';
import { addBrandAction, createProductAction, importProductsAction } from '@/app/actions/catalogue';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const categories = all<{ id: number; name_en: string }>('SELECT id, name_en FROM categories ORDER BY sort_order');
  const brands = all<{ id: number; name: string }>('SELECT id, name FROM brands ORDER BY name');
  const products = listProducts({ includeDemo: true, limit: 300 });
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="পণ্য ও ক্যাটালগ অ্যাডমিনিস্ট্রেশন" subtitle="মডেল, ভ্যারিয়েন্ট, SKU, বারকোড, অ্যাট্রিবিউট, বাল্ক আমদানি/রপ্তানি, ডুপ্লিকেট শনাক্তকরণ, ভ্যালিডেশন, মূল্য অনুমোদন, প্রকাশনা অনুমোদন, রিভিশন ও আর্কাইভ।"
        actions={<Link className="btn btn-sm" href="/admin/catalogue">কমপ্লিটনেস →</Link>} />
      <div className="grid grid-2">
        <Card><h2>নতুন মডেল (খসড়া)</h2>
          <form action={createProductAction} className="stack">
            <CsrfInput />
            <div className="form-grid">
              <div className="field"><label htmlFor="modelName">মডেল নাম *</label><input id="modelName" name="modelName" required placeholder="শুধুমাত্র যাচাইযোগ্য প্রকৃত মডেল" /></div>
              <div className="field"><label htmlFor="sku">SKU *</label><input id="sku" name="sku" required /></div>
              <div className="field"><label htmlFor="mpn">MPN</label><input id="mpn" name="mpn" /></div>
              <div className="field"><label htmlFor="brandId">ব্র্যান্ড *</label><select id="brandId" name="brandId" required>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div className="field"><label htmlFor="categoryId">ক্যাটাগরি *</label><select id="categoryId" name="categoryId" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}</select></div>
              <div className="field"><label htmlFor="sourceName">উৎসের নাম</label><input id="sourceName" name="sourceName" placeholder="প্রস্তুতকারক / অনুমোদিত পরিবেশক" /></div>
              <div className="field"><label htmlFor="sourceUrl">উৎস URL</label><input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://" /></div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="isDemo" value="1" style={{ width: 'auto' }} /> এটি DEMONSTRATION রেকর্ড (লাইভ ক্যাটালগ থেকে বাদ)</label>
            <button className="btn btn-primary" type="submit">খসড়া তৈরি করুন</button>
            <p className="muted" style={{ fontSize: '.8rem' }}>নতুন রেকর্ড সবসময় <code>draft</code> ও <code>unverified</code>। কোনো দাম, স্টক বা স্পেসিফিকেশন স্বয়ংক্রিয়ভাবে তৈরি হয় না।</p>
          </form>
          <hr />
          <h3>নতুন ব্র্যান্ড (ট্যাক্সোনমি)</h3>
          <form action={addBrandAction} className="inline-form"><CsrfInput /><div className="field"><label htmlFor="brandName">নাম</label><input id="brandName" name="name" required /></div><button className="btn btn-sm" type="submit">যোগ করুন</button></form>
        </Card>
        <Card><h2>বাল্ক আমদানি (JSON)</h2>
          <p className="muted">প্রতিটি রেকর্ডে <code>sourceUrl</code> ও <code>sourceName</code> বাধ্যতামূলক। আমদানি সবসময় খসড়া হিসেবে আসে; কোনো স্বয়ংক্রিয় যাচাই বা প্রকাশনা নেই।</p>
          <form action={importProductsAction} className="stack"><CsrfInput />
            <div className="field"><label htmlFor="json">JSON অ্যারে</label><textarea id="json" name="json" rows={10} placeholder={'[{"slug":"...","brandSlug":"lenovo","categorySlug":"business-laptops","modelName":"...","sku":"...","mpn":"...","sourceName":"...","sourceUrl":"https://...","verificationStatus":"unverified","priceAmount":null,"specs":[]}]'} /></div>
            <button className="btn btn-primary" type="submit">ভ্যালিডেট + আমদানি</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>স্কিমা: <code>src/lib/core/validation.ts</code> · রপ্তানি: <code>npm run export:catalogue</code>। ডুপ্লিকেট SKU/মডেল প্রত্যাখ্যাত হয় ও রিপোর্টে দেখানো হয়।</p>
        </Card>
      </div>

      <h2 style={{ marginTop: 26 }}>সব রেকর্ড ({products.length})</h2>
      <Table headers={['মডেল', 'ব্র্যান্ড', 'ক্যাটাগরি', 'SKU', 'অবস্থা', 'যাচাই', 'মূল্য', 'ছবি', '']}>
        {products.map((p) => (
          <tr key={p.id}>
            <td><Link href={`/admin/products/${p.id}`}>{p.model_name}</Link>{p.is_demo ? <Badge tone="danger">DEMO</Badge> : null}</td>
            <td>{p.brand_name}</td><td className="muted">{p.category_name}</td><td><code>{p.sku}</code></td>
            <td><Badge tone={p.status === 'published' ? 'ok' : 'warn'}>{p.status}</Badge></td>
            <td><Badge tone={p.verification_status === 'verified' ? 'ok' : 'danger'}>{p.verification_status}</Badge></td>
            <td>{p.price_amount !== null && p.price_verified ? `৳ ${(p.price_amount / 100).toFixed(2)}` : <span className="muted">যাচাইকৃত নয়</span>}</td>
            <td><Link className="btn btn-sm" href={`/admin/products/${p.id}`}>সম্পাদনা →</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
