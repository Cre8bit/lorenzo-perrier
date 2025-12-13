import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Show after user stays on page for a few seconds
    const showTimer = setTimeout(() => setIsVisible(true), 3000);

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHasScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (hasScrolled) return null;

  return (
    <div
      className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-20 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
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
    </div>
  );
};