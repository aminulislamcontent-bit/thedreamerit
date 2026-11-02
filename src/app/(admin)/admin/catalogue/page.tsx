import Link from 'next/link';
import { getCategoryProgress } from '@/lib/server/catalogue';
import { activateCategoryAction } from '@/app/actions/catalogue';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Progress, Stat, Table } from '@/components/ui';
import { catalogueIsComplete } from '@/lib/core/catalogue-rules';

export const dynamic = 'force-dynamic';

export default async function CatalogueProgressPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const progress = getCategoryProgress();
  const active = progress.filter((p) => p.active);
  const complete = catalogueIsComplete(progress);
  const totalMissing = active.reduce((sum, p) => sum + p.missingModels, 0);
  const groups = [...new Set(progress.map((p) => p.group))];
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="ক্যাটালগ কমপ্লিটনেস ড্যাশবোর্ড" subtitle="প্রতিটি সক্রিয় ক্যাটাগরির জন্য কমপক্ষে ১৫টি স্বতন্ত্র যাচাইকৃত মডেল, আলাদা ডিটেইল পেজ, অনুমোদিত মিডিয়া, যাচাইকৃত স্পেসিফিকেশন, SEO, মূল্য-যাচাই, প্রকৃত স্টক ও নথিভুক্ত অনুমোদন।"
        actions={<Link className="btn btn-sm" href="/admin/products">পণ্য পরিচালনা →</Link>} />
      <div className="grid grid-4">
        <Stat label="সক্রিয় ক্যাটাগরি" value={active.length} hint={`${progress.length - active.length}টি প্রস্তাবিত`} />
        <Stat label="মোট মডেল ঘাটতি" value={totalMissing} tone={totalMissing ? 'danger' : 'ok'} hint="শূন্য হলেই ক্যাটালগ সম্পূর্ণ হতে পারে" />
        <Stat label="ক্যাটালগ সম্পূর্ণ?" value={complete ? 'হ্যাঁ' : 'না'} tone={complete ? 'ok' : 'danger'} hint={active.length === 0 ? 'কোনো সক্রিয় ক্যাটাগরি নেই — এটিও সম্পূর্ণ নয়' : 'সব সক্রিয় ক্যাটাগরি যাচাই করুন'} />
        <Stat label="যাচাইকৃত মডেল (মোট)" value={progress.reduce((s, p) => s + p.distinctVerifiedModels, 0)} hint="ডেমো ও ডুপ্লিকেট বাদ" />
      </div>
      <Notice tone={complete ? 'info' : 'warn'}>
        <strong>নিয়ম:</strong> ভ্যারিয়েন্ট (রঙ/স্টোরেজ) আলাদা মডেল নয়; ডুপ্লিকেট SKU/মডেল গণনা হয় না; ডেমো রেকর্ড লাইভ ক্যাটালগে আসে না। কোনো সক্রিয় ক্যাটাগরি ১৫-এর নিচে থাকলে অথবা কোনো প্রকাশিত পণ্যের ডিটেইল পেজ/মিডিয়া অসম্পূর্ণ থাকলে এই ড্যাশবোর্ড "সম্পূর্ণ" দেখায় না। অনুমোদিত ডেটা আমদানি <Link href="/admin/products">এখানে</Link> করা যায়।
      </Notice>

      {groups.map((group) => {
        const rows = progress.filter((p) => p.group === group);
        return (
          <section key={group} style={{ marginTop: 26 }}>
            <h2>{group} <span className="muted" style={{ fontSize: '.9rem' }}>({rows.length} ক্যাটাগরি · {rows.filter((r) => r.active).length} সক্রিয়)</span></h2>
            <Table headers={['ক্যাটাগরি', 'অবস্থা', 'যাচাইকৃত মডেল', 'প্রকাশিত', 'ডিটেইল পেজ', 'মিডিয়া সম্পূর্ণ', 'ঘাটতি', 'অগ্রগতি', 'অ্যাকশন']}>
              {rows.map((p) => (
                <tr key={p.categoryId}>
                  <td><Link href={`/categories/${p.slug}`}>{p.name}</Link></td>
                  <td>{p.active ? <Badge tone="ok">সক্রিয়</Badge> : <Badge>প্রস্তাবিত</Badge>}</td>
                  <td>{p.distinctVerifiedModels} / {p.minModels}</td>
                  <td>{p.publishedModels}</td><td>{p.detailPages}</td><td>{p.mediaComplete}</td>
                  <td>{p.active ? <strong style={{ color: p.missingModels ? 'var(--danger)' : 'var(--ok)' }}>{p.missingModels}</strong> : <span className="muted">—</span>}</td>
                  <td style={{ minWidth: 110 }}><Progress value={p.distinctVerifiedModels} max={p.minModels} /></td>
                  <td>
                    <form action={activateCategoryAction} style={{ display: 'inline' }}>
                      <CsrfInput />
                      <input type="hidden" name="categoryId" value={p.categoryId} />
                      <input type="hidden" name="active" value={p.active ? '0' : '1'} />
                      <button className="btn btn-sm" type="submit">{p.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          </section>
        );
      })}
      <Card style={{ marginTop: 26 }}><h2>অডিটেবিলিটি</h2><p className="muted">প্রতিটি সক্রিয়করণ/নিষ্ক্রিয়করণ, যাচাই, মূল্য পরিবর্তন ও প্রকাশনা <Link href="/admin/security">অডিট লগে</Link> অ্যাক্টর ও সময়সহ রেকর্ড হয়। ডুপ্লিকেট শনাক্তকরণ, ডেটা ভ্যালিডেশন, মিডিয়া ভ্যালিডেশন, SEO ভ্যালিডেশন, রিভিশন হিস্টোরি ও আর্কাইভ পণ্য সম্পাদক পৃষ্ঠায় আছে।</p></Card>
    </>
  );
}
