// Marketing AI Agent Module - Free marketing automation across all channels
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bot, Megaphone, Share2, Globe, Sparkles, Zap, TrendingUp,
  CheckCircle2, Clock, RefreshCw, Play, Pause, Eye, Target,
  Facebook, Instagram, Youtube, MessageCircle, Send, Mail,
  ShoppingCart, Users, BarChart3, ChevronRight, Plus, Settings,
  Heart, Bookmark, Tag, Image as ImageIcon, Video, FileText,
  Search, MapPin, Truck,
} from 'lucide-react';
import { BUSINESS } from '@/lib/config';

interface FreeMarketingChannel {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'paused';
  postsToday: number;
  reachToday: number;
  color: string;
  freeOrPaid: 'free' | 'freemium';
}

interface MarketingCampaign {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'scheduled' | 'completed';
  reach: number;
  clicks: number;
  conversions: number;
  startDate: string;
  budget: number;
  spent: number;
}

const FREE_CHANNELS: FreeMarketingChannel[] = [
  { id: 'fb-page', name: 'Facebook Page', description: 'অর্গানিক পোস্ট + স্টোরি', icon: Facebook, status: 'active', postsToday: 5, reachToday: 2340, color: 'text-blue-600', freeOrPaid: 'free' },
  { id: 'fb-group', name: 'Facebook Groups', description: 'টেক গ্রুপে অটো-পোস্ট', icon: Users, status: 'active', postsToday: 12, reachToday: 5680, color: 'text-blue-700', freeOrPaid: 'free' },
  { id: 'fb-marketplace', name: 'Facebook Marketplace', description: 'প্রোডাক্ট লিস্টিং', icon: ShoppingCart, status: 'active', postsToday: 8, reachToday: 1890, color: 'text-blue-500', freeOrPaid: 'free' },
  { id: 'instagram', name: 'Instagram', description: 'ফিড + রিলস + স্টোরি', icon: Instagram, status: 'active', postsToday: 4, reachToday: 1560, color: 'text-pink-600', freeOrPaid: 'free' },
  { id: 'youtube', name: 'YouTube Shorts', description: 'প্রোডাক্ট ভিডিও', icon: Youtube, status: 'active', postsToday: 2, reachToday: 890, color: 'text-red-600', freeOrPaid: 'free' },
  { id: 'whatsapp', name: 'WhatsApp Status', description: 'স্টেটাস + ব্রডকাস্ট', icon: MessageCircle, status: 'active', postsToday: 6, reachToday: 420, color: 'text-emerald-600', freeOrPaid: 'free' },
  { id: 'bikroy', name: 'Bikroy.com', description: 'ক্লাসিফায়েড লিস্টিং', icon: Tag, status: 'active', postsToday: 3, reachToday: 670, color: 'text-orange-600', freeOrPaid: 'free' },
  { id: 'olx', name: 'OLX Bangladesh', description: 'ক্লাসিফায়েড লিস্টিং', icon: Tag, status: 'paused', postsToday: 0, reachToday: 0, color: 'text-cyan-600', freeOrPaid: 'free' },
  { id: 'email', name: 'ইমেইল মার্কেটিং', description: 'কাস্টমার লিস্টে নিউজলেটার', icon: Mail, status: 'active', postsToday: 1, reachToday: 234, color: 'text-violet-600', freeOrPaid: 'free' },
  { id: 'blog', name: 'ব্লগ / বাইং গাইড', description: 'SEO কনটেন্ট মার্কেটিং', icon: FileText, status: 'active', postsToday: 1, reachToday: 156, color: 'text-amber-600', freeOrPaid: 'free' },
  { id: 'forum', name: 'ফোরাম (TechTunes, etc.)', description: 'টেক ফোরামে পোস্ট', icon: Globe, status: 'paused', postsToday: 0, reachToday: 0, color: 'text-indigo-600', freeOrPaid: 'free' },
  { id: 'telegram', name: 'Telegram চ্যানেল', description: 'অফার ব্রডকাস্ট', icon: Send, status: 'active', postsToday: 3, reachToday: 280, color: 'text-blue-500', freeOrPaid: 'free' },
];

const MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'c1', name: 'ব্ল্যাক ফ্রাইডে সেল ২০২৬', type: 'Flash Sale', status: 'running', reach: 12400, clicks: 890, conversions: 67, startDate: '২ দিন আগে', budget: 0, spent: 0 },
  { id: 'c2', name: 'HP EliteBook প্রমোশন', type: 'Product Launch', status: 'running', reach: 5680, clicks: 432, conversions: 28, startDate: '৫ দিন আগে', budget: 0, spent: 0 },
  { id: 'c3', name: 'কাস্টম পিসি বিল্ড অফার', type: 'Service Promo', status: 'scheduled', reach: 0, clicks: 0, conversions: 0, startDate: 'আগামীকাল', budget: 0, spent: 0 },
  { id: 'c4', name: 'MacBook Air M2 লঞ্চ', type: 'Product Launch', status: 'completed', reach: 8900, clicks: 678, conversions: 45, startDate: '১ সপ্তাহ আগে', budget: 0, spent: 0 },
];

const AI_WORKFLOWS = [
  { id: 'w1', name: 'নতুন প্রোডাক্ট অটো-পোস্ট', desc: 'প্রোডাক্ট এলে সব চ্যানেলে স্বয়ংক্রিয় পোস্ট', icon: Sparkles, status: 'active', runsToday: 8 },
  { id: 'w2', name: 'দৈনিক স্টোরি পোস্ট', desc: 'প্রতিদিন সকাল ৯টায় স্টোরি', icon: Clock, status: 'active', runsToday: 1 },
  { id: 'w3', name: 'কাস্টমার রিভিউ শেয়ার', desc: 'নতুন রিভিউ এলে অটো-শেয়ার', icon: Heart, status: 'active', runsToday: 3 },
  { id: 'w4', name: 'স্টক ক্লিয়ারেন্স অফার', desc: 'স্টক কম হলে অটো-অফার', icon: Tag, status: 'active', runsToday: 2 },
  { id: 'w5', name: 'কম্পিটিটর মনিটর', desc: 'প্রতিযোগীদের দাম ট্র্যাক', icon: TrendingUp, status: 'active', runsToday: 1 },
  { id: 'w6', name: 'ইমেইল ডাইজেস্ট', desc: 'সাপ্তাহিক কাস্টমার ইমেইল', icon: Mail, status: 'active', runsToday: 0 },
];

