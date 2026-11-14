import Link from 'next/link';
import { all } from '@/lib/server/database';
import { createPosOrderAction } from '@/app/actions/orders';
import { CsrfInput } from '@/components/csrf-input';
import { Card, EmptyState, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const published = all<{ id: number; sku: string; model_name: string; price_amount: number | null; price_verified: number; brand_name: string }>(
    `SELECT p.id, p.sku, p.model_name, p.price_amount, p.price_verified, b.name AS brand_name FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.status = 'published' AND p.is_demo = 0`);
  const branches = all<{ id: number; name: string }>('SELECT id, name FROM branches');
  const employees = all<{ id: number; employee_code: string }>('SELECT id, employee_code FROM employees');
  const recent = all<{ id: number; order_number: string; status: string; total_amount: number; channel: string }>("SELECT * FROM orders WHERE channel = 'pos' ORDER BY created_at DESC LIMIT 20");
  const balances = all<{ product_id: number; available: number }>('SELECT product_id, SUM(on_hand - reserved) AS available FROM inventory_balances GROUP BY product_id');
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="পয়েন্ট অব সেল (POS)" subtitle="বারকোড/SKU খোঁজা, গ্রাহক নির্বাচন, মূল্য যাচাই, ছাড় অনুমোদন, পেমেন্ট রেকর্ড, ইনভয়েস, অর্ডার প্রক্রিয়াকরণ, ডেলিভারি, রিটার্ন, রিফান্ড, ওয়ারেন্টি রেজিস্ট্রেশন ও ক্যাশ রিকনসিলিয়েশন।"
        actions={<Link className="btn btn-sm" href="/admin/orders">সব অর্ডার →</Link>} />
      <div className="grid grid-2">
        <Card><h2>নতুন বিক্রয়</h2>
          {published.length ? (
            <form action={createPosOrderAction} className="stack"><CsrfInput />
              <div className="field"><label htmlFor="posProduct">পণ্য / SKU *</label><select id="posProduct" name="productId" required>{published.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.model_name} ({p.brand_name})</option>)}</select></div>
              <div className="form-grid">
                <div className="field"><label htmlFor="posQty">পরিমাণ *</label><input id="posQty" name="quantity" type="number" min="1" defaultValue="1" required /></div>
                <div className="field"><label htmlFor="posBranch">শাখা *</label><select id="posBranch" name="branchId" required>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                <div className="field"><label htmlFor="posEmployee">বিক্রয়কর্মী (অ্যাট্রিবিউশন)</label><select id="posEmployee" name="employeeId"><option value="">—</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.employee_code}</option>)}</select></div>
              </div>
              <button className="btn btn-primary" type="submit">অর্ডার তৈরি করুন</button>
            </form>
          ) : <EmptyState title="POS এ কোনো পণ্য নেই"><p>শুধুমাত্র প্রকাশিত, যাচাইকৃত দামসহ পণ্য POS-এ বিক্রয়যোগ্য। বর্তমানে কোনোটি নেই; কোনো বানোয়াট পণ্য যোগ করা হয়নি। <Link href="/admin/products">পণ্য যোগ/যাচাই →</Link></p></EmptyState>}
          <Notice tone="warn">অর্ডার তৈরি হলেই "paid" হয় না। <Link href="/admin/orders">পেমেন্ট যাচাই পৃষ্ঠায়</Link> যাচাইকৃত পেমেন্ট ইভেন্ট বা অনুমোদিত ক্যাশ রিকনসিলিয়েশন রেকর্ড করতে হয়। মূল্য-ফ্লোরের নিচে ছাড় অনুমোদন ব্যতীত প্রত্যাখ্যাত হয়।</Notice>
        </Card>
        <Card><h2>প্রকাশিত পণ্যের প্রকৃত স্টক</h2>
          {published.length ? <Table headers={['SKU', 'পণ্য', 'যাচাইকৃত দাম', 'যাচাইকৃত স্টক']}>{published.map((p) => <tr key={p.id}><td><code>{p.sku}</code></td><td>{p.model_name}</td><td>{p.price_amount !== null && p.price_verified ? `৳ ${(p.price_amount / 100).toFixed(2)}` : 'নেই'}</td><td>{balances.find((b) => b.product_id === p.id)?.available ?? 0}</td></tr>)}</Table> : <p className="muted">কোনো প্রকাশিত পণ্য নেই।</p>}
          <h3 style={{ marginTop: 16 }}>সাম্প্রতিক POS অর্ডার</h3>{recent.length ? <Table headers={['অর্ডার', 'অবস্থা', 'মোট']}>{recent.map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`}>{o.order_number}</Link></td><td>{o.status}</td><td>৳ {(o.total_amount / 100).toFixed(2)}</td></tr>)}</Table> : <p className="muted">কোনো POS অর্ডার নেই।</p>}
        </Card>
      </div>
    </>
  );
}
