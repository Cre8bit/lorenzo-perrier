import { useEffect, useRef, useState } from "react";
import { AnimatedSubtitle } from "@/components/ui/animated-subtitle";
import { reportPerformance } from "@/components/ui/performance-overlay";

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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
