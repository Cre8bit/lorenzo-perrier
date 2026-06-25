import { useEffect, useRef, type ReactNode } from "react";

interface MarqueeBandProps {
  children: ReactNode;
  /** seconds per full loop */
  speed?: number;
  /** Reverse direction. */
  reverse?: boolean;
  className?: string;
  /** Pause when offscreen (default true). */
  pauseWhenOffscreen?: boolean;
}

/**
 * Lightweight CSS-only marquee. Renders children twice for seamless loop.
 * Pauses (animation-play-state) when scrolled offscreen to save battery.
 */
export const MarqueeBand = ({
  children,
  speed = 28,
  reverse = false,
  className = "",
  pauseWhenOffscreen = true,
}: MarqueeBandProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pauseWhenOffscreen) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        el.style.setProperty(
          "animation-play-state",
          entry.isIntersecting ? "running" : "paused",
        );
        const lane = el.firstElementChild as HTMLElement | null;
        if (lane)
          lane.style.animationPlayState = entry.isIntersecting
            ? "running"
            : "paused";
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pauseWhenOffscreen]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="flex w-max gap-12 will-change-transform"
        style={{
          animation: `marquee-x ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12">{children}</div>
      </div>
    </div>
  );
};

export default MarqueeBand;