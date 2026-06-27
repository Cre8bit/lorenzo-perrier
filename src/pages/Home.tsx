import { useEffect, useRef } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { OrbitMorph } from "@/components/sections/OrbitMorph";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { PhilosophyReveal } from "@/components/sections/PhilosophySection/PhilosophyReveal";
import { CarouselGlide } from "@/components/sections/CarouselSection/CarouselGlide";
import { ScrollTransition } from "@/components/transitions/ScrollTransition";
import { useAppContext } from "@/contexts/useAppContext";
import ExperienceSection from "@/components/sections/ExperienceSection/ExperienceSection";
import { useIsMobile } from "@/hooks/use-mobile";
import HomeMobile from "@/pages/HomeMobile";

type SectionId = "hero" | "philosophy" | "carousel" | "experience";

const HomeDesktop = () => {
  const { currentSection, setCurrentSection } = useAppContext();

  useEffect(() => {
    if (currentSection === "cubeSpace") setCurrentSection("hero");
  }, [currentSection, setCurrentSection]);

  const heroRef = useRef<HTMLElement>(null);
  const philoRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLElement>(null);
  const experienceRef = useRef<HTMLElement>(null);

  const entriesRef = useRef(new Map<SectionId, IntersectionObserverEntry>());
  const currentSectionRef = useRef(currentSection);
  currentSectionRef.current = currentSection;

  useEffect(() => {
    const sections: Array<{ id: SectionId; ref: React.RefObject<HTMLElement> }> = [
      { id: "hero", ref: heroRef },
      { id: "philosophy", ref: philoRef },
      { id: "carousel", ref: carouselRef },
      { id: "experience", ref: experienceRef },
    ];

    const elToId = new Map<Element, SectionId>();
    sections.forEach(({ id, ref }) => {
      if (ref.current) elToId.set(ref.current, id);
    });

    let rafId = 0;
    const flush = () => {
      rafId = 0;
      const viewportCenter = window.innerHeight / 2;

      let best: { id: SectionId; dist: number } | null = null;
      entriesRef.current.forEach((entry, id) => {
        if (!entry.isIntersecting) return;
        if (entry.intersectionRatio < 0.001) return;
        const rect = entry.boundingClientRect;
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (!best || dist < best.dist) best = { id, dist };
      });

      if (!best) return;

      // Hysteresis — only switch when the new candidate is meaningfully
      // closer than the current section. Avoids flicker at boundaries.
      const cur = currentSectionRef.current;
      const curEntry = entriesRef.current.get(cur as SectionId);
      if (
        curEntry?.isIntersecting &&
        cur !== best.id &&
        best.dist >
          Math.abs(
            curEntry.boundingClientRect.top +
              curEntry.boundingClientRect.height / 2 -
              viewportCenter,
          ) -
            100
      ) {
        return;
      }

      if (best.id !== currentSectionRef.current) setCurrentSection(best.id);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = elToId.get(e.target);
          if (id) entriesRef.current.set(id, e);
        }
        if (rafId === 0) rafId = requestAnimationFrame(flush);
      },
      { root: null, rootMargin: "-20% 0px -20% 0px", threshold: [0, 0.5, 1] },
    );

    sections.forEach(({ ref }) => {
      if (ref.current) io.observe(ref.current);
    });

    const entries = entriesRef.current;
    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      entries.clear();
    };
  }, [setCurrentSection]);

  return (
    <div className="relative z-10 min-h-screen w-full">
      <div
        aria-hidden
        className="pointer-events-none"
        style={{
          position: "sticky",
          top: 0,
          height: 0,
          overflow: "visible",
          zIndex: 30,
        }}
      >
        <OrbitMorph />
      </div>

      <section id="hero" ref={heroRef}>
        <HeroSection />
      </section>

      <ScrollIndicator />

      <section id="philosophy" ref={philoRef}>
        <PhilosophyReveal />
      </section>

      <section id="carousel" ref={carouselRef}>
        <CarouselGlide />
      </section>

      <ScrollTransition />

      <section id="experience" ref={experienceRef}>
        <ExperienceSection />
      </section>
    </div>
  );
};

const Home = () => {
  const isMobile = useIsMobile();
  return isMobile ? <HomeMobile /> : <HomeDesktop />;
};

export default Home;
