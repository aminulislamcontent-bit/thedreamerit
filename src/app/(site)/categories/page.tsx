import Link from 'next/link';
import { all, scalar } from '@/lib/server/database';
import { CATEGORY_GROUPS } from '@/lib/core/identity';
import { Badge, Card, Crumbs, PageHead, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group } = await searchParams;
  const rows = all<{ id: number; slug: string; name_en: string; group_name: string; is_active: number; spec_template: string; products: number; verified: number }>(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products,
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.verification_status = 'verified' AND p.is_demo = 0) AS verified
     FROM categories c ${group ? 'WHERE c.group_name = ?' : ''} ORDER BY c.sort_order`, group ? [group] : []);
  const active = scalar('SELECT COUNT(*) AS n FROM categories WHERE is_active = 1');
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'ক্যাটাগরি' }]} />
      <PageHead title="ক্যাটাগরি" subtitle={`মোট ${rows.length}টি প্রদর্শিত / ১০৫টি প্রস্তাবিত ক্যাটাগরি। ${active}টি সক্রিয়। ক্যাটাগরি সক্রিয় হলে কমপক্ষে ১৫টি স্বতন্ত্র যাচাইকৃত মডেল বাধ্যতামূলক।`} />
      <div className="tag-list" style={{ marginBottom: 20 }}>
        <Link className="badge badge-info" href="/categories">সব</Link>
        {CATEGORY_GROUPS.map((g) => <Link key={g} className={`badge ${group === g ? 'badge-ok' : ''}`} href={`/categories?group=${encodeURIComponent(g)}`}>{g}</Link>)}
      </div>
      <Table headers={['ক্যাটাগরি', 'গ্রুপ', 'অবস্থা', 'মডেল', 'যাচাইকৃত', 'স্পেসিফিকেশন টেমপ্লেট', '']}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td><Link href={`/categories/${c.slug}`}>{c.name_en}</Link></td>
            <td className="muted">{c.group_name}</td>
            <td>{c.is_active ? <Badge tone="ok">সক্রিয়</Badge> : <Badge>প্রস্তাবিত</Badge>}</td>
            <td>{c.products}</td><td>{c.verified} / 15</td><td><code>{c.spec_template}</code></td>
            <td><Link href={`/products?category=${c.slug}`}>পণ্য →</Link></td>
          </tr>
        ))}
      </Table>
      <Card style={{ marginTop: 20 }}><h3>কেন কোনো ক্যাটাগরি আগে থেকে সক্রিয় নয়?</h3><p className="muted">দোকানে আসলে কোন ক্যাটাগরির পণ্য মজুত আছে তা মালিকের নিশ্চিত তথ্য ছাড়া দাবি করা যায় না। তাই ১০৫টি ক্যাটাগরিকে "প্রস্তাবিত" হিসেবে রাখা হয়েছে; অ্যাডমিন প্যানেল থেকে সক্রিয় করা হলে ১৫-মডেলের শর্ত ও প্রকাশনা গেট স্বয়ংক্রিয়ভাবে প্রযোজ্য হয়।</p></Card>
    </>
  );
}
