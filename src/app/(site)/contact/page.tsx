import Link from 'next/link';
import { contactAction } from '@/app/actions/customer';
import { BUSINESS } from '@/lib/core/identity';
import { Card, Crumbs, Notice, PageHead, PageNotices } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'যোগাযোগ' }]} />
      <PageNotices searchParams={sp} />
      <PageHead title="যোগাযোগ" subtitle="প্রশ্ন, পণ্য-সহায়তা অনুরোধ বা মেরামতের জন্য বার্তা দিন।" />
      <div className="grid grid-2">
        <Card><h2>বার্তা পাঠান</h2>
          <form action={contactAction} className="stack">
            <div className="field"><label htmlFor="name">নাম *</label><input id="name" name="name" required /></div>
            <div className="field"><label htmlFor="phone">ফোন</label><input id="phone" name="phone" /></div>
            <div className="field"><label htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" /></div>
            <div className="field"><label htmlFor="message">বার্তা *</label><textarea id="message" name="message" required /></div>
            <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="consent" value="1" style={{ width: 'auto' }} /> আমি মার্কেটিং যোগাযোগে সম্মতি দিচ্ছি (ঐচ্ছিক)</label>
            <button className="btn btn-primary" type="submit">পাঠান</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>ফর্মটি হার-সীমিত ও হানিপট-সুরক্ষিত। সম্মতি না দিলেও বার্তা পাঠানো যায়; সম্মতি আলাদাভাবে রেকর্ড করা হয়।</p>
        </Card>
        <Card><h2>দোকানের তথ্য</h2>
          <p className="bn">{BUSINESS.addressBn}</p><p className="muted">{BUSINESS.addressEn}</p>
          <p>দোকান নং: {BUSINESS.shopNumbers}<br />📞 <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a><br />✉️ <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
          <p className="muted">ভাষা: বাংলা (প্রধান), English · মুদ্রা: {BUSINESS.currency} · সময়: {BUSINESS.timezone}</p>
          <Notice tone="warn">খোলার সময়, ডেলিভারি এলাকা ও সার্ভিস চার্জ মালিক কর্তৃক নিশ্চিত না হওয়া পর্যন্ত দাবি করা হয় না।</Notice>
          <Link className="btn btn-sm" href="/faq">সাধারণ প্রশ্ন →</Link>
        </Card>
      </div>
    </>
  );
}
