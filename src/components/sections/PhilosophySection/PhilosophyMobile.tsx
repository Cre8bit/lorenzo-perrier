import { useCallback, useRef } from "react";
import { philosophy } from "@/data/profile";
import {
  useScrollDriven,
  easeOutCubic,
} from "@/hooks/use-scroll-driven";

const TINTS = [
  { tag: "01", color: "hsl(185 60% 60%)" },
  { tag: "02", color: "hsl(50 70% 62%)" },
  { tag: "03", color: "hsl(280 55% 70%)" },
  { tag: "04", color: "hsl(155 55% 60%)" },
];

const tintA = (hsl: string, a: number) =>
  hsl.replace("hsl(", "hsla(").replace(")", ` / ${a})`);

const SHORT: Record<string, string> = {
  "Systems & Architecture": "Built to scale, made to last.",
  "User-Centered Systems": "Production is the product.",
  "AI in Production": "AI in systems — not notebooks.",
  "Reactivity & Adaptation": "Systems learn by listening.",
};

/** Slide a heading in from the left as it scrolls into view. */
const useSlideHorizontal = (
  ref: React.RefObject<HTMLElement>,
  distance: number,
  leadVh = 0.7,
) => {
  const apply = useCallback(
    (p: number, el: HTMLElement) => {
      const e = easeOutCubic(p);
      const tx = (1 - e) * -distance;
      const blur = (1 - e) * 4;
      el.style.transform = `translate3d(${tx}%, 0, 0)`;
      el.style.opacity = (0.1 + e * 0.9).toFixed(3);
      el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : "none";
    },
    [distance],
  );
  useScrollDriven(ref, apply, { leadVh });
};

interface BannerProps {
  index: number;
  title: string;
  short: string;
}

const Banner = ({ index, title, short }: BannerProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fromLeft = index % 2 === 0;
  const tint = TINTS[index % TINTS.length];

  const apply = useCallback(
    (p: number) => {
      const card = cardRef.current;
      if (!card) return;
      const e = easeOutCubic(p);
      const translateX = (1 - e) * (fromLeft ? -38 : 38);
      const scale = 0.94 + e * 0.06;
      const opacity = 0.15 + e * 0.85;
      const blur = (1 - e) * 6;
      card.style.transform = `translate3d(${translateX}%, ${(1 - e) * 14}px, 0) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : "none";
    },
    [fromLeft],
  );

  useScrollDriven(wrapRef, apply, { leadVh: 0.65, rootMargin: "20% 0px 20% 0px" });

  return (
    <div
      ref={wrapRef}
      className={`flex w-full px-5 ${fromLeft ? "justify-start" : "justify-end"}`}
    >
      <article
        ref={cardRef}
        className="liquid-glass-fx relative w-[86%] rounded-[20px] overflow-hidden"
        style={{
          background: `
            radial-gradient(120% 140% at ${fromLeft ? "0% 0%" : "100% 0%"}, ${tintA(tint.color, 0.18)} 0%, ${tintA(tint.color, 0.05)} 38%, transparent 72%),
            radial-gradient(90% 120% at ${fromLeft ? "100% 100%" : "0% 100%"}, ${tintA(tint.color, 0.1)} 0%, transparent 58%),
            linear-gradient(135deg, hsla(0,0%,100%,0.07) 0%, hsla(0,0%,100%,0.02) 55%, hsla(0,0%,100%,0.04) 100%)
          `,
          backdropFilter: "blur(22px) saturate(155%)",
          WebkitBackdropFilter: "blur(22px) saturate(155%)",
          border: `1px solid ${tintA(tint.color, 0.14)}`,
          boxShadow: `0 14px 32px -22px ${tintA(tint.color, 0.28)}, inset 0 1px 0 hsla(0,0%,100%,0.08), inset 0 0 0 1px hsla(0,0%,100%,0.03)`,
          willChange: "transform, opacity, filter",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(${fromLeft ? "115deg" : "245deg"}, ${tintA(tint.color, 0.12)} 0%, transparent 45%)`,
            mixBlendMode: "screen",
          }}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute ${fromLeft ? "-top-16 -left-10" : "-top-16 -right-10"} w-40 h-40 rounded-full blur-3xl`}
          style={{ background: tint.color, opacity: 0.15 }}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute ${fromLeft ? "-bottom-20 -right-16" : "-bottom-20 -left-16"} w-44 h-44 rounded-full blur-3xl`}
          style={{ background: tint.color, opacity: 0.07 }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${tintA(tint.color, 0.35)} 30%, ${tintA(tint.color, 0.35)} 70%, transparent)`,
          }}
        />

        <div className="relative px-4 py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-semibold tracking-[0.3em] uppercase px-1.5 py-0.5 rounded-full"
              style={{
                color: tintA(tint.color, 0.9),
                background: `linear-gradient(135deg, ${tintA(tint.color, 0.12)}, ${tintA(tint.color, 0.03)})`,
                border: `1px solid ${tintA(tint.color, 0.2)}`,
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
          <h3 className="font-display text-[1.1rem] leading-[1.15]">{title}</h3>
          <p
            className="text-[13px] italic leading-snug text-foreground/80"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            “{short}”
          </p>
        </div>
      </article>
    </div>
  );
};

const PhilosophyHeader = () => {
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useSlideHorizontal(eyebrowRef, 60, 0.55);
  useSlideHorizontal(titleRef, 80, 0.75);
  return (
    <div className="px-6 pb-6 overflow-hidden">
      <p
        ref={eyebrowRef}
        className="text-[11px] uppercase tracking-[0.3em] text-primary/70"
        style={{ willChange: "transform, opacity, filter" }}
      >
        Principles
      </p>
      <h2
        ref={titleRef}
        className="font-display text-[2rem] mt-3 leading-[1.05]"
        style={{ willChange: "transform, opacity, filter" }}
      >
        How I build.
      </h2>
    </div>
  );
};

export const PhilosophyMobile = () => (
  <section
    className="relative w-full overflow-hidden"
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
          short={SHORT[p.title] ?? p.short}
        />
      ))}
    </div>
  </section>
);

export default PhilosophyMobile;
