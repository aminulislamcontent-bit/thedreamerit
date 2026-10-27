// 3D Product Viewer - uses Three.js with image-gallery fallback
// Loaded dynamically to avoid SSR issues with WebGL
'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut, Camera, AlertTriangle } from 'lucide-react';

interface Viewer3DProps {
  modelUrl?: string | null;
  images: Array<{ url: string; altText?: string | null }>;
  productName: string;
}

export function Viewer3D({ modelUrl, images, productName }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'3d' | 'gallery'>(modelUrl ? '3d' : 'gallery');
  const [loading, setLoading] = useState(!!modelUrl);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const threeRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== '3d' || !modelUrl || !containerRef.current) return;

    let mounted = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import Three.js
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

        if (!mounted || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(3, 2, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-5, 5, -5);
        scene.add(fillLight);

        // Ground plane
        const groundGeo = new THREE.CircleGeometry(3, 64);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.6 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        scene.add(ground);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI / 2 + 0.2;

        // Load model
        const loader = new GLTFLoader();
        let model: THREE.Group | null = null;

        loader.load(
          modelUrl,
          (gltf) => {
            if (!mounted) return;
            model = gltf.scene;

            // Auto-center and scale
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            model.position.y = -0.5;

            model.traverse((obj: any) => {
              if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
              }
            });

            scene.add(model);
            setLoading(false);
          },
          (progress) => {
            // Loading progress
          },
          (err) => {
            console.error('3D model load error:', err);
            setError('মডেল লোড করা যায়নি। গ্যালারি ভিউ ব্যবহার করুন।');
            setLoading(false);
            // Auto-fallback to gallery
            setTimeout(() => setMode('gallery'), 1500);
          }
        );

        // Animation loop
        let animationId: number;
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls.update();
          if (model) {
            // Slow auto-rotate when not interacting
            // (disabled by default - user can drag)
          }
          renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        const handleResize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        cleanup = () => {
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleResize);
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
          controls.dispose();
          scene.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
              else obj.material.dispose();
            }
          });
        };
      } catch (err: any) {
        console.error('3D viewer init failed:', err);
        setError(`৩ডি ভিউয়ার চালু করা যায়নি: ${err.message}`);
        setLoading(false);
        setTimeout(() => setMode('gallery'), 1500);
      }
    })();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, [mode, modelUrl]);

  // Fullscreen handler
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (mode === 'gallery' || !modelUrl) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border/60">
          {images.length > 0 ? (
            <img
              src={images[activeImage]?.url}
              alt={images[activeImage]?.altText || productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Camera className="h-12 w-12 opacity-40" />
            </div>
          )}
          {modelUrl && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-3 right-3 gap-1.5"
              onClick={() => setMode('3d')}
            >
              <RotateCcw className="h-3.5 w-3.5" /> 3D ভিউ
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition ${
                  i === activeImage ? 'border-primary' : 'border-transparent hover:border-border'
                }`}
              >
                <img src={img.url} alt={img.altText || `${productName} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/30 border border-border/60">
        <div ref={containerRef} className="w-full h-full viewer-3d-canvas" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 backdrop-blur">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">৩ডি মডেল লোড হচ্ছে...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 backdrop-blur">
            <div className="text-center p-4">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button size="sm" variant="secondary" onClick={() => setMode('gallery')}>
                গ্যালারি দেখুন
              </Button>
            </div>
          </div>
        )}

        {/* 3D Controls overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            <RotateCcw className="mr-1 h-3 w-3" /> টেনে ঘুরান
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur" onClick={() => setMode('gallery')}>
            <Camera className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        মাউস দিয়ে টেনে ঘুরান · স্ক্রল করে জুম করুন · টাচস্ক্রিনে দুই আঙুল দিয়ে জুম
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
