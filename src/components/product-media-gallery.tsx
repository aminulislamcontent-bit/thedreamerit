'use client';
/* eslint-disable @next/next/no-img-element -- media is served through a permission-checked local route; next/image cannot proxy it */

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { evaluateMedia, type MediaRecord } from '@/lib/core/catalogue-rules';

const ThreeViewer = dynamic(() => import('./three-viewer'), {
  ssr: false,
  loading: () => <div role="status" style={{ padding: 40, textAlign: 'center' }}>⏳ 3D ভিউয়ার লোড হচ্ছে…</div>,
});
const Spin360Viewer = dynamic(() => import('./spin-360-viewer'), {
  ssr: false,
  loading: () => <div role="status" style={{ padding: 40, textAlign: 'center' }}>⏳ 360° ভিউয়ার লোড হচ্ছে…</div>,
});

type Props = { media: MediaRecord[]; productName: string; preview?: boolean };

type Tab = 'photos' | 'spin' | 'model' | 'video';

export default function ProductMediaGallery({ media, productName, preview = false }: Props) {
  const approved = useMemo(() => media.filter((m) => m.reviewStatus === 'approved' && m.permissionStatus === 'granted'), [media]);
  const images = useMemo(() => approved.filter((m) => m.kind === 'image').sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder), [approved]);
  const videos = useMemo(() => approved.filter((m) => m.kind === 'video'), [approved]);
  const models = useMemo(() => approved.filter((m) => m.kind === 'model_3d'), [approved]);
  const spinSequences = useMemo(() => {
    const groups = new Map<string, MediaRecord[]>();
    for (const m of approved.filter((x) => x.kind === 'spin_frame')) groups.set(m.sequenceKey || 'default', [...(groups.get(m.sequenceKey || 'default') ?? []), m]);
    return [...groups.values()]
      .map((frames) => frames.sort((a, b) => a.sortOrder - b.sortOrder))
      .filter((frames) => frames.length >= 8 && new Set(frames.map((f) => f.sortOrder)).size === frames.length)
      .sort((a, b) => b.length - a.length);
  }, [approved]);
  const spin = spinSequences[0] ?? [];
  const evaluation = useMemo(() => evaluateMedia(media), [media]);

  const defaultTab: Tab = models.length ? 'model' : spin.length ? 'spin' : 'photos';
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % Math.max(images.length, 1)));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + images.length) % Math.max(images.length, 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  const primary = images[active];

  return (
    <div className="media-gallery">
      <div className="spread" style={{ marginBottom: 8 }}>
        <span className={`badge ${evaluation.tier === 'none' ? 'badge-danger' : 'badge-info'}`}>{evaluation.label}</span>
        {preview ? <span className="badge badge-warn">অ্যাডমিন প্রিভিউ — প্রকাশিত নয়</span> : null}
      </div>

      <div className="media-tabs" role="tablist" aria-label="Product media">
        {images.length ? <button className={`btn btn-sm ${tab === 'photos' ? 'btn-primary' : ''}`} role="tab" aria-selected={tab === 'photos'} onClick={() => setTab('photos')}>📷 ছবি ({images.length})</button> : null}
        {spin.length ? <button className={`btn btn-sm ${tab === 'spin' ? 'btn-primary' : ''}`} role="tab" aria-selected={tab === 'spin'} onClick={() => setTab('spin')}>🔄 360° ({spin.length} কোণ)</button> : null}
        {models.length ? <button className={`btn btn-sm ${tab === 'model' ? 'btn-primary' : ''}`} role="tab" aria-selected={tab === 'model'} onClick={() => setTab('model')}>🧊 3D মডেল</button> : null}
        {videos.length ? <button className={`btn btn-sm ${tab === 'video' ? 'btn-primary' : ''}`} role="tab" aria-selected={tab === 'video'} onClick={() => setTab('video')}>▶ ভিডিও</button> : null}
      </div>

      <div className="media-stage">
        {tab === 'photos' && primary ? (
          <button type="button" onClick={() => setLightbox(active)} style={{ width: '100%', height: '100%', border: 0, background: 'transparent', cursor: 'zoom-in' }} aria-label="Open full-screen image viewer">
            <img src={primary.url} alt={primary.altText || `${productName} — পণ্যের ছবি ${active + 1}`} loading="lazy" />
          </button>
        ) : null}
        {tab === 'photos' && !primary ? <div style={{ padding: 30, textAlign: 'center' }} className="muted">কোনো অনুমোদিত, অনুমতিপ্রাপ্ত পণ্যের ছবি নেই।</div> : null}
        {tab === 'spin' && spin.length ? <Spin360Viewer frames={spin.map((f) => f.url)} label={productName} /> : null}
        {tab === 'model' && models.length ? <ThreeViewer url={models[0].url} label={productName} poster={images[0]?.url} /> : null}
        {tab === 'video' && videos.length ? (
          <video controls preload="none" playsInline style={{ width: '100%', height: '100%', background: '#050b14' }} poster={images[0]?.url}>
            <source src={videos[0].url} />
            আপনার ব্রাউজার ভিডিও সমর্থন করে না। পণ্যের ছবি ব্যবহার করুন।
          </video>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="media-thumbs">
          {images.map((m, i) => (
            <button key={m.id} className={i === active ? 'active' : ''} onClick={() => { setActive(i); setTab('photos'); }} aria-label={`Show image ${i + 1}`}>
              <img src={m.url} alt={m.altText || `থাম্বনেইল ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="notice notice-warn" style={{ fontSize: '.84rem' }}>
        <strong>মিডিয়া সততা:</strong> {evaluation.tier === 'photos' || evaluation.tier === 'photos_video'
          ? 'এই পণ্যের জন্য কোনো যাচাইকৃত 3D মডেল বা 360° ধারাবাহিকতা নেই; স্থির বহু-কোণের ছবি দেখানো হচ্ছে। ছবির গ্যালারিকে 3D মডেল বা ইন্টারঅ্যাকটিভ 360° ভিউয়ার বলে দাবি করা হয় না।'
          : evaluation.tier === 'spin_360'
            ? 'এটি একটি প্রকৃত 360° ছবির ধারাবাহিকতা (ড্র্যাগ/সোয়াইপ করে ঘোরানো যায়) — এটি 3D মডেল নয়।'
            : evaluation.tier === 'model_3d'
              ? 'এটি পণ্য-নির্দিষ্ট যাচাইকৃত GLB/glTF 3D মডেল; সাধারণ মডেলকে নির্দিষ্ট প্রস্তুতকারকের পণ্য হিসেবে দেখানো হয় না।'
              : 'প্রয়োজনীয় মিডিয়া অনুমোদিত না হওয়া পর্যন্ত এই পণ্য প্রকাশ করা যাবে না।'}
        {videos.length ? ' ভিডিও পণ্য-নির্দিষ্ট অথবা স্পষ্টভাবে প্রস্তুতকারক/ক্যাটাগরি ডেমোনস্ট্রেশন হিসেবে চিহ্নিত।' : ''}
        {' '}ক্যাপশন/ট্রান্সক্রিপ্ট থাকলে সেটি মিডিয়া রেকর্ডে সংরক্ষিত হয়; ছবি লেজি-লোড করা হয় এবং নিচের ছবিগুলোর জন্য অ্যাসপেক্ট রেশিও সংরক্ষিত থাকে।
      </div>

      {lightbox !== null && images[lightbox] ? (
        <div role="dialog" aria-modal="true" aria-label="Full screen product image"
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(3,7,14,.96)', display: 'grid', gridTemplateRows: 'auto 1fr auto', padding: 16 }}
          onClick={() => setLightbox(null)}>
          <div className="spread"><strong>পূর্ণ-স্ক্রিন ছবি · {lightbox + 1}/{images.length}</strong><button className="btn btn-sm" onClick={() => setLightbox(null)}>✕ বন্ধ (Esc)</button></div>
          <div style={{ display: 'grid', placeItems: 'center', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <img src={images[lightbox].url} alt={images[lightbox].altText || productName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div className="row" style={{ justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm" onClick={() => setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length))}>◀ আগে</button>
            <span className="muted">{images[lightbox].altText || `${productName} — ছবি`}</span>
            <button className="btn btn-sm" onClick={() => setLightbox((i) => (i === null ? null : (i + 1) % images.length))}>পরে ▶</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
