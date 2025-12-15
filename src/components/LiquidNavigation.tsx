import { useState, useRef, useEffect, useLayoutEffect } from "react";

const chapters = [
  { id: "learn-more", label: "Learn More" },
  { id: "home", label: "Home" },
  { id: "astrolab", label: "Astrolab" },
];

export const LiquidNavigation = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const barRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);

  // NEW: refs + measured anchor positions (px)
  const chapterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [anchors, setAnchors] = useState<number[]>([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  // NEW: measure each chapter button position and place droplet "left of label"
  useLayoutEffect(() => {
    const measure = () => {
      if (!barRef.current) return;

      const barRect = barRef.current.getBoundingClientRect();
      const DOT_GAP = 18; // distance from label to droplet (tweak)

      const nextAnchors = chapters.map((_, i) => {
        const btn = chapterRefs.current[i];
        if (!btn) return 0;

        const r = btn.getBoundingClientRect();
        const leftInsideBar = r.left - barRect.left; // px inside bar
        return Math.max(0, leftInsideBar - DOT_GAP);
      });

      setAnchors(nextAnchors);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current || anchors.length === 0) return;

      const rect = barRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // snap to closest anchor
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < anchors.length; i++) {
        const d = Math.abs(x - anchors[i]);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }

      setActiveIndex(nearest);
      setDragOffset(x - anchors[nearest]); // liquid offset while dragging
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset(0);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, anchors]);

  // NEW: droplet uses measured px anchor instead of percentage
  const dropletLeft = (anchors[activeIndex] ?? 0) + dragOffset;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={barRef}
        className="relative px-10 py-5 rounded-full cursor-pointer overflow-hidden transition-all duration-700 ease-smooth"
        style={{
          minWidth: "360px",
          background: isHovered
            ? "linear-gradient(135deg, hsla(185, 50%, 55%, 0.12) 0%, hsla(220, 20%, 4%, 0.6) 50%, hsla(185, 50%, 55%, 0.08) 100%)"
            : "linear-gradient(135deg, hsla(185, 50%, 55%, 0.02) 0%, hsla(220, 20%, 4%, 0.15) 50%, hsla(185, 50%, 55%, 0.01) 100%)",
          backdropFilter: isHovered ? "blur(24px)" : "blur(4px)",
          WebkitBackdropFilter: isHovered ? "blur(24px)" : "blur(4px)",
          border: isHovered
            ? "1px solid hsla(185, 50%, 55%, 0.2)"
            : "1px solid hsla(185, 50%, 55%, 0.03)",
          boxShadow: isHovered
            ? `0 0 60px hsla(185, 50%, 55%, 0.15), 0 0 100px hsla(185, 50%, 55%, 0.08), inset 0 1px 0 hsla(210, 20%, 92%, 0.1)`
            : "0 0 20px hsla(185, 50%, 55%, 0.02)",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* Liquid reveal effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
          style={{
            background: isHovered
              ? "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0.15) 0%, transparent 70%)"
              : "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0) 0%, transparent 70%)",
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Glass flare sweep */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(105deg, transparent 30%, hsla(185, 50%, 70%, 0.15) 45%, hsla(210, 20%, 92%, 0.1) 50%, transparent 55%)",
            transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
            transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, hsla(185, 50%, 55%, 0.12) 0%, transparent 60%)",
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Chapter markers */}
        <div className="flex justify-between relative z-10">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              ref={(el) => (chapterRefs.current[index] = el)}
              onClick={() => setActiveIndex(index)}
              className="relative font-body text-sm tracking-wide transition-all duration-500"
              style={{
                color:
                  index === activeIndex
                    ? "hsl(210, 20%, 92%)"
                    : isHovered
                    ? "hsla(210, 20%, 92%, 0.4)"
                    : "hsla(210, 20%, 92%, 0.15)",
                textShadow:
                  index === activeIndex && isHovered
                    ? "0 0 20px hsla(185, 50%, 55%, 0.5)"
                    : "none",
              }}
            >
              {chapter.label}
            </button>
          ))}
        </div>

        {/* Liquid droplet indicator: only render when anchors are measured */}
        {anchors.length === chapters.length && (
          <div
            ref={dropletRef}
            className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all ${
              isDragging ? "duration-75" : "duration-500"
            }`}
            style={{
              left: dropletLeft,
              width: isHovered ? "10px" : "6px",
              height: isHovered ? "10px" : "6px",
              background: isHovered
                ? "linear-gradient(135deg, hsl(185, 50%, 55%) 0%, hsla(185, 50%, 55%, 0.6) 100%)"
                : "hsla(185, 50%, 55%, 0.3)",
              boxShadow: isHovered
                ? `0 0 20px hsla(185, 50%, 55%, 0.6), 0 0 40px hsla(185, 50%, 55%, 0.3), inset 0 1px 2px hsla(210, 20%, 92%, 0.3)`
                : "0 0 10px hsla(185, 50%, 55%, 0.1)",
              transform: isDragging
                ? "translateY(-50%) scale(1.5)"
                : "translateY(-50%) scale(1)",
              opacity: anchors.length === chapters.length ? 1 : 0,
              transitionProperty:
                "left, width, height, background, box-shadow, transform, opacity",
            }}
            onMouseDown={handleMouseDown}
          >
            {isDragging && (
              <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            )}
          </div>
        )}

        {/* Track line */}
        <div
          className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 pointer-events-none transition-opacity duration-700"
          style={{
            marginTop: "18px",
            background:
              "linear-gradient(90deg, transparent 0%, hsla(185, 50%, 55%, 0.15) 20%, hsla(185, 50%, 55%, 0.15) 80%, transparent 100%)",
            opacity: isHovered ? 1 : 0.2,
          }}
        />
      </div>

      {/* Hint text */}
      <p
        className="text-center mt-4 font-body text-xs tracking-widest uppercase transition-all duration-700"
        style={{
          color: "hsla(210, 20%, 92%, 0.2)",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        drag to explore
      </p>
    </div>
  );
};
