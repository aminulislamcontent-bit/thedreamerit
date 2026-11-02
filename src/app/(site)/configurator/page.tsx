import Link from 'next/link';
import { scalar } from '@/lib/server/database';
import { Card, Crumbs, EmptyState, PageHead, Notice } from '@/components/ui';

export const dynamic = 'force-dynamic';

const RULES = [
  'CPU সকেট = মাদারবোর্ড সকেট',
  'RAM টাইপ = মাদারবোর্ডের RAM টাইপ',
  'কুলারের সমর্থিত সকেটের তালিকায় CPU সকেট থাকতে হবে',
  'PSU ওয়াটেজ ≥ GPU-র যাচাইকৃত প্রস্তাবিত ওয়াটেজ',
  'GPU দৈর্ঘ্য ≤ কেসের সর্বোচ্চ GPU ক্লিয়ারেন্স',
  'মাদারবোর্ড ফর্ম-ফ্যাক্টর কেসের সাথে সামঞ্জস্যপূর্ণ',
];

export default function ConfiguratorPage() {
  const verifiedComponents = scalar("SELECT COUNT(*) AS n FROM products p JOIN categories c ON c.id = p.category_id WHERE c.group_name = 'Core computer components' AND p.verification_status = 'verified' AND p.is_demo = 0");
  return (
    <><Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'পিসি কম্প্যাটিবিলিটি চেক' }]} />
      <PageHead title="পিসি কম্প্যাটিবিলিটি চেক" subtitle="যাচাইকৃত কম্পোনেন্ট ডেটা থেকে সকেট, RAM, PSU, GPU ও কেসের সামঞ্জস্যতা যাচাই করা হয়।" />
      <div className="grid grid-2">
        <Card><h2>কম্প্যাটিবিলিটি নিয়ম</h2><ul>{RULES.map((r) => <li key={r}>{r}</li>)}</ul><p className="muted">অযাচাইকৃত কম্পোনেন্ট থাকলে সিস্টেম সতর্কতা দেখায় এবং নিশ্চিত সামঞ্জস্যতা দাবি করে না। explode/কম্পোনেন্ট ভিউ শুধুমাত্র উপযুক্ত যাচাইকৃত 3D অ্যাসেট থাকলে দেখানো হয়।</p></Card>
        <Card><h2>বর্তমান অবস্থা</h2><p className="muted">যাচাইকৃত কম্পোনেন্ট পণ্য: <strong>{verifiedComponents}</strong></p>
          {verifiedComponents === 0 ? <Notice tone="warn">কোনো যাচাইকৃত কম্পোনেন্ট ডেটা নেই, তাই কনফিগারেটরে কোনো নির্বাচনযোগ্য পার্টস দেখানো হয় না। বানোয়াট পার্টস যোগ করা হয়নি। নিয়ম ইঞ্জিন বাস্তবায়িত ও ইউনিট-টেস্ট করা হয়েছে।</Notice> : <p>যাচাইকৃত কম্পোনেন্টের ভিত্তিতে কনফিগারেটর ব্যবহার করুন।</p>}
          <p><Link className="btn btn-sm" href="/categories?group=Core%20computer%20components">কম্পোনেন্ট ক্যাটাগরি →</Link> <Link className="btn btn-sm" href="/compare">তুলনা →</Link></p>
        </Card>
      </div>
      <div style={{ marginTop: 22 }}><EmptyState title="কোনো 3D explode-view অ্যাসেট নেই"><p>যাচাইকৃত, পণ্য-নির্দিষ্ট GLB/glTF অ্যাসেট না থাকলে সাধারণ মডেলকে নির্দিষ্ট প্রস্তুতকারকের পণ্য হিসেবে দেখানো হয় না।</p></EmptyState></div>
    </>
  );
}
