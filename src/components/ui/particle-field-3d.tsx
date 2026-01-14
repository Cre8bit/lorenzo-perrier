import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { reportFramePerformance } from "./performance-overlay";
import {
  getExternalQualitySettings,
  resolveRuntimeQuality,
} from "./particle-quality";
import { type QualitySettings } from "@/lib/performance";
import { useQualitySettingsState } from "@/hooks/use-quality-settings";
import { useParticleField } from "@/contexts/useParticleField";

// Helper: Get clamped pixel ratio for sprite sizing (independent of Canvas DPR)
const getPixelRatioUniform = () => Math.min(window.devicePixelRatio || 1, 1.5);

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
    vortexStrength: 0.00045,
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
    flowStrength: 0.0004,
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
// Helper: Deterministic hash for hot loop randomness (faster than Math.random)
// ============================================================================

const hash01 = (a: number) => {
  const x = Math.sin(a * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

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
  precision mediump float;
  varying float vOpacity;
  varying float vTwinkle;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float d = length(uv) * 2.0;

    float glow = smoothstep(1.0, 0.0, d);
    float core = smoothstep(0.35, 0.0, d);

    float tw = 0.58 + 0.12 * sin(uTime * vTwinkle);
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
  precision mediump float;
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

  if (dm > 1e-6 && dm < 2.0) {
    // guard against divide-by-zero
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
  baseQuality: QualitySettings;
}

function ParticleSimulation({
  activePresetIndex = -1,
  baseQuality,
}: ParticleSimulationProps) {
  const { viewport } = useThree();

  const mouseRef = useRef({ x: 0, y: 0 });
  const isInHeroRef = useRef(true);
  const frameCountRef = useRef(0);

  // Optimized spatial hash: numeric keys + bucket pooling
  const spatialGridRef = useRef(new Map<number, number[]>());
  const bucketPoolRef = useRef<number[][]>([]);

  // Separate spatial grid for connection line building
  const connectionGridRef = useRef(new Map<number, number[]>());
  const connectionBucketPoolRef = useRef<number[][]>([]);

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
    const max = baseQuality.maxParticles;

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

    // Initialize static attributes (sizes, twinkles) once - never updated again
    for (let i = 0; i < max; i++) {
      sizes[i] = particles[i].size * 8.0;
      twinkles[i] = particles[i].twinkleSpeed;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkles, 1));

    // Set dynamic usage hints for frequently updated buffers
    (geometry.attributes.position as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );
    (geometry.attributes.aOpacity as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: getPixelRatioUniform() },
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

    // Set dynamic usage hints for frequently updated buffers
    (lineGeometry.attributes.position as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );
    (lineGeometry.attributes.aOpacity as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );

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
  }, [baseQuality.maxParticles]);

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

  // Update uPixelRatio uniform when viewport changes (tracks real DPR, not Canvas DPR)
  useEffect(() => {
    const updatePixelRatio = () => {
      material.uniforms.uPixelRatio.value = getPixelRatioUniform();
    };

    window.addEventListener("resize", updatePixelRatio);
    window.visualViewport?.addEventListener("resize", updatePixelRatio);

    return () => {
      window.removeEventListener("resize", updatePixelRatio);
      window.visualViewport?.removeEventListener("resize", updatePixelRatio);
    };
  }, [material]);

  // Dispose GPU resources on unmount to prevent VRAM leaks
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [geometry, material, lineGeometry, lineMaterial]);

  useFrame((state) => {
    const frameStart = performance.now();
    if (document.hidden) return;

    frameCountRef.current++;
    const frame = frameCountRef.current;

    const now = performance.now();

    // Transition progress tracking
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
    signatureProgressRef.current =
      sigDuration > 0 ? Math.min(1, sigElapsed / sigDuration) : 0;

    // Resolve runtime quality: base + external overrides (with safe clamping)
    const settings = resolveRuntimeQuality(
      baseQuality,
      getExternalQualitySettings()
    );

    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Preset parameters
    const effectiveDamping = currentPreset.damping;
    const effectiveDrift = currentPreset.drift;
    const effectiveConnDistMult = currentPreset.connectionDistance;

    // Convert px-based connection distance to world space
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
    const maxMouseDist2 = maxMouseDist * maxMouseDist; // squared distance for cheaper check
    const basePull = 0.0016;
    const pull = basePull * cursorStrength;

    // Spatial hashing for minimum distance enforcement (prevents pile-ups)
    const minDist = 0.28; // minimum distance between particles
    const minDist2 = minDist * minDist;
    const cellSize = minDist; // grid cell size

    // Numeric key hash (avoids string allocations)
    const keyOf = (cx: number, cy: number) => (cx << 16) ^ (cy & 0xffff);

    // Calculate active particle count based on densityFactor
    const activeCount = Math.max(
      1,
      Math.floor(baseQuality.maxParticles * settings.densityFactor)
    );

    // Reuse spatial grid and bucket arrays
    const grid = spatialGridRef.current;
    const pool = bucketPoolRef.current;

    // Return previous buckets to pool
    for (const arr of grid.values()) {
      arr.length = 0;
      pool.push(arr);
    }
    grid.clear();

    // Build spatial hash grid (only for active particles)
    for (let i = 0; i < activeCount; i++) {
      const cx = Math.floor(particles[i].x / cellSize);
      const cy = Math.floor(particles[i].y / cellSize);
      const k = keyOf(cx, cy);

      let bucket = grid.get(k);
      if (!bucket) {
        bucket = pool.pop() ?? [];
        grid.set(k, bucket);
      }
      bucket.push(i);
    }

    // Deterministic noise constants (replace Math.random drift)
    const noiseTimeScale = state.clock.elapsedTime * 0.3;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];

      // Mouse interaction (baseline, modulated by preset)
      const dxm = mouseRef.current.x - p.x;
      const dym = mouseRef.current.y - p.y;
      const dm2 = dxm * dxm + dym * dym; // squared distance - cheaper than sqrt

      if (isInHeroRef.current && dm2 < maxMouseDist2 && cursorStrength > 0) {
        const dm = Math.sqrt(dm2); // only compute sqrt when interaction happens
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
      const MAX_CANDIDATES_PER_CELL = 24; // budget to prevent worst-case crowding

      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const k = keyOf(gx, gy);
          const bucket = grid.get(k);
          if (!bucket) continue;

          let checked = 0;
          for (const j of bucket) {
            if (checked++ > MAX_CANDIDATES_PER_CELL) break;
            if (j === i || j >= activeCount) continue; // skip self and inactive
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

          // Pick adjacent cluster (creates flowing pattern) - deterministic hash
          const rdir = hash01(i * 13.37 + ((currentTime * 0.001) | 0));
          const direction = rdir > 0.5 ? 1 : -1;
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
            // Set next transition time (2-6 seconds) - deterministic hash
            const rt = hash01(i * 91.7 + ((currentTime * 0.001) | 0));
            p.clusterTransitionTime = currentTime + 2000 + rt * 4000;
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

      // Deterministic drift (replaces Math.random for performance)
      const nx = Math.sin(i * 12.9898 + noiseTimeScale * 0.7) * 43758.5453;
      const ny = Math.sin(i * 78.233 + noiseTimeScale * 1.1) * 43758.5453;
      const rx = nx - Math.floor(nx) - 0.5; // -0.5 to 0.5
      const ry = ny - Math.floor(ny) - 0.5;

      p.vx += rx * effectiveDrift;
      p.vy += ry * effectiveDrift;

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

      // buffers (only update dynamic attributes: position, opacity)
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = 0;

      opacities[i] = p.opacity;
    }

    // Update draw range for active particles only (handles inactive particles automatically)
    geometry.setDrawRange(0, activeCount);

    // Only update dynamic attributes (position, opacity) - aSize and aTwinkle are static
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.aOpacity as THREE.BufferAttribute).needsUpdate = true;

    // lines (connection graph with spatial grid optimization - O(N*k) instead of O(N²))
    const skipFramesBase = Math.max(1, settings.skipConnectionFrames | 0);
    const skipFrames = isInHeroRef.current
      ? skipFramesBase
      : skipFramesBase * 3; // adaptive: reduce line updates when not in view
    if (frame % skipFrames === 0) {
      let li = 0;
      const maxPerParticle = currentPreset.maxEdgesPerPoint;

      // For AI preset: intra-cluster vs inter-cluster logic
      const isAIPreset = currentPreset.name === "ai";

      // Build spatial grid for connection search
      const cellSizeConn = worldConnDist * 0.75; // smaller cells = fewer candidates per bucket
      const keyConn = (cx: number, cy: number) => (cx << 16) ^ (cy & 0xffff);

      const gridConn = connectionGridRef.current;
      const poolConn = connectionBucketPoolRef.current;

      // Return previous buckets to pool
      for (const arr of gridConn.values()) {
        arr.length = 0;
        poolConn.push(arr);
      }
      gridConn.clear();

      // Build spatial hash for active particles only
      for (let i = 0; i < activeCount; i++) {
        const cx = Math.floor(particles[i].x / cellSizeConn);
        const cy = Math.floor(particles[i].y / cellSizeConn);
        const k = keyConn(cx, cy);

        let bucket = gridConn.get(k);
        if (!bucket) {
          bucket = poolConn.pop() ?? [];
          gridConn.set(k, bucket);
        }
        bucket.push(i);
      }

      // Build connections using spatial grid (neighbor search only)
      const worldConnDist2 = worldConnDist * worldConnDist;

      for (let i = 0; i < activeCount && li < maxLineVerts; i++) {
        const p1 = particles[i];
        const cx = Math.floor(p1.x / cellSizeConn);
        const cy = Math.floor(p1.y / cellSizeConn);
        let made = 0;

        // Check only neighboring cells (9 cells total)
        const MAX_CANDIDATES_PER_CELL = 24; // budget to prevent worst-case crowding
        for (let gx = cx - 1; gx <= cx + 1 && made < maxPerParticle; gx++) {
          for (let gy = cy - 1; gy <= cy + 1 && made < maxPerParticle; gy++) {
            const bucket = gridConn.get(keyConn(gx, gy));
            if (!bucket) continue;

            let checked = 0;
            for (const j of bucket) {
              if (checked++ > MAX_CANDIDATES_PER_CELL) break;
              if (j <= i) continue; // Avoid duplicates and self
              if (made >= maxPerParticle || li >= maxLineVerts) break;

              const p2 = particles[j];

              // AI preset: prefer intra-cluster connections
              if (isAIPreset && p1.clusterId !== p2.clusterId) {
                // Rare inter-cluster connection during signature moment (deterministic hash)
                const r = hash01(i * 10007 + j * 37 + frame * 0.1);
                if (r > signatureProgressRef.current * 0.15) continue;
              }

              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > worldConnDist2) continue;

              const d = Math.sqrt(d2); // Only compute sqrt after distance check passes
              let baseAlpha =
                0.22 *
                (1 - d / worldConnDist) *
                Math.min(p1.opacity, p2.opacity);

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
        }
      }

      lineGeometry.setDrawRange(0, li);
      (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate =
        true;
      (lineGeometry.attributes.aOpacity as THREE.BufferAttribute).needsUpdate =
        true;
    }

    // Sample performance monitoring less frequently (every 10 frames) to reduce overhead
    if (frame % 10 === 0) {
      reportFramePerformance("ParticleField3D", frameStart);
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
  const quality = useQualitySettingsState();
  const { currentSection, setIsInitialized } = useParticleField();

  // Get external overrides for maxParticles runtime control
  const external = getExternalQualitySettings();
  const effectiveMaxParticles = external?.maxParticles ?? quality.maxParticles;

  const isParticleFieldActive = currentSection !== "experience";

  return (
    <Canvas
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      dpr={quality.dpr}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
      camera={{ position: [0, 0, 5], near: 0.1, far: 100 }}
      frameloop={isParticleFieldActive ? "always" : "demand"}
      onCreated={() => {
        setIsInitialized(true);
      }}
    >
      <ParticleSimulation
        key={effectiveMaxParticles} // Force remount when maxParticles changes
        activePresetIndex={activePresetIndex}
        baseQuality={{ ...quality, maxParticles: effectiveMaxParticles }}
      />
    </Canvas>
  );
}

export const ParticleField3D = ({
  activePresetIndex = -1,
}: ParticleField3DCanvasProps) => (
  <ParticleField3DCanvas activePresetIndex={activePresetIndex} />
);

export default ParticleField3D;
