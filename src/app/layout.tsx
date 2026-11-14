import type { Metadata } from 'next';
import './globals.css';
import { BUSINESS } from '@/lib/core/identity';

// A fresh nonce CSP requires dynamic rendering; static prerenders cannot carry
// the per-request nonce that Next.js applies to its inline bootstrap scripts.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: `${BUSINESS.name} | কম্পিউটার ও প্রযুক্তি`, template: `%s | ${BUSINESS.name}` },
  description: 'যাচাইকৃত তথ্যের ভিত্তিতে কম্পিউটার, কম্পোনেন্ট ও প্রযুক্তি পণ্যের তথ্য। কোনো যাচাই না করা দাম, স্টক বা পর্যালোচনা প্রকাশ করা হয় না।',
  applicationName: BUSINESS.name,
  robots: { index: true, follow: true },
  openGraph: { type: 'website', siteName: BUSINESS.name, locale: 'bn_BD', alternateLocale: 'en_US' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body>
        <a className="skip-link" href="#main-content">মূল বিষয়বস্তুতে যান</a>
        {children}
      </body>
    </html>
  );
}
