import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { reportPerformance } from "./performance-overlay";
import { getExternalQualitySettings } from "./particle-quality";

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number; // in px (screen space)
  densityFactor: number;
  skipConnectionFrames: number;
}

// ============================================================================
// Preset System
// ============================================================================

export type PresetName =
  | "default"
  | "architecture"
  | "shipping"
  | "ai"
  | "reactivity";

export interface FieldPreset {
  name: PresetName;
  drift: number;
  damping: number;
  connectionDistance: number; // multiplier on base
  maxEdgesPerPoint: number;
  signatureDuration: number; // ms for the signature moment
  gridBias?: number; // for architecture
  vortexStrength?: number; // for shipping
  pulseFreq?: number; // for shipping
  clusterCount?: number; // for ai
  flowStrength?: number; // for reactivity
  mouseStrength?: number; // 0..1 modulation of baseline mouse interaction
}

interface ForceContext {
  mouseX: number;
  mouseY: number;
  time: number;
  signatureProgress: number; // 0..1 during signature moment
  vw: number;
  vh: number;
}

const PRESETS: Record<PresetName, FieldPreset> = {
  default: {
    name: "default",
    drift: 0.00002,
    damping: 0.985,
    connectionDistance: 1.0,
    maxEdgesPerPoint: 3,
    signatureDuration: 0,
    mouseStrength: 1.0, // full mouse interaction
  },
  architecture: {
    name: "architecture",
    drift: 0.00008,
    damping: 0.96,
    connectionDistance: 1.15,
    maxEdgesPerPoint: 3,
    signatureDuration: 800,
    gridBias: 0.18, // reduced from 0.25 for slower effect
    mouseStrength: 0.4, // reduced mouse power
  },
  shipping: {
    name: "shipping",
    drift: 0.0001,
    damping: 0.985,
    connectionDistance: 0.65,
    maxEdgesPerPoint: 1,
    signatureDuration: 1400, // slower signature
    vortexStrength: 0.00035,
    mouseStrength: 0.35,
  },
  ai: {
    name: "ai",
    drift: 0.00012,
    damping: 0.98,
    connectionDistance: 0.92,
    maxEdgesPerPoint: 2,
    signatureDuration: 1200,
    clusterCount: 6,
    mouseStrength: 0.4,
  },
  reactivity: {
    name: "reactivity",
    drift: 0.00018,
    damping: 0.99,
    connectionDistance: 1.05,
    maxEdgesPerPoint: 3,
    signatureDuration: 1100,
    flowStrength: 0.0004, // reduced from 0.0012 for slower flow
    mouseStrength: 0.4,
  },
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  // For clustering (AI preset)
  clusterId?: number;
  nextClusterId?: number; // target cluster for transition
  clusterTransitionTime?: number; // when to switch to next cluster
  pathWavePhase?: number; // wave animation phase for curved paths
  // For flow field (reactivity preset)
  flowPhase?: number;
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

// Allow external tuning - moved to particle-quality.ts
// Usage: import { setParticleField3DQuality } from "@/components/ui/particle-quality"

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

    float tw = 0.38 + 0.12 * sin(uTime * vTwinkle);
    float alpha = (0.3 * glow + 0.7 * core) * vOpacity * tw;

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
// Force Functions (per preset)
// ============================================================================

const architectureForce = (
  p: Particle,
  ctx: ForceContext,
  preset: FieldPreset
): { fx: number; fy: number } => {
  const gridSize = 0.8; // world units
  const nearestX = Math.round(p.x / gridSize) * gridSize;
  const nearestY = Math.round(p.y / gridSize) * gridSize;

  const dx = nearestX - p.x;
  const dy = nearestY - p.y;

  const bias = preset.gridBias || 0.2;
  const lockStrength = ctx.signatureProgress * 0.6; // signature moment locks harder

  return {
    fx: dx * (bias + lockStrength) * 0.001,
    fy: dy * (bias + lockStrength) * 0.001,
  };
};

const shippingForce = (
  p: Particle,
  ctx: ForceContext,
  preset: FieldPreset
): { fx: number; fy: number } => {
  // Vortex around center
  const dx = -p.x;
  const dy = -p.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.1) return { fx: 0, fy: 0 };

  const strength = (preset.vortexStrength || 0.0008) * 0.3;
  const tangentX = -dy / dist;
  const tangentY = dx / dist;

  // Inward spiral
  const radialPull = 0.00001;

  return {
    fx: tangentX * strength + (dx / dist) * radialPull,
    fy: tangentY * strength + (dy / dist) * radialPull,
  };
};

