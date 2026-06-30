import { useEffect, useRef, useState } from "react";
import { philosophy } from "@/data/profile";

const TINTS = [
  { tag: "01", color: "hsl(185 60% 60%)" },
  { tag: "02", color: "hsl(50 70% 62%)" },
  { tag: "03", color: "hsl(280 55% 70%)" },
  { tag: "04", color: "hsl(155 55% 60%)" },
];

const tintA = (hsl: string, a: number) =>
  hsl.replace("hsl(", "hsla(").replace(")", ` / ${a})`);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Two-way reveal via IntersectionObserver. The class flips on intersection
 *  changes only (no per-frame scroll work). CSS transitions handle a single
 *  blur + transform + opacity pass between two static states, which is far
 *  cheaper than recomputing filter blur every scroll frame. */
const useRevealToggle = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  /* Symmetrically shrink the IO viewport so both entry and exit fire while
   * the element is still comfortably on screen — otherwise scroll-up exit
   * lags until the card has nearly left the viewport. */
  rootMargin = "-12% 0px -22% 0px",
) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setRevealed(entry.isIntersecting);
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return revealed;
};

interface BannerProps {
  index: number;
  title: string;
  short: string;
}

const Banner = ({ index, title, short }: BannerProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealed = useRevealToggle(wrapRef);
  const fromLeft = index % 2 === 0;
  const tint = TINTS[index % TINTS.length];

  return (
    <div
      ref={wrapRef}
      className={`flex w-full px-5 ${fromLeft ? "justify-start" : "justify-end"}`}
    >
      <article
        className="relative w-[86%] rounded-[20px] overflow-hidden philo-card"
        data-revealed={revealed ? "true" : "false"}
        data-from={fromLeft ? "left" : "right"}
        style={{
          background: `
            radial-gradient(120% 140% at ${fromLeft ? "0% 0%" : "100% 0%"}, ${tintA(tint.color, 0.22)} 0%, ${tintA(tint.color, 0.06)} 38%, transparent 72%),
            radial-gradient(90% 120% at ${fromLeft ? "100% 100%" : "0% 100%"}, ${tintA(tint.color, 0.12)} 0%, transparent 58%),
            linear-gradient(135deg, hsla(0,0%,100%,0.05) 0%, hsla(0,0%,100%,0.015) 55%, hsla(0,0%,100%,0.03) 100%),
            hsla(220, 25%, 8%, 0.55)
          `,
          border: `1px solid ${tintA(tint.color, 0.18)}`,
          boxShadow: `0 10px 24px -20px ${tintA(tint.color, 0.32)}, inset 0 1px 0 hsla(0,0%,100%,0.07)`,
        }}
      >
        {/* Single static top highlight — no mix-blend, no animated filter. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${tintA(tint.color, 0.4)} 30%, ${tintA(tint.color, 0.4)} 70%, transparent)`,
          }}
        />

        <div className="relative px-4 py-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-semibold tracking-[0.3em] uppercase px-1.5 py-0.5 rounded-full"
              style={{
                color: tintA(tint.color, 0.9),
                background: `linear-gradient(135deg, ${tintA(tint.color, 0.14)}, ${tintA(tint.color, 0.04)})`,
                border: `1px solid ${tintA(tint.color, 0.22)}`,
              }}
            >
              {tint.tag}
            </span>
            <span
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${tintA(tint.color, 0.35)}, transparent)`,
              }}
            />
          </div>
          <h3
            className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] leading-tight"
            style={{ color: tintA(tint.color, 0.95) }}
          >
            {title}
          </h3>
          <p
            className="text-[16px] italic leading-snug text-foreground relative pl-5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 text-[28px] leading-none font-serif"
              style={{
                color: tintA(tint.color, 0.55),
                fontFamily: "Georgia, serif",
                top: "0.15em",
              }}
            >
              “
            </span>
            {short}
          </p>
        </div>
      </article>
    </div>
  );
};

const PhilosophyHeader = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const revealed = useRevealToggle(wrapRef, "-8% 0px -18% 0px");
  return (
    <div ref={wrapRef} className="px-6 pb-6 overflow-hidden philo-header" data-revealed={revealed ? "true" : "false"}>
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70 philo-header-eyebrow">
        Principles
      </p>
      <h2 className="font-display text-[2rem] mt-3 leading-[1.05] philo-header-title">
        How I build.
      </h2>
    </div>
  );
};

export const PhilosophyMobile = () => (
  <section
    className="relative w-full overflow-hidden philo-mobile"
    style={{
      background:
        "radial-gradient(120% 80% at 10% 0%, hsl(185 60% 30% / 0.10), transparent 60%), radial-gradient(140% 90% at 90% 100%, hsl(260 55% 35% / 0.10), transparent 60%)",
    }}
  >
    <PhilosophyHeader />
    <div className="flex flex-col gap-3 pb-12">
      {philosophy.map((p, i) => (
        <Banner
          key={p.title}
          index={i}
          title={p.title}
          short={p.short}
        />
      ))}
    </div>
  </section>
);

export default PhilosophyMobile;
