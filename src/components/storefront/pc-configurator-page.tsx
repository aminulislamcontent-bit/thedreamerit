// PC Configurator - interactive build with compatibility checks
'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useApi, apiPost } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Cpu, Server, MemoryStick, Monitor, HardDrive, Zap, Fan, Box,
  ShoppingCart, CheckCircle2, AlertCircle, Trash2, Package,
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface ConfigSlot {
  key: string;
  label: string;
  labelBn: string;
  icon: any;
  categorySlug: string;
  required: boolean;
}

const CONFIG_SLOTS: ConfigSlot[] = [
  { key: 'cpu', label: 'Processor (CPU)', labelBn: 'প্রসেসর', icon: Cpu, categorySlug: 'processors', required: true },
  { key: 'motherboard', label: 'Motherboard', labelBn: 'মাদারবোর্ড', icon: Server, categorySlug: 'motherboards', required: true },
  { key: 'ram', label: 'RAM', labelBn: 'র্যাম', icon: MemoryStick, categorySlug: 'ram', required: true },
  { key: 'gpu', label: 'Graphics Card', labelBn: 'গ্রাফিক্স কার্ড', icon: Monitor, categorySlug: 'graphics-cards', required: false },
  { key: 'storage', label: 'Storage', labelBn: 'স্টোরেজ', icon: HardDrive, categorySlug: 'storage', required: true },
  { key: 'psu', label: 'Power Supply', labelBn: 'পাওয়ার সাপ্লাই', icon: Zap, categorySlug: 'power-supplies', required: true },
  { key: 'case', label: 'Casing', labelBn: 'কেসিং', icon: Box, categorySlug: 'cases', required: true },
  { key: 'cooler', label: 'CPU Cooler', labelBn: 'কুলিং', icon: Fan, categorySlug: 'cooling', required: false },
];

