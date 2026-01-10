/**
 * Performance utilities for monitoring and optimizing the portfolio site
 */

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number; // in px (screen space)
  densityFactor: number;
  skipConnectionFrames: number;
  dpr: number; // devicePixelRatio to use for canvas
}

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Get device quality tier based on hardware capabilities
export const getDeviceQualityTier = (): "low" | "medium" | "high" => {
  // @ts-expect-error - experimental API
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;
  const width = window.innerWidth;

  // Low-end: < 4GB RAM or < 4 cores or mobile
  if (memory && memory < 4) return "low";
  if (cores < 4) return "low";
  if (width < 768) return "medium";

  // High-end: >= 8GB RAM and >= 6 cores
  if (memory && memory >= 8 && cores >= 6) return "high";

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

// Unified quality settings computation
export const getQualitySettings = (): QualitySettings => {
  const width = window.innerWidth;
  const pixelRatio = window.devicePixelRatio || 1;

  // @ts-expect-error experimental
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;

  const isLowPower = memory && memory < 4;
  const isSmallScreen = width < 768;
  const isHighDPI = pixelRatio > 2;

  if (prefersReducedMotion()) {
    return {
      densityFactor: 0.3,
      maxParticles: 70,
      connectionDistance: 90,
      skipConnectionFrames: 4,
      dpr: 1,
    };
  }

  return {
    densityFactor: isSmallScreen ? 0.9 : isLowPower ? 1.0 : 1.3,
    maxParticles: isLowPower ? 240 : isSmallScreen ? 320 : 560,
    connectionDistance: isLowPower ? 120 : 140,
    skipConnectionFrames: isLowPower || cores < 4 || isHighDPI ? 2 : 1,
    dpr: getOptimalDPR(),
  };
};

// Monitor FPS and log warnings if performance is poor
export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private rafId: number | null = null;
  private onLowFPS?: (fps: number) => void;

  constructor(onLowFPS?: (fps: number) => void) {
    this.onLowFPS = onLowFPS;
  }

  start() {
    const tick = (now: number) => {
      const delta = now - this.lastTime;
      this.lastTime = now;

      this.frames.push(1000 / delta);
      if (this.frames.length > 60) {
        this.frames.shift();
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
}

// Throttle function with requestAnimationFrame
export const throttleRAF = <T extends (...args: never[]) => void>(
  callback: T
): ((...args: Parameters<T>) => void) => {
  let scheduled = false;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      callback(...lastArgs);
    });
  };
};

// Debounce function
export const debounce = <T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

// Log performance marks (useful for debugging)
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  if (duration > 16.67) {
    // More than one frame (60fps)
    console.warn(
      `Performance: ${name} took ${duration.toFixed(2)}ms (> 16.67ms)`
    );
  }
};
