// Order Success Page
'use client';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Package, Phone, MapPin, ArrowRight } from 'lucide-react';
import { formatMoney, formatDateTime } from '@/lib/format';
import { BUSINESS } from '@/lib/config';

export function OrderSuccessPage({ orderId }: { orderId: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data, loading } = useApi<{ order: any }>(`/api/orders/${orderId}`);

  const order = data?.order;

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">অর্ডার সফল হয়েছে!</h1>
        <p className="text-muted-foreground mb-6">আপনার অর্ডারটি গ্রহণ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>

        {loading ? (
          <div className="text-sm text-muted-foreground">অর্ডার তথ্য লোড হচ্ছে...</div>
        ) : order ? (
          <div className="text-left space-y-3 bg-secondary/30 rounded-lg p-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">অর্ডার নম্বর</span>
              <span className="font-bold text-primary">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">অর্ডারের তারিখ</span>
              <span>{formatDateTime(order.createdAt, 'bn')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">স্ট্যাটাস</span>
              <span className="font-medium">{order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">মোট পরিমাণ</span>
              <span className="font-bold">{formatMoney(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">পেমেন্ট</span>
              <span className="font-medium">{order.paymentStatus}</span>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="text-xs text-muted-foreground mb-1">ডেলিভারি ঠিকানা:</div>
              <div className="text-sm">{order.customerName} · {order.customerPhone}</div>
              <div className="text-sm text-muted-foreground">{order.shippingAddress}</div>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> হেল্পলাইন: {BUSINESS.phone}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate({ name: 'track-order' })}>
            <Package className="h-4 w-4" /> অর্ডার ট্র্যাক করুন
          </Button>
          <Button className="flex-1 gap-2" onClick={() => navigate({ name: 'catalog' })}>
            আরও কেনাকানা করুন <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
