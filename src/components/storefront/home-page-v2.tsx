// Premium Homepage V2 - 10x better than competition
'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { BUSINESS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { ProductCard } from '@/components/storefront/product-card';
import { FacebookBanner } from '@/components/storefront/facebook-banner';
import { PremiumHero } from '@/components/storefront/premium-hero';
import { PRODUCT_IMAGES, BRAND_INFO } from '@/lib/images';
import {
  Cpu, Monitor, Laptop, HardDrive, MemoryStick, Mouse, Keyboard,
  Printer, Wifi, Zap, ShoppingCart, ArrowRight, Shield, Truck, Headphones, Award,
  Gamepad2, Server, Cable, Star, Play, Clock, Phone, MapPin, ChevronRight,
  Sparkles, TrendingUp, Wallet, Video, CheckCircle2, BadgePercent, MessageCircle,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  laptops: Laptop, 'desktop-pcs': Monitor, 'gaming-pcs': Gamepad2,
  processors: Cpu, motherboards: Server, 'graphics-cards': Monitor,
  ram: MemoryStick, storage: HardDrive, monitors: Monitor,
  keyboards: Keyboard, mice: Mouse, headphones: Headphones,
  printers: Printer, routers: Wifi, networking: Wifi, ups: Zap,
  'power-supplies': Zap, cases: Server, cooling: Zap,
  'cables-adapters': Cable, accessories: Cable, 'all-in-one': Monitor,
};

const BUDGET_RANGES = [
  { label: '১০,০০০ টাকার নিচে', labelEn: 'Under ৳10K', min: 0, max: 10000, color: 'from-blue-500 to-cyan-500', icon: Wallet },
  { label: '১০K - ২৫K', labelEn: '৳10K - ৳25K', min: 10000, max: 25000, color: 'from-emerald-500 to-teal-500', icon: Wallet },
  { label: '২৫K - ৫০K', labelEn: '৳25K - ৳50K', min: 25000, max: 50000, color: 'from-violet-500 to-purple-500', icon: TrendingUp },
  { label: '৫০K - ১ লক্ষ', labelEn: '৳50K - ৳1L', min: 50000, max: 100000, color: 'from-amber-500 to-orange-500', icon: Award },
  { label: '১ লক্ষের বেশি', labelEn: 'Above ৳1L', min: 100000, max: 999999, color: 'from-rose-500 to-pink-500', icon: Sparkles },
];

const TRUST_BADGES = [
  { icon: Shield, title: '১০০% অরিজিনাল', desc: 'অথেন্টিক প্রোডাক্ট গ্যারান্টি' },
  { icon: Truck, title: 'সারা দেশে ডেলিভারি', desc: '২৪-৪৮ ঘন্টায়' },
  { icon: Video, title: 'ভিডিও কল সাপোর্ট', desc: 'কিনার আগে দেখুন' },
  { icon: Award, title: 'অথেন্টিক ওয়ারেন্টি', desc: 'অফিসিয়াল সাপোর্ট' },
  { icon: Headphones, title: '৭/৭ সাপোর্ট', desc: 'দক্ষ টেকনিক্যাল টিম' },
  { icon: BadgePercent, title: 'সেরা দাম', desc: 'প্রতিযোগিতামূলক মূল্য' },
];

