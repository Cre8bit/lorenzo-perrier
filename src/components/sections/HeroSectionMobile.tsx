import { useEffect, useRef, useState } from "react";
import { ArrowDown, MapPin } from "lucide-react";
import { profile } from "@/data/profile";

/**
 * Mobile hero. Reuses the desktop gradient treatment on the name,
 * fits the surname on a single auto-shrunk line, and replaces the
 * marquee with a "tape deck" of stats that auto-cycles. The deck
 * sits well above the bottom liquid nav.
 */
export const HeroSectionMobile = () => {
  const [stat, setStat] = useState(0);
  const total = profile.highlights.length;

  useEffect(() => {
    const id = window.setInterval(() => setStat((s) => (s + 1) % total), 2600);
    return () => window.clearInterval(id);
  }, [total]);

  // Auto-fit surname to one line. We measure parent width and ramp the
  // font-size down until it fits. Cheap, runs once + on resize.
  const surnameRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = surnameRef.current;
    if (!el) return;
    const fit = () => {
      const parent = el.parentElement;
      if (!parent) return;
      // Reset, then shrink until single-line.
      el.style.fontSize = "";
      const maxPx = parseFloat(getComputedStyle(el).fontSize);
      let size = maxPx;
      while (el.scrollWidth > parent.clientWidth && size > 10) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col overflow-hidden">
      {/* Top status chip */}
      <div className="px-6 pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary/80 backdrop-blur-md">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
            style={{ boxShadow: "0 0 6px hsl(var(--primary) / 0.7)" }}
          />
          {profile.title}
        </div>
      </div>

      {/* Name + tagline */}
      <div className="flex-1 px-6 flex flex-col justify-center">
        <h1
          className="font-display leading-[0.9] font-light tracking-tight"
          style={{ textShadow: "0 0 60px hsl(var(--primary) / 0.08)" }}
        >
          <span
            className="block text-[clamp(3rem,14vw,5rem)] bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent font-extralight tracking-wider"
          >
            Lorenzo
          </span>
          <span
            ref={surnameRef}
            className="block whitespace-nowrap text-[clamp(1.4rem,6.4vw,2.2rem)] bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-normal tracking-tight mt-1"
          >
            {profile.name.last}
          </span>
        </h1>

        <p className="mt-5 text-[15px] text-foreground/80 leading-relaxed max-w-[34ch]">
          AI &amp; software engineer — shipping systems that think and scale.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-primary/80">
            <MapPin className="w-3 h-3" />
            {profile.location}
          </span>
          <span className="opacity-40">·</span>
          <span>Open to SF / Bay Area</span>
        </div>
      </div>

      {/* Stats deck — auto-cycling glass card. Sits above the bottom
          liquid nav with safe-area padding. */}
      <div className="px-6 pb-32">
        <div
          className="relative rounded-2xl border border-primary/20 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(220 20% 8% / 0.55) 60%, hsl(var(--primary) / 0.04) 100%)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            boxShadow:
              "0 20px 60px -20px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.06)",
          }}
        >
          {/* Top hairline + drifting accent */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
            }}
          />

          {/* Stat reel */}
          <div className="relative h-[68px] overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateY(${-stat * 68}px)` }}
            >
              {profile.highlights.map((h, i) => (
                <div
                  key={i}
                  className="h-[68px] flex items-center gap-4 px-4"
                >
                  <span
                    className="font-display text-[2rem] leading-none bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent"
                  >
                    {h.label}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.28em] text-foreground/70 leading-tight">
                    {h.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-between items-center px-4 pb-3 pt-1">
            <div className="flex gap-1.5">
              {profile.highlights.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStat(i)}
                  aria-label={`Show stat ${i + 1}`}
                  className="block h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === stat ? 18 : 6,
                    background:
                      i === stat
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                />
              ))}
            </div>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
              In numbers
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex flex-col items-center gap-1.5 mt-6 text-muted-foreground">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSectionMobile;
