import React, { useEffect, useMemo, useRef, useState } from "react";
import { philosophyItems } from "./PhilosophyData";
import { reportPerformance } from "@/components/ui/performance-overlay";
import { clamp01, smoothstep } from "@/utils/animation";
import { useAppContext } from "@/contexts/useAppContext";
import { TrailStepper } from "./TrailStepper";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Quote tokenization ------------------------------------------------------
// The quote is rendered word by word so the active card can stagger-reveal
// its text. A word is a keyword if it overlaps any keyword occurrence, which
// keeps punctuation attached to its word (no orphan commas).

type QuoteToken = { text: string; isKeyword: boolean };

const tokenizeQuote = (text: string, keywords: string[]): QuoteToken[] => {
  const ranges: Array<[number, number]> = [];
  if (keywords.length) {
    const pattern = new RegExp(
      keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "gi",
    );
    for (const m of text.matchAll(pattern)) {
      ranges.push([m.index!, m.index! + m[0].length]);
    }
  }

  const tokens: QuoteToken[] = [];
  for (const m of text.matchAll(/\S+/g)) {
    const start = m.index!;
    const end = start + m[0].length;
    tokens.push({
      text: m[0],
      isKeyword: ranges.some(([a, b]) => start < b && end > a),
    });
  }
  return tokens;
};

const QUOTE_TOKENS = philosophyItems.map((item) =>
  tokenizeQuote(item.description, item.keywords),
);

const QuoteWords = ({
  tokens,
  animate,
  isHovered,
}: {
  tokens: QuoteToken[];
  animate: boolean;
  isHovered: boolean;
}) => (
  <>
    {tokens.map((tok, i) => {
      const keywordClass = tok.isKeyword
        ? `transition-all duration-700 ${
            isHovered
              ? "text-primary/90 drop-shadow-[0_0_8px_rgba(99,179,179,0.4)]"
              : ""
          }`
        : "";
      return (
        <React.Fragment key={i}>
          <span
            className={
              animate ? `word-in ${keywordClass}`.trim() : keywordClass || undefined
            }
            style={animate ? ({ "--wi": i } as React.CSSProperties) : undefined}
          >
            {tok.text}
          </span>{" "}
        </React.Fragment>
      );
    })}
  </>
);

