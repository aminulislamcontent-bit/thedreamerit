import Link from 'next/link';
import { LoginForm } from '@/components/login-form';
import { Card, Crumbs, Notice, PageHead } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'লগইন' }]} />
      <PageHead title="স্টাফ ও গ্রাহক লগইন" subtitle="একই লগইন ব্যবস্থা; অ্যাডমিন পৃষ্ঠাগুলো সার্ভার-সাইড RBAC দ্বারা সুরক্ষিত।" />
      {sp.error ? <Notice tone="danger">{sp.error}</Notice> : null}
      <div className="grid grid-2">
        <Card><h2>লগইন</h2><LoginForm next={sp.next} /></Card>
        <Card><h2>নতুন গ্রাহক?</h2><p className="muted">অ্যাকাউন্ট তৈরি করে অর্ডার ইতিহাস, উইশলিস্ট, ওয়ারেন্টি ও রিটার্ন অনুরোধ দেখতে পারবেন।</p><Link className="btn btn-primary" href="/register">অ্যাকাউন্ট তৈরি করুন →</Link>
          <hr /><h3>নিরাপত্তা</h3><p className="muted" style={{ fontSize: '.85rem' }}>scrypt হ্যাশিং, httpOnly সেশন কুকি, ১২ ঘণ্টার মেয়াদ, হার-সীমা, অ্যাকাউন্ট লক, ঐচ্ছিক TOTP MFA ও প্রতিটি ঘটনার অডিট লগ। কোনো ডিফল্ট পাবলিক পাসওয়ার্ড নেই।</p>
        </Card>
      </div>
    </>
  );
}