// Individual slot component - uses hooks correctly
function ConfiguratorSlot({
  slot, selectedProduct, onSelect, onRemove,
}: {
  slot: ConfigSlot;
  selectedProduct: any;
  onSelect: (product: any) => void;
  onRemove: () => void;
}) {
  const Icon = slot.icon;
  const { data, loading } = useApi<{ products: any[] }>(`/api/products?category=${slot.categorySlug}&limit=100`);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${selectedProduct ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm flex items-center gap-2">
            {slot.labelBn}
            {slot.required && <Badge variant="secondary" className="text-[10px]">আবশ্যক</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">{slot.label}</div>
        </div>
        {selectedProduct && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {selectedProduct ? (
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
          <div>
            <div className="font-medium text-sm">{selectedProduct.name}</div>
            <div className="text-xs text-muted-foreground">
              {selectedProduct.brand?.name} · {formatMoney(selectedProduct.sellingPrice)}
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      ) : loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Select onValueChange={(value) => {
          const product = data?.products.find((p) => p.id === value);
          if (product) {
            // Fetch full product details with attribute values
            fetch(`/api/products/${value}`).then(r => r.json()).then(d => {
              if (d.ok) onSelect(d.data.product);
            });
          }
        }}>
          <SelectTrigger><SelectValue placeholder={`${slot.labelBn} নির্বাচন করুন...`} /></SelectTrigger>
          <SelectContent>
            {data?.products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} — {formatMoney(p.sellingPrice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Card>
  );
}

export function PcConfiguratorPage() {
  const navigate = useAppStore((s) => s.navigate);
  const { user } = useAuth();
  const [config, setConfig] = useState<Record<string, any>>({});

  const getProductAttr = (product: any, code: string): string | number | null => {
    if (!product) return null;
    const av = product.attributeValues?.find((a: any) => a.categoryAttribute?.code === code);
    if (!av) return null;
    return av.valueString || av.valueNumber || (av.valueBoolean ? 'হ্যাঁ' : 'না');
  };

  // Compatibility checks
  const compatibilityIssues = useMemo(() => {
    const issues: Array<{ severity: 'warn' | 'error'; message: string }> = [];

    const cpu = config.cpu, mb = config.motherboard;
    if (cpu && mb) {
      const cpuSocket = getProductAttr(cpu, 'socket');
      const mbSocket = getProductAttr(mb, 'socket');
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        issues.push({
          severity: 'error',
          message: `CPU সকেট (${cpuSocket}) এবং মাদারবোর্ড সকেট (${mbSocket}) মেলে না`,
        });
      }
    }

    const ram = config.ram;
    if (mb && ram) {
      const mbRamType = getProductAttr(mb, 'ram_type');
      const ramType = getProductAttr(ram, 'type');
      if (mbRamType && ramType && mbRamType !== ramType) {
        issues.push({
          severity: 'error',
          message: `মাদারবোর্ড সাপোর্ট করে ${mbRamType}, কিন্তু নির্বাচিত র্যাম হলো ${ramType}`,
        });
      }
    }

    const psu = config.psu, gpu = config.gpu;
    if (psu) {
      const psuWatt = getProductAttr(psu, 'wattage') as number | null;
      if (psuWatt) {
        const gpuTdp = gpu ? (getProductAttr(gpu, 'tdp') as number | null) || 0 : 0;
        const cpuTdp = cpu ? (getProductAttr(cpu, 'tdp') as number | null) || 0 : 0;
        const estimated = cpuTdp + gpuTdp + 100;
        if (estimated > psuWatt * 0.85) {
          issues.push({
            severity: 'warn',
            message: `PSU (${psuWatt}W) সম্ভবত অপর্যাপ্ত। সিস্টেম আনুমানিক ${estimated}W প্রয়োজন।`,
          });
        }
      }
    }

    if (config.case && gpu) {
      const maxGpuLen = getProductAttr(config.case, 'max_gpu_length') as number | null;
      const gpuLen = getProductAttr(gpu, 'length') as number | null;
      if (maxGpuLen && gpuLen && gpuLen > maxGpuLen) {
        issues.push({
          severity: 'error',
          message: `GPU দৈর্ঘ্য (${gpuLen}mm) কেসের সর্বোচ্চ গ্যাপ (${maxGpuLen}mm) অতিক্রম করে`,
        });
      }
    }

    return issues;
  }, [config]);

  const totalPrice = useMemo(() => {
    return Object.values(config).reduce((sum: number, p: any) => sum + (p?.sellingPrice || 0), 0);
  }, [config]);

  const requiredSlots = CONFIG_SLOTS.filter((s) => s.required);
  const completedRequired = requiredSlots.filter((s) => config[s.key]).length;
  const canAddToCart = completedRequired === requiredSlots.length && !compatibilityIssues.some((i) => i.severity === 'error');

  const handleAddToCart = async () => {
    if (!user) {
      navigate({ name: 'customer-auth' });
      return;
    }
    if (!canAddToCart) {
      toast.error('কনফিগারেশন সম্পূর্ণ করুন অথবা কম্প্যাটিবিলিটি সমস্যা সমাধান করুন');
      return;
    }
    try {
      for (const slot of CONFIG_SLOTS) {
        const product = config[slot.key];
        if (product) {
          await apiPost('/api/cart', {
            productId: product.id,
            quantity: 1,
            configuration: { type: 'pc_build', slot: slot.key, slotLabel: slot.labelBn },
          });
        }
      }
      toast.success('কাস্টম পিসি কার্টে যোগ করা হয়েছে!');
      navigate({ name: 'cart' });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Cpu className="h-7 w-7 text-primary" /> কাস্টম পিসি কনফিগারেটর
        </h1>
        <p className="text-muted-foreground text-sm mt-1">নিজের পছন্দমতো কম্পোনেন্ট বেছে নিন। আমরা কম্প্যাটিবিলিটি চেক করে দিচ্ছি।</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Configuration slots */}
        <div className="space-y-3">
          {CONFIG_SLOTS.map((slot) => (
            <ConfiguratorSlot
              key={slot.key}
              slot={slot}
              selectedProduct={config[slot.key]}
              onSelect={(product) => setConfig({ ...config, [slot.key]: product })}
              onRemove={() => setConfig({ ...config, [slot.key]: null })}
            />
          ))}
        </div>

        {/* Summary sidebar */}
        <Card className="p-5 sticky top-32 self-start h-fit">
          <h3 className="font-semibold mb-3">বিল্ড সারাংশ</h3>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">নির্বাচিত কম্পোনেন্ট</span>
              <span className="font-medium">{Object.values(config).filter(Boolean).length} / {CONFIG_SLOTS.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">আবশ্যক সম্পন্ন</span>
              <span className="font-medium">{completedRequired} / {requiredSlots.length}</span>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Compatibility */}
          {compatibilityIssues.length > 0 ? (
            <div className="space-y-2 mb-3">
              <h4 className="text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-amber-500" /> কম্প্যাটিবিলিটি সতর্কতা
              </h4>
              {compatibilityIssues.map((issue, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded ${issue.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-700'}`}
                >
                  {issue.message}
                </div>
              ))}
            </div>
          ) : Object.values(config).filter(Boolean).length > 0 ? (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded mb-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">কোনো কম্প্যাটিবিলিটি সমস্যা নেই</span>
            </div>
          ) : null}

          <Separator className="my-3" />

          <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto scrollbar-thin">
            {CONFIG_SLOTS.map((slot) => {
              const p = config[slot.key];
              if (!p) return null;
              return (
                <div key={slot.key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate">{slot.labelBn}</span>
                  <span className="font-medium">{formatMoney(p.sellingPrice)}</span>
                </div>
              );
            })}
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between text-base font-bold mb-3">
            <span>সর্বমোট</span>
            <span className="text-primary">{formatMoney(totalPrice)}</span>
          </div>

          <Button className="w-full gap-2" onClick={handleAddToCart} disabled={!canAddToCart}>
            <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
          </Button>
          {!canAddToCart && Object.values(config).filter(Boolean).length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              সকল আবশ্যক কম্পোনেন্ট নির্বাচন করুন এবং কম্প্যাটিবিলিটি সমস্যা সমাধান করুন
            </p>
          )}

          <div className="mt-3 p-2 bg-secondary/50 rounded text-[10px] text-muted-foreground text-center">
            <Package className="h-3 w-3 inline mr-1" />
            ফ্রি অ্যাসেম্বলি · ১ বছর সার্ভিস ওয়ারেন্টি
          </div>
        </Card>
      </div>
    </div>
  );
}
