import { MapPin } from "lucide-react";
import { profile } from "@/data/profile";

const QUOTE =
  "I'm drawn to teams building ambitious products, where AI systems move from experimentation to real-world impact.";

interface HeroSectionProps {
  showSticky: boolean;
  heroSentinelRef: React.RefObject<HTMLDivElement>;
}

const ExperienceHero = ({ showSticky, heroSentinelRef }: HeroSectionProps) => (
  <section className="mb-20">
    <div className="relative rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 backdrop-blur-sm border border-border/20 p-8 md:p-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Image */}
        <img
          src="Lorenzo_in_vietnam.jpg"
          alt={profile.name.first}
          className="w-40 h-40 rounded-2xl object-cover border border-primary/20 shadow-xl"
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
                <span className="mx-2">·</span>
                <span className="text-muted-foreground">{profile.seeking}</span>
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
            <div className="text-2xl md:text-3xl font-display text-primary">
              {h.label}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {h.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ExperienceHero;
