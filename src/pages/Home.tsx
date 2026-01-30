import { useEffect, useMemo } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { PhilosophyReveal } from "@/components/sections/PhilosophySection/PhilosophyReveal";
import { CarouselGlide } from "@/components/sections/CarouselSection/CarouselGlide";
import { ScrollTransition } from "@/components/transitions/ScrollTransition";
import { useInViewport } from "@/hooks/use-in-viewport";
import { useAppContext } from "@/contexts/useAppContext";
import ExperienceSection from "@/components/sections/ExperienceSection/ExperienceSection";
import { reportPerformance } from "@/components/ui/performance-overlay";

const HomeContent = () => {
  const { currentSection, setCurrentSection } = useAppContext();

  useEffect(() => {
    if (currentSection === "cubeSpace") {
      setCurrentSection("hero");
    }
  }, [currentSection, setCurrentSection]);

  // Stable spy options - memoized to prevent observer recreation
  const spyOptions = useMemo<IntersectionObserverInit>(
    () => ({
      root: null,
      rootMargin: "-20% 0px -20% 0px", // Balanced margins for reliable detection
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    }),
    [],
  );

  const hero = useInViewport<HTMLElement>(spyOptions);
  const philo = useInViewport<HTMLElement>(spyOptions);
  const carousel = useInViewport<HTMLElement>(spyOptions);
  const experience = useInViewport<HTMLElement>(spyOptions);

  useEffect(() => {
    const t0 = performance.now();
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

    if (candidates.length === 0) {
      reportPerformance("Index:sectionSpy", performance.now() - t0);
      return;
    }

    // Find section closest to viewport center
    const best = candidates.reduce((a, b) => (b.dist < a.dist ? b : a));

    // Hysteresis: require significant advantage to switch (100px or 10% better)
    const currentCandidate = candidates.find((c) => c.id === currentSection);
    const distanceThreshold = 100; // pixels
    const ratioThreshold = 0.001; // minimal visibility required

    if (best.ratio < ratioThreshold) {
      reportPerformance("Index:sectionSpy", performance.now() - t0);
      return; // Skip if barely visible
    }

    // If current section is still visible, require best to be significantly closer
    if (currentCandidate && currentCandidate.entry?.isIntersecting) {
      const improvement = currentCandidate.dist - best.dist;
      if (improvement < distanceThreshold && best.id !== currentSection) {
        // Not enough improvement, keep current section
        reportPerformance("Index:sectionSpy", performance.now() - t0);
        return;
      }
    }

    // Switch to best section
    if (best.id !== currentSection) {
      setCurrentSection(best.id);
    }
    reportPerformance("Index:sectionSpy", performance.now() - t0);
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

  return (
    <main
      className="relative z-10 min-h-screen w-full"
      style={{ overflowX: "clip" }}
    >
      <section id="hero" ref={hero.ref}>
        <HeroSection />
      </section>

      <ScrollIndicator />

      <section id="philosophy" ref={philo.ref}>
        <PhilosophyReveal />
      </section>

      <section id="carousel" ref={carousel.ref}>
        <CarouselGlide />
      </section>

      <ScrollTransition />

      <section id="experience" ref={experience.ref}>
        <ExperienceSection />
      </section>
    </main>
  );
};

const Home = () => {
  return <HomeContent />;
};

export default Home;
