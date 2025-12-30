import { lazy, Suspense } from "react";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { ContactLink, SocialLinks } from "@/components/ui/social-links";
import { PhilosophyReveal } from "@/components/sections/PhilosophySection/PhilosophyReveal";
import { CarouselGlide } from "@/components/sections/CarouselSection/CarouselGlide";
import { ScrollTransition } from "@/components/transitions/ScrollTransition";

// Lazy load Three.js particle field for better initial bundle size
const ParticleField3D = lazy(() => import("@/components/ui/particle-field-3d"));

const Index = () => {
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
          <ParticleField3D />
        </Suspense>
      </div>

      {/* Foreground stack */}
      <div className="relative z-10">
        {/* Social links - top right */}
        <SocialLinks />

        {/* Contact link - bottom left */}
        <ContactLink />

        {/* Hero section with floating text */}
        <HeroSection />

        {/* Scroll indicator with glow */}
        <ScrollIndicator />

        {/* Philosophy Section 2: Sequential Reveal with Timer + Overview */}
        <PhilosophyReveal />

        {/* Carousel Showcase Section */}
        <CarouselGlide />

        {/* Creative scroll transitions (POCs) */}
        <ScrollTransition />

        {/* Scrollable experience/resume section */}
        <ExperienceSection />

        {/* Liquid horizontal navigation */}
        <LiquidNavigation />
      </div>
    </main>
  );
};

export default Index;
