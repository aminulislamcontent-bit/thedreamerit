import Link from 'next/link';
import { all } from '@/lib/server/database';
import { listDrafts, buildVerifiedBundle } from '@/lib/server/content';
import { generateDraftAction, reviewDraftAction } from '@/app/actions/content';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';
import { DRAFT_KINDS } from '@/lib/core/content-rules';

export const dynamic = 'force-dynamic';

export default async function ContentStudioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const products = all<{ id: number; model_name: string }>('SELECT id, model_name FROM products ORDER BY model_name');
  const drafts = listDrafts();
  const revisions = all<{ id: number; draft_id: number; created_at: string }>('SELECT * FROM content_revisions ORDER BY id DESC LIMIT 20');
  const selected = products[0] ? buildVerifiedBundle(products[0].id) : null;
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="AI কনটেন্ট স্টুডিও" subtitle="শুধুমাত্র যাচাইকৃত পণ্য তথ্য থেকে বাংলা/ইংরেজি খসড়া; বৈশিষ্ট্য, টেকনিক্যাল এক্সপ্লেইনার, কেনাকাটার গাইড, তুলনা, SEO টাইটেল/মেটা, সোশ্যাল ক্যাপশন, ভিডিও স্ক্রিপ্ট, ক্যাম্পেইন ও FAQ। মানব পর্যালোচনা ও সংশোধন ইতিহাস বাধ্যতামূলক।" />
      <div className="grid grid-2">
        <Card><h2>নতুন খসড়া তৈরি</h2>
          <form action={generateDraftAction} className="stack"><CsrfInput />
            <div className="form-grid">
              <div className="field"><label htmlFor="draftProduct">পণ্য *</label><select id="draftProduct" name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.model_name}</option>)}</select></div>
              <div className="field"><label htmlFor="draftKind">ধরন *</label><select id="draftKind" name="kind">{DRAFT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
              <div className="field"><label htmlFor="draftLocale">ভাষা *</label><select id="draftLocale" name="locale"><option value="bn">বাংলা</option><option value="en">English</option></select></div>
            </div>
            <button className="btn btn-primary" type="submit">যাচাইকৃত তথ্য থেকে খসড়া তৈরি করুন</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>{process.env.AI_PROVIDER_API_KEY ? 'AI provider key is configured: provider rewording is attempted, then the no-fabrication check runs; failures are recorded as failed jobs and fall back to the verified-field template.' : 'AI_PROVIDER_API_KEY সেট নেই — স্থানীয় verified-field টেমপ্লেট ইঞ্জিন ব্যবহৃত হয় (generated_by=template)। কোনো বাহ্যিক API কল করা হয় না।'}</p>
        </Card>
        <Card><h2>যাচাইকৃত তথ্যের উৎস (নির্বাচিত পণ্য)</h2>
          {selected ? <Table headers={['ক্ষেত্র', 'অবস্থা']}>
            <tr><td>পণ্য / ব্র্যান্ড</td><td>{selected.productName} / {selected.brand}</td></tr>
            <tr><td>যাচাইকৃত স্পেসিফিকেশন</td><td>{selected.verifiedSpecs.length} ({selected.verifiedSpecs.map((s) => s.key).join(', ') || 'নেই'})</td></tr>
            <tr><td>মূল্য</td><td>{selected.priceBdt ?? 'যাচাইকৃত নয় — দাবি করা হবে না'}</td></tr>
            <tr><td>প্রাপ্যতা</td><td>{selected.availability ?? 'ইনভেন্টরি রেকর্ড নেই'}</td></tr>
            <tr><td>ওয়ারেন্টি</td><td>{selected.warranty ?? 'যাচাইকৃত নয়'}</td></tr>
            <tr><td>মিডিয়া</td><td>{selected.mediaTier}</td></tr>
          </Table> : <p className="muted">কোনো পণ্য নেই।</p>}
          <Notice tone="warn">খসড়ায় দাম, স্টক, রেটিং, সার্টিফিকেশন বা পর্যালোচনা উদ্ভাবন করা হয় না; <code>assertNoFabrication</code> চেক ব্যর্থ হলে খসড়া প্রত্যাখ্যাত হয়। বাণিজ্যিকভাবে সংবেদনশীল দাবির জন্য মানব অনুমোদন আবশ্যক।</Notice>
        </Card>
      </div>
      <h2 style={{ marginTop: 24 }}>খসড়া ({drafts.length})</h2>
      {drafts.length ? <Table headers={['পণ্য', 'ধরন / ভাষা', 'উৎপাদক', 'অবস্থা', 'খসড়া', 'অ্যাকশন']}>
        {drafts.map((d) => <tr key={d.id}><td>{d.model_name || '—'}</td><td>{d.kind} / {d.locale}</td><td><Badge tone={d.generated_by === 'ai' ? 'info' : 'muted'}>{d.generated_by}</Badge></td><td><Badge tone={d.status === 'approved' ? 'ok' : 'warn'}>{d.status}</Badge></td>
          <td><details><summary>খসড়া দেখুন</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{d.body}</pre><small>source fields: {d.body.length} chars</small></details></td>
          <td><div className="row"><form action={reviewDraftAction}><CsrfInput /><input type="hidden" name="draftId" value={d.id} /><input type="hidden" name="decision" value="approved" /><button className="btn btn-sm btn-primary" type="submit">অনুমোদন</button></form>
            <form action={reviewDraftAction}><CsrfInput /><input type="hidden" name="draftId" value={d.id} /><input type="hidden" name="decision" value="rejected" /><button className="btn btn-sm" type="submit">প্রত্যাখ্যান</button></form></div></td></tr>)}
      </Table> : <p className="muted">কোনো খসড়া নেই।</p>}
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <Card><h2>সংশোধন ইতিহাস</h2>{revisions.length ? <Table headers={['খসড়া', 'সময়']}>{revisions.map((r) => <tr key={r.id}><td>#{r.draft_id}</td><td>{r.created_at}</td></tr>)}</Table> : <p className="muted">কোনো সংশোধন নেই।</p>}</Card>
        <Card><h2>অনুমোদিত খসড়া → সোশ্যাল</h2><p className="muted">অনুমোদিত খসড়া <Link href="/admin/social">সোশ্যাল পাবলিশিং</Link> পৃষ্ঠায় সময়সূচিতে যোগ করা যায়। প্ল্যাটফর্ম নিশ্চিতকরণ ছাড়া কোনো পোস্ট published হয় না।</p></Card>
      </div>
    </>
  );
}
