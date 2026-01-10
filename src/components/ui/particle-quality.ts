import type { QualitySettings } from "@/lib/performance";

/**
 * External quality overrides for particle field.
 * Can modify at runtime:
 *   - connectionDistance (px)
 *   - skipConnectionFrames (frame skip count)
 *   - densityFactor (particle count multiplier)
 *
 * Cannot modify at runtime (buffer-locked):
 *   - maxParticles (requires remount)
 *   - dpr (Canvas controls this separately)
 */
let externalQualitySettings: Partial<QualitySettings> | null = null;

export const setParticleField3DQuality = (
  settings: Partial<QualitySettings>
) => {
  externalQualitySettings = settings;
};

export const getExternalQualitySettings = () => externalQualitySettings;

/**
 * Merge external quality overrides with base settings.
 * Locks maxParticles and dpr to prevent runtime buffer changes.
 * Clamps values to safe ranges.
 */
export function resolveRuntimeQuality(
  base: QualitySettings,
  external: Partial<QualitySettings> | null
): QualitySettings {
  if (!external) return base;

  return {
    ...base,
    connectionDistance: Math.max(
      10,
      external.connectionDistance ?? base.connectionDistance
    ),
    skipConnectionFrames: Math.max(
      1,
      Math.floor(external.skipConnectionFrames ?? base.skipConnectionFrames)
    ),
    densityFactor: Math.max(0.1, external.densityFactor ?? base.densityFactor),
    // Lock these values to prevent runtime issues
    maxParticles: base.maxParticles,
    dpr: base.dpr,
  };
}
