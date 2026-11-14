import Link from 'next/link';
import { all } from '@/lib/server/database';
import { recentSeoChecks, siteUrl, sitemapXml } from '@/lib/server/seo';
import { addRedirectAction, runSeoChecksAction } from '@/app/actions/content';
import { CsrfInput } from '@/components/csrf-input';
import { Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SeoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const checks = recentSeoChecks();
  const redirects = all<{ id: number; from_path: string; to_path: string; status_code: number }>('SELECT * FROM redirects ORDER BY id DESC');
  const broken = all<{ id: number; url: string; status_code: number; checked_at: string }>('SELECT * FROM broken_links ORDER BY id DESC');
  const products = all<{ slug: string; status: string; title: string; indexable: number }>(`SELECT p.slug, p.status, COALESCE(s.title,'') AS title, COALESCE(s.indexable,0) AS indexable FROM products p LEFT JOIN product_seo s ON s.product_id = p.id`);
  const sitemap = sitemapXml();
  const entries = (sitemap.match(/<url>/g) || []).length;
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="SEO অটোমেশন" subtitle="সার্চ-ফ্রেন্ডলি URL, canonical, XML sitemap, robots, Product/Breadcrumb structured data, ডুপ্লিকেট কনটেন্ট চেক, ভাঙা লিংক, রিডাইরেক্ট, ইনডেক্সেবিলিটি ও মেটাডেটা ভ্যালিডেশন।" />
      <div className="grid grid-3">
        <Card><h2>চেক চালান</h2><p className="muted">প্রকাশিত/খসড়া সব পণ্যের মেটাডেটা, ডুপ্লিকেট কনটেন্ট ও অভ্যন্তরীণ লিংক যাচাই করে ফলাফল <code>seo_checks</code>-এ রেকর্ড করে।</p>
          <form action={runSeoChecksAction}><CsrfInput /><button className="btn btn-primary btn-sm" type="submit">SEO + লিংক চেক চালান</button></form>
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 10 }}>CLI: <code>npm run check:links</code> · Search Console/Analytics সংযোগ মালিকের ক্রেডেনশিয়াল সাপেক্ষে (বর্তমানে not_configured)।</p>
        </Card>
        <Card><h2>Sitemap / Robots</h2><p className="muted">Base URL: <code>{siteUrl()}</code><br />Sitemap এন্ট্রি: {entries} (শুধুমাত্র published + indexable পণ্য)</p>
          <div className="row"><Link className="btn btn-sm" href="/sitemap.xml">/sitemap.xml</Link><Link className="btn btn-sm" href="/robots.txt">/robots.txt</Link></div>
          <p className="muted" style={{ fontSize: '.8rem' }}>Structured data শুধুমাত্র যাচাইকৃত দাম/স্টক/রিভিউ থাকলে সেই ক্ষেত্র যোগ করে; কোনো aggregateRating তৈরি করা হয় না।</p>
        </Card>
        <Card><h2>নতুন 301 রিডাইরেক্ট</h2><form action={addRedirectAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="fromPath">from (/path) *</label><input id="fromPath" name="fromPath" required placeholder="/old-path" /></div>
          <div className="field"><label htmlFor="toPath">to (/path) *</label><input id="toPath" name="toPath" required placeholder="/new-path" /></div>
          <button className="btn btn-sm btn-primary" type="submit">রিডাইরেক্ট যোগ করুন</button>
        </form></Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card><h2>পণ্যের SEO অবস্থা</h2><Table headers={['Slug', 'অবস্থা', 'টাইটেল', 'Indexable']}>{products.map((p) => <tr key={p.slug}><td><Link href={`/admin/products`}>{p.slug}</Link></td><td>{p.status}</td><td className="muted">{p.title || 'সেট করা হয়নি'}</td><td>{p.indexable ? 'হ্যাঁ' : 'না'}</td></tr>)}</Table></Card>
        <Card><h2>সাম্প্রতিক চেক ({checks.length})</h2>{checks.length ? <Table headers={['চেক', 'অবস্থা', 'বিস্তারিত']}>{checks.map((c, i) => <tr key={i}><td>{String(c.check_name)}</td><td>{String(c.status)}</td><td className="muted">{String(c.detail)}</td></tr>)}</Table> : <p className="muted">এখনো চেক চালানো হয়নি।</p>}
          <h3 style={{ marginTop: 14 }}>রিডাইরেক্ট / ভাঙা লিংক</h3><p className="muted">রিডাইরেক্ট {redirects.length} · ভাঙা লিংক {broken.length}</p>
          {broken.length ? <Table headers={['URL', 'কোড']}>{broken.map((b) => <tr key={b.id}><td>{b.url}</td><td>{b.status_code}</td></tr>)}</Table> : null}
        </Card>
      </div>
      <Notice tone="warn">Analytics, Search Console, CDN ও ইমেজ অপটিমাইজেশন পাইপলাইনের বাহ্যিক সংযোগ মালিকের অনুমোদিত ক্রেডেনশিয়াল ছাড়া কনফিগার করা হয়নি। ছবি responsive size/alt/lazy-loading/fallback অ্যাপে বাস্তবায়িত; আসল রিসাইজ/কম্প্রেশন পাইপলাইন বাহ্যিক প্রসেসিং নির্ভরতা হিসেবে তালিকাভুক্ত।</Notice>
    </>
  );
}
