import { useEffect, useMemo, useRef, useState } from "react";
import { philosophyItems } from "./PhilosophyData";
import { reportPerformance } from "@/components/ui/performance-overlay";
import { clamp01, smoothstep } from "@/utils/animation";
import { useParticleField } from "@/contexts/useParticleField";

export const PhilosophyReveal = () => {
  const { setActivePresetIndex } = useParticleField();
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
  const rafWatchRef = useRef<number | null>(null);

  const settleRef = useRef(0);
  const [settle, setSettle] = useState(0);
  const settleRafRef = useRef<number | null>(null);

  const isScrollingRef = useRef(false);
  const lastScrollYRef = useRef<number>(window.scrollY);

  const [stepperOpen, setStepperOpen] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // Cached metrics for scroll calculations (avoids getBoundingClientRect per frame)
  const metricsRef = useRef({ top: 0, height: 0, vh: 0, total: 1 });
  // Last rendered values for thresholding
  const lastRef = useRef({ reveal: 0, exit: 1, progress: 0, activeIndex: 0 });
  // IntersectionObserver flag
  const isNearRef = useRef(false);
  // Snap-to-card animation ref
  const snapRafRef = useRef<number | null>(null);

  const n = philosophyItems.length;

  // Helper: get progress at center of a step
  const stepCenterP = (idx: number) => (idx + 0.5) / n;

  // Helper: find nearest card index from progress
  const nearestIndexFromProgress = (p: number) => {
    const idx = Math.round(p * n - 0.5);
    return Math.max(0, Math.min(n - 1, idx));
  };

  // Helper: hard set progress without threshold checks
  const setProgressHard = (p: number) => {
    progressRef.current = p;
    lastRef.current.progress = p;
    setProgress(p);
  };

  // Measure section metrics (run on mount + resize)
  const measure = () => {
    const el = sectionRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const height = el.offsetHeight;
    const vh = window.innerHeight;
    const total = Math.max(1, height - vh);

    metricsRef.current = { top, height, vh, total };
  };

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
    return nearestIndexFromProgress(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, n]);

  const effectiveActiveIndex = lockedIndex ?? derivedActiveIndex;

  // Sync effectiveActiveIndex to context for particle field
  useEffect(() => {
    setActivePresetIndex(effectiveActiveIndex);
  }, [effectiveActiveIndex, setActivePresetIndex]);

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

    // Initial measurement
    measure();

    // IntersectionObserver to skip RAF loop when far away
    const io = new IntersectionObserver(
      ([entry]) => {
        isNearRef.current = entry.isIntersecting;
      },
      { root: null, threshold: 0, rootMargin: "200px 0px 200px 0px" }
    );

    io.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", measure);
      // Refs are intentionally mutable for animation cleanup
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (rafWatchRef.current) cancelAnimationFrame(rafWatchRef.current);
      if (snapRafRef.current) cancelAnimationFrame(snapRafRef.current);
      if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
    };
  }, []);

  // Single RAF loop - no scroll event handler
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const tickStart = performance.now();
      raf = requestAnimationFrame(tick);

      // Skip when page is hidden or section is far away
      if (document.hidden) return;
      if (!isNearRef.current) return;

      const el = sectionRef.current;
      if (!el) return;

      const { top, total } = metricsRef.current;

      // Section progress 0..1 while sticky is active
      const traveled = window.scrollY - top;
      const sectionP = clamp01(traveled / total);

      // Reveal opacity (fade in during first 10% of section)
      const reveal = smoothstep(clamp01(sectionP / 0.1));

      // Exit opacity (fade out near end)
      const startFade = 0.93;
      const endFade = 0.98;
      let exit = 1;
      if (sectionP >= endFade) exit = 0;
      else if (sectionP > startFade) {
        const t = (sectionP - startFade) / (endFade - startFade);
        exit = 1 - smoothstep(t);
      }

      // Before reveal completes: hold progress at 0
      if (reveal < 1) {
        revealCompletedRef.current = false;
        if (!isProgrammaticScrollRef.current) {
          // Only update if changed enough
          if (Math.abs(lastRef.current.progress - 0) > 0.001) {
            lastRef.current.progress = 0;
            progressRef.current = 0;
            setProgress(0);
          }
        }
      } else {
        // Reveal just completed: capture anchor position
        if (!revealCompletedRef.current) {
          revealCompletedRef.current = true;

          // Back-calculate where reveal completed (at p = 0.1 of section progress)
          const traveledAtReveal = 0.1 * total;
          revealStartScrollRef.current = top + traveledAtReveal;
        }

        // After reveal: sync internal progress (skip if programmatic lock is active)
        if (!isProgrammaticScrollRef.current) {
          // Detect actual scroll movement
          const y = window.scrollY;
          const dy = Math.abs(y - lastScrollYRef.current);
          lastScrollYRef.current = y;

          // Treat tiny subpixel/jitter as no-scroll
          const MOVING = dy > 0.5;

          const delta = Math.max(
            0,
            window.scrollY - revealStartScrollRef.current
          );
          const p = clamp01(delta / internalScrollDistance());
          progressRef.current = p;

          // Only setProgress when it actually moves enough (threshold to avoid re-renders)
          if (Math.abs(lastRef.current.progress - p) > 0.003) {
            lastRef.current.progress = p;
            setProgress(p);

            const idx = Math.min(n - 1, Math.floor(p * n));
            if (idx !== lastRef.current.activeIndex) {
              lastRef.current.activeIndex = idx;
              setMaxSeenIndex((prev) => Math.max(prev, idx));
            }
          }

          // Only when actual movement detected
          if (MOVING) {
            // Cancel any active snap animation when user resumes scrolling
            cancelSnap();

            if (!isScrollingRef.current) {
              isScrollingRef.current = true;
              setIsScrolling(true);
            }

            // Fade settle back to 0 smoothly when movement starts (prevents flicker)
            if (settleRef.current > 0.01) {
              cancelSettle();
              const startSettle = settleRef.current;
              const startTime = performance.now();
              const FADE_OUT = 80; // quick fade to avoid flicker

              const fadeOut = () => {
                const t = clamp01((performance.now() - startTime) / FADE_OUT);
                const v = startSettle * (1 - smoothstep(t));
                settleRef.current = v;
                setSettle(v);
                if (t < 1) {
                  settleRafRef.current = requestAnimationFrame(fadeOut);
                } else {
                  settleRafRef.current = null;
                }
              };

              settleRafRef.current = requestAnimationFrame(fadeOut);
            }

            // Restart stop timer
            if (scrollTimeoutRef.current)
              clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = window.setTimeout(() => {
              isScrollingRef.current = false;
              setIsScrolling(false);

              // Start settle animation
              if (isProgrammaticScrollRef.current) return;
              if (!revealCompletedRef.current) return;

              cancelSettle();
              const start = performance.now();
              const from = settleRef.current;
              const DURATION = 220;

              const animate = () => {
                const t = clamp01((performance.now() - start) / DURATION);
                const v = from + (1 - from) * smoothstep(t);
                settleRef.current = v;
                setSettle(v);
                if (t < 1) {
                  settleRafRef.current = requestAnimationFrame(animate);
                } else {
                  settleRafRef.current = null;
                  // Update maxSeenIndex once settle completes
                  const idx = nearestIndexFromProgress(progressRef.current);
                  setMaxSeenIndex((prev) => Math.max(prev, idx));
                }
              };

              settleRafRef.current = requestAnimationFrame(animate);
            }, 160);
          }
        }
      }

      // Thresholded opacity setState (avoid re-render for micro changes)
      if (Math.abs(lastRef.current.reveal - reveal) > 0.01) {
        lastRef.current.reveal = reveal;
        setRevealOpacity(reveal);
      }
      if (Math.abs(lastRef.current.exit - exit) > 0.01) {
        lastRef.current.exit = exit;
        setExitOpacity(exit);
      }

      // Report performance for frames that take too long
      const tickDuration = performance.now() - tickStart;
      if (tickDuration > 8) {
        reportPerformance("PhilosophyReveal:RAF", tickDuration);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Helper functions (nearestIndexFromProgress, stepCenterP, isScrolling state) are stable
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
    const overlap = itemRange * 0.05; // tune 0.02–0.08
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

    // When not scrolling, ease toward a fully-visible single card
    const active = effectiveActiveIndex;

    // Once settle passes threshold, force winner-takes-all to prevent two cards
    if (settle > 0.15) {
      return index === active ? 1 : 0;
    }

    // settle ramps 0->1 after scroll stops
    const settledOpacity = index === active ? 1 : 0;
    const blended = baseOpacity * (1 - settle) + settledOpacity * settle;

    return blended;
  };

  const highlightKeywords = (
    text: string,
    keywords: string[],
    isHovered: boolean
  ) => {
    if (!keywords.length) return text;

    // Create single regex pattern for all keywords (more efficient than multiple splits)
    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const parts = text.split(new RegExp(`(${pattern})`, "gi"));

    // Create lowercase set for O(1) lookup
    const keywordSet = new Set(keywords.map((k) => k.toLowerCase()));

    return parts.map((part, index) =>
      keywordSet.has(part.toLowerCase()) ? (
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

  const cancelSnap = () => {
    if (snapRafRef.current) cancelAnimationFrame(snapRafRef.current);
    snapRafRef.current = null;
  };

  const cancelSettle = () => {
    if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
    settleRafRef.current = null;
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

    // User interrupt handlers - drop lock if user scrolls during programmatic mode
    const abortOnUserScroll = () => {
      if (!isProgrammaticScrollRef.current) return;
      isProgrammaticScrollRef.current = false;
      lockedIndexRef.current = null;
      setLockedIndex(null);
      syncProgressFromScroll();

      // Clean up listeners
      window.removeEventListener("wheel", abortOnUserScroll);
      window.removeEventListener("touchmove", abortOnUserScroll);
    };

    window.addEventListener("wheel", abortOnUserScroll, { passive: true });
    window.addEventListener("touchmove", abortOnUserScroll, { passive: true });

    // Watch actual scroll position; exit lock when close enough
    cancelWatch();
    const EPS = 6; // bigger tolerance for smooth scrolling + fractional pixels
    const MAX_MS = 1200; // timeout fallback
    const startTime = performance.now();

    const watch = () => {
      const dist = Math.abs(window.scrollY - targetScroll);
      const timedOut = performance.now() - startTime > MAX_MS;

      if (dist <= EPS || timedOut) {
        // Exit programmatic lock
        isProgrammaticScrollRef.current = false;
        lockedIndexRef.current = null;
        setLockedIndex(null);

        // Final sync from real scroll position (keeps everything consistent)
        syncProgressFromScroll();

        // Clean up listeners
        window.removeEventListener("wheel", abortOnUserScroll);
        window.removeEventListener("touchmove", abortOnUserScroll);
        return;
      }

      rafWatchRef.current = requestAnimationFrame(watch);
    };

    rafWatchRef.current = requestAnimationFrame(watch);
  };

  return (
    <section ref={sectionRef} className="min-h-[700vh] relative -mt-[100vh]">
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
          className="max-w-4xl w-full relative px-4"
          style={{ minHeight: "380px", opacity: exitOpacity, zIndex: 20 }}
        >
          {/* Items */}
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center cursor-default"
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 25}px)`,
                  pointerEvents: opacity > 0.5 ? "auto" : "none",
                  transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex flex-col items-center text-center max-w-2xl relative">
                  {/* Title */}
                  <h3
                    className={`text-base md:text-lg uppercase tracking-[0.15em] font-medium mb-4 relative z-10 transition-all duration-500 ${
                      isHovered ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Quote with stylized quotation mark */}
                  <blockquote
                    className={`font-display text-2xl md:text-4xl lg:text-5xl font-light italic leading-snug relative z-10 transition-all duration-500 ${
                      isHovered ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    <span
                      className={`text-6xl md:text-7xl lg:text-8xl leading-none transition-all duration-500 ${
                        isHovered ? "text-primary/60" : "text-primary/30"
                      }`}
                      style={{
                        fontFamily: "Georgia, serif",
                        position: "relative",
                        top: "0.15em",
                        marginRight: "0.1em",
                      }}
                    >
                      "
                    </span>
                    {highlightKeywords(
                      item.description,
                      item.keywords,
                      isHovered
                    )}
                  </blockquote>

                  {/* Subtitle below */}
                  <span
                    className={`text-[10px] uppercase tracking-[0.35em] mt-6 relative z-10 transition-all duration-500 ${
                      isHovered ? "text-primary/60" : "text-primary/35"
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>
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