const aiForce = (
  p: Particle,
  ctx: ForceContext,
  preset: FieldPreset,
  clusterCenters: Array<{ x: number; y: number }>
): { fx: number; fy: number } => {
  if (p.clusterId === undefined || !clusterCenters[p.clusterId]) {
    return { fx: 0, fy: 0 };
  }

  // Determine target cluster (current or transitioning to next)
  const targetId =
    p.nextClusterId !== undefined ? p.nextClusterId : p.clusterId;
  const targetCenter = clusterCenters[targetId];

  if (!targetCenter) return { fx: 0, fy: 0 };

  const dx = targetCenter.x - p.x;
  const dy = targetCenter.y - p.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.01) return { fx: 0, fy: 0 };

  // Base attraction strength
  const baseStrength = 0.0012;

  // Wave modulation for curved paths
  const wavePhase = p.pathWavePhase || 0;
  const waveFreq = 1.8;
  const waveAmp = 0.4;

  // Perpendicular direction for wave motion
  const perpX = -dy / dist;
  const perpY = dx / dist;

  // Wave offset varies with distance to create flowing curves
  const waveOffset =
    Math.sin(ctx.time * waveFreq + wavePhase + dist * 2.0) * waveAmp;

  // Combine direct attraction with wave motion
  const directionalX = (dx / dist) * baseStrength;
  const directionalY = (dy / dist) * baseStrength;

  const waveX = perpX * waveOffset * 0.0008;
  const waveY = perpY * waveOffset * 0.0008;

  // Add distance-based modulation (faster when far, slower when near)
  const distModulation = Math.min(1.0, dist / 3.0);

  return {
    fx: (directionalX + waveX) * (0.5 + distModulation),
    fy: (directionalY + waveY) * (0.5 + distModulation),
  };
};

const reactivityForce = (
  p: Particle,
  ctx: ForceContext,
  preset: FieldPreset
): { fx: number; fy: number } => {
  // Curl noise flow field
  const scale = 0.4;
  const t = ctx.time * 0.3;

  const nx = p.x * scale + t;
  const ny = p.y * scale;

  // Simple curl noise approximation
  const curl = Math.sin(nx) * Math.cos(ny) - Math.cos(nx) * Math.sin(ny);

  const strength = preset.flowStrength || 0.001;

  // Center-attracting force to pull particles through visible area
  const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y);
  const centerPull = 0.00015; // gentle radial inward force

  let centerX = 0;
  let centerY = 0;

  if (distFromCenter > 0.1) {
    // Normalize and apply inward pull (stronger at edges, weaker near center)
    const pullStrength = Math.min(1.0, distFromCenter / 4.0); // scale with distance
    centerX = -(p.x / distFromCenter) * centerPull * pullStrength;
    centerY = -(p.y / distFromCenter) * centerPull * pullStrength;
  }

  // Mouse wake
  const dmx = p.x - ctx.mouseX;
  const dmy = p.y - ctx.mouseY;
  const dm = Math.sqrt(dmx * dmx + dmy * dmy);

  let wakeX = 0;
  let wakeY = 0;

  if (dm < 2.0) {
    const t = 1 - dm / 2.0;
    wakeX = (dmx / dm) * t * 0.003;
    wakeY = (dmy / dm) * t * 0.003;
  }

  return {
    fx: -Math.sin(ny + curl) * strength + wakeX + centerX,
    fy: Math.cos(nx + curl) * strength + wakeY + centerY,
  };
};

interface ParticleSimulationProps {
  activePresetIndex?: number; // -1 = default preset, 0-3 = philosophy presets
}

