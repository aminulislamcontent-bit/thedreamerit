// Storefront Footer
'use client';
import { useAppStore } from '@/lib/store';
import { BUSINESS } from '@/lib/config';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, MessageCircle, Clock } from 'lucide-react';

const FOOTER_LINKS = {
  shop: [
    { label: 'সকল প্রোডাক্ট', view: { name: 'catalog' as const } },
    { label: 'পিসি কনফিগারেটর', view: { name: 'pc-configurator' as const } },
    { label: 'অর্ডার ট্র্যাক', view: { name: 'track-order' as const } },
    { label: 'তুলনা করুন', view: { name: 'compare' as const } },
  ],
  support: [
    { label: 'কাস্টমার সাপোর্ট', view: { name: 'support' as const } },
    { label: 'ওয়ারেন্টি তথ্য', view: { name: 'warranty' as const } },
    { label: 'রিটার্ন ও রিফান্ড', view: { name: 'returns' as const } },
    { label: 'ডেলিভারি তথ্য', view: { name: 'delivery' as const } },
    { label: 'সাধারণ জিজ্ঞাসা', view: { name: 'faq' as const } },
  ],
  company: [
    { label: 'আমাদের সম্পর্কে', view: { name: 'about' as const } },
    { label: 'যোগাযোগ', view: { name: 'contact' as const } },
    { label: 'প্রাইভেসি পলিসি', view: { name: 'privacy' as const } },
    { label: 'শর্তাবলী', view: { name: 'terms' as const } },
  ],
};

export function StorefrontFooter() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground font-bold text-lg shadow-sm">D<span className="text-xs align-top">i</span></div>
              <div>
                <div className="font-bold">Dreamer IT Express</div>
                <div className="text-[10px] text-muted-foreground">Premium Tech Retail · BD</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {BUSINESS.primaryCategories.slice(0, 5).join(', ')} এবং আরও অনেক কিছু পাচ্ছেন সবচেয়ে ভালো দামে।
            </p>
            <div className="flex items-center gap-2">
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>
              <a href={`https://wa.me/${BUSINESS.whatsapp}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">শপ</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.shop.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.view)} className="text-muted-foreground hover:text-primary text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">সাপোর্ট</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.support.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.view)} className="text-muted-foreground hover:text-primary text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">কোম্পানি</h4>
            <ul className="space-y-2 text-sm">
              {FOOTER_LINKS.company.map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.view)} className="text-muted-foreground hover:text-primary text-left">{l.label}</button></li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-semibold text-sm mb-3">যোগাযোগ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> {BUSINESS.address.line1}, {BUSINESS.address.line2}, {BUSINESS.address.country}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> {BUSINESS.phone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> {BUSINESS.email}</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-primary" /> শনি-বৃহস্পতি: ১০AM - ৮PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. সর্বস্বত্ব সংরক্ষিত।</p>
          <p>ভার্সন 1.0.0 · ডোমেইন: {BUSINESS.domain}</p>
        </div>
      </div>
    </footer>
  );
}
