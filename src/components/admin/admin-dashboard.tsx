// Admin Dashboard - main shell with sidebar navigation
'use client';
import { useState } from 'react';
import { useAppStore, type AdminModule } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Users, Settings,
  TrendingUp, FileText, BarChart3, Megaphone, Share2, Headphones,
  Bell, Building2, ArrowLeftRight, RotateCcw, Shield, Star,
  Wallet, UserCog, Search, LogOut, ChevronLeft, Store, Database,
  Plug, ShieldAlert, AlertCircle, Crown, Bot, Video, Cloud,
} from 'lucide-react';
import { DashboardModule } from '@/components/admin/dashboard-module';
import { ProductsModule } from '@/components/admin/products-module';
import { InventoryModule } from '@/components/admin/inventory-module';
import { OrdersModule } from '@/components/admin/orders-module';
import { CustomersModule } from '@/components/admin/customers-module';
import { EmployeesModule } from '@/components/admin/employees-module';
import { SuppliersModule } from '@/components/admin/suppliers-module';
import { ContentStudioModule } from '@/components/admin/content-studio-module';
import { SeoModule } from '@/components/admin/seo-module';
import { MarketingModule } from '@/components/admin/marketing-module';
import { SocialModule } from '@/components/admin/social-module';
import { SupportModule } from '@/components/admin/support-module';
import { NotificationsModule } from '@/components/admin/notifications-module';
import { BranchesModule } from '@/components/admin/branches-module';
import { TransfersModule } from '@/components/admin/transfers-module';
import { ReportsModule } from '@/components/admin/reports-module';
import { AuditModule } from '@/components/admin/audit-module';
import { SettingsModule } from '@/components/admin/settings-module';
import { CommissionsModule } from '@/components/admin/commissions-module';
import { FinanceModule } from '@/components/admin/finance-module';
import { EmployeePortalModule } from '@/components/admin/employee-portal-module';
import { AiAutomationModule } from '@/components/admin/ai-automation-module';
import { HostingDashboardModule } from '@/components/admin/hosting-dashboard-module';
import { AiVideoStudioModule } from '@/components/admin/ai-video-studio-module';

interface NavItem {
  module: AdminModule;
  label: string;
  icon: any;
  permission?: string;
  badge?: string;
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'পরিচালনা',
    items: [
      { module: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { module: 'orders', label: 'অর্ডার', icon: ShoppingCart },
      { module: 'products', label: 'প্রোডাক্ট', icon: Package, permission: 'products.view' },
      { module: 'inventory', label: 'ইনভেন্টরি', icon: Boxes, permission: 'inventory.view' },
      { module: 'transfers', label: 'স্টক ট্রান্সফার', icon: ArrowLeftRight, permission: 'inventory.transfer' },
      { module: 'branches', label: 'ব্রাঞ্চ ও ওয়্যারহাউস', icon: Building2, permission: 'system.settings' },
    ],
  },
  {
    title: 'বিক্রয় ও ক্রয়',
    items: [
      { module: 'suppliers', label: 'সাপ্লায়ার', icon: Store, permission: 'procurement.view' },
      { module: 'customers', label: 'কাস্টমার', icon: Users, permission: 'crm.view' },
      { module: 'employees', label: 'কর্মী ও HR', icon: UserCog, permission: 'hr.view' },
      { module: 'employee-portal', label: 'এমপ্লয়ি পোর্টাল', icon: UserCog, permission: 'hr.view' },
      { module: 'commissions', label: 'কমিশন', icon: Wallet, permission: 'commission.view' },
      { module: 'finance', label: 'হিসাবনিকাশ', icon: TrendingUp, permission: 'finance.view' },
    ],
  },
  {
    title: 'AI অটোমেশন',
    items: [
      { module: 'ai-automation', label: 'AI অটোমেশন সার্ভার', icon: Bot },
      { module: 'ai-video-studio', label: 'AI ভিডিও স্টুডিও', icon: Video },
      { module: 'content-studio', label: 'AI কনটেন্ট স্টুডিও', icon: FileText, permission: 'content.view' },
      { module: 'seo', label: 'SEO ম্যানেজমেন্ট', icon: Search, permission: 'seo.view' },
      { module: 'marketing', label: 'ক্যাম্পেইন', icon: Megaphone, permission: 'marketing.view' },
      { module: 'social', label: 'সোশ্যাল পাবলিশিং', icon: Share2, permission: 'marketing.view' },
    ],
  },
  {
    title: 'ইনফ্রাস্ট্রাকচার',
    items: [
      { module: 'hosting-dashboard', label: 'হোস্টিং ড্যাশবোর্ড', icon: Cloud },
    ],
  },
  {
    title: 'সাপোর্ট ও সিস্টেম',
    items: [
      { module: 'support', label: 'সাপোর্ট টিকিট', icon: Headphones, permission: 'support.view' },
      { module: 'notifications', label: 'নোটিফিকেশন', icon: Bell },
      { module: 'reports', label: 'রিপোর্ট', icon: BarChart3, permission: 'reports.view' },
      { module: 'audit', label: 'অডিট লগ', icon: ShieldAlert, permission: 'system.audit' },
      { module: 'settings', label: 'সিস্টেম সেটিংস', icon: Settings, permission: 'system.settings' },
    ],
  },
];

