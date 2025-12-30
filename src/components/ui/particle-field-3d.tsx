import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { reportPerformance } from "./performance-overlay";

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number; // in px (screen space)
  densityFactor: number;
  skipConnectionFrames: number;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
};

const getQualitySettings = (): QualitySettings => {
  const width = window.innerWidth;
  const pixelRatio = window.devicePixelRatio || 1;

  // @ts-expect-error experimental
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;

  const isLowPower = memory && memory < 4;
  const isSmallScreen = width < 768;
  const isHighDPI = pixelRatio > 2;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    return {
      densityFactor: 0.3,
      maxParticles: 70,
      connectionDistance: 90,
      skipConnectionFrames: 4,
    };
  }

  return {
    densityFactor: isSmallScreen ? 0.9 : isLowPower ? 1.0 : 1.3,
    maxParticles: isLowPower ? 240 : isSmallScreen ? 320 : 560,
    connectionDistance: isLowPower ? 120 : 140,
    skipConnectionFrames: isLowPower || cores < 4 || isHighDPI ? 2 : 1,
  };
};

// Allow external tuning
let externalQualitySettings: QualitySettings | null = null;
export const setParticleField3DQuality = (settings: QualitySettings) => {
  externalQualitySettings = settings;
};

// ============================================================================
// Small helper: evenly spread initial positions (stratified jitter)
// ============================================================================

function stratifiedPositions(count: number, halfW: number, halfH: number) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const cellW = (2 * halfW) / cols;
  const cellH = (2 * halfH) / rows;

  const pts: Array<{ x: number; y: number }> = [];
  let k = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (k++ >= count) break;

      const jx = (Math.random() - 0.5) * 0.8;
      const jy = (Math.random() - 0.5) * 0.8;

      pts.push({
        x: -halfW + (c + 0.5 + jx) * cellW,
        y: -halfH + (r + 0.5 + jy) * cellH,
      });
    }
  }

  // shuffle
  for (let i = pts.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  return pts;
}

// ============================================================================
// Shaders
// ============================================================================

const particleVertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  attribute float aTwinkle;
  uniform float uPixelRatio;
  uniform float uScale;
  varying float vOpacity;
  varying float vTwinkle;

  void main() {
    vOpacity = aOpacity;
    vTwinkle = aTwinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * uScale * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  precision highp float;
  varying float vOpacity;
  varying float vTwinkle;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float d = length(uv) * 2.0;

    float glow = smoothstep(1.0, 0.0, d);
    float core = smoothstep(0.35, 0.0, d);

    float tw = 0.78 + 0.22 * sin(uTime * vTwinkle);
    float alpha = (0.30 * glow + 0.70 * core) * vOpacity * tw;

    vec3 glowColor = vec3(0.55, 0.78, 0.82);
    vec3 coreColor = vec3(0.72, 0.92, 1.00);
    vec3 color = mix(glowColor, coreColor, core);

    gl_FragColor = vec4(color, alpha);
  }
