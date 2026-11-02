import Link from 'next/link';
import { dashboardMetrics, recentAuditEvents, salesByStatus } from '@/lib/server/dashboard';
import { healthSnapshot } from '@/lib/server/monitoring';
import { Badge, Card, Notice, PageHead, PageNotices, Stat, Table, Progress } from '@/components/ui';
import { moneyToBdt } from '@/lib/core/identity';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const m = dashboardMetrics();
  const health = healthSnapshot();
  const audit = recentAuditEvents(12);
  const sales = salesByStatus();
  return (
    <>
      <PageNotices searchParams={sp} />
      {sp.denied ? <Notice tone="danger">অ্যাক্সেস denied: অনুমতি <code>{String(sp.denied)}</code> প্রয়োজন।</Notice> : null}
      <PageHead title="Super Admin Dashboard" subtitle="সব সংখ্যা প্রকৃত অ্যাপ্লিকেশন রেকর্ড থেকে গণনা করা হয়েছে। কোনো ড্যাশবোর্ড মক-আপ ডেটা নেই।"
        actions={<Link className="btn btn-sm" href="/api/health">Health JSON →</Link>} />
      <div className="grid grid-4">
        <Stat label="যাচাইকৃত রাজস্ব (payments)" value={`৳ ${moneyToBdt(m.revenue)}`} hint="শুধুমাত্র status=verified পেমেন্ট" />
        <Stat label="Gross profit (রেকর্ডকৃত কস্ট থেকে)" value={`৳ ${moneyToBdt(m.grossProfit)}`} hint="রাজস্ব ≠ মুনাফা" />
        <Stat label="Net profit" value="উপলব্ধ নয়" tone="warn" hint={m.netProfitNote} />
        <Stat label="অর্ডার" value={m.orders} hint={`${m.openOrders}টি খোলা`} />
        <Stat label="প্রকাশিত পণ্য" value={m.publishedProducts} tone={m.publishedProducts ? 'ok' : 'warn'} hint={`${m.verifiedModels} যাচাইকৃত মডেল, ${m.demoProducts} ডেমো`} />
        <Stat label="ক্যাটালগ সম্পূর্ণ?" value={m.catalogueComplete ? 'হ্যাঁ' : 'না'} tone={m.catalogueComplete ? 'ok' : 'danger'} hint={`${m.categoriesActive} সক্রিয় / ${m.categoriesProposed} প্রস্তাবিত; ${m.categoryMissingModels} মডেলের ঘাটতি`} />
        <Stat label="অনুমোদিত মিডিয়া" value={m.mediaItemsApproved} hint={`${m.mediaItemsPending}টি পর্যালোচনার অপেক্ষায়`} />
        <Stat label="ইনভেন্টরি (যাচাইকৃত)" value={m.inventoryUnits} hint={`${m.reservedUnits} রিজার্ভ · ${m.branches} শাখা · ${m.warehouses} গুদাম`} />
        <Stat label="কর্মচারী / কমিশন" value={m.employees} hint={`অ্যাক্রুয়াল ৳ ${moneyToBdt(m.commissionAccrued)}`} />
        <Stat label="CRM" value={m.customers} hint={`${m.returns} রিটার্ন · ${m.warrantyClaims} ওয়ারেন্টি · ${m.refunds} রিফান্ড`} />
        <Stat label="কনটেন্ট / SEO" value={m.contentDrafts} hint={`${m.approvedDrafts} অনুমোদিত · ${m.seoFailures} SEO ব্যর্থতা`} />
        <Stat label="ইন্টিগ্রেশন" value={`${m.integrationsHealthy} সুস্থ`} tone="warn" hint={`${m.integrationsNotConfigured}টি কনফিগার করা হয়নি (মালিকের ক্রেডেনশিয়াল প্রয়োজন)`} />
        <Stat label="সোশ্যাল পোস্ট" value={m.publishedPosts} hint={`${m.publishingJobs} জব · শুধুমাত্র প্ল্যাটফর্ম নিশ্চিতকরণে published`} />
        <Stat label="ফেইল্ড জব" value={m.openFailedJobs} tone={m.openFailedJobs ? 'danger' : 'ok'} hint={`${m.backups} ব্যাকআপ · ${m.testedRestores} পরীক্ষিত রিস্টোর`} />
        <Stat label="নিরাপত্তা ঘটনা" value={m.securityAlerts} hint={`${m.auditEvents} অডিট ইভেন্ট`} />
        <Stat label="সরবরাহকারী / ক্রয়" value={`${m.suppliers} / ${m.purchaseOrders}`} hint="কোনো বানোয়াট ক্রয় রেকর্ড নেই" />
      </div>

      <Notice tone={m.catalogueComplete ? 'info' : 'warn'}>
        <strong>ক্যাটালগ অবস্থা:</strong> {m.categoriesActive}টি ক্যাটাগরি সক্রিয়, {m.categoriesProposed}টি প্রস্তাবিত। সক্রিয় ক্যাটাগরিগুলোতে মোট <strong>{m.categoryMissingModels}</strong> টি যাচাইকৃত মডেলের ঘাটতি আছে। কোনো সক্রিয় ক্যাটাগরি ১৫-এর নিচে থাকলে সিস্টেম ক্যাটালগকে সম্পূর্ণ ঘোষণা করে না। <Link href="/admin/catalogue">বিস্তারিত →</Link>
      </Notice>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <Card><h2>ক্যাটাগরি সম্পূর্ণতা (সক্রিয় / শীর্ষ ঘাটতি)</h2>
          {m.categoriesActive === 0 ? <p className="muted">কোনো ক্যাটাগরি সক্রিয় নেই। ১০৫টি প্রস্তাবিত ক্যাটাগরি আছে; <Link href="/admin/catalogue">এখানে সক্রিয় করুন</Link>।</p> : (
            <Table headers={['ক্যাটাগরি', 'যাচাইকৃত', 'ঘাটতি', 'অগ্রগতি']}>{m.progress.filter((p) => p.active).map((p) => <tr key={p.categoryId}><td>{p.name}</td><td>{p.distinctVerifiedModels}/{p.minModels}</td><td>{p.missingModels}</td><td style={{ minWidth: 120 }}><Progress value={p.distinctVerifiedModels} max={p.minModels} /></td></tr>)}</Table>
          )}
          <h3 style={{ marginTop: 18 }}>অর্ডার অবস্থা</h3>
          {sales.length ? <Table headers={['অবস্থা', 'অর্ডার', 'মোট']}>{sales.map((s) => <tr key={s.status}><td>{s.status}</td><td>{s.orders}</td><td>৳ {moneyToBdt(Number(s.total))}</td></tr>)}</Table> : <p className="muted">কোনো অর্ডার রেকর্ড নেই।</p>}
        </Card>
        <Card><h2>ইন্টিগ্রেশন ও প্ল্যাটফর্ম স্বাস্থ্য</h2>
          <p className="muted">Health: <Badge tone={health.status === 'ok' ? 'ok' : 'danger'}>{health.status}</Badge> · খোলা ফেইল্ড জব: {health.openFailedJobs} · শেষ ব্যাকআপ: {health.lastBackup ? String(health.lastBackup.created_at) : 'কোনোটিই নেই'}</p>
          <Table headers={['সংযোগ', 'অবস্থা']}>{health.integrations.map((i) => <tr key={String(i.name)}><td>{String(i.name)}</td><td><Badge tone={String(i.status) === 'healthy' ? 'ok' : 'warn'}>{String(i.status)}</Badge></td></tr>)}</Table>
          <h3 style={{ marginTop: 18 }}>সাম্প্রতিক অডিট ইভেন্ট</h3>
          {audit.length ? <Table headers={['সময়', 'অ্যাক্টর', 'কর্ম']}>{audit.map((a) => <tr key={Number(a.id)}><td className="muted">{String(a.created_at)}</td><td>{String(a.actor_label)}</td><td>{String(a.action)}</td></tr>)}</Table> : <p className="muted">কোনো অডিট ইভেন্ট নেই।</p>}
        </Card>
      </div>
    </>
  );
}
