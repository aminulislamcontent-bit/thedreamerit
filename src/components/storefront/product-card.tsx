// Premium Product Card V2 - with video-quality images, discount badges, 3D indicator, WhatsApp inquiry
'use client';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, getStockStatus } from '@/lib/format';
import { ShoppingCart, BarChart3, Check, Package2, MessageCircle, Eye, Sparkles, Clock } from 'lucide-react';
import { apiPost } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { BUSINESS } from '@/lib/config';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    sellingPrice: number;
    compareAtPrice?: number | null;
    promotionalPrice?: number | null;
    brand?: { name: string } | null;
    primaryImage?: string | null;
    totalStock?: number;
    isFeatured?: boolean;
    has3dModel?: boolean;
    supportsConfigurator?: boolean;
    warrantyMonths?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useAppStore((s) => s.navigate);
  const compareList = useAppStore((s) => s.compareList);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const { user } = useAuth();

  const stockStatus = getStockStatus(product.totalStock || 0);
  const isCompared = compareList.includes(product.id);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.sellingPrice) / product.compareAtPrice!) * 100)
    : 0;
  const savingsAmount = hasDiscount ? product.compareAtPrice! - product.sellingPrice : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate({ name: 'customer-auth' });
      return;
    }
    try {
      await apiPost('/api/cart', { productId: product.id, quantity: 1 });
      toast.success('কার্টে যুক্ত হয়েছে', { description: product.name });
      const r = await fetch('/api/cart');
      const d = await r.json();
      useAppStore.getState().setCartCount(d.data?.itemCount || 0);
    } catch (e: any) {
      toast.error('কার্টে যোগ করতে সমস্যা', { description: e.message });
    }
  };

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `আসসালামু আলাইকুম, আমি "${product.name}" (SKU: ${product.sku}) প্রোডাক্টটি সম্পর্কে জানতে চাই। দাম: ${formatMoney(product.sellingPrice)}`;
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(product.id);
    toast.success(isCompared ? 'তুলনা থেকে সরানো হয়েছে' : 'তুলনায় যোগ করা হয়েছে', { description: product.name });
  };

  return (
    <Card
      className="product-card relative p-0 cursor-pointer overflow-hidden group border-border/60 hover:border-emerald-500/40"
      onClick={() => navigate({ name: 'product', productId: product.id })}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/30 to-secondary/10">
        {product.primaryImage ? (
          <img
            src={product.primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/30">
            <Package2 className="h-16 w-16" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {product.isFeatured && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white shadow-md gap-1">
              <Sparkles className="h-2.5 w-2.5" /> ফিচার্ড
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-red-500 hover:bg-red-500 text-white shadow-md">
              -{discountPercent}%
            </Badge>
          )}
          {product.has3dModel && (
            <Badge variant="secondary" className="bg-violet-600/90 hover:bg-violet-600 text-white shadow-md backdrop-blur">
              3D
            </Badge>
          )}
          {product.totalStock <= 5 && product.totalStock > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white shadow-md gap-1">
              <Clock className="h-2.5 w-2.5" /> সীমিত স্টক
            </Badge>
          )}
        </div>

        {/* Top-right: Compare */}
        <button
          onClick={handleCompare}
          className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition shadow-md ${
            isCompared ? 'bg-emerald-600 text-white' : 'bg-background/90 backdrop-blur hover:bg-emerald-500 hover:text-white'
          }`}
          title="তুলনায় যোগ করুন"
        >
          {isCompared ? <Check className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
        </button>

        {/* Hover actions overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 h-8 text-xs backdrop-blur bg-background/95 shadow-md gap-1"
            onClick={(e) => { e.stopPropagation(); navigate({ name: 'product', productId: product.id }); }}
          >
            <Eye className="h-3 w-3" /> বিস্তারিত
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 backdrop-blur bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            onClick={handleWhatsAppInquiry}
            title="WhatsApp এ জিজ্ঞাসা করুন"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wide text-emerald-600 font-bold">{product.brand.name}</div>
        )}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block h-2 w-2 rounded-full ${stockStatus.color === 'red' ? 'bg-red-500' : stockStatus.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-[11px] text-muted-foreground">{stockStatus.labelBn}</span>
          {product.warrantyMonths ? (
            <span className="text-[11px] text-muted-foreground ml-auto">{product.warrantyMonths}m ওয়ারেন্টি</span>
          ) : null}
        </div>

        <div className="pt-1 flex items-end justify-between gap-2">
          <div>
            <div className="font-bold text-base text-emerald-700">{formatMoney(product.sellingPrice)}</div>
            {hasDiscount && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground line-through">{formatMoney(product.compareAtPrice!)}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">৳{savingsAmount.toLocaleString('en-IN')} সাশ্রয়</span>
              </div>
            )}
          </div>
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-md"
            onClick={handleAddToCart}
            title="কার্টে যোগ করুন"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
