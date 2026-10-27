// AI Automation Server Module - Auto-post, video gen, SMS reply, lead-to-invoice pipeline
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bot, Video, MessageSquare, Mail, Share2, FileText, TrendingUp,
  Workflow, Zap, Play, Pause, CheckCircle2, AlertCircle, Clock,
  Smartphone, Globe, Youtube, Facebook, Instagram, Twitter, Send,
  ArrowRight, Sparkles, Activity, Cpu,
} from 'lucide-react';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'paused' | 'draft';
  trigger: string;
  actions: string[];
  lastRun?: string;
  runsToday: number;
  color: string;
}

const AUTOMATION_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: 'wf-1',
    name: 'অটো সোশ্যাল পোস্টিং',
    description: 'নতুন প্রোডাক্ট এলে স্বয়ংক্রিয়ভাবে Facebook, Instagram, WhatsApp-এ পোস্ট তৈরি ও প্রকাশ',
    icon: Share2,
    status: 'active',
    trigger: 'নতুন প্রোডাক্ট প্রকাশিত হলে',
    actions: ['AI ক্যাপশন জেনারেট', 'ছবি অপটিমাইজ', 'Facebook পোস্ট', 'Instagram পোস্ট', 'WhatsApp স্টোরি'],
    lastRun: '৫ মিনিট আগে',
    runsToday: 12,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'wf-2',
    name: 'AI ভিডিও জেনারেশন',
    description: 'প্রোডাক্টের ছবি থেকে স্বয়ংক্রিয়ভাবে প্রমোশনাল ভিডিও তৈরি ও YouTube-এ আপলোড',
    icon: Video,
    status: 'active',
    trigger: 'দৈনিক সকাল ৯টা',
    actions: ['প্রোডাক্ট ছবি সিলেক্ট', 'AI স্ক্রিপ্ট জেনারেট', 'ভিডিও জেনারেট', 'ব্যাকগ্রাউন্ড মিউজিক', 'YouTube আপলোড'],
    lastRun: '২ ঘন্টা আগে',
    runsToday: 3,
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'wf-3',
    name: 'SMS ও WhatsApp অটো-রিপ্লাই',
    description: 'কাস্টমারের মেসেজে AI দিয়ে স্বয়ংক্রিয় রিপ্লাই (প্রাইস, স্টক, ডেলিভারি ইনফো)',
    icon: MessageSquare,
    status: 'active',
    trigger: 'নতুন মেসেজ এলে',
    actions: ['মেসেজ পার্স', 'AI রিপ্লাই জেনারেট', 'প্রাইস চেক', 'স্টক চেক', 'রিপ্লাই পাঠাও'],
    lastRun: 'এইমাত্র',
    runsToday: 47,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'wf-4',
    name: 'লিড টু ইনভয়েস পাইপলাইন',
    description: 'Facebook লিড থেকে শুরু করে ইনভয়েস পর্যন্ত সম্পূর্ণ প্রক্রিয়া স্বয়ংক্রিয়',
    icon: Workflow,
    status: 'active',
    trigger: 'নতুন লিড এলে',
    actions: ['লিড ক্যাপচার', 'কাস্টমার প্রোফাইল', 'প্রোডাক্ট সাজেশন', 'অর্ডার তৈরি', 'ইনভয়েস জেনারেট', 'WhatsApp নোটিফিকেশন'],
    lastRun: '১০ মিনিট আগে',
    runsToday: 8,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'wf-5',
    name: 'ইমেইল মার্কেটিং অটোমেশন',
    description: 'কাস্টমার সেগমেন্ট অনুযায়ী সাপ্তাহিক অফার ইমেইল স্বয়ংক্রিয়ভাবে পাঠানো',
    icon: Mail,
    status: 'paused',
    trigger: 'সাপ্তাহিক শুক্রবার',
    actions: ['কাস্টমার সেগমেন্ট', 'AI ইমেইল টেমপ্লেট', 'পার্সোনালাইজেশন', 'ইমেইল পাঠাও', 'ট্র্যাক ওপেন রেট'],
    lastRun: '৩ দিন আগে',
    runsToday: 0,
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'wf-6',
    name: 'কমিশন স্বয়ংক্রিয় হিসাব',
    description: 'বিক্রি হলে এমপ্লয়ির সেলিং আইডি অনুযায়ী কমিশন স্বয়ংক্রিয়ভাবে হিসাব',
    icon: TrendingUp,
    status: 'active',
    trigger: 'অর্ডার ডেলিভারি হলে',
    actions: ['সেলিং আইডি চেক', 'কমিশন রুল প্রয়োগ', 'কমিশন ট্রানজেকশন', 'এমপ্লয়ি নোটিফিকেশন'],
    lastRun: '৩০ মিনিট আগে',
    runsToday: 5,
    color: 'from-indigo-500 to-violet-500',
  },
];

const INTEGRATIONS = [
  { name: 'Facebook Pages', icon: Facebook, status: 'connected', color: 'text-blue-600 bg-blue-50' },
  { name: 'Instagram', icon: Instagram, status: 'connected', color: 'text-pink-600 bg-pink-50' },
  { name: 'WhatsApp Business', icon: MessageSquare, status: 'connected', color: 'text-emerald-600 bg-emerald-50' },
  { name: 'YouTube', icon: Youtube, status: 'connected', color: 'text-red-600 bg-red-50' },
  { name: 'SMS Gateway', icon: Smartphone, status: 'pending', color: 'text-amber-600 bg-amber-50' },
  { name: 'Email Service', icon: Mail, status: 'pending', color: 'text-violet-600 bg-violet-50' },
];

