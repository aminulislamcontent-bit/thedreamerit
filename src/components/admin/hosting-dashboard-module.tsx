// Hosting Dashboard Module - Hostinger-style custom hosting control panel
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Server, Globe, Database, HardDrive, Cpu, Activity, Zap, Cloud,
  Shield, RefreshCw, Settings, Plus, Play, Pause, Square, Terminal,
  GitBranch, Box, Layers, Network, Lock, Eye, MoreVertical,
  CheckCircle2, AlertCircle, Clock, Power,
} from 'lucide-react';

interface DeployedApp {
  id: string;
  name: string;
  type: 'nextjs' | 'nodejs' | 'python' | 'static' | 'database' | 'mobile';
  domain: string;
  status: 'running' | 'stopped' | 'deploying' | 'error';
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
  lastDeploy: string;
  icon: any;
  color: string;
}

const DEPLOYED_APPS: DeployedApp[] = [
  {
    id: 'app-1',
    name: 'Dreamer IT - Main Website',
    type: 'nextjs',
    domain: 'thedreamerit.com',
    status: 'running',
    cpu: 23,
    memory: 45,
    storage: 12,
    uptime: '99.98%',
    lastDeploy: '২ ঘন্টা আগে',
    icon: Globe,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'app-2',
    name: 'Admin Dashboard API',
    type: 'nodejs',
    domain: 'api.thedreamerit.com',
    status: 'running',
    cpu: 18,
    memory: 32,
    storage: 8,
    uptime: '99.95%',
    lastDeploy: '৫ ঘন্টা আগে',
    icon: Server,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'app-3',
    name: 'AI Automation Worker',
    type: 'python',
    domain: 'worker.thedreamerit.com',
    status: 'running',
    cpu: 67,
    memory: 78,
    storage: 24,
    uptime: '99.92%',
    lastDeploy: '১ দিন আগে',
    icon: Cpu,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'app-4',
    name: 'Production Database',
    type: 'database',
    domain: 'db.internal',
    status: 'running',
    cpu: 12,
    memory: 56,
    storage: 67,
    uptime: '100%',
    lastDeploy: '—',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'app-5',
    name: 'Dreamer IT Mobile App API',
    type: 'mobile',
    domain: 'm.thedreamerit.com',
    status: 'deploying',
    cpu: 5,
    memory: 12,
    storage: 4,
    uptime: '—',
    lastDeploy: 'এইমাত্র',
    icon: Box,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'app-6',
    name: 'Static Assets CDN',
    type: 'static',
    domain: 'cdn.thedreamerit.com',
    status: 'running',
    cpu: 3,
    memory: 8,
    storage: 89,
    uptime: '100%',
    lastDeploy: '৩ দিন আগে',
    icon: Cloud,
    color: 'from-indigo-500 to-violet-500',
  },
];

