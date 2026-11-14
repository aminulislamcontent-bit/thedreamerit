import Link from 'next/link';
import { all } from '@/lib/server/database';
import { getProductById } from '@/lib/server/catalogue';
import { Badge, Crumbs, EmptyState, PageHead, Table } from '@/components/ui';
import { moneyToBdt } from '@/lib/core/identity';

export const dynamic = 'force-dynamic';

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const selected = (ids || '').split(',').map((v) => Number.parseInt(v, 10)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 4);
  const products = selected.map((id) => getProductById(id)).filter((p) => !!p && p.status === 'published');
  const specKeys = [...new Set(products.flatMap((p) => all<{ spec_key: string }>('SELECT spec_key FROM product_specs WHERE product_id = ? AND verified = 1', [p!.id]).map((s) => s.spec_key)))];
  return (
    <>
      <Crumbs items={[{ label: 'হোম', href: '/' }, { label: 'পণ্য তুলনা' }]} />
      <PageHead title="পণ্য তুলনা" subtitle="শুধুমাত্র যাচাইকৃত স্পেসিফিকেশন, যাচাইকৃত দাম, ওয়ারেন্টি ও কনফিগারেশন তুলনা করা হয়। কর্মক্ষমতার কোনো অনুমান বা বানোয়াট দাবি নেই।" />
      {products.length ? (
        <Table headers={['বৈশিষ্ট্য', ...products.map((p) => p!.model_name)]}>
          <tr><td>ব্র্যান্ড</td>{products.map((p) => <td key={p!.id}>{p!.brand_name}</td>)}</tr>
          <tr><td>SKU / MPN</td>{products.map((p) => <td key={p!.id}>{p!.sku} / {p!.mpn || '—'}</td>)}</tr>
          <tr><td>ক্যাটাগরি</td>{products.map((p) => <td key={p!.id}>{p!.category_name}</td>)}</tr>
          <tr><td>যাচাইকৃত দাম</td>{products.map((p) => <td key={p!.id}>{p!.price_amount !== null && p!.price_verified && p!.price_source_url ? `৳ ${moneyToBdt(p!.price_amount)}` : <span className="muted">প্রকাশ করা হয়নি</span>}</td>)}</tr>
          <tr><td>ওয়ারেন্টি</td>{products.map((p) => <td key={p!.id}>{p!.warranty_months !== null && p!.warranty_source_url ? `${p!.warranty_months} মাস` : <span className="muted">যাচাইকৃত নয়</span>}</td>)}</tr>
          <tr><td>মডেল যাচাই</td>{products.map((p) => <td key={p!.id}><Badge tone={p!.verification_status === 'verified' ? 'ok' : 'warn'}>{p!.verification_status}</Badge></td>)}</tr>
          {specKeys.map((key) => (
            <tr key={key}><td>{key}</td>{products.map((p) => {
              const s = all<{ spec_value: string; unit: string }>('SELECT spec_value, unit FROM product_specs WHERE product_id = ? AND spec_key = ? AND verified = 1 AND source_url <> ""', [p!.id, key])[0];
              return <td key={p!.id}>{s ? `${s.spec_value}${s.unit ? ` ${s.unit}` : ''}` : <span className="muted">যাচাইকৃত তথ্য নেই</span>}</td>;
            })}</tr>
          ))}
          <tr><td>বিস্তারিত</td>{products.map((p) => <td key={p!.id}><Link href={`/products/${p!.slug}`}>পৃষ্ঠা →</Link></td>)}</tr>
        </Table>
      ) : <EmptyState title="তুলনার জন্য কোনো প্রকাশিত পণ্য নির্বাচন করা হয়নি"><p>পণ্য পৃষ্ঠা থেকে “⇄ তুলনা করুন” ব্যবহার করুন, অথবা <code>/compare?ids=1,2</code> ফরম্যাটে আইডি দিন। বর্তমানে কোনো যাচাইকৃত পণ্য প্রকাশিত নেই।</p><Link className="btn btn-sm" href="/products">পণ্য দেখুন →</Link></EmptyState>}
    </>
  );
}
