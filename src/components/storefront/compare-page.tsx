// Compare Page - side-by-side product comparison
'use client';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, BarChart3, Check, Minus } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export function ComparePage() {
  const compareList = useAppStore((s) => s.compareList);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const navigate = useAppStore((s) => s.navigate);

  // Fetch all products in compare list
  const fetchUrl = compareList.length > 0
    ? `/api/products?q=&limit=100`  // We'll filter client-side
    : null;
  const { data, loading } = useApi<{ products: any[] }>(fetchUrl);

  const products = (data?.products || []).filter((p) => compareList.includes(p.id));

  if (compareList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="font-semibold text-lg mb-2">তুলনা লিস্ট খালি</h2>
        <p className="text-sm text-muted-foreground mb-4">তুলনা করতে প্রোডাক্ট যোগ করুন (সর্বোচ্চ ৪টি)</p>
        <Button onClick={() => navigate({ name: 'catalog' })}>প্রোডাক্ট দেখুন</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> প্রোডাক্ট তুলনা ({products.length})
        </h1>
        <Button variant="ghost" size="sm" onClick={clearCompare}>সব সাফ করুন</Button>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <tbody>
                {/* Headers */}
                <tr className="border-b border-border">
                  <td className="p-4 font-semibold text-muted-foreground w-32">প্রোডাক্ট</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 min-w-[200px] align-top">
                      <button onClick={() => useAppStore.getState().toggleCompare(p.id)} className="float-right text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                      <div className="aspect-square w-full max-w-[160px] rounded-md overflow-hidden bg-secondary/30 mb-2">
                        {p.primaryImage ? (
                          <img src={p.primaryImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <button onClick={() => navigate({ name: 'product', productId: p.id })} className="font-medium text-left hover:text-primary">
                        {p.name}
                      </button>
                      {p.brand && <Badge variant="secondary" className="mt-1">{p.brand.name}</Badge>}
                    </td>
                  ))}
                </tr>

                <CompareRow label="দাম" products={products} getValue={(p) => formatMoney(p.sellingPrice)} />
                <CompareRow label="স্টক" products={products} getValue={(p) => `${p.totalStock || 0} পিস`} />
                <CompareRow label="ওয়ারেন্টি" products={products} getValue={(p) => p.warrantyMonths ? `${p.warrantyMonths} মাস` : 'নেই'} />
                <CompareRow label="৩ডি ভিউ" products={products} getValue={(p) => p.has3dModel ? 'আছে' : 'নেই'} />
                <CompareRow label="SKU" products={products} getValue={(p) => p.sku} />
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function CompareRow({ label, products, getValue }: { label: string; products: any[]; getValue: (p: any) => string }) {
  return (
    <tr className="border-b border-border/40">
      <td className="p-4 font-medium text-muted-foreground">{label}</td>
      {products.map((p) => (
        <td key={p.id} className="p-4">{getValue(p) || <Minus className="h-3 w-3 text-muted-foreground/40" />}</td>
      ))}
    </tr>
  );
}
