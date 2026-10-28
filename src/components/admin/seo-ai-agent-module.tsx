// SEO AI Agent Module - Automated SEO with Google Maps, Local SEO, keyword tracking
'use client';
import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, MapPin, TrendingUp, Globe, Bot, Sparkles, CheckCircle2,
  AlertCircle, Clock, RefreshCw, Eye, Target, Link2, FileText,
  Star, Phone, Navigation, ExternalLink, Zap, Brain, BarChart3,
  ChevronRight, Play, Settings, Plus,
} from 'lucide-react';
import { BUSINESS } from '@/lib/config';

interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  fix: string;
  affected: number;
}

interface Keyword {
  keyword: string;
  rank: number;
  volume: string;
  difficulty: string;
  trend: 'up' | 'down' | 'stable';
  url: string;
}

interface LocalListing {
  platform: string;
  status: 'verified' | 'pending' | 'not-listed';
  url?: string;
  icon: string;
  lastSync?: string;
}

const SEO_ISSUES: SEOIssue[] = [
  { id: '1', type: 'critical', title: 'মেটা ডেসক্রিপশন নেই', description: '৫টি প্রোডাক্টে মেটা ডেসক্রিপশন নেই', fix: 'AI স্বয়ংক্রিয়ভাবে মেটা ডেসক্রিপশন জেনারেট করবে', affected: 5 },
  { id: '2', type: 'critical', title: 'Google Maps লিস্টিং যাচাই করুন', description: 'Google Business Profile যাচাই করা হয়নি', fix: 'পোস্টকার্ড ভেরিফিকেশন বা ফোন ভেরিফিকেশন করুন', affected: 1 },
  { id: '3', type: 'warning', title: 'প্রোডাক্ট ইমেজে alt টেক্সট নেই', description: '১২টি ছবিতে alt টেক্সট নেই', fix: 'AI স্বয়ংক্রিয়ভাবে alt টেক্সট যোগ করবে', affected: 12 },
  { id: '4', type: 'warning', title: 'পেজ স্পিড কম', description: '৩টি পেজ ৩ সেকেন্ডের বেশি সময় নেয়', fix: 'ছবি অপটিমাইজ করুন, lazy loading চালু করুন', affected: 3 },
  { id: '5', type: 'info', title: 'Schema markup যোগ করুন', description: 'FAQ schema যোগ করলে rich snippet পাবেন', fix: 'AI স্বয়ংক্রিয়ভাবে schema যোগ করবে', affected: 0 },
];

const KEYWORDS: Keyword[] = [
  { keyword: 'laptop shop dhaka', rank: 12, volume: '1.9K/mo', difficulty: 'Medium', trend: 'up', url: '/laptops' },
  { keyword: 'HP EliteBook Bangladesh', rank: 5, volume: '880/mo', difficulty: 'Low', trend: 'up', url: '/products/hp-elitebook-1040' },
  { keyword: 'used laptop dhaka', rank: 8, volume: '2.4K/mo', difficulty: 'Medium', trend: 'stable', url: '/laptops' },
  { keyword: 'gaming PC Bangladesh', rank: 15, volume: '3.6K/mo', difficulty: 'High', trend: 'up', url: '/gaming-pcs' },
  { keyword: 'computer shop elephant road', rank: 3, volume: '1.2K/mo', difficulty: 'Low', trend: 'up', url: '/' },
  { keyword: 'MacBook price Bangladesh', rank: 7, volume: '5.4K/mo', difficulty: 'Medium', trend: 'up', url: '/products/macbook-air' },
  { keyword: 'Dreamer IT Express', rank: 1, volume: '210/mo', difficulty: 'Low', trend: 'up', url: '/' },
  { keyword: 'laptop repair elephant road', rank: 22, volume: '660/mo', difficulty: 'Medium', trend: 'down', url: '/' },
];

const LOCAL_LISTINGS: LocalListing[] = [
  { platform: 'Google Business Profile', status: 'verified', url: 'https://g.page/dreamer-it-express', icon: 'google', lastSync: '৫ মিনিট আগে' },
  { platform: 'Google Maps', status: 'verified', url: 'https://maps.google.com/?q=Dreamer+IT+Express', icon: 'maps', lastSync: '৫ মিনিট আগে' },
  { platform: 'Facebook Page', status: 'verified', url: BUSINESS.social.facebook, icon: 'facebook', lastSync: '১ ঘন্টা আগে' },
  { platform: 'Bikroy.com', status: 'pending', icon: 'bikroy' },
  { platform: 'OLX Bangladesh', status: 'not-listed', icon: 'olx' },
  { platform: 'Yellow Pages BD', status: 'not-listed', icon: 'yp' },
  { platform: 'Bangladesh Business Directory', status: 'not-listed', icon: 'bd' },
  { platform: 'Yelp', status: 'not-listed', icon: 'yelp' },
];

