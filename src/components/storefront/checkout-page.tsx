// Checkout Page - shipping info + payment method + place order
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi, apiPost } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PAYMENT_METHODS, BANGLADESH_DISTRICTS } from '@/lib/config';
import { formatMoney } from '@/lib/format';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Truck, ShieldCheck } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { user } = useAuth();
  const { data: cartData } = useApi<{ items: any[]; total: number }>('/api/cart');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    shippingAddress: '',
    shippingCity: '',
    shippingDistrict: 'Dhaka',
    notes: '',
  });

  const items = cartData?.items || [];
  const subtotal = cartData?.total || 0;
  const shipping = subtotal > 0 ? 80 : 0;
  const total = subtotal + shipping;

  const handleSubmit = async () => {
    if (!form.customerName || !form.customerPhone || !form.shippingAddress) {
      toast.error('অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য পূরণ করুন');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiPost<{ order: { id: string; orderNumber: string } }>('/api/orders', {
        ...form,
        items: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          configuration: i.configuration,
        })),
        paymentMethod,
        shippingAmount: shipping,
      });
      toast.success('অর্ডার সফল হয়েছে!', { description: `অর্ডার নম্বর: ${result.order.orderNumber}` });
      useAppStore.getState().setCartCount(0);
      navigate({ name: 'order-success', orderId: result.order.id });
    } catch (e: any) {
      toast.error('অর্ডার করতে সমস্যা', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">আপনার কার্ট খালি</p>
        <Button onClick={() => navigate({ name: 'catalog' })}>প্রোডাক্ট দেখুন</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <button onClick={() => navigate({ name: 'cart' })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-3 w-3" /> কার্টে ফিরুন
      </button>
      <h1 className="text-2xl font-bold mb-6">চেকআউট</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Shipping info */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> ডেলিভারি তথ্য</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">নাম *</Label>
                <Input id="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="phone">ফোন নম্বর *</Label>
                <Input id="phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="district">জেলা</Label>
                <Select value={form.shippingDistrict} onValueChange={(v) => setForm({ ...form, shippingDistrict: v })}>
                  <SelectTrigger id="district"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANGLADESH_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">পূর্ণ ঠিকানা *</Label>
                <Input id="address" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} placeholder="বাসা/অফিস, রোড, এলাকা" required />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">অর্ডার নোট (ঐচ্ছিক)</Label>
                <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="বিশেষ নির্দেশনা..." />
              </div>
            </div>
          </Card>

          {/* Payment method */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> পেমেন্ট মেথড</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid md:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Label key={m.code} htmlFor={`m-${m.code}`} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition ${paymentMethod === m.code ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                  <RadioGroupItem value={m.code} id={`m-${m.code}`} />
                  <div>
                    <div className="font-medium text-sm">{m.labelBn}</div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> অর্ডার নিশ্চিত হওয়ার পর আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন পেমেন্ট নিশ্চিত করতে।
            </p>
          </Card>
        </div>

        {/* Order summary */}
        <Card className="p-5 sticky top-32 self-start h-fit">
          <h3 className="font-semibold mb-3">অর্ডার সারাংশ</h3>
          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto scrollbar-thin">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">×{item.quantity}</div>
                </div>
                <div className="font-medium">{formatMoney(item.total)}</div>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span>{formatMoney(shipping)}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold"><span>সর্বমোট</span><span className="text-primary">{formatMoney(total)}</span></div>
          </div>
          <Button className="w-full mt-4" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'অর্ডার করা হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
