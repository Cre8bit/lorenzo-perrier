/**
 * Animation and math utilities
 */

// Clamp value between 0 and 1
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// Smooth interpolation (Hermite)
export function smoothstep(t: number): number {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp index for circular arrays (handles negative wrap)
export function clampIndex(i: number, len: number): number {
  return (i + len) % len;
}

/**
 * Creates a throttled version of a callback using requestAnimationFrame
 * Ensures callback runs at most once per frame
 */
export function throttleRAF(callback: () => void): () => void {
  let scheduled = false;

  return () => {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      callback();
    });
  };
}
