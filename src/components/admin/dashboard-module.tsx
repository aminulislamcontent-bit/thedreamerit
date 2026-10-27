// Admin Dashboard Module - operational metrics overview
'use client';
import { useApi } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { formatMoney, timeAgo } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/config';
import {
  TrendingUp, ShoppingCart, Users, Package, AlertCircle, Wallet,
  Star, Bell, Activity, Building2, ArrowRight, Crown, CheckCircle2,
} from 'lucide-react';

export function DashboardModule() {
  const navigate = useAppStore((s) => s.navigate);
  const setAdminModule = useAppStore((s) => s.setAdminModule);
  const { data, loading } = useApi<any>('/api/dashboard');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const { metrics, recentOrders, topProducts, branchPerformance, lowStockItems } = data;

  const metricCards = [
    { label: 'মোট বিক্রি', value: formatMoney(metrics.totalSales), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'মোট অর্ডার', value: metrics.totalOrders, icon: ShoppingCart, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'বকেয়া পেমেন্ট', value: formatMoney(metrics.pendingPayments), icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'মোট কাস্টমার', value: metrics.totalCustomers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'মোট প্রোডাক্ট', value: metrics.totalProducts, icon: Package, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'ইনভেন্টরি ভ্যালু', value: formatMoney(metrics.totalInventoryValue), icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'লো স্টক', value: metrics.lowStockCount, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'পেন্ডিং কমিশন', value: formatMoney(metrics.pendingCommission), icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">স্বাগতম, অ্যাডমিন</h2>
          <p className="text-sm text-muted-foreground">দ্য ড্রিমার আইটি এক্সপ্রেস প্ল্যাটফর্মে আপনাকে স্বাগতম</p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5"><Building2 className="h-3 w-3" /> {metrics.branchCount} ব্রাঞ্চ</Badge>
          <Badge variant="outline" className="gap-1.5"><Users className="h-3 w-3" /> {metrics.employeeCount} কর্মী</Badge>
          <Badge variant="outline" className="gap-1.5"><Package className="h-3 w-3" /> {metrics.supplierCount} সাপ্লায়ার</Badge>
        </div>
      </div>

      {/* Alert cards */}
      {(metrics.pendingApprovals > 0 || metrics.pendingReviews > 0 || metrics.failedJobs > 0 || metrics.openTickets > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.pendingApprovals > 0 && (
            <Card className="p-3 border-amber-200 bg-amber-50 cursor-pointer" onClick={() => setAdminModule('products')}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-xs text-amber-700">প্রোডাক্ট অনুমোদন</div>
                  <div className="font-bold text-amber-900">{metrics.pendingApprovals}</div>
                </div>
              </div>
            </Card>
          )}
          {metrics.pendingReviews > 0 && (
            <Card className="p-3 border-violet-200 bg-violet-50 cursor-pointer" onClick={() => setAdminModule('content-studio')}>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-500" />
                <div>
                  <div className="text-xs text-violet-700">কনটেন্ট রিভিউ</div>
                  <div className="font-bold text-violet-900">{metrics.pendingReviews}</div>
                </div>
              </div>
            </Card>
          )}
          {metrics.openTickets > 0 && (
            <Card className="p-3 border-rose-200 bg-rose-50 cursor-pointer" onClick={() => setAdminModule('support')}>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-rose-500" />
                <div>
                  <div className="text-xs text-rose-700">খোলা টিকিট</div>
                  <div className="font-bold text-rose-900">{metrics.openTickets}</div>
                </div>
              </div>
            </Card>
          )}
          {metrics.failedJobs > 0 && (
            <Card className="p-3 border-red-200 bg-red-50 cursor-pointer" onClick={() => setAdminModule('social')}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-xs text-red-700">ব্যর্থ জব</div>
                  <div className="font-bold text-red-900">{metrics.failedJobs}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.bg}`}>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* Recent orders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">সাম্প্রতিক অর্ডার</h3>
            <Button variant="ghost" size="sm" onClick={() => setAdminModule('orders')} className="gap-1">
              সব দেখুন <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.slice(0, 6).map((o: any) => {
                const statusInfo = ORDER_STATUS_LABELS[o.status] || ORDER_STATUS_LABELS.PENDING;
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3 p-2 hover:bg-secondary/30 rounded-md">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{o.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{o.customerName} · {o.customerPhone}</div>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">{timeAgo(o.createdAt)}</div>
                    <Badge variant="secondary" className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-700 text-xs`}>{statusInfo.bn}</Badge>
                    <div className="text-sm font-bold text-primary w-20 text-right">{formatMoney(o.totalAmount)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
              এখনও কোনো অর্ডার নেই
            </div>
          )}
        </Card>

        {/* Branch performance */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">ব্রাঞ্চ পারফরম্যান্স</h3>
          {branchPerformance.length > 0 ? (
            <div className="space-y-3">
              {branchPerformance.map((b: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.branchName || 'অনলাইন'}</span>
                    <span className="text-primary font-bold">{formatMoney(b.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{b.totalOrders} অর্ডার</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(b.totalRevenue / Math.max(...branchPerformance.map((x: any) => x.totalRevenue))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              কোনো বিক্রি ডেটা নেই
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">সেরা বিক্রিত প্রোডাক্ট</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-md">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  {p.primaryImage && (
                    <img src={p.primaryImage} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{p.productName}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-primary">{formatMoney(p.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{p.unitsSold} পিস</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              কোনো বিক্রি ডেটা নেই
            </div>
          )}
        </Card>

        {/* Low stock */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> লো স্টক অ্যালার্ট
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setAdminModule('inventory')} className="gap-1">
              সব দেখুন <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 hover:bg-secondary/30 rounded-md">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">{item.brand} · {item.sku}</div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {item.quantityAvailable} / {item.reorderThreshold}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              সব প্রোডাক্টে পর্যাপ্ত স্টক আছে
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
