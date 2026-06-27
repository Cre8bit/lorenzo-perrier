import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { carouselContexts } from "./CarouselData";
import {
  useScrollDriven,
  easeOutCubic,
} from "@/hooks/use-scroll-driven";

const TINTS = [
  {
    header: "linear-gradient(160deg, hsl(48 72% 70%) 0%, hsl(38 80% 62%) 100%)",
    border: "hsla(46,55%,60%,0.45)",
    glow: "hsla(46,55%,50%,0.22)",
    accent: "hsl(46 75% 65%)",
    chipBg: "hsla(46,60%,60%,0.16)",
    chipBorder: "hsla(46,55%,60%,0.35)",
  },
  {
    header: "linear-gradient(160deg, hsl(205 55% 68%) 0%, hsl(220 50% 55%) 100%)",
    border: "hsla(210,45%,62%,0.45)",
    glow: "hsla(210,45%,50%,0.22)",
    accent: "hsl(210 60% 72%)",
    chipBg: "hsla(210,55%,62%,0.16)",
    chipBorder: "hsla(210,45%,62%,0.35)",
  },
  {
    header: "linear-gradient(160deg, hsl(265 50% 72%) 0%, hsl(250 45% 58%) 100%)",
    border: "hsla(258,40%,66%,0.45)",
    glow: "hsla(258,40%,52%,0.22)",
    accent: "hsl(258 55% 76%)",
    chipBg: "hsla(258,50%,66%,0.16)",
    chipBorder: "hsla(258,40%,66%,0.35)",
  },
];

/**
 * Slide-in from the right; plays once, then detaches its listeners.
 * `gate: false` because the target's own transform pushes it offscreen-right
 * — an IO on the same element would report not-intersecting and never
 * trigger the return slide.
 */
const useSlideFromRight = (
  ref: React.RefObject<HTMLElement>,
  distance: number,
  leadVh: number,
) => {
  const apply = useCallback(
    (p: number, el: HTMLElement) => {
      const e = easeOutCubic(p);
      el.style.transform = `translate3d(${((1 - e) * distance).toFixed(2)}%, 0, 0)`;
      el.style.opacity = (0.1 + e * 0.9).toFixed(3);
    },
    [distance],
  );
  useScrollDriven(ref, apply, { leadVh, settleOnce: true, gate: false });
};

export const CarouselMobile = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const rowWrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useSlideFromRight(titleRef, 70, 0.55);
  useSlideFromRight(rowWrapRef, 110, 0.75);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let lastBest = -1;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const half = el.clientWidth / 2;
        const center = el.scrollLeft + half;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const c = child.offsetLeft + child.offsetWidth / 2;
          const signed = (c - center) / half;
          const absOff = Math.min(1, Math.abs(signed));
          // marginTop (not transform) so it doesn't fight the card's
          // perspective + rotateY flip on the same element.
          child.style.marginTop = `${Math.round(absOff * 10)}px`;
          child.style.opacity = (1 - absOff * 0.4).toFixed(3);
          const d = Math.abs(c - center);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        if (best !== lastBest) {
          lastBest = best;
          setActiveIndex(best);
        }
      });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const toggleFlip = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section className="relative w-full pb-20 overflow-hidden">
      <div
        ref={titleRef}
        className="px-6 mb-8"
        style={{ willChange: "transform, opacity" }}
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
          Work
        </p>
        <h2 className="font-display text-3xl mt-3 leading-tight">
          Where it ships.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">Swipe. Tap to flip.</p>
      </div>

      <div ref={rowWrapRef} style={{ willChange: "transform, opacity" }}>
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-12 pt-4"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            paddingLeft: "10vw",
            paddingRight: "10vw",
          }}
        >
          {carouselContexts.map((ctx, i) => {
            const tint = TINTS[i % TINTS.length];
            const isFlipped = flipped.has(i);
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => toggleFlip(i)}
                className="snap-center shrink-0 w-[80vw] max-w-[340px] aspect-[3/4.4] rounded-[28px] text-left relative"
                style={{
                  transition: "margin-top 300ms ease-out, opacity 300ms ease-out",
                  perspective: 1600,
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={`${ctx.title}, tap to ${isFlipped ? "show summary" : "show details"}`}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                    transition: "transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)",
                    willChange: "transform",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[28px] flex flex-col overflow-hidden border bg-background"
                    style={{
                      borderColor: tint.border,
                      boxShadow: `0 28px 60px -28px ${tint.glow}, 0 2px 10px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "translate3d(0, 0, 0.01px)",
                      WebkitFontSmoothing: "antialiased",
                    }}
                  >
                    <div
                      className="relative h-[42%] flex flex-col justify-between p-5"
                      style={{ background: tint.header }}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.4) 0%, transparent 55%)",
                        }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-black/70 font-medium">
                          {String(i + 1).padStart(2, "0")} / {carouselContexts.length}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-black/70" />
                      </div>
                      <div className="relative">
                        {ctx.companyLine && (
                          <p className="text-[11px] uppercase tracking-[0.22em] text-black/65 font-medium mb-2">
                            {ctx.companyLine}
                          </p>
                        )}
                        <h3 className="font-display text-[1.6rem] leading-[1.05] text-black/85">
                          {ctx.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between p-5">
                      <p className="text-[13.5px] text-foreground/80 leading-relaxed">
                        {ctx.problem}
                      </p>

                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {ctx.signals.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full"
                              style={{
                                background: tint.chipBg,
                                border: `1px solid ${tint.chipBorder}`,
                                color: tint.accent,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <div
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.22em] font-medium"
                          style={{
                            background: tint.chipBg,
                            border: `1px solid ${tint.chipBorder}`,
                            color: tint.accent,
                          }}
                        >
                          View details
                          <span className="text-base leading-none">+</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between border bg-background overflow-hidden"
                    style={{
                      borderColor: tint.border,
                      boxShadow: `0 28px 60px -28px ${tint.glow}, 0 2px 10px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg) translate3d(0, 0, 0.01px)",
                      WebkitFontSmoothing: "antialiased",
                    }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${tint.accent}, transparent)`,
                      }}
                    />
                    <div>
                      <span
                        className="text-[10px] uppercase tracking-[0.3em]"
                        style={{ color: tint.accent }}
                      >
                        {ctx.backTitle}
                      </span>
                      <ul className="mt-5 space-y-3">
                        {ctx.backDetails.map((d, k) => (
                          <li
                            key={k}
                            className="text-[13.5px] text-foreground/80 leading-relaxed flex gap-3"
                          >
                            <span
                              className="flex-shrink-0 mt-2 w-1 h-1 rounded-full"
                              style={{ background: tint.accent }}
                            />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      ← Tap to flip back
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {carouselContexts.map((_, i) => (
            <span
              key={i}
              className="block h-1 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 20 : 6,
                background:
                  i === activeIndex
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CarouselMobile;
