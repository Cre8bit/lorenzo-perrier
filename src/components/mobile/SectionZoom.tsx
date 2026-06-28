import { useCallback, useRef, type ReactNode } from "react";
import { useScrollDriven } from "@/hooks/use-scroll-driven";

interface SectionZoomProps {
  children: ReactNode;
  className?: string;
  /** Min scale at the edge of viewport (default 0.86). */
  minScale?: number;
  /** Min opacity at the edge (default 0.45). */
  minOpacity?: number;
  /** Disable transform (e.g. prefers-reduced-motion). */
  disabled?: boolean;
}

/**
 * Scroll-driven scale/opacity wrapper. Only animates on entrance; once the
 * element passes viewport center we hold it at rest so it doesn't appear to
 * shrink/fade as the user scrolls past.
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

  const apply = useCallback(
    (_p: number, outer: HTMLElement) => {
      const inner = innerRef.current;
      if (!inner) return;
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const below = Math.max(0, (center - vh / 2) / (vh * 0.6));
      const eased = Math.min(1, below) ** 2;
      const scale = 1 - (1 - minScale) * eased;
      const opacity = 1 - (1 - minOpacity) * eased;
      inner.style.transform = `translate3d(0,0,0) scale(${scale.toFixed(4)})`;
      inner.style.opacity = opacity.toFixed(3);
    },
    [minScale, minOpacity],
  );

  useScrollDriven(outerRef, apply, { disabled });

  return (
    <div ref={outerRef} className={className}>
      <div
        ref={innerRef}
        style={{ transformOrigin: "center center" }}
      >
        {children}
      </div>
    </div>
  );
};

export default SectionZoom;
