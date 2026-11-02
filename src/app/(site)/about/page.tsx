import { BUSINESS } from '@/lib/core/identity';
import { Card, Crumbs, Notice, PageHead } from '@/components/ui';

export default function AboutPage() {
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'আমাদের সম্পর্কে' }]} />
      <PageHead title={BUSINESS.name} subtitle="কম্পিউটার ও প্রযুক্তি খুচরা ব্যবসার জন্য একটি যাচাই-ভিত্তিক ডিজিটাল প্ল্যাটফর্ম।" />
      <div className="grid grid-2">
        <Card><h2>ব্যবসার পরিচয়</h2><p className="bn">{BUSINESS.addressBn}</p><p className="muted">{BUSINESS.addressEn}</p><p>দোকান নং {BUSINESS.shopNumbers} · ফোন {BUSINESS.phone} · ইমেইল {BUSINESS.email}</p><p className="muted">প্রধান ভাষা বাংলা, দ্বিতীয় ভাষা English; মুদ্রা {BUSINESS.currency}; সময় অঞ্চল {BUSINESS.timezone}। সিস্টেম অতিরিক্ত শাখা, গুদাম, কর্মচারী, সরবরাহকারী, ব্র্যান্ড ও ব্যবসায়িক ইউনিট সমর্থন করে।</p></Card>
        <Card><h2>তথ্য নীতি</h2><p className="muted">এই প্ল্যাটফর্ম কোনো পণ্যের স্পেসিফিকেশন, দাম, স্টক, ওয়ারেন্টি বা গ্রাহক পর্যালোচনা উদ্ভাবন করে না। প্রতিটি প্রকাশনার আগে উৎস, যাচাই, লাইসেন্সকৃত মিডিয়া, SEO ও মানব অনুমোদন প্রয়োজন।</p>
          <Notice tone="warn">প্রস্তাবিত ডোমেইন {BUSINESS.proposedPrimaryDomain} ও {BUSINESS.proposedAlternativeDomain} — {BUSINESS.domainVerification.primary} {BUSINESS.domainVerification.alternative} কোনো নিবন্ধন বা ক্রয় করা হয়নি।</Notice>
        </Card>
      </div>
    </>
  );
}
