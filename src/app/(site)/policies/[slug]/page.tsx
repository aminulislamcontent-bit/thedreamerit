import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Crumbs, Notice, PageHead } from '@/components/ui';
import { BUSINESS } from '@/lib/core/identity';

// Nonce CSP requires a dynamic render; generateStaticParams must not leave these HTML
// pages without the per-request nonce.
export const dynamic = 'force-dynamic';

const POLICIES: Record<string, { title: string; intro: string; sections: Array<[string, string]> }> = {
  delivery: {
    title: 'ডেলিভারি নীতি',
    intro: 'এই পৃষ্ঠাটি নীতির কাঠামো; নির্দিষ্ট সময়সীমা, এলাকা বা চার্জ মালিক কর্তৃক অনুমোদিত না হওয়া পর্যন্ত দাবি করা হয় না।',
    sections: [
      ['অর্ডার প্রক্রিয়াকরণ', 'অর্ডার তৈরির পর স্টক BEGIN IMMEDIATE ট্রানজ্যাকশনে রিজার্ভ হয়। যাচাইকৃত পেমেন্ট ইভেন্ট বা অনুমোদিত ক্যাশ রিকনসিলিয়েশন ছাড়া অর্ডারকে পরিশোধিত করা হয় না।'],
      ['ডিসপ্যাচ ও গ্রহণ', 'শাখা থেকে ডিসপ্যাচ ও গ্রহণ নিশ্চিতকরণ আলাদা ইভেন্ট হিসেবে স্টক মুভমেন্টে রেকর্ড হয়; ডেলিভারি ট্র্যাকিং অর্ডারের সাথে যুক্ত।'],
      ['সময় ও খরচ', 'কোনো নির্দিষ্ট ডেলিভারি সময় বা চার্জ কনফিগার করা হয়নি। পণ্য পৃষ্ঠায় কোনো আনুমানিক তারিখ দেখানো হয় না।'],
      ['যোগাযোগ', `প্রশ্নে ${BUSINESS.phone} অথবা ${BUSINESS.email} এ যোগাযোগ করুন।`],
    ],
  },
  returns: {
    title: 'রিটার্ন ও রিফান্ড নীতি',
    intro: 'রিটার্ন অনুরোধ রেকর্ড করা হয়; স্বয়ংক্রিয়ভাবে অনুমোদিত হয় না।',
    sections: [
      ['অনুরোধ', 'গ্রাহক অ্যাকাউন্ট থেকে অর্ডার ও পণ্য উল্লেখ করে রিটার্ন অনুরোধ দেওয়া যায়।'],
      ['যাচাই', 'কর্মী সিরিয়াল নাম্বার, ক্রয় রেকর্ড ও পণ্যের অবস্থা যাচাই করেন; অনুমোদনের পর স্টক মুভমেন্টে রিটার্ন রেকর্ড হয়।'],
      ['রিফান্ড', 'রিফান্ড শুধুমাত্র যাচাইকৃত পেমেন্টের বিপরীতে এবং সেই অঙ্কের বেশি নয়। কোনো পেমেন্ট ছাড়া রিফান্ড করা হয় না।'],
      ['কমিশন', 'রিটার্ন, বাতিল ও রিফান্ডের ক্ষেত্রে সংশ্লিষ্ট কমিশন রেকর্ড বিপরীত (reversed) করা হয়।'],
    ],
  },
  terms: {
    title: 'ব্যবহারের শর্তাবলী',
    intro: 'প্ল্যাটফর্ম ব্যবহারের সাধারণ শর্ত; চূড়ান্ত আইনি পর্যালোচনা মালিকের অনুমোদন সাপেক্ষ।',
    sections: [
      ['তথ্যের নির্ভুলতা', 'যাচাইকৃত তথ্য প্রদর্শনের চেষ্টা করা হয়। কোনো তথ্য যাচাই না হলে তা প্রদর্শন করা হয় না; যাচাইকৃত তথ্যের উৎস পণ্য পৃষ্ঠায় উল্লেখ থাকে।'],
      ['মূল্য ও প্রাপ্যতা', 'দাম ও স্টক শুধুমাত্র অনুমোদিত উৎস ও প্রকৃত ইনভেন্টরি রেকর্ড থেকে; কোনো প্রচারমূলক ছাড় বা রেটিং তৈরি করা হয় না।'],
      ['অ্যাকাউন্ট', 'ব্যবহারকারী তার লগইন তথ্যের নিরাপত্তার জন্য দায়ী। স্টাফ অ্যাক্সেস ভূমিকা-ভিত্তিক অনুমতি ও অডিট লগ দ্বারা নিয়ন্ত্রিত।'],
      ['সংশোধন', 'নীতিমালা পরিবর্তন হলে তারিখসহ রেকর্ড করা হবে।'],
    ],
  },
  privacy: {
    title: 'গোপনীয়তা নীতি',
    intro: 'ন্যূনতম তথ্য সংগ্রহ ও কঠোর অ্যাক্সেস নিয়ন্ত্রণ।',
    sections: [
      ['সংগৃহীত তথ্য', 'অ্যাকাউন্টের নাম/ইমেইল, অর্ডারের ঠিকানা/ফোন, সাপোর্ট টিকেট ও অডিট লগ। পাসওয়ার্ড scrypt হ্যাশ আকারে সংরক্ষিত, কখনো সমতলে নয়।'],
      ['সম্মতি', 'মার্কেটিং সম্মতি ডিফল্টভাবে বন্ধ; প্রতিটি পরিবর্তন উৎসসহ consent_records-এ রেকর্ড হয়। যোগাযোগের ইতিহাস communications টেবিলে থাকে।'],
      ['অ্যাক্সেস', 'কর্মী অ্যাক্সেস RBAC দ্বারা নিয়ন্ত্রিত; গ্রাহক কেবল নিজের অর্ডার/উইশলিস্ট/অনুরোধ দেখতে পারেন। সংবেদনশীল HR তথ্য আলাদা অনুমতির আওতায়।'],
      ['বহিঃসংযোগ', 'পেমেন্ট, ইমেইল, অ্যানালিটিক্স বা সোশ্যাল সংযোগ কনফিগার করা হয়নি; চালু হলে তালিকা ও উদ্দেশ্য ENVIRONMENT.md-তে নথিভুক্ত হবে।'],
      ['ব্যাকআপ', 'চেকসাম-যাচাইকৃত ডাটাবেস ব্যাকআপ local backups/ ফোল্ডারে; অফ-সাইট কপির জন্য মালিকের স্টোরেজ প্রয়োজন।'],
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: POLICIES[slug]?.title ?? 'নীতিমালা' };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: policy.title }]} />
      <PageHead title={policy.title} subtitle={policy.intro} />
      <div className="grid grid-2">
        <div className="stack policy-body">{policy.sections.map(([h, body]) => <Card key={h}><h2>{h}</h2><p className="muted">{body}</p></Card>)}</div>
        <Card><h2>মনে রাখবেন</h2><Notice tone="warn">এই নীতিমালার চূড়ান্ত ব্যবসায়িক শর্ত (সময়সীমা, চার্জ, আইনি ধারা) মালিকের অনুমোদন ছাড়া চূড়ান্ত বলে দাবি করা হয় না।</Notice>
          <p className="muted">যোগাযোগ: <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a> · <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
          <p><Link href="/contact">যোগাযোগ ফর্ম →</Link> · <Link href="/faq">FAQ →</Link></p>
        </Card>
      </div>
    </>
  );
}
