import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'ok' | 'warn' | 'danger' }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value" style={tone === 'danger' ? { color: 'var(--danger)' } : tone === 'warn' ? { color: 'var(--warn)' } : undefined}>{value}</div>
      {hint ? <div className="muted" style={{ fontSize: '.8rem', marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'info' | 'muted' }) {
  return <span className={`badge ${tone === 'muted' ? '' : `badge-${tone}`}`}>{children}</span>;
}

export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="spread" style={{ marginBottom: 22 }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>{title}</h1>
        {subtitle ? <div className="muted" style={{ maxWidth: 820 }}>{subtitle}</div> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'danger' }) {
  return <div className={`notice ${tone === 'warn' ? 'notice-warn' : tone === 'danger' ? 'notice-danger' : ''}`}>{children}</div>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty"><h3 style={{ color: 'var(--text)' }}>{title}</h3><div style={{ maxWidth: 700, margin: '0 auto' }}>{children}</div></div>;
}

export function Table({ headers, children, minWidth }: { headers: string[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="table-wrap">
      <table style={minWidth ? { minWidth } : undefined}>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{ width: `${pct}%` }} /></div>;
}

export function CheckList({ checks }: { checks: Array<{ name: string; pass: boolean; detail: string }> }) {
  return (
    <ul className="checks">
      {checks.map((c) => (
        <li key={c.name} className={c.pass ? 'pass' : 'fail'}>
          <span aria-hidden="true">{c.pass ? '✅' : '⛔'}</span>
          <span><strong>{c.name}</strong><br /><span className="muted" style={{ fontSize: '.82rem' }}>{c.detail}</span></span>
        </li>
      ))}
    </ul>
  );
}

export function Field({ label, name, defaultValue, type = 'text', required, placeholder, children }: {
  label: string; name: string; defaultValue?: string | number; type?: string; required?: boolean; placeholder?: string; children?: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children ?? <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} />}
    </div>
  );
}

export function Crumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          {i < items.length - 1 ? <span aria-hidden="true"> / </span> : null}
        </span>
      ))}
    </nav>
  );
}

export function PageNotices({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  if (!searchParams) return null;
  const read = (k: string) => { const v = searchParams[k]; return Array.isArray(v) ? v[0] : v; };
  const ok = read('ok');
  const error = read('error');
  return (
    <>
      {ok ? <Notice>{ok}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </>
  );
}
