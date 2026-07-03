import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

interface ScrollTransitionProps {
  children?: React.ReactNode;
}

export const ScrollTransition: React.FC<ScrollTransitionProps> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  // The scroll handler is created once on mount, so it must read visibility
  // through a ref — reading the state directly would capture the initial
  // `false` forever and the progress animation would never run.
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Skip expensive calculations when not visible
      if (!isVisibleRef.current) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Calculate progress from when element enters view to when it's mostly scrolled
      const start = windowHeight;
      const end = -elementHeight * 0.9;
      const current = elementTop;

      const progress = Math.min(
        Math.max((start - current) / (start - end), 0),
        1,
      );
      setScrollProgress(progress);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        setIsVisible(entry.isIntersecting);
        // Sync progress the moment we become visible so the first painted
        // frame isn't stale.
        if (entry.isIntersecting) handleScroll();
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[5vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Converging lines animation */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left line */}
        <div
          className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{
            width: `${30 + scrollProgress * 20}%`,
            transform: `translateY(-50%) translateX(${scrollProgress * 50}%)`,
            opacity: isVisible ? 0.6 : 0,
            transition: "opacity 500ms ease",
          }}
        />

        {/* Right line */}
        <div
          className="absolute right-0 top-1/2 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent"
          style={{
            width: `${30 + scrollProgress * 20}%`,
            transform: `translateY(-50%) translateX(${-scrollProgress * 50}%)`,
            opacity: isVisible ? 0.6 : 0,
            transition: "opacity 500ms ease",
          }}
        />
      </div>

      {/* Pulsing center indicator */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="relative"
          style={{
            transform: `scale(${0.8 + scrollProgress * 0.2}) rotate(${scrollProgress * 90}deg)`,
            opacity: isVisible ? 0.3 + scrollProgress * 0.7 : 0,
            transition: "opacity 400ms ease",
          }}
        >
          <div className="liquid-glass-fx relative w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center backdrop-blur-sm bg-background/20">
            <Sparkles className="w-5 h-5 text-primary/60 relative z-10" />
          </div>

          {/* Ripple effect */}
          <div
            className="absolute inset-0 rounded-full border border-primary/10 animate-ping"
            style={{ animationDuration: "2s" }}
          />
        </div>

        {/* Scroll prompt */}
        <div
          className="flex flex-col items-center gap-2 text-muted-foreground/50"
          style={{
            opacity: isVisible ? Math.max(0, 1 - scrollProgress) : 0,
            transform: `translateY(${scrollProgress * 20}px)`,
            transition: "opacity 300ms ease",
          }}
        >
          <span className="text-xs tracking-widest uppercase">
            Discover more
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {children}
    </div>
  );
};
