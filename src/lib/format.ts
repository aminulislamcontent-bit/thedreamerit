// Formatting utilities for currency, dates, numbers (Bangladesh locale)
import { BUSINESS } from './config';

export function formatMoney(amount: number, options: { showSymbol?: boolean } = {}): string {
  const { showSymbol = true } = options;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return showSymbol ? `${BUSINESS.currencySymbol}${formatted}` : formatted;
}

export function formatMoneyBn(amount: number): string {
  // Bangla numerals + currency symbol
  const en = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const bn = en.replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
  return `${BUSINESS.currencySymbol}${bn}`;
}

export function formatDate(date: Date | string | null, lang: 'bn' | 'en' = 'en'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (lang === 'bn') {
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const day = String(d.getDate()).replace(/[0-9]/g, (x) => bnDigits[parseInt(x)]);
    const year = String(d.getFullYear()).replace(/[0-9]/g, (x) => bnDigits[parseInt(x)]);
    return `${day} ${months[d.getMonth()]}, ${year}`;
  }
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null, lang: 'bn' | 'en' = 'en'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDate(d, lang);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} ${time}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function truncate(text: string, max: number = 100): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Convert English digits to Bangla digits
export function toBnDigits(value: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/[0-9]/g, (d) => bnDigits[parseInt(d)]);
}

// Validate URL slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get stock status for display
export function getStockStatus(quantity: number, threshold: number = 5): {
  label: string;
  labelBn: string;
  color: string;
} {
  if (quantity <= 0) return { label: 'Out of stock', labelBn: 'স্টক নেই', color: 'red' };
  if (quantity <= threshold) return { label: 'Low stock', labelBn: 'স্টক কম', color: 'amber' };
  return { label: 'In stock', labelBn: 'স্টক আছে', color: 'emerald' };
}
