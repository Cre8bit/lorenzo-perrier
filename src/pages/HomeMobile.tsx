import { useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/useAppContext";
import HeroSectionMobile from "@/components/sections/HeroSectionMobile";
import PhilosophyMobile from "@/components/sections/PhilosophySection/PhilosophyMobile";
import CarouselMobile from "@/components/sections/CarouselSection/CarouselMobile";
import ExperienceMobile from "@/components/sections/ExperienceSection/ExperienceMobile";

type SectionId = "hero" | "philosophy" | "carousel" | "experience";

/**
 * Dedicated mobile experience.
 * No scroll-jacking (no OrbitMorph / ScrollIndicator / ScrollTransition),
 * no canvas particle field — just full-bleed sections, native scroll,
 * a single IntersectionObserver for nav state.
 */
const HomeMobile = () => {
  const { setCurrentSection } = useAppContext();
  const heroRef = useRef<HTMLElement>(null);
  const philoRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLElement>(null);
  const expRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections: Array<{ id: SectionId; ref: React.RefObject<HTMLElement> }> = [
      { id: "hero", ref: heroRef },
      { id: "philosophy", ref: philoRef },
      { id: "carousel", ref: carouselRef },
      { id: "experience", ref: expRef },
    ];
    const elToId = new Map<Element, SectionId>();
    sections.forEach(({ id, ref }) => {
      if (ref.current) elToId.set(ref.current, id);
    });
    const io = new IntersectionObserver(
      (entries) => {
        let bestId: SectionId | null = null;
        let bestRatio = 0;
        for (const e of entries) {
          const id = elToId.get(e.target);
          if (!id) continue;
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            bestId = id;
          }
        }
        if (bestId) setCurrentSection(bestId);
      },
      { threshold: [0, 0.25, 0.5, 0.75] },
    );
    sections.forEach(({ ref }) => ref.current && io.observe(ref.current));
    return () => io.disconnect();
  }, [setCurrentSection]);

  return (
    <div className="relative z-10 w-full">
      <section id="hero" ref={heroRef}>
        <HeroSectionMobile />
      </section>
      <section id="philosophy" ref={philoRef}>
        <PhilosophyMobile />
      </section>
      <section id="carousel" ref={carouselRef}>
        <CarouselMobile />
      </section>
      <section id="experience" ref={expRef}>
        <ExperienceMobile />
      </section>
    </div>
  );
};

export default HomeMobile;