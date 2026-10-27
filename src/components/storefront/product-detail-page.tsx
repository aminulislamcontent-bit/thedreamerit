// Product Detail Page - full product information, 3D viewer, specs, reviews, add to cart
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { Viewer3D } from '@/components/viewer/viewer-3d';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart, BarChart3, Shield, Truck, Headphones, Award, Check,
  Package2, ChevronRight, Star, MapPin, Phone,
} from 'lucide-react';
import { formatMoney, getStockStatus } from '@/lib/format';
import { apiPost } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { BUSINESS } from '@/lib/config';

export function ProductDetailPage({ productId }: { productId: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const compareList = useAppStore((s) => s.compareList);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'description' | 'reviews' | 'warranty'>('specs');

  const { data, loading, error } = useApi<{ product: any }>(`/api/products/${productId}`);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="font-semibold text-lg mb-2">প্রোডাক্ট পাওয়া যায়নি</h2>
        <Button onClick={() => navigate({ name: 'catalog' })}>ক্যাটালগে ফিরুন</Button>
      </div>
    );
  }

  const { product } = data;
  const stockStatus = getStockStatus(product.totalStock || 0, product.reorderThreshold);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!user) {
      navigate({ name: 'customer-auth' });
      return;
    }
    try {
      await apiPost('/api/cart', { productId, quantity });
      toast.success('কার্টে যুক্ত হয়েছে', { description: `${quantity} × ${product.name}` });
      const r = await fetch('/api/cart');
      const d = await r.json();
      useAppStore.getState().setCartCount(d.data?.itemCount || 0);
    } catch (e: any) {
      toast.error('কার্টে যোগ করতে সমস্যা', { description: e.message });
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate({ name: 'customer-auth' });
      return;
    }
    try {
      await apiPost('/api/cart', { productId, quantity });
      navigate({ name: 'checkout' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Group attributes by sections
  const attributes = product.attributeValues?.filter((av: any) => av.valueString || av.valueNumber !== null || av.valueBoolean !== null) || [];
  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-primary">হোম</button>
        <ChevronRight className="h-3 w-3" />
        <button onClick={() => navigate({ name: 'catalog', category: product.category?.slug })} className="hover:text-primary">
          {product.category?.name}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
        {/* Left: Image / 3D */}
        <div>
          <Viewer3D
            modelUrl={product.has3dModel ? product.model3dUrl : null}
            images={product.images || []}
            productName={product.name}
          />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60">
              <Shield className="h-5 w-5 text-primary mb-1" />
              <div className="text-[10px] font-medium">১০০% অরিজিনাল</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60">
              <Truck className="h-5 w-5 text-primary mb-1" />
              <div className="text-[10px] font-medium">দ্রুত ডেলিভারি</div>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-lg border border-border/60">
              <Award className="h-5 w-5 text-primary mb-1" />
              <div className="text-[10px] font-medium">অথেন্টিক ওয়ারেন্টি</div>
            </div>
          </div>
        </div>

        {/* Right: Product info */}
        <div className="space-y-4">
          {product.brand && (
            <Badge variant="secondary" className="uppercase text-xs">{product.brand.name}</Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length} রিভিউ)` : 'এখনও কোনো রিভিউ নেই'}
            </span>
            <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
          </div>

          {/* Price */}
          <Card className="p-4 bg-secondary/30">
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-primary">{formatMoney(product.sellingPrice)}</div>
              {hasDiscount && (
                <>
                  <div className="text-lg text-muted-foreground line-through mb-1">{formatMoney(product.compareAtPrice)}</div>
                  <Badge className="bg-destructive hover:bg-destructive text-white mb-1.5">-{discountPercent}%</Badge>
                </>
              )}
            </div>
            {product.promotionalPrice && (
              <div className="text-sm text-muted-foreground mt-1">প্রোমোশনাল দাম: {formatMoney(product.promotionalPrice)}</div>
            )}
            <div className="text-xs text-muted-foreground mt-2">ভ্যাট সহ · কমপক্ষে {formatMoney(product.minSellingPrice)} (দাম সীমা)</div>
          </Card>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${stockStatus.color === 'red' ? 'bg-red-500' : stockStatus.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-sm font-medium">{stockStatus.labelBn}</span>
            <span className="text-xs text-muted-foreground">({product.totalStock || 0} পিস প্রিয়)</span>
          </div>

          {/* Quantity + actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-10 border-0 text-center rounded-none"
              />
              <Button size="icon" variant="ghost" className="h-10 w-10 rounded-none" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
            <Button onClick={handleAddToCart} variant="outline" className="flex-1 h-10 gap-2">
              <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
            </Button>
            <Button
              size="icon"
              variant={compareList.includes(productId) ? 'default' : 'outline'}
              className="h-10 w-10"
              onClick={() => toggleCompare(productId)}
              title="তুলনায় যোগ করুন"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={handleBuyNow} size="lg" className="w-full h-12 gap-2">
            এখনই কিনুন · {formatMoney(product.sellingPrice * quantity)}
          </Button>

          {/* Warranty */}
          {product.warrantyMonths > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-md">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">{product.warrantyMonths} মাস অফিসিয়াল ওয়ারেন্টি</span>
            </div>
          )}

          {/* Key specs preview */}
          {attributes.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3">মূল স্পেসিফিকেশন</h3>
              <div className="grid grid-cols-2 gap-2">
                {attributes.slice(0, 6).map((av: any) => (
                  <div key={av.id} className="text-sm">
                    <div className="text-xs text-muted-foreground">{av.categoryAttribute.name}</div>
                    <div className="font-medium">
                      {av.valueString || av.valueNumber || (av.valueBoolean ? 'হ্যাঁ' : 'না')}
                      {av.categoryAttribute.unit ? ` ${av.categoryAttribute.unit}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Support contact */}
          <Card className="p-4 bg-secondary/30">
            <div className="flex items-center gap-3">
              <Headphones className="h-5 w-5 text-primary shrink-0" />
              <div className="text-sm flex-1">
                এই প্রোডাক্ট সম্পর্কে জানতে কল করুন
              </div>
              <a href={`tel:${BUSINESS.phone}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Phone className="h-3 w-3" /> {BUSINESS.phone}
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs section */}
      <div className="mt-10">
        <div className="flex border-b border-border overflow-x-auto scrollbar-thin">
          {[
            { key: 'specs' as const, label: 'স্পেসিফিকেশন' },
            { key: 'description' as const, label: 'বিবরণ' },
            { key: 'reviews' as const, label: `রিভিউ (${reviews.length})` },
            { key: 'warranty' as const, label: 'ওয়ারেন্টি' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'specs' && (
            <Card className="p-6">
              {attributes.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                  {attributes.map((av: any) => (
                    <div key={av.id} className="flex justify-between py-2 border-b border-border/40 text-sm">
                      <span className="text-muted-foreground">{av.categoryAttribute.name}</span>
                      <span className="font-medium">
                        {av.valueString || av.valueNumber || (av.valueBoolean ? 'হ্যাঁ' : 'না')}
                        {av.categoryAttribute.unit ? ` ${av.categoryAttribute.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">এই প্রোডাক্টের জন্য কোনো স্পেসিফিকেশন তথ্য নেই।</p>
              )}
            </Card>
          )}

          {activeTab === 'description' && (
            <Card className="p-6">
              {product.fullDescription ? (
                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {product.fullDescription}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">এই প্রোডাক্টের জন্য কোনো বিস্তারিত তথ্য নেই।</p>
              )}
            </Card>
          )}

          {activeTab === 'reviews' && (
            <Card className="p-6">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="border-b border-border/40 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{r.customer?.name || 'গেস্ট'}</div>
                          {r.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
                              <Check className="mr-1 h-2.5 w-2.5" /> ভেরিফাইড
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <div className="font-medium text-sm mb-1">{r.title}</div>}
                      <p className="text-sm text-muted-foreground">{r.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">এখনও কোনো রিভিউ নেই। প্রোডাক্ট কেনার পর রিভিউ দিন।</p>
              )}
            </Card>
          )}

          {activeTab === 'warranty' && (
            <Card className="p-6 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">{product.warrantyMonths} মাস অফিসিয়াল ওয়ারেন্টি</div>
                  <p className="text-muted-foreground mt-1">
                    অরিজিনাল প্রোডাক্টের জন্য ম্যানুফ্যাকচারার ওয়ারেন্টি প্রযোজ্য। ওয়ারেন্টি ক্লেম করতে ইনভয়ের সাথে আমাদের দোকানে আসুন।
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">ডেলিভারি তথ্য</div>
                  <p className="text-muted-foreground mt-1">ঢাকায় ২৪-৪৮ ঘন্টা, সারা দেশে ৩-৫ কর্মদিবস। কুরিয়ার চার্জ লোকেশন অনুযায়ী।</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">আমাদের ঠিকানা</div>
                  <p className="text-muted-foreground mt-1">{BUSINESS.address.line1}, {BUSINESS.address.line2}, {BUSINESS.address.country}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
