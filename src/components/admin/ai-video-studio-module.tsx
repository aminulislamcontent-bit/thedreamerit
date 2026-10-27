// AI Video Studio Module - Automated video generation for social media
'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Video, Play, Pause, Square, Download, Sparkles, Film, Clapperboard,
  Music, Type, Image as ImageIcon, Wand2, Youtube, Facebook, Instagram,
  Clock, CheckCircle2, AlertCircle, RefreshCw, Trash2, Eye,
} from 'lucide-react';

interface VideoJob {
  id: string;
  title: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  progress: number;
  duration: string;
  thumbnail?: string;
  createdAt: string;
  type: 'product-promo' | 'tutorial' | 'social-story' | 'ad-campaign';
  platforms: string[];
}

const VIDEO_JOBS: VideoJob[] = [
  {
    id: 'vid-1',
    title: 'HP EliteBook 1040 G6 360 - প্রোডাক্ট প্রমো',
    status: 'completed',
    progress: 100,
    duration: '0:32',
    createdAt: '৫ মিনিট আগে',
    type: 'product-promo',
    platforms: ['facebook', 'instagram', 'youtube'],
    thumbnail: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/cc55681379f3.png',
  },
  {
    id: 'vid-2',
    title: 'MacBook Air M2 - আনবক্সিং ভিডিও',
    status: 'generating',
    progress: 67,
    duration: '—',
    createdAt: 'এইমাত্র',
    type: 'product-promo',
    platforms: ['youtube', 'facebook'],
    thumbnail: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2a0fa97cd683.jpg',
  },
  {
    id: 'vid-3',
    title: 'কাস্টম পিসি বিল্ড - গেমিং রিগ',
    status: 'queued',
    progress: 0,
    duration: '—',
    createdAt: '২ মিনিট আগে',
    type: 'tutorial',
    platforms: ['youtube'],
    thumbnail: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f46e09009ac5.jpg',
  },
  {
    id: 'vid-4',
    title: 'ব্ল্যাক ফ্রাইডে সেল - সোশ্যাল স্টোরি',
    status: 'completed',
    progress: 100,
    duration: '0:15',
    createdAt: '১ ঘন্টা আগে',
    type: 'social-story',
    platforms: ['facebook', 'instagram'],
    thumbnail: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a175a68eb040.jpg',
  },
];

const PLATFORM_ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

