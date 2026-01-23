import { useEffect, useMemo, useRef, useState } from "react";
import { philosophyItems } from "./PhilosophyData";
import { reportPerformance } from "@/components/ui/performance-overlay";
import { clamp01, smoothstep } from "@/utils/animation";
import { useAppContext } from "@/contexts/useAppContext";
import { TrailStepper } from "./TrailStepper";

export const PhilosophyReveal = () => {
  const { setActivePresetIndex } = useAppContext();

  // Section-level fades
  const [revealOpacity, setRevealOpacity] = useState(0);
  const [exitOpacity, setExitOpacity] = useState(1);

  // Snapped (discrete) progress = center of active card
  const [progress, setProgress] = useState(0);

  // Hover-only cosmetics
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Seen gating
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const [allTraversed, setAllTraversed] = useState(false);

  // Stepper UI
  const [stepperOpen, setStepperOpen] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // DOM refs
  const sectionRef = useRef<HTMLDivElement>(null);

  // Metrics cache
  const metricsRef = useRef({ top: 0, total: 1 });

  // Reveal anchor
  const revealCompletedRef = useRef(false);
  const revealStartScrollRef = useRef(0);

  // Render throttling
  const lastRef = useRef({ reveal: 0, exit: 1, progress: 0, activeIndex: 0 });

  // Skip RAF when far
  const isNearRef = useRef(false);

  // Programmatic navigation (stepper click)
  const isProgrammaticScrollRef = useRef(false);
  const lockedIndexRef = useRef<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const rafWatchRef = useRef<number | null>(null);

  const n = philosophyItems.length;

  // --- Helpers ---------------------------------------------------------------

  const internalScrollDistance = () => window.innerHeight * 5;

  const stepMidProgress = (index: number) => (index + 0.5) / n;

  const nearestIndexFromProgress = (p: number) => {
    const idx = Math.round(p * n - 0.5);
    return Math.max(0, Math.min(n - 1, idx));
  };

  const measure = () => {
    const el = sectionRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const top = window.scrollY + rect.top;
    const total = Math.max(1, el.offsetHeight - window.innerHeight);
    metricsRef.current = { top, total };
  };

  const computeSnappedFromScrollY = (scrollY: number) => {
    // During reveal not completed => always show first card
    if (!revealCompletedRef.current) {
      return { idx: 0, snappedP: stepMidProgress(0) };
    }

    const delta = Math.max(0, scrollY - revealStartScrollRef.current);
    const rawP = clamp01(delta / internalScrollDistance());

    const idx = nearestIndexFromProgress(rawP);
    const snappedP = stepMidProgress(idx);
    return { idx, snappedP };
  };

  // Derived active index from snapped progress (or locked)
  const derivedActiveIndex = useMemo(() => {
    return nearestIndexFromProgress(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, n]);

  const effectiveActiveIndex = lockedIndex ?? derivedActiveIndex;

  // Sync active index to particles
  useEffect(() => {
    setActivePresetIndex(effectiveActiveIndex);
  }, [effectiveActiveIndex, setActivePresetIndex]);

  useEffect(() => {
    if (maxSeenIndex >= n - 1) setAllTraversed(true);
  }, [maxSeenIndex, n]);

  // --- Setup observers / resize ---------------------------------------------

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    measure();

    const io = new IntersectionObserver(
      ([entry]) => {
        isNearRef.current = entry.isIntersecting;
      },
      { root: null, threshold: 0, rootMargin: "200px 0px 200px 0px" },
    );

    io.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", measure);
      if (rafWatchRef.current) cancelAnimationFrame(rafWatchRef.current);
    };
  }, []);

  // --- RAF loop --------------------------------------------------------------

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const tickStart = performance.now();
      raf = requestAnimationFrame(tick);

      if (document.hidden) return;
      if (!isNearRef.current) return;

      const el = sectionRef.current;
      if (!el) return;

      const { top, total } = metricsRef.current;

      // Section progress
      const traveled = window.scrollY - top;
      const sectionP = clamp01(traveled / total);

      // Reveal fade in (first 10% of section)
      const reveal = smoothstep(clamp01(sectionP / 0.1));

      // Exit fade out (near end)
      const startFade = 0.93;
      const endFade = 0.98;
      let exit = 1;
      if (sectionP >= endFade) exit = 0;
      else if (sectionP > startFade) {
        const t = (sectionP - startFade) / (endFade - startFade);
        exit = 1 - smoothstep(t);
      }

      // Before reveal completes: lock at first card
      if (reveal < 1) {
        revealCompletedRef.current = false;

        if (
          !isProgrammaticScrollRef.current &&
          lastRef.current.progress !== 0
        ) {
          lastRef.current.progress = 0;
          lastRef.current.activeIndex = 0;
          setProgress(0);
          setMaxSeenIndex(0);
        }
      } else {
        // Capture reveal anchor once
        if (!revealCompletedRef.current) {
          revealCompletedRef.current = true;
          revealStartScrollRef.current = top + 0.1 * total;
        }

        // After reveal: sync snapped step (unless programmatic lock is active)
        if (!isProgrammaticScrollRef.current) {
          const { idx, snappedP } = computeSnappedFromScrollY(window.scrollY);

          if (Math.abs(lastRef.current.progress - snappedP) > 0.0001) {
            lastRef.current.progress = snappedP;
            setProgress(snappedP);
          }

          if (idx !== lastRef.current.activeIndex) {
            lastRef.current.activeIndex = idx;
            setMaxSeenIndex((prev) => Math.max(prev, idx));
          }
        }
      }

      // Thresholded state updates for fades
      if (Math.abs(lastRef.current.reveal - reveal) > 0.01) {
        lastRef.current.reveal = reveal;
        setRevealOpacity(reveal);
      }
      if (Math.abs(lastRef.current.exit - exit) > 0.01) {
        lastRef.current.exit = exit;
        setExitOpacity(exit);
      }

      const tickDuration = performance.now() - tickStart;
      if (tickDuration > 8) {
        reportPerformance("PhilosophyReveal:RAF", tickDuration);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // computeSnappedFromScrollY uses stable refs and is safe to use without deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // --- Rendering helpers -----------------------------------------------------

  const getItemOpacity = (index: number) => {
    if (isProgrammaticScrollRef.current && lockedIndexRef.current !== null) {
      return index === lockedIndexRef.current ? 1 : 0;
    }
    return index === effectiveActiveIndex ? 1 : 0;
  };

  const highlightKeywords = (
    text: string,
    keywords: string[],
    isHovered: boolean,
  ) => {
    if (!keywords.length) return text;

    const pattern = keywords
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const parts = text.split(new RegExp(`(${pattern})`, "gi"));
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
      ),
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
      revealStartScrollRef.current +
      clamp01(targetP) * internalScrollDistance();

    // Enter programmatic lock
    isProgrammaticScrollRef.current = true;
    lockedIndexRef.current = index;
    setLockedIndex(index);

    // Keep visuals consistent immediately
    lastRef.current.progress = targetP;
    setProgress(targetP);
    lastRef.current.activeIndex = index;
    setMaxSeenIndex((prev) => Math.max(prev, index));

    window.scrollTo({ top: targetScroll, behavior: "smooth" });

    const abortOnUserScroll = () => {
      if (!isProgrammaticScrollRef.current) return;
      isProgrammaticScrollRef.current = false;
      lockedIndexRef.current = null;
      setLockedIndex(null);

      const { idx, snappedP } = computeSnappedFromScrollY(window.scrollY);
      lastRef.current.progress = snappedP;
      lastRef.current.activeIndex = idx;
      setProgress(snappedP);
      setMaxSeenIndex((prev) => Math.max(prev, idx));

      window.removeEventListener("wheel", abortOnUserScroll);
      window.removeEventListener("touchmove", abortOnUserScroll);
    };

    window.addEventListener("wheel", abortOnUserScroll, { passive: true });
    window.addEventListener("touchmove", abortOnUserScroll, { passive: true });

    cancelWatch();
    const EPS = 6;
    const MAX_MS = 1200;
    const startTime = performance.now();

    const watch = () => {
      const dist = Math.abs(window.scrollY - targetScroll);
      const timedOut = performance.now() - startTime > MAX_MS;

      if (dist <= EPS || timedOut) {
        isProgrammaticScrollRef.current = false;
        lockedIndexRef.current = null;
        setLockedIndex(null);

        const { idx, snappedP } = computeSnappedFromScrollY(window.scrollY);
        lastRef.current.progress = snappedP;
        lastRef.current.activeIndex = idx;
        setProgress(snappedP);
        setMaxSeenIndex((prev) => Math.max(prev, idx));

        window.removeEventListener("wheel", abortOnUserScroll);
        window.removeEventListener("touchmove", abortOnUserScroll);
        return;
      }

      rafWatchRef.current = requestAnimationFrame(watch);
    };

    rafWatchRef.current = requestAnimationFrame(watch);
  };

  // --- JSX ------------------------------------------------------------------

  return (
    <section ref={sectionRef} className="min-h-[700vh] relative -mt-[100vh]">
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

        {/* Headline - becomes visible only at end */}
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

        {/* Stepper */}
        <div
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-10"
          style={{ opacity: exitOpacity }}
        >
          <TrailStepper
            items={philosophyItems}
            activeIndex={effectiveActiveIndex}
            maxSeenIndex={maxSeenIndex}
            allTraversed={allTraversed}
            onStepClick={handleStepperClick}
          />
        </div>

        {/* Background glow */}
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

        {/* Items */}
        <div
          className="max-w-4xl w-full relative px-4"
          style={{ minHeight: "380px", opacity: exitOpacity, zIndex: 20 }}
        >
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            const isHovered = hoveredIndex === index;
            const isActive = index === effectiveActiveIndex;

            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center cursor-default"
                style={{
                  opacity,
                  transform: `translateY(${isActive ? 0 : 25}px)`,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex flex-col items-center text-center max-w-2xl relative">
                  <h3
                    className={`text-base md:text-lg uppercase tracking-[0.15em] font-medium mb-4 relative z-10 transition-all duration-500 ${
                      isHovered ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {item.title}
                  </h3>

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
                      isHovered,
                    )}
                  </blockquote>

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
