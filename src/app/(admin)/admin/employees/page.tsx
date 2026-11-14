import Link from 'next/link';
import { all } from '@/lib/server/database';
import { createEmployeeAction, exportPayrollAction, recordAttendanceAction, updateCommissionRuleAction } from '@/app/actions/orders';
import { CsrfInput } from '@/components/csrf-input';
import { Card, Notice, PageHead, PageNotices, Table, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const employees = all<{ id: number; employee_code: string; department: string; designation: string; status: string }>('SELECT * FROM employees ORDER BY id');
  const attendance = all<{ id: number; employee_id: number; business_date: string; status: string }>('SELECT * FROM attendance ORDER BY business_date DESC LIMIT 20');
  const rules = all<{ id: number; name: string; basis: string; rate_bps: number; flat_amount: number; min_margin_bps: number; active: number }>('SELECT * FROM commission_rules ORDER BY id');
  const records = all<{ id: number; employee_id: number; order_id: number; commission_amount: number; status: string }>('SELECT * FROM commission_records ORDER BY id DESC LIMIT 30');
  const targets = all<{ id: number; employee_id: number; period: string; target_amount: number; achieved_amount: number }>('SELECT * FROM performance_targets');
  const exports = all<{ id: number; period: string; created_at: string }>('SELECT * FROM payroll_exports ORDER BY id DESC');
  const branches = all<{ id: number; name: string }>('SELECT id, name FROM branches');
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="কর্মচারী, এইচআর ও কমিশন" subtitle="কর্মচারী আইডি, বিভাগ, শাখা, উপস্থিতি, শিফট, ছুটি, লক্ষ্য, বিক্রয় অ্যাট্রিবিউশন, কনফিগারেবল কমিশন, পেরোল রপ্তানি ও পারফরম্যান্স রিপোর্ট। সংবেদনশীল তথ্য কঠোর RBAC-এর আওতায়।" />
      <div className="grid grid-4"><Stat label="কর্মচারী" value={employees.length} /><Stat label="কমিশন নিয়ম" value={rules.length} /><Stat label="কমিশন রেকর্ড" value={records.length} /><Stat label="পেরোল এক্সপোর্ট" value={exports.length} /></div>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <Card><h2>নতুন কর্মচারী</h2><form action={createEmployeeAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="employeeCode">কর্মচারী কোড *</label><input id="employeeCode" name="employeeCode" required /></div>
          <div className="field"><label htmlFor="department">বিভাগ</label><input id="department" name="department" /></div>
          <div className="field"><label htmlFor="designation">পদবি</label><input id="designation" name="designation" /></div>
          <div className="field"><label htmlFor="empBranch">শাখা</label><select id="empBranch" name="branchId">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <button className="btn btn-sm btn-primary" type="submit">যোগ করুন</button>
        </form></Card>
        <Card><h2>উপস্থিতি</h2><form action={recordAttendanceAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="attEmployee">কর্মচারী *</label><select id="attEmployee" name="employeeId" required>{employees.map((e) => <option key={e.id} value={e.id}>{e.employee_code}</option>)}</select></div>
          <div className="field"><label htmlFor="attDate">তারিখ</label><input id="attDate" name="date" type="date" /></div>
          <button className="btn btn-sm" type="submit">উপস্থিতি রেকর্ড করুন</button>
        </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>শিফট: {all<{ name: string; starts_at: string; ends_at: string }>('SELECT * FROM shifts').map((s) => `${s.name} ${s.starts_at}–${s.ends_at}`).join(', ') || 'নেই'}। ছুটি ও ব্যক্তিগত/স্বাস্থ্য তথ্য আলাদা অনুমতির আওতায়।</p>
        </Card>
        <Card><h2>কমিশন নিয়ম</h2>{rules.map((r) => <p key={r.id} className="muted">{r.name}: {r.basis} · {r.rate_bps} bps · সর্বনিম্ন মার্জিন {r.min_margin_bps} bps · {r.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</p>)}
          <form action={updateCommissionRuleAction} className="stack"><CsrfInput /><input type="hidden" name="ruleId" value={rules[0]?.id ?? ''} />
            <div className="form-grid">
              <div className="field"><label htmlFor="ruleName">নাম</label><input id="ruleName" name="name" defaultValue={rules[0]?.name ?? 'Margin share'} required /></div>
              <div className="field"><label htmlFor="basis">ভিত্তি</label><select id="basis" name="basis" defaultValue={rules[0]?.basis ?? 'line_margin'}><option value="line_margin">লাইন মার্জিন</option><option value="revenue">রাজস্ব</option><option value="flat_per_unit">প্রতি ইউনিট ফ্ল্যাট</option></select></div>
              <div className="field"><label htmlFor="rateBps">হার (bps)</label><input id="rateBps" name="rateBps" type="number" min="0" defaultValue={rules[0]?.rate_bps ?? 500} /></div>
              <div className="field"><label htmlFor="flatBdt">ফ্ল্যাট (BDT)</label><input id="flatBdt" name="flatBdt" type="number" step="0.01" defaultValue="0" /></div>
              <div className="field"><label htmlFor="minMarginBps">সর্বনিম্ন মার্জিন (bps)</label><input id="minMarginBps" name="minMarginBps" type="number" min="0" defaultValue={rules[0]?.min_margin_bps ?? 0} /></div>
            </div>
            <button className="btn btn-sm btn-primary" type="submit">নিয়ম সংরক্ষণ</button>
          </form>
          <Notice>বাতিল, রিটার্ন ও রিফান্ডের ক্ষেত্রে অ্যাক্রুয়াল স্বয়ংক্রিয়ভাবে <code>reversed</code> হয়; split অ্যাট্রিবিউশন share_bps অনুযায়ী ভাগ হয়।</Notice>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card><h2>কর্মচারী তালিকা</h2><Table headers={['কোড', 'বিভাগ', 'পদবি', 'অবস্থা']}>{employees.map((e) => <tr key={e.id}><td>{e.employee_code}</td><td>{e.department || '—'}</td><td>{e.designation || '—'}</td><td>{e.status}</td></tr>)}</Table>
          <h3 style={{ marginTop: 14 }}>উপস্থিতি</h3>{attendance.length ? <Table headers={['কর্মচারী', 'তারিখ', 'অবস্থা']}>{attendance.map((a) => <tr key={a.id}><td>#{a.employee_id}</td><td>{a.business_date}</td><td>{a.status}</td></tr>)}</Table> : <p className="muted">কোনো উপস্থিতি রেকর্ড নেই।</p>}</Card>
        <Card><h2>কমিশন ও পেরোল</h2>{records.length ? <Table headers={['কর্মচারী', 'অর্ডার', 'অঙ্ক', 'অবস্থা']}>{records.map((r) => <tr key={r.id}><td>#{r.employee_id}</td><td>#{r.order_id}</td><td>৳ {(r.commission_amount / 100).toFixed(2)}</td><td>{r.status}</td></tr>)}</Table> : <p className="muted">কোনো কমিশন নেই।</p>}
          <form action={exportPayrollAction} className="inline-form" style={{ marginTop: 14 }}><CsrfInput />
            <div className="field"><label htmlFor="period">পিরিয়ড (YYYY-MM)</label><input id="period" name="period" required placeholder="2026-11" /></div><button className="btn btn-sm" type="submit">পেরোল রপ্তানি</button>
          </form>
          {exports.length ? <p className="muted" style={{ marginTop: 10 }}>রপ্তানি: {exports.map((e) => e.period).join(', ')}</p> : null}
          <h3 style={{ marginTop: 14 }}>পারফরম্যান্স লক্ষ্য</h3>{targets.length ? <Table headers={['কর্মচারী', 'পিরিয়ড', 'লক্ষ্য', 'অর্জিত']}>{targets.map((t) => <tr key={t.id}><td>#{t.employee_id}</td><td>{t.period}</td><td>৳ {(t.target_amount / 100).toFixed(2)}</td><td>৳ {(t.achieved_amount / 100).toFixed(2)}</td></tr>)}</Table> : <p className="muted">কোনো লক্ষ্য নির্ধারিত হয়নি।</p>}
          <p style={{ marginTop: 12 }}><Link className="btn btn-sm" href="/admin/security">অ্যাক্সেস নিয়ন্ত্রণ →</Link></p>
        </Card>
      </div>
    </>
  );
}
