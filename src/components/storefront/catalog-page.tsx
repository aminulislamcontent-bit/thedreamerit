// Catalog page - product listing with filters
'use client';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/hooks/use-api';
import { ProductCard } from '@/components/storefront/product-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SlidersHorizontal, X, Package2 } from 'lucide-react';

interface CatalogProps {
  initialCategory?: string;
  initialBrand?: string;
  initialQuery?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'নতুন প্রথমে' },
  { value: 'price_asc', label: 'কম দাম → বেশি দাম' },
  { value: 'price_desc', label: 'বেশি দাম → কম দাম' },
  { value: 'name', label: 'নাম অনুসারে' },
];

export function CatalogPage({ initialCategory, initialBrand, initialQuery }: CatalogProps) {
  const navigate = useAppStore((s) => s.navigate);
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState(initialCategory || '');
  const [brand, setBrand] = useState(initialBrand || '');
  const [query, setQuery] = useState(initialQuery || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: categoriesData } = useApi<{ categories: any[] }>('/api/categories');
  const { data: brandsData } = useApi<{ brands: any[] } | null>('/api/brands');

  // Build query string (page is always 1 for simplicity in this MVP)
  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('limit', '24');
  params.set('sort', sort);
  if (category) params.set('category', category);
  if (brand) params.set('brand', brand);
  if (query) params.set('q', query);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);

  const { data, loading } = useApi<{
    products: any[];
    pagination: { page: number; total: number; totalPages: number };
  }>(`/api/products?${params.toString()}`);

  // Wrap setter to allow resetting in user actions rather than effects
  const setCategoryAndReset = useCallback((c: string) => {
    setCategory(c);
  }, []);

  const setQueryAndReset = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const setPriceRangeAndReset = useCallback((min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
  }, []);

  const resetFilters = useCallback(() => {
    setCategory('');
    setQuery('');
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const selectedCategory = categoriesData?.categories.find((c) => c.slug === category);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb + heading */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1">
          <button onClick={() => navigate({ name: 'home' })} className="hover:text-primary">হোম</button>
          {' / '}
          <span>{selectedCategory?.name || 'সকল প্রোডাক্ট'}</span>
        </div>
        <h1 className="text-2xl font-bold">{selectedCategory?.name || 'সকল প্রোডাক্ট'}</h1>
        {query && <p className="text-sm text-muted-foreground mt-1">সার্চ: "{query}"</p>}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters sidebar (desktop) */}
        <aside className="hidden lg:block space-y-4 sticky top-32 self-start">
          <FiltersCard
            categories={categoriesData?.categories || []}
            category={category}
            setCategory={setCategory}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
          />
        </aside>

        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              {loading ? '...' : `${data?.pagination.total || 0} প্রোডাক্ট`}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filter trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                    <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>ফিল্টার</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <FiltersCard
                      categories={categoriesData?.categories || []}
                      category={category}
                      setCategory={setCategory}
                      minPrice={minPrice}
                      setMinPrice={setMinPrice}
                      maxPrice={maxPrice}
                      setMaxPrice={setMaxPrice}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          {(category || query || minPrice || maxPrice) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory?.name || category}
                  <button onClick={() => setCategory('')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {query && (
                <Badge variant="secondary" className="gap-1">
                  "{query}"
                  <button onClick={() => setQuery('')}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {(minPrice || maxPrice) && (
                <Badge variant="secondary" className="gap-1">
                  দাম: {minPrice || '0'} - {maxPrice || '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-3 space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : data && data.products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination info */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
                  পেজ 1 / {data.pagination.totalPages} · আরও প্রোডাক্ট দেখতে ফিল্টার ব্যবহার করুন
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <Package2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
              <p className="text-sm text-muted-foreground mb-4">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
              <Button variant="outline" onClick={() => { setCategory(''); setQuery(''); setMinPrice(''); setMaxPrice(''); }}>
                ফিল্টার রিসেট করুন
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function FiltersCard({ categories, category, setCategory, minPrice, setMinPrice, maxPrice, setMaxPrice }: any) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">ক্যাটাগরি</h3>
        <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin pr-1">
          <button
            onClick={() => setCategory('')}
            className={`block w-full text-left px-2 py-1.5 rounded text-sm transition ${!category ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
          >
            সকল ক্যাটাগরি
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.slug)}
              className={`block w-full text-left px-2 py-1.5 rounded text-sm transition ${category === c.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
            >
              {c.name} <span className="text-xs opacity-60">({c.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="font-semibold text-sm mb-2">দাম (৳)</h3>
        <div className="space-y-2">
          <Input type="number" placeholder="সর্বনিম্ন" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input type="number" placeholder="সর্বোচ্চ" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>
    </Card>
  );
}
