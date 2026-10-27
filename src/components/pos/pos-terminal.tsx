// POS Terminal - cashier interface
'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi, apiPost } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, ShoppingCart, X, Plus, Minus, CreditCard, Receipt, ChevronLeft, Package2 } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { PAYMENT_METHODS } from '@/lib/config';

export function PosTerminal() {
  const navigate = useAppStore((s) => s.navigate);
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Array<{ productId: string; name: string; sku: string; price: number; quantity: number; image?: string | null }>>([]);
  const [branchId, setBranchId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  const { data: branchesData } = useApi<any>('/api/branches');
  const params = new URLSearchParams();
  params.set('admin', '1');
  params.set('limit', '100');
  if (search) params.set('q', search);
  const { data: productsData } = useApi<any>(`/api/products?${params.toString()}`);

  useEffect(() => {
    if (branchesData?.branches?.[0] && !branchId) {
      setBranchId(branchesData.branches[0].id);
    }
  }, [branchesData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-8 w-8" /></div>;
  }

  if (!user || !['CASHIER', 'SALESPERSON', 'BRANCH_MANAGER', 'ADMINISTRATOR', 'SUPER_ADMIN'].some(r => user.roles.includes(r))) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="font-semibold text-lg mb-2">POS অ্যাক্সেস নেই</h2>
        <Button onClick={() => navigate({ name: 'home' })}>হোমে ফিরুন</Button>
      </div>
    );
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: product.sellingPrice, quantity: 1, image: product.primaryImage }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.productId !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.0; // configurable
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('কার্ট খালি'); return; }
    if (!branchId) { toast.error('ব্রাঞ্চ নির্বাচন করুন'); return; }
    setSubmitting(true);
    try {
      const result = await apiPost('/api/orders', {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || 'N/A',
        branchId,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
        paymentMethod,
        type: 'POS',
      });
      toast.success('বিক্রি সফল!', { description: result.order.orderNumber });
      setCart([]); setCustomerName(''); setCustomerPhone('');
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ name: 'home' })}><ChevronLeft className="h-4 w-4" /></Button>
          <h1 className="font-bold text-lg flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> POS টার্মিনাল</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{user.name}</Badge>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{branchesData?.branches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-4 p-4 overflow-hidden">
        {/* Products section */}
        <div className="space-y-3 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="প্রোডাক্ট খুঁজুন (নাম, SKU বা বারকোড)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11" autoFocus />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto scrollbar-thin pb-4">
            {productsData?.products?.map((p: any) => (
              <Card key={p.id} className="p-3 cursor-pointer hover:border-primary hover:shadow-md transition product-card" onClick={() => addToCart(p)}>
                <div className="aspect-square mb-2 rounded bg-secondary/30 overflow-hidden">
                  {p.primaryImage ? <img src={p.primaryImage} alt={p.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Package2 className="h-8 w-8 text-muted-foreground/40" /></div>}
                </div>
                <div className="text-xs font-medium line-clamp-2 min-h-[2rem]">{p.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="font-bold text-primary text-sm">{formatMoney(p.sellingPrice)}</div>
                  <Badge variant={p.totalStock > 0 ? 'secondary' : 'destructive'} className="text-[10px]">{p.totalStock}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart section */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> কার্ট ({cart.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-12"><Package2 className="h-10 w-10 mx-auto mb-2 opacity-40" />কার্টে প্রোডাক্ট যোগ করুন</div>
            ) : cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
                <div className="h-10 w-10 rounded bg-secondary overflow-hidden shrink-0">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{formatMoney(item.price)} × {item.quantity}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="text-sm w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.productId)}><X className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="কাস্টমার নাম" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <Input placeholder="ফোন" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">পেমেন্ট মেথড</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.code} value={m.code}>{m.labelBn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ট্যাক্স</span><span>{formatMoney(tax)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-1"><span>সর্বমোট</span><span className="text-primary">{formatMoney(total)}</span></div>
            </div>
            <Button className="w-full gap-2" size="lg" onClick={handleCheckout} disabled={submitting || cart.length === 0}>
              <CreditCard className="h-4 w-4" /> {submitting ? 'প্রসেস হচ্ছে...' : 'বিক্রি সম্পন্ন করুন'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
