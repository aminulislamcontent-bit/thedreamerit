import Link from 'next/link';
import type { ReactNode } from 'react';
import { BUSINESS } from '@/lib/core/identity';

const GROUPS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  { title: 'Overview', links: [
    { href: '/admin', label: 'Super Admin' }, { href: '/admin/catalogue', label: 'Catalogue progress' },
    { href: '/admin/settings', label: 'Settings & identity' },
  ] },
  { title: 'Catalogue & media', links: [
    { href: '/admin/products', label: 'Products & import' }, { href: '/admin/media', label: 'Media management' },
    { href: '/admin/content', label: 'AI Content Studio' }, { href: '/admin/seo', label: 'SEO automation' },
  ] },
  { title: 'Operations', links: [
    { href: '/admin/inventory', label: 'Inventory' }, { href: '/admin/operations', label: 'Branches & purchasing' },
    { href: '/admin/pos', label: 'Point of sale' }, { href: '/admin/orders', label: 'Orders & payments' },
  ] },
  { title: 'People & growth', links: [
    { href: '/admin/employees', label: 'Employees & commission' }, { href: '/admin/crm', label: 'CRM & support' },
    { href: '/admin/social', label: 'Social publishing' },
  ] },
  { title: 'Platform', links: [
    { href: '/admin/security', label: 'Security & audit' }, { href: '/admin/backups', label: 'Backups & monitoring' },
    { href: '/api/health', label: 'Health endpoint' },
  ] },
];

export function AdminShell({ children, user }: { children: ReactNode; user: { name: string; email: string; roles: string[] } }) {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" href="/admin"><span className="brand-mark">D</span><span>Control Center<br /><span className="muted" style={{ fontSize: '.68rem' }}>{BUSINESS.name}</span></span></Link>
        <nav aria-label="Admin navigation">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="side-group">{group.title}</div>
              {group.links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 26, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <Link href="/">← পাবলিক সাইট</Link>
          <form action="/api/logout" method="post"><button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} type="submit">লগআউট</button></form>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <div><strong>অ্যাডমিন ও ERP কন্ট্রোল সেন্টার</strong><br /><span className="muted" style={{ fontSize: '.8rem' }}>সব সংখ্যা প্রকৃত অ্যাপ্লিকেশন রেকর্ড থেকে গণনা করা হয়</span></div>
          <div className="row"><span className="badge badge-info">{user.roles.join(', ') || 'no role'}</span><span className="muted" style={{ fontSize: '.82rem' }}>{user.name} · {user.email}</span></div>
        </div>
        <main className="admin-content" id="main-content">{children}</main>
      </div>
    </div>
  );
}
