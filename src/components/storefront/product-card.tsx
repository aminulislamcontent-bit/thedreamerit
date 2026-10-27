// Product Card - shared component for catalog/grids
'use client';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, getStockStatus } from '@/lib/format';
import { ShoppingCart, BarChart3, Eye, Check, Package2 } from 'lucide-react';
import { apiPost } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate({ name: 'customer-auth' });
      return;
    }
    try {
      await apiPost('/api/cart', { productId: product.id, quantity: 1 });
      toast.success('কার্টে যুক্ত হয়েছে', { description: product.name });
      // Refresh cart count
      const r = await fetch('/api/cart');
      const d = await r.json();
      useAppStore.getState().setCartCount(d.data?.itemCount || 0);
    } catch (e: any) {
      toast.error('কার্টে যোগ করতে সমস্যা', { description: e.message });
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(product.id);
    toast.success(isCompared ? 'তুলনা থেকে সরানো হয়েছে' : 'তুলনায় যোগ করা হয়েছে', { description: product.name });
  };

  return (
    <Card
      className="product-card relative p-3 cursor-pointer overflow-hidden group"
      onClick={() => navigate({ name: 'product', productId: product.id })}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.isFeatured && (
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white">ফিচার্ড</Badge>
        )}
        {hasDiscount && (
          <Badge className="bg-destructive hover:bg-destructive text-white">-{discountPercent}%</Badge>
        )}
        {product.has3dModel && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">3D</Badge>
        )}
      </div>

      {/* Compare button */}
      <button
        onClick={handleCompare}
        className={`absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition ${
          isCompared ? 'bg-primary text-primary-foreground' : 'bg-background/80 backdrop-blur hover:bg-primary/10'
        }`}
        title="তুলনায় যোগ করুন"
      >
        {isCompared ? <Check className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
      </button>

      {/* Image */}
      <div className="aspect-square mb-3 rounded-md overflow-hidden bg-secondary/50 flex items-center justify-center">
        {product.primaryImage ? (
          <img
            src={product.primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Package2 className="h-12 w-12 text-muted-foreground/40" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-1">
        {product.brand && (
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{product.brand.name}</div>
        )}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${stockStatus.color === 'red' ? 'bg-red-500' : stockStatus.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-[11px] text-muted-foreground">{stockStatus.labelBn}</span>
          {product.warrantyMonths ? (
            <span className="text-[11px] text-muted-foreground ml-auto">{product.warrantyMonths}m ওয়ারেন্টি</span>
          ) : null}
        </div>
        <div className="pt-1 flex items-end justify-between gap-2">
          <div>
            <div className="font-bold text-base text-primary">{formatMoney(product.sellingPrice)}</div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground line-through">{formatMoney(product.compareAtPrice!)}</div>
            )}
          </div>
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAddToCart}>
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
