'use client';

import { useActionState } from 'react';
import { loginAction, registerAction } from '@/app/actions/auth';

type State = { error?: string; mfaRequired?: boolean };
const initial: State = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<State, FormData>(loginAction, initial);
  return (
    <form action={action} className="stack" style={{ maxWidth: 440 }}>
      <input type="hidden" name="next" value={next || '/admin'} />
      <div className="field"><label htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" autoComplete="username" required placeholder="admin@thedreamerit.local" /></div>
      <div className="field"><label htmlFor="password">পাসওয়ার্ড</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {state.mfaRequired ? <div className="field"><label htmlFor="totp">অথেনটিকেটর কোড (৬ সংখ্যা)</label><input id="totp" name="totp" inputMode="numeric" pattern="\d{6}" maxLength={6} /></div> : null}
      {state.error ? <div className="notice notice-danger" role="alert">{state.error}</div> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'যাচাই হচ্ছে…' : 'লগইন'}</button>
      <p className="muted" style={{ fontSize: '.82rem' }}>লগইন প্রচেষ্টা হার-সীমিত (১৫ মিনিটে ৮টি) এবং অডিট লগে রেকর্ড করা হয়। প্রাথমিক অ্যাডমিন পাসওয়ার্ড <code>data/bootstrap-credentials.txt</code>-এ লেখা হয় অথবা <code>BOOTSTRAP_ADMIN_PASSWORD</code> দিয়ে সেট করা যায়।</p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<State, FormData>(registerAction, initial);
  return (
    <form action={action} className="stack" style={{ maxWidth: 440 }}>
      <div className="field"><label htmlFor="name">নাম</label><input id="name" name="name" required minLength={2} /></div>
      <div className="field"><label htmlFor="email">ইমেইল</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} /></div>
      {state.error ? <div className="notice notice-danger" role="alert">{state.error}</div> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">{pending ? 'তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন'}</button>
      <p className="muted" style={{ fontSize: '.82rem' }}>অ্যাকাউন্ট তৈরির সময় কোনো মার্কেটিং সম্মতি ধরে নেওয়া হয় না; আপনি পরে পছন্দ পরিবর্তন করতে পারবেন।</p>
    </form>
  );
}
