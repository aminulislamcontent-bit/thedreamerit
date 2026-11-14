'use client';
/* eslint-disable @next/next/no-img-element -- media is served through a permission-checked local route; next/image cannot proxy it */

import { useEffect, useRef, useState } from 'react';

type Props = { frames: string[]; label: string };

/** Genuine drag/swipe 360° photographic sequence viewer. Never labelled a 3D model. */
export default function Spin360Viewer({ frames, label }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startIndex = useRef(0);
  const stage = useRef<HTMLDivElement>(null);

  const framesKey = frames.join('|');
  useEffect(() => { setIndex(0); }, [framesKey]);

  if (!frames.length) return <div className="empty">কোনো অনুমোদিত 360° ফ্রেম নেই।</div>;

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startIndex.current = index;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    const steps = Math.round(delta / 18);
    const next = ((startIndex.current + steps) % frames.length + frames.length) % frames.length;
    setIndex(next);
  };
  const onUp = () => { dragging.current = false; };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + frames.length) % frames.length);
    else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % frames.length);
    else return;
    e.preventDefault();
  };
  const fullscreen = () => { if (stage.current?.requestFullscreen) void stage.current.requestFullscreen().catch(() => undefined); };

  return (
    <div ref={stage} className="spin-stage" tabIndex={0} role="application" aria-label={`360 degree photographic sequence: ${label}`}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
      style={{ position: 'relative' }}>
      <img src={frames[index]} alt={`${label} — 360° কোণ ${index + 1}/${frames.length}`}
        draggable={false} loading="lazy" style={{ transform: zoomed ? 'scale(1.7)' : 'scale(1)', transition: 'transform .15s ease' }} />
      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', gap: 8, pointerEvents: 'none' }}>
        <span className="viewer-hint" style={{ background: 'rgba(5,11,20,.8)', padding: '4px 8px', borderRadius: 8 }}>
          টেনে/সোয়াইপ করে ঘোরান · {index + 1}/{frames.length} কোণ · 360° ছবির ধারাবাহিকতা (3D মডেল নয়)
        </span>
        <span style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}>{zoomed ? '−' : '＋'} জুম</button>
          <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); fullscreen(); }}>⛶</button>
        </span>
      </div>
    </div>
  );
}
