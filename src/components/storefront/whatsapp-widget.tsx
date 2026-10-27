// Premium WhatsApp Floating Widget with quick actions
'use client';
import { useState, useEffect } from 'react';
import { BUSINESS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle, X, Phone, Video, MapPin, Send, ChevronUp,
  ShoppingBag, Headphones, HelpCircle,
} from 'lucide-react';

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show after small delay for better UX
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const whatsappUrl = (message: string) => {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${BUSINESS.whatsapp}?text=${encoded}`;
  };

  const quickActions = [
    {
      icon: ShoppingBag,
      label: 'অর্ডার করতে চাই',
      message: `আসসালামু আলাইকুম, আমি একটি অর্ডার করতে চাই। দয়া করে সাহায্য করুন।`,
      color: 'bg-emerald-500',
    },
    {
      icon: Video,
      label: 'ভিডিও কলে প্রোডাক্ট দেখতে চাই',
      message: `আমি ভিডিও কলে একটি প্রোডাক্ট দেখতে চাই। কখন কল করবেন?`,
      color: 'bg-violet-500',
    },
    {
      icon: Headphones,
      label: 'টেকনিক্যাল সাপোর্ট',
      message: `আমার একটি টেকনিক্যাল সমস্যা আছে। সাপোর্ট প্রয়োজন।`,
      color: 'bg-blue-500',
    },
    {
      icon: HelpCircle,
      label: 'প্রোডাক্ট ইনকয়ারি',
      message: `আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই। দয়া করে বিস্তারিত জানান।`,
      color: 'bg-amber-500',
    },
  ];

  // Phone numbers from Facebook page
  const phoneNumbers = [
    { label: 'WhatsApp (প্রাথমিক)', number: BUSINESS.phone, type: 'whatsapp' },
    { label: 'Shop 104', number: BUSINESS.phoneAlternate, type: 'call' },
    { label: 'Shop 105', number: BUSINESS.phoneAlternate2, type: 'call' },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {open && (
        <div className="w-[340px] max-w-[calc(100vw-2.5rem)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">The Dreamer IT Express</div>
                  <div className="text-xs opacity-90 flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    অনলাইন · সাধারণত ৫ মিনিটে রিপ্লাই
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 bg-secondary/30 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div className="bg-card rounded-lg p-3 shadow-sm border border-border/40 text-sm mb-4">
              <div className="font-medium mb-1">👋 স্বাগতম!</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                আমরা আপনাকে সাহায্য করতে প্রস্তুত। নিচের অপশনগুলো থেকে বেছে নিন অথবা সরাসরি মেসেজ পাঠান।
              </p>
            </div>

            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <a
                  key={i}
                  href={whatsappUrl(action.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/40 hover:border-emerald-500 hover:shadow-md transition group"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color} text-white shrink-0 group-hover:scale-110 transition`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm font-medium">{action.label}</div>
                  <Send className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition" />
                </a>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">📱 সরাসরি যোগাযোগ</div>
              <div className="space-y-1.5">
                {phoneNumbers.map((p, i) => (
                  <a
                    key={i}
                    href={p.type === 'whatsapp' ? `https://wa.me/88${p.number}` : `tel:${p.number}`}
                    target={p.type === 'whatsapp' ? '_blank' : undefined}
                    rel={p.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
                    className="flex items-center justify-between gap-2 p-2 bg-card rounded-md border border-border/40 hover:border-emerald-500 text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {p.type === 'whatsapp' ? (
                        <MessageCircle className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Phone className="h-3 w-3 text-blue-600" />
                      )}
                      <span className="font-medium">{p.label}</span>
                    </span>
                    <span className="font-mono">{p.number}</span>
                  </a>
                ))}
              </div>

              {/* Facebook link */}
              <a
                href={BUSINESS.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                ফেসবুক পেজ ({BUSINESS.social.facebookFollowers}+ ফলোয়ার)
              </a>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground justify-center text-center">
              <MapPin className="h-2.5 w-2.5" /> Suvastu Arcade, ICT Bhaban (Level 1)<br />New Elephant Road, Dhaka 1205
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl hover:scale-110 transition-transform"
        aria-label="WhatsApp চ্যাট"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-75 animate-ping"></span>
        {/* Icon */}
        <span className="relative">
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7 fill-white" />}
        </span>
        {/* Notification badge */}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold border-2 border-background">
            1
          </span>
        )}
      </button>
    </div>
  );
}
