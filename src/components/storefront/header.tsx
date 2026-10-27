// Storefront Header - top navigation for public website
'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { BUSINESS } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  ShoppingCart, Search, Menu, User, Phone, MapPin, Mail, ChevronDown,
  LogOut, Package, Settings, BarChart3, X, Truck, Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/use-api';

const NAV_LINKS = [
  { label: 'হোম', view: { name: 'home' as const } },
  { label: 'প্রোডাক্ট', view: { name: 'catalog' as const } },
  { label: 'পিসি কনফিগারেটর', view: { name: 'pc-configurator' as const } },
  { label: 'ট্র্যাক অর্ডার', view: { name: 'track-order' as const } },
  { label: 'সাপোর্ট', view: { name: 'support' as const } },
  { label: 'আমাদের সম্পর্কে', view: { name: 'about' as const } },
];

export function StorefrontHeader() {
  const navigate = useAppStore((s) => s.navigate);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const compareList = useAppStore((s) => s.compareList);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: cartData } = useApi<{ itemCount: number }>('/api/cart');

  const cartCount = cartData?.itemCount || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ name: 'catalog', query: searchQuery.trim() });
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="hidden md:block bg-primary text-primary-foreground">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {BUSINESS.phone}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {BUSINESS.email}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Shop 104 & 105, Subastu Arcade, ICT Bhaban</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')} className="rounded px-1.5 py-0.5 hover:bg-primary-foreground/10 transition">
              {language === 'bn' ? 'EN' : 'বাংলা'}
            </button>
            {user && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {user.name}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground font-bold text-lg shadow-sm">
              D<span className="text-xs align-top">i</span>
            </div>
            <div className="text-left leading-tight">
              <div className="font-bold text-base">Dreamer IT</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">Express · Bangladesh</div>
            </div>
          </button>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ল্যাপটপ, প্রসেসর, গ্রাফিক্স কার্ড খুঁজুন..."
                className="pl-10 pr-4 h-10 rounded-full bg-secondary/50 border-border/60"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5" onClick={() => navigate({ name: 'compare' })} disabled={compareList.length === 0}>
              <BarChart3 className="h-4 w-4" />
              <span>তুলনা</span>
              {compareList.length > 0 && <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[10px]">{compareList.length}</Badge>}
            </Button>

            <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5" onClick={() => navigate({ name: 'cart' })}>
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] px-1">{cartCount}</span>}
              </div>
              <span>কার্ট</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">{user.name.charAt(0).toUpperCase()}</div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ name: 'customer-account' })}><User className="mr-2 h-4 w-4" /> আমার অ্যাকাউন্ট</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ name: 'track-order' })}><Package className="mr-2 h-4 w-4" /> অর্ডার ট্র্যাক</DropdownMenuItem>
                  {user.roles.some((r) => r !== 'CUSTOMER') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ name: 'admin' })}><Settings className="mr-2 h-4 w-4" /> অ্যাডমিন প্যানেল</DropdownMenuItem>
                      {(user.roles.includes('CASHIER') || user.roles.includes('SALESPERSON')) && (
                        <DropdownMenuItem onClick={() => navigate({ name: 'pos' })}><Package className="mr-2 h-4 w-4" /> POS টার্মিনাল</DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> লগআউট</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={() => navigate({ name: 'customer-auth' })} className="hidden md:flex">লগইন / সাইন আপ</Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center justify-between">
                    <span>মেনু</span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-7 w-7"><X className="h-4 w-4" /></Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="খুঁজুন..." className="pl-10" />
                    </div>
                  </form>
                  <nav className="space-y-1">
                    {NAV_LINKS.map((link) => (
                      <button key={link.label} onClick={() => { navigate(link.view); setMobileOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-secondary">{link.label}</button>
                    ))}
                  </nav>
                  <div className="pt-3 border-t space-y-1">
                    <button onClick={() => { navigate({ name: 'cart' }); setMobileOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-secondary">
                      <ShoppingCart className="h-4 w-4" /> কার্ট ({cartCount})
                    </button>
                    {user ? (
                      <>
                        <button onClick={() => { navigate({ name: 'customer-account' }); setMobileOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-secondary">
                          <User className="h-4 w-4" /> অ্যাকাউন্ট
                        </button>
                        {user.roles.some((r) => r !== 'CUSTOMER') && (
                          <button onClick={() => { navigate({ name: 'admin' }); setMobileOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-secondary">
                            <Settings className="h-4 w-4" /> অ্যাডমিন প্যানেল
                          </button>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-secondary text-destructive">
                          <LogOut className="h-4 w-4" /> লগআউট
                        </button>
                      </>
                    ) : (
                      <Button className="w-full" onClick={() => { navigate({ name: 'customer-auth' }); setMobileOpen(false); }}>লগইন / সাইন আপ</Button>
                    )}
                  </div>
                  <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {BUSINESS.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Shop 104 & 105, ICT Bhaban</div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 h-11 border-t border-border/40">
          {NAV_LINKS.map((link) => (
            <button key={link.label} onClick={() => navigate(link.view)} className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-md transition">{link.label}</button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> সারা দেশে ডেলিভারি</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> ১০০% অরিজিনাল প্রোডাক্ট</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
