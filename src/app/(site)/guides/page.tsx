import Link from 'next/link';
import { Card, Crumbs, EmptyState, PageHead } from '@/components/ui';

export default function GuidesPage() {
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'কেনাকাটার গাইড' }]} />
      <PageHead title="কেনাকাটার গাইড" subtitle="যাচাইকৃত পণ্য তথ্য থেকে তৈরি গাইড; কোনো বানোয়াট স্পেসিফিকেশন বা দাম নেই।" />
      <EmptyState title="এখনো কোনো গাইড প্রকাশিত হয়নি"><p>গাইড AI Content Studio-তে যাচাইকৃত তথ্য থেকে খসড়া হিসেবে তৈরি হয় এবং মানব অনুমোদনের পরেই প্রকাশ পায়। বর্তমানে কোনো অনুমোদিত গাইড নেই।</p></EmptyState>
      <div className="grid grid-3" style={{ marginTop: 22 }}>
        <Card><h3>ল্যাপটপ কেনার আগে</h3><p className="muted">প্রসেসর ও প্রজন্ম, RAM, স্টোরেজ, ডিসপ্লে, পোর্ট ও ওয়ারেন্টি — প্রতিটি ক্ষেত্র যাচাইকৃত উৎস ছাড়া দেখানো হয় না।</p><Link href="/categories/business-laptops">বিজনেস ল্যাপটপ →</Link></Card>
        <Card><h3>ডেস্কটপ কম্প্যাটিবিলিটি</h3><p className="muted">সকেট, RAM টাইপ, PSU ওয়াটেজ, GPU দৈর্ঘ্য ও কেস ফর্ম-ফ্যাক্টর যাচাইকৃত কম্পোনেন্ট ডেটা থেকে যাচাই করুন।</p><Link href="/configurator">কম্প্যাটিবিলিটি চেক →</Link></Card>
        <Card><h3>পণ্য তুলনা</h3><p className="muted">যাচাইকৃত স্পেসিফিকেশন, দাম ও ওয়ারেন্টি পাশাপাশি দেখুন। কোনো কর্মক্ষমতার অনুমান করা হয় না।</p><Link href="/compare">তুলনা →</Link></Card>
      </div>
    </>
  );
}
