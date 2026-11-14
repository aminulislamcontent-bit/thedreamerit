import Link from 'next/link';
import { all } from '@/lib/server/database';
import { createBranchAction, createPurchaseOrderAction, createSupplierAction, createSupplierInvoiceAction, createWarehouseAction } from '@/app/actions/operations';
import { CsrfInput } from '@/components/csrf-input';
import { Card, Notice, PageHead, PageNotices, Table, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function OperationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const branches = all<{ id: number; code: string; name: string; address: string; phone: string }>('SELECT * FROM branches ORDER BY id');
  const warehouses = all<{ id: number; code: string; name: string; branch_id: number }>('SELECT * FROM warehouses ORDER BY id');
  const suppliers = all<{ id: number; name: string; phone: string; status: string }>('SELECT * FROM suppliers ORDER BY id');
  const pos = all<{ id: number; po_number: string; status: string; created_at: string }>('SELECT * FROM purchase_orders ORDER BY created_at DESC');
  const invoices = all<{ id: number; invoice_number: string; amount: number; paid_amount: number; status: string }>('SELECT * FROM supplier_invoices ORDER BY id DESC');
  const products = all<{ id: number; model_name: string }>('SELECT id, model_name FROM products ORDER BY model_name');
  const valuation = all<{ product_name: string; units: number; cost: number }>(`SELECT p.model_name AS product_name, SUM(ib.on_hand) AS units, SUM(ib.on_hand * COALESCE((SELECT MAX(unit_cost) FROM purchase_order_items poi WHERE poi.product_id = ib.product_id),0)) AS cost FROM inventory_balances ib JOIN products p ON p.id = ib.product_id GROUP BY p.id`);
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="শাখা, গুদাম, সরবরাহকারী ও ক্রয়" subtitle="ক্রয় অর্ডার, সরবরাহকারী ইনভয়েস, landed cost, বকেয়া ব্যালেন্স, ইনভেন্টরি ভ্যালুয়েশন ও পেমেন্ট — কোনো বানোয়াট ক্রয় বা পেমেন্ট রেকর্ড নেই।" />
      <div className="grid grid-4">
        <Stat label="শাখা" value={branches.length} /><Stat label="গুদাম" value={warehouses.length} /><Stat label="সরবরাহকারী" value={suppliers.length} /><Stat label="ক্রয় অর্ডার" value={pos.length} />
      </div>
      <Notice tone="warn">শাখা ১০৪ ও ১০৫-এর ঠিকানা মালিক-প্রদত্ত তথ্য থেকে এসেছে; অন্য কোনো শাখা বা স্টক দাবি করা হয়নি। নতুন শাখা/গুদাম তৈরি হলে স্টক শূন্য থাকে।</Notice>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <Card><h2>নতুন শাখা</h2><form action={createBranchAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="branchCode">কোড *</label><input id="branchCode" name="code" required /></div>
          <div className="field"><label htmlFor="branchName">নাম *</label><input id="branchName" name="name" required /></div>
          <div className="field"><label htmlFor="branchAddress">ঠিকানা</label><input id="branchAddress" name="address" /></div>
          <div className="field"><label htmlFor="branchPhone">ফোন</label><input id="branchPhone" name="phone" /></div>
          <button className="btn btn-sm btn-primary" type="submit">শাখা যোগ করুন</button>
        </form>
          <hr /><h3>নতুন গুদাম</h3><form action={createWarehouseAction} className="stack"><CsrfInput />
            <div className="field"><label htmlFor="warehouseCode">কোড *</label><input id="warehouseCode" name="code" required /></div>
            <div className="field"><label htmlFor="warehouseName">নাম</label><input id="warehouseName" name="name" /></div>
            <div className="field"><label htmlFor="warehouseBranch">শাখা *</label><select id="warehouseBranch" name="branchId" required>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <button className="btn btn-sm" type="submit">গুদাম যোগ করুন</button>
          </form>
        </Card>
        <Card><h2>নতুন সরবরাহকারী</h2><form action={createSupplierAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="supplierName">নাম *</label><input id="supplierName" name="name" required /></div>
          <div className="field"><label htmlFor="supplierContact">যোগাযোগ ব্যক্তি</label><input id="supplierContact" name="contact" /></div>
          <div className="field"><label htmlFor="supplierPhone">ফোন</label><input id="supplierPhone" name="phone" /></div>
          <div className="field"><label htmlFor="supplierEmail">ইমেইল</label><input id="supplierEmail" name="email" type="email" /></div>
          <div className="field"><label htmlFor="supplierTerms">পেমেন্ট শর্ত</label><input id="supplierTerms" name="terms" /></div>
          <button className="btn btn-sm btn-primary" type="submit">সরবরাহকারী যোগ করুন</button>
        </form></Card>
        <Card><h2>ক্রয় অর্ডার</h2><form action={createPurchaseOrderAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="poSupplier">সরবরাহকারী *</label><select id="poSupplier" name="supplierId" required><option value="">নির্বাচন করুন</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="field"><label htmlFor="poProduct">পণ্য *</label><select id="poProduct" name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.model_name}</option>)}</select></div>
          <div className="field"><label htmlFor="poBranch">শাখা *</label><select id="poBranch" name="branchId" required>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="field"><label htmlFor="poQty">পরিমাণ *</label><input id="poQty" name="quantity" type="number" min="1" required /></div>
          <div className="field"><label htmlFor="poCost">ইউনিট কস্ট (BDT)</label><input id="poCost" name="unitCostBdt" type="number" step="0.01" min="0" defaultValue="0" /></div>
          <button className="btn btn-sm btn-primary" type="submit">খসড়া PO তৈরি করুন</button>
        </form>
          <hr /><h3>সরবরাহকারী ইনভয়েস</h3><form action={createSupplierInvoiceAction} className="stack"><CsrfInput />
            <div className="field"><label htmlFor="invPo">PO *</label><select id="invPo" name="poId" required><option value="">নির্বাচন করুন</option>{pos.map((p) => <option key={p.id} value={p.id}>{p.po_number}</option>)}</select></div>
            <div className="field"><label htmlFor="invNumber">ইনভয়েস নম্বর *</label><input id="invNumber" name="invoiceNumber" required /></div>
            <div className="field"><label htmlFor="invAmount">অঙ্ক (BDT)</label><input id="invAmount" name="amountBdt" type="number" step="0.01" min="0" required /></div>
            <button className="btn btn-sm" type="submit">ইনভয়েস রেকর্ড করুন</button>
          </form>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card><h2>শাখা / গুদাম</h2><Table headers={['কোড', 'নাম', 'ঠিকানা / ফোন']}>{branches.map((b) => <tr key={b.id}><td>{b.code}</td><td>{b.name}</td><td className="muted">{b.address || '—'} / {b.phone || '—'}</td></tr>)}</Table>
          <h3 style={{ marginTop: 14 }}>গুদাম</h3><Table headers={['কোড', 'নাম', 'শাখা']}>{warehouses.map((w) => <tr key={w.id}><td>{w.code}</td><td>{w.name}</td><td>{branches.find((b) => b.id === w.branch_id)?.name ?? '—'}</td></tr>)}</Table></Card>
        <Card><h2>ক্রয় অর্ডার ও বকেয়া</h2>{pos.length ? <Table headers={['PO', 'অবস্থা', 'তারিখ']}>{pos.map((p) => <tr key={p.id}><td>{p.po_number}</td><td>{p.status}</td><td>{p.created_at}</td></tr>)}</Table> : <p className="muted">কোনো ক্রয় অর্ডার নেই।</p>}
          <h3 style={{ marginTop: 14 }}>ইনভয়েস</h3>{invoices.length ? <Table headers={['নম্বর', 'অঙ্ক', 'পরিশোধিত', 'বকেয়া']}>{invoices.map((i) => <tr key={i.id}><td>{i.invoice_number}</td><td>৳ {(i.amount / 100).toFixed(2)}</td><td>৳ {(i.paid_amount / 100).toFixed(2)}</td><td>৳ {((i.amount - i.paid_amount) / 100).toFixed(2)}</td></tr>)}</Table> : <p className="muted">কোনো ইনভয়েস নেই।</p>}
        </Card>
      </div>
      <Card style={{ marginTop: 18 }}><h2>ইনভেন্টরি ভ্যালুয়েশন</h2>{valuation.length ? <Table headers={['পণ্য', 'ইউনিট', 'রেকর্ডকৃত কস্ট ভিত্তিক মূল্য']}>{valuation.map((v) => <tr key={v.product_name}><td>{v.product_name}</td><td>{v.units}</td><td>৳ {(Number(v.cost) / 100).toFixed(2)}</td></tr>)}</Table> : <p className="muted">কোনো ইনভেন্টরি নেই — মূল্যায়ন শূন্য।</p>}
        <p className="muted" style={{ fontSize: '.82rem' }}>কস্ট শুধুমাত্র রেকর্ডকৃত ক্রয় ইউনিট কস্ট থেকে; কোনো অনুমান নেই। <Link href="/admin/inventory">ইনভেন্টরি →</Link></p>
      </Card>
    </>
  );
}