export function AiAutomationModule() {
  const [workflows, setWorkflows] = useState(AUTOMATION_WORKFLOWS);

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
          : w
      )
    );
  };

  const activeCount = workflows.filter((w) => w.status === 'active').length;
  const totalRunsToday = workflows.reduce((sum, w) => sum + w.runsToday, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-violet-600" /> AI অটোমেশন সার্ভার
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            স্বয়ংক্রিয় পোস্টিং, ভিডিও জেনারেশন, এসএমএস রিপ্লাই ও লিড-টু-ইনভয়েস পাইপলাইন
          </p>
        </div>
        <Button className="gap-1.5 bg-violet-600 hover:bg-violet-700">
          <Sparkles className="h-4 w-4" /> নতুন ওয়ার্কফ্লো
        </Button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center justify-between mb-1">
            <Bot className="h-5 w-5 text-violet-600" />
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Live</Badge>
          </div>
          <div className="text-2xl font-bold text-violet-700">{activeCount}</div>
          <div className="text-xs text-muted-foreground">সক্রিয় ওয়ার্কফ্লো</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center justify-between mb-1">
            <Activity className="h-5 w-5 text-emerald-600" />
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{totalRunsToday}</div>
          <div className="text-xs text-muted-foreground">আজকের রান</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <Zap className="h-5 w-5 text-amber-600" />
            <Badge className="bg-amber-100 text-amber-700 text-[10px]">99.9%</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-700">0</div>
          <div className="text-xs text-muted-foreground">ব্যর্থ রান</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <Cpu className="h-5 w-5 text-blue-600" />
            <Badge className="bg-blue-100 text-blue-700 text-[10px]">AI</Badge>
          </div>
          <div className="text-2xl font-bold text-blue-700">GLM-4</div>
          <div className="text-xs text-muted-foreground">AI মডেল</div>
        </Card>
      </div>

      {/* Pipeline visualization */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-violet-600" /> লিড-টু-ইনভয়েস পাইপলাইন
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
          {[
            { icon: Facebook, label: 'Facebook লিড', color: 'text-blue-600 bg-blue-50' },
            { icon: MessageSquare, label: 'WhatsApp চ্যাট', color: 'text-emerald-600 bg-emerald-50' },
            { icon: Bot, label: 'AI রিপ্লাই', color: 'text-violet-600 bg-violet-50' },
            { icon: FileText, label: 'অর্ডার তৈরি', color: 'text-amber-600 bg-amber-50' },
            { icon: FileText, label: 'ইনভয়েস', color: 'text-rose-600 bg-rose-50' },
            { icon: Send, label: 'ডেলিভারি', color: 'text-teal-600 bg-teal-50' },
            { icon: TrendingUp, label: 'কমিশন', color: 'text-indigo-600 bg-indigo-50' },
          ].map((step, idx, arr) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] text-center font-medium whitespace-nowrap">{step.label}</div>
              </div>
              {idx < arr.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Integrations */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600" /> কানেক্টেড ইন্টিগ্রেশন
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INTEGRATIONS.map((int, i) => (
            <div key={i} className={`p-3 rounded-lg border ${int.status === 'connected' ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${int.color}`}>
                  <int.icon className="h-4 w-4" />
                </div>
                {int.status === 'connected' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                )}
              </div>
              <div className="text-xs font-medium">{int.name}</div>
              <div className={`text-[10px] ${int.status === 'connected' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {int.status === 'connected' ? 'সংযুক্ত' : 'অপেক্ষমাণ'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Workflows list */}
      <div>
        <h3 className="font-semibold mb-3">অটোমেশন ওয়ার্কফ্লো</h3>
        <div className="grid lg:grid-cols-2 gap-3">
          {workflows.map((wf) => (
            <Card key={wf.id} className="p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${wf.color} text-white shrink-0`}>
                  <wf.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{wf.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] ${
                        wf.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : wf.status === 'paused'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-secondary'
                      }`}
                    >
                      {wf.status === 'active' ? 'সক্রিয়' : wf.status === 'paused' ? 'বিরতি' : 'ড্রাফট'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wf.description}</p>
                </div>
                <Switch
                  checked={wf.status === 'active'}
                  onCheckedChange={() => toggleWorkflow(wf.id)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-muted-foreground">ট্রিগার:</span>
                  <span className="font-medium">{wf.trigger}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {wf.actions.map((action, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px] font-normal">{action}</Badge>
                      {i < wf.actions.length - 1 && <ArrowRight className="h-2 w-2 text-muted-foreground" />}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-600" />
                    <span className="font-medium">{wf.runsToday}</span>
                    <span className="text-muted-foreground">রান আজ</span>
                  </div>
                  {wf.lastRun && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {wf.lastRun}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-xs gap-1">
                  <Play className="h-3 w-3" /> এখন চালান
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI capabilities */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-violet-900">AI ক্ষমতাসমূহ</h3>
            <p className="text-xs text-violet-700 mt-1 mb-3">
              GLM-4 AI মডেল দিয়ে চালিত — সম্পূর্ণ স্বয়ংক্রিয় কনটেন্ট জেনারেশন ও কাস্টমার ইন্টারঅ্যাকশন
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                '✓ বাংলা ও ইংরেজি কনটেন্ট জেনারেশন',
                '✓ প্রোডাক্ট ডেসক্রিপশন অটো-রাইট',
                '✓ সোশ্যাল মিডিয়া ক্যাপশন',
                '✓ ভিডিও স্ক্রিপ্ট জেনারেশন',
                '✓ কাস্টমার মেসেজ রিপ্লাই',
                '✓ FAQ অটো-জেনারেট',
                '✓ SEO মেটাডেটা',
                '✓ ইমেইল টেমপ্লেট',
                '✓ কমিশন ক্যালকুলেশন',
              ].map((cap, i) => (
                <div key={i} className="text-violet-800">{cap}</div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