const VIDEO_TEMPLATES = [
  { id: 'product-promo', name: 'প্রোডাক্ট প্রমো', duration: '30-60s', icon: Film, color: 'from-emerald-500 to-teal-500' },
  { id: 'tutorial', name: 'টিউটোরিয়াল', duration: '2-5min', icon: Clapperboard, color: 'from-violet-500 to-purple-500' },
  { id: 'social-story', name: 'সোশ্যাল স্টোরি', duration: '15-30s', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
  { id: 'ad-campaign', name: 'অ্যাড ক্যাম্পেইন', duration: '30-90s', icon: Wand2, color: 'from-rose-500 to-pink-500' },
];

export function AiVideoStudioModule() {
  const [jobs, setJobs] = useState(VIDEO_JOBS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'product-promo',
    productId: '',
    script: '',
    music: 'upbeat',
    platforms: ['facebook', 'instagram'],
  });

  const handleGenerate = () => {
    if (!form.title) {
      toast.error('ভিডিওর শিরোনাম দিন');
      return;
    }
    // Simulate creating a new video job
    const newJob: VideoJob = {
      id: `vid-${Date.now()}`,
      title: form.title,
      status: 'queued',
      progress: 0,
      duration: '—',
      createdAt: 'এইমাত্র',
      type: form.type as any,
      platforms: form.platforms,
    };
    setJobs([newJob, ...jobs]);
    toast.success('ভিডিও জেনারেশন শুরু হয়েছে', { description: 'AI আপনার ভিডিও তৈরি করছে...' });
    setShowCreate(false);
    setForm({ title: '', type: 'product-promo', productId: '', script: '', music: 'upbeat', platforms: ['facebook', 'instagram'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-violet-600" /> AI ভিডিও স্টুডিও
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            স্বয়ংক্রিয় ভিডিও জেনারেশন, এডিটিং ও সোশ্যাল মিডিয়া পাবলিশিং
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
          <Sparkles className="h-4 w-4" /> নতুন ভিডিও তৈরি করুন
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <Video className="h-4 w-4 text-violet-600" />
            <Badge variant="secondary" className="text-[10px]">Total</Badge>
          </div>
          <div className="text-2xl font-bold">{jobs.length}</div>
          <div className="text-[10px] text-muted-foreground">মোট ভিডিও</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">Done</Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{jobs.filter(j => j.status === 'completed').length}</div>
          <div className="text-[10px] text-muted-foreground">সম্পন্ন</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">Live</Badge>
          </div>
          <div className="text-2xl font-bold text-amber-600">{jobs.filter(j => j.status === 'generating').length}</div>
          <div className="text-[10px] text-muted-foreground">তৈরি হচ্ছে</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <Badge variant="secondary" className="text-[10px]">Queue</Badge>
          </div>
          <div className="text-2xl font-bold text-blue-600">{jobs.filter(j => j.status === 'queued').length}</div>
          <div className="text-[10px] text-muted-foreground">সারিতে</div>
        </Card>
      </div>

      {/* Video templates */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-violet-600" /> ভিডিও টেমপ্লেট
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VIDEO_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => { setForm({ ...form, type: tpl.id }); setShowCreate(true); }}
              className="p-4 rounded-lg border border-border/40 hover:border-violet-500 hover:shadow-md transition text-left group"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tpl.color} text-white mb-2 group-hover:scale-110 transition`}>
                <tpl.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-sm">{tpl.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{tpl.duration}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Video jobs list */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Film className="h-4 w-4 text-violet-600" /> ভিডিও জবস
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-secondary/20 transition">
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="relative h-16 w-24 rounded-md overflow-hidden bg-secondary shrink-0">
                  {job.thumbnail ? (
                    <img src={job.thumbnail} alt={job.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  {job.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  )}
                  {job.status === 'generating' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <RefreshCw className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                  {job.duration !== '—' && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">
                      {job.duration}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm truncate">{job.title}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] ${
                        job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        job.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                        job.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {job.status === 'completed' ? 'সম্পন্ন' : job.status === 'generating' ? 'তৈরি হচ্ছে' : job.status === 'failed' ? 'ব্যর্থ' : 'সারিতে'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{job.type.replace('-', ' ')}</span>
                    <span>·</span>
                    <span>{job.createdAt}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      {job.platforms.map((p) => {
                        const Icon = PLATFORM_ICONS[p];
                        return Icon ? <Icon key={p} className="h-3 w-3" /> : null;
                      })}
                    </div>
                  </div>
                  {job.status === 'generating' && (
                    <div className="mt-2">
                      <Progress value={job.progress} className="h-1" />
                      <div className="text-[10px] text-muted-foreground mt-0.5">{job.progress}% সম্পন্ন</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {job.status === 'completed' && (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="দেখুন">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="ডাউনলোড">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1 text-xs h-8">
                        <Sparkles className="h-3 w-3" /> পাবলিশ
                      </Button>
                    </>
                  )}
                  {job.status === 'generating' && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="বাতিল">
                      <Square className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="মুছুন">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI features */}
      <Card className="p-5 bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200">
        <h3 className="font-semibold mb-3 text-violet-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> AI ভিডিও জেনারেশন ক্ষমতা
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-800">
              <Type className="h-4 w-4" /> AI স্ক্রিপ্ট জেনারেশন (বাংলা ও ইংরেজি)
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <ImageIcon className="h-4 w-4" /> প্রোডাক্ট ছবি থেকে স্লাইডশো
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <Music className="h-4 w-4" /> অটো ব্যাকগ্রাউন্ড মিউজিক সিলেকশন
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <Wand2 className="h-4 w-4" /> ট্রানজিশন ও ইফেক্ট
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-violet-800">
              <Type className="h-4 w-4" /> অটো সাবটাইটেল (বাংলা)
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <Film className="h-4 w-4" /> ভয়েসওভার (AI ভয়েস)
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <Youtube className="h-4 w-4" /> অটো YouTube আপলোড
            </div>
            <div className="flex items-center gap-2 text-violet-800">
              <Facebook className="h-4 w-4" /> অটো Facebook/Instagram পোস্ট
            </div>
          </div>
        </div>
      </Card>

      {/* Create video dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" /> নতুন AI ভিডিও
            </h3>
            <div className="space-y-3">
              <div>
                <Label>ভিডিওর শিরোনাম *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: HP EliteBook প্রোডাক্ট প্রমো" />
              </div>
              <div>
                <Label>ভিডিও টাইপ</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.duration})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>প্রোডাক্ট ID (ঐচ্ছিক)</Label>
                <Input value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} placeholder="নির্দিষ্ট প্রোডাক্টের জন্য" />
              </div>
              <div>
                <Label>কাস্টম স্ক্রিপ্ট (ঐচ্ছিক)</Label>
                <Textarea value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} rows={3} placeholder="খালি রাখলে AI স্ক্রিপ্ট তৈরি করবে" />
              </div>
              <div>
                <Label>ব্যাকগ্রাউন্ড মিউজিক</Label>
                <Select value={form.music} onValueChange={(v) => setForm({ ...form, music: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upbeat">Upbeat (উৎসাহী)</SelectItem>
                    <SelectItem value="corporate">Corporate (প্রফেশনাল)</SelectItem>
                    <SelectItem value="cinematic">Cinematic (সিনেম্যাটিক)</SelectItem>
                    <SelectItem value="gaming">Gaming (গেমিং)</SelectItem>
                    <SelectItem value="none">No Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>পাবলিশ করার প্ল্যাটফর্ম</Label>
                <div className="flex gap-2 mt-1">
                  {['facebook', 'instagram', 'youtube'].map((p) => {
                    const Icon = PLATFORM_ICONS[p];
                    const isActive = form.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => setForm({
                          ...form,
                          platforms: isActive
                            ? form.platforms.filter(x => x !== p)
                            : [...form.platforms, p]
                        })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition ${
                          isActive ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="capitalize">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-md p-3 text-xs text-violet-800">
                💡 AI প্রোডাক্টের ছবি, ডেসক্রিপশন ও স্পেসিফিকেশন থেকে স্বয়ংক্রিয়ভাবে স্ক্রিপ্ট লিখবে,
                ভিডিও তৈরি করবে, সাবটাইটেল যোগ করবে এবং নির্বাচিত প্ল্যাটফর্মে পাবলিশ করবে।
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>বাতিল</Button>
                <Button onClick={handleGenerate} className="gap-1.5 bg-violet-600 hover:bg-violet-700">
                  <Sparkles className="h-4 w-4" /> ভিডিও তৈরি শুরু করুন
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
