// Multiple smaller admin modules
'use client';
import { useState } from 'react';
import { useApi, apiPost } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatMoney, formatDate, timeAgo } from '@/lib/format';
import { Plus, Search, Store, Users, Wallet, FileText, Globe, Megaphone,
  Headphones, Bell, Building2, BarChart3, ShieldAlert, Settings,
  ArrowLeftRight, Star, TrendingUp, Package, Check, X } from 'lucide-react';

// ============ SUPPLIERS MODULE ============
export function SuppliersModule() {
  const { data, loading, refetch } = useApi<any>('/api/suppliers');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', address: '', paymentTerms: '' });

  const handleCreate = async () => {
    if (!form.name) { toast.error('নাম আবশ্যক'); return; }
    try {
      await apiPost('/api/suppliers', form);
      toast.success('সাপ্লায়ার তৈরি হয়েছে');
      setOpen(false); refetch();
      setForm({ name: '', contactName: '', email: '', phone: '', address: '', paymentTerms: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">সাপ্লায়ার ব্যবস্থাপনা</h2>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> নতুন সাপ্লায়ার</Button>
      </div>
      <Card className="overflow-hidden">
        {loading ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">নাম</th><th className="text-left p-3">কোড</th>
              <th className="text-left p-3">যোগাযোগ</th><th className="text-center p-3">প্রোডাক্ট</th>
              <th className="text-right p-3">বকেয়া</th>
            </tr></thead>
            <tbody>
              {data?.suppliers?.map((s: any) => (
                <tr key={s.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3"><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">{s.legalName}</div></td>
                  <td className="p-3 text-xs font-mono">{s.code}</td>
                  <td className="p-3 text-xs">{s.phone || s.email || '—'}</td>
                  <td className="p-3 text-center">{s._count?.products || 0}</td>
                  <td className="p-3 text-right font-medium">{formatMoney(s.balanceDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>নতুন সাপ্লায়ার</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
            <div><Label>যোগাযোগ ব্যক্তি</Label><Input value={form.contactName} onChange={(e) => setForm({...form, contactName: e.target.value})} /></div>
            <div><Label>ইমেইল</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
            <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>ঠিকানা</Label><Textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} rows={2} /></div>
            <div><Label>পেমেন্ট শর্ত</Label><Input value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleCreate}>তৈরি করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ CUSTOMERS MODULE ============
export function CustomersModule() {
  const { data, loading } = useApi<any>('/api/customers');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">কাস্টমার ব্যবস্থাপনা</h2>
      <Card className="overflow-hidden">
        {loading ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">নাম</th><th className="text-left p-3">যোগাযোগ</th>
              <th className="text-center p-3">অর্ডার</th><th className="text-right p-3">মোট খরচ</th>
            </tr></thead>
            <tbody>
              {data?.customers?.map((c: any) => (
                <tr key={c.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3"><div className="font-medium">{c.name}</div></td>
                  <td className="p-3 text-xs">{c.phone || c.email || '—'}</td>
                  <td className="p-3 text-center">{c.totalOrders || 0}</td>
                  <td className="p-3 text-right font-medium">{formatMoney(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ============ EMPLOYEES MODULE ============
export function EmployeesModule() {
  const { data, loading, refetch } = useApi<any>('/api/employees');
  const { data: branchesData } = useApi<any>('/api/branches');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    designation: '', department: '', branchId: '', basicSalary: 0,
    roles: [] as string[],
  });

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.designation) {
      toast.error('নাম, ইমেইল এবং পদবি আবশ্যক'); return;
    }
    try {
      await apiPost('/api/employees', form);
      toast.success('কর্মী যোগ করা হয়েছে');
      setOpen(false); refetch();
      setForm({ fullName: '', email: '', phone: '', password: '', designation: '', department: '', branchId: '', basicSalary: 0, roles: [] });
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleRole = (role: string) => {
    setForm(s => ({ ...s, roles: s.roles.includes(role) ? s.roles.filter(r => r !== role) : [...s.roles, role] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">কর্মী ও HR ব্যবস্থাপনা</h2>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> নতুন কর্মী</Button>
      </div>
      <Card className="overflow-hidden">
        {loading ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">কোড</th><th className="text-left p-3">নাম</th>
              <th className="text-left p-3">পদবি</th><th className="text-left p-3">বিভাগ</th>
              <th className="text-left p-3">ব্রাঞ্চ</th><th className="text-left p-3">রোল</th>
              <th className="text-center p-3">স্ট্যাটাস</th>
            </tr></thead>
            <tbody>
              {data?.employees?.map((e: any) => (
                <tr key={e.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3 text-xs font-mono">{e.employeeCode}</td>
                  <td className="p-3"><div className="font-medium">{e.fullName}</div><div className="text-xs text-muted-foreground">{e.email}</div></td>
                  <td className="p-3 text-xs">{e.designation}</td>
                  <td className="p-3 text-xs">{e.department}</td>
                  <td className="p-3 text-xs">{e.branch?.name || '—'}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{e.user?.roles?.map((r: string) => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}</div></td>
                  <td className="p-3 text-center"><Badge variant={e.employmentStatus === 'ACTIVE' ? 'secondary' : 'destructive'}>{e.employmentStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>নতুন কর্মী যোগ</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-3 py-2">
            <div><Label>পূর্ণ নাম *</Label><Input value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} /></div>
            <div><Label>ইমেইল *</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
            <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>পাসওয়ার্ড (ডিফল্ট হবে Welcome@2026)</Label><Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} /></div>
            <div><Label>পদবি *</Label><Input value={form.designation} onChange={(e) => setForm({...form, designation: e.target.value})} /></div>
            <div><Label>বিভাগ</Label><Input value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} /></div>
            <div><Label>ব্রাঞ্চ</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({...form, branchId: v})}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>{branchesData?.branches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>মূল বেতন (৳)</Label><Input type="number" value={form.basicSalary} onChange={(e) => setForm({...form, basicSalary: parseFloat(e.target.value) || 0})} /></div>
            <div className="md:col-span-2"><Label>রোলসমূহ</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['SALESPERSON', 'CASHIER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'PRODUCT_MANAGER', 'PROCUREMENT_OFFICER', 'ACCOUNTANT', 'HR_MANAGER', 'MARKETING_MANAGER', 'CONTENT_REVIEWER', 'CUSTOMER_SUPPORT', 'WAREHOUSE_OPERATOR', 'ADMINISTRATOR'].map((r) => (
                  <label key={r} className={`text-xs px-2 py-1.5 rounded border cursor-pointer ${form.roles.includes(r) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-secondary'}`}>
                    <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} className="hidden" />
                    {r.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleCreate}>যোগ করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ COMMISSIONS MODULE ============
export function CommissionsModule() {
  const { data, loading } = useApi<any>('/api/commissions');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">কমিশন ব্যবস্থাপনা</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">মোট পেন্ডিং</div><div className="text-2xl font-bold text-amber-500">{formatMoney(0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">এই মাসে প্রদত্ত</div><div className="text-2xl font-bold text-emerald-500">{formatMoney(0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">সক্রিয় নিয়ম</div><div className="text-2xl font-bold">{data?.rules?.length || 0}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">কর্মী সংখ্যা</div><div className="text-2xl font-bold">{data?.transactions?.length || 0}</div></Card>
      </div>
      <Card className="p-5">
        <div className="text-center text-sm text-muted-foreground py-8">
          <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
          কমিশন ট্রানজেকশন ডেটা এখানে দেখা যাবে (এখনও কোনো ডেটা নেই)
        </div>
      </Card>
    </div>
  );
}

// ============ FINANCE MODULE ============
export function FinanceModule() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">হিসাবনিকাশ ও ফিনান্স</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-muted-foreground">মোট আয়</div><div className="text-2xl font-bold text-emerald-500">{formatMoney(0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">মোট ব্যয়</div><div className="text-2xl font-bold text-rose-500">{formatMoney(0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">স্থূল মুনাফা</div><div className="text-2xl font-bold text-primary">{formatMoney(0)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">প্রদেয়</div><div className="text-2xl font-bold">{formatMoney(0)}</div></Card>
      </div>
      <Card className="p-5">
        <div className="text-center text-sm text-muted-foreground py-8">
          <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
          ফিনান্সিয়াল রিপোর্ট এখানে দেখা যাবে। কোয়ালিফাইড অ্যাকাউন্ট্যান্ট দ্বারা যাচাই প্রয়োজন।
        </div>
      </Card>
    </div>
  );
}

// ============ CONTENT STUDIO MODULE ============
export function ContentStudioModule() {
  const { data, loading, refetch } = useApi<any>('/api/content');
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ type: 'PRODUCT_DESC_BN', productId: '', language: 'bn' });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiPost('/api/content', { ...form, generate: true });
      toast.success('AI কনটেন্ট তৈরি হয়েছে');
      setOpen(false); refetch();
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      await fetch(`/api/content/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action }) });
      toast.success('অ্যাকশন সফল');
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">AI কনটেন্ট স্টুডিও</h2>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> নতুন কনটেন্ট</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-amber-50 border-amber-200"><div className="text-xs text-amber-700">রিভিউ অপেক্ষমাণ</div><div className="text-xl font-bold text-amber-900">{data?.drafts?.filter((d:any) => d.status === 'IN_REVIEW').length || 0}</div></Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200"><div className="text-xs text-emerald-700">প্রকাশিত</div><div className="text-xl font-bold text-emerald-900">{data?.drafts?.filter((d:any) => d.status === 'PUBLISHED').length || 0}</div></Card>
        <Card className="p-3 bg-violet-50 border-violet-200"><div className="text-xs text-violet-700">AI তৈরি</div><div className="text-xl font-bold text-violet-900">{data?.drafts?.filter((d:any) => d.source === 'AI').length || 0}</div></Card>
        <Card className="p-3 bg-secondary"><div className="text-xs text-muted-foreground">সর্বমোট</div><div className="text-xl font-bold">{data?.drafts?.length || 0}</div></Card>
      </div>
      <Card className="overflow-hidden">
        {loading ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">শিরোনাম</th><th className="text-left p-3">টাইপ</th>
              <th className="text-center p-3">উৎস</th><th className="text-center p-3">স্ট্যাটাস</th>
              <th className="text-right p-3">অ্যাকশন</th>
            </tr></thead>
            <tbody>
              {data?.drafts?.map((d: any) => (
                <tr key={d.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3"><div className="font-medium truncate max-w-xs">{d.title}</div><div className="text-xs text-muted-foreground">{timeAgo(d.createdAt)}</div></td>
                  <td className="p-3 text-xs"><Badge variant="outline">{d.type}</Badge></td>
                  <td className="p-3 text-center"><Badge variant={d.source === 'AI' ? 'secondary' : 'outline'}>{d.source}</Badge></td>
                  <td className="p-3 text-center"><Badge className={d.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : d.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-secondary'}>{d.status}</Badge></td>
                  <td className="p-3 text-right">
                    {d.status === 'DRAFT' && <Button size="sm" variant="ghost" onClick={() => handleAction(d.id, 'submit_review')}>রিভিউতে পাঠান</Button>}
                    {d.status === 'IN_REVIEW' && <>
                      <Button size="sm" variant="ghost" onClick={() => handleAction(d.id, 'approve')}><Check className="h-3 w-3 text-emerald-500" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleAction(d.id, 'reject')}><X className="h-3 w-3 text-destructive" /></Button>
                    </>}
                    {d.status === 'APPROVED' && <Button size="sm" variant="ghost" onClick={() => handleAction(d.id, 'publish')}><Globe className="h-3 w-3" /></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>AI কনটেন্ট তৈরি করুন</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>কনটেন্ট টাইপ</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT_DESC_BN">প্রোডাক্ট বিবরণ (বাংলা)</SelectItem>
                  <SelectItem value="PRODUCT_DESC_EN">Product Description (English)</SelectItem>
                  <SelectItem value="SEO_TITLE">SEO টাইটেল</SelectItem>
                  <SelectItem value="META_DESC">মেটা ডেসক্রিপশন</SelectItem>
                  <SelectItem value="BUYING_GUIDE">বাইং গাইড</SelectItem>
                  <SelectItem value="SOCIAL_CAPTION">সোশ্যাল ক্যাপশন</SelectItem>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>প্রোডাক্ট ID (ঐচ্ছিক)</Label><Input value={form.productId} onChange={(e) => setForm({...form, productId: e.target.value})} placeholder="নির্দিষ্ট প্রোডাক্টের জন্য" /></div>
            <div><Label>ভাষা</Label>
              <Select value={form.language} onValueChange={(v) => setForm({...form, language: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="bn">বাংলা</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded">AI কনটেন্ট সর্বদা প্রোডাক্ট ডেটার উপর ভিত্তি করে তৈরি হয়। ভুল তথ্য এড়াতে মানব রিভিউ প্রয়োজন।</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleGenerate} disabled={generating}>{generating ? 'তৈরি হচ্ছে...' : 'AI দিয়ে তৈরি করুন'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SEO MODULE ============
export function SeoModule() {
  const { data, loading } = useApi<any>('/api/seo');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">SEO ম্যানেজমেন্ট</h2>
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div><div className="text-sm text-muted-foreground">SEO স্কোর</div><div className="text-3xl font-bold text-primary">{data?.summary?.healthScore || 0}/100</div></div>
              <BarChart3 className="h-12 w-12 text-primary/20" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div><div className="font-bold">{data?.summary?.totalProducts}</div><div className="text-xs text-muted-foreground">মোট প্রোডাক্ট</div></div>
              <div><div className="font-bold text-emerald-500">{data?.summary?.publishedProducts}</div><div className="text-xs text-muted-foreground">প্রকাশিত</div></div>
              <div><div className="font-bold text-rose-500">{data?.summary?.issuesCount}</div><div className="text-xs text-muted-foreground">সমস্যা</div></div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">সমস্যাসমূহ</h3>
            <div className="space-y-2">
              {data?.issues?.map((issue: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : issue.severity === 'HIGH' ? 'secondary' : 'outline'}>{issue.severity}</Badge>
                      {issue.code}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{issue.recommendation}</div>
                  </div>
                  <div className="text-xl font-bold">{issue.count}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ============ MARKETING MODULE ============
export function MarketingModule() {
  const { data, loading, refetch } = useApi<any>('/api/marketing');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'DISCOUNT', startDate: '', endDate: '', budget: 0, description: '' });

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) { toast.error('সকল আবশ্যক ফিল্ড পূরণ করুন'); return; }
    try {
      await apiPost('/api/marketing', form);
      toast.success('ক্যাম্পেইন তৈরি হয়েছে');
      setOpen(false); refetch();
      setForm({ name: '', type: 'DISCOUNT', startDate: '', endDate: '', budget: 0, description: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">মার্কেটিং ক্যাম্পেইন</h2>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> নতুন ক্যাম্পেইন</Button>
      </div>
      <Card className="overflow-hidden">
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">নাম</th><th className="text-left p-3">টাইপ</th>
              <th className="text-center p-3">স্ট্যাটাস</th><th className="text-right p-3">বাজেট</th>
            </tr></thead>
            <tbody>
              {data?.campaigns?.map((c: any) => (
                <tr key={c.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.description}</div></td>
                  <td className="p-3"><Badge variant="outline">{c.type}</Badge></td>
                  <td className="p-3 text-center"><Badge variant={c.status === 'ACTIVE' ? 'secondary' : 'outline'}>{c.status}</Badge></td>
                  <td className="p-3 text-right font-medium">{formatMoney(c.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>নতুন ক্যাম্পেইন</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>নাম *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
            <div><Label>টাইপ</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOUNT">ডিসকাউন্ট</SelectItem>
                  <SelectItem value="FLASH_SALE">ফ্ল্যাশ সেল</SelectItem>
                  <SelectItem value="BUNDLE">বান্ডল</SelectItem>
                  <SelectItem value="COUPON">কুপন</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>শুরু তারিখ *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} /></div>
            <div><Label>শেষ তারিখ *</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} /></div>
            <div><Label>বাজেট (৳)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({...form, budget: parseFloat(e.target.value) || 0})} /></div>
            <div><Label>বিবরণ</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleCreate}>তৈরি করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SOCIAL MODULE ============
export function SocialModule() {
  const { data, loading, refetch } = useApi<any>('/api/social');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ platform: 'FACEBOOK', title: '', content: '', scheduledAt: '' });

  const handleCreate = async () => {
    if (!form.content) { toast.error('কনটেন্ট আবশ্যক'); return; }
    try {
      const result = await apiPost('/api/social', form);
      toast.success('পাবলিশিং জব তৈরি হয়েছে');
      if (result.warning) toast.warning(result.warning);
      setOpen(false); refetch();
      setForm({ platform: 'FACEBOOK', title: '', content: '', scheduledAt: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">সোশ্যাল মিডিয়া পাবলিশিং</h2>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> নতুন পোস্ট</Button>
      </div>
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3 text-sm">
          <Megaphone className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-900">ইন্টিগ্রেশন সেটআপ প্রয়োজন</div>
            <p className="text-amber-700 mt-1">সোশ্যাল মিডিয়া পাবলিশিংয়ের জন্য প্ল্যাটফর্ম API অনুমোদন প্রয়োজন (Facebook Graph API, Instagram Professional, ইত্যাদি)। সিস্টেম সেটিংসে গিয়ে ইন্টিগ্রেশন কনফিগার করুন।</p>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">প্ল্যাটফর্ম</th><th className="text-left p-3">কনটেন্ট</th>
              <th className="text-center p-3">স্ট্যাটাস</th><th className="text-left p-3">সময়</th>
            </tr></thead>
            <tbody>
              {data?.jobs?.map((j: any) => (
                <tr key={j.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3"><Badge variant="outline">{j.platform}</Badge></td>
                  <td className="p-3"><div className="font-medium truncate max-w-xs">{j.title || j.content.slice(0, 50)}</div></td>
                  <td className="p-3 text-center"><Badge variant={j.status === 'PUBLISHED' ? 'secondary' : j.status === 'FAILED' ? 'destructive' : 'outline'}>{j.status}</Badge></td>
                  <td className="p-3 text-xs">{timeAgo(j.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent><DialogHeader><DialogTitle>নতুন সোশ্যাল পোস্ট</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>প্ল্যাটফর্ম</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="INSTAGROUP">Instagram</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>শিরোনাম</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
            <div><Label>কনটেন্ট *</Label><Textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} rows={4} /></div>
            <div><Label>শিডিউল (ঐচ্ছিক)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({...form, scheduledAt: e.target.value})} /></div>
            <div className="text-xs text-muted-foreground bg-secondary p-2 rounded">নোট: সোশ্যাল মিডিয়া API ইন্টিগ্রেশন ছাড়া সরাসরি পাবলিশ হবে না। তবে জব তৈরি ও অনুমোদন করা যাবে।</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button><Button onClick={handleCreate}>তৈরি করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ SUPPORT MODULE ============
export function SupportModule() {
  const { data, loading } = useApi<any>('/api/support');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">সাপোর্ট টিকিট</h2>
      <Card className="overflow-hidden">
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase"><tr>
              <th className="text-left p-3">টিকিট #</th><th className="text-left p-3">বিষয়</th>
              <th className="text-center p-3">প্রায়োরিটি</th><th className="text-center p-3">স্ট্যাটাস</th>
              <th className="text-left p-3">তারিখ</th>
            </tr></thead>
            <tbody>
              {data?.tickets?.map((t: any) => (
                <tr key={t.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="p-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="p-3"><div className="font-medium">{t.subject}</div><div className="text-xs text-muted-foreground truncate max-w-xs">{t.description}</div></td>
                  <td className="p-3 text-center"><Badge variant={t.priority === 'URGENT' ? 'destructive' : t.priority === 'HIGH' ? 'secondary' : 'outline'}>{t.priority}</Badge></td>
                  <td className="p-3 text-center"><Badge variant={t.status === 'OPEN' ? 'secondary' : 'outline'}>{t.status}</Badge></td>
                  <td className="p-3 text-xs">{timeAgo(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ============ NOTIFICATIONS MODULE ============
export function NotificationsModule() {
  const { data, loading } = useApi<any>('/api/notifications');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">নোটিফিকেশন</h2>
      <Card className="p-4">
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <div className="space-y-2">
            {data?.notifications?.length > 0 ? data.notifications.map((n: any) => (
              <div key={n.id} className={`p-3 rounded-md ${n.isRead ? 'bg-secondary/30' : 'bg-primary/5 border border-primary/20'}`}>
                <div className="flex justify-between"><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</div></div>
                <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
              </div>
            )) : <div className="text-center text-sm text-muted-foreground py-8"><Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />কোনো নোটিফিকেশন নেই</div>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ BRANCHES MODULE ============
export function BranchesModule() {
  const { data, loading } = useApi<any>('/api/branches');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">ব্রাঞ্চ ও ওয়্যারহাউস</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? <><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></> :
          data?.branches?.map((b: any) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.code}</div>
                  </div>
                </div>
                {b.isHeadOffice && <Badge className="bg-amber-100 text-amber-700">Head Office</Badge>}
              </div>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <div>{b.address}</div>
                <div>{b.phone} · {b.email}</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-secondary/30 rounded"><div className="font-bold">{b._count?.employees || 0}</div><div className="text-muted-foreground">কর্মী</div></div>
                <div className="p-2 bg-secondary/30 rounded"><div className="font-bold">{b._count?.orders || 0}</div><div className="text-muted-foreground">অর্ডার</div></div>
                <div className="p-2 bg-secondary/30 rounded"><div className="font-bold">{b._count?.warehouses || 0}</div><div className="text-muted-foreground">গুদাম</div></div>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
}

// ============ TRANSFERS MODULE ============
export function TransfersModule() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">স্টক ট্রান্সফার</h2>
      <Card className="p-5">
        <div className="text-center text-sm text-muted-foreground py-8">
          <ArrowLeftRight className="h-10 w-10 mx-auto mb-2 opacity-40" />
          ব্রাঞ্চের মধ্যে স্টক ট্রান্সফার এখানে পরিচালনা করা হবে। প্রতিটি ট্রান্সফারের জন্য REQUESTED → DISPATCHED → RECEIVED স্টেট ট্রানজিশন প্রয়োজন।
        </div>
      </Card>
    </div>
  );
}

// ============ REPORTS MODULE ============
export function ReportsModule() {
  const { data, loading } = useApi<any>('/api/dashboard');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">রিপোর্ট ও অ্যানালিটিক্স</h2>
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><div className="text-xs text-muted-foreground">মোট বিক্রি</div><div className="text-2xl font-bold text-emerald-500">{formatMoney(data?.metrics?.totalSales || 0)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">মোট অর্ডার</div><div className="text-2xl font-bold">{data?.metrics?.totalOrders || 0}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">কাস্টমার</div><div className="text-2xl font-bold">{data?.metrics?.totalCustomers || 0}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">ইনভেন্টরি মূল্য</div><div className="text-2xl font-bold text-primary">{formatMoney(data?.metrics?.totalInventoryValue || 0)}</div></Card>
          </div>
          <Card className="p-5">
            <h3 className="font-semibold mb-3">শাখা পারফরম্যান্স</h3>
            <div className="space-y-2">
              {data?.branchPerformance?.map((b: any, i: number) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-secondary/30 rounded">
                  <span className="font-medium">{b.branchName}</span>
                  <span><span className="text-muted-foreground">{b.totalOrders} অর্ডার · </span><span className="font-bold text-primary">{formatMoney(b.totalRevenue)}</span></span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ============ AUDIT MODULE ============
export function AuditModule() {
  const { data, loading } = useApi<any>('/api/audit?limit=50');
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">অডিট লগ</h2>
      <Card className="p-4">
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
            {data?.events?.map((e: any) => (
              <div key={e.id} className="flex items-start gap-3 p-2 hover:bg-secondary/30 rounded text-xs">
                <Badge variant={e.severity === 'CRITICAL' || e.severity === 'ERROR' ? 'destructive' : e.severity === 'WARN' ? 'secondary' : 'outline'} className="text-[10px]">{e.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{e.action}</div>
                  <div className="text-muted-foreground">{e.entityType} · {e.entityId?.slice(-8) || '—'}</div>
                </div>
                <div className="text-muted-foreground text-right shrink-0">
                  <div>{e.user?.name || 'System'}</div>
                  <div>{timeAgo(e.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ SETTINGS MODULE ============
export function SettingsModule() {
  const { data, loading, refetch } = useApi<any>('/api/system?section=settings');
  const { data: health } = useApi<any>('/api/system?section=health');
  const { data: backups } = useApi<any>('/api/system?section=backups');
  const [backingUp, setBackingUp] = useState(false);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      await apiPost('/api/system', { action: 'backup' });
      toast.success('ব্যাকআপ সফল হয়েছে');
      refetch();
    } catch (e: any) { toast.error(e.message); }
    finally { setBackingUp(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">সিস্টেম সেটিংস</h2>

      {/* Health checks */}
      {health?.checks && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">সিস্টেম স্ট্যাটাস</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {health.checks.map((c: any, i: number) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded text-sm ${c.status === 'OK' ? 'bg-emerald-50 text-emerald-700' : c.status === 'WARN' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                <div className={`h-2 w-2 rounded-full ${c.status === 'OK' ? 'bg-emerald-500' : c.status === 'WARN' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <div className="flex-1"><div className="font-medium">{c.name}</div><div className="text-xs opacity-80">{c.detail}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Backup section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">ডেটাবেস ব্যাকআপ</h3>
            <p className="text-xs text-muted-foreground">স্বয়ংক্রিয় ব্যাকআপ প্রতিদিন একবার চালানো হয়</p>
          </div>
          <Button onClick={handleBackup} disabled={backingUp} className="gap-1.5">
            {backingUp ? 'ব্যাকআপ হচ্ছে...' : 'এখনই ব্যাকআপ করুন'}
          </Button>
        </div>
        {backups?.backups?.length > 0 && (
          <div className="space-y-1">
            {backups.backups.slice(0, 5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-secondary/30 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === 'SUCCESS' ? 'secondary' : 'destructive'}>{b.status}</Badge>
                  <span>{b.type}</span>
                </div>
                <span className="text-muted-foreground">{timeAgo(b.startedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Settings */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">সিস্টেম সেটিংস</h3>
        {loading ? <Skeleton className="h-32 w-full" /> : (
          <div className="space-y-1">
            {data?.settings?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-secondary/30 rounded">
                <div><div className="font-medium">{s.key}</div><div className="text-xs text-muted-foreground">{s.description}</div></div>
                <div className="font-mono text-xs">{s.value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
