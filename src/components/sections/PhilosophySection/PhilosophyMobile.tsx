import { useEffect, useRef, useState } from "react";
import { philosophy } from "@/data/profile";

/**
 * Mobile philosophy reveal — compact liquid-glass banners that slide
 * in from alternating sides as they enter the viewport. Short, calm,
 * and easy to scan on a phone.
 */

const TINTS = [
  { tag: "01", color: "hsl(185 60% 60%)" },
  { tag: "02", color: "hsl(50 70% 62%)" },
  { tag: "03", color: "hsl(280 55% 70%)" },
  { tag: "04", color: "hsl(155 55% 60%)" },
];

interface BannerProps {
  index: number;
  title: string;
  short: string;
}

const Banner = ({ index, title, short }: BannerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const fromLeft = index % 2 === 0;
  const tint = TINTS[index % TINTS.length];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex w-full ${fromLeft ? "justify-start pr-6" : "justify-end pl-6"}`}
    >
      <article
        className="relative w-[88%] rounded-[28px] overflow-hidden transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: visible
            ? "translateX(0) scale(1)"
            : `translateX(${fromLeft ? "-40%" : "40%"}) scale(0.96)`,
          opacity: visible ? 1 : 0,
          background:
            "linear-gradient(135deg, hsla(0,0%,100%,0.05) 0%, hsla(0,0%,100%,0.02) 100%)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
          border: "1px solid hsla(0,0%,100%,0.08)",
          boxShadow: `0 20px 50px -20px ${tint.color
            .replace("hsl(", "hsla(")
            .replace(")", ",0.25)")}, inset 0 1px 0 hsla(0,0%,100%,0.06)`,
        }}
      >
        {/* Edge accent */}
        <span
          aria-hidden
          className={`absolute top-0 bottom-0 w-[3px] ${fromLeft ? "left-0" : "right-0"} rounded-full`}
          style={{
            background: `linear-gradient(180deg, transparent, ${tint.color}, transparent)`,
            opacity: 0.55,
          }}
        />
        {/* Soft highlight blob */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
          style={{ background: tint.color, opacity: 0.12 }}
        />

        <div className="relative px-6 py-6 flex flex-col gap-2">
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
          <h3 className="font-display text-[1.35rem] leading-tight">{title}</h3>
          <p
            className="text-base italic leading-snug text-foreground/85"
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
    <section className="relative w-full">
      <div className="px-6 pt-20 pb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
          The way I build
        </p>
        <h2 className="font-display text-3xl mt-3 leading-tight">
          Four ideas behind every product.
        </h2>
      </div>

      <div className="flex flex-col gap-5 pb-10">
        {philosophy.map((p, i) => (
          <Banner key={p.title} index={i} title={p.title} short={p.short} />
        ))}
      </div>
    </section>
  );
};

export default PhilosophyMobile;