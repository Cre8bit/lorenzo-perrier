import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { carouselContexts, sectionTitle } from "./CarouselData";

const TINTS = [
  {
    border: "hsla(50,40%,58%,0.35)",
    glow: "hsla(50,35%,42%,0.18)",
    accent: "hsl(50 70% 62%)",
  },
  {
    border: "hsla(200,25%,60%,0.35)",
    glow: "hsla(200,22%,44%,0.18)",
    accent: "hsl(200 60% 68%)",
  },
  {
    border: "hsla(240,28%,66%,0.35)",
    glow: "hsla(240,26%,50%,0.18)",
    accent: "hsl(240 55% 75%)",
  },
];

/**
 * Mobile carousel — native horizontal scroll-snap row.
 * Swipe is the correct gesture here (per UX guidelines), and we keep
 * the rest of the page on a normal vertical scroll. Each card is
 * tap-to-flip so the back details are reachable without hover.
 */
export const CarouselMobile = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const center = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i] as HTMLElement;
          const c = child.offsetLeft + child.offsetWidth / 2;
          const d = Math.abs(c - center);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        setActiveIndex(best);
      });
    };
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
    <section className="relative w-full pt-24 pb-20">
      <div className="px-6 mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
          Applied
        </p>
        <h2 className="font-display text-3xl mt-3 leading-tight">
          {sectionTitle}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Swipe through · tap a card to flip.
        </p>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 px-6"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
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
              className="snap-center shrink-0 w-[82vw] max-w-[360px] aspect-[3/4] rounded-2xl text-left relative"
              style={{ perspective: 1200 }}
              aria-label={`${ctx.title}, tap to ${isFlipped ? "show summary" : "show details"}`}
            >
              <div
                className="absolute inset-0 transition-transform duration-700"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* FRONT */}
                <div
                  className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between border bg-background/60"
                  style={{
                    backfaceVisibility: "hidden",
                    borderColor: tint.border,
                    boxShadow: `0 30px 60px -30px ${tint.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] uppercase tracking-[0.3em]"
                        style={{ color: tint.accent }}
                      >
                        {String(i + 1).padStart(2, "0")} / {carouselContexts.length}
                      </span>
                      <ArrowUpRight
                        className="w-4 h-4"
                        style={{ color: tint.accent }}
                      />
                    </div>
                    <h3 className="font-display text-2xl mt-6 leading-tight">
                      {ctx.title}
                    </h3>
                    <p className="mt-4 text-sm text-foreground/75 leading-relaxed">
                      {ctx.problem}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {ctx.signals.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-border/40 text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {ctx.companyLine && (
                      <p
                        className="text-[11px] tracking-wide pt-3 border-t border-border/30"
                        style={{ color: tint.accent }}
                      >
                        {ctx.companyLine}
                      </p>
                    )}
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-3">
                      Tap to flip →
                    </p>
                  </div>
                </div>

                {/* BACK */}
                <div
                  className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between border bg-background/70"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderColor: tint.border,
                    boxShadow: `0 30px 60px -30px ${tint.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
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
                          className="text-sm text-foreground/80 leading-relaxed flex gap-3"
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

      {/* Dot indicator */}
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
    </section>
  );
};

export default CarouselMobile;