export function MarketingAiAgentModule() {
  const [showChannels, setShowChannels] = useState(false);

  const totalReach = FREE_CHANNELS.reduce((s, c) => s + c.reachToday, 0);
  const totalPosts = FREE_CHANNELS.reduce((s, c) => s + c.postsToday, 0);
  const activeChannels = FREE_CHANNELS.filter((c) => c.status === 'active').length;
  const totalConversions = MARKETING_CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-violet-600" /> Marketing AI এজেন্ট
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ১২টি ফ্রি চ্যানেলে স্বয়ংক্রিয় মার্কেটিং — কোনো খরচ ছাড়াই কাস্টমার আনুন
          </p>
        </div>
        <Button className="gap-1.5 bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4" /> নতুন ক্যাম্পেইন
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center justify-between mb-1">
            <Users className="h-5 w-5 text-violet-600" />
            <Badge className="bg-violet-100 text-violet-700 text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-violet-700">{totalReach.toLocaleString('en-IN')}</div>
          <div className="text-xs text-muted-foreground">মোট রিচ</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center justify-between mb-1">
            <Share2 className="h-5 w-5 text-emerald-600" />
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Today</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{totalPosts}</div>
          <div className="text-xs text-muted-foreground">পোস্ট সংখ্যা</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <Target className="h-5 w-5 text-amber-600" />
            <Badge className="bg-amber-100 text-amber-700 text-[10px]">{activeChannels} সক্রিয়</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-700">{FREE_CHANNELS.length}</div>
          <div className="text-xs text-muted-foreground">ফ্রি চ্যানেল</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <div className="flex items-center justify-between mb-1">
            <ShoppingCart className="h-5 w-5 text-rose-600" />
            <Badge className="bg-rose-100 text-rose-700 text-[10px]">Total</Badge>
          </div>
          <div className="text-2xl font-bold text-rose-700">{totalConversions}</div>
          <div className="text-xs text-muted-foreground">কনভার্সন</div>
        </Card>
      </div>

      {/* Free Marketing Channels */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-600" /> ফ্রি মার্কেটিং চ্যানেল
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">এই সব চ্যানেলে AI স্বয়ংক্রিয়ভাবে পোস্ট করে — সম্পূর্ণ ফ্রি</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowChannels(true)} className="gap-1">
            <Eye className="h-3 w-3" /> বিস্তারিত
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {FREE_CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className={`p-3 rounded-lg border transition ${
                channel.status === 'active'
                  ? 'border-violet-200 bg-violet-50/30 hover:shadow-md'
                  : 'border-border bg-secondary/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <channel.icon className={`h-6 w-6 ${channel.color}`} />
                <Badge
                  variant="secondary"
                  className={`text-[9px] ${channel.freeOrPaid === 'free' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {channel.freeOrPaid === 'free' ? 'ফ্রি' : 'ফ্রিমিয়াম'}
                </Badge>
              </div>
              <div className="font-medium text-xs">{channel.name}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{channel.description}</div>
              {channel.status === 'active' && (
                <div className="mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between">
                  <span>📝 {channel.postsToday} পোস্ট</span>
                  <span>👁️ {channel.reachToday.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* AI Workflows */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-600" /> AI মার্কেটিং ওয়ার্কফ্লো
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {AI_WORKFLOWS.map((wf) => (
            <div key={wf.id} className="flex items-start gap-3 p-3 border border-border/40 rounded-lg hover:bg-secondary/30 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 shrink-0">
                <wf.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{wf.name}</h4>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${wf.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary'}`}
                  >
                    {wf.status === 'active' ? 'সক্রিয়' : 'বন্ধ'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{wf.desc}</p>
                <div className="text-[10px] text-muted-foreground mt-1">আজ {wf.runsToday} বার চলেছে</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Campaigns */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-600" /> সক্রিয় ক্যাম্পেইন
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {MARKETING_CAMPAIGNS.map((campaign) => (
            <div key={campaign.id} className="p-4 hover:bg-secondary/20 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{campaign.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] ${
                        campaign.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                        campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                        'bg-secondary'
                      }`}
                    >
                      {campaign.status === 'running' ? 'চলমান' : campaign.status === 'scheduled' ? 'শিডিউলড' : 'সম্পন্ন'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">{campaign.type}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">রিচ</div>
                      <div className="font-bold">{campaign.reach.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ক্লিক</div>
                      <div className="font-bold">{campaign.clicks}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">কনভার্সন</div>
                      <div className="font-bold text-emerald-600">{campaign.conversions}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">শুরু: {campaign.startDate}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">খরচ</div>
                  <div className="font-bold text-emerald-600">৳{campaign.spent.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-muted-foreground">বাজেট: ৳{campaign.budget.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Customer Journey */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" /> কাস্টমার জার্নি (Google থেকে ক্রয় পর্যন্ত)
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
          {[
            { stage: 'Google সার্চ', icon: Search, color: 'text-blue-600 bg-blue-50' },
            { stage: 'Google Maps', icon: MapPin, color: 'text-violet-600 bg-violet-50' },
            { stage: 'ওয়েবসাইট ভিজিট', icon: Globe, color: 'text-emerald-600 bg-emerald-50' },
            { stage: 'প্রোডাক্ট দেখে', icon: Eye, color: 'text-amber-600 bg-amber-50' },
            { stage: 'WhatsApp ইনকয়ারি', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50' },
            { stage: 'অর্ডার', icon: ShoppingCart, color: 'text-rose-600 bg-rose-50' },
            { stage: 'ইনভয়েস', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
            { stage: 'ডেলিভারি', icon: Truck, color: 'text-teal-600 bg-teal-50' },
            { stage: 'রিভিউ', icon: Heart, color: 'text-pink-600 bg-pink-50' },
          ].map((step, idx, arr) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] text-center font-medium whitespace-nowrap">{step.stage}</div>
              </div>
              {idx < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-violet-700 mt-3">
          AI পুরো জার্নি ট্র্যাক করে — কোন ধাপে কাস্টমার হারিয়ে যাচ্ছে তা বুঝে সেখানে অপটিমাইজেশন করে
        </p>
      </Card>

      {/* ROI Summary */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" /> ফ্রি মার্কেটিং ROI (Return on Investment)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600">৳0</div>
            <div className="text-xs text-muted-foreground">মোট খরচ</div>
            <div className="text-[10px] text-emerald-600 mt-1">সম্পূর্ণ ফ্রি মার্কেটিং</div>
          </div>
          <div className="text-center p-4 bg-violet-50 rounded-lg">
            <div className="text-3xl font-bold text-violet-600">৳{totalConversions * 38500}</div>
            <div className="text-xs text-muted-foreground">আয় (আনুমানিক)</div>
            <div className="text-[10px] text-violet-600 mt-1">{totalConversions} অর্ডার × ৳৩৮,৫০০</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600">∞</div>
            <div className="text-xs text-muted-foreground">ROI</div>
            <div className="text-[10px] text-amber-600 mt-1">ফ্রি মার্কেটিং = অসীম ROI</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