function ParticleSimulation({
  activePresetIndex = -1,
}: ParticleSimulationProps) {
  const { viewport } = useThree();

  const mouseRef = useRef({ x: 0, y: 0 });
  const isInHeroRef = useRef(true);
  const frameCountRef = useRef(0);
  const qualityRef = useRef(getQualitySettings());

  // Preset state
  const presetNames: PresetName[] = [
    "architecture",
    "shipping",
    "ai",
    "reactivity",
  ];
  const currentPresetName =
    activePresetIndex >= 0 && activePresetIndex < presetNames.length
      ? presetNames[activePresetIndex]
      : "default";
  const currentPreset = PRESETS[currentPresetName];

  const prevPresetRef = useRef(currentPreset);
  const transitionStartRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Signature moment tracking
  const signatureStartRef = useRef(0);
  const signatureProgressRef = useRef(0);

  // Cluster centers for AI preset - initialize with 6 clusters in circular pattern
  const clusterCentersRef = useRef<Array<{ x: number; y: number }>>([
    { x: 2.5, y: 0 },
    { x: 1.25, y: 2.17 },
    { x: -1.25, y: 2.17 },
    { x: -2.5, y: 0 },
    { x: -1.25, y: -2.17 },
    { x: 1.25, y: -2.17 },
  ]);

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

    const particles: Particle[] = new Array(max).fill(null).map((_, i) => {
      const r = Math.random();
      const size =
        r < 0.85 ? Math.random() * 1.1 + 0.6 : Math.random() * 2.2 + 2.0;

      const initialCluster = i % 6; // distribute across 6 clusters
      return {
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.0016,
        vy: (Math.random() - 0.5) * 0.0016,
        size,
        opacity: Math.random() * 0.45 + 0.15,
        twinkleSpeed: Math.random() * 1.6 + 0.5,
        clusterId: initialCluster,
        nextClusterId: undefined,
        clusterTransitionTime: Date.now() + Math.random() * 3000 + 2000, // random 2-5s
        pathWavePhase: Math.random() * Math.PI * 2,
        flowPhase: Math.random() * Math.PI * 2,
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
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );
    lineGeometry.setAttribute(
      "aOpacity",
      new THREE.BufferAttribute(lineOpacities, 1)
    );
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

    const pts = stratifiedPositions(
      particles.length,
      viewport.width,
      viewport.height
    );
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
      const worldY = -(
        (e.clientY / window.innerHeight - 0.5) *
        viewport.height
      );
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

  // Preset change detection + transition triggering + re-scattering
  useEffect(() => {
    if (currentPreset.name !== prevPresetRef.current.name) {
      setIsTransitioning(true);
      transitionStartRef.current = performance.now();
      signatureStartRef.current = performance.now();

      const prevPresetName = prevPresetRef.current.name;
      prevPresetRef.current = currentPreset;

      // Re-scatter particles when transitioning to/from default or between major presets
      // This prevents clustering buildup
      const isLeavingDefault = prevPresetName === "default";
      const isEnteringDefault = currentPreset.name === "default";

      if (isLeavingDefault || isEnteringDefault) {
        // Gentle re-scatter: add random displacement to break up clusters
        const scatterStrength = 0.6;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * scatterStrength;
          p.vx += Math.cos(angle) * dist * 0.01;
          p.vy += Math.sin(angle) * dist * 0.01;
        }
      }

      // Explosive rescatter when transitioning from AI to shipping
      if (prevPresetName === "ai" && currentPreset.name === "shipping") {
        // Generate new stratified positions for smooth redistribution
        const newPositions = stratifiedPositions(
          particles.length,
          viewport.width,
          viewport.height
        );

        // Apply scatter force towards new positions
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const target = newPositions[i];

          // Calculate direction to new position
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.1) {
            // Add explosive velocity with randomization for natural scatter
            const scatterForce = 0.09 + Math.random() * 0.01;
            const explosionAngle =
              Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;

            p.vx = Math.cos(explosionAngle) * scatterForce;
            p.vy = Math.sin(explosionAngle) * scatterForce;
          }
        }
      }

      // Trigger cluster reorganization for AI preset
      if (currentPreset.name === "ai") {
        const count = currentPreset.clusterCount || 6;
        const newCenters: Array<{ x: number; y: number }> = [];
        const baseRadius = 2.5;
        const radiusVariation = 0.3;

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
          const radius = baseRadius + (Math.random() - 0.5) * radiusVariation;
          newCenters.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }
        clusterCentersRef.current = newCenters;

        // Reset all particles' cluster transition timers
        for (let i = 0; i < particles.length; i++) {
          particles[i].clusterTransitionTime =
            Date.now() + Math.random() * 3000 + 2000;
        }
      }
    }
  }, [currentPreset, particles, viewport.width, viewport.height]);

  // resize: update pixel ratio
  useEffect(() => {
    const onResize = () => {
      material.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio || 1,
        1.5
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [material]);

  useFrame((state) => {
    const frameStart = performance.now();
    if (document.hidden) return;

    frameCountRef.current++;
    const frame = frameCountRef.current;

    const now = performance.now();

    // Transition progress (for parameter interpolation)
    const transitionDuration = 1200;
    let transitionT = 0;
    if (isTransitioning) {
      const elapsed = now - transitionStartRef.current;
      transitionT = Math.min(1, elapsed / transitionDuration);
      if (transitionT >= 1) {
        setIsTransitioning(false);
      }
    }

    // Signature progress (for the "signature moment" boost)
    const sigElapsed = now - signatureStartRef.current;
    const sigDuration = currentPreset.signatureDuration;
    signatureProgressRef.current = Math.max(
      0,
      Math.min(1, sigElapsed / sigDuration)
    );

    // Smoothstep for nicer transitions
    const smoothT = transitionT * transitionT * (3 - 2 * transitionT);

    // allow external quality updates later (kept minimal: only updates connection distance behavior)
    const settings = getExternalQualitySettings() || qualityRef.current;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Interpolate preset parameters during transition
    const effectiveDamping = currentPreset.damping;
    const effectiveDrift = currentPreset.drift;
    const effectiveConnDistMult = currentPreset.connectionDistance;

    // world distance equivalent for the px-based threshold
    const baseConnDist =
      (settings.connectionDistance / window.innerWidth) * viewport.width * 2;
    const worldConnDist = baseConnDist * effectiveConnDistMult;

    // Build force context
    const ctx: ForceContext = {
      mouseX: mouseRef.current.x,
      mouseY: mouseRef.current.y,
      time: state.clock.elapsedTime,
      signatureProgress: signatureProgressRef.current,
      vw: viewport.width,
      vh: viewport.height,
    };

    // Cursor interaction strength (reduce during pre-transition + apply preset mouseStrength)
    const preTransitionMod = isTransitioning && transitionT < 0.15 ? 0.3 : 1.0;
    const presetMouseMod = currentPreset.mouseStrength ?? 1.0;
    const cursorStrength = preTransitionMod * presetMouseMod;

    // mouse pull (baseline interaction)
    const maxMouseDist = 1.4;
    const basePull = 0.0016;
    const pull = basePull * cursorStrength;

    // Spatial hashing for minimum distance enforcement (prevents pile-ups)
    const minDist = 0.28; // minimum distance between particles
    const minDist2 = minDist * minDist;
    const cellSize = minDist; // grid cell size

    const grid = new Map<string, number[]>();
    const keyOf = (x: number, y: number) => {
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      return `${cx},${cy}`;
    };

    // Build spatial hash grid
    for (let i = 0; i < particles.length; i++) {
      const k = keyOf(particles[i].x, particles[i].y);
      const bucket = grid.get(k);
      if (bucket) bucket.push(i);
      else grid.set(k, [i]);
    }

    // update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse interaction (baseline, modulated by preset)
      const dxm = mouseRef.current.x - p.x;
      const dym = mouseRef.current.y - p.y;
      const dm = Math.sqrt(dxm * dxm + dym * dym);

      if (isInHeroRef.current && dm < maxMouseDist && cursorStrength > 0) {
        const t = 1 - dm / maxMouseDist;
        const g = pull * t * t;
        p.vx += dxm * g;
        p.vy += dym * g;
        p.opacity = Math.min(1, p.opacity + 0.02 * t * cursorStrength);
      } else {
        // small relaxation back
        p.opacity = Math.max(0.12, p.opacity * 0.995);
      }

      // Apply minimum distance enforcement using spatial hash
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);

      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(`${gx},${gy}`);
          if (!bucket) continue;

          for (const j of bucket) {
            if (j === i) continue;
            const p2 = particles[j];

            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= 0 || d2 > minDist2) continue;

            const d = Math.sqrt(d2);
            const t = (minDist - d) / minDist; // 0..1
            const push = 0.00025 * t; // repulsion strength

            p.vx += (dx / d) * push;
            p.vy += (dy / d) * push;
          }
        }
      }

      // Apply preset-specific forces
      let fx = 0;
      let fy = 0;

      // Debug: log force application every 120 frames for first particle
      if (i === 0 && frame % 120 === 0) {
        console.log(
          `🎯 Frame ${frame} - Applying forces for preset: "${currentPreset.name}"`
        );
      }

      if (currentPreset.name === "architecture") {
        const f = architectureForce(p, ctx, currentPreset);
        fx = f.fx;
        fy = f.fy;
      } else if (currentPreset.name === "shipping") {
        const f = shippingForce(p, ctx, currentPreset);
        fx = f.fx;
        fy = f.fy;
      } else if (currentPreset.name === "ai") {
        // Handle cluster transitions
        const currentTime = Date.now();
        if (p.clusterTransitionTime && currentTime >= p.clusterTransitionTime) {
          // Time to transition to a new cluster
          const clusterCount = currentPreset.clusterCount || 6;
          const currentCluster = p.clusterId || 0;

          // Pick adjacent cluster (creates flowing pattern)
          const direction = Math.random() > 0.5 ? 1 : -1;
          p.nextClusterId =
            (currentCluster + direction + clusterCount) % clusterCount;

          // After reaching next cluster, make it the current and pick a new target
          const dx = clusterCentersRef.current[p.nextClusterId].x - p.x;
          const dy = clusterCentersRef.current[p.nextClusterId].y - p.y;
          const distToNext = Math.sqrt(dx * dx + dy * dy);

          // If close enough to next cluster, switch
          if (distToNext < 0.8) {
            p.clusterId = p.nextClusterId;
            p.nextClusterId = undefined;
            // Set next transition time (2-6 seconds)
            p.clusterTransitionTime = currentTime + Math.random() * 4000 + 2000;
          }
        }

        const f = aiForce(p, ctx, currentPreset, clusterCentersRef.current);
        fx = f.fx;
        fy = f.fy;
      } else if (currentPreset.name === "reactivity") {
        const f = reactivityForce(p, ctx, currentPreset);
        fx = f.fx;
        fy = f.fy;
      }

      // Apply forces
      p.vx += fx;
      p.vy += fy;

      // gentle baseline drift
      p.vx += (Math.random() - 0.5) * effectiveDrift;
      p.vy += (Math.random() - 0.5) * effectiveDrift;

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= effectiveDamping;
      p.vy *= effectiveDamping;

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

    // lines (connection graph with preset-specific rules)
    if (frame % settings.skipConnectionFrames === 0) {
      let li = 0;
      const maxPerParticle = currentPreset.maxEdgesPerPoint;

      // For AI preset: intra-cluster vs inter-cluster logic
      const isAIPreset = currentPreset.name === "ai";

      for (let i = 0; i < particles.length && li < maxLineVerts; i++) {
        const p1 = particles[i];
        let made = 0;

        for (
          let j = i + 1;
          j < particles.length && made < maxPerParticle && li < maxLineVerts;
          j++
        ) {
          const p2 = particles[j];

          // AI preset: prefer intra-cluster connections
          if (isAIPreset && p1.clusterId !== p2.clusterId) {
            // Rare inter-cluster connection during signature moment
            if (Math.random() > signatureProgressRef.current * 0.15) continue;
          }

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > worldConnDist * worldConnDist) continue;

          const d = Math.sqrt(d2);
          let baseAlpha =
            0.22 * (1 - d / worldConnDist) * Math.min(p1.opacity, p2.opacity);

          // Boost line visibility with clamping to prevent bloom
          baseAlpha = Math.min(0.22, baseAlpha * 1.1);

          // Shipping preset: brighten connections during signature loop-close
          if (
            currentPreset.name === "shipping" &&
            signatureProgressRef.current > 0.3
          ) {
            const boost = signatureProgressRef.current * 0.08;
            baseAlpha = Math.min(0.28, baseAlpha + boost);
          }

          linePositions[li * 3 + 0] = p1.x;
          linePositions[li * 3 + 1] = p1.y;
          linePositions[li * 3 + 2] = 0;
          lineOpacities[li] = baseAlpha;
          li++;

          if (li >= maxLineVerts) break;

          linePositions[li * 3 + 0] = p2.x;
          linePositions[li * 3 + 1] = p2.y;
          linePositions[li * 3 + 2] = 0;
          lineOpacities[li] = baseAlpha;
          li++;

          made++;
        }
      }

      lineGeometry.setDrawRange(0, li);
      (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate =
        true;
      (lineGeometry.attributes.aOpacity as THREE.BufferAttribute).needsUpdate =
        true;
    }

    if (frame % 60 === 0) {
      const duration = performance.now() - frameStart;
      reportPerformance("ParticleField3D", duration);
    }
  });

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <lineSegments
        geometry={lineGeometry}
        material={lineMaterial}
        frustumCulled={false}
      />
    </>
  );
}

// ============================================================================
// Export
// ============================================================================

interface ParticleField3DCanvasProps {
  activePresetIndex?: number; // -1 = default, 0-3 = philosophy presets
}

function ParticleField3DCanvas({
  activePresetIndex = -1,
}: ParticleField3DCanvasProps) {
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
      <ParticleSimulation activePresetIndex={activePresetIndex} />
    </Canvas>
  );
}

export const ParticleField3D = ({
  activePresetIndex = -1,
}: ParticleField3DCanvasProps) => (
  <ParticleField3DCanvas activePresetIndex={activePresetIndex} />
);

// Re-export quality setter for convenience
export { setParticleField3DQuality } from "./particle-quality";

export default ParticleField3D;
