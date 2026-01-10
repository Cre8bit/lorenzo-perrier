/**
 * React hook for unified quality settings state management
 * Single source of truth for Canvas DPR and simulation quality
 */

import { useEffect, useState } from "react";
import { getQualitySettings, type QualitySettings } from "@/lib/performance";

/**
 * Hook that manages quality settings state with automatic updates on resize/zoom
 * Ensures Canvas DPR and simulation settings stay in sync
 */
export function useQualitySettingsState(): QualitySettings {
  const [quality, setQuality] = useState<QualitySettings>(() =>
    getQualitySettings()
  );

  useEffect(() => {
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setQuality(getQualitySettings()));
    };

    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return quality;
}
