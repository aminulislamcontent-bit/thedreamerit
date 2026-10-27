// Customer Auth (login/register)
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { ShieldCheck } from 'lucide-react';

export function CustomerAuthPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('ইমেইল এবং পাসওয়ার্ড দিন');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || 'লগইন ব্যর্থ');
      toast.success('সফলভাবে লগইন হয়েছে', { description: data.data.user.name });
      await refresh();
      navigate({ name: 'home' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('পাসওয়ার্ড মেলে না');
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    setLoading(true);
    try {
      // Register customer
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message || 'রেজিস্ট্রেশন ব্যর্থ');

      // Auto-login
      const loginRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerForm.email, password: registerForm.password }),
      });
      const loginData = await loginRes.json();
      if (!loginData.ok) throw new Error('রেজিস্ট্রেশন সফল কিন্তু অটো-লগইন ব্যর্থ। দয়া করে লগইন করুন।');

      toast.success('অ্যাকাউন্ট তৈরি হয়েছে!', { description: registerForm.name });
      await refresh();
      navigate({ name: 'home' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">কাস্টমার অ্যাকাউন্ট</h1>
          <p className="text-sm text-muted-foreground mt-1">অর্ডার করতে, ট্র্যাক করতে ও সাপোর্ট পেতে লগইন করুন</p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">লগইন</TabsTrigger>
              <TabsTrigger value="register">রেজিস্টার</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">ইমেইল</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">পাসওয়ার্ড</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <Label htmlFor="reg-name">পূর্ণ নাম</Label>
                  <Input id="reg-name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="reg-email">ইমেইল</Label>
                  <Input id="reg-email" type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="reg-phone">ফোন নম্বর</Label>
                  <Input id="reg-phone" type="tel" placeholder="01XXXXXXXXX" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="reg-password">পাসওয়ার্ড</Label>
                  <Input id="reg-password" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="reg-confirm">পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input id="reg-confirm" type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />
          <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3" /> আপনার তথ্য সুরক্ষিত ও এনক্রিপ্ট করা
          </div>
        </Card>

        <div className="mt-4 text-center">
          <button onClick={() => navigate({ name: 'home' })} className="text-sm text-muted-foreground hover:text-primary">
            ← হোম পেজে ফিরুন
          </button>
        </div>
      </div>
    </div>
  );
}
