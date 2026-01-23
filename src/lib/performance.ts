/**
 * Performance utilities for monitoring and optimizing the portfolio site
 *
 * QUALITY SETTINGS SYSTEM:
 * - Automatically detects device tier (low/mid/high-end)
 * - Configures particle field parameters for optimal FPS
 * - See QUALITY_SETTINGS.md for detailed explanation of all parameters
 *
 * DEV CONTROLS (console):
 *   window.particleQuality.preset('ultra'|'high'|'medium'|'low'|'minimal')
 *   window.particleQuality.set({ densityFactor: 0.8, connectionDistance: 120 })
 *   window.particleQuality.set(null)  // Reset to auto-detect
 */

export interface QualitySettings {
  maxParticles: number; // GPU buffer size (70-400)
  connectionDistance: number; // Max connection line distance in pixels (90-180)
  densityFactor: number; // Active particle multiplier 0.0-1.0 (activeCount = max * factor)
  skipConnectionFrames: number; // Connection update throttle (1-4 frames)
  dpr: number; // Canvas devicePixelRatio (1.0-2.0)
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  longTasks: number; // count of >50ms tasks in last second
  droppedFrames: number; // count in last second
  components: Map<string, ComponentMetrics>;
  memory?: MemoryMetrics;
  cpuLoad?: number; // estimated 0-1
}

export interface ComponentMetrics {
  name: string;
  avgTime: number; // ms
  maxTime: number; // ms
  minTime: number; // ms
  callCount: number;
  p95Time: number; // 95th percentile
  lastUpdate: number;
  samples: number[]; // last 100 samples for percentile calc
  severity: "low" | "medium" | "high" | "critical";
}

export interface MemoryMetrics {
  usedJSHeapSize: number; // bytes
  totalJSHeapSize: number; // bytes
  jsHeapSizeLimit: number; // bytes
  usedPercent: number;
}

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Device Quality Tier Detection
 * Classifies devices into low/mid/high-end based on hardware capabilities
 *
 * LOW-END:
 *   - < 4GB RAM OR < 4 CPU cores
 *   - Budget laptops, older phones/tablets
 *   - Prioritizes frame rate over visual fidelity
 *
 * MID-RANGE:
 *   - 4-7GB RAM, 4-7 cores
 *   - Modern mid-tier devices, tablets
 *   - Balanced performance/quality
 *
 * HIGH-END:
 *   - ≥ 8GB RAM AND ≥ 8 cores
 *   - High-performance laptops, desktops, flagship phones
 *   - Maximum visual quality
 *
 * MOBILE/TABLET (sub-tier):
 *   - < 768px width (regardless of specs)
 *   - Reduced particle density due to touch interaction overhead
 */
export const getDeviceQualityTier = (): "low" | "medium" | "high" => {
  // @ts-expect-error - experimental API (Chrome/Edge only)
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;
  const width = window.innerWidth;

  // Low-end detection: insufficient RAM or CPU
  if (memory && memory < 4) return "low";
  if (cores < 4) return "low";

  // Mobile/tablet detection (caps at medium tier for touch performance)
  if (width < 768) return "medium";

  // High-end: powerful devices with ample resources
  if (memory && memory >= 8 && cores >= 8) return "high";

  // Default: mid-range
  return "medium";
};

// Get optimal devicePixelRatio based on device
export const getOptimalDPR = (): number => {
  const baseDpr = window.devicePixelRatio || 1;
  const tier = getDeviceQualityTier();

  switch (tier) {
    case "low":
      return Math.min(baseDpr, 1);
    case "medium":
      return Math.min(baseDpr, 1.5);
    case "high":
      return Math.min(baseDpr, 2);
    default:
      return Math.min(baseDpr, 1.5);
  }
};

/**
 * Unified Quality Settings Computation
 * Returns optimal particle field settings based on detected device tier
 *
 * KEY PARAMETERS EXPLAINED:
 *
 * maxParticles:
 *   - Maximum particle count allocated in GPU buffer
 *   - Higher = denser field, but more memory/CPU overhead
 *   - CANNOT be changed at runtime without re-initializing buffers
 *
 * densityFactor (0.0 - 1.0+):
 *   - Multiplier for active particle count: activeParticles = maxParticles * densityFactor
 *   - Example: maxParticles=300, densityFactor=0.8 → 240 particles actually rendered
 *   - Allows runtime quality adjustment without buffer reallocation
 *   - < 1.0 reduces particle count for performance headroom
 *   - = 1.0 uses full particle budget
 *   - Values >1.0 are clamped to 1.0
 *
 * connectionDistance (pixels):
 *   - Maximum distance (in screen space) for drawing connection lines
 *   - Higher = more connections, denser web effect, but O(n²) cost increases
 *   - Typical range: 90-180px
 *   - Heavily impacts performance (connection computation is most expensive operation)
 *
 * skipConnectionFrames:
 *   - Connection line update throttle (every N frames)
 *   - 1 = update every frame (smoothest, most expensive)
 *   - 2 = update every other frame (good balance)
 *   - 3+ = update every 3rd+ frame (choppy connections, best performance)
 *   - Particle movement still smooth regardless of this setting
 */
