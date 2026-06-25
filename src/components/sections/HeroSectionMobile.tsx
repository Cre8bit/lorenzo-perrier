import { ArrowDown, MapPin, Sparkles } from "lucide-react";
import { profile } from "@/data/profile";
import MarqueeBand from "@/components/mobile/MarqueeBand";

/**
 * Full-bleed mobile hero. No scroll-jacking, no heavy backdrops —
 * the GlobalBackground already handles the particle atmosphere.
 * KPIs flow as a marquee ribbon at the bottom for movement
 * without animating the whole layout.
 */
export const HeroSectionMobile = () => {
  return (
    <section className="relative w-full min-h-[100svh] flex flex-col">
      {/* Top status chip */}
      <div className="px-6 pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary/80">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
            style={{ boxShadow: "0 0 6px hsl(var(--primary) / 0.7)" }}
          />
          {profile.title}
        </div>
      </div>

      {/* Name + tagline */}
      <div className="flex-1 px-6 flex flex-col justify-center">
        <h1 className="font-display text-[clamp(2.6rem,11vw,4.2rem)] leading-[0.95] font-medium">
          {profile.name.first}
          <br />
          <span className="text-foreground/60 font-light">
            {profile.name.last}
          </span>
        </h1>

        <p className="mt-6 text-base text-foreground/80 leading-relaxed max-w-[34ch]">
          {profile.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-primary/80">
            <MapPin className="w-3 h-3" />
            {profile.location}
          </span>
          <span className="opacity-40">·</span>
          <span>{profile.seeking}</span>
        </div>
      </div>

      {/* KPI marquee — replaces a static row with a constantly-moving
          ribbon. Provides visual rhythm without per-element animation. */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.45), transparent)",
          }}
        />
        <MarqueeBand speed={32} className="py-5">
          {profile.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-baseline gap-3 whitespace-nowrap"
            >
              <span className="font-display text-2xl text-primary">
                {h.label}
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {h.description}
              </span>
              <Sparkles className="w-3 h-3 text-primary/40" />
            </div>
          ))}
        </MarqueeBand>
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.25), transparent)",
          }}
        />
      </div>

      {/* Scroll hint */}
      <div className="flex flex-col items-center gap-2 pb-10 text-muted-foreground">
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSectionMobile;