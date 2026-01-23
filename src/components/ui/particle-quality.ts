import type { QualitySettings } from "@/lib/performance";

/**
 * External Quality Override System
 *
 * Allows runtime modification of particle field quality settings.
 * Primary use case: Development environment quality testing and profiling.
 *
 * RUNTIME-SAFE PARAMETERS (can change without remounting):
 *   - connectionDistance (px): Line connection radius
 *   - skipConnectionFrames (int): Connection update throttle
 *   - densityFactor (0.0-1.0): Particle count multiplier
 *
 * BUFFER-LOCKED PARAMETERS (require component remount):
 *   - maxParticles: GPU buffer size is fixed at initialization
 *   - dpr: Canvas pixel ratio is managed by Canvas component
 *
 * USAGE (Browser Console):
 *   // Import the setter function
 *   import { setParticleField3DQuality } from '@/components/ui/particle-quality';
 *
 *   // Test low-end performance
 *   setParticleField3DQuality({ densityFactor: 0.5, connectionDistance: 90, skipConnectionFrames: 3 });
 *
 *   // Test high-end settings
 *   setParticleField3DQuality({ densityFactor: 1.0, connectionDistance: 180, skipConnectionFrames: 1 });
 *
 *   // Reset to auto-detected settings
 *   setParticleField3DQuality(null);
 */
let externalQualitySettings: Partial<QualitySettings> | null = null;

/**
 * Development Environment Quality Presets
 * Quick access to common testing scenarios
 */
export const DEV_QUALITY_PRESETS = {
  ultra: {
    densityFactor: 1.0,
    connectionDistance: 180,
    skipConnectionFrames: 1,
  },
  high: {
    densityFactor: 1.0,
    connectionDistance: 160,
    skipConnectionFrames: 2,
  },
  medium: {
    densityFactor: 0.9,
    connectionDistance: 140,
    skipConnectionFrames: 2,
  },
  low: {
    densityFactor: 0.75,
    connectionDistance: 110,
    skipConnectionFrames: 3,
  },
  minimal: {
    densityFactor: 0.5,
    connectionDistance: 90,
    skipConnectionFrames: 4,
  },
} as const;

/**
 * Set custom quality overrides (merges with auto-detected settings)
 * Pass null to reset to automatic device-based settings
 */
export const setParticleField3DQuality = (
  settings: Partial<QualitySettings> | null,
) => {
  externalQualitySettings = settings;

  // Log to console in dev mode for visibility
  if (import.meta.env.DEV) {
    if (settings === null) {
      console.log("[ParticleField] Quality reset to auto-detect");
    } else {
      console.log("[ParticleField] Quality override:", settings);
    }
  }
};

/**
 * Get current external quality overrides (null if auto-detecting)
 */
export const getExternalQualitySettings = () => externalQualitySettings;

/**
 * Apply a dev quality preset by name
 * Only available in development mode
 */
export const applyDevPreset = (
  presetName: keyof typeof DEV_QUALITY_PRESETS,
) => {
  if (!import.meta.env.DEV) {
    console.warn(
      "[ParticleField] Dev presets only available in development mode",
    );
    return;
  }

  const preset = DEV_QUALITY_PRESETS[presetName];
  setParticleField3DQuality(preset);
};

// Expose to window for easy console access in dev mode
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).particleQuality = {
    set: setParticleField3DQuality,
    preset: applyDevPreset,
    presets: DEV_QUALITY_PRESETS,
    current: getExternalQualitySettings,
  };
}

/**
 * Merge external quality overrides with base settings.
 * Locks maxParticles and dpr to prevent runtime buffer changes.
 * Clamps values to safe ranges.
 */
export function resolveRuntimeQuality(
  base: QualitySettings,
  external: Partial<QualitySettings> | null,
): QualitySettings {
  if (!external) return base;

  return {
    ...base,
    connectionDistance: Math.max(
      10,
      external.connectionDistance ?? base.connectionDistance,
    ),
    skipConnectionFrames: Math.max(
      1,
      Math.floor(external.skipConnectionFrames ?? base.skipConnectionFrames),
    ),
    densityFactor: Math.max(0.1, external.densityFactor ?? base.densityFactor),
    // Lock these values to prevent runtime issues
    maxParticles: base.maxParticles,
    dpr: base.dpr,
  };
}
