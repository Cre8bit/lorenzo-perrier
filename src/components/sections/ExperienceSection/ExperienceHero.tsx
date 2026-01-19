import { MapPin } from "lucide-react";
import { profile } from "@/data/profile";
import { useEffect, useState, useRef } from "react";

const QUOTE =
  "I'm drawn to teams building ambitious products, where AI systems move from experimentation to real-world impact.";

interface HeroSectionProps {
  showSticky: boolean;
  heroSentinelRef: React.RefObject<HTMLDivElement>;
}

// Animated KPI component
const AnimatedKPI = ({
  label,
  description,
  delay,
}: {
  label: string;
  description: string;
  delay: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Parse label to extract number and suffix (e.g., "3+" -> 3, "+")
  const match = label.match(/^(\d+)(.*)$/);
  const targetValue = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : label;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: smooth deceleration
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(easeOutExpo * targetValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, targetValue]);

  return (
    <div
      ref={ref}
      className="text-center transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
      }}
    >
      <div
        className="text-2xl md:text-3xl font-display text-primary transition-all duration-500"
        style={{
          filter: isVisible ? "blur(0px)" : "blur(4px)",
        }}
      >
        {targetValue > 0 ? (
          <>
            {count}
            {suffix}
          </>
        ) : (
          label
        )}
      </div>
      <div
        className="text-xs text-muted-foreground mt-1 transition-all duration-500"
        style={{
          opacity: isVisible ? 1 : 0,
          transitionDelay: "200ms",
        }}
      >
        {description}
      </div>
    </div>
  );
};

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

      {/* KPIs at bottom of card with animation */}
      <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/20">
        {profile.highlights.map((h, i) => (
          <AnimatedKPI
            key={i}
            label={h.label}
            description={h.description}
            delay={i * 150}
          />
        ))}
      </div>
    </div>
  </section>
);

export default ExperienceHero;