export function HostingDashboardModule() {
  const [apps, setApps] = useState(DEPLOYED_APPS);

  const toggleApp = (id: string) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'running' ? 'stopped' : 'running' }
          : a
      )
    );
  };

  const totalCpu = apps.reduce((s, a) => s + a.cpu, 0) / apps.length;
  const totalMemory = apps.reduce((s, a) => s + a.memory, 0) / apps.length;
  const totalStorage = apps.reduce((s, a) => s + a.storage, 0) / apps.length;
  const runningCount = apps.filter((a) => a.status === 'running').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" /> কাস্টম হোস্টিং ড্যাশবোর্ড
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-চালিত অটোমেটিক ডেপ্লয়মেন্ট ও সার্ভার ম্যানেজমেন্ট (Hostinger-style)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> SSH টার্মিনাল
          </Button>
          <Button className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> নতুন অ্যাপ ডেপ্লয়
          </Button>
        </div>
      </div>

      {/* Server resources overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium">CPU</span>
            </div>
            <Badge variant={totalCpu > 70 ? 'destructive' : 'secondary'} className="text-[10px]">
              {totalCpu > 70 ? 'উচ্চ' : 'স্বাভাবিক'}
            </Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{Math.round(totalCpu)}%</div>
          <Progress value={totalCpu} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground mt-1">8 cores · 3.2GHz avg</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium">Memory</span>
            </div>
            <Badge variant={totalMemory > 70 ? 'destructive' : 'secondary'} className="text-[10px]">
              {totalMemory > 70 ? 'উচ্চ' : 'স্বাভাবিক'}
            </Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{Math.round(totalMemory)}%</div>
          <Progress value={totalMemory} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground mt-1">32 GB · DDR4 ECC</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium">Storage</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">NVMe SSD</Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{Math.round(totalStorage)}%</div>
          <Progress value={totalStorage} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground mt-1">1 TB · 940 GB ব্যবহৃত</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium">Apps</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{runningCount} চলমান</Badge>
          </div>
          <div className="text-2xl font-bold mb-1">{apps.length}</div>
          <Progress value={(runningCount / apps.length) * 100} className="h-1.5" />
          <div className="text-[10px] text-muted-foreground mt-1">মোট ডেপ্লয়ড অ্যাপ</div>
        </Card>
      </div>

      {/* Quick deploy templates */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" /> কুইক ডেপ্লয় টেমপ্লেট
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Next.js', icon: Globe, color: 'text-black bg-gray-100' },
            { name: 'Node.js', icon: Server, color: 'text-green-600 bg-green-50' },
            { name: 'Python', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
            { name: 'WordPress', icon: Box, color: 'text-blue-700 bg-blue-50' },
            { name: 'Database', icon: Database, color: 'text-amber-600 bg-amber-50' },
            { name: 'Static Site', icon: Cloud, color: 'text-violet-600 bg-violet-50' },
          ].map((tpl, i) => (
            <button
              key={i}
              className="p-3 rounded-lg border border-border/40 hover:border-blue-500 hover:shadow-md transition group text-center"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tpl.color} mx-auto mb-2 group-hover:scale-110 transition`}>
                <tpl.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-medium">{tpl.name}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Deployed apps */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" /> ডেপ্লয়ড অ্যাপ্লিকেশন
          </h3>
          <Button variant="ghost" size="sm" className="gap-1">
            <RefreshCw className="h-3 w-3" /> রিফ্রেশ
          </Button>
        </div>

        <div className="divide-y divide-border/40">
          {apps.map((app) => (
            <div key={app.id} className="p-4 hover:bg-secondary/20 transition">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${app.color} text-white shrink-0`}>
                  <app.icon className="h-5 w-5" />
                </div>

                {/* App info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{app.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] ${
                        app.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'deploying' ? 'bg-amber-100 text-amber-700' :
                        app.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-secondary'
                      }`}
                    >
                      {app.status === 'running' && <CheckCircle2 className="mr-1 h-2 w-2" />}
                      {app.status === 'deploying' && <Clock className="mr-1 h-2 w-2 animate-spin" />}
                      {app.status === 'error' && <AlertCircle className="mr-1 h-2 w-2" />}
                      {app.status === 'stopped' && <Square className="mr-1 h-2 w-2" />}
                      {app.status === 'running' ? 'চলমান' : app.status === 'deploying' ? 'ডেপ্লয় হচ্ছে' : app.status === 'error' ? 'ত্রুটি' : 'বন্ধ'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] uppercase">{app.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <a href={`https://${app.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {app.domain}
                    </a>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {app.lastDeploy}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-emerald-600" /> {app.uptime}</span>
                  </div>

                  {/* Resource usage */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>CPU</span>
                        <span>{app.cpu}%</span>
                      </div>
                      <Progress value={app.cpu} className="h-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Memory</span>
                        <span>{app.memory}%</span>
                      </div>
                      <Progress value={app.memory} className="h-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Storage</span>
                        <span>{app.storage}%</span>
                      </div>
                      <Progress value={app.storage} className="h-1" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => toggleApp(app.id)}
                    title={app.status === 'running' ? 'বন্ধ করুন' : 'চালু করুন'}
                  >
                    {app.status === 'running' ? (
                      <Pause className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="রিস্টার্ট">
                    <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="সেটিংস">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="আরও">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Server info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-600" /> সার্ভার ইনফো
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">OS</span>
              <span className="font-medium">Ubuntu 22.04 LTS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-medium">Intel Xeon 8-core @ 3.2GHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAM</span>
              <span className="font-medium">32 GB DDR4 ECC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">1 TB NVMe SSD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bandwidth</span>
              <span className="font-medium">10 TB / month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP</span>
              <span className="font-mono text-xs">103.x.x.x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">Dhaka, BD 🇧🇩</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" /> সিকিউরিটি স্ট্যাটাস
          </h3>
          <div className="space-y-2">
            {[
              { label: 'SSL সার্টিফিকেট', status: 'active', value: 'Let\'s Encrypt' },
              { label: 'ফায়ারওয়াল (UFW)', status: 'active', value: 'সক্রিয়' },
              { label: 'Fail2Ban', status: 'active', value: 'সক্রিয়' },
              { label: 'SSH Key Auth', status: 'active', value: 'সক্রিয়' },
              { label: 'অটো সিকিউরিটি আপডেট', status: 'active', value: 'দৈনিক' },
              { label: 'ডিডোস সুরক্ষা', status: 'active', value: 'Cloudflare' },
              { label: 'ব্যাকআপ', status: 'active', value: 'দৈনিক ৩০ দিন' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{s.label}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">{s.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI deployment note */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-violet-900">AI-চালিত অটো ডেপ্লয়মেন্ট</h3>
            <p className="text-xs text-violet-700 mt-1">
              Git push করলেই AI স্বয়ংক্রিয়ভাবে কোড টেস্ট করবে, বিল্ড করবে এবং প্রোডাকশনে ডেপ্লয় করবে।
              কোনো ম্যানুয়াল ইন্টারভেনশন লাগবে না। রোলব্যাক স্বয়ংক্রিয় যদি কোনো এরর আসে।
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700">
                <GitBranch className="h-3 w-3" /> Git কানেক্ট করুন
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 border-violet-300 text-violet-700">
                <Terminal className="h-3 w-3" /> টার্মিনাল
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
