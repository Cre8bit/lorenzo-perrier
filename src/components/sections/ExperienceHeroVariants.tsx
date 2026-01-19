import { MapPin, Github, Linkedin, Mail, Download } from "lucide-react";
import { profile } from "@/data/profile";

const QUOTE = "I'm drawn to teams building ambitious products, where AI systems move from experimentation to real-world impact.";

interface HeroVariantProps {
  showSticky: boolean;
  heroSentinelRef: React.RefObject<HTMLDivElement>;
}

// Variant A: Split Layout - Name left, quote right, KPIs bottom
export const HeroVariantA = ({ showSticky, heroSentinelRef }: HeroVariantProps) => (
  <section className="mb-20">
    <div className="grid md:grid-cols-2 gap-12 items-start">
      {/* Left Column */}
      <div>
        <div
          className="mb-6 transition-all duration-500 ease-out"
          style={{
            opacity: showSticky ? 0 : 1,
            transform: showSticky ? "translateY(-8px)" : "translateY(0)",
          }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-medium leading-tight">
            {profile.name.first}
          </h1>
          <p className="text-muted-foreground text-lg mt-2">{profile.title}</p>
        </div>

        <div ref={heroSentinelRef} className="h-px w-full" />

        <div
          className="flex items-center gap-2 text-sm text-primary mb-6 mt-6 transition-all duration-500 ease-out"
          style={{
            opacity: showSticky ? 0 : 1,
            transform: showSticky ? "translateY(-8px)" : "translateY(0)",
          }}
        >
          <MapPin className="w-3 h-3" />
          <span>{profile.location}</span>
          <span className="mx-2">·</span>
          <span className="text-muted-foreground">{profile.seeking}</span>
        </div>

        <p className="text-xl font-light text-foreground/90 leading-relaxed">
          {profile.summary}
        </p>
      </div>

      {/* Right Column - Quote + Image */}
      <div className="flex flex-col items-end gap-8">
        <img
          src="Lorenzo_in_vietnam.jpg"
          alt={profile.name.first}
          className="w-32 h-32 rounded-full object-cover border-2 border-primary/20 shadow-lg"
        />
        
        <blockquote className="relative pl-6 border-l-2 border-primary/30 italic text-lg text-foreground/80 leading-relaxed">
          "{QUOTE}"
        </blockquote>
      </div>
    </div>

    {/* KPIs - Full width bottom */}
    <div className="flex flex-wrap justify-between gap-6 mt-12 pt-8 border-t border-border/20">
      {profile.highlights.map((h, i) => (
        <div key={i} className="flex flex-col">
          <span className="text-3xl font-display text-primary">{h.label}</span>
          <span className="text-sm text-muted-foreground mt-1">{h.description}</span>
        </div>
      ))}
    </div>
  </section>
);

// Variant B: Stacked Centered - Minimal, centered, quote as subtitle
export const HeroVariantB = ({ showSticky, heroSentinelRef }: HeroVariantProps) => (
  <section className="mb-20 text-center">
    <div className="max-w-3xl mx-auto">
      <img
        src="Lorenzo_in_vietnam.jpg"
        alt={profile.name.first}
        className="w-28 h-28 rounded-full object-cover border-2 border-primary/20 shadow-lg mx-auto mb-8"
      />
      
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: showSticky ? 0 : 1,
          transform: showSticky ? "translateY(-8px)" : "translateY(0)",
        }}
      >
        <h1 className="font-display text-5xl md:text-6xl font-medium">
          {profile.name.first} {profile.name.last}
        </h1>
        <p className="text-muted-foreground text-lg mt-3">{profile.title}</p>
      </div>

      <div ref={heroSentinelRef} className="h-px w-full" />

      <div className="flex items-center justify-center gap-2 text-sm text-primary my-6">
        <MapPin className="w-3 h-3" />
        <span>{profile.location}</span>
        <span className="mx-2">·</span>
        <span className="text-muted-foreground">{profile.seeking}</span>
      </div>

      <p className="text-xl font-light text-foreground/90 leading-relaxed mb-6">
        {profile.summary}
      </p>

      {/* Quote as highlighted text */}
      <p className="text-lg text-primary/80 font-light italic">
        "{QUOTE}"
      </p>

      {/* KPIs as inline badges */}
      <div className="flex flex-wrap justify-center gap-6 mt-10">
        {profile.highlights.map((h, i) => (
          <div key={i} className="px-4 py-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/20">
            <span className="text-2xl font-display text-primary">{h.label}</span>
            <span className="text-sm text-muted-foreground ml-2">{h.description}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Variant C: Card Style - Contained glass card with everything
export const HeroVariantC = ({ showSticky, heroSentinelRef }: HeroVariantProps) => (
  <section className="mb-20">
    <div className="relative rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-8 md:p-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Image */}
        <img
          src="Lorenzo_in_vietnam.jpg"
          alt={profile.name.first}
          className="w-36 h-36 rounded-2xl object-cover border border-primary/20 shadow-xl"
        />

        {/* Content */}
        <div className="flex-1">
          <div
            className="transition-all duration-500 ease-out"
            style={{
              opacity: showSticky ? 0 : 1,
              transform: showSticky ? "translateY(-8px)" : "translateY(0)",
            }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-medium">
              {profile.name.first}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-muted-foreground">{profile.title}</p>
              <span className="w-1 h-1 rounded-full bg-primary/50" />
              <div className="flex items-center gap-1 text-sm text-primary">
                <MapPin className="w-3 h-3" />
                <span>{profile.location}</span>
              </div>
            </div>
          </div>

          <div ref={heroSentinelRef} className="h-px w-full" />

          <p className="text-lg text-foreground/90 leading-relaxed mt-6 max-w-2xl">
            {profile.summary}
          </p>

          {/* Quote with different styling */}
          <div className="mt-6 flex items-start gap-3">
            <div className="w-1 h-16 bg-gradient-to-b from-primary to-primary/20 rounded-full flex-shrink-0" />
            <p className="text-base text-foreground/70 italic leading-relaxed">
              {QUOTE}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs at bottom of card */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/20">
        {profile.highlights.map((h, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl md:text-3xl font-display text-primary">{h.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{h.description}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Variant D: Asymmetric - Large quote, compact info
export const HeroVariantD = ({ showSticky, heroSentinelRef }: HeroVariantProps) => (
  <section className="mb-20">
    {/* Top row: Name + Image */}
    <div className="flex items-center justify-between mb-8">
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: showSticky ? 0 : 1,
          transform: showSticky ? "translateY(-8px)" : "translateY(0)",
        }}
      >
        <h1 className="font-display text-4xl md:text-5xl font-medium">
          {profile.name.first}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="text-muted-foreground">{profile.title}</span>
          <span className="text-border">|</span>
          <span className="text-primary flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {profile.location}
          </span>
        </div>
      </div>

      <img
        src="Lorenzo_in_vietnam.jpg"
        alt={profile.name.first}
        className="w-20 h-20 rounded-full object-cover border border-primary/20"
      />
    </div>

    <div ref={heroSentinelRef} className="h-px w-full" />

    {/* Large quote - hero element */}
    <blockquote className="text-3xl md:text-4xl font-display font-light leading-snug text-foreground/90 my-8">
      "{QUOTE}"
    </blockquote>

    {/* Summary + KPIs side by side */}
    <div className="grid md:grid-cols-[2fr,1fr] gap-8 items-start">
      <p className="text-lg text-muted-foreground leading-relaxed">
        {profile.summary}
      </p>

      <div className="flex flex-col gap-4">
        {profile.highlights.map((h, i) => (
          <div key={i} className="flex items-baseline gap-3">
            <span className="text-2xl font-display text-primary">{h.label}</span>
            <span className="text-xs text-muted-foreground">{h.description}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Variant E: Horizontal Flow - Everything in a horizontal rhythm
export const HeroVariantE = ({ showSticky, heroSentinelRef }: HeroVariantProps) => (
  <section className="mb-20">
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-end justify-between gap-8 pb-6 border-b border-border/20">
        <div className="flex items-center gap-6">
          <img
            src="Lorenzo_in_vietnam.jpg"
            alt={profile.name.first}
            className="w-24 h-24 rounded-xl object-cover border border-primary/20"
          />
          <div
            className="transition-all duration-500 ease-out"
            style={{
              opacity: showSticky ? 0 : 1,
              transform: showSticky ? "translateY(-8px)" : "translateY(0)",
            }}
          >
            <h1 className="font-display text-4xl font-medium">{profile.name.first}</h1>
            <p className="text-muted-foreground mt-1">{profile.title}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-primary">
          <MapPin className="w-3 h-3" />
          <span>{profile.location}</span>
          <span className="mx-2 text-border">·</span>
          <span className="text-muted-foreground">{profile.seeking}</span>
        </div>
      </div>

      <div ref={heroSentinelRef} className="h-px w-full" />

      {/* Content grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="md:col-span-2">
          <p className="text-xl font-light text-foreground/90 leading-relaxed mb-6">
            {profile.summary}
          </p>
          <p className="text-base text-foreground/60 italic border-l-2 border-primary/30 pl-4">
            {QUOTE}
          </p>
        </div>

        {/* KPIs column */}
        <div className="space-y-4 md:pl-8 md:border-l border-border/20">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Impact</h3>
          {profile.highlights.map((h, i) => (
            <div key={i}>
              <div className="text-2xl font-display text-primary">{h.label}</div>
              <div className="text-xs text-muted-foreground">{h.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// Export all variants for easy switching
export const heroVariants = {
  A: HeroVariantA,
  B: HeroVariantB,
  C: HeroVariantC,
  D: HeroVariantD,
  E: HeroVariantE,
};

export type HeroVariant = keyof typeof heroVariants;
