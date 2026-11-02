import Link from 'next/link';
import { BUSINESS } from '@/lib/core/identity';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 10 }}><span className="brand-mark">D</span>{BUSINESS.name}</div>
          <p className="bn muted">{BUSINESS.addressBn}</p>
          <p className="muted" style={{ fontSize: '.85rem' }}>দোকান নং {BUSINESS.shopNumbers} · ফোন: <a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a><br />
            ইমেইল: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
          <p className="muted" style={{ fontSize: '.82rem' }}>মুদ্রা: {BUSINESS.currency} · সময় অঞ্চল: {BUSINESS.timezone} · ভাষা: বাংলা / English</p>
        </div>
        <div>
          <h3>কেনাকাটা</h3>
          <Link href="/products">সব পণ্য</Link><Link href="/categories">ক্যাটাগরি</Link><Link href="/compare">পণ্য তুলনা</Link>
          <Link href="/cart">কার্ট</Link><Link href="/account/orders">অর্ডার ট্র্যাকিং</Link>
        </div>
        <div>
          <h3>নীতিমালা</h3>
          <Link href="/policies/delivery">ডেলিভারি নীতি</Link><Link href="/policies/returns">রিটার্ন নীতি</Link>
          <Link href="/policies/terms">শর্তাবলী</Link><Link href="/policies/privacy">গোপনীয়তা</Link><Link href="/faq">সাধারণ প্রশ্ন</Link>
        </div>
        <div>
          <h3>ব্যবসা</h3>
          <Link href="/about">আমাদের সম্পর্কে</Link><Link href="/contact">যোগাযোগ</Link>
          <Link href="/login">স্টাফ লগইন</Link><Link href="/admin">অ্যাডমিন</Link>
          <p className="muted" style={{ fontSize: '.78rem', marginTop: 12 }}>
            প্রস্তাবিত ডোমেইন: {BUSINESS.proposedPrimaryDomain} / {BUSINESS.proposedAlternativeDomain} —{' '}
            <strong>নিবন্ধন বা প্রাপ্যতা যাচাই করা হয়নি</strong>।
          </p>
        </div>
      </div>
      <div className="container muted" style={{ fontSize: '.78rem', borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 26 }}>
        © {new Date().getFullYear()} {BUSINESS.name}. এই সাইটে কোনো যাচাই না করা পণ্য, দাম, স্টক বা গ্রাহক পর্যালোচনা প্রকাশ করা হয় না।
      </div>
    </footer>
  );
}
