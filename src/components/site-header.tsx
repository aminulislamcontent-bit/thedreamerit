import Link from 'next/link';
import { BUSINESS } from '@/lib/core/identity';

const NAV = [
  { href: '/products', label: 'পণ্য / Products' },
  { href: '/categories', label: 'ক্যাটাগরি' },
  { href: '/compare', label: 'তুলনা' },
  { href: '/guides', label: 'কেনাকাটার গাইড' },
  { href: '/blog', label: 'ব্লগ' },
  { href: '/contact', label: 'যোগাযোগ' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container bar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>{BUSINESS.name}<br /><span className="muted" style={{ fontSize: '.68rem', fontWeight: 500 }}>কম্পিউটার ও প্রযুক্তি</span></span>
        </Link>
        <form className="header-search" action="/search" method="get" role="search">
          <input name="q" type="search" placeholder="পণ্য খুঁজুন…" aria-label="Search products" />
          <button className="btn btn-sm" type="submit">খুঁজুন</button>
        </form>
        <nav className="nav" aria-label="Main navigation">
          {NAV.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
          <Link href="/cart">কার্ট</Link>
          <Link href="/account">অ্যাকাউন্ট</Link>
        </nav>
      </div>
    </header>
  );
}