export function HomePage() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: categoriesData } = useApi<{ tree: any[] }>('/api/categories');
  const { data: productsData } = useApi<{ products: any[] }>('/api/products?limit=12');

  const featuredProducts = productsData?.products?.filter((p) => p.isFeatured) || [];
  const newProducts = productsData?.products || [];
  const categories = categoriesData?.tree || [];

  return (
    <div className="space-y-12 pb-12">
      {/* Premium Hero V3 - With 7 video-quality images + 3D rotating vase */}
      <PremiumHero />

      {/* Trust bar */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <Card className="p-4 shadow-xl border-border/40">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TRUST_BADGES.map((t, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition">
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.title}</div>
                  <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Promotional banner with countdown */}
      <section className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Big promo */}
          <Card className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
            <div className="absolute inset-0 tech-grid opacity-10"></div>
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative">
              <Badge className="mb-3 bg-white/20 text-white hover:bg-white/20">🔥 ফ্ল্যাশ সেল</Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">গেমিং পিসি বিল্ড করুন ৫% ছাড়ে</h3>
              <p className="opacity-90 mb-4">কাস্টম কনফিগারেশনের উপর বিশেষ ছাড় এবং ফ্রি অ্যাসেম্বলি</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl font-bold">৳৮৫,০০০</div>
                <div className="text-lg line-through opacity-70">৳৮৯,৫০০</div>
              </div>
              <Button variant="secondary" onClick={() => navigate({ name: 'pc-configurator' })} className="gap-2">
                এখনই বিল্ড করুন <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Two small promos */}
          <div className="grid gap-4">
            <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <div className="absolute -top-5 -right-5 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex-1">
                  <Badge className="mb-2 bg-white/20 text-white hover:bg-white/20">বাজেট ল্যাপটপ</Badge>
                  <h4 className="text-xl font-bold mb-1">ল্যাপটপ শুরু ৳২৫,০০০</h4>
                  <p className="text-sm opacity-90">স্টুডেন্ট ও অফিসের জন্য আদর্শ</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate({ name: 'catalog', category: 'laptops' })} className="shrink-0">
                  দেখুন
                </Button>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="flex-1">
                  <Badge className="mb-2 bg-white/20 text-white hover:bg-white/20">নতুন এসেছে</Badge>
                  <h4 className="text-xl font-bold mb-1">ইন্টেল ১৩তম জেন প্রসেসর</h4>
                  <p className="text-sm opacity-90">পারফরম্যান্সের নতুন সীমা</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate({ name: 'catalog', category: 'processors' })} className="shrink-0">
                  দেখুন
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Shop by Budget */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-7 w-7 text-emerald-600" /> বাজেট অনুযায়ী শপ করুন
            </h2>
            <p className="text-muted-foreground text-sm mt-1">আপনার বাজেটের সাথে মানানসই প্রোডাক্ট খুঁজুন</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {BUDGET_RANGES.map((b, i) => (
            <button
              key={i}
              onClick={() => navigate({ name: 'catalog', query: '' })}
              className={`group relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br ${b.color} hover:shadow-xl transition-all hover:-translate-y-1`}
            >
              <div className="absolute -top-3 -right-3 opacity-30">
                <b.icon className="h-16 w-16" />
              </div>
              <div className="relative">
                <div className="text-lg font-bold">{b.labelEn}</div>
                <div className="text-xs opacity-90 mb-2">{b.label}</div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  শপ করুন <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Categories grid - Premium design */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Cpu className="h-7 w-7 text-emerald-600" /> ক্যাটাগরি ব্রাউজ করুন
              </h2>
              <p className="text-muted-foreground text-sm mt-1">আপনার প্রয়োজনীয় টেক প্রোডাক্ট খুঁজে নিন</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'catalog' })} className="gap-1">
              সব দেখুন <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categories.slice(0, 16).map((cat: any) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Cpu;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate({ name: 'catalog', category: cat.slug })}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card hover:border-emerald-500 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/10 to-violet-500/10 text-emerald-600 group-hover:from-emerald-500 group-hover:to-violet-500 group-hover:text-white transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium text-center line-clamp-2">{cat.name}</div>
                  <div className="text-[10px] text-muted-foreground">{cat.productCount} আইটেম</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured products - Premium grid */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-amber-500" /> ফিচার্ড প্রোডাক্ট
              </h2>
              <p className="text-muted-foreground text-sm mt-1">সেরা প্রোডাক্ট সবচেয়ে ভালো দামে</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'catalog' })} className="gap-1">
              সব দেখুন <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Brand showcase */}
      <section className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Award className="h-7 w-7 text-violet-600" /> আমাদের ব্র্যান্ড পার্টনার
          </h2>
          <p className="text-muted-foreground text-sm mt-1">বিশ্বের সেরা টেক ব্র্যান্ডগুলোর অফিসিয়াল পার্টনার</p>
        </div>
        <Card className="p-6">
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {Object.entries(BRAND_INFO).slice(0, 10).map(([name, info]) => (
              <button
                key={name}
                onClick={() => navigate({ name: 'catalog', brand: name.toLowerCase() })}
                className="group flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 hover:border-border hover:shadow-md transition"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-lg text-white mb-2 group-hover:scale-110 transition"
                  style={{ background: `linear-gradient(135deg, ${info.color}, ${info.color}dd)` }}
                >
                  {name.charAt(0)}
                </div>
                <div className="text-xs font-medium">{name}</div>
                <div className="text-[9px] text-muted-foreground text-center line-clamp-1">{info.tagline}</div>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* New arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-emerald-600" /> নতুন এসেছে
            </h2>
            <p className="text-muted-foreground text-sm mt-1">সর্বশেষ যুক্ত হওয়া প্রোডাক্ট</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'catalog' })} className="gap-1">
            সব দেখুন <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {newProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Video call feature */}
      <section className="container mx-auto px-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={PRODUCT_IMAGES.showroom} alt="" className="w-full h-full object-cover opacity-10" />
          </div>
          <div className="relative p-6 md:p-10 grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <Badge className="mb-3 bg-violet-100 text-violet-700 hover:bg-violet-100">
                <Video className="mr-1.5 h-3 w-3" /> নতুন সুবিধা
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">ভিডিও কলে প্রোডাক্ট দেখুন</h3>
              <p className="text-muted-foreground mb-4">
                কেনার আগে ভিডিও কলে আমাদের সাথে কথা বলুন। আমরা আপনাকে লাইভ প্রোডাক্ট দেখাবো, প্রশ্নের উত্তর দিবো এবং সঠিক পছন্দে সাহায্য করবো।
              </p>
              <div className="space-y-2 mb-4">
                {[
                  'বাজেট বলুন, সঠিক প্রোডাক্ট সাজেস্ট করি',
                  'লাইভ প্রোডাক্ট ডেমো দেখুন',
                  'টেকনিক্যাল প্রশ্ন করুন',
                  'ক্যাশ অন ডেলিভারি অপশন',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent('আমি ভিডিও কলে প্রোডাক্ট দেখতে চাই।')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Video className="h-4 w-4" /> ভিডিও কল বুক করুন
                  </Button>
                </a>
                <a href={`tel:${BUSINESS.phone}`}>
                  <Button variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" /> {BUSINESS.phone}
                  </Button>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <img
                src={PRODUCT_IMAGES.gamingLaptop[0]}
                alt="Gaming setup"
                className="rounded-xl aspect-square object-cover w-full"
              />
              <img
                src={PRODUCT_IMAGES.rgbSetup}
                alt="RGB keyboard setup"
                className="rounded-xl aspect-square object-cover w-full mt-6"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Why choose us */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">কেন বেছে নিবেন দ্য ড্রিমার আইটি?</h2>
          <p className="text-muted-foreground text-sm mt-1">বাংলাদেশের সবচেয়ে বিশ্বস্ত টেক রিটেইলার</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: '১০০% অরিজিনাল প্রোডাক্ট', desc: 'আমরা শুধুমাত্র অরিজিনাল এবং অথেন্টিক প্রোডাক্ট বিক্রি করি। প্রতিটি প্রোডাক্টে অফিসিয়াল ওয়ারেন্টি।', color: 'from-emerald-500 to-teal-500' },
            { icon: Video, title: 'ভিডিও কল সাপোর্ট', desc: 'কিনার আগে ভিডিও কলে প্রোডাক্ট দেখুন। আমাদের এক্সপার্ট টিম আপনাকে সঠিক পছন্দে সাহায্য করবে।', color: 'from-violet-500 to-purple-500' },
            { icon: Truck, title: 'সারা দেশে দ্রুত ডেলিভারি', desc: 'ঢাকায় ২৪-৪৮ ঘন্টা, সারা দেশে ৩-৫ কর্মদিবসে ডেলিভারি। নিরাপদ প্যাকেজিং গ্যারান্টি।', color: 'from-amber-500 to-orange-500' },
            { icon: Headphones, title: '৭/৭ টেকনিক্যাল সাপোর্ট', desc: 'দক্ষ টেকনিক্যাল টিম সবসময় আপনার পাশে। ফোন, WhatsApp বা সরাসরি দোকানে আসুন।', color: 'from-blue-500 to-cyan-500' },
            { icon: Award, title: 'অথেন্টিক ওয়ারেন্টি', desc: 'ম্যানুফ্যাকচারার ওয়ারেন্টি গ্যারান্টি। ওয়ারেন্টি ক্লেমে সম্পূর্ণ সাপোর্ট।', color: 'from-rose-500 to-pink-500' },
            { icon: Wallet, title: 'সেরা দাম গ্যারান্টি', desc: 'বাজারের সবচেয়ে প্রতিযোগিতামূলক দাম। দেখুন, তুলনা করুন, তারপর কিনুন।', color: 'from-indigo-500 to-violet-500' },
          ].map((s, i) => (
            <Card key={i} className="p-5 hover:shadow-lg transition group">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white mb-3 group-hover:scale-110 transition`}>
                <s.icon className="h-6 w-6" />
              </div>
              <h4 className="font-semibold mb-1.5">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Facebook social proof */}
      <section className="container mx-auto px-4">
        <FacebookBanner />
      </section>

      {/* Showroom showcase */}
      <section className="container mx-auto px-4">
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="aspect-video lg:aspect-auto bg-secondary/30">
              <img src={PRODUCT_IMAGES.showroom} alt="Our Showroom" className="w-full h-full object-cover" />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="mb-3 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <MapPin className="mr-1.5 h-3 w-3" /> আমাদের শোরুম
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">সরাসরি আমাদের দোকানে আসুন</h3>
              <p className="text-muted-foreground mb-4">
                Suvastu Arcade, ICT Bhaban (Level 1), New Elephant Road-এ অবস্থিত আমাদের দুটি দোকান (Shop 104 ও 105) থেকে সরাসরি প্রোডাক্ট দেখে কিনুন। ভিডিও কলেও দেখতে পারেন।
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Shop 104 & 105, Level 1</div>
                    <div className="text-muted-foreground">{BUSINESS.address.line1}</div>
                    <div className="text-muted-foreground">{BUSINESS.address.city} {BUSINESS.address.postalCode}, {BUSINESS.address.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">ফোন</div>
                    <a href={`tel:${BUSINESS.phone}`} className="text-muted-foreground hover:text-emerald-600">{BUSINESS.phone}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">খোলা থাকে</div>
                    <div className="text-muted-foreground">বৃহস্পতি - শনি: ১০AM - ৮PM</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4" /> WhatsApp করুন
                  </Button>
                </a>
                <a href={`tel:${BUSINESS.phone}`}>
                  <Button variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" /> কল করুন
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
