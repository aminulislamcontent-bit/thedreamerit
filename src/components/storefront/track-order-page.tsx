// Track Order Page
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS } from '@/lib/config';
import { formatMoney, formatDateTime } from '@/lib/format';
import { Package, Search, CheckCircle2, Clock, Truck, MapPin } from 'lucide-react';
import { apiHandler } from '@/lib/api';

export function TrackOrderPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber && !phone) {
      setError('অর্ডার নম্বর বা ফোন নম্বর দিন');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (orderNumber) params.set('orderNumber', orderNumber);
      if (phone) params.set('phone', phone);
      const res = await fetch(`/api/track?${params.toString()}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || 'অর্ডার পাওয়া যায়নি');
      setOrders(data.data.orders);
    } catch (e: any) {
      setError(e.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (['DISPATCHED'].includes(status)) return <Truck className="h-4 w-4 text-blue-500" />;
    if (['CONFIRMED', 'PROCESSING', 'PACKED'].includes(status)) return <Package className="h-4 w-4 text-violet-500" />;
    return <Clock className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">অর্ডার ট্র্যাক করুন</h1>
      <p className="text-muted-foreground text-sm mb-6">আপনার অর্ডার নম্বর বা ফোন নম্বর দিয়ে অর্ডার খুঁজুন</p>

      <Card className="p-5 mb-6">
        <form onSubmit={handleSearch} className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <Label htmlFor="orderNo">অর্ডার নম্বর</Label>
            <Input id="orderNo" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="DIT-2026-00001" />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="phone">ফোন নম্বর</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" className="w-full gap-1.5" disabled={loading}>
              <Search className="h-4 w-4" /> {loading ? 'খুঁজছি...' : 'খুঁজুন'}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </Card>

      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.PENDING;
            return (
              <Card key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-bold text-lg">{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(order.createdAt, 'bn')}</div>
                  </div>
                  <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-700 flex items-center gap-1`}>
                    {getStatusIcon(order.status)} {statusInfo.bn}
                  </Badge>
                </div>

                {/* Status timeline */}
                <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-thin">
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'DELIVERED'].map((s, idx) => {
                    const isActive = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'DISPATCHED', 'DELIVERED'].indexOf(order.status) >= idx;
                    return (
                      <div key={s} className="flex items-center shrink-0">
                        <div className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {idx + 1}
                          </div>
                          <div className="text-[10px]">{ORDER_STATUS_LABELS[s]?.bn}</div>
                        </div>
                        {idx < 5 && <div className={`h-0.5 w-8 ${isActive ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    );
                  })}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary/30 shrink-0">
                        {item.primaryImage ? (
                          <img src={item.primaryImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 m-3 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">পরিমাণ: {item.quantity} × {formatMoney(item.unitPrice)}</div>
                      </div>
                      <div className="text-sm font-medium">{formatMoney(item.totalAmount)}</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 flex flex-wrap justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {order.shippingAddress || 'ঠিকানা নেই'}
                  </div>
                  <div className="font-bold text-primary">সর্বমোট: {formatMoney(order.totalAmount)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {orders && orders.length === 0 && !error && (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">কোনো অর্ডার পাওয়া যায়নি</p>
        </Card>
      )}
    </div>
  );
}
