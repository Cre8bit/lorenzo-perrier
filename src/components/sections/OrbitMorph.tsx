import { useEffect, useRef } from "react";
import { clamp01, lerp, smoothstep } from "@/utils/animation";

// Four dots orbit on the hero's two dotted rings (warm cyan on the middle,
// cooler cyan on the inner — matching the original .node styling) and, as
// the user scrolls into the philosophy section, smoothly leave orbit and
// settle onto the four stepper dots.

type DotConfig = {
  ring: "middle" | "inner";
  baseAngleDeg: number;
  sizePx: number;
  hue: number;
  saturation: number;
  lightness: number;
};

const DOTS: DotConfig[] = [
  { ring: "middle", baseAngleDeg: 0,   sizePx: 9, hue: 185, saturation: 90, lightness: 75 },
  { ring: "inner",  baseAngleDeg: 120, sizePx: 7, hue: 210, saturation: 90, lightness: 80 },
  { ring: "middle", baseAngleDeg: 180, sizePx: 9, hue: 185, saturation: 90, lightness: 75 },
  { ring: "inner",  baseAngleDeg: 300, sizePx: 7, hue: 210, saturation: 90, lightness: 80 },
];

const MIDDLE_PERIOD_MS = 80_000;
const INNER_PERIOD_MS = 55_000;

// Per-dot final size matches the stepper dot it lands on (active step is
// 7 px with a halo, inactive steps are 4 px) so the morph dot superposes
// the real one cleanly instead of sitting inside it.
const STEPPER_DOT_PX_PER_INDEX = [7, 4, 4, 4];

// When no scroll-driven morph is in progress (only orbital rotation), we
// throttle to ~30 fps. At a 80 s rotation period that's <0.15° per frame —
// visually identical to 60 fps and roughly halves the JS work + style
// invalidations while the user is just looking at the hero.
const IDLE_FRAME_INTERVAL_MS = 32;

// Threshold for skipping style writes when the new value is essentially
// equal to the last one. Sub-pixel transforms still happen, but writing the
// same opacity / custom property string each frame still costs style work.
const VALUE_EPSILON = 0.004;

