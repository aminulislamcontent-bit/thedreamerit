// Products Module - list, create, edit, approval workflow, publish
'use client';
import { useState } from 'react';
import { useApi, apiPost } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Package, Check, X, Eye, Edit, Globe, AlertCircle } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { useAppStore } from '@/lib/store';

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ড্রাফট', color: 'bg-secondary text-foreground' },
  PENDING_REVIEW: { label: 'রিভিউ অপেক্ষমাণ', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'অনুমোদিত', color: 'bg-blue-100 text-blue-700' },
  PUBLISHED: { label: 'প্রকাশিত', color: 'bg-emerald-100 text-emerald-700' },
  ARCHIVED: { label: 'আর্কাইভড', color: 'bg-red-100 text-red-700' },
};

export function ProductsModule() {
  const navigate = useAppStore((s) => s.navigate);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const params = new URLSearchParams();
  params.set('admin', '1');
  params.set('page', String(page));
  params.set('limit', '20');
  if (status) params.set('status', status);
  if (search) params.set('q', search);

  const { data, loading, refetch } = useApi<any>(`/api/products?${params.toString()}`);
  const { data: catData } = useApi<any>('/api/categories');
  const { data: brandData } = useApi<any>('/api/brands');

  const products = data?.products || [];

  const handleAction = async (id: string, action: string, reason?: string) => {
    try {
      if (action === 'publish' || action === 'unpublish') {
        await apiPost(`/api/products/${id}/publish`, { publish: action === 'publish' });
      } else {
        await apiPost(`/api/products/${id}/approve`, { action, reason });
      }
      toast.success('অ্যাকশন সফল হয়েছে');
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="প্রোডাক্ট খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full" />
          </div>
          <Select value={status || 'ALL'} onValueChange={(v) => setStatus(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="স্ট্যাটাস" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">সকল</SelectItem>
              <SelectItem value="DRAFT">ড্রাফট</SelectItem>
              <SelectItem value="PENDING_REVIEW">রিভিউ অপেক্ষমাণ</SelectItem>
              <SelectItem value="APPROVED">অনুমোদিত</SelectItem>
              <SelectItem value="PUBLISHED">প্রকাশিত</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
        </Button>
      </div>

      {/* Products table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
            কোনো প্রোডাক্ট পাওয়া যায়নি
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase">
                <tr>
                  <th className="text-left p-3 font-medium">প্রোডাক্ট</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-right p-3 font-medium">দাম</th>
                  <th className="text-center p-3 font-medium">স্টক</th>
                  <th className="text-center p-3 font-medium">স্ট্যাটাস</th>
                  <th className="text-right p-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-secondary/20">
                    <td className="p-3">
                      <button onClick={() => navigate({ name: 'product', productId: p.id })} className="flex items-center gap-3 text-left hover:text-primary">
                        <div className="h-10 w-10 rounded bg-secondary/30 overflow-hidden shrink-0">
                          {p.primaryImage && <img src={p.primaryImage} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[200px]">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.brand?.name}</div>
                        </div>
                      </button>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{p.sku}</td>
                    <td className="p-3 text-right font-medium">{formatMoney(p.sellingPrice)}</td>
                    <td className="p-3 text-center">
                      <Badge variant={p.totalStock > 5 ? 'secondary' : 'destructive'}>{p.totalStock}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={STATUS_INFO[p.status].color}>{STATUS_INFO[p.status].label}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'DRAFT' && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'submit')} title="রিভিউতে পাঠান">
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        {p.status === 'PENDING_REVIEW' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'approve')} title="অনুমোদন">
                              <Check className="h-3 w-3 text-emerald-500" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'reject')} title="প্রত্যাখ্যান">
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'publish')} title="প্রকাশ করুন">
                            <Globe className="h-3 w-3 text-emerald-500" />
                          </Button>
                        )}
                        {p.status === 'PUBLISHED' && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'unpublish')} title="আনপাবলিশ">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate({ name: 'product', productId: p.id })} title="দেখুন">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data?.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>পূর্ববর্তী</Button>
          <span className="text-sm text-muted-foreground">পেজ {page} / {data.pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data.pagination.totalPages}>পরবর্তী</Button>
        </div>
      )}

      {/* Create product dialog */}
      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} categories={catData?.categories} brands={brandData?.brands} onSuccess={refetch} />
    </div>
  );
}

function CreateProductDialog({ open, onOpenChange, categories, brands, onSuccess }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', categorySlug: '', brandSlug: '',
    shortDescription: '', fullDescription: '',
    sellingPrice: 0, costPrice: 0, minSellingPrice: 0,
    warrantyMonths: 0, taxRate: 0, reorderThreshold: 5,
    metaTitle: '', metaDescription: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.categorySlug) {
      toast.error('নাম, SKU এবং ক্যাটাগরি আবশ্যক');
      return;
    }
    if (form.minSellingPrice > 0 && form.sellingPrice < form.minSellingPrice) {
      toast.error('বিক্রয় দাম ন্যূনতম বিক্রয় দামের নিচে হতে পারবে না');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/products', form);
      toast.success('প্রোডাক্ট তৈরি হয়েছে (ড্রাফট স্ট্যাটাসে)');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', sku: '', barcode: '', categorySlug: '', brandSlug: '', shortDescription: '', fullDescription: '', sellingPrice: 0, costPrice: 0, minSellingPrice: 0, warrantyMonths: 0, taxRate: 0, reorderThreshold: 5, metaTitle: '', metaDescription: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নতুন প্রোডাক্ট তৈরি করুন</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-3 py-2">
          <div className="md:col-span-2">
            <Label>নাম *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>SKU *</Label>
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <Label>বারকোড</Label>
            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <Label>ক্যাটাগরি *</Label>
            <Select value={form.categorySlug} onValueChange={(v) => setForm({ ...form, categorySlug: v })}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {categories?.map((c: any) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ব্র্যান্ড</Label>
            <Select value={form.brandSlug} onValueChange={(v) => setForm({ ...form, brandSlug: v })}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {brands?.map((b: any) => <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>বিক্রয় দাম (৳)</Label>
            <Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>কস্ট দাম (৳)</Label>
            <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>ন্যূনতম বিক্রয় দাম (৳)</Label>
            <Input type="number" value={form.minSellingPrice} onChange={(e) => setForm({ ...form, minSellingPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>ওয়ারেন্টি (মাস)</Label>
            <Input type="number" value={form.warrantyMonths} onChange={(e) => setForm({ ...form, warrantyMonths: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="md:col-span-2">
            <Label>সংক্ষিপ্ত বিবরণ</Label>
            <Textarea value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} rows={2} />
          </div>
          <div className="md:col-span-2">
            <Label>বিস্তারিত বিবরণ</Label>
            <Textarea value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} rows={4} />
          </div>
          <div>
            <Label>মেটা টাইটেল</Label>
            <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
          </div>
          <div>
            <Label>মেটা ডেসক্রিপশন</Label>
            <Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
          </div>
        </div>
        <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>নতুন প্রোডাক্ট "ড্রাফট" স্ট্যাটাসে তৈরি হবে। রিভিউ ও অনুমোদনের পরেই ওয়েবসাইটে প্রকাশ করা যাবে।</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'তৈরি হচ্ছে...' : 'প্রোডাক্ট তৈরি করুন'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
