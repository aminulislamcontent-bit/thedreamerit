import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getProductBySlug, getMedia, getSpecs, mediaCompletenessFor } from '@/lib/server/catalogue';
import { all, scalar } from '@/lib/server/database';
import { productStructuredData, siteUrl } from '@/lib/server/seo';
import { getCurrentUser } from '@/lib/server/auth';
import { availableFor } from '@/lib/server/inventory';
import { assessPrice } from '@/lib/core/pricing-rules';
import { BUSINESS, moneyToBdt, SPEC_TEMPLATES } from '@/lib/core/identity';
import { Badge, Card, Crumbs, EmptyState, Notice, Table } from '@/components/ui';
import ProductMediaGallery from '@/components/product-media-gallery';
import { AddToCartButton, CompareLink, WishlistButton } from '@/components/cart-buttons';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return { title: 'পণ্য পাওয়া যায়নি' };
  const canonical = p.seo_canonical || `/products/${p.slug}`;
  return {
    title: p.seo_title || `${p.model_name} — ${p.brand_name}`,
    description: p.seo_description || `যাচাইকৃত তথ্য সহ ${p.model_name} এর পণ্য পৃষ্ঠা।`,
    alternates: { canonical },
    robots: p.status === 'published' && p.seo_indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: p.seo_title || p.model_name,
      description: p.seo_description || `${p.model_name} — ${BUSINESS.name}`,
      url: `${siteUrl()}${canonical}`,
      type: 'website',
      locale: 'bn_BD',
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  const preview = sp.preview === '1';
  const user = await getCurrentUser();
  const mayPreview = !!user && (user.permissions.includes('catalogue.view') || user.permissions.includes('catalogue.publish'));
  if (p.status !== 'published' && !(preview && mayPreview)) notFound();

  const media = getMedia(p.id);
  const approvedMedia = media.filter((m) => m.reviewStatus === 'approved' && m.permissionStatus === 'granted');
  const specs = getSpecs(p.id);
  const verifiedSpecs = specs.filter((s) => s.verified && s.source_url);
  const mediaState = mediaCompletenessFor(p.id);
  const inventoryRows = scalar('SELECT COUNT(*) AS n FROM inventory_balances WHERE product_id = ?', [p.id]);
  const available = inventoryRows > 0 ? availableFor(p.id) : null;
  const price = assessPrice({ sellingAmount: p.price_amount, minimumSellingAmount: p.minimum_selling_amount, unitCost: null, priceVerified: !!p.price_verified, priceSourceUrl: p.price_source_url });
  const structured = productStructuredData(p.id);
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const requiredSpecs = SPEC_TEMPLATES[p.spec_template] ?? [];
  const reviews = all<{ id: number; rating: number; body: string; created_at: string }>(
    "SELECT id, rating, body, created_at FROM reviews WHERE product_id = ? AND verified_purchase = 1 AND moderation_status = 'approved'", [p.id]);
  const questions = all<{ id: number; question: string; answer: string }>("SELECT id, question, answer FROM product_questions WHERE product_id = ? AND status = 'answered'", [p.id]);
  const related = all<{ slug: string; model_name: string }>(
    `SELECT p.slug, p.model_name FROM product_relations r JOIN products p ON p.id = r.related_product_id WHERE r.product_id = ? AND p.status = 'published'`, [p.id]);
  const variants = all<{ id: number; name: string; sku: string; price_amount: number | null; price_verified: number; status: string }>('SELECT * FROM product_variants WHERE product_id = ?', [p.id]);
  const branchStock = all<{ branch: string; available: number }>(
    `SELECT b.name AS branch, (ib.on_hand - ib.reserved) AS available FROM inventory_balances ib
     JOIN warehouses w ON w.id = ib.warehouse_id JOIN branches b ON b.id = w.branch_id WHERE ib.product_id = ?`, [p.id]);

  return (
    <>
      {structured ? <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} /> : null}
      <Crumbs items={[
        { label: 'হোম', href: '/' }, { label: 'পণ্য', href: '/products' },
        { label: p.category_name, href: `/categories/${p.category_slug}` }, { label: p.model_name },
      ]} />

      {p.status !== 'published' ? <Notice tone="warn"><strong>অ্যাডমিন প্রিভিউ:</strong> এই পৃষ্ঠাটি প্রকাশিত নয়, সার্চ ইঞ্জিনে নোইনডেক্স, এবং লাইভ ক্যাটালগে দেখা যায় না।</Notice> : null}

      {/* Section 1 — Product identity */}
      <section className="section-tight">
        <div className="spread">
          <div>
            <div className="tag-list" style={{ marginBottom: 10 }}>
              <Badge tone={p.status === 'published' ? 'ok' : 'warn'}>{p.status}</Badge>
              <Badge tone={p.verification_status === 'verified' ? 'ok' : 'danger'}>{p.verification_status === 'verified' ? 'মডেল যাচাইকৃত' : 'মডেল যাচাই হয়নি'}</Badge>
              <Badge tone="info">{p.category_name}</Badge>
              {p.is_demo ? <Badge tone="danger">DEMONSTRATION RECORD</Badge> : null}
            </div>
            <h1 style={{ fontSize: '2.1rem' }}>{p.model_name}</h1>
            <p className="muted">ব্র্যান্ড: <Link href={`/brands/${p.brand_name.toLowerCase().replace(/\s+/g, '-')}`}>{p.brand_name}</Link> · মডেল: {p.model_name} · SKU: <code>{p.sku}</code> · MPN: <code>{p.mpn || 'রেকর্ড করা হয়নি'}</code></p>
          </div>
          <div className="stack" style={{ alignItems: 'flex-end' }}>
            <Badge tone={available && available > 0 ? 'ok' : 'warn'}>
              {inventoryRows === 0 ? 'ইনভেন্টরি রেকর্ড নেই — প্রাপ্যতা দাবি করা হয়নি' : available !== null && available > 0 ? `${available} ইউনিট যাচাইকৃত স্টক` : 'স্টক শেষ (যাচাইকৃত রেকর্ড)'}
            </Badge>
            <span className="muted" style={{ fontSize: '.8rem' }}>রেটিং: {reviews.length ? 'যাচাইকৃত রিভিউ আছে' : 'কোনো যাচাইকৃত রিভিউ নেই — রেটিং দেখানো হয় না'}</span>
          </div>
        </div>
      </section>

      {/* Section 2 — Premium media gallery */}
      <section className="section-tight">
        <h2>পণ্যের মিডিয়া</h2>
        <div className="grid grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)' }}>
          <ProductMediaGallery media={media} productName={p.model_name} preview={p.status !== 'published'} />
          <Card>
            <h3>মিডিয়া সম্পূর্ণতা</h3>
            <Table headers={['পরিমাপ', 'অবস্থা']}>
              <tr><td>মিডিয়া স্তর</td><td>{mediaState.label}</td></tr>
              <tr><td>অনুমোদিত ছবি</td><td>{mediaState.imageCount}</td></tr>
              <tr><td>হাই-রেজোলিউশন ছবি</td><td>{mediaState.minResolutionMet ? 'হ্যাঁ' : 'না'}</td></tr>
              <tr><td>যাচাইকৃত 3D মডেল</td><td>{mediaState.has3d ? 'হ্যাঁ' : 'না'}</td></tr>
              <tr><td>360° ধারাবাহিকতা</td><td>{mediaState.has360 ? `হ্যাঁ (${mediaState.spinFrameCount} কোণ)` : 'না'}</td></tr>
              <tr><td>পণ্য ভিডিও</td><td>{mediaState.hasVideo ? 'হ্যাঁ' : 'না'}</td></tr>
              <tr><td>উৎস / অনুমতি / পর্যালোচনা</td><td>প্রতিটি মিডিয়া রেকর্ডে আলাদাভাবে সংরক্ষিত</td></tr>
            </Table>
            {mediaState.blockers.length ? <Notice tone="warn">{mediaState.blockers.join(' ')}</Notice> : <Notice>মিডিয়া প্রয়োজনীয়তা পূরণ হয়েছে; কোনো ছবিকে 3D মডেল বা 360° ভিউয়ার হিসেবে উপস্থাপন করা হয়নি।</Notice>}
            <p className="muted" style={{ fontSize: '.82rem' }}>থাম্বনেইল নেভিগেশন, জুম, ফুল-স্ক্রিন ভিউয়ার, কীবোর্ড নিয়ন্ত্রণ, টাচ জেসচার, লেজি-লোডিং ও ব্যর্থতার ফলব্যাক উপরে ভিউয়ারে বাস্তবায়িত।</p>
          </Card>
        </div>
      </section>

      {/* Section 3 — Price and purchase */}
      <section className="section-tight">
        <h2>মূল্য ও ক্রয়</h2>
        <div className="grid grid-2">
          <Card>
            {price.displayPrice && price.amount !== null ? (
              <>
                <div className="product-price">৳ {moneyToBdt(price.amount)}</div>
                <p className="muted" style={{ fontSize: '.82rem' }}>যাচাইকৃত বিক্রয়মূল্য · উৎস: {p.price_source_name || p.price_source_url || 'রেকর্ড করা হয়নি'}</p>
              </>
            ) : (
              <Notice tone="warn"><strong>মূল্য প্রদর্শন করা হয়নি।</strong> অনুমোদিত মূল্য-উৎস যাচাই না থাকলে দাম দেখানো হয় না। {price.blockers.join(' ')}</Notice>
            )}
            <p className="muted">অনুমোদিত প্রমোশনাল মূল্য: <strong>কোনোটিই নেই</strong> (রেকর্ড না থাকলে দাবি করা হয় না)।</p>
            <h3 style={{ marginTop: 18 }}>কনফিগারেশন / ভ্যারিয়েন্ট</h3>
            {variants.length ? (
              <Table headers={['ভ্যারিয়েন্ট', 'SKU', 'মূল্য', 'অবস্থা']}>
                {variants.map((v) => <tr key={v.id}><td>{v.name}</td><td>{v.sku}</td><td>{v.price_verified && v.price_amount !== null ? `৳ ${moneyToBdt(v.price_amount)}` : 'যাচাইকৃত নয়'}</td><td>{v.status}</td></tr>)}
              </Table>
            ) : <p className="muted">কোনো ভ্যারিয়েন্ট রেকর্ড নেই। রঙ/স্টোরেজ ভিন্নতা আলাদা মডেল হিসেবে গণনা করা হয় না।</p>}
            <h3 style={{ marginTop: 18 }}>শাখাভিত্তিক প্রাপ্যতা</h3>
            {branchStock.length ? (
              <Table headers={['শাখা', 'যাচাইকৃত ইউনিট']}>{branchStock.map((b, i) => <tr key={i}><td>{b.branch}</td><td>{b.available}</td></tr>)}</Table>
            ) : <p className="muted">কোনো শাখার ইনভেন্টরি রেকর্ড নেই — শাখায় পণ্য আছে বলে দাবি করা হয়নি।</p>}
            <p className="muted">ডেলিভারি estimate: <strong>প্রকৃত ডেলিভারি নিয়ম কনফিগার করা হয়নি</strong>, তাই কোনো তারিখ দাবি করা হয় না।</p>
          </Card>
          <Card>
            <h3>অর্ডার</h3>
            <AddToCartButton productId={p.id} disabled={p.status !== 'published' || !price.displayPrice || available === null || available <= 0 || !!p.is_demo}
              reason={p.status !== 'published' ? 'পণ্য প্রকাশিত নয়' : !price.displayPrice ? 'যাচাইকৃত মূল্য নেই' : 'যাচাইকৃত স্টক নেই'} />
            <div className="row" style={{ marginTop: 14 }}><CompareLink productId={p.id} /><WishlistButton productId={p.id} productName={p.model_name} /></div>
            <hr />
            <h3>ওয়ারেন্টি ও রিটার্ন</h3>
            <p className="muted">{p.warranty_months !== null && p.warranty_source_url ? `${p.warranty_months} মাস (উৎস: ${p.warranty_source_url})` : 'যাচাইকৃত ওয়ারেন্টি তথ্য নেই — দাবি করা হয়নি।'}</p>
            <p className="muted">রিটার্ন নীতি: <Link href="/policies/returns">রিটার্ন নীতি দেখুন</Link>। সঠিক নীতি মালিক কর্তৃক অনুমোদিত হলেই চূড়ান্ত হবে।</p>
          </Card>
        </div>
      </section>

      {/* Section 4 — Technical specifications */}
      <section className="section-tight">
        <h2>প্রযুক্তিগত স্পেসিফিকেশন</h2>
        <p className="muted">টেমপ্লেট: <code>{p.spec_template}</code> — ক্যাটাগরি-নির্দিষ্ট ক্ষেত্রগুলো নিচে দেখানো হয়েছে; শুধুমাত্র যাচাইকৃত মানই প্রকাশ করা হয়।</p>
        <Table headers={['ক্ষেত্র', 'মান', 'যাচাই', 'উৎস']}>
          {requiredSpecs.map((field) => {
            const s = specs.find((x) => x.spec_key === field);
            return <tr key={field}><td>{field}</td><td>{s?.verified && s.source_url ? `${s.spec_value}${s.unit ? ` ${s.unit}` : ''}` : <span className="muted">যাচাইকৃত তথ্য নেই</span>}</td><td>{s?.verified ? <Badge tone="ok">verified</Badge> : <Badge tone="warn">unverified</Badge>}</td><td className="muted">{s?.source_url || '—'}</td></tr>;
          })}
          {specs.filter((s) => !requiredSpecs.includes(s.spec_key)).map((s) => (
            <tr key={s.id}><td>{s.spec_key}</td><td>{s.verified && s.source_url ? `${s.spec_value}${s.unit ? ` ${s.unit}` : ''}` : <span className="muted">যাচাইকৃত নয়</span>}</td><td>{s.verified ? <Badge tone="ok">verified</Badge> : <Badge tone="warn">unverified</Badge>}</td><td className="muted">{s.source_url || '—'}</td></tr>
          ))}
        </Table>
        <p className="muted" style={{ fontSize: '.82rem' }}>{verifiedSpecs.length} টি যাচাইকৃত, উৎস-সহ স্পেসিফিকেশন। কোনো মান অনুমান করা হয়নি।</p>
      </section>

      {/* Section 5 — Product information */}
      <section className="section-tight">
        <h2>পণ্যের তথ্য</h2>
        <div className="grid grid-2">
          <Card><h3>সারাংশ</h3><p>{p.overview || 'কোনো যাচাইকৃত সারাংশ রেকর্ড করা হয়নি।'}</p><h3>উদ্দেশ্য</h3><p className="muted">{p.intended_use || 'রেকর্ড করা হয়নি।'}</p><h3>সীমাবদ্ধতা</h3><p className="muted">{p.limitations || 'রেকর্ড করা হয়নি — কোনো সীমাবদ্ধতা নেই বলে দাবি করা হচ্ছে না।'}</p></Card>
          <Card><h3>সামঞ্জস্যতা ও অন্তর্ভুক্ত আনুষাঙ্গিক</h3><p className="muted">{p.included_accessories || 'যাচাইকৃত তালিকা নেই।'}</p>
            <h3 style={{ marginTop: 16 }}>প্রস্তুতকারকের নথি ও ডাউনলোড</h3>
            {approvedMedia.filter((m) => m.kind === 'document').length ? (
              <ul>{approvedMedia.filter((m) => m.kind === 'document').map((m) => <li key={m.id}><a href={m.url}>{m.altText || 'নথি'}</a> — {m.sourceName || m.sourceUrl}</li>)}</ul>
            ) : <p className="muted">কোনো অনুমোদিত নথি/ডাউনলোড নেই।</p>}
            <p className="muted" style={{ fontSize: '.82rem' }}>মডেল উৎস: {p.source_name || 'রেকর্ড করা হয়নি'} {p.source_url ? <a href={p.source_url} rel="nofollow noopener">লিংক</a> : null}</p>
          </Card>
        </div>
      </section>

      {/* Section 6 — Comparison */}
      <section className="section-tight">
        <h2>পণ্য তুলনা</h2>
        <p className="muted">যাচাইকৃত স্পেসিফিকেশন, যাচাইকৃত দাম, ওয়ারেন্টি ও কনফিগারেশন তুলনা করুন। কর্মক্ষমতার দাবি শুধুমাত্র বিশ্বস্ত উৎস থেকে নেওয়া হয়; কোনো অনুমান করা হয় না।</p>
        <div className="row"><Link className="btn btn-primary" href={`/compare?ids=${p.id}`}>তুলনা টেবিল খুলুন →</Link><Link className="btn" href="/configurator">পিসি কম্প্যাটিবিলিটি চেক</Link></div>
      </section>

      {/* Section 7 — Customer feedback */}
      <section className="section-tight">
        <h2>গ্রাহক মতামত</h2>
        {reviews.length ? (
          <Table headers={['রেটিং', 'মতামত', 'তারিখ']}>{reviews.map((r) => <tr key={r.id}><td>{r.rating}/5</td><td>{r.body}</td><td>{r.created_at}</td></tr>)}</Table>
        ) : (
          <EmptyState title="কোনো যাচাইকৃত ক্রয়-পর্যালোচনা নেই">
            <p>গ্রাহক পর্যালোচনা বা সমষ্টিগত রেটিং তৈরি করা হয় না। শুধুমাত্র যাচাইকৃত ক্রয় ও মডারেশন-অনুমোদিত রিভিউ প্রদর্শিত হয়; অপব্যবহার রিপোর্টের ব্যবস্থা অ্যাডমিনে আছে।</p>
          </EmptyState>
        )}
        <h3 style={{ marginTop: 20 }}>প্রশ্ন ও উত্তর</h3>
        {questions.length ? <Table headers={['প্রশ্ন', 'উত্তর']}>{questions.map((q) => <tr key={q.id}><td>{q.question}</td><td>{q.answer}</td></tr>)}</Table> : <p className="muted">কোনো প্রশ্নোত্তর নেই। <Link href="/contact">প্রশ্ন পাঠান</Link>।</p>}
        <h3 style={{ marginTop: 20 }}>সম্পর্কিত পণ্য</h3>
        {related.length ? <div className="tag-list">{related.map((r) => <Link key={r.slug} className="badge badge-info" href={`/products/${r.slug}`}>{r.model_name}</Link>)}</div> : <p className="muted">কোনো যাচাইকৃত সম্পর্কিত পণ্য রেকর্ড করা হয়নি।</p>}
      </section>

      {/* Section 8 — SEO transparency */}
      <section className="section-tight">
        <h2>SEO ও তথ্যের স্বচ্ছতা</h2>
        <Card><Table headers={['ক্ষেত্র', 'মান']}>
          <tr><td>ইউনিক পেজ টাইটেল</td><td>{p.seo_title || 'সেট করা হয়নি'}</td></tr>
          <tr><td>মেটা বর্ণনা</td><td>{p.seo_description || 'সেট করা হয়নি'}</td></tr>
          <tr><td>Canonical URL</td><td>{p.seo_canonical || `/products/${p.slug}`}</td></tr>
          <tr><td>Indexable</td><td>{p.status === 'published' && p.seo_indexable ? 'হ্যাঁ' : 'না (প্রকাশিত/অনুমোদিত নয়)'}</td></tr>
          <tr><td>Structured data</td><td>{structured ? 'Product + BreadcrumbList (যাচাইকৃত ক্ষেত্রেই)' : 'নেই'}</td></tr>
          <tr><td>Sitemap</td><td>{p.status === 'published' && p.seo_indexable ? 'অন্তর্ভুক্ত' : 'বাদ (অযোগ্য)'}</td></tr>
          <tr><td>Image alt</td><td>{approvedMedia.filter((m) => m.kind === 'image' && m.altText).length}/{approvedMedia.filter((m) => m.kind === 'image').length} ছবির alt আছে</td></tr>
        </Table></Card>
      </section>

      {/* Section 9 — Trust and support */}
      <section className="section-tight">
        <h2>বিশ্বাস ও সহায়তা</h2>
        <div className="grid grid-3">
          <Card><h3>গ্রাহক সেবা</h3><p className="muted">📞 {BUSINESS.phone}<br />✉️ {BUSINESS.email}<br />{BUSINESS.addressBn}</p><Link href="/contact">সহায়তা অনুরোধ →</Link></Card>
          <Card><h3>নীতিমালা</h3><p><Link href="/policies/delivery">ডেলিভারি</Link> · <Link href="/policies/returns">রিটার্ন</Link> · <Link href="/policies/terms">শর্তাবলী</Link> · <Link href="/policies/privacy">গোপনীয়তা</Link><br /><Link href="/faq">সাধারণ প্রশ্ন</Link></p></Card>
          <Card><h3>পেমেন্ট ও ওয়ারেন্টি</h3><p className="muted">কোনো পেমেন্ট গেটওয়ে সংযুক্ত নেই; অর্ডার কেবল যাচাইকৃত পেমেন্ট ইভেন্টের পরেই "paid" হয়। ওয়ারেন্টি ও রিটার্ন অনুরোধ <Link href="/account/warranty">অ্যাকাউন্ট</Link> থেকে করা যায়।</p></Card>
        </div>
      </section>
    </>
  );
}
