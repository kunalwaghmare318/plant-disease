'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function LeafCanvas() {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.8;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xb6ff2a, 1.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Load Model
    const loader = new GLTFLoader();

    loader.load(
      '/assets/models/new-leaf/scene.gltf',
      (gltf) => {
        const model = gltf.scene;

        // Compute exact bounding box of geometry
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Offset inner model so its geometric center is at (0,0,0) inside pivot
        model.position.set(-center.x, -center.y, -center.z);

        const pivot = new THREE.Group();
        pivot.add(model);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 2.9 / maxDim;
          pivot.scale.set(scale, scale, scale);
        }

        scene.add(pivot);

        // Target camera/controls directly to origin (0,0,0)
        controls.target.set(0, 0, 0);
        controls.update();

        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.error('Error loading GLTF model:', err);
        setError('Failed to load 3D leaf model.');
      }
    );

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="w-full h-full relative flex items-center justify-center rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
      style={{
        background: '#07120b',
        boxShadow: '0 25px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Loading Spinner */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40 z-10">
          <div className="w-8 h-8 border-2 border-[#b6ff2a] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] tracking-widest uppercase font-medium">Loading 3D Model...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs z-10">
          {error}
        </div>
      )}



      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />
    </div>
  );
}

