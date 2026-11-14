import Link from 'next/link';
import { all, scalar } from '@/lib/server/database';
import { BUSINESS } from '@/lib/core/identity';
import { Badge, Card, Notice, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const published = scalar("SELECT COUNT(*) AS n FROM products WHERE status = 'published' AND is_demo = 0");
  const verified = scalar("SELECT COUNT(*) AS n FROM products WHERE verification_status = 'verified' AND is_demo = 0");
  const activeCategories = scalar('SELECT COUNT(*) AS n FROM categories WHERE is_active = 1');
  const totalCategories = scalar('SELECT COUNT(*) AS n FROM categories');
  const demo = scalar('SELECT COUNT(*) AS n FROM products WHERE is_demo = 1');
  const groups = all<{ group_name: string; total: number; active: number }>(
    'SELECT group_name, COUNT(*) AS total, SUM(is_active) AS active FROM categories GROUP BY group_name ORDER BY MIN(sort_order)');

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <span className="eyebrow">● আইসিটি ভবন · দোকান ১০৪ ও ১০৫</span>
          <h1 style={{ marginTop: 18 }}>{BUSINESS.name}</h1>
          <p style={{ fontSize: '1.1rem', maxWidth: 760 }}>
            কম্পিউটার, কম্পোনেন্ট ও প্রযুক্তি পণ্যের জন্য একটি যাচাই-ভিত্তিক কেনাকাটার অভিজ্ঞতা।
            <strong> প্রতিটি প্রকাশিত পণ্যের নিজস্ব বিস্তারিত পৃষ্ঠা, যাচাইকৃত তথ্য ও অনুমোদিত মিডিয়া থাকতে হবে।</strong>
          </p>
          <p className="bn muted" style={{ maxWidth: 720 }}>{BUSINESS.addressBn}</p>
          <div className="row" style={{ marginTop: 22 }}>
            <Link className="btn btn-primary" href="/products">পণ্য দেখুন →</Link>
            <Link className="btn" href="/categories">ক্যাটাগরি ব্রাউজ করুন</Link>
            <a className="btn" href={`tel:${BUSINESS.phone}`}>📞 {BUSINESS.phone}</a>
          </div>
          <div className="tag-list" style={{ marginTop: 24 }}>
            <Badge tone="info">বাংলা / English</Badge><Badge tone="info">{BUSINESS.currency}</Badge><Badge tone="info">{BUSINESS.timezone}</Badge>
            <Badge tone="warn">কোনো ডোমেইন নিবন্ধন করা হয়নি</Badge>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="grid grid-4">
          <Stat label="প্রকাশিত যাচাইকৃত পণ্য" value={published} hint="কোনো বানোয়াট পণ্য প্রকাশ করা হয়নি" />
          <Stat label="যাচাইকৃত মডেল" value={verified} hint="উৎস ও যাচাই অবস্থা রেকর্ড করা হয়" />
          <Stat label="প্রস্তাবিত ক্যাটাগরি" value={totalCategories} hint={`${activeCategories} টি সক্রিয়; সক্রিয়করণের আগে মালিকের নিশ্চয়তা প্রয়োজন`} />
          <Stat label="ডেমো রেকর্ড" value={demo} tone="warn" hint="স্পষ্টভাবে চিহ্নিত ও লাইভ ক্যাটালগ থেকে বাদ" />
        </div>
        <Notice tone="warn">
          <strong>ক্যাটালগ সততা:</strong> বর্তমানে <strong>{published}টি</strong> যাচাইকৃত পণ্য প্রকাশিত হয়েছে। কোনো প্রস্তুতকারকের স্পেসিফিকেশন, দাম, স্টক, ওয়ারেন্টি বা গ্রাহক পর্যালোচনা উদ্ভাবন করা হয়নি।
          প্রতিটি সক্রিয় ক্যাটাগরির জন্য <strong>কমপক্ষে ১৫টি স্বতন্ত্র যাচাইকৃত মডেল</strong> বাধ্যতামূলক; সিস্টেম সেই শর্ত পূরণ না হলে ক্যাটালগকে সম্পূর্ণ ঘোষণা করে না।
          অনুমোদিত পণ্য-তথ্য ও লাইসেন্সকৃত মিডিয়া আমদানির ব্যবস্থা <Link href="/admin/catalogue">অ্যাডমিন প্যানেলে</Link> আছে।
        </Notice>
      </section>

      <section className="section">
        <div className="spread"><h2>প্রস্তাবিত পণ্য ক্যাটাগরি</h2><Link className="btn btn-sm" href="/categories">সব ক্যাটাগরি →</Link></div>
        <p className="muted">এটি একটি প্রস্তাবিত খুচরা ট্যাক্সোনমি — দোকানে প্রতিটি ক্যাটাগরির পণ্য মজুত আছে বলে দাবি নয়।</p>
        <div className="grid grid-4" style={{ marginTop: 18 }}>
          {groups.map((g, i) => (
            <Link key={g.group_name} href={`/categories?group=${encodeURIComponent(g.group_name)}`} className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Badge>{String(i + 1).padStart(2, '0')}</Badge>
              <h3 style={{ marginTop: 12 }}>{g.group_name}</h3>
              <p className="muted" style={{ fontSize: '.86rem' }}>{g.total} ক্যাটাগরি · {Number(g.active) || 0} সক্রিয়</p>
              <span className="muted" style={{ fontSize: '.8rem' }}>প্রতি সক্রিয় ক্যাটাগরিতে ১৫টি যাচাইকৃত মডেল →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>প্ল্যাটফর্মের বৈশিষ্ট্য</h2>
        <div className="grid grid-3">
          <Card><h3>🧊 প্রকৃত 3D ও 360° ভিউয়ার</h3><p className="muted">Three.js/WebGL ভিত্তিক GLB/glTF ভিউয়ার, ড্র্যাগ/সোয়াইপ 360° ছবির ধারাবাহিকতা, ফুল-স্ক্রিন ও জুম। অ্যাসেট না থাকলে স্পষ্ট ফলব্যাক — কখনোই ছবিকে 3D মডেল বলা হয় না।</p></Card>
          <Card><h3>✅ প্রকাশনা নিয়ন্ত্রণ</h3><p className="muted">যাচাইকৃত স্পেসিফিকেশন, লাইসেন্সকৃত মিডিয়া, মূল্য-উৎস, SEO পর্যালোচনা, প্রকৃত ইনভেন্টরি ও অনুমোদন — সবগুলো পাস না হলে পণ্য প্রকাশ হয় না।</p></Card>
          <Card><h3>🏬 ইনভেন্টরি, POS ও ERP</h3><p className="muted">শাখা ও গুদাম, ট্রানজ্যাকশনাল স্টক রিজার্ভেশন, ক্রয়, মূল্য-ফ্লোর, অর্ডার, যাচাইকৃত পেমেন্ট, কর্মচারী ও কমিশন — সবই প্রকৃত রেকর্ড থেকে।</p></Card>
          <Card><h3>✍️ AI কনটেন্ট স্টুডিও</h3><p className="muted">বাংলা ও ইংরেজি খসড়া শুধুমাত্র যাচাইকৃত তথ্য থেকে; কোনো বানোয়াট দাম/রিভিউ নয়, মানব অনুমোদন ও সংশোধন ইতিহাস বাধ্যতামূলক।</p></Card>
          <Card><h3>🔎 SEO ও সোশ্যাল ওয়ার্কফ্লো</h3><p className="muted">ক্যানোনিকাল, স্ট্রাকচার্ড ডাটা, সাইটম্যাপ, ডুপ্লিকেট চেক, রিডাইরেক্ট; সোশ্যাল পোস্ট শুধুমাত্র প্ল্যাটফর্ম নিশ্চিতকরণের পরেই "published" হয়।</p></Card>
          <Card><h3>🔐 নিরাপত্তা ও ব্যাকআপ</h3><p className="muted">scrypt পাসওয়ার্ড, সেশন, RBAC, CSRF, হার-সীমা, অডিট লগ, TOTP MFA, চেকসাম-যাচাইকৃত ব্যাকআপ ও পরীক্ষিত রিস্টোর।</p></Card>
        </div>
      </section>

      <section className="section">
        <div className="grid grid-2">
          <Card>
            <h2>যোগাযোগ ও ব্যবসায়িক তথ্য</h2>
            <p className="bn">{BUSINESS.addressBn}</p>
            <p className="muted">{BUSINESS.addressEn}</p>
            <p>📞 <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a> · ✉️ <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
            <p className="muted">মুদ্রা {BUSINESS.currency} · সময় অঞ্চল {BUSINESS.timezone} · প্রধান ভাষা বাংলা</p>
            <Link className="btn btn-sm" href="/contact">যোগাযোগ ফর্ম →</Link>
          </Card>
          <Card>
            <h2>ডোমেইন ও বহিঃসংযোগ</h2>
            <p className="muted">প্রস্তাবিত: <code>{BUSINESS.proposedPrimaryDomain}</code> ও <code>{BUSINESS.proposedAlternativeDomain}</code>।</p>
            <p className="muted">{BUSINESS.domainVerification.primary}</p>
            <p className="muted">{BUSINESS.domainVerification.alternative}</p>
            <Notice tone="warn">এই প্রকল্প কোনো ডোমেইন নিবন্ধন বা ক্রয় করেনি। পেমেন্ট, সোশ্যাল, ইমেইল ও অ্যানালিটিক্স সংযোগের জন্য মালিকের অনুমোদিত ক্রেডেনশিয়াল প্রয়োজন।</Notice>
            <Link className="btn btn-sm" href="/about">বিস্তারিত →</Link>
          </Card>
        </div>
      </section>
    </>
  );
}
