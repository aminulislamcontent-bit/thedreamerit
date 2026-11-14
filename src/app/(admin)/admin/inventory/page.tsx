import Link from 'next/link';
import { all } from '@/lib/server/database';
import { getBalances, lowStockItems } from '@/lib/server/inventory';
import { adjustStockAction, receiveStockAction, setReorderThresholdAction, transferStockAction } from '@/app/actions/operations';
import { CsrfInput } from '@/components/csrf-input';
import { Card, Notice, PageHead, PageNotices, Table, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const balances = getBalances();
  const low = lowStockItems();
  const products = all<{ id: number; model_name: string; sku: string }>('SELECT id, model_name, sku FROM products ORDER BY model_name');
  const warehouses = all<{ id: number; name: string }>('SELECT id, name FROM warehouses');
  const pos = all<{ id: number; po_number: string }>('SELECT id, po_number FROM purchase_orders ORDER BY created_at DESC');
  const units = balances.reduce((s, b) => s + Number(b.on_hand), 0);
  const reserved = balances.reduce((s, b) => s + Number(b.reserved), 0);
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="ইনভেন্টরি, শাখা ও লজিস্টিকস" subtitle="একাধিক শাখা/গুদাম, স্টক ব্যালেন্স, রিজার্ভেশন, পণ্য গ্রহণ, ব্রাঞ্চ ট্রান্সফার, ডিসপ্যাচ/রিসিপ্ট নিশ্চিতকরণ, সিরিয়াল, ওয়ারেন্টি, ক্ষতিগ্রস্ত পণ্য, পুনরায় অর্ডার থ্রেশহোল্ড ও মুভমেন্ট হিস্টোরি।" />
      <div className="grid grid-4">
        <Stat label="মোট ইউনিট (প্রকৃত রেকর্ড)" value={units} hint="কোনো স্টক উদ্ভাবন করা হয়নি" />
        <Stat label="রিজার্ভড" value={reserved} hint="BEGIN IMMEDIATE দ্বারা ওভারসেল প্রতিরোধ" />
        <Stat label="ব্যালেন্স রেকর্ড" value={balances.length} />
        <Stat label="লো-স্টক সতর্কতা" value={low.length} tone={low.length ? 'warn' : 'ok'} />
      </div>
      {balances.length === 0 ? <Notice tone="warn">কোনো ইনভেন্টরি ব্যালেন্স নেই। পণ্য গ্রহণ (goods receiving) রেকর্ড করলেই স্টক তৈরি হয়; সিস্টেম কখনোই স্টক অনুমান করে না।</Notice> : null}
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <Card><h2>পণ্য গ্রহণ</h2><form action={receiveStockAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="receiveProduct">পণ্য *</label><select id="receiveProduct" name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.model_name} ({p.sku})</option>)}</select></div>
          <div className="field"><label htmlFor="receiveWarehouse">গুদাম *</label><select id="receiveWarehouse" name="warehouseId" required>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="field"><label htmlFor="receiveQty">পরিমাণ *</label><input id="receiveQty" name="quantity" type="number" min="1" required /></div>
          <div className="field"><label htmlFor="receiveCost">ইউনিট landed cost (BDT)</label><input id="receiveCost" name="unitCostBdt" type="number" step="0.01" min="0" defaultValue="0" /></div>
          <div className="field"><label htmlFor="receivePo">ক্রয় অর্ডার (ঐচ্ছিক)</label><select id="receivePo" name="poId"><option value="">—</option>{pos.map((p) => <option key={p.id} value={p.id}>{p.po_number}</option>)}</select></div>
          <div className="field"><label htmlFor="serials">সিরিয়াল নাম্বার (কমা/নিউলাইন)</label><textarea id="serials" name="serials" rows={2} /></div>
          <button className="btn btn-primary btn-sm" type="submit">গ্রহণ রেকর্ড করুন</button>
        </form></Card>
        <Card><h2>শাখা ট্রান্সফার</h2><form action={transferStockAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="transferProduct">পণ্য *</label><select id="transferProduct" name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.model_name}</option>)}</select></div>
          <div className="field"><label htmlFor="fromW">থেকে *</label><select id="fromW" name="fromWarehouseId" required>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="field"><label htmlFor="toW">তে *</label><select id="toW" name="toWarehouseId" required>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="field"><label htmlFor="transferQty">পরিমাণ *</label><input id="transferQty" name="quantity" type="number" min="1" required /></div>
          <button className="btn btn-sm btn-primary" type="submit">ট্রান্সফার</button>
        </form></Card>
        <Card><h2>স্টক অ্যাডজাস্টমেন্ট</h2><form action={adjustStockAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="adjustProduct">পণ্য *</label><select id="adjustProduct" name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.model_name}</option>)}</select></div>
          <div className="field"><label htmlFor="adjustW">গুদাম *</label><select id="adjustW" name="warehouseId" required>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div className="field"><label htmlFor="adjustQty">স্বাক্ষরযুক্ত পরিমাণ (±)</label><input id="adjustQty" name="quantity" type="number" required /></div>
          <div className="field"><label htmlFor="adjustReason">কারণ *</label><input id="adjustReason" name="reason" required /></div>
          <button className="btn btn-sm" type="submit">অ্যাডজাস্ট</button>
        </form>
          <hr /><h3>লো-স্টক</h3>{low.length ? <ul>{low.map((l, i) => <li key={i}>{l.product_name} @ {l.warehouse}: {l.available} (থ্রেশহোল্ড {l.reorder_threshold})</li>)}</ul> : <p className="muted">কোনো সতর্কতা নেই।</p>}
        </Card>
      </div>
      <h2 style={{ marginTop: 24 }}>স্টক ব্যালেন্স</h2>
      {balances.length ? <Table headers={['পণ্য', 'SKU', 'শাখা / গুদাম', 'On hand', 'Reserved', 'Available', 'Reorder threshold', '']}>
        {balances.map((b) => <tr key={b.id}><td>{b.product_name}</td><td><code>{b.sku}</code></td><td>{b.branch} / {b.warehouse}</td><td>{b.on_hand}</td><td>{b.reserved}</td><td><strong>{b.available}</strong></td><td>{b.reorder_threshold}</td>
          <td><form action={setReorderThresholdAction} className="inline-form"><CsrfInput /><input type="hidden" name="balanceId" value={b.id} /><input type="hidden" name="threshold" value={Number(b.reorder_threshold) || 3} /><button className="btn btn-sm" type="submit">থ্রেশহোল্ড ৩</button></form></td></tr>)}
      </Table> : <p className="muted">কোনো ব্যালেন্স নেই।</p>}
      <h2 style={{ marginTop: 24 }}>স্টক মুভমেন্ট হিস্টোরি</h2>
      <Table headers={['সময়', 'ধরন', 'পরিমাণ', 'রেফারেন্স', 'নোট']}>
        {all<{ id: number; created_at: string; kind: string; quantity: number; reference_type: string; note: string }>('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 50').map((m) => <tr key={m.id}><td className="muted">{m.created_at}</td><td>{m.kind}</td><td>{m.quantity}</td><td>{m.reference_type}</td><td className="muted">{m.note}</td></tr>)}
      </Table>
      <p className="muted" style={{ marginTop: 12 }}>ইনভেন্টরি ভ্যালুয়েশন ও সিরিয়াল/ওয়ারেন্টি ট্র্যাকিং: <Link href="/admin/operations">অপারেশনস →</Link></p>
    </>
  );
}
