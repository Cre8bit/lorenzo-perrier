import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsTouchDevice } from "@/hooks/use-touch-device";

type Chapter = {
  id: string;
  label: string;
  route?: string; // Optional route for navigation
};

const chapters: Chapter[] = [
  { id: "cube-space", label: "CubeSpace", route: "/cubespace" },
  { id: "home", label: "Home", route: "/" },
];

export const LiquidNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialIndex = () => {
    const index = chapters.findIndex((c) => c.route === location.pathname);
    return index >= 0 ? index : 1;
  };

  const isTouch = useIsTouchDevice();
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(getInitialIndex);

  const isActive = isHovered || isTouch;

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const index = chapters.findIndex((c) => c.route === location.pathname);
    setActiveIndex(index >= 0 ? index : 1);
  }, [location.pathname]);

  // refs + measured anchor positions (px)
  const chapterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [anchors, setAnchors] = useState<number[]>([]);

  // Anchor = the X position where the droplet's RIGHT edge should sit, i.e. a
  // constant `DOT_GAP` to the left of each label. We observe just the bar —
  // one target, one callback per layout tick, fired *after* layout commits.
  // That's the only event we actually need: anything that changes the
  // anchors (viewport width, `sm:` padding flip, devtools open/close, font
  // swap) also resizes the bar.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const measure = () => {
      const barLeft = bar.getBoundingClientRect().left;
      const DOT_GAP = 10;

      const nextAnchors = chapters.map((_, i) => {
        const btn = chapterRefs.current[i];
        if (!btn) return 0;
        return Math.max(0, btn.getBoundingClientRect().left - barLeft - DOT_GAP);
      });

      setAnchors((prev) =>
        prev.length === nextAnchors.length &&
        prev.every((v, i) => v === nextAnchors[i])
          ? prev
          : nextAnchors,
      );
    };

    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  // Droplet snaps to the active label's anchor — no slide, no animation.
  const dropletLeft = anchors[activeIndex] ?? 0;

  return (
    <div
      className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={barRef}
        className="mobile-no-blur liquid-glass-fx relative px-7 sm:px-10 py-3.5 sm:py-5 rounded-full cursor-pointer overflow-hidden transition-all duration-700 ease-smooth min-w-[260px] sm:min-w-[360px]"
        style={{
          background: isActive
            ? "linear-gradient(135deg, hsla(185, 50%, 55%, 0.12) 0%, hsla(220, 20%, 4%, 0.6) 50%, hsla(185, 50%, 55%, 0.08) 100%)"
            : "linear-gradient(135deg, hsla(185, 50%, 55%, 0.02) 0%, hsla(220, 20%, 4%, 0.15) 50%, hsla(185, 50%, 55%, 0.01) 100%)",
          backdropFilter: isActive ? "blur(24px)" : "blur(4px)",
          WebkitBackdropFilter: isActive ? "blur(24px)" : "blur(4px)",
          border: isActive
            ? "1px solid hsla(185, 50%, 55%, 0.2)"
            : "1px solid hsla(185, 50%, 55%, 0.03)",
          boxShadow: isActive
            ? `0 0 60px hsla(185, 50%, 55%, 0.15), 0 0 100px hsla(185, 50%, 55%, 0.08), inset 0 1px 0 hsla(210, 20%, 92%, 0.1)`
            : "0 0 20px hsla(185, 50%, 55%, 0.02)",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* Liquid reveal effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
          style={{
            background: isActive
              ? "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0.15) 0%, transparent 70%)"
              : "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0) 0%, transparent 70%)",
            opacity: isActive ? 1 : 0,
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
            opacity: isActive ? 1 : 0,
          }}
        />

        {/* Chapter markers */}
        <div className="grid grid-cols-2 items-center relative z-10">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className="flex justify-center">
              <button
                ref={(el) => {
                  chapterRefs.current[index] = el;
                }}
                onClick={() => {
                  setActiveIndex(index);
                  if (chapter.route && chapter.route !== location.pathname) {
                    navigate(chapter.route);
                  }
                }}
                className="relative w-fit font-body text-sm tracking-wide transition-all duration-500"
                style={{
                  color:
                    index === activeIndex
                      ? "hsl(210, 20%, 92%)"
                      : isActive
                        ? "hsla(210, 20%, 92%, 0.4)"
                        : "hsla(210, 20%, 92%, 0.15)",
                  textShadow:
                    index === activeIndex && isActive
                      ? "0 0 20px hsla(185, 50%, 55%, 0.5)"
                      : "none",
                }}
              >
                {chapter.label}
              </button>
            </div>
          ))}
        </div>

        {/* Droplet indicator. Right-edge of the dot lands on the measured
            anchor so the gap to the active label stays constant across
            breakpoints and size states. No position animation — it just sits
            next to whichever label is active. */}
        {anchors.length === chapters.length && (
          <div
            className="absolute top-1/2 left-0 rounded-full pointer-events-none"
            style={{
              width: isActive ? "10px" : "6px",
              height: isActive ? "10px" : "6px",
              background: isActive
                ? "linear-gradient(135deg, hsl(185, 50%, 55%) 0%, hsla(185, 50%, 55%, 0.6) 100%)"
                : "hsla(185, 50%, 55%, 0.3)",
              boxShadow: isActive
                ? `0 0 20px hsla(185, 50%, 55%, 0.6), 0 0 40px hsla(185, 50%, 55%, 0.3), inset 0 1px 2px hsla(210, 20%, 92%, 0.3)`
                : "0 0 10px hsla(185, 50%, 55%, 0.1)",
              transform: `translate3d(${dropletLeft}px, -50%, 0) translateX(-100%)`,
            }}
          />
        )}

        {/* Track line */}
        <div
          className="absolute left-7 right-7 sm:left-10 sm:right-10 top-1/2 h-px -translate-y-1/2 pointer-events-none transition-opacity duration-700"
          style={{
            marginTop: "18px",
            background:
              "linear-gradient(90deg, transparent 0%, hsla(185, 50%, 55%, 0.15) 20%, hsla(185, 50%, 55%, 0.15) 80%, transparent 100%)",
            opacity: isActive ? 1 : 0.2,
          }}
        />
      </div>

      {/* Hint text — desktop only (touch users see this bar as always-active) */}
      <p
        className="hidden sm:block text-center mt-4 font-body text-xs tracking-widest uppercase transition-all duration-700"
        style={{
          color: "hsla(210, 20%, 92%, 0.2)",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateY(0)" : "translateY(-4px)",
        }}
      >
        tap to navigate
      </p>
    </div>
  );
};
