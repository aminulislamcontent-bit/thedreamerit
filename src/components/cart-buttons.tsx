'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AddToCartButton({ productId, disabled, reason }: { productId: number; disabled: boolean; reason?: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (buyNow: boolean) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/cart', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const json = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) setMessage(json.error || 'কার্টে যোগ করা যায়নি।');
      else if (buyNow) window.location.href = '/checkout';
      else setMessage('কার্টে যোগ হয়েছে।');
    } catch { setMessage('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।'); }
    finally { setBusy(false); }
  };
  if (disabled) return <div className="notice notice-warn" style={{ fontSize: '.85rem' }}>অ্যাড টু কার্ট নিষ্ক্রিয়: {reason || 'যাচাইকৃত মূল্য/স্টক নেই।'}</div>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <button className="btn btn-primary" disabled={busy} onClick={() => add(false)}>🛒 কার্টে যোগ করুন</button>
        <button className="btn btn-gold" disabled={busy} onClick={() => add(true)}>এখনই কিনুন</button>
      </div>
      {message ? <span className="muted" role="status">{message}</span> : null}
    </div>
  );
}

export function WishlistButton({ productId, productName }: { productId: number; productName: string }) {
  const [message, setMessage] = useState('');
  const save = async () => {
    const response = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    const json = await response.json() as { error?: string };
    setMessage(response.ok ? `${productName} উইশলিস্টে যোগ হয়েছে।` : (json.error || 'লগইন প্রয়োজন।'));
  };
  return <span className="row"><button className="btn btn-sm" onClick={save}>♡ উইশলিস্ট</button>{message ? <span className="muted" role="status">{message}</span> : null}</span>;
}

export function CompareLink({ productId }: { productId: number }) {
  return <Link className="btn btn-sm" href={`/compare?ids=${productId}`}>⇄ তুলনা করুন</Link>;
}