`;

const lineVertexShader = `
  attribute float aOpacity;
  varying float vOpacity;
  void main() {
    vOpacity = aOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = `
  precision highp float;
  varying float vOpacity;
  void main() {
    vec3 color = vec3(0.53, 0.77, 0.80);
    gl_FragColor = vec4(color, vOpacity);
  }
`;

// ============================================================================
// Simulation
// ============================================================================

function ParticleSimulation() {
  const { viewport } = useThree();

  const mouseRef = useRef({ x: 0, y: 0 });
  const isInHeroRef = useRef(true);
  const frameCountRef = useRef(0);
  const qualityRef = useRef(getQualitySettings());

  // init scatter only once per mount
  const didScatterRef = useRef(false);

  const {
    particles,
    geometry,
    material,
    positions,
    sizes,
    opacities,
    twinkles,
    lineGeometry,
    lineMaterial,
    linePositions,
    lineOpacities,
    maxLineVerts,
  } = useMemo(() => {
    const q = qualityRef.current;
    const max = q.maxParticles;

    const particles: Particle[] = new Array(max).fill(null).map(() => {
      const r = Math.random();
      const size = r < 0.85 ? Math.random() * 1.1 + 0.6 : Math.random() * 2.2 + 2.0;

      return {
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.0016,
        vy: (Math.random() - 0.5) * 0.0016,
        size,
        opacity: Math.random() * 0.45 + 0.15,
        twinkleSpeed: Math.random() * 1.6 + 0.5,
      };
    });

    const positions = new Float32Array(max * 3);
    const sizes = new Float32Array(max);
    const opacities = new Float32Array(max);
    const twinkles = new Float32Array(max);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkles, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
        uScale: { value: 52.0 },
        uTime: { value: 0 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
    });

    // Lines (simple proximity links)
    const maxConnections = Math.floor(max * 1.6); // connection count budget
    const maxLineVerts = maxConnections * 2;

    const linePositions = new Float32Array(maxLineVerts * 3);
    const lineOpacities = new Float32Array(maxLineVerts);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("aOpacity", new THREE.BufferAttribute(lineOpacities, 1));
    lineGeometry.setDrawRange(0, 0);

    const lineMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: lineVertexShader,
      fragmentShader: lineFragmentShader,
    });

    return {
      particles,
      geometry,
      material,
      positions,
      sizes,
      opacities,
      twinkles,
      lineGeometry,
      lineMaterial,
      linePositions,
      lineOpacities,
      maxLineVerts,
    };
  }, []);

  // even scatter once viewport is known
  useEffect(() => {
    if (didScatterRef.current) return;
    if (!viewport.width || !viewport.height) return;
    didScatterRef.current = true;

    const pts = stratifiedPositions(particles.length, viewport.width, viewport.height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].x = pts[i].x;
      particles[i].y = pts[i].y;
    }
  }, [viewport.width, viewport.height, particles]);

  // mouse
  useEffect(() => {
    let scheduled = false;
    const onMove = (e: MouseEvent) => {
      if (scheduled) return;
      scheduled = true;

      const worldX = (e.clientX / window.innerWidth - 0.5) * viewport.width;
      const worldY = -((e.clientY / window.innerHeight - 0.5) * viewport.height);
      mouseRef.current = { x: worldX, y: worldY };

      requestAnimationFrame(() => {
        scheduled = false;
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [viewport.width, viewport.height]);

  // hero observer (optional; keep your behavior)
  useEffect(() => {
    const hero = document.querySelector("section.h-screen");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInHeroRef.current = entry.intersectionRatio >= 0.3;
      },
      { threshold: [0, 0.3, 0.5, 1] }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // resize: update pixel ratio
  useEffect(() => {
    const onResize = () => {
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.5);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [material]);

  useFrame((state) => {
    const frameStart = performance.now();
    if (document.hidden) return;

    frameCountRef.current++;
    const frame = frameCountRef.current;

    // allow external quality updates later (kept minimal: only updates connection distance behavior)
    const settings = externalQualitySettings || qualityRef.current;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    // world distance equivalent for the px-based threshold
    const worldConnDist = (settings.connectionDistance / window.innerWidth) * viewport.width * 2;

    // mouse pull
    const maxMouseDist = 1.4;
    const pull = 0.0016;

    // update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      const dxm = mouseRef.current.x - p.x;
      const dym = mouseRef.current.y - p.y;
      const dm = Math.sqrt(dxm * dxm + dym * dym);

      if (isInHeroRef.current && dm < maxMouseDist) {
        const t = 1 - dm / maxMouseDist;
        const g = pull * t * t;
        p.vx += dxm * g;
        p.vy += dym * g;
        p.opacity = Math.min(1, p.opacity + 0.02 * t);
      } else {
        // small relaxation back
        p.opacity = Math.max(0.12, p.opacity * 0.995);
      }

      // gentle drift
      p.vx += (Math.random() - 0.5) * 0.00002;
      p.vy += (Math.random() - 0.5) * 0.00002;

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.985;
      p.vy *= 0.985;

      // wrap
      const halfW = viewport.width;
      const halfH = viewport.height;
      if (p.x < -halfW) p.x = halfW;
      if (p.x > halfW) p.x = -halfW;
      if (p.y < -halfH) p.y = halfH;
      if (p.y > halfH) p.y = -halfH;

      // buffers
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = 0;

      sizes[i] = p.size * 8.0;
      opacities[i] = p.opacity;
      twinkles[i] = p.twinkleSpeed;
    }

    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.aOpacity as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.aTwinkle as THREE.BufferAttribute).needsUpdate = true;

    // lines (simple: O(n*k) with a cap; still fine at this baseline)
    if (frame % settings.skipConnectionFrames === 0) {
      let li = 0;
      const maxPerParticle = 3;

      for (let i = 0; i < particles.length && li < maxLineVerts; i++) {
        const p1 = particles[i];
        let made = 0;

        // check only a small window to keep it cheap (baseline)
        // (later we can reintroduce SpatialGrid cleanly)
        for (let j = i + 1; j < particles.length && made < maxPerParticle && li < maxLineVerts; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > worldConnDist * worldConnDist) continue;

          const d = Math.sqrt(d2);
          const a = 0.22 * (1 - d / worldConnDist) * Math.min(p1.opacity, p2.opacity);

          linePositions[li * 3 + 0] = p1.x;
          linePositions[li * 3 + 1] = p1.y;
          linePositions[li * 3 + 2] = 0;
          lineOpacities[li] = a;
          li++;

          if (li >= maxLineVerts) break;

          linePositions[li * 3 + 0] = p2.x;
          linePositions[li * 3 + 1] = p2.y;
          linePositions[li * 3 + 2] = 0;
          lineOpacities[li] = a;
          li++;

          made++;
        }
      }

      lineGeometry.setDrawRange(0, li);
      (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (lineGeometry.attributes.aOpacity as THREE.BufferAttribute).needsUpdate = true;
    }

    if (frame % 60 === 0) {
      const duration = performance.now() - frameStart;
      reportPerformance("ParticleField3D", duration);
    }
  });

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <lineSegments geometry={lineGeometry} material={lineMaterial} frustumCulled={false} />
    </>
  );
}

// ============================================================================
// Export
// ============================================================================

function ParticleField3DCanvas() {
  const quality = getQualitySettings();
  const dpr =
    quality.densityFactor < 0.5
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5);

  return (
    <Canvas
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
      camera={{ position: [0, 0, 5], near: 0.1, far: 100 }}
      frameloop="always"
    >
      <ParticleSimulation />
    </Canvas>
  );
}

export const ParticleField3D = () => <ParticleField3DCanvas />;
export default ParticleField3D;