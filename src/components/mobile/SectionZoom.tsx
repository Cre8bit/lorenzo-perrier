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
  const last = useRef({ scale: -1, opacity: -1 });

  const apply = useCallback(
    (_p: number, outer: HTMLElement) => {
      const inner = innerRef.current;
      if (!inner) return;
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const below = Math.max(0, (center - vh / 2) / (vh * 0.6));
      const eased = Math.min(1, below) ** 2;
      // Quantize so at-rest frames (eased = 0, the common case while
      // scrolling past) skip the style write entirely.
      const scale = Math.round((1 - (1 - minScale) * eased) * 400) / 400;
      const opacity = Math.round((1 - (1 - minOpacity) * eased) * 200) / 200;
      if (scale === last.current.scale && opacity === last.current.opacity)
        return;
      last.current.scale = scale;
      last.current.opacity = opacity;
      inner.style.transform = `translate3d(0,0,0) scale(${scale})`;
      inner.style.opacity = String(opacity);
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
