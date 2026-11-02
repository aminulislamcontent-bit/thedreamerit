import Link from 'next/link';
import { getCartView } from '@/lib/server/cart';
import { checkoutAction } from '@/app/actions/customer';
import { Crumbs, EmptyState, Notice, PageHead, PageNotices, Card } from '@/components/ui';
import { moneyToBdt } from '@/lib/core/identity';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cart = await getCartView();
  const placed = sp.placed === '1';
  const order = Array.isArray(sp.order) ? sp.order[0] : sp.order;
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'কার্ট', href: '/cart' }, { label: 'চেকআউট' }]} />
      <PageNotices searchParams={sp} />
      <PageHead title="চেকআউট" subtitle="যাচাইকৃত মূল্য ও প্রকৃত স্টকের ভিত্তিতে অর্ডার তৈরি হয়। কোনো পেমেন্ট গেটওয়ে সংযুক্ত না থাকায় অনলাইন পেমেন্ট গ্রহণ করা হয় না।" />
      {placed ? (
        <Notice><strong>অর্ডার তৈরি হয়েছে{order ? `: ${order}` : ''}।</strong> অর্ডারটি এখনো <strong>অপরিশোধিত (pending_payment)</strong> — কোনো যাচাইকৃত পেমেন্ট ইভেন্ট ছাড়া একে "paid" বলা হয় না। <Link href="/account/orders">অর্ডার দেখুন →</Link></Notice>
      ) : null}
      {!cart || !cart.items.length ? <EmptyState title="চেকআউটের জন্য কার্টে কোনো আইটেম নেই"><p><Link href="/products">পণ্য দেখুন</Link></p></EmptyState> : (
        <div className="grid grid-2">
          <Card><h2>গ্রাহক তথ্য</h2>
            <form action={checkoutAction} className="stack">
              <div className="field"><label htmlFor="name">নাম *</label><input id="name" name="name" required minLength={2} /></div>
              <div className="field"><label htmlFor="phone">ফোন *</label><input id="phone" name="phone" required minLength={6} placeholder="01XXXXXXXXX" /></div>
              <div className="field"><label htmlFor="email">ইমেইল (ঐচ্ছিক)</label><input id="email" name="email" type="email" /></div>
              <div className="field"><label htmlFor="address">ঠিকানা *</label><textarea id="address" name="address" required minLength={5} /></div>
              <button className="btn btn-primary" type="submit">অর্ডার নিশ্চিত করুন</button>
              <p className="muted" style={{ fontSize: '.8rem' }}>কোনো মার্কেটিং সম্মতি ধরে নেওয়া হয় না। তথ্য শুধুমাত্র অর্ডার প্রক্রিয়াকরণে ব্যবহৃত হয়।</p>
            </form>
          </Card>
          <Card><h2>অর্ডার সারাংশ</h2>
            <ul>{cart.items.map((i) => <li key={i.id}>{i.model_name} × {i.quantity} — ৳ {moneyToBdt(i.unit_price * i.quantity)}</li>)}</ul>
            <hr /><strong>মোট: ৳ {moneyToBdt(cart.subtotal)} BDT</strong>
            <p className="muted" style={{ fontSize: '.82rem', marginTop: 14 }}>ডেলিভারি চার্জ বা তারিখ দাবি করা হয় না (কোনো অনুমোদিত ডেলিভারি নিয়ম নেই)। পেমেন্ট পদ্ধতি ও ইনভয়েস staff দ্বারা যাচাইকৃত পেমেন্টের পর নির্ধারিত হয়।</p>
          </Card>
        </div>
      )}
    </>
  );
}
