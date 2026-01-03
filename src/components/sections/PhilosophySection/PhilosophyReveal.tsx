import { useEffect, useMemo, useRef, useState } from "react";
import { philosophyItems } from "./PhilosophyData";
import { reportPerformance } from "@/components/ui/performance-overlay";
import { clamp01, smoothstep } from "@/utils/animation";

export const PhilosophyReveal = () => {
  // Reveal opacity (0..1) based on entering the section
  const [revealOpacity, setRevealOpacity] = useState(0);

  // Exit opacity for fading out content as carousel approaches
  const [exitOpacity, setExitOpacity] = useState(1);

  // Single rendered progress for internal transitions (0..1) after reveal completes
  const [progress, setProgress] = useState(0);

  // Hover & manual scrolling helpers
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // "Seen" tracking (kept as state because it’s UX / gating)
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  // Once user has traversed all items at least once, keep all steps selectable
  const [allTraversed, setAllTraversed] = useState(false);

  // DOM + internal refs
  const sectionRef = useRef<HTMLDivElement>(null);

  const revealCompletedRef = useRef(false);
  const revealStartScrollRef = useRef(0);

  const progressRef = useRef(0);

  const isProgrammaticScrollRef = useRef(false);
  const lockedIndexRef = useRef<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);

  const scrollTimeoutRef = useRef<number | null>(null);
  const tickingRef = useRef(false);
  const rafWatchRef = useRef<number | null>(null);

  const [stepperOpen, setStepperOpen] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const n = philosophyItems.length;

  const computeSectionProgress = (section: HTMLElement) => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;

    // total scroll distance while sticky is "active"
    const total = rect.height - vh;
    if (total <= 0) return 1;

    const traveled = -rect.top; // when rect.top goes from 0 -> negative
    return clamp01(traveled / total);
  };

  const computeRevealOpacity = (section: HTMLElement) => {
    const p = computeSectionProgress(section);
    // fade in quickly in first ~20% of the section
    const fadeRange = clamp01(p / 0.1);
    return smoothstep(fadeRange);
  };

  const computeExitOpacity = (section: HTMLElement) => {
    const p = computeSectionProgress(section);
    const startFade = 0.93;
    const endFade = 0.98;

    if (p <= startFade) return 1;
    if (p >= endFade) return 0;

    const t = (p - startFade) / (endFade - startFade);
    return 1 - smoothstep(t);
  };

  // Derived active index (do NOT store separately)
  const derivedActiveIndex = useMemo(() => {
    const idx = Math.min(n - 1, Math.floor(progress * n));
    return idx;
  }, [progress, n]);

  const effectiveActiveIndex = lockedIndex ?? derivedActiveIndex;

  // Compute the "target progress" for a given step
  const stepMidProgress = (index: number) => {
    const itemStart = index / n;
    const itemEnd = (index + 1) / n;
    return (itemStart + itemEnd) / 2;
  };

  // Total internal scroll distance after reveal completes
  const internalScrollDistance = () => window.innerHeight * 5;

  // Sync progress from current scroll position (after reveal completed)
  const syncProgressFromScroll = () => {
    if (!revealCompletedRef.current) {
      progressRef.current = 0;
      setProgress(0);
      return;
    }

    const delta = Math.max(0, window.scrollY - revealStartScrollRef.current);
    const p = clamp01(delta / internalScrollDistance());

    progressRef.current = p;
    setProgress(p);

    // Keep "seen" tracking updated during manual scrolling (not during programmatic lock)
    if (!isProgrammaticScrollRef.current) {
      const idx = Math.min(n - 1, Math.floor(p * n));
      setMaxSeenIndex((prev) => Math.max(prev, idx));
    }
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScrollOrResize = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const scrollStart = performance.now();
        tickingRef.current = false;

        // Skip heavy calculations when page is hidden
        if (document.hidden) return;

        const op = computeRevealOpacity(el);
        setRevealOpacity(op);

        // Compute exit opacity (for fading out as carousel approaches)
        const exitOp = computeExitOpacity(el);
        setExitOpacity(exitOp);

        // manual scroll state (only when not programmatic)
        if (!isProgrammaticScrollRef.current) {
          setIsScrolling(true);
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = window.setTimeout(
            () => setIsScrolling(false),
            250
          );
        }

        // Before reveal completes: hold progress at 0 and reset "reveal completed"
        if (op < 1) {
          revealCompletedRef.current = false;
          // During entry phase we keep at step 0 and progress 0.
          if (!isProgrammaticScrollRef.current) {
            progressRef.current = 0;
            setProgress(0);
          }
          return;
        }

        // Reveal just completed: capture the anchor scroll position once
        if (!revealCompletedRef.current) {
          revealCompletedRef.current = true;

          // Back-calculate where reveal completed (at p = 0.1 of section progress)
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const total = rect.height - vh;
          const traveledAtReveal = 0.1 * total;

          // Absolute position of section top + distance traveled for reveal
          const sectionTop = window.scrollY + rect.top;
          revealStartScrollRef.current = sectionTop + traveledAtReveal;

          // Sync progress immediately from current scroll position
          const delta = Math.max(
            0,
            window.scrollY - revealStartScrollRef.current
          );
          const p = clamp01(delta / internalScrollDistance());

          progressRef.current = p;
          setProgress(p);

          // Set maxSeenIndex based on current progress
          const idx = Math.min(n - 1, Math.floor(p * n));
          setMaxSeenIndex(Math.max(0, idx));

          return;
        }

        // After reveal: sync internal progress (skip if programmatic lock is active)
        if (!isProgrammaticScrollRef.current) {
          syncProgressFromScroll();
        }

        // Report scroll performance
        const scrollDuration = performance.now() - scrollStart;
        if (scrollDuration > 8) {
          reportPerformance("PhilosophyReveal:scroll", scrollDuration);
        }
      });
    };

    // initial
    onScrollOrResize();

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafWatchRef.current) cancelAnimationFrame(rafWatchRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // Update `allTraversed` whenever maxSeenIndex reaches the last index
  useEffect(() => {
    if (maxSeenIndex >= n - 1) {
      setAllTraversed(true);
    }
  }, [maxSeenIndex, n]);

  // Opacity computation with:
  // - overlap to avoid "both 0" at boundaries
  // - lockedIndex programmatic mode renders only the active card (no flicker)
  const getItemOpacity = (index: number) => {
    // During programmatic navigation, show only the locked/active card
    if (isProgrammaticScrollRef.current && lockedIndexRef.current !== null) {
      return index === lockedIndexRef.current ? 1 : 0;
    }

    const itemStart = index / n;
    const itemEnd = (index + 1) / n;
    const itemRange = itemEnd - itemStart;

    // Small overlap prevents blank frames at exact boundaries
    const overlap = itemRange * 0.02; // tune 0.02–0.08
    const start = itemStart - overlap;
    const end = itemEnd + overlap;

    // Fade zones on each edge
    const fadeEdgePercent = 0.2;
    const fadeInEnd = start + (end - start) * fadeEdgePercent;
    const fadeOutStart = end - (end - start) * fadeEdgePercent;

    // Keep final item visible once we've progressed past it
    if (index === n - 1 && progress >= itemStart) return 1;

    if (progress < start) return 0;
    if (progress > end) return 0;

    let baseOpacity = 0;

    if (progress < fadeInEnd) {
      baseOpacity = (progress - start) / (fadeInEnd - start);
    } else if (progress < fadeOutStart) {
      baseOpacity = 1;
    } else {
      baseOpacity = 1 - (progress - fadeOutStart) / (end - fadeOutStart);
    }

    // If user stops scrolling, ensure the derived active item is fully visible
    if (!isScrolling && index === derivedActiveIndex && revealOpacity === 1) {
      return 1;
    }

    const EPS_OPACITY = 0.2;
    if (baseOpacity < EPS_OPACITY) baseOpacity = 0;
    if (baseOpacity > 1 - EPS_OPACITY) baseOpacity = 1;
    return baseOpacity;
  };

  const highlightKeyword = (
    text: string,
    keyword: string,
    isHovered: boolean
  ) => {
    const parts = text.split(new RegExp(`(${keyword})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span
          key={index}
          className={`transition-all duration-700 ${
            isHovered
              ? "text-primary/90 drop-shadow-[0_0_8px_rgba(99,179,179,0.4)]"
              : ""
          }`}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const cancelWatch = () => {
    if (rafWatchRef.current) cancelAnimationFrame(rafWatchRef.current);
    rafWatchRef.current = null;
  };

  const handleStepperClick = (index: number) => {
    if (!sectionRef.current || !revealCompletedRef.current) return;
    if (!allTraversed && index > maxSeenIndex) return;

    const targetP = stepMidProgress(index);
    const targetScroll =
      revealStartScrollRef.current + targetP * internalScrollDistance();

    // Enter programmatic/locked mode
    isProgrammaticScrollRef.current = true;
    lockedIndexRef.current = index;
    setLockedIndex(index);
    setIsScrolling(false);

    // Keep progress consistent with the locked step (single source of truth still = progress)
    progressRef.current = targetP;
    setProgress(targetP);
    setMaxSeenIndex((prev) => Math.max(prev, index));

    // Smooth scroll the page
    window.scrollTo({ top: targetScroll, behavior: "smooth" });

    // Watch actual scroll position; exit lock when close enough
    cancelWatch();
    const EPS = 2; // px tolerance

    const watch = () => {
      const dist = Math.abs(window.scrollY - targetScroll);

      if (dist <= EPS) {
        // Exit programmatic lock
        isProgrammaticScrollRef.current = false;
        lockedIndexRef.current = null;
        setLockedIndex(null);

        // Final sync from real scroll position (keeps everything consistent)
        syncProgressFromScroll();
        return;
      }

      rafWatchRef.current = requestAnimationFrame(watch);
    };

    rafWatchRef.current = requestAnimationFrame(watch);
  };

  return (
    <section
      id="philosophy"
      ref={sectionRef}
      className="min-h-[700vh] relative -mt-[100vh]"
    >
      {/* Aurore boreal effect TODO Full-section background (spans the whole scroll section) */}
      {/* <div
    className="absolute inset-0 pointer-events-none z-0"
    style={{
      // keep it stable across the whole section
      background: `
        radial-gradient(ellipse 70% 60% at 50% 35%,
          hsl(var(--primary) / 0.12) 0%,
          transparent 65%
        ),
        radial-gradient(ellipse 60% 55% at 50% 70%,
          hsl(var(--primary) / 0.08) 0%,
          transparent 70%
        )
      `,
    }}
  />
   */}

      {/* Sticky container */}
      <div
        className="sticky top-0 h-screen flex items-center justify-center px-4 md:px-8 transition-opacity duration-300 ease-linear"
        style={{ opacity: revealOpacity }}
      >
        {/* Headline - stays visible */}
        <h2
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-body uppercase text-foreground/70 text-center transition-opacity duration-300 ease-linear z-20"
          style={{
            opacity: revealOpacity,
            top: "var(--section-title-top)",
            fontSize: "var(--section-title-font-size)",
            letterSpacing: "var(--section-title-tracking)",
            lineHeight: "var(--section-title-line-height)",
          }}
        >
          What I Build
        </h2>

        {/* Headline - becaomes visible only at end */}
        <h2
          className="pointer-events-none absolute left-1/2 font-body uppercase text-foreground/70 text-center transition-opacity duration-300 ease-linear z-20"
          style={{
            opacity: 1 - exitOpacity,
            top: "calc(var(--section-title-top) + var(--carousel-title-offset))",
            fontSize: "var(--section-title-font-size)",
            letterSpacing: "var(--section-title-tracking)",
            lineHeight: "var(--section-title-line-height)",
            transform: `translateX(-50%)`,
          }}
        >
          Is
        </h2>

        {/* Expandable wave stepper: LEFT-ALIGNED bars, wave is only elongation + thickness/glow */}
        <div
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2"
          style={{ opacity: exitOpacity }}
          onMouseEnter={() => setStepperOpen(true)}
          onMouseLeave={() => {
            setStepperOpen(false);
            setHoveredStep(null);
          }}
        >
          <div
            className="flex flex-col items-start"
            style={{
              gap: stepperOpen ? 14 : 10,
              transform: `scale(${stepperOpen ? 1.1 : 1})`,
              transformOrigin: "left center",
              transition: "transform 180ms ease, gap 180ms ease",
            }}
          >
            {philosophyItems.map((_, index) => {
              const isActive = index === effectiveActiveIndex;
              const hasBeenSeen = allTraversed || index <= maxSeenIndex;
              const isHovered = hoveredStep === index;

              // --- Traveling wave "energy" centered on current progress ---
              const waveCenter = progress * (n - 1); // 0..n-1
              const dist = index - waveCenter;

              // tighter because 4 steps; tune 0.85..1.25
              const sigma = 1.05;
              const envelope = Math.exp(-(dist * dist) / (2 * sigma * sigma)); // 0..1

              // baseline so ends still have some life
              const baseline = 0.2; // 0.15..0.28
              const wave = baseline + (1 - baseline) * envelope;

              // sizing (compact by default, bigger when stepperOpen)
              const baseW = stepperOpen ? 18 : 14;
              const maxExtraW = stepperOpen ? 42 : 26;

              const width =
                baseW +
                maxExtraW * wave +
                (isActive ? 10 : 0) +
                (isHovered ? 14 : 0);

              // thickness: subtle, but helps selection
              const heightBase = isActive ? 3 : 2;
              const height = stepperOpen
                ? isHovered
                  ? heightBase + 1
                  : heightBase
                : heightBase;

              // opacity / glow
              const trackOpacity = hasBeenSeen ? 0.28 : 0.18;
              const fillOpacity = isActive ? 1 : isHovered ? 0.85 : 0.55;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleStepperClick(index)}
                  disabled={!hasBeenSeen}
                  aria-label={`Go to step ${index + 1}`}
                  onMouseEnter={() => setHoveredStep(index)}
                  className={`group relative flex items-center ${
                    hasBeenSeen ? "cursor-pointer" : "cursor-default"
                  }`}
                  style={{
                    pointerEvents: hasBeenSeen ? "auto" : "none",

                    // bigger hit area when expanded
                    minHeight: stepperOpen ? 34 : 26,
                    paddingTop: stepperOpen ? 10 : 7,
                    paddingBottom: stepperOpen ? 10 : 7,
                  }}
                >
                  <span
                    className="relative block rounded-full"
                    style={{
                      width,
                      height,
                      background: `rgba(255,255,255,${trackOpacity})`,
                      transition:
                        "width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), height 140ms ease, background 200ms ease, box-shadow 200ms ease",
                      boxShadow: isActive
                        ? "0 0 12px rgba(255,255,255,0.22)"
                        : isHovered
                        ? "0 0 14px rgba(255,255,255,0.18)"
                        : "0 0 8px rgba(255,255,255,0.10)",
                    }}
                  >
                    {/* Fill only once seen */}
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.88)",
                        transform: hasBeenSeen ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left",
                        opacity: hasBeenSeen ? fillOpacity : 0,
                        transition: "transform 220ms ease, opacity 160ms ease",
                      }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Background glow (kept outside fading container so it remains visible) */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse ${50 + progress * 20}% ${
              40 + progress * 15
            }% at center, hsl(var(--primary) / ${
              0.05 + progress * 0.1
            }) 0%, transparent 70%)`,
            opacity: revealOpacity,
            transition: "background 0.3s ease-out",
            zIndex: 10,
          }}
        />

        {/* Central container */}
        <div
          className="max-w-2xl w-full relative px-4"
          style={{ minHeight: "300px", opacity: exitOpacity, zIndex: 20 }}
        >
          {/* Items */}
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-12 cursor-default"
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 20}px) scale(${
                    0.95 + opacity * 0.05
                  })`,
                  pointerEvents: opacity > 0.5 ? "auto" : "none",
                  transition: "transform 0.2s ease-out",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >

                {/* Subtitle */}
                <span className="text-xs uppercase tracking-[0.3em] text-primary/60 mb-4">
                  {item.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-light text-foreground mb-4 md:mb-6">
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-base md:text-lg font-light leading-relaxed max-w-md transition-all duration-700 ${
                    isHovered
                      ? "text-muted-foreground/90 blur-0"
                      : "text-muted-foreground/70 blur-[0.3px]"
                  }`}
                >
                  {highlightKeyword(item.description, item.keyword, isHovered)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section label */}
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden md:block">
          <span
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground/40 writing-mode-vertical"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              opacity: revealOpacity * exitOpacity,
              transition: "opacity 240ms ease-out",
            }}
          >
            Philosophy
          </span>
        </div>
      </div>
    </section>
  );
};