export const OrbitMorph = () => {
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // Also bypass on mobile: the morph is a hero→philosophy transition
    // ornament; on a phone the user has scrolled past it before the
    // animation could mean anything, and the rAF + per-frame CSS var
    // writes are a real scroll cost. We commit `--orbit-morph-fade=1`
    // so the stepper renders normally and hide the dots.
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (prefersReducedMotion || isMobile) {
      dotsRef.current.forEach((d) => {
        if (d) d.style.opacity = "0";
      });
      root.style.setProperty("--orbit-morph-fade", "1");
      return;
    }

    // Cache the hero element once. Without a hero we have nothing to morph
    // out of, so bail before doing any work.
    const hero = document.querySelector<HTMLElement>("[data-hero-section]");
    if (!hero) return;

    // --- Cached geometry -----------------------------------------------------
    // Everything here is recomputed on resize / stepper layout changes, never
    // inside the RAF tick. This eliminates ~5 forced-layout reads per frame
    // (1 for hero + 4 for stepper dots), which is the dominant cost when
    // scrolling.
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let middleR = Math.min(vw * 0.86, 980) / 2;
    let innerR = Math.min(vw * 0.56, 620) / 2;
    const stepperX = [0, 0, 0, 0];
    const stepperY = [0, 0, 0, 0];

    const measureStepper = () => {
      const dots = document.querySelectorAll<HTMLElement>(
        "[data-stepper-dot]",
      );
      const n = Math.min(dots.length, 4);
      for (let i = 0; i < n; i++) {
        const r = dots[i].getBoundingClientRect();
        stepperX[i] = r.left + r.width / 2;
        stepperY[i] = r.top + r.height / 2;
      }
    };

    const onResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      middleR = Math.min(vw * 0.86, 980) / 2;
      innerR = Math.min(vw * 0.56, 620) / 2;
      measureStepper();
    };

    measureStepper();
    window.addEventListener("resize", onResize, { passive: true });

    // Re-measure if a stepper dot's box changes (active state size flip 4↔7).
    // During the morph window the active step doesn't change so this rarely
    // fires, but it keeps the cache accurate over the lifetime of the page.
    const stepperEls = document.querySelectorAll<HTMLElement>(
      "[data-stepper-dot]",
    );
    const ro = new ResizeObserver(measureStepper);
    stepperEls.forEach((el) => ro.observe(el));

    // --- Per-tick state ------------------------------------------------------
    let raf = 0;
    let inRange = true;
    let lastTickTime = 0;
    let lastStepperFade = -1;
    let layerVisible = true;
    const lastGlow = [-1, -1, -1, -1];
    const lastOpacity = [-1, -1, -1, -1];

    const tick = () => {
      // Hero out of view (well past philosophy, deep in the page) — stop
      // the loop entirely. IntersectionObserver will restart us if the user
      // scrolls back up.
      if (!inRange || document.hidden) {
        raf = 0;
        return;
      }

      const now = performance.now();
      const scrollY = window.scrollY;

      // Morph progress: 0 → 1 across the philosophy reveal window.
      const morphRaw = clamp01(scrollY / (vh * 0.75));
      const morph = smoothstep(morphRaw);
      const isMorphActive = morphRaw > 0.0001 && morphRaw < 0.9999;

      // Idle throttle: while only orbital rotation is in play, cap at ~30 fps.
      if (!isMorphActive && now - lastTickTime < IDLE_FRAME_INTERVAL_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastTickTime = now;
      raf = requestAnimationFrame(tick);

      // Stepper fade-in driven by morph. Only write the CSS variable when it
      // changes meaningfully — every write would otherwise invalidate styles
      // for every element that consumes the var.
      const stepperFade = smoothstep(clamp01((morph - 0.55) / 0.45));
      if (Math.abs(stepperFade - lastStepperFade) > VALUE_EPSILON) {
        lastStepperFade = stepperFade;
        root.style.setProperty("--orbit-morph-fade", stepperFade.toFixed(3));
      }

      // Layer fade-out after the dots have landed.
      const fadeStart = vh * 0.8;
      const fadeEnd = vh * 1.1;
      const layerOpacity = clamp01(
        1 - (scrollY - fadeStart) / (fadeEnd - fadeStart),
      );

      if (layerOpacity <= 0) {
        if (layerVisible) {
          layerVisible = false;
          for (let i = 0; i < DOTS.length; i++) {
            const d = dotsRef.current[i];
            if (d) {
              d.style.opacity = "0";
              lastOpacity[i] = 0;
            }
          }
        }
        return;
      }
      layerVisible = true;

      // Hero center derived from the page geometry instead of a layout read.
      // Hero is at offsetTop = 0 and spans full viewport, so:
      //   heroCenter.x = vw / 2,  heroCenter.y = vh / 2 − scrollY.
      // During elastic overscroll, the sticky wrapper that hosts us bounces
      // with the document, so the dots' final visual position still tracks
      // the rings without us needing to detect the elastic offset.
      const hcx = vw / 2;
      const hcy = vh / 2 - scrollY;

      const middleSpinDeg = (now / MIDDLE_PERIOD_MS) * 360;
      const innerSpinDeg = -(now / INNER_PERIOD_MS) * 360;

      for (let i = 0; i < DOTS.length; i++) {
        const cfg = DOTS[i];
        const dot = dotsRef.current[i];
        if (!dot) continue;

        const radius = cfg.ring === "middle" ? middleR : innerR;
        const spin = cfg.ring === "middle" ? middleSpinDeg : innerSpinDeg;
        const angleRad = ((cfg.baseAngleDeg + spin) * Math.PI) / 180;
        const orbitX = hcx + radius * Math.cos(angleRad);
        const orbitY = hcy + radius * Math.sin(angleRad);

        // Per-dot local progress with a gentle top-to-bottom stagger.
        const lt = smoothstep(clamp01((morph - i * 0.07) / 0.78));

        // Soft L-curve: x leads (ease-out), y settles (quadratic ease-in).
        const tx = 1 - (1 - lt) * (1 - lt);
        const ty = lt * lt;
        const x = lerp(orbitX, stepperX[i], tx);
        const y = lerp(orbitY, stepperY[i], ty);

        const scaleT = smoothstep(clamp01((lt - 0.15) / 0.75));
        const finalScale = STEPPER_DOT_PX_PER_INDEX[i] / cfg.sizePx;
        const scale = lerp(1, finalScale, scaleT);
        const glowT = 1 - scaleT;

        // Transform: always written — sub-pixel position changes every frame
        // for the orbit, and there's no cheaper way to update GPU position.
        dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;

        // Opacity / glow: only write when they meaningfully change. Skips
        // most frames during the dwell phase (held at stepper).
        if (Math.abs(layerOpacity - lastOpacity[i]) > VALUE_EPSILON) {
          lastOpacity[i] = layerOpacity;
          dot.style.opacity = layerOpacity.toFixed(3);
        }
        if (Math.abs(glowT - lastGlow[i]) > VALUE_EPSILON) {
          lastGlow[i] = glowT;
          dot.style.setProperty("--glow-strength", glowT.toFixed(3));
        }
      }
    };

    // --- Lifecycle gate ------------------------------------------------------
    // Stop the RAF when the hero is well out of view. We re-enter the loop
    // on the way back up, so the user only pays the frame cost while the
    // animation is actually relevant.
    const io = new IntersectionObserver(
      ([entry]) => {
        const newInRange = entry.isIntersecting;
        if (newInRange === inRange) return;
        inRange = newInRange;
        if (inRange) {
          if (raf === 0) raf = requestAnimationFrame(tick);
        } else {
          if (raf !== 0) cancelAnimationFrame(raf);
          raf = 0;
          // Drop the dots cleanly so they don't linger at stale positions
          // when the user comes back. Skip the per-element write cache —
          // we want these to be effectively reset.
          for (let i = 0; i < DOTS.length; i++) {
            const d = dotsRef.current[i];
            if (d) d.style.opacity = "0";
            lastOpacity[i] = -1;
            lastGlow[i] = -1;
          }
          layerVisible = false;
          lastStepperFade = -1;
        }
      },
      // Generous margin so the loop doesn't stop right at the boundary.
      { rootMargin: "300px 0px 600px 0px" },
    );
    io.observe(hero);

    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      root.style.removeProperty("--orbit-morph-fade");
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        // The sticky parent has height:0, so size this child explicitly to
        // the viewport. Dot transforms are in viewport coords because the
        // sticky pin places this box at viewport (0, 0).
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "visible",
        // Promote to its own compositor layer so neighbouring animations
        // can't trigger repaints that jitter the dots at the dwell point.
        willChange: "transform",
        transform: "translateZ(0)",
        isolation: "isolate",
      }}
    >
      {DOTS.map((cfg, i) => {
        const core = `hsl(${cfg.hue} ${cfg.saturation}% ${cfg.lightness}%)`;
        const mid = `hsl(${cfg.hue} 80% ${cfg.lightness - 5}% / 0.85)`;
        const halo = `hsl(${cfg.hue} 80% ${cfg.lightness - 10}% / 0.45)`;
        return (
          <div
            key={i}
            ref={(el) => {
              dotsRef.current[i] = el;
            }}
            className="absolute top-0 left-0 rounded-full"
            style={{
              width: cfg.sizePx,
              height: cfg.sizePx,
              background: core,
              // var(--glow-strength) is set per-dot by the RAF and fades
              // the blur radii to 0 on arrival.
              boxShadow: `0 0 calc(8px * var(--glow-strength, 1)) ${core},
                0 0 calc(22px * var(--glow-strength, 1)) ${mid},
                0 0 calc(48px * var(--glow-strength, 1)) ${halo}`,
              willChange: "transform, opacity",
              transform: "translate3d(-100px, -100px, 0)",
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
};
