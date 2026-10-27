// Cart Page
'use client';
import { useAppStore } from '@/lib/store';
import { useApi, apiDelete, apiPut } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { useState } from 'react';

export function CartPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading, refetch } = useApi<{ items: any[]; total: number; itemCount: number }>('/api/cart');
  const [updating, setUpdating] = useState(false);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(true);
    try {
      await apiPut('/api/cart', { itemId, quantity });
      await refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdating(true);
    try {
      await apiDelete(`/api/cart?itemId=${itemId}`);
      await refetch();
      toast.success('আইটেম মুছে ফেলা হয়েছে');
      const r = await fetch('/api/cart');
      const d = await r.json();
      useAppStore.getState().setCartCount(d.data?.itemCount || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (!data || data.items.length === 0) {
      toast.error('আপনার কার্ট খালি');
      return;
    }
    navigate({ name: 'checkout' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const total = data?.total || 0;
  const shipping = total > 0 ? 80 : 0; // Flat 80 BDT shipping
  const grandTotal = total + shipping;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="h-6 w-6" /> কার্ট ({items.length})
      </h1>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="font-semibold text-lg mb-2">আপনার কার্ট খালি</h2>
          <p className="text-sm text-muted-foreground mb-4">কেনাকানা শুরু করতে প্রোডাক্ট ব্রাউজ করুন</p>
          <Button onClick={() => navigate({ name: 'catalog' })}>প্রোডাক্ট দেখুন</Button>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-3">
            {items.map((item: any) => (
              <Card key={item.id} className="p-4 flex gap-4">
                <div className="h-20 w-20 rounded-md overflow-hidden bg-secondary/30 shrink-0">
                  {item.primaryImage ? (
                    <img src={item.primaryImage} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground/30">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <button onClick={() => navigate({ name: 'product', productId: item.productId })} className="font-medium text-sm hover:text-primary text-left line-clamp-2">
                    {item.name}
                  </button>
                  {item.brand && <div className="text-xs text-muted-foreground mt-0.5">{item.brand}</div>}
                  <div className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border rounded-md">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={updating}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={updating}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{formatMoney(item.total)}</div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-xs text-destructive hover:underline flex items-center gap-1 mt-0.5">
                        <Trash2 className="h-3 w-3" /> সরান
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5 sticky top-32 self-start h-fit">
            <h3 className="font-semibold mb-3">অর্ডার সারাংশ</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-medium">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                <span className="font-medium">{formatMoney(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ভ্যাট</span>
                <span className="font-medium">{formatMoney(0)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                <span className="font-semibold">সর্বমোট</span>
                <span className="font-bold text-primary">{formatMoney(grandTotal)}</span>
              </div>
            </div>
            <Button className="w-full mt-4 gap-2" onClick={handleCheckout}>
              চেকআউট <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => navigate({ name: 'catalog' })}>
              আরও কেনাকানা করুন
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
