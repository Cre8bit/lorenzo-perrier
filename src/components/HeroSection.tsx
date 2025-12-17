import { useEffect, useRef, useState } from "react";
import { AnimatedSubtitle } from "./AnimatedSubtitle";

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Throttle mousemove with rAF
    let scheduled = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        if (!textRef.current) return;

        const { innerWidth, innerHeight } = window;
        const xOffset = (lastX / innerWidth - 0.5) * 20;
        const yOffset = (lastY / innerHeight - 0.5) * 15;

        textRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
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
      <div
        ref={textRef}
        className="text-center transition-transform duration-700 ease-smooth"
      >
        <h1
          className={`font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 transition-all duration-1000 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="block bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent font-extralight tracking-wider mb-1">
            Lorenzo
          </span>
          <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-normal tracking-tight">
            Perrier de La Bâthie
          </span>
        </h1>

        <div
          className={`transition-all duration-1000 delay-300 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <AnimatedSubtitle />
        </div>
      </div>
    </section>
  );
};
