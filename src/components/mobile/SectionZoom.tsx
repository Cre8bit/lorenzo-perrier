import { useEffect, useRef, type ReactNode } from "react";

interface SectionZoomProps {
  children: ReactNode;
  className?: string;
  /** Min scale at the edges of viewport (default 0.86). */
  minScale?: number;
  /** Min opacity at the edges (default 0.45). */
  minOpacity?: number;
  /** Disable transform (e.g. prefers-reduced-motion). */
  disabled?: boolean;
}

/**
 * Scroll-driven scale/opacity wrapper.
 * As the element's center approaches the viewport center, scale → 1
 * and opacity → 1. As it leaves, both fall toward `minScale` / `minOpacity`.
 * Uses a shared rAF loop driven by IntersectionObserver visibility to
 * avoid scroll-handler thrash when offscreen.
 */
export const SectionZoom = ({
  children,
  className = "",
  minScale = 0.86,
  minOpacity = 0.45,
  disabled = false,
}: SectionZoomProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const apply = () => {
      rafRef.current = null;
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      // Distance from viewport center, normalized by half-viewport.
      const d = Math.min(1, Math.abs(center - vh / 2) / (vh * 0.6));
      // Ease — quadratic for a soft hand-off.
      const eased = d * d;
      const scale = 1 - (1 - minScale) * eased;
      const opacity = 1 - (1 - minOpacity) * eased;
      inner.style.transform = `translate3d(0,0,0) scale(${scale.toFixed(4)})`;
      inner.style.opacity = opacity.toFixed(3);
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          schedule();
        }
      },
      { root: null, rootMargin: "40% 0px 40% 0px", threshold: 0 },
    );
    io.observe(outer);

    const onScroll = () => {
      if (visibleRef.current) schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    apply();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [disabled, minScale, minOpacity]);

  return (
    <div ref={outerRef} className={className}>
      <div
        ref={innerRef}
        style={{
          willChange: disabled ? undefined : "transform, opacity",
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SectionZoom;