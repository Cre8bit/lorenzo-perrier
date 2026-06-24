import { useEffect, useMemo, useRef, useState } from "react";
import { AmbientBackground } from "@/components/ui/ambient-background";
import ParticleField3D from "@/components/ui/particle-field-3d";
import { useAppContext } from "@/contexts/useAppContext";

type ParticleMode = "active" | "idle";

type Props = {
  particleMode?: ParticleMode;
};

// Read mobile state with a sync default so we never mount the WebGL canvas
// on a phone, even for the first frame. `useIsMobile` returns undefined on
// the first render, which would create then immediately tear down the
// canvas — by far the worst case for mobile cold start.
function useIsMobileSync() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export function GlobalBackground({ particleMode = "active" }: Props) {
  const { activePresetIndex, currentSection, setIsParticleFieldInitialized } =
    useAppContext();
  const readyFiredRef = useRef(false);
  const isMobile = useIsMobileSync();

  const effectivePresetIndex = useMemo(
    () => (currentSection === "philosophy" ? activePresetIndex : -1),
    [activePresetIndex, currentSection],
  );

  // On mobile we never mount the WebGL canvas. Mark the particle field as
  // "initialized" immediately so anything gated on it (loader, etc.) can
  // proceed without waiting on a context that will never exist.
  useEffect(() => {
    if (isMobile && !readyFiredRef.current) {
      readyFiredRef.current = true;
      setIsParticleFieldInitialized(true);
    }
  }, [isMobile, setIsParticleFieldInitialized]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <div className="noise-overlay" />
      <AmbientBackground />
      {!isMobile && (
        <ParticleField3D
          activePresetIndex={effectivePresetIndex}
          mode={particleMode}
          onReady={() => {
            if (readyFiredRef.current) return;
            readyFiredRef.current = true;
            setIsParticleFieldInitialized(true);
          }}
        />
      )}
      {isMobile && <MobileParticleSubstitute />}
    </div>
  );
}

/**
 * Mobile-only "cosmic" background. Three stacked layers — all pure CSS
 * gradients, no `filter: blur`, no animation on a transform/filter, no
 * canvas. Cost is essentially a single GPU-composited image per layer.
 *
 *   1. Nebula washes: wide, low-opacity radial gradients in cyan and
 *      indigo. Gives the background actual color depth instead of the
 *      flat dark blue.
 *   2. Starfield: ~40 tiny radial-gradient "stars" spread across the
 *      viewport. Tiled background-size makes them repeat down the page
 *      so the cosmic feel persists as you scroll, not just on the hero.
 *   3. Twinkle: a single slow opacity pulse on a smaller star layer for
 *      a subtle "alive" cue. Opacity-only keyframe → no layout, cheap.
 */
function MobileParticleSubstitute() {
  return (
    <>
      {/* Layer 1 — nebula washes */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(60% 45% at 18% 22%, hsl(195 85% 55% / 0.12), transparent 65%)",
            "radial-gradient(55% 40% at 82% 30%, hsl(260 70% 60% / 0.10), transparent 65%)",
            "radial-gradient(70% 50% at 50% 78%, hsl(210 80% 55% / 0.10), transparent 70%)",
            "radial-gradient(45% 35% at 10% 90%, hsl(185 80% 60% / 0.08), transparent 65%)",
            "radial-gradient(50% 38% at 95% 88%, hsl(220 75% 55% / 0.09), transparent 65%)",
          ].join(", "),
        }}
      />

      {/* Layer 2 — dense static starfield, tiled vertically. 256×256
          tile, ~25 points per tile. Looks dense without paying the cost
          of an absurd number of individual gradients. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // Bigger primary-tinted stars
            "radial-gradient(1.4px 1.4px at 32px 28px, hsl(var(--primary) / 0.85), transparent 70%)",
            "radial-gradient(1.6px 1.6px at 198px 64px, hsl(var(--primary) / 0.7), transparent 70%)",
            "radial-gradient(1.3px 1.3px at 92px 152px, hsl(var(--primary) / 0.75), transparent 70%)",
            "radial-gradient(1.5px 1.5px at 224px 208px, hsl(var(--primary) / 0.8), transparent 70%)",
            // Smaller cool-white stars
            "radial-gradient(1px 1px at 70px 90px, hsl(210 80% 88% / 0.7), transparent 70%)",
            "radial-gradient(1px 1px at 150px 40px, hsl(210 80% 88% / 0.6), transparent 70%)",
            "radial-gradient(1px 1px at 16px 188px, hsl(210 80% 88% / 0.65), transparent 70%)",
            "radial-gradient(1px 1px at 180px 232px, hsl(210 80% 88% / 0.7), transparent 70%)",
            "radial-gradient(1px 1px at 244px 124px, hsl(210 80% 88% / 0.55), transparent 70%)",
            "radial-gradient(1px 1px at 56px 240px, hsl(210 80% 88% / 0.65), transparent 70%)",
            // Tiny dust stars
            "radial-gradient(0.6px 0.6px at 120px 12px, hsl(210 60% 90% / 0.5), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 8px 64px, hsl(210 60% 90% / 0.45), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 168px 184px, hsl(210 60% 90% / 0.5), transparent 70%)",
            "radial-gradient(0.7px 0.7px at 212px 16px, hsl(210 60% 90% / 0.45), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 44px 116px, hsl(210 60% 90% / 0.4), transparent 70%)",
            "radial-gradient(0.7px 0.7px at 108px 220px, hsl(210 60% 90% / 0.45), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 248px 80px, hsl(210 60% 90% / 0.4), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 132px 96px, hsl(210 60% 90% / 0.4), transparent 70%)",
            "radial-gradient(0.7px 0.7px at 80px 200px, hsl(210 60% 90% / 0.45), transparent 70%)",
            "radial-gradient(0.6px 0.6px at 232px 168px, hsl(210 60% 90% / 0.4), transparent 70%)",
          ].join(", "),
          backgroundSize: "256px 256px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Layer 3 — slow twinkle pulse. Offset tile so the bright stars
          don't sit on top of layer 2's positions. */}
      <div
        aria-hidden
        className="absolute inset-0 mobile-starfield-twinkle"
        style={{
          backgroundImage: [
            "radial-gradient(1.2px 1.2px at 58px 50px, hsl(var(--primary) / 0.95), transparent 70%)",
            "radial-gradient(1px 1px at 176px 110px, hsl(210 80% 90% / 0.8), transparent 70%)",
            "radial-gradient(1.1px 1.1px at 100px 196px, hsl(var(--primary) / 0.85), transparent 70%)",
            "radial-gradient(1px 1px at 220px 222px, hsl(210 80% 90% / 0.75), transparent 70%)",
            "radial-gradient(0.9px 0.9px at 30px 154px, hsl(var(--primary) / 0.8), transparent 70%)",
          ].join(", "),
          backgroundSize: "256px 320px",
          backgroundRepeat: "repeat",
        }}
      />
    </>
  );
}