const SEO_FEATURES = [
  {
    id: 'auto-meta',
    name: 'অটো মেটা ট্যাগ জেনারেশন',
    description: 'প্রতিটি প্রোডাক্টের জন্য AI স্বয়ংক্রিয়ভাবে SEO-অপটিমাইজড টাইটেল, ডেসক্রিপশন, কিওয়ার্ড তৈরি করে',
    icon: Brain,
    status: 'active',
    runsToday: 47,
  },
  {
    id: 'schema',
    name: 'Schema Markup অটো-ইনজেকশন',
    description: 'LocalBusiness, Product, Review, FAQ, Breadcrumb schema স্বয়ংক্রিয়ভাবে যোগ করে',
    icon: FileText,
    status: 'active',
    runsToday: 32,
  },
  {
    id: 'sitemap',
    name: 'XML Sitemap অটো-আপডেট',
    description: 'নতুন প্রোডাক্ট এলে স্বয়ংক্রিয়ভাবে sitemap.xml আপডেট + Google এ সাবমিট',
    icon: MapPin,
    status: 'active',
    runsToday: 8,
  },
  {
    id: 'keyword',
    name: 'কিওয়ার্ড র্যাংকিং ট্র্যাকার',
    description: 'দৈনিক Google এ আপনার কিওয়ার্ডের র্যাংকিং ট্র্যাক করে',
    icon: TrendingUp,
    status: 'active',
    runsToday: 1,
  },
  {
    id: 'gsc',
    name: 'Google Search Console ইন্টিগ্রেশন',
    description: 'ক্রল এরর, ইনডেক্সিং স্ট্যাটাস, ক্লিক ডেটা অটো-মনিটর',
    icon: Search,
    status: 'active',
    runsToday: 1,
  },
  {
    id: 'local',
    name: 'Local SEO (Google Maps)',
    description: 'Google Maps-এ আপনার দোকান অপটিমাইজ, "near me" সার্চে দেখানো',
    icon: Navigation,
    status: 'active',
    runsToday: 1,
  },
  {
    id: 'backlink',
    name: 'ব্যাকলিংক মনিটর',
    description: 'কোন সাইট থেকে লিংক আসছে তা ট্র্যাক করে',
    icon: Link2,
    status: 'active',
    runsToday: 1,
  },
  {
    id: 'content',
    name: 'কনটেন্ট অপটিমাইজার',
    description: 'ব্লগ পোস্ট, বাইং গাইড স্বয়ংক্রিয়ভাবে SEO-অপটিমাইজড করে',
    icon: Sparkles,
    status: 'active',
    runsToday: 5,
  },
];

