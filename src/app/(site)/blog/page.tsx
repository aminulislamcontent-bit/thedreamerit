import Link from 'next/link';
import { Crumbs, EmptyState, PageHead } from '@/components/ui';

export default function BlogPage() {
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'ব্লগ' }]} />
      <PageHead title="ব্লগ" subtitle="পণ্য ভিত্তিক প্রবন্ধ শুধুমাত্র যাচাইকৃত তথ্য ও মানব অনুমোদনের পর প্রকাশিত হয়।" />
      <EmptyState title="কোনো প্রকাশিত প্রবন্ধ নেই"><p>কোনো বানোয়াট কনটেন্ট বা প্রচারমূলক দাবি প্রকাশ করা হয়নি। অনুমোদিত খসড়া <Link href="/admin/content">AI Content Studio</Link> থেকে প্রকাশ করা যায়।</p></EmptyState>
    </>
  );
}
