import Link from 'next/link';
import { all, get } from '@/lib/server/database';
import { getCurrentUser } from '@/lib/server/auth';
import { totpProvisioningUri } from '@/lib/core/totp';
import { changePasswordAction, disableMfaAction, setupMfaAction } from '@/app/actions/auth';
import { CsrfInput } from '@/components/csrf-input';
import { Badge, Card, Notice, PageHead, PageNotices, Table, Stat } from '@/components/ui';
import { schedulerStatus } from '@/lib/server/jobs';

export const dynamic = 'force-dynamic';

export default async function SecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const secretRow = get<{ mfa_secret: string | null }>('SELECT mfa_secret FROM users WHERE id = ?', [user?.id ?? 0]);
  const uri = user?.mfaEnabled && secretRow?.mfa_secret ? totpProvisioningUri(secretRow.mfa_secret, user.email) : null;
  const audit = all<{ id: number; created_at: string; actor_label: string; action: string; entity_type: string; ip: string }>('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 60');
  const sessions = all<{ id: number; user_id: number; created_at: string; expires_at: string; revoked_at: string | null }>('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 20');
  const roles = all<{ slug: string; name: string }>('SELECT slug, name FROM roles');
  const permissions = all<{ slug: string }>('SELECT slug FROM permissions ORDER BY slug');
  const rateHits = all<{ bucket: string; subject: string; created_at: string }>('SELECT * FROM rate_limit_hits ORDER BY created_at DESC LIMIT 20');
  const logs = all<{ level: string; message: string; created_at: string }>('SELECT * FROM app_logs ORDER BY created_at DESC LIMIT 20');
  const scheduler = schedulerStatus();
  return (
    <>
      <PageNotices searchParams={sp} />
      <PageHead title="নিরাপত্তা, অনুমতি ও অডিট" subtitle="Secure authentication, scrypt পাসওয়ার্ড হ্যাশিং, RBAC, সার্ভার-সাইড permission checks, সেশন সুরক্ষা, হার-সীমা, ইনপুট ভ্যালিডেশন, সিকিউর আপলোড, অডিট লগ ও ঐচ্ছিক TOTP MFA।" />
      <div className="grid grid-4"><Stat label="অডিট ইভেন্ট" value={audit.length} hint="সর্বশেষ ৬০" /><Stat label="ভূমিকা" value={roles.length} /><Stat label="অনুমতি" value={permissions.length} /><Stat label="সেশন" value={sessions.length} /></div>
      <Card style={{ marginTop: 18 }}>
        <h2>রক্ষণাবেক্ষণ সcheduler</h2>
        <p className="muted">অভ্যন্তরীণ রানার: {scheduler.internalEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'} · টিক: {Math.round(scheduler.intervalMs / 1000)}s · সর্বশেষ রান: {scheduler.lastRun?.status ?? 'none'} · খোলা failed jobs: {scheduler.openFailedJobs}</p>
        <Table headers={['Job', 'ব্যবধান', 'সর্বশেষ', 'পরবর্তী', 'অবস্থা']}>
          {scheduler.jobs.map((j) => <tr key={j.name}><td><code>{j.name}</code></td><td>{j.interval_minutes} min</td><td className="muted">{j.last_run_at ?? '—'}</td><td className="muted">{j.next_run_at}</td><td>{j.enabled ? <Badge tone="ok">enabled</Badge> : <Badge tone="warn">disabled</Badge>}</td></tr>)}
        </Table>
        <p className="muted" style={{ fontSize: '.8rem' }}>প্রতিটি due job <code>BEGIN IMMEDIATE</code> ট্রানজাকশনে claim করা হয়; ব্যর্থতা <code>scheduled_job_runs</code> ও অ্যাপ লগে রেকর্ড হয়।</p>
      </Card>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <Card><h2>আপনার অ্যাকাউন্ট</h2><p className="muted">{user?.email} · ভূমিকা: {user?.roles.join(', ')} · MFA: {user?.mfaEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'} · অনুমতি {user?.permissions.length}</p>
          {uri ? <><Notice tone="warn">MFA provisioning URI (শুধুমাত্র আপনার অ্যাকাউন্টের জন্য দেখানো হচ্ছে):</Notice><pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{uri}</pre></> : <p className="muted">MFA সক্রিয় নেই। নিচের বোতামে TOTP সিক্রেট তৈরি করুন; পরবর্তী লগইন থেকে ৬-সংখ্যার কোড প্রয়োজন হবে।</p>}
          <div className="row"><form action={setupMfaAction}><CsrfInput /><button className="btn btn-sm btn-primary" type="submit">MFA সক্রিয় / সিক্রেট নতুন করে তৈরি</button></form>
            <form action={disableMfaAction}><CsrfInput /><button className="btn btn-sm btn-danger" type="submit">MFA নিষ্ক্রিয়</button></form></div>
          <hr /><h3>পাসওয়ার্ড পরিবর্তন</h3><form action={changePasswordAction} className="stack"><CsrfInput />
            <div className="field"><label htmlFor="currentPassword">বর্তমান পাসওয়ার্ড</label><input id="currentPassword" name="currentPassword" type="password" required /></div>
            <div className="field"><label htmlFor="newPassword">নতুন পাসওয়ার্ড (≥১২)</label><input id="newPassword" name="newPassword" type="password" minLength={12} required /></div>
            <button className="btn btn-sm" type="submit">পরিবর্তন করুন</button>
          </form>
        </Card>
        <Card><h2>RBAC ভূমিকা ও অনুমতি</h2><Table headers={['slug', 'নাম']}>{roles.map((r) => <tr key={r.slug}><td><code>{r.slug}</code></td><td>{r.name}</td></tr>)}</Table>
          <h3 style={{ marginTop: 14 }}>অনুমতি স্লাগ</h3><div className="tag-list">{permissions.map((p) => <span key={p.slug} className="badge">{p.slug}</span>)}</div>
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 10 }}>প্রতিটি privileged server action <code>requirePermission()</code> ও <code>requireCsrf()</code> দিয়ে সুরক্ষিত; পাবলিক ফর্ম হার-সীমিত ও হানিপট-যাচাইকৃত।</p>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 22 }}>
        <Card><h2>অডিট লগ</h2>{audit.length ? <Table headers={['সময়', 'অ্যাক্টর', 'কর্ম', 'এন্টিটি', 'IP']}>{audit.map((a) => <tr key={a.id}><td className="muted">{a.created_at}</td><td>{a.actor_label}</td><td><code>{a.action}</code></td><td>{a.entity_type}</td><td className="muted">{a.ip || '—'}</td></tr>)}</Table> : <p className="muted">কোনো ইভেন্ট নেই।</p>}</Card>
        <Card><h2>সেশন, হার-সীমা ও অ্যাপ লগ</h2><h3>সেশন</h3>{sessions.length ? <Table headers={['ব্যবহারকারী', 'তৈরি', 'মেয়াদ', 'অবস্থা']}>{sessions.map((s) => <tr key={s.id}><td>#{s.user_id}</td><td className="muted">{s.created_at}</td><td className="muted">{s.expires_at}</td><td>{s.revoked_at ? 'revoked' : <Badge tone="ok">active</Badge>}</td></tr>)}</Table> : <p className="muted">কোনো সেশন নেই।</p>}
          <h3 style={{ marginTop: 14 }}>হার-সীমা হিট</h3>{rateHits.length ? <Table headers={['বাকেট', 'সাবজেক্ট', 'সময়']}>{rateHits.map((r, i) => <tr key={i}><td>{r.bucket}</td><td className="muted">{r.subject}</td><td className="muted">{r.created_at}</td></tr>)}</Table> : <p className="muted">কোনো হিট নেই।</p>}
          <h3 style={{ marginTop: 14 }}>অ্যাপ লগ</h3>{logs.length ? <Table headers={['লেভেল', 'বার্তা']}>{logs.map((l, i) => <tr key={i}><td>{l.level}</td><td className="muted">{l.message}</td></tr>)}</Table> : null}
          <p style={{ marginTop: 12 }}><Link className="btn btn-sm" href="/admin/backups">ফেইল্ড জব ও ব্যাকআপ →</Link></p>
        </Card>
      </div>
    </>
  );
}
