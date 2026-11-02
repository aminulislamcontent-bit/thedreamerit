import Link from 'next/link';
import { supportTicketAction } from '@/app/actions/customer';
import { Card, Crumbs, PageHead, PageNotices } from '@/components/ui';

export const dynamic = 'force-dynamic';

const FAQ = [
  ['কেন কোনো পণ্যের দাম দেখা যাচ্ছে না?', 'অনুমোদিত মূল্য-উৎস ও যাচাই রেকর্ড না থাকলে দাম প্রদর্শন করা হয় না। বানোয়াট দাম দেওয়া হয় না।'],
  ['কেন পণ্যের সংখ্যা শূন্য?', 'প্রকাশনার আগে ১৫-মডেলের ক্যাটাগরি নিয়ম, যাচাইকৃত স্পেসিফিকেশন, লাইসেন্সকৃত মিডিয়া, মূল্য-উৎস, প্রকৃত ইনভেন্টরি, SEO ও মানব অনুমোদন — সব পাস করতে হয়।'],
  ['3D মডেল ও 360° ভিউয়ার কি একই?', 'না। 3D মডেল GLB/glTF অ্যাসেট থেকে WebGL-এ রেন্ডার হয়; 360° হলো ধারাবাহিক ছবির ড্র্যাগ/সোয়াইপ ভিউ। স্থির ছবির গ্যালারিকে কখনোই 3D বলা হয় না।'],
  ['অর্ডার কি অনলাইনে পরিশোধ করা যায়?', 'পেমেন্ট গেটওয়ে সংযুক্ত নেই। অর্ডার তৈরি হয়, কিন্তু যাচাইকৃত পেমেন্ট ইভেন্ট বা অনুমোদিত ক্যাশ রিকনসিলিয়েশন ছাড়া "paid" হয় না।'],
  ['গ্রাহক পর্যালোচনা কোথায়?', 'কোনো যাচাইকৃত ক্রয়-পর্যালোচনা না থাকলে রেটিং দেখানো হয় না; কোনো রিভিউ তৈরি করা হয় না।'],
  ['ডোমেইন কি নিবন্ধিত?', 'না। প্রস্তাবিত ডোমেইন দুটির চূড়ান্ত প্রাপ্যতা যাচাই ও নিবন্ধন মালিকের অনুমোদন ও ক্রয়ের উপর নির্ভরশীল।'],
];

export default async function FaqPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'সাধারণ প্রশ্ন' }]} /><PageNotices searchParams={sp} />
      <PageHead title="সাধারণ প্রশ্ন (FAQ)" subtitle="প্ল্যাটফর্মের তথ্য-নীতি ও বর্তমান অবস্থা সম্পর্কে সৎ উত্তর।" />
      <div className="grid grid-2">
        <div className="stack">{FAQ.map(([q, a]) => <Card key={q}><h3>{q}</h3><p className="muted">{a}</p></Card>)}</div>
        <Card><h2>সাপোর্ট টিকেট</h2><p className="muted">অতিরিক্ত প্রশ্ন থাকলে টিকেট রেকর্ড করুন।</p>
          <form action={supportTicketAction} className="stack">
            <div className="field"><label htmlFor="subject">বিষয় *</label><input id="subject" name="subject" required /></div>
            <div className="field"><label htmlFor="body">বিস্তারিত</label><textarea id="body" name="body" /></div>
            <button className="btn btn-primary" type="submit">টিকেট খুলুন</button>
          </form>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 12 }}>অথবা <Link href="/contact">যোগাযোগ ফর্ম</Link> ব্যবহার করুন।</p>
        </Card>
      </div>
    </>
  );
}
