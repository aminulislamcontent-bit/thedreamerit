// Employee Portal Module - With selling ID, commission tracking, sales performance
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  UserCog, Plus, Wallet, TrendingUp, Target, Award, Copy, Search,
  ShoppingBag, Star, Eye, User,
} from 'lucide-react';
import { formatMoney, formatDate } from '@/lib/format';

export function EmployeePortalModule() {
  const [tab, setTab] = useState('overview');
  const { data, loading, refetch } = useApi<any>('/api/employees');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    designation: '', department: '', branchId: '', basicSalary: 0,
    roles: [] as string[],
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: branchesData } = useApi<any>('/api/branches');

  const handleCreate = async () => {
    if (!form.fullName || !form.email || !form.designation) {
      toast.error('নাম, ইমেইল এবং পদবি আবশ্যক');
      return;
    }
    try {
      await apiPost('/api/employees', form);
      toast.success('কর্মী যোগ করা হয়েছে');
      setOpen(false);
      refetch();
      setForm({ fullName: '', email: '', phone: '', password: '', designation: '', department: '', branchId: '', basicSalary: 0, roles: [] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleRole = (role: string) => {
    setForm((s) => ({
      ...s,
      roles: s.roles.includes(role) ? s.roles.filter((r) => r !== role) : [...s.roles, role],
    }));
  };

  const copySellingId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('সেলিং আইডি কপি হয়েছে', { description: id });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserCog className="h-5 w-5 text-emerald-600" /> এমপ্লয়ি পোর্টাল
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            সেলিং আইডি, কমিশন ট্র্যাকিং ও সেলস পারফরম্যান্স
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> নতুন কর্মী
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <UserCog className="h-5 w-5 text-emerald-600" />
            <Badge variant="secondary" className="text-[10px]">Active</Badge>
          </div>
          <div className="text-2xl font-bold mt-1">{data?.employees?.length || 0}</div>
          <div className="text-[10px] text-muted-foreground">মোট কর্মী</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <Wallet className="h-5 w-5 text-amber-600" />
            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">Pending</Badge>
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{formatMoney(0)}</div>
          <div className="text-[10px] text-muted-foreground">পেন্ডিং কমিশন</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">This Month</Badge>
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{formatMoney(0)}</div>
          <div className="text-[10px] text-muted-foreground">মাসিক কমিশন</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <Target className="h-5 w-5 text-violet-600" />
            <Badge variant="secondary" className="text-[10px]">Avg</Badge>
          </div>
          <div className="text-2xl font-bold mt-1 text-violet-600">0%</div>
          <div className="text-[10px] text-muted-foreground">টার্গেট অর্জন</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">সেলিং আইডি সহ কর্মী</TabsTrigger>
          <TabsTrigger value="commissions">কমিশন ট্র্যাকিং</TabsTrigger>
          <TabsTrigger value="performance">সেলস পারফরম্যান্স</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 mt-4">
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase">
                    <tr>
                      <th className="text-left p-3">এমপ্লয়ি</th>
                      <th className="text-left p-3">সেলিং আইডি</th>
                      <th className="text-left p-3">পদবি</th>
                      <th className="text-left p-3">ব্রাঞ্চ</th>
                      <th className="text-left p-3">রোল</th>
                      <th className="text-center p-3">স্ট্যাটাস</th>
                      <th className="text-right p-3">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.employees?.map((e: any) => {
                      // Generate selling ID format: DIT-EMP-XXXX
                      const sellingId = `DIT-${e.employeeCode.replace('EMP-', 'EMP-')}`;
                      return (
                        <tr key={e.id} className="border-t border-border/40 hover:bg-secondary/20">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                {e.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{e.fullName}</div>
                                <div className="text-[10px] text-muted-foreground">{e.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => copySellingId(sellingId)}
                              className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-md font-mono text-xs hover:bg-violet-100 transition"
                              title="কপি করুন"
                            >
                              {sellingId}
                              <Copy className="h-3 w-3" />
                            </button>
                            <div className="text-[10px] text-muted-foreground mt-0.5">কমিশন ট্র্যাকিং আইডি</div>
                          </td>
                          <td className="p-3 text-xs">{e.designation}</td>
                          <td className="p-3 text-xs">{e.branch?.name?.replace('The Dreamer IT Express - ', '') || '—'}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {e.user?.roles?.slice(0, 2).map((r: string) => (
                                <Badge key={r} variant="secondary" className="text-[9px]">{r}</Badge>
                              ))}
                              {e.user?.roles?.length > 2 && (
                                <Badge variant="outline" className="text-[9px]">+{e.user.roles.length - 2}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={e.employmentStatus === 'ACTIVE' ? 'secondary' : 'destructive'} className="text-[10px]">
                              {e.employmentStatus}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedEmployee(e)} className="gap-1">
                              <Eye className="h-3 w-3" /> বিস্তারিত
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Help text */}
          <Card className="p-3 bg-violet-50 border-violet-200">
            <p className="text-xs text-violet-800">
              💡 <strong>সেলিং আইডি</strong> প্রতিটি এমপ্লয়ির জন্য ইউনিক। বিক্রি করার সময় POS বা অর্ডার ফর্মে এই আইডি ব্যবহার করলে
              স্বয়ংক্রিয়ভাবে কমিশন হিসাব হবে। এমপ্লয়ি তার লগইন পোর্টাল থেকে নিজের সেলস, কমিশন ও টার্গেট দেখতে পারবে।
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-3 mt-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-600" /> কমিশন রুলস ও হিসাব
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                <span>প্রতিটি ল্যাপটপ বিক্রয়ে</span>
                <Badge variant="secondary">১-২% কমিশন</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                <span>কম্পোনেন্টস বিক্রয়ে</span>
                <Badge variant="secondary">২-৫% কমিশন</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                <span>মাসিক টার্গেট অর্জনে</span>
                <Badge className="bg-emerald-100 text-emerald-700">+৫% বোনাস</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                <span>কাস্টম পিসি বিল্ড বিক্রয়ে</span>
                <Badge className="bg-violet-100 text-violet-700">৩% ফিক্সড</Badge>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">সাম্প্রতিক কমিশন ট্রানজেকশন</h3>
            </div>
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
              এখনও কোনো কমিশন ট্রানজেকশন নেই।
              <br />
              অর্ডার ডেলিভারি হলে স্বয়ংক্রিয়ভাবে কমিশন হিসাব হবে।
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-3 mt-4">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> সেলস পারফরম্যান্স লিডারবোর্ড
              </h3>
            </div>
            {data?.employees?.length > 0 ? (
              <div className="divide-y divide-border/40">
                {data.employees.slice(0, 5).map((e: any, idx: number) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 hover:bg-secondary/20">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-slate-100 text-slate-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{e.fullName}</div>
                      <div className="text-[10px] text-muted-foreground">{e.designation}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{formatMoney(0)}</div>
                      <div className="text-[10px] text-muted-foreground">মোট সেলস</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">{formatMoney(0)}</div>
                      <div className="text-[10px] text-muted-foreground">কমিশন</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-40" />
                কোনো পারফরম্যান্স ডেটা নেই
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create employee dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>নতুন কর্মী যোগ</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-3 py-2">
            <div>
              <Label>পূর্ণ নাম *</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <Label>ইমেইল *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>ফোন</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>পাসওয়ার্ড (ডিফল্ট Welcome@2026)</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>পদবি *</Label>
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <Label>বিভাগ</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <Label>ব্রাঞ্চ</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {branchesData?.branches?.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>মূল বেতন (৳)</Label>
              <Input type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="md:col-span-2">
              <Label>রোলসমূহ</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['SALESPERSON', 'CASHIER', 'BRANCH_MANAGER', 'INVENTORY_MANAGER', 'PRODUCT_MANAGER', 'PROCUREMENT_OFFICER', 'ACCOUNTANT', 'HR_MANAGER', 'MARKETING_MANAGER', 'CONTENT_REVIEWER', 'CUSTOMER_SUPPORT', 'WAREHOUSE_OPERATOR', 'ADMINISTRATOR'].map((r) => (
                  <label
                    key={r}
                    className={`text-xs px-2 py-1.5 rounded border cursor-pointer ${form.roles.includes(r) ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-secondary'}`}
                  >
                    <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} className="hidden" />
                    {r.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-md p-3 text-xs">
            <strong>সেলিং আইডি স্বয়ংক্রিয়ভাবে তৈরি হবে:</strong> কর্মী তৈরি হওয়ার পর সিস্টেম স্বয়ংক্রিয়ভাবে একটি
            ইউনিক সেলিং আইডি (DIT-EMP-XXXX) তৈরি করবে। এই আইডি দিয়ে কর্মী তার সেলস ও কমিশন ট্র্যাক করতে পারবে।
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button onClick={handleCreate}>যোগ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee detail dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={(o) => !o && setSelectedEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>কর্মী বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  {selectedEmployee.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{selectedEmployee.fullName}</div>
                  <div className="text-xs text-muted-foreground">{selectedEmployee.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs">সেলিং আইডি</Label>
                  <div className="font-mono text-sm font-bold text-violet-700">
                    DIT-{selectedEmployee.employeeCode.replace('EMP-', 'EMP-')}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">পদবি</Label>
                  <div className="text-sm">{selectedEmployee.designation}</div>
                </div>
                <div>
                  <Label className="text-xs">বিভাগ</Label>
                  <div className="text-sm">{selectedEmployee.department}</div>
                </div>
                <div>
                  <Label className="text-xs">ব্রাঞ্চ</Label>
                  <div className="text-sm">{selectedEmployee.branch?.name || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <Card className="p-2 text-center">
                  <ShoppingBag className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                  <div className="font-bold text-sm">0</div>
                  <div className="text-[10px] text-muted-foreground">সেলস</div>
                </Card>
                <Card className="p-2 text-center">
                  <Wallet className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                  <div className="font-bold text-sm">{formatMoney(0)}</div>
                  <div className="text-[10px] text-muted-foreground">কমিশন</div>
                </Card>
                <Card className="p-2 text-center">
                  <Star className="h-4 w-4 mx-auto text-violet-600 mb-1" />
                  <div className="font-bold text-sm">0%</div>
                  <div className="text-[10px] text-muted-foreground">টার্গেট</div>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
