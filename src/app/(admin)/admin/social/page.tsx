import Link from 'next/link';
import { all } from '@/lib/server/database';
import { listJobs } from '@/lib/server/social';
import { approveJobAction, confirmPublicationAction, createPublishingJobAction, submitJobAction } from '@/app/actions/content';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Table } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SocialPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const channels = all<{ platform: string; status: string; credential_ref: string }>('SELECT * FROM social_channels');
  const drafts = all<{ id: number; kind: string; locale: string }>("SELECT id, kind, locale FROM content_drafts WHERE status = 'approved'");
  const jobs = listJobs();
  const campaigns = all<{ id: number; name: string; status: string }>('SELECT * FROM campaigns');
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="সোশ্যাল মিডিয়া ও মার্কেটিং অটোমেশন" subtitle="অনুমোদিত চ্যানেলের জন্য কনটেন্ট ক্যালেন্ডার, AI খসড়া, মিডিয়া রিভিউ, মানব অনুমোদন, সময়সূচি, প্রকাশনার অবস্থা, ব্যর্থতার বিজ্ঞপ্তি ও ক্যাম্পেইন রিপোর্ট।" />
      <Notice tone="danger"><strong>কোনো চ্যানেল সংযুক্ত নেই।</strong> Facebook Pages, Instagram Graph, YouTube Data ও WhatsApp Business Cloud API-র জন্য মালিকের অনুমোদিত অ্যাকাউন্ট/টোকেন প্রয়োজন। ক্রেডেনশিয়াল ছাড়া সাবমিশন <code>failed</code> হয় এবং <code>failed_jobs</code>-এ রেকর্ড হয় — কখনোই পোস্টকে published বলা হয় না।</Notice>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <Card><h2>চ্যানেল অবস্থা</h2><Table headers={['প্ল্যাটফর্ম', 'অবস্থা', 'প্রয়োজনীয় ক্রেডেনশিয়াল']}>
          {channels.map((c) => <tr key={c.platform}><td>{c.platform}</td><td><Badge tone={c.status === 'connected' ? 'ok' : 'warn'}>{c.status}</Badge></td><td className="muted">{c.platform === 'facebook' ? 'FACEBOOK_PAGE_TOKEN' : c.platform === 'instagram' ? 'INSTAGRAM_BUSINESS_TOKEN' : c.platform === 'youtube' ? 'YOUTUBE_API_KEY' : 'WHATSAPP_BUSINESS_TOKEN'}</td></tr>)}
        </Table></Card>
        <Card><h2>নতুন পাবলিশিং জব</h2><p className="muted">অনুমোদিত খসড়া: {drafts.length} · ক্যাম্পেইন: {campaigns.length}</p>
          <form action={createPublishingJobAction} className="stack"><CsrfInput />
            <div className="form-grid">
              <div className="field"><label htmlFor="platform">প্ল্যাটফর্ম *</label><select id="platform" name="platform"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="whatsapp">WhatsApp</option></select></div>
              <div className="field"><label htmlFor="draftId">অনুমোদিত খসড়া *</label><select id="draftId" name="draftId" required><option value="">নির্বাচন করুন</option>{drafts.map((d) => <option key={d.id} value={d.id}>#{d.id} {d.kind} ({d.locale})</option>)}</select></div>
              <div className="field"><label htmlFor="scheduledAt">সময়সূচি</label><input id="scheduledAt" name="scheduledAt" type="datetime-local" /></div>
            </div>
            <button className="btn btn-primary btn-sm" type="submit">মানব অনুমোদনের জন্য জব তৈরি করুন</button>
          </form>
          <p className="muted" style={{ fontSize: '.8rem' }}>কোনো প্ল্যাটফর্ম নিশ্চিতকরণ ছাড়া ক্লিক/কনভার্সন রিপোর্ট দাবি করা হয় না।</p>
        </Card>
      </div>
      <h2 style={{ marginTop: 24 }}>পাবলিশিং জব ({jobs.length})</h2>
      {jobs.length ? <Table headers={['প্ল্যাটফর্ম', 'অবস্থা', 'সময়সূচি', 'পোস্ট আইডি', 'কারণ', 'অ্যাকশন']}>
        {jobs.map((j) => <tr key={Number(j.id)}><td>{String(j.platform)}</td><td><Badge tone={j.status === 'published' ? 'ok' : j.status === 'failed' ? 'danger' : 'warn'}>{String(j.status)}</Badge></td><td className="muted">{String(j.scheduled_at || '—')}</td><td className="muted">{String(j.platform_post_id || '—')}</td><td className="muted">{String(j.failure_reason || '—')}</td>
          <td><div className="stack" style={{ gap: 5 }}>
            <div className="row">
              <form action={approveJobAction}><CsrfInput /><input type="hidden" name="jobId" value={Number(j.id)} /><button className="btn btn-sm" type="submit">মানব অনুমোদন</button></form>
              <form action={submitJobAction}><CsrfInput /><input type="hidden" name="jobId" value={Number(j.id)} /><button className="btn btn-sm btn-primary" type="submit">সাবমিট</button></form>
            </div>
            <form action={confirmPublicationAction} className="inline-form"><CsrfInput /><input type="hidden" name="jobId" value={Number(j.id)} />
              <div className="field"><label>প্ল্যাটফর্ম পোস্ট আইডি</label><input name="platformPostId" placeholder="post_123" /></div>
              <div className="field"><label>প্ল্যাটফর্ম রেসপন্স (JSON)</label><input name="platformResponseJson" placeholder='{"id":"post_123"}' /></div>
              <button className="btn btn-sm" type="submit">নিশ্চিতকরণ রেকর্ড</button>
            </form>
          </div></td></tr>)}
      </Table> : <p className="muted">কোনো জব নেই।</p>}
      <p style={{ marginTop: 16 }}><Link className="btn btn-sm" href="/admin/content">অনুমোদিত খসড়া তৈরি করুন →</Link> <Link className="btn btn-sm" href="/admin/backups">ব্যর্থ জব দেখুন →</Link></p>
    </>
  );
}