export const PhilosophyReveal = () => {
  const { setActivePresetIndex } = useAppContext();
  const isMobile = useIsMobile();

  // Snapped (discrete) progress = center of active card
  const [progress, setProgress] = useState(0);

  // Hover-only cosmetics
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Seen gating
  const [maxSeenIndex, setMaxSeenIndex] = useState(0);
  const [allTraversed, setAllTraversed] = useState(false);

  // DOM refs
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Metrics cache
  const metricsRef = useRef({ top: 0, total: 1 });

  // Reveal anchor
  const revealCompletedRef = useRef(false);
  const revealStartScrollRef = useRef(0);

  // Render throttling (discrete card-index state only)
  const lastRef = useRef({ progress: 0, activeIndex: 0 });

  const fadesRef = useRef({ reveal: -1, exit: -1 });

  // Skip scroll work when far away
  const isNearRef = useRef(false);

  // Latest scroll-update function, callable from the IO / resize handlers
  const updateRef = useRef<() => void>(() => {});

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
        // Sync immediately on entry so the first painted frame isn't stale.
        if (entry.isIntersecting) updateRef.current();
      },
      { root: null, threshold: 0, rootMargin: "200px 0px 200px 0px" },
    );

    io.observe(el);

    const onResize = () => {
      measure();
      updateRef.current();
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      if (rafWatchRef.current) cancelAnimationFrame(rafWatchRef.current);
    };
  }, []);

  // --- Scroll-driven update ----------------------------------------------------
  // Runs only when the page actually scrolls (rAF-throttled), instead of the
  // previous free-running rAF loop that burned a tick on every frame the
  // section was merely near the viewport.

  useEffect(() => {
    let raf = 0;
    let scheduled = false;

    const update = () => {
      scheduled = false;
      const t0 = performance.now();

      const sticky = stickyRef.current;
      if (!sticky) return;

      const { top, total } = metricsRef.current;

      // Section progress
      const sectionP = clamp01((window.scrollY - top) / total);

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

      // Fades: direct CSS-var writes, no React involved
      if (Math.abs(fadesRef.current.reveal - reveal) > 0.004) {
        fadesRef.current.reveal = reveal;
        sticky.style.setProperty("--pr", reveal.toFixed(3));
      }
      if (Math.abs(fadesRef.current.exit - exit) > 0.004) {
        fadesRef.current.exit = exit;
        sticky.style.setProperty("--px", exit.toFixed(3));
      }

      const duration = performance.now() - t0;
      if (duration > 8) {
        reportPerformance("PhilosophyReveal:scroll", duration);
      }
    };

    updateRef.current = update;

    const onScroll = () => {
      if (scheduled || !isNearRef.current) return;
      scheduled = true;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
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
        ref={stickyRef}
        className="sticky top-0 h-screen flex items-center justify-center px-4 md:px-8 transition-opacity duration-300 ease-linear"
        style={{
          // --pr (reveal) / --px (exit) are written imperatively by the
          // scroll handler; every fade below derives from them via calc().
          opacity: "var(--pr, 0)",
          // Promote the sticky element to its own GPU layer. Without this,
          // Safari paints the whole stack on the CPU during scroll which
          // produces visible jitter (most noticeable during the hero ↔
          // philosophy transition and the snap between philosophy cards).
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          willChange: "transform",
        }}
      >
        {/* Headline - stays visible */}
        <h2
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-body uppercase text-foreground/70 text-center transition-opacity duration-300 ease-linear z-20"
          style={{
            opacity: "var(--pr, 0)",
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
            opacity: "calc(1 - var(--px, 1))",
            top: "calc(var(--section-title-top) + var(--carousel-title-offset))",
            fontSize: "var(--section-title-font-size)",
            letterSpacing: "var(--section-title-tracking)",
            lineHeight: "var(--section-title-line-height)",
            transform: `translateX(-50%)`,
          }}
        >
          Is
        </h2>

        {/* Stepper. Opacity is gated by --orbit-morph-fade (driven by
            OrbitMorph) so the stepper — including the active dot's halo —
            doesn't appear until the morph dots have arrived at their slots. */}
        <div
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-10"
          style={{
            opacity: "calc(var(--px, 1) * var(--orbit-morph-fade, 1))",
          }}
        >
          <TrailStepper
            items={philosophyItems}
            activeIndex={effectiveActiveIndex}
            maxSeenIndex={maxSeenIndex}
            allTraversed={allTraversed}
            onStepClick={handleStepperClick}
          />
        </div>

        {/* Background glow. Static gradient — animating the `background`
            property forced Safari into a full-page repaint every progress
            tick (visible as scroll jitter on the philosophy section). The
            visual delta of the original progress-driven gradient was tiny;
            we trade it for a clean opacity fade. */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 47% at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
            opacity: "calc(var(--pr, 0) * var(--px, 1))",
            zIndex: 10,
          }}
        />

        {/* Items */}
        <div
          className="max-w-4xl w-full relative px-4"
          style={{ minHeight: "380px", opacity: "var(--px, 1)", zIndex: 20 }}
        >
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            const isHovered = isMobile || hoveredIndex === index;
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
                  {/* Index counter — editorial detail */}
                  <span
                    className={`mb-3 text-[10px] font-body tracking-[0.4em] uppercase transition-all duration-500 ${
                      isHovered ? "text-primary/70" : "text-primary/40"
                    }`}
                  >
                    <span
                      key={isActive ? `tick-${index}` : "idle"}
                      className={isActive ? "counter-tick" : undefined}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    / {String(n).padStart(2, "0")}
                  </span>

                  <h3
                    className={`text-base md:text-lg uppercase tracking-[0.15em] font-medium mb-4 relative z-10 transition-all duration-500 ${
                      isHovered ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    <span className="relative">
                      {item.title}
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-px transition-all duration-500"
                        style={{
                          width: isHovered ? "60%" : "30%",
                          background:
                            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.7), transparent)",
                        }}
                      />
                    </span>
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
                    <QuoteWords
                      key={isActive ? `active-${index}` : "idle"}
                      tokens={QUOTE_TOKENS[index]}
                      animate={isActive}
                      isHovered={isHovered}
                    />
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
              opacity: "calc(var(--pr, 0) * var(--px, 1))",
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