export const getQualitySettings = (): QualitySettings => {
  const tier = getDeviceQualityTier();
  const width = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;

  // Accessibility override: minimal particles for reduced motion preference
  if (prefersReducedMotion()) {
    return {
      maxParticles: 70,
      densityFactor: 0.5,
      connectionDistance: 90,
      skipConnectionFrames: 4,
      dpr: 1,
    };
  }

  // Mobile/Tablet tier (< 768px width)
  const isMobile = width < 768;

  // ========================================================================
  // LOW-END TIER: < 4GB RAM or < 4 cores
  // Target: Maintain 30+ FPS, prioritize responsiveness
  // ========================================================================
  if (tier === "low") {
    return {
      maxParticles: 150, // Minimal particle budget
      densityFactor: 0.75, // 112 active particles
      connectionDistance: 110, // Short connections to reduce O(n²) cost
      skipConnectionFrames: 3, // Update connections every 3rd frame
      dpr: 1, // Force 1x resolution
    };
  }

  // ========================================================================
  // MID-RANGE TIER (default): 4-7GB RAM, 4-7 cores, or mobile devices
  // Target: 45+ FPS, balanced quality/performance
  // ========================================================================
  if (tier === "medium" || isMobile) {
    return {
      maxParticles: isMobile ? 250 : 280,
      densityFactor: isMobile ? 0.85 : 0.9, // 212-252 active particles
      connectionDistance: isMobile ? 120 : 140,
      skipConnectionFrames: 2, // Update every other frame
      dpr: getOptimalDPR(),
    };
  }

  // ========================================================================
  // HIGH-END TIER: ≥ 8GB RAM AND ≥ 8 cores
  // Target: 60 FPS, maximum visual quality
  // ========================================================================
  return {
    maxParticles: 400, // Large particle budget
    densityFactor: 1.0, // Full 400 particles
    connectionDistance: 160, // Longer connections for denser web
    skipConnectionFrames: cores >= 12 ? 1 : 2, // Every frame on high-core CPUs
    dpr: getOptimalDPR(),
  };
};

// Monitor FPS and log warnings if performance is poor
export class PerformanceMonitor {
  private frames: number[] = [];
  private frameTimes: number[] = [];
  private lastTime = performance.now();
  private rafId: number | null = null;
  private onLowFPS?: (fps: number) => void;
  private longTaskCount = 0;
  private droppedFrameCount = 0;
  private lastResetTime = Date.now();

  constructor(onLowFPS?: (fps: number) => void) {
    this.onLowFPS = onLowFPS;
  }

  start() {
    const tick = (now: number) => {
      const delta = now - this.lastTime;
      this.lastTime = now;

      const fps = 1000 / delta;
      this.frames.push(fps);
      this.frameTimes.push(delta);

      // Track long frames (>50ms = 20fps)
      if (delta > 50) {
        this.longTaskCount++;
      }

      // Track dropped frames (>33ms = <30fps)
      if (delta > 33.33) {
        this.droppedFrameCount++;
      }

      // Keep last 60 frames
      if (this.frames.length > 60) {
        this.frames.shift();
        this.frameTimes.shift();
      }

      // Reset counters every second
      const now_ms = Date.now();
      if (now_ms - this.lastResetTime >= 1000) {
        this.lastResetTime = now_ms;
        this.longTaskCount = 0;
        this.droppedFrameCount = 0;
      }

      // Check average FPS every second
      if (this.frames.length === 60) {
        const avgFps = this.frames.reduce((a, b) => a + b) / this.frames.length;
        if (avgFps < 30 && this.onLowFPS) {
          this.onLowFPS(avgFps);
        }
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;
    return this.frames.reduce((a, b) => a + b) / this.frames.length;
  }

  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 16.67;
    return this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
  }

  getLongTaskCount(): number {
    return this.longTaskCount;
  }

  getDroppedFrameCount(): number {
    return this.droppedFrameCount;
  }

  getMemoryMetrics(): MemoryMetrics | undefined {
    // @ts-expect-error - Chrome-only API
    const memory = performance.memory;
    if (!memory) return undefined;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  // Estimate CPU load from frame timing variance
  getCPULoad(): number {
    if (this.frameTimes.length < 10) return 0;

    const avg = this.getAverageFrameTime();
    const variance =
      this.frameTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) /
      this.frameTimes.length;
    const stdDev = Math.sqrt(variance);

    // High variance = high load (normalize to 0-1)
    return Math.min(1, stdDev / 20);
  }
}