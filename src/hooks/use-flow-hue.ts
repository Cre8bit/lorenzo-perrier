import { useEffect } from "react";
import { useAppContext } from "@/contexts/useAppContext";
import type { AppSection } from "@/contexts/AppContext";

/**
 * Chromatic journey: each section owns a hue and the whole site's ambient
 * light (cursor glow, flow aura) drifts toward it as the visitor scrolls.
 * The value is written once per section change; consuming elements declare
 * `transition: --flow-hue …` so the shift is a slow, smooth temperature
 * change rather than a snap. Costs one CSS-var write per section change.
 */
// Hues are spaced ≥25° apart — closer than that the 2400ms drift reads as
// "nothing happened" on a dark background (the original 185→205 hop was
// imperceptible under the vignette).
const SECTION_HUES: Record<AppSection, number> = {
  hero: 185, // signature teal
  philosophy: 212, // ice blue
  carousel: 258, // violet — echoes the card tints
  experience: 158, // emerald — "open to work" warmth
  cubeSpace: 185,
};

export function useFlowHue() {
  const { currentSection } = useAppContext();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--flow-hue",
      String(SECTION_HUES[currentSection] ?? 185),
    );
  }, [currentSection]);
}
