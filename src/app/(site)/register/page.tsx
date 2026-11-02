import { RegisterForm } from '@/components/login-form';
import { Card, Crumbs, PageHead } from '@/components/ui';

export default function RegisterPage() {
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'রেজিস্ট্রেশন' }]} />
      <PageHead title="গ্রাহক অ্যাকাউন্ট তৈরি করুন" subtitle="ন্যূনতম তথ্য নেওয়া হয়; মার্কেটিং সম্মতি ডিফল্টভাবে বন্ধ।" />
      <Card style={{ maxWidth: 520 }}><RegisterForm /></Card>
    </>
  );
}
