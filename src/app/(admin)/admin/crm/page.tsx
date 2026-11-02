import Link from 'next/link';
import { all } from '@/lib/server/database';
import { createLeadAction, createTicketAction, recordConsentAction } from '@/app/actions/content';
import { CsrfInput } from '@/components/csrf-input';
import { Card, PageHead, PageNotices, Table, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CrmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const customers = all<{ id: number; name: string; phone: string; email: string; consent_marketing: number; created_at: string }>('SELECT * FROM customers ORDER BY id DESC');
  const leads = all<{ id: number; name: string; source: string; status: string; consent_verified: number }>('SELECT * FROM leads ORDER BY id DESC');
  const tickets = all<{ id: number; subject: string; status: string; priority: string }>('SELECT * FROM support_tickets ORDER BY id DESC');
  const followups = all<{ id: number; note: string; status: string; due_at: string | null }>('SELECT * FROM follow_up_tasks');
  const communications = all<{ id: number; channel: string; summary: string; consent_verified: number }>('SELECT * FROM communications ORDER BY id DESC');
  const consent = all<{ id: number; customer_id: number; kind: string; granted: number; source: string }>('SELECT * FROM consent_records ORDER BY id DESC');
  const segments = all<{ id: number; name: string }>('SELECT * FROM segments');
  const warranties = all<{ id: number; order_id: number; status: string }>('SELECT * FROM warranty_claims');
  const returns = all<{ id: number; order_id: number; status: string }>('SELECT * FROM return_requests');
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="CRM ও গ্রাহক সহায়তা" subtitle="গ্রাহক প্রোফাইল, লিড, জিজ্ঞাসা, ক্রয় ইতিহাস, সাপোর্ট টিকেট, ফলো-আপ, যোগাযোগ রেকর্ড, সেগমেন্টেশন, সম্মতি, ওয়ারেন্টি ও রিটার্ন ইতিহাস, মার্কেটিং পছন্দ। শাখা-ভেদে অননুমোদিত অ্যাক্সেস RBAC দ্বারা ব্লক।" />
      <div className="grid grid-4"><Stat label="গ্রাহক" value={customers.length} /><Stat label="লিড" value={leads.length} /><Stat label="সাপোর্ট টিকেট" value={tickets.length} /><Stat label="সম্মতি রেকর্ড" value={consent.length} /></div>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <Card><h2>নতুন লিড</h2><form action={createLeadAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="leadName">নাম *</label><input id="leadName" name="name" required /></div>
          <div className="field"><label htmlFor="leadPhone">ফোন</label><input id="leadPhone" name="phone" /></div>
          <div className="field"><label htmlFor="leadEmail">ইমেইল</label><input id="leadEmail" name="email" type="email" /></div>
          <div className="field"><label htmlFor="leadSource">উৎস</label><input id="leadSource" name="source" /></div>
          <button className="btn btn-sm btn-primary" type="submit">লিড রেকর্ড করুন</button>
        </form><p className="muted" style={{ fontSize: '.8rem' }}>মার্কেটিং সম্মতি কখনো ধরে নেওয়া হয় না।</p></Card>
        <Card><h2>সাপোর্ট টিকেট</h2><form action={createTicketAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="ticketCustomer">গ্রাহক</label><select id="ticketCustomer" name="customerId"><option value="">—</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label htmlFor="ticketSubject">বিষয় *</label><input id="ticketSubject" name="subject" required /></div>
          <div className="field"><label htmlFor="ticketBody">বিস্তারিত</label><textarea id="ticketBody" name="body" rows={3} /></div>
          <div className="field"><label htmlFor="ticketPriority">অগ্রাধিকার</label><select id="ticketPriority" name="priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          <button className="btn btn-sm btn-primary" type="submit">টিকেট তৈরি করুন</button>
        </form></Card>
        <Card><h2>সম্মতি রেকর্ড</h2><form action={recordConsentAction} className="stack"><CsrfInput />
          <div className="field"><label htmlFor="consentCustomer">গ্রাহক *</label><select id="consentCustomer" name="customerId" required><option value="">নির্বাচন করুন</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label htmlFor="consentKind">ধরন</label><input id="consentKind" name="kind" defaultValue="marketing" /></div>
          <div className="field"><label htmlFor="consentGranted">অবস্থা</label><select id="consentGranted" name="granted"><option value="1">সম্মতি দিয়েছেন</option><option value="0">সম্মতি প্রত্যাহার</option></select></div>
          <div className="field"><label htmlFor="consentSource">উৎস</label><input id="consentSource" name="source" defaultValue="in-person" /></div>
          <button className="btn btn-sm" type="submit">রেকর্ড করুন</button>
        </form></Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <Card><h2>গ্রাহক</h2>{customers.length ? <Table headers={['নাম', 'ফোন', 'ইমেইল', 'সম্মতি', 'তারিখ']}>{customers.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.phone || '—'}</td><td>{c.email || '—'}</td><td>{c.consent_marketing ? 'হ্যাঁ' : 'না'}</td><td className="muted">{c.created_at}</td></tr>)}</Table> : <p className="muted">কোনো গ্রাহক রেকর্ড নেই।</p>}
          <h3 style={{ marginTop: 14 }}>লিড</h3>{leads.length ? <Table headers={['নাম', 'উৎস', 'অবস্থা', 'সম্মতি যাচাই']}>{leads.map((l) => <tr key={l.id}><td>{l.name}</td><td>{l.source || '—'}</td><td>{l.status}</td><td>{l.consent_verified ? 'হ্যাঁ' : 'না'}</td></tr>)}</Table> : <p className="muted">কোনো লিড নেই।</p>}</Card>
        <Card><h2>টিকেট / ফলো-আপ / যোগাযোগ</h2>{tickets.length ? <Table headers={['বিষয়', 'অগ্রাধিকার', 'অবস্থা']}>{tickets.map((t) => <tr key={t.id}><td>{t.subject}</td><td>{t.priority}</td><td>{t.status}</td></tr>)}</Table> : <p className="muted">কোনো টিকেট নেই।</p>}
          <h3 style={{ marginTop: 14 }}>সেগমেন্ট / ওয়ারেন্টি / রিটার্ন</h3><p className="muted">সেগমেন্ট {segments.length} · ওয়ারেন্টি দাবি {warranties.length} · রিটার্ন {returns.length} · ফলো-আপ {followups.length} · যোগাযোগ রেকর্ড {communications.length}</p>
          <p style={{ marginTop: 12 }}><Link className="btn btn-sm" href="/admin/orders">ক্রয় ইতিহাস ও অর্ডার →</Link></p>
        </Card>
      </div>
    </>
  );
}
