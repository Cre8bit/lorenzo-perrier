import { useEffect, useMemo, useRef, useState } from "react";
import { philosophyItems } from "./PhilosophyData";

export const PhilosophyReveal = () => {
  // Reveal opacity (0..1) based on entering the section
  const [revealOpacity, setRevealOpacity] = useState(0);

  // Single rendered progress for internal transitions (0..1) after reveal completes
  const [progress, setProgress] = useState(0);

  // Hover & manual scrolling helpers
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // "Seen" tracking (kept as state because it’s UX / gating)
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);

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

  const n = philosophyItems.length;

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const smoothstep = (t: number) => {
    t = clamp01(t);
    return t * t * (3 - 2 * t);
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
  const internalScrollDistance = () => window.innerHeight * 4;

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
        tickingRef.current = false;

        const op = computeRevealOpacity(el);
        setRevealOpacity(op);

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
          revealStartScrollRef.current = window.scrollY;

          progressRef.current = 0;
          setProgress(0);

          // We consider first item "seen" once reveal completed
          setMaxSeenIndex((prev) => Math.max(prev, 0));
          return;
        }

        // After reveal: sync internal progress (skip if programmatic lock is active)
        if (!isProgrammaticScrollRef.current) {
          syncProgressFromScroll();
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
    const overlap = itemRange * 0.04; // tune 0.02–0.08
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

    const EPS_OPACITY = 0.03; // tune 0.02–0.06
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
    if (index > maxSeenIndex) return;

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
      className="min-h-[600vh] relative"
    >
      {/* Sticky container */}
      <div
        className="sticky top-0 h-screen flex items-center justify-center px-8 transition-opacity duration-500 ease-linear"
        style={{ opacity: revealOpacity }}
      >
        {/* Headline */}
        <h2
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-body text-xs tracking-[0.3em] uppercase text-foreground/70 top-40 text-center transition-opacity duration-500 ease-linear z-20"
          style={{ opacity: revealOpacity }}
        >
          What I Build
        </h2>

        {/* Progress indicators with titles */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          {philosophyItems.map((item, index) => {
            const isActive = index === effectiveActiveIndex;
            const hasBeenSeen = index <= maxSeenIndex;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 group ${
                  hasBeenSeen ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() => handleStepperClick(index)}
              >
                <div
                  className="rounded-full overflow-hidden bg-primary/10 transition-all duration-400 group-hover:bg-primary/20"
                  style={{
                    width: isActive ? "6px" : "4px",
                    height: isActive ? "40px" : "32px",
                  }}
                >
                  <div
                    className="w-full bg-primary/60 rounded-full group-hover:bg-primary/80"
                    style={{
                      height:
                        index === effectiveActiveIndex
                          ? "100%"
                          : index < effectiveActiveIndex
                          ? "100%"
                          : "0%",
                      opacity: index === effectiveActiveIndex ? 1 : 0.4,
                      transition: "all 0.4s ease-out",
                    }}
                  />
                </div>

                <span
                  className={`hidden md:block text-sm font-light transition-all duration-300 whitespace-nowrap ${
                    hasBeenSeen
                      ? isActive
                        ? "text-foreground/90 opacity-100"
                        : "text-muted-foreground/40 opacity-70 group-hover:opacity-100 group-hover:text-muted-foreground/60"
                      : "opacity-0"
                  }`}
                >
                  {hasBeenSeen && `0${index + 1}. ${item.title}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Central container */}
        <div
          className="max-w-2xl w-full relative"
          style={{ minHeight: "300px" }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / ${
                0.05 + progress * 0.1
              }) 0%, transparent 70%)`,
              transform: `scale(${1 + progress * 0.2})`,
              transition: "transform 0.3s ease-out",
            }}
          />

          {/* Items */}
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 cursor-default"
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 20}px) scale(${
                    0.95 + opacity * 0.05
                  })`,
                  pointerEvents: opacity > 0.5 ? "auto" : "none",
                  // Keep transform transition, but avoid opacity transition (opacity is derived each frame)
                  transition: "transform 0.2s ease-out",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Number */}
                <span
                  className="text-8xl font-extralight text-primary/10 mb-4"
                  style={{
                    transform: `translateY(${(1 - opacity) * -20}px)`,
                    transition: "transform 0.3s ease-out",
                  }}
                >
                  0{index + 1}
                </span>

                {/* Subtitle */}
                <span className="text-xs uppercase tracking-[0.3em] text-primary/60 mb-4">
                  {item.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-3xl font-light text-foreground mb-6">
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-lg font-light leading-relaxed max-w-md transition-all duration-700 ${
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
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <span
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground/40 writing-mode-vertical"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              opacity: revealOpacity,
              transition: "opacity 0.5s linear",
            }}
          >
            Philosophy
          </span>
        </div>
      </div>
    </section>
  );
};
