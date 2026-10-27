// Premium Hero V3 - With rotating 3D vase element + 7 video-quality images carousel
'use client';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { BUSINESS } from '@/lib/config';
import { PRODUCT_IMAGES } from '@/lib/images';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, ArrowRight, Cpu, ChevronLeft, ChevronRight, Play,
  Shield, Truck, Video, Award, MessageCircle,
} from 'lucide-react';

export function PremiumHero() {
  const navigate = useAppStore((s) => s.navigate);
  const [currentImage, setCurrentImage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = PRODUCT_IMAGES.heroCarousel;

  // Auto-advance carousel
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  // 3D rotating vase element - canvas-based rotating wireframe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let angle = 0;
    const width = canvas.width = 200;
    const height = canvas.height = 280;

    const drawVase = (rotation: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);

      // Vase profile (sine-wave shape - traditional vase silhouette)
      const segments = 60;
      const layers = 24;
      const baseRadius = 30;

      for (let layer = 0; layer < layers; layer++) {
        const y = (layer - layers / 2) * 8;
        // Vase profile - narrow top, wide middle, narrow base
        const profileT = layer / layers;
        const vaseShape = Math.sin(profileT * Math.PI) * 0.6 + 0.4;
        const radius = baseRadius * vaseShape + (1 - vaseShape) * 8;

        for (let seg = 0; seg < segments; seg++) {
          const segAngle = (seg / segments) * Math.PI * 2 + rotation;
          const x = Math.cos(segAngle) * radius;
          const z = Math.sin(segAngle) * radius;

          // Only draw front-facing points (z > 0)
          if (z > -5) {
            const opacity = (z + radius) / (radius * 2);
            const size = 1 + opacity * 1.5;

            // Gradient color based on layer
            const hue = (layer / layers) * 60 + 160; // emerald to teal
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${opacity * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Wireframe lines every 4 segments
            if (seg % 4 === 0 && layer % 2 === 0) {
              ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity * 0.3})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(x, y);
              const nextSeg = ((seg + 4) / segments) * Math.PI * 2 + rotation;
              const nextX = Math.cos(nextSeg) * radius;
              ctx.lineTo(nextX, y);
              ctx.stroke();
            }
          }
        }
      }

      // Vertical wireframe lines
      for (let seg = 0; seg < segments; seg += 6) {
        ctx.strokeStyle = `hsla(160, 80%, 50%, 0.4)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        let started = false;
        for (let layer = 0; layer < layers; layer++) {
          const y = (layer - layers / 2) * 8;
          const profileT = layer / layers;
          const vaseShape = Math.sin(profileT * Math.PI) * 0.6 + 0.4;
          const radius = baseRadius * vaseShape + (1 - vaseShape) * 8;
          const segAngle = (seg / segments) * Math.PI * 2 + rotation;
          const x = Math.cos(segAngle) * radius;
          const z = Math.sin(segAngle) * radius;

          if (z > -5) {
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    const animate = () => {
      angle += 0.012;
      drawVase(angle);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const goToSlide = (idx: number) => {
    setCurrentImage((idx + images.length) % images.length);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 5000);
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-emerald-50/30 to-violet-50/30">
      {/* Background pattern */}
      <div className="absolute inset-0 tech-grid opacity-30"></div>
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container relative mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          {/* Left: Text content */}
          <div className="space-y-5 order-2 lg:order-1">
            <Badge variant="secondary" className="rounded-full px-3 py-1.5 gap-1.5 bg-gradient-to-r from-emerald-500/15 to-violet-500/15 text-emerald-700 border-emerald-500/30">
              <Sparkles className="h-3 w-3" /> AI-Driven Tech Retailer · Bangladesh
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              আপনার টেক পার্টনার,<br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-violet-600 bg-clip-text text-transparent">
                দ্য ড্রিমার আইটি
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
              প্রিমিয়াম ইউজড ও রিফারবিশড ল্যাপটপ (HP EliteBook, Dell, Lenovo), Apple MacBook, গেমিং পিসি ও কাস্টম বিল্ড। ভিডিও কলে দেখুন, অরিজিনাল ওয়ারেন্টিতে কিনুন।
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate({ name: 'catalog' })} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                প্রোডাক্ট ব্রাউজ করুন <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate({ name: 'pc-configurator' })} className="gap-2 backdrop-blur bg-background/80">
                <Cpu className="h-4 w-4" /> কাস্টম পিসি বিল্ড
              </Button>
              <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50">
                  <MessageCircle className="h-4 w-4" /> ভিডিও কল
                </Button>
              </a>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { icon: Shield, label: 'অরিজিনাল', color: 'text-emerald-600 bg-emerald-50' },
                { icon: Truck, label: 'ডেলিভারি', color: 'text-blue-600 bg-blue-50' },
                { icon: Video, label: 'ভিডিও কল', color: 'text-violet-600 bg-violet-50' },
                { icon: Award, label: 'ওয়ারেন্টি', color: 'text-amber-600 bg-amber-50' },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1 p-2 rounded-lg bg-background/60 backdrop-blur border border-border/40">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.color}`}>
                    <t.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-[10px] font-semibold">{t.label}</div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">5K+</div>
                <div className="text-[10px] text-muted-foreground">কাস্টমার</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">10K+</div>
                <div className="text-[10px] text-muted-foreground">প্রোডাক্ট</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">37+</div>
                <div className="text-[10px] text-muted-foreground">ব্র্যান্ড</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600 flex items-center gap-1 justify-center">
                  4.8 <Sparkles className="h-3 w-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-[10px] text-muted-foreground">রেটিং</div>
              </div>
            </div>
          </div>

          {/* Right: Premium carousel + 3D rotating vase */}
          <div className="relative order-1 lg:order-2">
            {/* Main carousel */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-100 to-violet-100 shadow-2xl border-4 border-background">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentImage ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img
                    src={img}
                    alt={`Premium tech showcase ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                </div>
              ))}

              {/* Top-left badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                <Badge className="bg-red-500 hover:bg-red-500 text-white shadow-lg">
                  <Sparkles className="mr-1 h-3 w-3" /> লাইভ শোকেস
                </Badge>
                <Badge variant="secondary" className="bg-violet-600/90 hover:bg-violet-600 text-white backdrop-blur shadow-lg">
                  3D View Available
                </Badge>
              </div>

              {/* Top-right: Play/Pause + counter */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background shadow-lg"
                  title={isPlaying ? 'বিরতি' : 'চালান'}
                >
                  {isPlaying ? <span className="text-xs">❚❚</span> : <Play className="h-3 w-3 ml-0.5" />}
                </button>
                <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs">
                  {currentImage + 1} / {images.length}
                </Badge>
              </div>

              {/* Bottom: Price tag */}
              <div className="absolute bottom-3 left-3 z-10 bg-background/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg">
                <div className="text-[10px] text-muted-foreground">শুরু</div>
                <div className="font-bold text-emerald-600 text-lg">৳৮৫,০০০</div>
              </div>

              {/* Carousel controls */}
              <button
                onClick={() => goToSlide(currentImage - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToSlide(currentImage + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Bottom progress dots */}
              <div className="absolute bottom-3 right-3 z-10 flex gap-1">
                {images.slice(0, 7).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === currentImage ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            </div>

            {/* 3D rotating vase - floating element */}
            <div className="absolute -bottom-12 -left-12 z-20 hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse"></div>
                <canvas
                  ref={canvasRef}
                  className="relative w-[200px] h-[280px]"
                  aria-label="3D rotating vase element"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-center">
                  <Badge className="bg-emerald-600 text-white text-[10px] backdrop-blur">
                    AI 3D Engine
                  </Badge>
                </div>
              </div>
            </div>

            {/* Floating WhatsApp CTA */}
            <a
              href={`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent('আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-4 -right-4 z-20 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-emerald-700 transition group"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <div className="text-xs">
                <div className="font-bold">ভিডিও কলে দেখুন</div>
                <div className="opacity-90">{BUSINESS.phone}</div>
              </div>
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping -z-10"></span>
            </a>

            {/* Floating stats card */}
            <div className="absolute -top-3 -right-3 z-20 bg-background/95 backdrop-blur px-3 py-2 rounded-lg shadow-xl border border-emerald-200">
              <div className="text-[10px] text-muted-foreground">আজকের অফার</div>
              <div className="font-bold text-emerald-600 text-sm">৫% ছাড়</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