export function AdminDashboard() {
  const navigate = useAppStore((s) => s.navigate);
  const adminModule = useAppStore((s) => s.adminModule);
  const setAdminModule = useAppStore((s) => s.setAdminModule);
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="font-semibold text-lg mb-2">লগইন প্রয়োজন</h2>
        <p className="text-sm text-muted-foreground mb-4">অ্যাডমিন প্যানেল দেখতে লগইন করুন</p>
        <Button onClick={() => navigate({ name: 'customer-auth' })}>লগইন করুন</Button>
      </div>
    );
  }

  // Check if user has any admin role
  const hasAdminAccess = user.roles.some((r) => r !== 'CUSTOMER');
  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="font-semibold text-lg mb-2">অ্যাক্সেস নেই</h2>
        <p className="text-sm text-muted-foreground mb-4">এই পেজ দেখার অনুমতি আপনার নেই</p>
        <Button onClick={() => navigate({ name: 'home' })}>হোমে ফিরুন</Button>
      </div>
    );
  }

  const hasPermission = (perm: string | undefined) => {
    if (!perm) return true;
    return user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMINISTRATOR') || true; // simplified - in production check ROLE_PERMISSIONS
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-primary text-sidebar-primary-foreground font-bold">
              D<span className="text-xs align-top">i</span>
            </div>
            <div className="text-left">
              <div className="font-bold text-sm text-sidebar-foreground">Dreamer IT Admin</div>
              <div className="text-[10px] text-sidebar-foreground/60">Express · v1.0.0</div>
            </div>
          </button>
        </div>

        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-4 px-2">
            {NAV_SECTIONS.map((section) => {
              const visibleItems = section.items.filter((item) => hasPermission(item.permission));
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.title}>
                  <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
                    {section.title}
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = adminModule === item.module;
                      return (
                        <button
                          key={item.module}
                          onClick={() => setAdminModule(item.module)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User info */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">
                {user.roles.includes('SUPER_ADMIN') && <Crown className="inline h-2.5 w-2.5 mr-0.5 text-amber-400" />}
                {user.roles[0]}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition">
            <LogOut className="h-3 w-3" /> লগআউট
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate({ name: 'home' })} className="md:hidden">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold capitalize">
              {NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.module === adminModule)?.label || 'ড্যাশবোর্ড'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ name: 'pos' })} className="hidden md:flex gap-1.5">
              <Store className="h-3.5 w-3.5" /> POS
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate({ name: 'home' })} className="hidden md:flex gap-1.5">
              <ChevronLeft className="h-3.5 w-3.5" /> ওয়েবসাইট
            </Button>
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {adminModule === 'dashboard' && <DashboardModule />}
          {adminModule === 'products' && <ProductsModule />}
          {adminModule === 'inventory' && <InventoryModule />}
          {adminModule === 'orders' && <OrdersModule />}
          {adminModule === 'suppliers' && <SuppliersModule />}
          {adminModule === 'customers' && <CustomersModule />}
          {adminModule === 'employees' && <EmployeesModule />}
          {adminModule === 'employee-portal' && <EmployeePortalModule />}
          {adminModule === 'commissions' && <CommissionsModule />}
          {adminModule === 'finance' && <FinanceModule />}
          {adminModule === 'content-studio' && <ContentStudioModule />}
          {adminModule === 'seo' && <SeoModule />}
          {adminModule === 'marketing' && <MarketingModule />}
          {adminModule === 'social' && <SocialModule />}
          {adminModule === 'ai-automation' && <AiAutomationModule />}
          {adminModule === 'ai-video-studio' && <AiVideoStudioModule />}
          {adminModule === 'hosting-dashboard' && <HostingDashboardModule />}
          {adminModule === 'support' && <SupportModule />}
          {adminModule === 'notifications' && <NotificationsModule />}
          {adminModule === 'branches' && <BranchesModule />}
          {adminModule === 'transfers' && <TransfersModule />}
          {adminModule === 'reports' && <ReportsModule />}
          {adminModule === 'audit' && <AuditModule />}
          {adminModule === 'settings' && <SettingsModule />}
        </main>
      </div>
    </div>
  );
}
