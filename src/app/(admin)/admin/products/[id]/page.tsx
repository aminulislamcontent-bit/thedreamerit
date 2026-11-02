import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getSpecs, getMedia, evaluateProduct, mediaCompletenessFor } from '@/lib/server/catalogue';
import { all } from '@/lib/server/database';
import { SPEC_TEMPLATES } from '@/lib/core/identity';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, CheckList, Notice, PageHead, PageNotices, Table } from '@/components/ui';
import { archiveProductAction, createVariantAction, publishProductAction, saveSeoAction, seedSpecTemplateAction, setMinimumPriceAction, setPriceAction, unpublishProductAction, updateProductAction, upsertSpecAction, verifyProductAction } from '@/app/actions/catalogue';

export const dynamic = 'force-dynamic';

export default async function ProductEditorPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const productId = Number.parseInt(id, 10);
  const p = getProductById(productId);
  if (!p) notFound();
  const specs = getSpecs(productId);
  const media = getMedia(productId);
  const evaluation = evaluateProduct(productId);
  const mediaState = mediaCompletenessFor(productId);
  const required = SPEC_TEMPLATES[p.spec_template] ?? [];
  const variants = all<{ id: number; name: string; sku: string; barcode: string; status: string }>('SELECT * FROM product_variants WHERE product_id = ?', [productId]);
  const revisions = all<{ id: number; change_json: string; created_at: string }>('SELECT * FROM product_revisions WHERE product_id = ? ORDER BY created_at DESC LIMIT 20', [productId]);

  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title={p.model_name} subtitle={`SKU ${p.sku} · ${p.brand_name} · ${p.category_name} · টেমপ্লেট ${p.spec_template}`}
        actions={<><Link className="btn btn-sm" href={`/products/${p.slug}?preview=1`}>প্রিভিউ →</Link><Link className="btn btn-sm" href="/admin/products">← তালিকা</Link></>} />
      <div className="tag-list" style={{ marginBottom: 18 }}>
        <Badge tone={p.status === 'published' ? 'ok' : 'warn'}>{p.status}</Badge>
        <Badge tone={p.verification_status === 'verified' ? 'ok' : 'danger'}>{p.verification_status}</Badge>
        {p.is_demo ? <Badge tone="danger">DEMONSTRATION — লাইভ নয়</Badge> : null}
        <Badge tone="info">{mediaState.label}</Badge>
      </div>

      <div className="grid grid-2">
        <Card><h2>প্রকাশনা গেট</h2>
          {evaluation ? (
            <>
              <Notice tone={evaluation.allowed ? 'info' : 'danger'}>
                <strong>{evaluation.allowed ? '✅ প্রকাশনার সব শর্ত পূরণ হয়েছে।' : `⛔ প্রকাশনা অবরুদ্ধ — ${evaluation.blockers.length}টি কারণ:`}</strong>
                {evaluation.blockers.length ? <ul style={{ marginTop: 8, marginBottom: 0 }}>{evaluation.blockers.map((b) => <li key={b}>{b}</li>)}</ul> : null}
              </Notice>
              <CheckList checks={evaluation.checks} />
              <div className="row" style={{ marginTop: 14 }}>
                <form action={publishProductAction}><CsrfInput /><input type="hidden" name="productId" value={productId} /><button className="btn btn-primary" type="submit">প্রকাশনা অনুমোদন করুন</button></form>
                <form action={unpublishProductAction}><CsrfInput /><input type="hidden" name="productId" value={productId} /><button className="btn btn-sm" type="submit">আনপাবলিশ</button></form>
                <form action={archiveProductAction}><CsrfInput /><input type="hidden" name="productId" value={productId} /><button className="btn btn-sm btn-danger" type="submit">আর্কাইভ</button></form>
                <form action={archiveProductAction}><CsrfInput /><input type="hidden" name="productId" value={productId} /><input type="hidden" name="restore" value="1" /><button className="btn btn-sm" type="submit">পুনরুদ্ধার</button></form>
              </div>
            </>
          ) : <p>মূল্যায়ন উপলব্ধ নয়।</p>}
        </Card>

        <div className="stack">
          <Card><h2>মডেল যাচাই</h2><p className="muted">বর্তমান উৎস: {p.source_name || 'নেই'} {p.source_url ? <a href={p.source_url} rel="nofollow">লিংক</a> : null}</p>
            <form action={verifyProductAction} className="stack"><CsrfInput /><input type="hidden" name="productId" value={productId} />
              <div className="field"><label htmlFor="sourceName">নথির উৎস *</label><input id="sourceName" name="sourceName" defaultValue={p.source_name} required /></div>
              <div className="field"><label htmlFor="sourceUrl">উৎস URL *</label><input id="sourceUrl" name="sourceUrl" type="url" defaultValue={p.source_url} required /></div>
              <button className="btn btn-sm btn-primary" type="submit">যাচাইকৃত হিসেবে রেকর্ড করুন</button>
            </form>
            <p className="muted" style={{ fontSize: '.8rem' }}>এই বোতাম শুধুমাত্র অ্যাক্টর/সময়সহ যাচাই রেকর্ড করে; বাহ্যিক নথি স্বয়ংক্রিয়ভাবে যাচাই করার দাবি করে না।</p>
          </Card>
          <Card><h2>ক্ষেত্র সম্পাদনা ও রিভিশন</h2>
            <form action={updateProductAction} className="inline-form"><CsrfInput /><input type="hidden" name="productId" value={productId} />
              <div className="field"><label htmlFor="field">ক্ষেত্র</label><select id="field" name="field">
                {['model_name', 'mpn', 'overview', 'limitations', 'intended_use', 'included_accessories', 'source_url', 'source_name', 'warranty_months', 'warranty_source_url', 'status'].map((f) => <option key={f} value={f}>{f}</option>)}
              </select></div>
              <div className="field"><label htmlFor="value">মান</label><input id="value" name="value" /></div>
              <button className="btn btn-sm" type="submit">সংরক্ষণ</button>
            </form>
            {revisions.length ? <Table headers={['সময়', 'পরিবর্তন']}>{revisions.map((r) => <tr key={r.id}><td className="muted">{r.created_at}</td><td><code>{r.change_json.slice(0, 160)}</code></td></tr>)}</Table> : <p className="muted">কোনো রিভিশন নেই।</p>}
          </Card>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <Card><h2>মূল্য ও মূল্য-ফ্লোর</h2>
          <p className="muted">বর্তমান: {p.price_amount !== null ? `৳ ${(p.price_amount / 100).toFixed(2)}` : 'কোনো যাচাইকৃত দাম নেই'} · ন্যূনতম: {p.minimum_selling_amount !== null ? `৳ ${(p.minimum_selling_amount / 100).toFixed(2)}` : 'সেট করা হয়নি'}</p>
          <form action={setPriceAction} className="stack"><CsrfInput /><input type="hidden" name="productId" value={productId} />
            <div className="form-grid">
              <div className="field"><label htmlFor="priceBdt">বিক্রয়মূল্য (BDT, খালি = দাম লুকানো)</label><input id="priceBdt" name="priceBdt" type="number" step="0.01" min="0" defaultValue={p.price_amount !== null ? (p.price_amount / 100).toFixed(2) : ''} /></div>
              <div className="field"><label htmlFor="priceSourceName">অনুমোদিত উৎস *</label><input id="priceSourceName" name="priceSourceName" defaultValue={p.price_source_name} /></div>
              <div className="field" style={{ gridColumn: '1/-1' }}><label htmlFor="priceSourceUrl">উৎস URL *</label><input id="priceSourceUrl" name="priceSourceUrl" type="url" defaultValue={p.price_source_url} /></div>
            </div>
            <button className="btn btn-sm btn-primary" type="submit">মূল্য লগ করুন</button>
          </form>
          <form action={setMinimumPriceAction} className="inline-form" style={{ marginTop: 12 }}><CsrfInput /><input type="hidden" name="productId" value={productId} />
            <div className="field"><label htmlFor="minimumBdt">অনুমোদিত ন্যূনতম (BDT)</label><input id="minimumBdt" name="minimumBdt" type="number" step="0.01" min="0" /></div><button className="btn btn-sm" type="submit">ফ্লোর সেট</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>ফ্লোরের নিচে ছাড় শুধুমাত্র নথিভুক্ত অনুমোদনে অনুমোদিত; প্রতিটি পরিবর্তন <code>price_change_logs</code>-এ রেকর্ড হয়।</p>
        </Card>
        <Card><h2>SEO ফিল্ড</h2>
          <form action={saveSeoAction} className="stack"><CsrfInput /><input type="hidden" name="productId" value={productId} />
            <div className="field"><label htmlFor="title">ইউনিক টাইটেল (১০–৭০ অক্ষর)</label><input id="title" name="title" defaultValue={p.seo_title} /></div>
            <div className="field"><label htmlFor="metaDescription">মেটা বর্ণনা (৫০–১৬৫)</label><textarea id="metaDescription" name="metaDescription" defaultValue={p.seo_description} rows={3} /></div>
            <div className="field"><label htmlFor="canonicalPath">Canonical path</label><input id="canonicalPath" name="canonicalPath" defaultValue={p.seo_canonical} /></div>
            <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="indexable" value="1" defaultChecked={!!p.seo_indexable} style={{ width: 'auto' }} /> Indexable</label>
            <button className="btn btn-sm btn-primary" type="submit">ভ্যালিডেট + সংরক্ষণ</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>পর্যালোচনার তারিখ শুধুমাত্র ভ্যালিডেশন পাস হলেই সেট হয়। স্ট্রাকচার্ড ডাটা যাচাইকৃত ক্ষেত্র থেকেই তৈরি হয়; কোনো বানোয়াট রেটিং/দাম নেই।</p>
        </Card>
      </div>

      <section style={{ marginTop: 26 }}><h2>টেকনিক্যাল স্পেসিফিকেশন ({specs.filter((s) => s.verified).length} যাচাইকৃত / {required.length} প্রয়োজনীয়)</h2>
        <div className="row" style={{ marginBottom: 12 }}>
          <form action={seedSpecTemplateAction}><CsrfInput /><input type="hidden" name="productId" value={productId} /><button className="btn btn-sm" type="submit">ক্যাটাগরি টেমপ্লেটের অযাচাইকৃত সারি তৈরি করুন</button></form>
          <span className="muted" style={{ fontSize: '.82rem' }}>প্রয়োজনীয় ক্ষেত্র: {required.join(', ')}</span>
        </div>
        <Table headers={['গ্রুপ', 'ক্ষেত্র', 'মান', 'একক', 'যাচাই', 'উৎস']}>
          {specs.map((s) => <tr key={s.id}><td>{s.group_name}</td><td>{s.spec_key}</td><td>{s.verified ? s.spec_value : <span className="muted">{s.spec_value || 'খালি'}</span>}</td><td>{s.unit}</td><td>{s.verified ? <Badge tone="ok">verified</Badge> : <Badge tone="warn">unverified</Badge>}</td><td className="muted">{s.source_url || '—'}</td></tr>)}
        </Table>
        <Card style={{ marginTop: 14 }}><h3>স্পেসিফিকেশন যোগ / যাচাই</h3>
          <form action={upsertSpecAction}><CsrfInput /><input type="hidden" name="productId" value={productId} />
            <div className="form-grid">
              <div className="field"><label htmlFor="groupName">গ্রুপ</label><input id="groupName" name="groupName" defaultValue="General" /></div>
              <div className="field"><label htmlFor="specKey">ক্ষেত্র *</label><input id="specKey" name="specKey" list="specKeys" required /><datalist id="specKeys">{required.map((r) => <option key={r} value={r} />)}</datalist></div>
              <div className="field"><label htmlFor="specValue">মান *</label><input id="specValue" name="specValue" required /></div>
              <div className="field"><label htmlFor="unit">একক</label><input id="unit" name="unit" /></div>
              <div className="field"><label htmlFor="specSourceName">উৎসের নাম</label><input id="specSourceName" name="sourceName" /></div>
              <div className="field" style={{ gridColumn: '1/-1' }}><label htmlFor="specSourceUrl">উৎস URL (যাচাইয়ের জন্য বাধ্যতামূলক)</label><input id="specSourceUrl" name="sourceUrl" type="url" /></div>
            </div>
            <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="verified" value="1" style={{ width: 'auto' }} /> যাচাইকৃত (উৎস URL আবশ্যক)</label>
            <button className="btn btn-sm btn-primary" style={{ marginTop: 10 }} type="submit">সংরক্ষণ</button>
          </form>
        </Card>
      </section>

      <div className="grid grid-2" style={{ marginTop: 26 }}>
        <Card><h2>মিডিয়া ({media.length})</h2><p className="muted">{mediaState.label} · ছবি {mediaState.imageCount} · 3D {mediaState.has3d ? 'হ্যাঁ' : 'না'} · 360° {mediaState.has360 ? `${mediaState.spinFrameCount} ফ্রেম` : 'না'} · ভিডিও {mediaState.hasVideo ? 'হ্যাঁ' : 'না'}</p>
          {mediaState.blockers.length ? <Notice tone="warn">{mediaState.blockers.join(' ')}</Notice> : null}
          <Table headers={['ধরন', 'URL', 'অনুমতি', 'পর্যালোচনা']}>{media.map((m) => <tr key={m.id}><td>{m.kind}</td><td className="muted">{m.url.slice(0, 60)}</td><td>{m.permissionStatus}</td><td>{m.reviewStatus}</td></tr>)}</Table>
          <Link className="btn btn-sm" href="/admin/media">মিডিয়া ম্যানেজার →</Link>
        </Card>
        <Card><h2>ভ্যারিয়েন্ট ({variants.length})</h2><p className="muted">রঙ/স্টোরেজ ভ্যারিয়েন্ট আলাদা মডেল নয়; ১৫-মডেল গণনায় যোগ হয় না।</p>
          {variants.length ? <Table headers={['নাম', 'SKU', 'বারকোড', 'অবস্থা']}>{variants.map((v) => <tr key={v.id}><td>{v.name}</td><td>{v.sku}</td><td>{v.barcode || '—'}</td><td>{v.status}</td></tr>)}</Table> : <p className="muted">কোনো ভ্যারিয়েন্ট নেই।</p>}
          <form action={createVariantAction} className="inline-form" style={{ marginTop: 12 }}><CsrfInput /><input type="hidden" name="productId" value={productId} />
            <div className="field"><label htmlFor="variantName">নাম</label><input id="variantName" name="name" required /></div>
            <div className="field"><label htmlFor="variantSku">SKU</label><input id="variantSku" name="sku" required /></div>
            <div className="field"><label htmlFor="barcode">বারকোড</label><input id="barcode" name="barcode" /></div>
            <button className="btn btn-sm" type="submit">যোগ করুন</button>
          </form>
        </Card>
      </div>
    </>
  );
}
