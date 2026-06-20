import { useEffect, useRef, useState } from "react";
import { AnimatedSubtitle } from "@/components/ui/animated-subtitle";
import { reportPerformance } from "@/components/ui/performance-overlay";

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Pause expensive decoration animations (shimmer, orbits, aurora) when the
  // hero is scrolled out of view. CSS animations otherwise keep compositing
  // in the background, eating frame budget and slowing scrollY reads in
  // other sections' RAF loops.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      // Generous margin so we don't thrash on the boundary.
      { root: null, threshold: 0, rootMargin: "100px 0px 100px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setIsVisible(true);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    // Throttle mousemove with rAF
    let scheduled = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Only process if hero section is visible
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible) return; // Skip if not visible

      lastX = e.clientX;
      lastY = e.clientY;

      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        const t0 = performance.now();
        scheduled = false;
        if (!textRef.current) {
          reportPerformance("HeroSection:mouse", performance.now() - t0);
          return;
        }

        const { innerWidth, innerHeight } = window;
        const xOffset = (lastX / innerWidth - 0.5) * 20;
        const yOffset = (lastY / innerHeight - 0.5) * 15;

        textRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        reportPerformance("HeroSection:mouse", performance.now() - t0);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-screen flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      {/* Decorative tech grid floor */}
      <div aria-hidden className="tech-grid" />

      {/* Aurora beam — drifts slowly behind the name */}
      <div
        aria-hidden
        className="aurora-beam"
        data-paused={!isInView || undefined}
      />

      {/* Soft halo behind the name — adds depth without color noise */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity ease-smooth ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: "min(72vw, 900px)",
          height: "min(40vh, 420px)",
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.10) 0%, hsl(var(--primary) / 0.04) 35%, transparent 70%)",
          filter: "blur(8px)",
          transitionDuration: "1400ms",
        }}
      />

      {/* Orbital rings around the name */}
      <div
        aria-hidden
        data-paused={!isInView || undefined}
        className={`pointer-events-none absolute inset-0 transition-opacity ease-smooth ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transitionDuration: "1600ms",
          // Soft vertical mask: open at top (so rings continue into elastic
          // scroll), fading just before philosophy starts to avoid bleed.
          maskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
        }}
      >
        {/* Outer — wide, slow, gentle shimmer running along the wire */}
        <div
          className="orbital-ring orbital-ring--slow"
          style={{ width: "min(120vw, 1400px)", height: "min(120vw, 1400px)" }}
        >
          <div
            className="orbital-ring__shimmer"
            style={{
              ["--cycle" as string]: "42s",
              ["--arc" as string]: "62deg",
              ["--hue" as string]: "205",
              ["--cdelay" as string]: "0s",
            } as React.CSSProperties}
          />
        </div>

        {/* Middle — primary ring with a bright node + a slow shimmer */}
        <div
          className="orbital-ring"
          style={{ width: "min(86vw, 980px)", height: "min(86vw, 980px)" }}
        >
          <div className="orbital-ring__nodes">
            <div
              className="node"
              style={{
                ["--a" as string]: "0deg",
                ["--s" as string]: "9px",
              } as React.CSSProperties}
            />
          </div>
          <div
            className="orbital-ring__shimmer"
            style={{
              ["--cycle" as string]: "32s",
              ["--arc" as string]: "46deg",
              ["--hue" as string]: "200",
              ["--cdelay" as string]: "-6s",
            } as React.CSSProperties}
          />
        </div>

        {/* Inner — tighter, counter-rotating, cool-hued node + cool shimmer */}
        <div
          className="orbital-ring"
          style={{
            width: "min(56vw, 620px)",
            height: "min(56vw, 620px)",
            animationDirection: "reverse",
            animationDuration: "55s",
            borderColor: "hsl(var(--primary) / 0.10)",
          }}
        >
          <div className="orbital-ring__nodes">
            <div
              className="node"
              style={{
                ["--a" as string]: "120deg",
                ["--s" as string]: "7px",
                ["--c-h" as string]: "210",
                ["--c-l" as string]: "80%",
                ["--d" as string]: "0.6s",
              } as React.CSSProperties}
            />
          </div>
          <div
            className="orbital-ring__shimmer"
            style={{
              ["--cycle" as string]: "24s",
              ["--arc" as string]: "38deg",
              ["--hue" as string]: "215",
              ["--cdelay" as string]: "-3s",
            } as React.CSSProperties}
          />
        </div>
      </div>

      <div
        ref={textRef}
        className="relative text-center transition-transform duration-700 ease-smooth"
      >
        {/* Eyebrow — small editorial label */}
        <div
          className={`mb-6 md:mb-8 flex items-center justify-center gap-3 transition-all duration-1000 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="text-[10px] font-body uppercase tracking-[0.4em] text-muted-foreground/70">
            Portfolio &nbsp;·&nbsp; 2026
          </span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
        </div>

        <h1
          className={`font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 transition-all duration-1000 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ textShadow: "0 0 60px hsl(var(--primary) / 0.08)" }}
        >
          <span className="block bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent font-extralight tracking-wider mb-1">
            Lorenzo
          </span>
          <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-normal tracking-tight">
            Perrier de La Bâthie
          </span>
        </h1>

        {/* Hairline divider with center diamond */}
        <div
          className={`mx-auto mb-6 flex items-center justify-center gap-3 transition-all duration-1000 delay-200 ease-smooth ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          <span className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-foreground/20 to-primary/30" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
          <span className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent via-foreground/20 to-primary/30" />
        </div>

        <div
          className={`transition-all duration-1000 delay-300 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <AnimatedSubtitle />
        </div>

        {/* Availability chip — quiet, persistent personal hook */}
        <div
          data-hero-chip
          className={`mt-10 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/40 px-3 py-1.5 backdrop-blur-sm transition-all duration-1000 delay-500 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="relative flex h-2 w-2 items-center justify-center">
            {/* Soft outer glow halo */}
            <span className="absolute h-3.5 w-3.5 rounded-full bg-primary/30 blur-[3px]" />
            {/* Expanding ping ring */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/80" />
            {/* Bright flickering core */}
            <span className="animate-status-flicker relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-[10px] font-body uppercase tracking-[0.3em] text-muted-foreground/80">
            Open to opportunities
          </span>
        </div>
      </div>
    </section>
  );
};
