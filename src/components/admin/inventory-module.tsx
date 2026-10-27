// Inventory Module - stock levels, adjustments, valuation
'use client';
import { useState } from 'react';
import { useApi, apiPost } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Boxes, AlertCircle, Search, Edit, Package } from 'lucide-react';
import { formatMoney } from '@/lib/format';

export function InventoryModule() {
  const [page, setPage] = useState(1);
  const [branchId, setBranchId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [adjustItem, setAdjustItem] = useState<any>(null);

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  if (branchId) params.set('branchId', branchId);
  if (lowStockOnly) params.set('lowStock', '1');

  const { data, loading, refetch } = useApi<any>(`/api/inventory?${params.toString()}`);
  const { data: branchesData } = useApi<any>('/api/branches');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={branchId || 'ALL'} onValueChange={(v) => setBranchId(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="সকল ব্রাঞ্চ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">সকল ব্রাঞ্চ</SelectItem>
            {branchesData?.branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant={lowStockOnly ? 'default' : 'outline'} onClick={() => setLowStockOnly(!lowStockOnly)} className="gap-1.5">
          <AlertCircle className="h-4 w-4" /> লো স্টক
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data?.inventory?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
            কোনো ইনভেন্টরি রেকর্ড নেই
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-medium">প্রোডাক্ট</th>
                  <th className="text-left p-3 font-medium">ব্রাঞ্চ</th>
                  <th className="text-right p-3 font-medium">On Hand</th>
                  <th className="text-right p-3 font-medium">Reserved</th>
                  <th className="text-right p-3 font-medium">Available</th>
                  <th className="text-right p-3 font-medium">মূল্য</th>
                  <th className="text-right p-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {data?.inventory?.map((inv: any) => (
                  <tr key={inv.id} className="border-t border-border/40 hover:bg-secondary/20">
                    <td className="p-3">
                      <div className="font-medium truncate max-w-[200px]">{inv.product.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.product.sku} · {inv.product.brand?.name}</div>
                    </td>
                    <td className="p-3 text-xs">{inv.branch?.name || inv.warehouse?.name || '—'}</td>
                    <td className="p-3 text-right font-medium">{inv.quantityOnHand}</td>
                    <td className="p-3 text-right text-amber-600">{inv.quantityReserved}</td>
                    <td className="p-3 text-right">
                      <Badge variant={inv.quantityAvailable <= inv.reorderThreshold ? 'destructive' : 'secondary'}>
                        {inv.quantityAvailable}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-medium">{formatMoney(inv.valuationUnit * inv.quantityOnHand)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setAdjustItem(inv)} title="অ্যাডজাস্ট">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AdjustStockDialog item={adjustItem} onClose={() => setAdjustItem(null)} onSuccess={refetch} />
    </div>
  );
}

function AdjustStockDialog({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess: () => void }) {
  const [newQuantity, setNewQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useState(() => {
    if (item) setNewQuantity(item.quantityOnHand);
  });

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('কারণ আবশ্যক');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/inventory', { inventoryId: item.id, newQuantity, reason });
      toast.success('স্টক আপডেট হয়েছে');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>স্টক অ্যাডজাস্ট</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="p-3 bg-secondary/30 rounded-md">
            <div className="font-medium">{item.product.name}</div>
            <div className="text-xs text-muted-foreground">বর্তমান: {item.quantityOnHand} (Available: {item.quantityAvailable})</div>
          </div>
          <div>
            <Label>নতুন পরিমাণ *</Label>
            <Input type="number" defaultValue={item.quantityOnHand} onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>অ্যাডজাস্টমেন্টের কারণ *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="যেমন: সাইকেল কাউন্ট, ড্যামেজ, ভুল এন্ট্রি" />
          </div>
          <div className="text-xs text-muted-foreground bg-amber-50 text-amber-800 p-3 rounded">
            ⚠️ সকল অ্যাডজাস্টমেন্ট অডিট লগে রেকর্ড করা হয়। এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না।
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'আপডেট হচ্ছে...' : 'অ্যাডজাস্ট করুন'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
