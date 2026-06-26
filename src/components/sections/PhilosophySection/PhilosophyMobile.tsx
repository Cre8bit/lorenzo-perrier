import { useEffect, useRef, useState } from "react";
import { philosophy } from "@/data/profile";

/**
 * Mobile philosophy reveal — scroll-driven liquid-glass slabs.
 * Each banner tracks its own viewport position (rAF-only when visible)
 * so the slide-in / scale / blur ease in *smoothly* rather than
 * snap-on-threshold.
 */

const TINTS = [
  { tag: "01", color: "hsl(185 60% 60%)" },
  { tag: "02", color: "hsl(50 70% 62%)" },
  { tag: "03", color: "hsl(280 55% 70%)" },
  { tag: "04", color: "hsl(155 55% 60%)" },
];

const SHORT: Record<string, string> = {
  "Systems & Architecture": "Built to scale, made to last.",
  "User-Centered Systems": "Production is the product.",
  "AI in Production": "AI in systems — not notebooks.",
  "Reactivity & Adaptation": "Systems learn by listening.",
};

interface BannerProps {
  index: number;
  title: string;
  short: string;
}

const Banner = ({ index, title, short }: BannerProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const fromLeft = index % 2 === 0;
  const tint = TINTS[index % TINTS.length];

  useEffect(() => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;

    let raf: number | null = null;
    const apply = () => {
      raf = null;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      // p ∈ [0,1]: 0 = far below viewport center, 1 = at center, then stays.
      const d = (vh - center) / (vh * 0.65);
      const p = Math.max(0, Math.min(1, d));
      // Ease-out cubic for the soft glide.
      const e = 1 - Math.pow(1 - p, 3);
      const translateX = (1 - e) * (fromLeft ? -38 : 38);
      const scale = 0.94 + e * 0.06;
      const opacity = 0.15 + e * 0.85;
      const blur = (1 - e) * 6;
      card.style.transform = `translate3d(${translateX}%, ${(1 - e) * 14}px, 0) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : "none";
    };

    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) schedule();
      },
      { rootMargin: "20% 0px 20% 0px", threshold: 0 },
    );
    io.observe(wrap);

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
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [fromLeft]);

  return (
    <div
      ref={wrapRef}
      className={`flex w-full ${fromLeft ? "justify-start pr-5" : "justify-end pl-5"}`}
    >
      <article
        ref={cardRef}
        className="liquid-glass-fx relative w-[88%] rounded-[26px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 60%, hsla(0,0%,100%,0.04) 100%)",
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          border: "1px solid hsla(0,0%,100%,0.10)",
          boxShadow: `0 22px 50px -22px ${tint.color
            .replace("hsl(", "hsla(")
            .replace(")", ",0.32)")}, inset 0 1px 0 hsla(0,0%,100%,0.08)`,
          willChange: "transform, opacity, filter",
        }}
      >
        <span
          aria-hidden
          className={`absolute top-0 bottom-0 w-[2px] ${fromLeft ? "left-0" : "right-0"}`}
          style={{
            background: `linear-gradient(180deg, transparent, ${tint.color}, transparent)`,
            opacity: 0.65,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl"
          style={{ background: tint.color, opacity: 0.14 }}
        />

        <div className="relative px-5 py-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: tint.color }}
            >
              {tint.tag}
            </span>
            <span
              className="h-px flex-1"
              style={{
                background: `linear-gradient(90deg, ${tint.color}, transparent)`,
                opacity: 0.4,
              }}
            />
          </div>
          <h3 className="font-display text-[1.3rem] leading-tight">{title}</h3>
          <p
            className="text-[15px] italic leading-snug text-foreground/85"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            “{short}”
          </p>
        </div>
      </article>
    </div>
  );
};

export const PhilosophyMobile = () => {
  return (
    <section
      className="relative w-full"
      style={{
        background:
          "radial-gradient(120% 80% at 10% 0%, hsl(185 60% 30% / 0.10), transparent 60%), radial-gradient(140% 90% at 90% 100%, hsl(260 55% 35% / 0.10), transparent 60%)",
      }}
    >
      <div className="px-6 pt-16 pb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
          How I build
        </p>
        <h2 className="font-display text-[2rem] mt-3 leading-[1.05]">
          Four ideas. Every build.
        </h2>
      </div>

      <div className="flex flex-col gap-4 pb-12">
        {philosophy.map((p, i) => (
          <Banner
            key={p.title}
            index={i}
            title={p.title}
            short={SHORT[p.title] ?? p.short}
          />
        ))}
      </div>
    </section>
  );
};

export default PhilosophyMobile;