export function SeoAiAgentModule() {
  const [showKeywords, setShowKeywords] = useState(false);
  const [showListings, setShowListings] = useState(false);
  const { data: seoData } = useApi<any>('/api/seo');

  const healthScore = seoData?.summary?.healthScore || 78;
  const totalIssues = SEO_ISSUES.reduce((s, i) => s + i.affected, 0);
  const criticalIssues = SEO_ISSUES.filter((i) => i.type === 'critical').length;
  const verifiedListings = LOCAL_LISTINGS.filter((l) => l.status === 'verified').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" /> SEO AI এজেন্ট
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Google Maps + Local SEO + কিওয়ার্ড ট্র্যাকিং + স্বয়ংক্রিয় অপটিমাইজেশন
          </p>
        </div>
        <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="h-4 w-4" /> এখন স্ক্যান করুন
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center justify-between mb-1">
            <Target className="h-5 w-5 text-emerald-600" />
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Health</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{healthScore}/100</div>
          <div className="text-xs text-muted-foreground">SEO স্কোর</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <Badge className="bg-amber-100 text-amber-700 text-[10px]">{criticalIssues} জরুরি</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-700">{totalIssues}</div>
          <div className="text-xs text-muted-foreground">সমস্যা</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <Badge className="bg-blue-100 text-blue-700 text-[10px]">Top 10</Badge>
          </div>
          <div className="text-2xl font-bold text-blue-700">{KEYWORDS.filter(k => k.rank <= 10).length}</div>
          <div className="text-xs text-muted-foreground">কিওয়ার্ড র‍্যাংক</div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="flex items-center justify-between mb-1">
            <MapPin className="h-5 w-5 text-violet-600" />
            <Badge className="bg-violet-100 text-violet-700 text-[10px]">{verifiedListings}/{LOCAL_LISTINGS.length}</Badge>
          </div>
          <div className="text-2xl font-bold text-violet-700">{verifiedListings}</div>
          <div className="text-xs text-muted-foreground">লোকাল লিস্টিং</div>
        </Card>
      </div>

      {/* Google Maps + Business Profile */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Google Maps & Business Profile
          </h3>
          <p className="text-xs opacity-90 mt-0.5">
            কাস্টমার Google Maps-এ "laptop shop near me" সার্চ করলে আপনার দোকান দেখাবে
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Map embed */}
          <div className="aspect-video md:aspect-auto bg-secondary/30 min-h-[300px]">
            <iframe
              title="The Dreamer IT Express Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.962!2d90.3929!3d23.7337!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ0JzAxLjMiTiA5MMKwMjMnMzQuNSJF!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          {/* Business info */}
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{BUSINESS.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {BUSINESS.address.line1}<br />
                  {BUSINESS.address.city} {BUSINESS.address.postalCode}, {BUSINESS.address.country}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-medium">{BUSINESS.phone}</div>
                <div className="text-xs text-muted-foreground">WhatsApp ও কল</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-medium">{BUSINESS.hours.bn}</div>
                <div className="text-xs text-muted-foreground">{BUSINESS.hours.days}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-400" />
              <div>
                <div className="font-medium">4.8 / 5.0</div>
                <div className="text-xs text-muted-foreground">১২৭ Google রিভিউ</div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <a href="https://www.google.com/maps/search/Dreamer+IT+Express" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <Navigation className="h-3 w-3" /> দিকনির্দেশ
                </Button>
              </a>
              <a href="https://www.google.com/search?q=Dreamer+IT+Express" target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <Search className="h-3 w-3" /> Google এ খুঁজুন
                </Button>
              </a>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="text-xs font-medium text-emerald-700 flex items-center gap-1 mb-1">
                <CheckCircle2 className="h-3 w-3" /> Google Business Profile যাচাইকৃত
              </div>
              <p className="text-[10px] text-emerald-600">
                আপনার ব্যবসা Google Maps, Search এ দেখাচ্ছে। সর্বশেষ সিঙ্ক: ৫ মিনিট আগে
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* SEO AI Features */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600" /> SEO AI এজেন্ট ফিচার
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {SEO_FEATURES.map((feature) => (
            <div key={feature.id} className="flex items-start gap-3 p-3 border border-border/40 rounded-lg hover:bg-secondary/30 transition">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <feature.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{feature.name}</h4>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${feature.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary'}`}
                  >
                    {feature.status === 'active' ? 'সক্রিয়' : 'বন্ধ'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                <div className="text-[10px] text-muted-foreground mt-1">
                  আজ {feature.runsToday} বার চলেছে
                </div>
              </div>
              <Switch checked={feature.status === 'active'} />
            </div>
          ))}
        </div>
      </Card>

      {/* Keyword Rankings */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" /> কিওয়ার্ড র‍্যাংকিং
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowKeywords(true)} className="gap-1">
            <Eye className="h-3 w-3" /> সব দেখুন
          </Button>
        </div>
        <div className="space-y-2">
          {KEYWORDS.slice(0, 5).map((kw, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-md">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                kw.rank <= 3 ? 'bg-emerald-100 text-emerald-700' :
                kw.rank <= 10 ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                #{kw.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{kw.keyword}</div>
                <div className="text-[10px] text-muted-foreground">{kw.volume} · {kw.difficulty}</div>
              </div>
              <div className="flex items-center gap-1">
                {kw.trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {kw.trend === 'down' && <TrendingUp className="h-3 w-3 text-rose-600 rotate-180" />}
                {kw.trend === 'stable' && <span className="text-xs text-muted-foreground">→</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Local Listings / Citations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-violet-600" /> লোকাল লিস্টিং (Citations)
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowListings(true)} className="gap-1">
            <Eye className="h-3 w-3" /> সব দেখুন
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          যত বেশি ডিরেক্টরিতে আপনার ব্যবসা তালিকাভুক্ত, Google তত বেশি বিশ্বাস করবে — Local SEO তত ভালো
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LOCAL_LISTINGS.map((listing, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-center ${
                listing.status === 'verified' ? 'border-emerald-200 bg-emerald-50' :
                listing.status === 'pending' ? 'border-amber-200 bg-amber-50' :
                'border-border bg-secondary/30'
              }`}
            >
              <div className="font-medium text-xs mb-1">{listing.platform}</div>
              {listing.status === 'verified' ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">
                  <CheckCircle2 className="h-2 w-2 mr-0.5" /> যাচাইকৃত
                </Badge>
              ) : listing.status === 'pending' ? (
                <Badge className="bg-amber-100 text-amber-700 text-[9px]">
                  <Clock className="h-2 w-2 mr-0.5" /> অপেক্ষমাণ
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px]">তালিকাভুক্ত নয়</Badge>
              )}
              {listing.lastSync && (
                <div className="text-[9px] text-muted-foreground mt-1">{listing.lastSync}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SEO Issues */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" /> SEO সমস্যা ও সমাধান
        </h3>
        <div className="space-y-2">
          {SEO_ISSUES.map((issue) => (
            <div
              key={issue.id}
              className={`p-3 rounded-lg border ${
                issue.type === 'critical' ? 'border-red-200 bg-red-50' :
                issue.type === 'warning' ? 'border-amber-200 bg-amber-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  issue.type === 'critical' ? 'bg-red-100 text-red-700' :
                  issue.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {issue.type === 'critical' ? <AlertCircle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{issue.title}</h4>
                    {issue.affected > 0 && (
                      <Badge variant="secondary" className="text-[9px]">{issue.affected}টি</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                  <div className="text-xs mt-1 p-2 bg-white/60 rounded flex items-start gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>সমাধান:</strong> {issue.fix}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1 shrink-0">
                  <Play className="h-3 w-3" /> ঠিক করুন
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Schema markup preview */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-600" /> Schema Markup (Rich Snippets)
        </h3>
        <p className="text-xs text-violet-700 mb-3">
          AI স্বয়ংক্রিয়ভাবে এই schema গুলো প্রতিটি পেজে যোগ করে — Google-এ তারকা রেটিং, দাম, স্টক স্ট্যাটাস দেখায়
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: 'LocalBusiness', desc: 'নাম, ঠিকানা, ফোন, খোলার সময়, রেটিং' },
            { name: 'Product', desc: 'প্রোডাক্ট নাম, দাম, স্টক, ব্র্যান্ড' },
            { name: 'Review', desc: 'কাস্টমার রিভিউ, তারকা রেটিং' },
            { name: 'FAQPage', desc: 'সাধারণ প্রশ্ন ও উত্তর' },
            { name: 'BreadcrumbList', desc: 'নেভিগেশন পাথ' },
            { name: 'Organization', desc: 'কোম্পানি তথ্য, সোশ্যাল লিংক' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white/60 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-mono font-bold">{s.name}</div>
                <div className="text-[10px] text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* All keywords dialog */}
      <Dialog open={showKeywords} onOpenChange={setShowKeywords}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> সব কিওয়ার্ড র‍্যাংকিং
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">কিওয়ার্ড</th>
                  <th className="text-center p-3">র‍্যাংক</th>
                  <th className="text-center p-3">ভলিউম</th>
                  <th className="text-center p-3">কঠিনতা</th>
                  <th className="text-center p-3">ট্রেন্ড</th>
                </tr>
              </thead>
              <tbody>
                {KEYWORDS.map((kw, i) => (
                  <tr key={i} className="border-t border-border/40 hover:bg-secondary/20">
                    <td className="p-3 font-medium">{kw.keyword}</td>
                    <td className="p-3 text-center">
                      <Badge variant={kw.rank <= 10 ? 'secondary' : 'outline'} className={kw.rank <= 3 ? 'bg-emerald-100 text-emerald-700' : kw.rank <= 10 ? 'bg-blue-100 text-blue-700' : ''}>
                        #{kw.rank}
                      </Badge>
                    </td>
                    <td className="p-3 text-center text-xs text-muted-foreground">{kw.volume}</td>
                    <td className="p-3 text-center text-xs">{kw.difficulty}</td>
                    <td className="p-3 text-center">
                      {kw.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600 mx-auto" />}
                      {kw.trend === 'down' && <TrendingUp className="h-4 w-4 text-rose-600 rotate-180 mx-auto" />}
                      {kw.trend === 'stable' && <span className="text-muted-foreground">→</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* All listings dialog */}
      <Dialog open={showListings} onOpenChange={setShowListings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-violet-600" /> সব লোকাল লিস্টিং
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {LOCAL_LISTINGS.map((listing, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border/40 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{listing.platform}</div>
                  {listing.url && (
                    <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <ExternalLink className="h-3 w-3" /> লিংক খুলুন
                    </a>
                  )}
                  {listing.lastSync && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">সর্বশেষ সিঙ্ক: {listing.lastSync}</div>
                  )}
                </div>
                <div>
                  {listing.status === 'verified' ? (
                    <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> যাচাইকৃত</Badge>
                  ) : listing.status === 'pending' ? (
                    <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" /> অপেক্ষমাণ</Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Plus className="h-3 w-3" /> তালিকাভুক্ত করুন
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-violet-50 border border-violet-200 rounded-md mt-3">
            <p className="text-xs text-violet-800">
              💡 <strong>টিপ:</strong> প্রতিটি লিস্টিংয়ে একই নাম, ঠিকানা, ফোন (NAP) ব্যবহার করুন। একটি ডিরেক্টরিতে ভুল তথ্য থাকলে Google আপনার র‍্যাংকিং কমিয়ে দিতে পারে।
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Switch({ checked }: { checked: boolean }) {
  return (
    <div className={`h-5 w-9 rounded-full p-0.5 transition ${checked ? 'bg-emerald-500' : 'bg-secondary'}`}>
      <div className={`h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  );
}
