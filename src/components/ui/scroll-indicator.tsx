import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAppContext } from "@/contexts/useAppContext";

export const ScrollIndicator = () => {
  const { currentSection } = useAppContext();
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);

  // 1) Mark component as "ready" after 10s on the landing page
  const readyTimerRef = useRef<number | null>(null);

  const startReadyTimer = () => {
    // clear existing timer first
    if (readyTimerRef.current) {
      window.clearTimeout(readyTimerRef.current);
    }
    // start a new 10s timer
    readyTimerRef.current = window.setTimeout(() => {
      setReadyToShow(true);
      readyTimerRef.current = null;
    }, 10000) as unknown as number;
  };

  useEffect(() => {
    startReadyTimer();
    return () => {
      if (readyTimerRef.current) {
        window.clearTimeout(readyTimerRef.current);
      }
    };
  }, []);

  // 2) When component becomes ready, show it if we're at the top
  useEffect(() => {
    if (readyToShow && window.scrollY <= 100) {
      setIsVisible(true);
    }
  }, [readyToShow]);

  // 3) Scroll listener: hide when user scrolls down, re-show when they return to top
  useEffect(() => {
    // Only track scroll when in hero section
    if (currentSection !== "hero") {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setHasScrolled(scrolled);

      if (scrolled) {
        // user left the top: hide indicator and reset readiness so it requires 10s again
        setIsVisible(false);
        setReadyToShow(false);
        if (readyTimerRef.current) {
          window.clearTimeout(readyTimerRef.current);
          readyTimerRef.current = null;
        }
      } else {
        // user returned to top
        if (readyToShow) {
          setIsVisible(true);
        } else {
          // if not ready and no timer running, start a fresh 10s timer
          if (!readyTimerRef.current) startReadyTimer();
        }
      }
    };

    // Run once to set initial state according to current scroll
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readyToShow, currentSection]);

  const handleClick = () => {
    // Scroll down by one full viewport height
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
    // hide indicator once user triggers the scroll
    setIsVisible(false);
    // reset readiness so it needs 10s again to reappear
    setReadyToShow(false);
    if (readyTimerRef.current) {
      window.clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to about"
      className="fixed left-1/2 -translate-x-1/2 z-20 transition-all duration-1000 opacity-100 translate-y-0"
      style={{ bottom: "140px" }}
    >
      <div className="flex flex-col items-center gap-3 group cursor-pointer animate-float">
        <span className="text-xs font-body text-muted-foreground/50 tracking-[0.3em] uppercase">
          Scroll
        </span>
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse-glow" />

          {/* Glass container */}
          <div className="relative w-8 h-12 rounded-full border border-primary/20 bg-glass-bg backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {/* Inner glow line */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/10 to-transparent" />

            {/* Animated chevron */}
            <ChevronDown
              className="w-4 h-4 text-primary/60 animate-scroll-bounce"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>
    </button>
  );
};
