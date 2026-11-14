'use client';
/* eslint-disable @next/next/no-img-element -- media is served through a permission-checked local route; next/image cannot proxy it */

import { useEffect, useRef, useState } from 'react';

type Props = { url: string; label: string; poster?: string };

/**
 * Real WebGL viewer (Three.js + GLTFLoader + OrbitControls).
 * Loaded lazily, resize-aware, touch-enabled, keyboard-accessible, with an
 * explicit error/fallback state. Only a verified, product-specific GLB/glTF URL
 * should be passed here; a generic model is never presented as an exact product.
 */
export default function ThreeViewer({ url, label, poster }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('Loading verified 3D model…');

  useEffect(() => {
    let disposed = false;
    let disposeScene = () => {};
    let frame = 0;
    const container = mount.current;
    if (!container) return;

    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        if (disposed || !container) return;

        const width = Math.max(container.clientWidth, 320);
        const height = Math.max(container.clientHeight, 260);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#050b14');
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
        camera.position.set(0, 1.1, 3.6);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x223044, 2.1));
        const key = new THREE.DirectionalLight(0xffffff, 2.4);
        key.position.set(3, 5, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x35d0ba, 1.1);
        rim.position.set(-4, 2, -3);
        scene.add(rim);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.minDistance = 1.2;
        controls.maxDistance = 12;
        controls.target.set(0, 0.4, 0);

        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const scale = 2.2 / Math.max(size.x, size.y, size.z || 1);
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));
          scene.add(model);
          setStatus('ready');
          setMessage('3D মডেল প্রস্তুত — ঘোরাতে ড্র্যাগ করুন, জুম করতে স্ক্রল/পিঞ্চ করুন');
        }, undefined, () => {
          if (!disposed) { setStatus('error'); setMessage('3D মডেল লোড করা যায়নি। নিচে অনুমোদিত ছবি দেখানো হচ্ছে।'); }
        });

        const resize = () => {
          if (!container || !container.isConnected) return;
          const w = Math.max(container.clientWidth, 320);
          const h = Math.max(container.clientHeight, 260);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);

        const rotate = (angle: number) => {
          const offset = camera.position.clone().sub(controls.target);
          const spherical = new THREE.Spherical().setFromVector3(offset);
          spherical.theta += angle;
          camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
          camera.lookAt(controls.target);
        };
        const onKey = (e: KeyboardEvent) => {
          const step = 0.18;
          if (e.key === 'ArrowLeft') rotate(step);
          else if (e.key === 'ArrowRight') rotate(-step);
          else if (e.key === 'ArrowUp') camera.position.y = Math.min(camera.position.y + 0.2, 8);
          else if (e.key === 'ArrowDown') camera.position.y = Math.max(camera.position.y - 0.2, -4);
          else if (e.key === '+' || e.key === '=') camera.position.multiplyScalar(0.92);
          else if (e.key === '-') camera.position.multiplyScalar(1.08);
          else return;
          e.preventDefault();
        };
        container.addEventListener('keydown', onKey);

        const animate = () => {
          frame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        disposeScene = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          container.removeEventListener('keydown', onKey);
          controls.dispose();
          scene.traverse((obj) => {
            const mesh = obj as unknown as { geometry?: { dispose?: () => void }; material?: { dispose?: () => void } | { dispose?: () => void }[] };
            mesh.geometry?.dispose?.();
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose?.());
            else mesh.material?.dispose?.();
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (error) {
        if (!disposed) {
          setStatus('error');
          setMessage(`WebGL/3D লোড ব্যর্থ: ${error instanceof Error ? error.message : 'unknown error'}. ছবির ফলব্যাক দেখানো হচ্ছে।`);
        }
      }
    })();

    return () => { disposed = true; disposeScene(); };
  }, [url]);

  const fullscreen = () => {
    if (stage.current?.requestFullscreen) void stage.current.requestFullscreen().catch(() => undefined);
  };

  return (
    <div ref={stage} className="three-stage" tabIndex={0} role="application" aria-label={`Interactive 3D model: ${label}`} style={{ position: 'relative' }}>
      <div ref={mount} style={{ width: '100%', height: '100%', minHeight: 300 }} />
      {status === 'loading' ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(5,11,20,.7)' }} role="status">⏳ 3D মডেল লোড হচ্ছে…</div> : null}
      {status === 'error' ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(5,11,20,.86)', textAlign: 'center', padding: 20 }}>
          <div>
            <p>{message}</p>
            {poster ? <img src={poster} alt={label} style={{ maxHeight: 180, borderRadius: 10 }} /> : null}
          </div>
        </div>
      ) : null}
      <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        <span className="viewer-hint" style={{ background: 'rgba(5,11,20,.8)', padding: '4px 8px', borderRadius: 8 }}>{message}</span>
        <button type="button" className="btn btn-sm" style={{ pointerEvents: 'auto' }} onClick={fullscreen}>⛶ ফুল স্ক্রিন</button>
      </div>
    </div>
  );
}
