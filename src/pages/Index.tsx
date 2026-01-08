import { lazy, Suspense, useEffect, useMemo } from "react";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { ContactLink, SocialLinks } from "@/components/ui/social-links";
import { PhilosophyReveal } from "@/components/sections/PhilosophySection/PhilosophyReveal";
import { CarouselGlide } from "@/components/sections/CarouselSection/CarouselGlide";
import { ScrollTransition } from "@/components/transitions/ScrollTransition";
import {
  ParticleFieldProvider,
  useParticleField,
} from "@/contexts/ParticleFieldContext";
import { useInViewport } from "@/hooks/use-in-viewport";

// Lazy load Three.js particle field for better initial bundle size
const ParticleField3D = lazy(() => import("@/components/ui/particle-field-3d"));

const IndexContent = () => {
  const { activePresetIndex, currentSection, setCurrentSection } =
    useParticleField();

  // Stable spy options - memoized to prevent observer recreation
  const spyOptions = useMemo<IntersectionObserverInit>(
    () => ({
      root: null,
      rootMargin: "-20% 0px -20% 0px", // Balanced margins for reliable detection
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    }),
    []
  );

  const hero = useInViewport<HTMLElement>(spyOptions);
  const philo = useInViewport<HTMLElement>(spyOptions);
  const carousel = useInViewport<HTMLElement>(spyOptions);
  const experience = useInViewport<HTMLElement>(spyOptions);

  useEffect(() => {
    const viewportCenter = window.innerHeight / 2;

    const allCandidates = [
      { id: "hero" as const, entry: hero.entry, ratio: hero.ratio },
      { id: "philosophy" as const, entry: philo.entry, ratio: philo.ratio },
      { id: "carousel" as const, entry: carousel.entry, ratio: carousel.ratio },
      {
        id: "experience" as const,
        entry: experience.entry,
        ratio: experience.ratio,
      },
    ];

    const candidates = allCandidates
      .filter((c) => c.entry?.isIntersecting)
      .map((c) => {
        const rect = c.entry!.boundingClientRect;
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        return { ...c, dist, center };
      });

    if (candidates.length === 0) return;

    // Find section closest to viewport center
    const best = candidates.reduce((a, b) => (b.dist < a.dist ? b : a));

    // Hysteresis: require significant advantage to switch (100px or 10% better)
    const currentCandidate = candidates.find((c) => c.id === currentSection);
    const distanceThreshold = 100; // pixels
    const ratioThreshold = 0.001; // minimal visibility required

    if (best.ratio < ratioThreshold) return; // Skip if barely visible

    // If current section is still visible, require best to be significantly closer
    if (currentCandidate && currentCandidate.entry?.isIntersecting) {
      const improvement = currentCandidate.dist - best.dist;
      if (improvement < distanceThreshold && best.id !== currentSection) {
        // Not enough improvement, keep current section
        return;
      }
    }

    // Switch to best section
    if (best.id !== currentSection) {
      setCurrentSection(best.id);
    }
  }, [
    hero.entry,
    philo.entry,
    carousel.entry,
    experience.entry,
    hero.ratio,
    philo.ratio,
    carousel.ratio,
    experience.ratio,
    currentSection,
    setCurrentSection,
  ]);

  // Compute effective preset index based on section
  const effectivePresetIndex =
    currentSection === "philosophy" ? activePresetIndex : -1; // -1 = default preset

  return (
    <main className="relative min-h-screen">
      {/* Background stack - behind content but above page background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Solid background color layer */}
        <div className="absolute inset-0 bg-background" />

        {/* Noise overlay for texture */}
        <div className="noise-overlay" />

        {/* Ambient background with gradient orbs */}
        <AmbientBackground />

        {/* Interactive 3D particle field (lazy loaded) */}
        <Suspense fallback={null}>
          <ParticleField3D activePresetIndex={effectivePresetIndex} />
        </Suspense>
      </div>

      {/* Foreground stack */}
      <div className="relative z-10">
        {/* Debug overlay - shows current section and preset */}
        {/* <div className="fixed top-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg font-mono text-xs space-y-1">
          <div>
            Section: <span className="text-primary">{currentSection}</span>
          </div>
          <div>
            Preset Index:{" "}
            <span className="text-primary">{effectivePresetIndex}</span>
          </div>
          <div>
            Philosophy:{" "}
            <span className="text-primary">{activePresetIndex}</span>
          </div>
          <div className="text-primary/50 text-[10px] mt-2">Ratios:</div>
          <div className="text-primary/50 text-[10px]">
            H:{hero.ratio.toFixed(2)} P:{philo.ratio.toFixed(2)} C:
            {carousel.ratio.toFixed(2)}
          </div>
        </div> */}

        {/* Social links - top right */}
        <SocialLinks />

        {/* Contact link - bottom left */}
        <ContactLink />

        {/* Hero section with floating text */}
        <section id="hero" ref={hero.ref}>
          <HeroSection />
        </section>

        {/* Scroll indicator with glow */}
        <ScrollIndicator />

        {/* Philosophy Section 2: Sequential Reveal with Timer + Overview */}
        <section id="philosophy" ref={philo.ref}>
          <PhilosophyReveal />
        </section>

        {/* Carousel Showcase Section */}
        <section id="carousel" ref={carousel.ref}>
          <CarouselGlide />
        </section>

        {/* Creative scroll transitions (POCs) */}
        <ScrollTransition />

        {/* Scrollable experience/resume section */}
        <ExperienceSection ref={experience.ref} />

        {/* Liquid horizontal navigation */}
        <LiquidNavigation />
      </div>
    </main>
  );
};

const Index = () => {
  return (
    <ParticleFieldProvider>
      <IndexContent />
    </ParticleFieldProvider>
  );
};

export default Index;
