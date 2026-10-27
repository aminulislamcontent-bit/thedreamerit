// Homepage - hero, categories, featured products, promotions
'use client';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { BUSINESS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, getStockStatus } from '@/lib/format';
import { ProductCard } from '@/components/storefront/product-card';
import {
  Cpu, Monitor, Laptop, HardDrive, MemoryStick, Mouse, Keyboard,
  Printer, Wifi, Zap, ShoppingCart, ArrowRight, Shield, Truck, Headphones, Award,
  Gamepad2, Server, Cable,
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

export function HomePage() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: categoriesData } = useApi<{ tree: any[] }>('/api/categories');
  const { data: productsData } = useApi<{ products: any[] }>('/api/products?limit=12');

  const featuredProducts = productsData?.products?.filter((p) => p.isFeatured) || [];
  const newProducts = productsData?.products || [];
  const categories = categoriesData?.tree || [];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 tech-grid opacity-50"></div>
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-chart-2/20 blur-3xl"></div>

        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-3 py-1.5">
                <Zap className="mr-1.5 h-3 w-3" /> Bangladesh's Premium Tech Retailer
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                আপনার টেক পার্টনার,<br />
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">দ্য ড্রিমার আইটি</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                ল্যাপটপ, ডেস্কটপ, গেমিং পিসি, কম্পোনেন্টস এবং সকল টেক প্রোডাক্ট পাচ্ছেন সবচেয়ে ভালো দামে, অরিজিনাল ওয়ারেন্টি সহ।
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate({ name: 'catalog' })} className="gap-2">
                  প্রোডাক্ট ব্রাউজ করুন <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate({ name: 'pc-configurator' })}>
                  কাস্টম পিসি বিল্ড করুন
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> ১০০% অরিজিনাল</div>
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> সারা দেশে ডেলিভারি</div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> অথেন্টিক ওয়ারেন্টি</div>
              </div>
            </div>

            {/* Hero stats card */}
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20 relative">
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-semibold">
                ICT Bhaban, Dhaka
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">Shop 104</div>
                  <div className="text-xs text-muted-foreground">Head Office</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">Shop 105</div>
                  <div className="text-xs text-muted-foreground">Branch Office</div>
                </div>
                <div className="col-span-2 pt-4 border-t border-border/60 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">প্রোডাক্ট ক্যাটাগরি</span><span className="font-semibold">২৩+</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">ব্র্যান্ড</span><span className="font-semibold">৩৭+</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">সাপোর্ট</span><span className="font-semibold">৭ দিন</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">ডেলিভারি</span><span className="font-semibold">সারা বাংলাদেশ</span></div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-md text-xs text-center">
                <div className="font-semibold text-primary">📞 {BUSINESS.phone}</div>
                <div className="text-muted-foreground mt-0.5">অর্ডার ও ইনকয়ারির জন্য কল করুন</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Promotional banner */}
      <section className="container mx-auto px-4">
        <div className="rounded-xl bg-gradient-to-r from-primary to-chart-2 p-6 md:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 tech-grid opacity-10"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-primary-foreground/20 text-primary-foreground">সীমিত সময়ের অফার</Badge>
              <h3 className="text-2xl md:text-3xl font-bold">গেমিং পিসি বিল্ড করুন ৫% ছাড়ে</h3>
              <p className="opacity-90 mt-1">কাস্টম কনফিগারেশনের উপর বিশেষ ছাড় এবং ফ্রি অ্যাসেম্বলি</p>
            </div>
            <Button size="lg" variant="secondary" onClick={() => navigate({ name: 'pc-configurator' })} className="shrink-0">
              এখনই বিল্ড করুন <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">ক্যাটাগরি ব্রাউজ করুন</h2>
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
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-card hover:border-primary hover:shadow-md transition"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-medium text-center line-clamp-2">{cat.name}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">ফিচার্ড প্রোডাক্ট</h2>
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

      {/* New arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">নতুন এসেছে</h2>
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

      {/* Service highlights */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'অরিজিনাল ওয়ারেন্টি', desc: 'প্রতিটি প্রোডাক্টে অথেন্টিক ওয়ারেন্টি' },
            { icon: Truck, title: 'দ্রুত ডেলিভারি', desc: 'ঢাকায় ২৪ ঘন্টা, সারা দেশে ৩-৫ দিন' },
            { icon: Headphones, title: '৭/৭ সাপোর্ট', desc: 'দক্ষ টেকনিক্যাল টিম সবসময় পাশে' },
          ].map((s, i) => (
            <Card key={i} className="p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
