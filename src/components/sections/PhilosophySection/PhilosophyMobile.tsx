import { philosophy } from "@/data/profile";
import SectionZoom from "@/components/mobile/SectionZoom";

/**
 * Mobile philosophy reveal — no scroll-jacking, no canvas particle
 * field. Each value is a full-bleed stanza with a colored accent that
 * alternates to create a visual rhythm as you scroll past.
 */

const TINTS = [
  { tag: "01", color: "hsl(185 60% 60%)", soft: "hsla(185,60%,60%,0.10)" },
  { tag: "02", color: "hsl(50 70% 62%)", soft: "hsla(50,70%,62%,0.10)" },
  { tag: "03", color: "hsl(280 55% 70%)", soft: "hsla(280,55%,70%,0.10)" },
  { tag: "04", color: "hsl(155 55% 60%)", soft: "hsla(155,55%,60%,0.10)" },
];

export const PhilosophyMobile = () => {
  return (
    <section className="relative w-full">
      {/* Section heading */}
      <div className="px-6 pt-24 pb-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary/70">
          The way I build
        </p>
        <h2 className="font-display text-3xl mt-3 leading-tight">
          Four ideas that shape every product I ship.
        </h2>
      </div>

      <div className="flex flex-col">
        {philosophy.map((p, i) => {
          const tint = TINTS[i % TINTS.length];
          return (
            <SectionZoom
              key={p.title}
              className="w-full"
              minScale={0.92}
              minOpacity={0.35}
            >
              <article
                className="relative w-full px-6 py-16 overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, ${tint.soft} 50%, transparent 100%)`,
                }}
              >
                {/* Oversized index — editorial backdrop */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-2 font-display text-[8rem] leading-none opacity-[0.06] select-none"
                  style={{ color: tint.color }}
                >
                  {tint.tag}
                </div>

                <div className="relative flex flex-col gap-4 max-w-[36ch]">
                  <div className="flex items-center gap-3">
                    <span
                      className="block w-8 h-px"
                      style={{ background: tint.color }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: tint.color }}
                    >
                      {tint.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl leading-snug">
                    {p.title}
                  </h3>
                  <p
                    className="text-lg italic leading-relaxed text-foreground/80"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    “{p.short}”
                  </p>
                </div>
              </article>
            </SectionZoom>
          );
        })}
      </div>
    </section>
  );
};

export default PhilosophyMobile;