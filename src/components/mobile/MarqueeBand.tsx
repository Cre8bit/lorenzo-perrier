import { useEffect, useRef, type ReactNode } from "react";

interface MarqueeBandProps {
  children: ReactNode;
  /** Seconds per full loop. */
  speed?: number;
  reverse?: boolean;
  className?: string;
  /** Gap between items + trailing pad on each lane (CSS length). */
  itemGap?: string;
  /** Pause animation while offscreen to save battery. */
  pauseWhenOffscreen?: boolean;
}

export const MarqueeBand = ({
  children,
  speed = 28,
  reverse = false,
  className = "",
  itemGap = "3rem",
  pauseWhenOffscreen = true,
}: MarqueeBandProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pauseWhenOffscreen) return;
    const el = ref.current;
    if (!el) return;
    const lane = el.firstElementChild as HTMLElement | null;
    const io = new IntersectionObserver(
      ([entry]) => {
        const state = entry.isIntersecting ? "running" : "paused";
        if (lane) lane.style.animationPlayState = state;
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
        className="flex w-max will-change-transform"
        style={{
          animation: `marquee-x ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {[0, 1].map((lane) => (
          <div
            key={lane}
            className="flex shrink-0 items-center"
            style={{ gap: itemGap, paddingRight: itemGap }}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
};

interface BannerMarqueeProps {
  children: ReactNode;
  speed?: number;
  itemGap?: string;
}

/** Highlighted/bordered marquee strip — used as the hero & KPI ribbons. */
export const BannerMarquee = ({
  children,
  speed = 24,
  itemGap = "1.75rem",
}: BannerMarqueeProps) => (
  <div
    className="relative py-3.5 overflow-hidden border-y border-primary/15"
    style={{
      background:
        "linear-gradient(90deg, hsl(var(--primary) / 0.10), hsl(var(--primary) / 0.02) 35%, hsl(var(--primary) / 0.02) 65%, hsl(var(--primary) / 0.10))",
    }}
    aria-hidden
  >
    <span
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.55), transparent)",
      }}
    />
    <span
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), transparent)",
      }}
    />
    <MarqueeBand
      speed={speed}
      itemGap={itemGap}
      className="[mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] [-webkit-mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]"
    >
      {children}
    </MarqueeBand>
  </div>
);

export default MarqueeBand;
