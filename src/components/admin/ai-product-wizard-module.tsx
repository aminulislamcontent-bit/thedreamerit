// AI Product Wizard Module - Complete AI-driven product listing pipeline
// Step 1: Upload photo + record Bangla voice
// Step 2: AI processes (ASR + VLM + LLM)
// Step 3: Review generated content
// Step 4: Auto-publish to all platforms
// Step 5: View invoice with min price + offer price
'use client';
import { useState, useRef, useEffect } from 'react';
import { useApi, apiPost } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wand2, Sparkles, Mic, MicOff, Upload, Image as ImageIcon, Video,
  Facebook, Instagram, Youtube, MessageCircle, Globe, FileText,
  CheckCircle2, AlertCircle, Clock, Play, Pause, RefreshCw, Send,
  Cpu, Eye, ShoppingCart, Wallet, Shield, Zap, ArrowRight, ArrowLeft,
  Volume2, Camera, X, ChevronRight,
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { toast } from 'sonner';
import { MARKETING_GUIDE } from '@/lib/marketing-guide';

type Step = 'input' | 'processing' | 'review' | 'publishing' | 'done';

interface GeneratedContent {
  analysis: any;
  product: any;
  marketing: any;
  video: any;
  invoice: any;
}

export function AiProductWizardModule() {
  const [step, setStep] = useState<Step>('input');
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceText, setVoiceText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [autoPublish, setAutoPublish] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  // File upload (voice)
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Photo upload handler
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('photos', file));
      const res = await fetch('/api/ai-wizard/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message);
      setPhotos((prev) => [...prev, ...data.data.photoUrls]);
      toast.success(`${data.data.photoUrls.length}টি ছবি আপলোড হয়েছে`);
    } catch (e: any) {
      toast.error('ছবি আপলোড ব্যর্থ', { description: e.message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Voice recording start
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await uploadVoice(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('রেকর্ডিং শুরু হয়েছে... বাংলায় কথা বলুন');
    } catch (e: any) {
      toast.error('মাইক্রোফোন অ্যাক্সেস ব্যর্থ', { description: e.message });
    }
  };

  // Voice recording stop
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload voice file
  const uploadVoice = async (audioBlob: Blob) => {
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const res = await fetch('/api/ai-wizard/upload-voice', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message);
      setVoiceText(data.data.transcription);
      setAudioUrl(data.data.audioUrl);
      toast.success('ভয়েস ট্রান্সক্রিপশন সম্পন্ন', {
        description: `${data.data.transcription.length} অক্ষর টেক্সটে রূপান্তরিত`,
      });
    } catch (e: any) {
      toast.error('ভয়েস আপলোড ব্যর্থ', { description: e.message });
    } finally {
      setUploadingVoice(false);
    }
  };

  // Voice file upload (from file)
  const handleVoiceFileUpload = async (file: File) => {
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch('/api/ai-wizard/upload-voice', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error?.message);
      setVoiceText(data.data.transcription);
      setAudioUrl(data.data.audioUrl);
      toast.success('ভয়েস ট্রান্সক্রিপশন সম্পন্ন');
    } catch (e: any) {
      toast.error('ভয়েস আপলোড ব্যর্থ', { description: e.message });
    } finally {
      setUploadingVoice(false);
    }
  };

  // AI Processing
  const handleProcess = async () => {
    if (photos.length === 0 && !voiceText) {
      toast.error('অন্তত একটি ছবি বা ভয়েস প্রয়োজন');
      return;
    }
    setStep('processing');
    try {
      const result = await apiPost('/api/ai-wizard/process', {
        photoUrls: photos,
        voiceText,
      });
      setGenerated(result);
      setStep('review');
      toast.success('AI কনটেন্ট জেনারেশন সম্পন্ন!');
    } catch (e: any) {
      toast.error('AI প্রসেসিং ব্যর্থ', { description: e.message });
      setStep('input');
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!generated) return;
    setStep('publishing');
    try {
      const result = await apiPost('/api/ai-wizard/publish', {
        product: generated.product,
        marketing: generated.marketing,
        video: generated.video,
        photos,
        autoPublish,
      });
      setPublishResult(result);
      setStep('done');
      toast.success(result.message);
    } catch (e: any) {
      toast.error('প্রকাশনা ব্যর্থ', { description: e.message });
      setStep('review');
    }
  };

  const reset = () => {
    setStep('input');
    setPhotos([]);
    setVoiceText('');
    setAudioUrl(null);
    setGenerated(null);
    setPublishResult(null);
    setAutoPublish(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-600" /> AI প্রোডাক্ট উইজার্ড
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            ছবি + বাংলা ভয়েস দিন, AI সব কনটেন্ট তৈরি করে সব প্ল্যাটফর্মে পোস্ট করবে
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(true)} className="gap-1.5">
          <FileText className="h-3.5 w-3.5" /> মার্কেটিং গাইড
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
        {[
          { id: 'input', label: '১. ইনপুট', icon: Mic },
          { id: 'processing', label: '২. AI প্রসেসিং', icon: Cpu },
          { id: 'review', label: '৩. রিভিউ', icon: Eye },
          { id: 'publishing', label: '৪. প্রকাশনা', icon: Send },
          { id: 'done', label: '৫. সম্পন্ন', icon: CheckCircle2 },
        ].map((s, idx, arr) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 ${step === s.id ? 'text-violet-600' : 'text-muted-foreground'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step === s.id ? 'bg-violet-600 text-white' : 'bg-background border border-border'}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-[10px] font-medium">{s.label}</div>
            </div>
            {idx < arr.length - 1 && <div className="w-8 h-px bg-border mx-2"></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Photo upload */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-600" /> প্রোডাক্টের ছবি
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              প্রোডাক্টের এক বা একাধিক ছবি আপলোড করুন। মোবাইল দিয়ে তোলা ছবিও চলবে।
            </p>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-border">
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)}
            />
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadingPhoto ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
            </Button>
          </Card>

          {/* Voice recording */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Mic className="h-4 w-4 text-rose-600" /> বাংলা ভয়েস রেকর্ড
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              প্রোডাক্ট সম্পর্কে বাংলায় কথা বলুন। নাম, দাম, ফিচার — যা জানেন তাই বলুন। কোনো নিয়ম নেই।
            </p>

            {/* Recording controls */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`gap-2 ${isRecording ? 'bg-rose-600 hover:bg-rose-700' : 'bg-violet-600 hover:bg-violet-700'}`}
                size="lg"
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {isRecording ? 'রেকর্ডিং থামান' : 'রেকর্ড শুরু করুন'}
              </Button>
              {isRecording && (
                <div className="text-lg font-mono font-bold text-rose-600">
                  {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* OR file upload */}
            <div className="relative my-3">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-card px-2 text-xs text-muted-foreground">অথবা</span>
            </div>

            <input
              ref={voiceInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleVoiceFileUpload(e.target.files[0])}
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => voiceInputRef.current?.click()}
              disabled={uploadingVoice || isRecording}
            >
              {uploadingVoice ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingVoice ? 'প্রসেসিং হচ্ছে...' : 'অডিও ফাইল আপলোড করুন'}
            </Button>

            {/* Audio playback */}
            {audioUrl && (
              <div className="mt-3 p-2 bg-secondary/30 rounded-md">
                <audio src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {/* Transcription */}
            {voiceText && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> ভয়েস টেক্সট:
                </div>
                <p className="text-sm text-emerald-900">{voiceText}</p>
              </div>
            )}
          </Card>

          {/* Example voice text */}
          <Card className="p-4 md:col-span-2 bg-violet-50 border-violet-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <div className="text-xs text-violet-800">
                <strong>উদাহরণ:</strong> "এটা একটা HP EliteBook 1040 ল্যাপটপ। ইন্টেল কোর i5 প্রসেসর, ১৬ জিবি র্যাম, ২৫৬ জিবি এসএসডি। ১৪ ইঞ্চি টাচ ডিসপ্লে। কোনো সমস্যা নেই, একদম নতুন অবস্থা। দাম ৩৮ হাজার ৫০০ টাকা। ১৫ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি আছে।"
              </div>
            </div>
          </Card>

          {/* Process button */}
          <div className="md:col-span-2">
            <Button
              onClick={handleProcess}
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              disabled={(photos.length === 0 && !voiceText) || uploadingPhoto || uploadingVoice}
            >
              <Sparkles className="h-5 w-5" /> AI দিয়ে কনটেন্ট তৈরি করুন
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 'processing' && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white">
                <Cpu className="h-10 w-10" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI কনটেন্ট তৈরি করছে...</h3>
              <p className="text-sm text-muted-foreground mt-1">এতে ৩০-৬০ সেকেন্ড সময় লাগতে পারে</p>
            </div>
            <div className="space-y-2 text-sm text-left max-w-md">
              {[
                { label: 'ভয়েস ট্রান্সক্রিপশন বিশ্লেষণ', icon: Volume2 },
                { label: 'প্রোডাক্ট ছবি বিশ্লেষণ (VLM)', icon: Camera },
                { label: 'প্রোডাক্ট বর্ণনা তৈরি (GLM-4)', icon: FileText },
                { label: 'সোশ্যাল মিডিয়া কনটেন্ট তৈরি', icon: Facebook },
                { label: 'ভিডিও স্ক্রিপ্ট তৈরি', icon: Video },
                { label: 'দাম ও ইনভয়েস তৈরি', icon: Wallet },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 text-violet-600 animate-spin" style={{ animationDelay: `${i * 200}ms` }} />
                  <s.icon className="h-3 w-3 text-muted-foreground" />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 'review' && generated && (
        <div className="space-y-4">
          {/* Product info */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> প্রোডাক্ট তথ্য
              </h3>
              <Badge className="bg-emerald-100 text-emerald-700">AI জেনারেটেড</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">প্রোডাক্ট নাম</Label>
                <div className="font-medium">{generated.product.name}</div>
              </div>
              <div>
                <Label className="text-xs">ব্র্যান্ড</Label>
                <div className="font-medium">{generated.product.brand}</div>
              </div>
              <div>
                <Label className="text-xs">মডেল</Label>
                <div className="font-medium">{generated.product.model || '—'}</div>
              </div>
              <div>
                <Label className="text-xs">অবস্থা</Label>
                <Badge variant="secondary">{generated.product.condition || 'new'}</Badge>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-3">
              <div>
                <Label className="text-xs">সংক্ষিপ্ত বিবরণ</Label>
                <Textarea defaultValue={generated.product.shortDescription} rows={2} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">বিস্তারিত বর্ণনা</Label>
                <Textarea defaultValue={generated.product.fullDescription} rows={6} className="mt-1" />
              </div>
            </div>
          </Card>

          {/* Why buy / Benefits / Differentiators */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" /> কেন কিনবেন
              </h4>
              <ul className="space-y-1.5 text-sm">
                {generated.product.whyBuy?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" /> অতিরিক্ত সুবিধা
              </h4>
              <ul className="space-y-1.5 text-sm">
                {generated.product.keyBenefits?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Sparkles className="h-3 w-3 text-violet-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" /> পার্থক্য
              </h4>
              <ul className="space-y-1.5 text-sm">
                {generated.product.differentiators?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Pricing & Invoice */}
          <Card className="p-5 bg-gradient-to-br from-emerald-50 to-violet-50 border-emerald-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" /> দাম ও ইনভয়েস প্রিভিউ
            </h3>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="p-3 bg-card rounded-md border border-border">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> সর্বনিম্ন দাম
                </div>
                <div className="text-lg font-bold text-rose-600">{formatMoney(generated.invoice.minSellingPrice)}</div>
                <div className="text-[10px] text-muted-foreground">এর নিচে বিক্রি নিষেধ</div>
              </div>
              <div className="p-3 bg-card rounded-md border border-border">
                <div className="text-xs text-muted-foreground">বিক্রয় দাম</div>
                <div className="text-lg font-bold text-blue-600">{formatMoney(generated.invoice.estimatedPrice)}</div>
                <div className="text-[10px] text-muted-foreground">কাস্টমার দেখবে</div>
              </div>
              <div className="p-3 bg-card rounded-md border border-emerald-200">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> অফার দাম
                </div>
                <div className="text-lg font-bold text-emerald-600">{formatMoney(generated.invoice.offerPrice)}</div>
                <div className="text-[10px] text-emerald-600">ডিসকাউন্ট প্রাইস</div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-md border border-emerald-300">
                <div className="text-xs text-emerald-700">কাস্টমার সাশ্রয়</div>
                <div className="text-lg font-bold text-emerald-700">{formatMoney(generated.invoice.savings)}</div>
                <div className="text-[10px] text-emerald-600">ডিসকাউন্ট</div>
              </div>
            </div>
          </Card>

          {/* Marketing content preview */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" /> সোশ্যাল মিডিয়া কনটেন্ট প্রিভিউ
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {/* Facebook */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Facebook পোস্ট</span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{generated.marketing?.facebook?.caption}</p>
                {generated.marketing?.facebook?.hashtags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {generated.marketing.facebook.hashtags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[9px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Instagram */}
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  <span className="font-medium text-sm">Instagram পোস্ট</span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{generated.marketing?.instagram?.caption}</p>
              </div>

              {/* YouTube */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Youtube className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">YouTube শর্টস</span>
                </div>
                <div className="text-xs font-medium">{generated.marketing?.youtube?.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{generated.marketing?.youtube?.description}</p>
              </div>

              {/* WhatsApp */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-sm">WhatsApp মেসেজ</span>
                </div>
                <p className="text-xs whitespace-pre-wrap">{generated.marketing?.whatsapp?.message}</p>
              </div>
            </div>
          </Card>

          {/* Video script */}
          {generated.video && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Video className="h-4 w-4 text-violet-600" /> ভিডিও স্ক্রিপ্ট ({generated.video.duration})
              </h3>
              <div className="space-y-2">
                {generated.video.scenes?.map((scene: any, i: number) => (
                  <div key={i} className="flex gap-3 p-2 bg-secondary/30 rounded-md">
                    <Badge variant="outline" className="text-[10px] shrink-0">{scene.time}</Badge>
                    <div className="flex-1 text-xs">
                      <div><strong>ভিজ্যুয়াল:</strong> {scene.visual}</div>
                      <div><strong>ভয়েসওভার:</strong> {scene.voiceover}</div>
                      {scene.text && <div><strong>টেক্সট:</strong> {scene.text}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                🎵 ব্যাকগ্রাউন্ড মিউজিক: {generated.video.backgroundMusic} · 📢 CTA: {generated.video.callToAction}
              </div>
            </Card>
          )}

          {/* Auto-publish toggle */}
          <Card className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">স্বয়ংক্রিয় প্রকাশনা</div>
              <div className="text-xs text-muted-foreground">
                চালু থাকলে সব প্ল্যাটফর্মে সরাসরি প্রকাশ হবে। বন্ধ থাকলে অ্যাডমিন অনুমোদন লাগবে।
              </div>
            </div>
            <Button
              variant={autoPublish ? 'default' : 'outline'}
              onClick={() => setAutoPublish(!autoPublish)}
              className="gap-2"
            >
              {autoPublish ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {autoPublish ? 'অটো-পাবলিশ চালু' : 'ম্যানুয়াল অনুমোদন'}
            </Button>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('input')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> পিছনে
            </Button>
            <Button
              onClick={handlePublish}
              className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              size="lg"
            >
              <Send className="h-5 w-5" />
              {autoPublish ? 'সব প্ল্যাটফর্মে প্রকাশ করুন' : 'ড্রাফট সেভ করুন'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Publishing */}
      {step === 'publishing' && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-violet-600 animate-spin" />
            <h3 className="text-lg font-semibold">প্রকাশ করা হচ্ছে...</h3>
            <p className="text-sm text-muted-foreground">সব প্ল্যাটফর্মে কনটেন্ট পোস্ট করা হচ্ছে</p>
          </div>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === 'done' && publishResult && (
        <div className="space-y-4">
          <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-violet-50 border-emerald-200">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-600 text-white mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">সফলভাবে সম্পন্ন!</h3>
            <p className="text-sm text-muted-foreground">{publishResult.message}</p>
          </Card>

          {/* Published platforms */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">প্রকাশিত প্ল্যাটফর্ম</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { name: 'Website', icon: Globe },
                { name: 'facebook', icon: Facebook },
                { name: 'instagram', icon: Instagram },
                { name: 'youtube', icon: Youtube },
                { name: 'whatsapp', icon: MessageCircle },
              ].map((p) => {
                const published = publishResult.publishedTo?.includes(p.name.toLowerCase()) || publishResult.publishedTo?.includes(p.name.toLowerCase().replace('book', ''));
                return (
                  <div key={p.name} className={`p-3 rounded-lg border text-center ${published ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-secondary/30'}`}>
                    <p.icon className={`h-6 w-6 mx-auto mb-1 ${published ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <div className="text-xs font-medium">{p.name}</div>
                    {published ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[9px] mt-1"><CheckCircle2 className="h-2 w-2 mr-0.5" /> সফল</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] mt-1">বাদ</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Invoice */}
          {publishResult.invoice && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" /> ইনভয়েস প্রিভিউ
                </h3>
                <Badge variant="secondary" className="font-mono">{publishResult.invoice.invoiceNumber}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">প্রোডাক্ট</span><span className="font-medium">{publishResult.invoice.productName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">পরিমাণ</span><span>1</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between"><span className="text-muted-foreground">সর্বনিম্ন দাম</span><span className="text-rose-600 font-medium">{formatMoney(publishResult.invoice.minSellingPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">বিক্রয় দাম</span><span>{formatMoney(publishResult.invoice.unitPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">অফার দাম</span><span className="text-emerald-600 font-bold">{formatMoney(publishResult.invoice.offerPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">কাস্টমার সাশ্রয়</span><span className="text-emerald-600">{formatMoney(publishResult.invoice.savings)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>সর্বমোট</span>
                  <span className="text-emerald-700">{formatMoney(publishResult.invoice.total)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Errors if any */}
          {publishResult.errors && publishResult.errors.length > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <h4 className="font-semibold text-sm text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> কিছু সমস্যা ছিল
              </h4>
              <ul className="space-y-1 text-xs text-amber-700">
                {publishResult.errors.map((err: string, i: number) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Reset button */}
          <Button onClick={reset} className="w-full gap-2" size="lg">
            <Sparkles className="h-5 w-5" /> আরেকটি প্রোডাক্ট যোগ করুন
          </Button>
        </div>
      )}

      {/* Marketing Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              {MARKETING_GUIDE.title} (v{MARKETING_GUIDE.version})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-violet-50 rounded-md text-violet-800">
              {MARKETING_GUIDE.description}
            </div>

            {/* All sections */}
            {[
              { title: MARKETING_GUIDE.inputCollection.title, content: MARKETING_GUIDE.inputCollection },
              { title: MARKETING_GUIDE.aiProcessing.title, content: MARKETING_GUIDE.aiProcessing },
              { title: MARKETING_GUIDE.contentRules.title, content: MARKETING_GUIDE.contentRules },
              { title: MARKETING_GUIDE.platformContent.title, content: MARKETING_GUIDE.platformContent },
              { title: MARKETING_GUIDE.threeDView.title, content: MARKETING_GUIDE.threeDView },
              { title: MARKETING_GUIDE.pricingRules.title, content: MARKETING_GUIDE.pricingRules },
              { title: MARKETING_GUIDE.autoPublish.title, content: MARKETING_GUIDE.autoPublish },
              { title: MARKETING_GUIDE.leadToInvoice.title, content: MARKETING_GUIDE.leadToInvoice },
            ].map((section, idx) => (
              <details key={idx} className="border border-border rounded-md">
                <summary className="p-3 cursor-pointer font-medium hover:bg-secondary/50">
                  {section.title}
                </summary>
                <div className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground mb-2">{section.content.description}</p>
                  {section.content.steps && (
                    <ul className="space-y-1 text-xs">
                      {section.content.steps.map((s: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                          <span><strong>{s.label}:</strong> {s.description || s.action}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.content.sections && (
                    <div className="space-y-2">
                      {section.content.sections.map((s: any, i: number) => (
                        <div key={i} className="text-xs">
                          <div className="font-medium">{s.title}</div>
                          <ul className="ml-4 mt-1 space-y-0.5">
                            {s.rules?.map((r: string, j: number) => (
                              <li key={j}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.content.platforms && (
                    <div className="space-y-2">
                      {section.content.platforms.map((p: any, i: number) => (
                        <div key={i} className="text-xs">
                          <div className="font-medium">{p.name} <span className="text-muted-foreground">({p.contentType})</span></div>
                          <ul className="ml-4 mt-1 space-y-0.5">
                            {p.rules?.map((r: string, j: number) => (
                              <li key={j}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.content.priceTypes && (
                    <div className="space-y-1">
                      {section.content.priceTypes.map((p: any, i: number) => (
                        <div key={i} className="text-xs flex items-start gap-2">
                          <Badge variant="outline" className="text-[9px]">{p.visibility}</Badge>
                          <span><strong>{p.name}:</strong> {p.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.content.stages && (
                    <div className="space-y-1">
                      {section.content.stages.map((s: any, i: number) => (
                        <div key={i} className="text-xs flex items-start gap-2">
                          <Badge variant="secondary" className="text-[9px]">{s.stage}</Badge>
                          <span><strong>{s.name}:</strong> {s.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
