// Orders Module - list, view, status updates
'use client';
import { useState } from 'react';
import { useApi, apiPost } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatMoney, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '@/lib/config';

export function OrdersModule() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  if (status) params.set('status', status);
  if (search) params.set('q', search);

  const { data, loading, refetch } = useApi<any>(`/api/orders?${params.toString()}`);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await apiPost(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`অর্ডার স্ট্যাটাস আপডেট হয়েছে: ${ORDER_STATUS_LABELS[newStatus]?.bn}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="অর্ডার নম্বর, নাম বা ফোন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status || 'ALL'} onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সকল</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.bn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data?.orders?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
            কোনো অর্ডার নেই
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-medium">অর্ডার #</th>
                  <th className="text-left p-3 font-medium">কাস্টমার</th>
                  <th className="text-right p-3 font-medium">পরিমাণ</th>
                  <th className="text-center p-3 font-medium">স্ট্যাটাস</th>
                  <th className="text-center p-3 font-medium">পেমেন্ট</th>
                  <th className="text-left p-3 font-medium">তারিখ</th>
                  <th className="text-right p-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {data?.orders?.map((o: any) => {
                  const statusInfo = ORDER_STATUS_LABELS[o.status] || ORDER_STATUS_LABELS.PENDING;
                  const allowedNext = (ORDER_STATUS_FLOW as any)[o.status] || [];
                  return (
                    <tr key={o.id} className="border-t border-border/40 hover:bg-secondary/20">
                      <td className="p-3">
                        <button onClick={() => setSelectedOrder(o.id)} className="font-medium text-primary hover:underline">
                          {o.orderNumber}
                        </button>
                        <div className="text-xs text-muted-foreground">{o.branch?.name || 'অনলাইন'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{o.customerName}</div>
                        <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-primary">{formatMoney(o.totalAmount)}</td>
                      <td className="p-3 text-center">
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>{statusInfo.bn}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={o.paymentStatus === 'PAID' ? 'secondary' : o.paymentStatus === 'UNPAID' ? 'destructive' : 'outline'}>
                          {o.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">{formatDateTime(o.createdAt, 'bn')}</td>
                      <td className="p-3 text-right">
                        {allowedNext.length > 0 && (
                          <Select onValueChange={(v) => handleStatusUpdate(o.id, v)}>
                            <SelectTrigger className="h-7 w-[140px] text-xs">
                              <SelectValue placeholder="স্ট্যাটাস" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedNext.map((s: string) => (
                                <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]?.bn}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrderDetailDialog orderId={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusUpdate={refetch} />
    </div>
  );
}

function OrderDetailDialog({ orderId, onClose, onStatusUpdate }: { orderId: string | null; onClose: () => void; onStatusUpdate: () => void }) {
  const { data, loading } = useApi<any>(orderId ? `/api/orders/${orderId}` : null);

  if (!orderId) return null;

  return (
    <Dialog open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>অর্ডার বিস্তারিত</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2 p-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
        ) : data?.order ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">অর্ডার নম্বর</div><div className="font-bold text-primary">{data.order.orderNumber}</div></div>
              <div><div className="text-xs text-muted-foreground">তারিখ</div><div>{formatDateTime(data.order.createdAt, 'bn')}</div></div>
              <div><div className="text-xs text-muted-foreground">কাস্টমার</div><div>{data.order.customerName}</div></div>
              <div><div className="text-xs text-muted-foreground">ফোন</div><div>{data.order.customerPhone}</div></div>
              <div className="col-span-2"><div className="text-xs text-muted-foreground">ঠিকানা</div><div>{data.order.shippingAddress}</div></div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="text-sm font-medium mb-2">আইটেমসমূহ</div>
              <div className="space-y-1">
                {data.order.items.map((i: any) => (
                  <div key={i.id} className="flex justify-between text-sm p-2 hover:bg-secondary/30 rounded">
                    <div>{i.productName} × {i.quantity}</div>
                    <div className="font-medium">{formatMoney(i.totalAmount)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>সাবটোটাল</span><span>{formatMoney(data.order.subtotal)}</span></div>
                <div className="flex justify-between"><span>ট্যাক্স</span><span>{formatMoney(data.order.taxAmount)}</span></div>
                <div className="flex justify-between"><span>ডেলিভারি</span><span>{formatMoney(data.order.shippingAmount)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>সর্বমোট</span><span className="text-primary">{formatMoney(data.order.totalAmount)}</span></div>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="text-sm font-medium mb-2">স্ট্যাটাস হিস্ট্রি</div>
              <div className="space-y-1">
                {data.order.statusHistory.map((s: any, i: number) => (
                  <div key={i} className="text-xs flex justify-between p-1">
                    <span><Badge variant="outline" className="mr-1">{s.status}</Badge> {s.notes}</span>
                    <span className="text-muted-foreground">{formatDateTime(s.createdAt, 'bn')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
