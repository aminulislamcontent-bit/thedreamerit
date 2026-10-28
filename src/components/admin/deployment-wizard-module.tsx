// Deployment Wizard Module - Step-by-step guide to go live on thedreamerit.com
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Rocket, Globe, Server, Database, Shield, CheckCircle2, AlertCircle,
  Cloud, Terminal, Copy, ExternalLink, ChevronRight, ChevronLeft,
  Zap, FileText, Key, Mail, Download, Play, Settings, RefreshCw,
  Check, X, Info, Sparkles, Bot,
} from 'lucide-react';
import { BUSINESS } from '@/lib/config';
import { toast } from 'sonner';

type DeployStep = 'overview' | 'hosting' | 'domain' | 'env' | 'database' | 'build' | 'verify';

export function DeploymentWizardModule() {
  const [step, setStep] = useState<DeployStep>('overview');
  const [selectedHost, setSelectedHost] = useState<'vercel' | 'vps' | 'shared' | null>(null);

  const steps: { id: DeployStep; label: string; icon: any }[] = [
    { id: 'overview', label: '১. সারাংশ', icon: Info },
    { id: 'hosting', label: '২. হোস্টিং নির্বাচন', icon: Server },
    { id: 'domain', label: '৩. ডোমেইন সেটআপ', icon: Globe },
    { id: 'env', label: '৪. এনভায়রনমেন্ট', icon: Key },
    { id: 'database', label: '৫. ডাটাবেস', icon: Database },
    { id: 'build', label: '৬. বিল্ড ও ডিপ্লয়', icon: Rocket },
    { id: 'verify', label: '৭. যাচাই', icon: CheckCircle2 },
  ];

  const currentStepIdx = steps.findIndex((s) => s.id === step);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} কপি হয়েছে`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-600" /> ডিপ্লয়মেন্ট উইজার্ড
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {BUSINESS.domain} এ প্রজেক্ট লাইভ করার সম্পূর্ণ গাইড
          </p>
        </div>
        <a href="/DEPLOYMENT_PLAN.md" target="_blank">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> পূর্ণ গাইড
          </Button>
        </a>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3 overflow-x-auto scrollbar-thin">
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isComplete = idx < currentStepIdx;
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <button
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-1 transition ${isActive ? 'text-emerald-600' : isComplete ? 'text-emerald-500' : 'text-muted-foreground'}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isActive ? 'bg-emerald-600 text-white' : isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-background border border-border'}`}>
                  {isComplete ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <div className="text-[10px] font-medium whitespace-nowrap">{s.label}</div>
              </button>
              {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {/* Step 1: Overview */}
        {step === 'overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">🚀 ডিপ্লয়মেন্ট সারাংশ</h3>
              <p className="text-sm text-muted-foreground">
                এই উইজার্ড আপনাকে <strong className="text-emerald-600">{BUSINESS.domain}</strong> এ প্রজেক্ট লাইভ করতে ধাপে ধাপে গাইড করবে।
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Rocket className="h-8 w-8 text-emerald-600 mb-2" />
                <h4 className="font-semibold text-sm">৭টি ধাপ</h4>
                <p className="text-xs text-muted-foreground mt-1">হোস্টিং থেকে যাচাই পর্যন্ত</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-semibold text-sm">১-২ ঘন্টা</h4>
                <p className="text-xs text-muted-foreground mt-1">সম্পূর্ণ ডিপ্লয়মেন্ট</p>
              </div>
              <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
                <Bot className="h-8 w-8 text-violet-600 mb-2" />
                <h4 className="font-semibold text-sm">৬টি AI এজেন্ট</h4>
                <p className="text-xs text-muted-foreground mt-1">ডিপ্লয় পরে চালু হবে</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-2">📋 কী কী প্রয়োজন হবে:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  'ডোমেইন: thedreamerit.com (ইতিমধ্যে আছে)',
                  'হোস্টিং: Vercel (ফ্রি) বা VPS ($6/মাস)',
                  'ডাটাবেস: PostgreSQL (ফ্রি টিয়ার)',
                  'ফাইল স্টোরেজ: Cloudinary (ফ্রি 25GB)',
                  'ইমেইল: Resend (ফ্রি 3000/মাস)',
                  'SSL: স্বয়ংক্রিয় (ফ্রি)',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-amber-900">গুরুত্বপূর্ণ সতর্কতা</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    শেয়ার্ড হোস্টিং ব্যবহার করলে AI এজেন্টগুলো (ভিডিও জেনারেশন, ব্যাকগ্রাউন্ড প্রসেস) কাজ করবে না।
                    সম্পূর্ণ ফিচারের জন্য Vercel বা VPS ব্যবহার করুন।
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep('hosting')} className="w-full gap-2" size="lg">
              শুরু করুন <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Hosting Selection */}
        {step === 'hosting' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🏠 হোস্টিং নির্বাচন করুন</h3>
            <p className="text-sm text-muted-foreground">আপনার প্রয়োজন অনুযায়ী সেরা অপশন বেছে নিন</p>

            <div className="space-y-3">
              {/* Vercel */}
              <button
                onClick={() => setSelectedHost('vercel')}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${selectedHost === 'vercel' ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:border-emerald-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shrink-0">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">Vercel</h4>
                      <Badge className="bg-emerald-100 text-emerald-700">সুপারিশকৃত</Badge>
                      <Badge variant="secondary">ফ্রি টিয়ার</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Next.js এর নির্মাতা — সবচেয়ে সহজ ডিপ্লয়</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> ফ্রি SSL</span>
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> অটো-ডিপ্লয়</span>
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> CDN</span>
                      <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-3 w-3" /> PostgreSQL লাগবে</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* VPS */}
              <button
                onClick={() => setSelectedHost('vps')}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${selectedHost === 'vps' ? 'border-emerald-500 bg-emerald-50' : 'border-border hover:border-emerald-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
                    <Server className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">VPS (ভার্চুয়াল সার্ভার)</h4>
                      <Badge className="bg-blue-100 text-blue-700">সম্পূর্ণ নিয়ন্ত্রণ</Badge>
                      <Badge variant="secondary">$6-12/মাস</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">সম্পূর্ণ নিয়ন্ত্রণ, সব AI এজেন্ট কাজ করবে</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> SQLite/PostgreSQL</span>
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> ব্যাকগ্রাউন্ড প্রসেস</span>
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> ফাইল আপলোড</span>
                      <span className="flex items-center gap-1 text-amber-600"><AlertCircle className="h-3 w-3" /> টেকনিক্যাল জ্ঞান লাগবে</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Shared */}
              <button
                onClick={() => setSelectedHost('shared')}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${selectedHost === 'shared' ? 'border-amber-500 bg-amber-50' : 'border-border hover:border-amber-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">শেয়ার্ড হোস্টিং</h4>
                      <Badge className="bg-amber-100 text-amber-700">সুপারিশকৃত নয়</Badge>
                      <Badge variant="secondary">৳২০০-৫০০/মাস</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">সস্তা কিন্তু সীমিত ফিচার — AI এজেন্ট কাজ করবে না</p>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> সস্তা</span>
                      <span className="flex items-center gap-1 text-red-600"><X className="h-3 w-3" /> AI এজেন্ট না</span>
                      <span className="flex items-center gap-1 text-red-600"><X className="h-3 w-3" /> Next.js সমস্যা</span>
                      <span className="flex items-center gap-1 text-red-600"><X className="h-3 w-3" /> ব্যাকগ্রাউন্ড না</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {selectedHost === 'shared' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>সতর্কতা:</strong> শেয়ার্ড হোস্টিং ব্যবহার করলে AI প্রোডাক্ট উইজার্ড, AI ভিডিও স্টুডিও,
                    হোস্টিং ড্যাশবোর্ড, এবং ব্যাকগ্রাউন্ড অটোমেশন কাজ করবে না। শুধু বেসিক ওয়েবসাইট চলবে।
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('overview')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button
                onClick={() => setStep('domain')}
                disabled={!selectedHost}
                className="flex-1 gap-2"
              >
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Domain Setup */}
        {step === 'domain' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🌐 ডোমেইন সেটআপ</h3>
            <p className="text-sm text-muted-foreground">
              <strong className="text-emerald-600">{BUSINESS.domain}</strong> ডোমেইন কানেক্ট করুন
            </p>

            {selectedHost === 'vercel' && (
              <div className="space-y-3">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Vercel-এ ডোমেইন যোগ করুন:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>১. Vercel ড্যাশবোর্ডে যান → আপনার প্রজেক্ট সিলেক্ট করুন</li>
                    <li>২. <strong>Settings → Domains</strong> এ যান</li>
                    <li>৩. <strong>"Add Domain"</strong> এ ক্লিক করুন</li>
                    <li>৪. <code className="bg-background px-1 rounded">{BUSINESS.domain}</code> লিখুন</li>
                    <li>৫. Vercel আপনাকে DNS রেকর্ড দেখাবে</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900">DNS রেকর্ড (আপনার ডোমেইন রেজিস্ট্রারে):</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white p-2 rounded">
                      <code className="text-xs">A record: @ → 76.76.21.21</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('76.76.21.21', 'IP')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded">
                      <code className="text-xs">CNAME: www → cname.vercel-dns.com</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('cname.vercel-dns.com', 'CNAME')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <a href="https://vercel.com/docs/projects/domains" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" /> Vercel ডোমেইন গাইড
                  </Button>
                </a>
              </div>
            )}

            {selectedHost === 'vps' && (
              <div className="space-y-3">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">VPS-এ ডোমেইন কানেক্ট করুন:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>১. আপনার ডোমেইন রেজিস্ট্রারে যান (Namecheap/Hostinger)</li>
                    <li>২. <strong>DNS Settings</strong> এ যান</li>
                    <li>৩. A record যোগ করুন: <code className="bg-background px-1 rounded">@ → [আপনার সার্ভার IP]</code></li>
                    <li>৪. www এর জন্য আরেকটি A record: <code className="bg-background px-1 rounded">www → [আপনার সার্ভার IP]</code></li>
                    <li>৫. SSL ইনস্টল করুন: <code className="bg-background px-1 rounded">sudo certbot --nginx -d thedreamerit.com</code></li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900">DNS রেকর্ড:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white p-2 rounded">
                      <code className="text-xs">A: @ → আপনার_সার্ভার_IP</code>
                      <Badge variant="secondary">প্রয়োজন</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded">
                      <code className="text-xs">A: www → আপনার_সার্ভার_IP</code>
                      <Badge variant="secondary">প্রয়োজন</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedHost === 'shared' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                শেয়ার্ড হোস্টিংয়ে ডোমেইন স্বয়ংক্রিয়ভাবে কানেক্ট থাকে। cPanel থেকে addon domain হিসেবে যোগ করুন।
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('hosting')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button onClick={() => setStep('env')} className="flex-1 gap-2">
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Environment Variables */}
        {step === 'env' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🔑 এনভায়রনমেন্ট ভ্যারিয়েবল</h3>
            <p className="text-sm text-muted-foreground">
              প্রয়োজনীয় সিক্রেট কী ও কনফিগারেশন সেট করুন
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: 'DATABASE_URL', required: true, desc: 'PostgreSQL কানেকশন স্ট্রিং', icon: Database },
                { name: 'SESSION_SECRET', required: true, desc: '৩২+ অক্ষরের র্যান্ডম স্ট্রিং', icon: Key },
                { name: 'NEXT_PUBLIC_BASE_URL', required: true, desc: 'https://thedreamerit.com', icon: Globe },
                { name: 'RESEND_API_KEY', required: false, desc: 'ইমেইল সার্ভিস', icon: Mail },
                { name: 'CLOUDINARY_*', required: false, desc: 'ফাইল স্টোরেজ (Vercel)', icon: Cloud },
                { name: 'FACEBOOK_*', required: false, desc: 'Facebook পেজ API', icon: Bot },
                { name: 'WHATSAPP_*', required: false, desc: 'WhatsApp Business API', icon: Mail },
                { name: 'GOOGLE_*', required: false, desc: 'Google Search Console', icon: Globe },
              ].map((env, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border border-border/40 rounded-lg">
                  <env.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">{env.name}</code>
                      {env.required ? (
                        <Badge variant="secondary" className="text-[9px] bg-red-100 text-red-700">আবশ্যক</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">ঐচ্ছিক</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{env.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-violet-600" />
                <h4 className="font-semibold text-sm text-violet-900">.env.production টেমপ্লেট</h4>
              </div>
              <p className="text-xs text-violet-700 mb-2">
                সম্পূর্ণ এনভায়রনমেন্ট টেমপ্লেট প্রজেক্টে আছে। নিচের বাটন থেকে ডাউনলোড করুন।
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-violet-300 text-violet-700"
                onClick={() => copyToClipboard('cp .env.production .env && nano .env', 'কমান্ড')}
              >
                <Copy className="h-3 w-3" /> কমান্ড কপি করুন
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('domain')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button onClick={() => setStep('database')} className="flex-1 gap-2">
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Database */}
        {step === 'database' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🗄️ ডাটাবেস সেটআপ</h3>
            <p className="text-sm text-muted-foreground">
              {selectedHost === 'vercel' ? 'PostgreSQL (Vercel Postgres বা Supabase)' : 'PostgreSQL সার্ভারে ইনস্টল'}
            </p>

            {selectedHost === 'vercel' && (
              <div className="space-y-3">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Vercel Postgres সেটআপ:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>১. Vercel ড্যাশবোর্ড → Storage → Create Database</li>
                    <li>২. Postgres সিলেক্ট করুন (ফ্রি টিয়ার)</li>
                    <li>৩. প্রজেক্টে কানেক্ট করুন</li>
                    <li>৪. <code className="bg-background px-1 rounded">DATABASE_URL</code> স্বয়ংক্রিয়ভাবে যোগ হবে</li>
                  </ol>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-1 text-emerald-900">বিকল্প: Supabase (ফ্রি)</h4>
                  <p className="text-xs text-emerald-700">supabase.com — ৫০০MB ফ্রি, ভালো ফ্রি টিয়ার</p>
                </div>
              </div>
            )}

            {selectedHost === 'vps' && (
              <div className="space-y-3">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">PostgreSQL ইনস্টল ও সেটআপ:</h4>
                  <div className="bg-background p-3 rounded font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span># PostgreSQL ইনস্টল</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('sudo apt install -y postgresql postgresql-contrib', 'কমান্ড')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span># ডাটাবেস তৈরি</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('sudo -u postgres psql\nCREATE DATABASE dreamer_it_prod;\nCREATE USER dreamer_user WITH PASSWORD \'strong-password\';\nGRANT ALL PRIVILEGES ON DATABASE dreamer_it_prod TO dreamer_user;\n\\q', 'কমান্ড')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span># Schema পুশ</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('bun run db:push', 'কমান্ড')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span># সিড ডেটা</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard('bun run scripts/seed.ts', 'কমান্ড')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>মাইগ্রেশন:</strong> ডেভেলপমেন্ট SQLite থেকে প্রোডাকশন PostgreSQL-এ ডেটা মাইগ্রেট করতে হবে।
                  <code className="block mt-1 bg-white/60 p-1 rounded">sqlite3 db/custom.db .dump {'>'} backup.sql</code>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('env')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button onClick={() => setStep('build')} className="flex-1 gap-2">
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Build & Deploy */}
        {step === 'build' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🚀 বিল্ড ও ডিপ্লয়</h3>
            <p className="text-sm text-muted-foreground">
              {selectedHost === 'vercel' ? 'Vercel অটো-ডিপ্লয় করবে' : 'ম্যানুয়ালি বিল্ড ও চালু করুন'}
            </p>

            {selectedHost === 'vercel' && (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-2" />
                  <h4 className="font-semibold text-sm text-emerald-900">Vercel অটো-ডিপ্লয়</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Git-এ push করলেই Vercel স্বয়ংক্রিয়ভাবে বিল্ড ও ডিপ্লয় করবে। কোনো ম্যানুয়াল কমান্ড লাগে না।
                  </p>
                </div>
                <ol className="space-y-2 text-sm">
                  <li>১. GitHub-এ কোড push করুন</li>
                  <li>২. Vercel স্বয়ংক্রিয়ভাবে বিল্ড শুরু করবে</li>
                  <li>৩. ২-৩ মিনিটে ডিপ্লয় সম্পন্ন</li>
                  <li>৪. <code className="bg-background px-1 rounded">https://thedreamerit.com</code> এ লাইভ</li>
                </ol>
              </div>
            )}

            {selectedHost === 'vps' && (
              <div className="space-y-3">
                <div className="bg-background p-4 rounded-lg font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span># ডিপেন্ডেন্সি ইনস্টল</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard('bun install', 'কমান্ড')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span># বিল্ড</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard('bun run build', 'কমান্ড')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span># PM2 দিয়ে চালু</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard('pm2 start "bun run start" --name dreamer-it\npm2 startup\npm2 save', 'কমান্ড')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span># Nginx রিলোড</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard('sudo systemctl reload nginx', 'কমান্ড')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('database')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button onClick={() => setStep('verify')} className="flex-1 gap-2">
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Verify */}
        {step === 'verify' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">✅ যাচাই চেকলিস্ট</h3>
            <p className="text-sm text-muted-foreground">ডিপ্লয় সফল হয়েছে কিনা যাচাই করুন</p>

            <div className="space-y-2">
              {[
                'সাইট https://thedreamerit.com এ লোড হচ্ছে',
                'SSL সার্টিফিকেট ভ্যালিড',
                'অ্যাডমিন লগইন কাজ করছে (admin@thedreamerit.com)',
                'কাস্টমার রেজিস্ট্রেশন কাজ করছে',
                'প্রোডাক্ট ক্যাটালগ দেখাচ্ছে',
                'কার্ট + চেকআউট কাজ করছে',
                'WhatsApp উইজেট দেখাচ্ছে',
                'Google Maps এম্বেড কাজ করছে',
                'মোবাইলে রেসপন্সিভ',
                'পেজ স্পিড ৩ সেকেন্ডের নিচে',
                'AI প্রোডাক্ট উইজার্ড কাজ করছে',
                'SEO AI এজেন্ট কাজ করছে',
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-2 p-2 hover:bg-secondary/30 rounded cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-emerald-600" />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <Separator />

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">🎉 অভিনন্দন!</h4>
              <p className="text-sm text-emerald-700 mt-1">
                সব চেক সম্পন্ন হলে আপনার প্ল্যাটফর্ম সম্পূর্ণ লাইভ!
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                {BUSINESS.domain} এ এখন আপনার সম্পূর্ণ ই-কমার্স + ERP + AI প্ল্যাটফর্ম চলছে
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('build')} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> পিছনে
              </Button>
              <Button
                onClick={() => { setStep('overview'); setSelectedHost(null); }}
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" /> শুরু থেকে আবার
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI Agent compatibility table */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-600" /> AI এজেন্ট কম্প্যাটিবিলিটি
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          হোস্টিং অনুযায়ী কোন ফিচার কাজ করবে
        </p>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase">
              <tr>
                <th className="text-left p-3">ফিচার</th>
                <th className="text-center p-3">Vercel</th>
                <th className="text-center p-3">VPS</th>
                <th className="text-center p-3">শেয়ার্ড</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'ওয়েবসাইট', vercel: true, vps: true, shared: 'limited' },
                { feature: 'অ্যাডমিন প্যানেল', vercel: true, vps: true, shared: true },
                { feature: 'প্রোডাক্ট ক্যাটালগ', vercel: true, vps: true, shared: true },
                { feature: 'কার্ট + চেকআউট', vercel: true, vps: true, shared: true },
                { feature: 'AI প্রোডাক্ট উইজার্ড', vercel: 'limited', vps: true, shared: false },
                { feature: 'AI ভিডিও স্টুডিও', vercel: false, vps: true, shared: false },
                { feature: 'ব্যাকগ্রাউন্ড ক্রন জব', vercel: 'limited', vps: true, shared: false },
                { feature: 'হোস্টিং ড্যাশবোর্ড', vercel: false, vps: true, shared: false },
                { feature: 'ফাইল আপলোড', vercel: 'limited', vps: true, shared: 'limited' },
                { feature: 'SQLite ডাটাবেস', vercel: false, vps: true, shared: 'limited' },
                { feature: 'SSL', vercel: true, vps: true, shared: true },
                { feature: 'কাস্টম ডোমেইন', vercel: true, vps: true, shared: true },
              ].map((row, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="p-3 font-medium">{row.feature}</td>
                  <td className="p-3 text-center">
                    {row.vercel === true ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> :
                     row.vercel === 'limited' ? <span className="text-amber-600 text-xs">সীমিত</span> :
                     <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.vps === true ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> :
                     row.vps === 'limited' ? <span className="text-amber-600 text-xs">সীমিত</span> :
                     <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.shared === true ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> :
                     row.shared === 'limited' ? <span className="text-amber-600 text-xs">সীমিত</span> :
                     <X className="h-4 w-4 text-red-500 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cost comparison */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" /> খরচের তুলনা
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="p-4 border border-border/40 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-5 w-5 text-black" />
              <h4 className="font-semibold text-sm">Vercel</h4>
            </div>
            <div className="text-2xl font-bold">$0-20</div>
            <div className="text-xs text-muted-foreground">/মাস</div>
            <Separator className="my-2" />
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>হোস্টিং: ফ্রি</li>
              <li>ডাটাবেস: $0-10</li>
              <li>SSL: ফ্রি</li>
              <li>ফাইল: ফ্রি (Cloudinary)</li>
            </ul>
          </div>
          <div className="p-4 border-2 border-emerald-300 rounded-lg bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-sm">VPS</h4>
              <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">সুপারিশকৃত</Badge>
            </div>
            <div className="text-2xl font-bold">$6-12</div>
            <div className="text-xs text-muted-foreground">/মাস</div>
            <Separator className="my-2" />
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>হোস্টিং: $6-12</li>
              <li>ডাটাবেস: ইনক্লুডেড</li>
              <li>SSL: ফ্রি</li>
              <li>ফাইল: ইনক্লুডেড</li>
            </ul>
          </div>
          <div className="p-4 border border-amber-300 rounded-lg bg-amber-50/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h4 className="font-semibold text-sm">শেয়ার্ড</h4>
            </div>
            <div className="text-2xl font-bold">৳২০০-৫০০</div>
            <div className="text-xs text-muted-foreground">/মাস</div>
            <Separator className="my-2" />
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>হোস্টিং: ৳২০০-৫০০</li>
              <li>ডাটাবেস: ইনক্লুডেড</li>
              <li>SSL: ফ্রি</li>
              <li>⚠️ সীমিত ফিচার</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Clock } from 'lucide-react';
