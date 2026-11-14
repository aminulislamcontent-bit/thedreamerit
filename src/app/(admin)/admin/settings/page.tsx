import Link from 'next/link';
import { all, scalar } from '@/lib/server/database';
import { BUSINESS } from '@/lib/core/identity';
import { Badge, Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

const ENV_KEYS = [
  ['DATABASE_PATH', 'SQLite ডাটাবেস পাথ'], ['NEXT_PUBLIC_SITE_URL', 'canonical/sitemap base URL'], ['APP_SECRET', 'সার্ভার-সাইড ইন্টিগ্রিটি সিক্রেট'],
  ['CATALOGUE_MODE', 'live = ডেমো/খসড়া পাবলিক সাইট থেকে লুকোনো'], ['AI_PROVIDER_API_KEY', 'ঐচ্ছিক AI rewording (না থাকলে verified-field টেমপ্লেট)'],
  ['FACEBOOK_PAGE_TOKEN', 'Facebook Pages API'], ['INSTAGRAM_BUSINESS_TOKEN', 'Instagram Graph API'], ['YOUTUBE_API_KEY', 'YouTube Data API'],
  ['WHATSAPP_BUSINESS_TOKEN', 'WhatsApp Business Cloud API'], ['PAYMENT_GATEWAY_KEY', 'পেমেন্ট গেটওয়ে'], ['SMTP_URL', 'ইমেইল'],
  ['GOOGLE_SEARCH_CONSOLE_CREDENTIALS', 'Search Console'], ['GA_MEASUREMENT_ID', 'Analytics'], ['BOOTSTRAP_ADMIN_PASSWORD', 'প্রাথমিক অ্যাডমিন পাসওয়ার্ড'],
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const integrations = all<{ name: string; status: string; detail: string }>('SELECT * FROM integration_status ORDER BY name');
  const categories = scalar('SELECT COUNT(*) AS n FROM categories');
  const active = scalar('SELECT COUNT(*) AS n FROM categories WHERE is_active = 1');
  const published = scalar("SELECT COUNT(*) AS n FROM products WHERE status = 'published' AND is_demo = 0");
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="সেটিংস, পরিবেশ ও নির্ভরতা" subtitle="ব্যবসায়িক পরিচয়, ক্যাটালগ মোড, পরিবেশ ভেরিয়েবলের উপস্থিতি (মান কখনো প্রদর্শন করা হয় না) ও বহিঃসংযোগের প্রয়োজনীয় অনুমোদন।" />
      <div className="grid grid-2">
        <Card><h2>ব্যবসায়িক পরিচয়</h2><Table headers={['ক্ষেত্র', 'মান']}>
          <tr><td>নাম</td><td>{BUSINESS.name} / {BUSINESS.nameBn}</td></tr>
          <tr><td>দোকান</td><td>{BUSINESS.shopNumbers}</td></tr>
          <tr><td>ঠিকানা (bn)</td><td className="bn">{BUSINESS.addressBn}</td></tr>
          <tr><td>ঠিকানা (en)</td><td>{BUSINESS.addressEn}</td></tr>
          <tr><td>ফোন / ইমেইল</td><td>{BUSINESS.phone} / {BUSINESS.email}</td></tr>
          <tr><td>ভাষা</td><td>{BUSINESS.primaryLanguage} (প্রধান), {BUSINESS.secondaryLanguage}</td></tr>
          <tr><td>মুদ্রা / টাইমজোন</td><td>{BUSINESS.currency} / {BUSINESS.timezone}</td></tr>
          <tr><td>প্রস্তাবিত ডোমেইন</td><td>{BUSINESS.proposedPrimaryDomain} · {BUSINESS.proposedAlternativeDomain}</td></tr>
          <tr><td>নিবন্ধন</td><td><Badge tone="warn">করা হয়নি</Badge></td></tr>
        </Table>
          <Notice tone="warn">{BUSINESS.domainVerification.primary} {BUSINESS.domainVerification.alternative} চূড়ান্ত প্রাপ্যতা যাচাই ও ক্রয় মালিকের অনুমোদন সাপেক্ষে।</Notice>
        </Card>
        <Card><h2>ক্যাটালগ অবস্থা</h2><Table headers={['মেট্রিক', 'মান']}>
          <tr><td>মোট ক্যাটাগরি</td><td>{categories} (সম্পূর্ণ প্রস্তাবিত ট্যাক্সোনমি)</td></tr>
          <tr><td>সক্রিয় ক্যাটাগরি</td><td>{active} — মালিকের নিশ্চিত তথ্য ছাড়া কোনোটিই সক্রিয় নয়</td></tr>
          <tr><td>প্রকাশিত যাচাইকৃত পণ্য</td><td>{published}</td></tr>
          <tr><td>CATALOGUE_MODE</td><td>{process.env.CATALOGUE_MODE || 'live'}</td></tr>
        </Table>
          <p className="muted" style={{ fontSize: '.82rem' }}>ন্যূনতম ১৫টি স্বতন্ত্র যাচাইকৃত মডেল/সক্রিয় ক্যাটাগরি নিয়ম <Link href="/admin/catalogue">ক্যাটালগ ড্যাশবোর্ডে</Link> প্রয়োগ হয়। ডেমো রেকর্ড স্পষ্টভাবে চিহ্নিত ও লাইভ থেকে বাদ।</p>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <Card><h2>পরিবেশ ভেরিয়েবল (শুধুমাত্র উপস্থিতি)</h2><Table headers={['কী', 'উদ্দেশ্য', 'অবস্থা']}>{ENV_KEYS.map(([key, purpose]) => <tr key={key}><td><code>{key}</code></td><td className="muted">{purpose}</td><td><Badge tone={process.env[key] ? 'ok' : 'warn'}>{process.env[key] ? 'সেট আছে' : 'সেট নেই'}</Badge></td></tr>)}</Table>
          <p className="muted" style={{ fontSize: '.8rem' }}>কোনো সিক্রেটের মান UI, ফ্রন্টএন্ড কোড বা সোর্স কন্ট্রোলে প্রকাশ করা হয় না। <code>.env.example</code> ও <code>docs/ENVIRONMENT.md</code> দেখুন।</p></Card>
        <Card><h2>বহিঃনির্ভরতা</h2><Table headers={['সংযোগ', 'অবস্থা', 'প্রয়োজন']}>{integrations.map((i) => <tr key={i.name}><td>{i.name}</td><td><Badge tone={i.status === 'healthy' ? 'ok' : 'warn'}>{i.status}</Badge></td><td className="muted">{i.detail}</td></tr>)}</Table>
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 10 }}>সম্পূর্ণ তালিকা: <code>docs/OUTSTANDING_DEPENDENCIES.md</code> · API: <code>docs/API.md</code> · ডিপ্লয়মেন্ট: <code>DEPLOYMENT.md</code> · নিরাপত্তা: <code>docs/SECURITY_REVIEW.md</code>।</p>
        </Card>
      </div>
      <Notice>এই অ্যাপে কোনো পেমেন্ট, সোশ্যাল, ইমেইল বা অ্যানালিটিক্স সংযোগ "সংযুক্ত" বলে দাবি করা হয় না। প্রতিটি সংযোগের জন্য মালিকের অনুমোদিত ক্রেডেনশিয়াল ও অফিশিয়াল API প্রয়োজন।</Notice>
    </>
  );
}
