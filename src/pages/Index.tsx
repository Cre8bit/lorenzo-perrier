import { AmbientBackground } from "@/components/ui/ambient-background";
import { ParticleField } from "@/components/ui/particle-field";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ScrollIndicator } from "@/components/ui/scroll-indicator";
import { ContactLink, SocialLinks } from "@/components/ui/social-links";
import { PhilosophyReveal } from "@/components/sections/PhilosophySection/PhilosophyReveal";
import { CarouselGlide } from "@/components/sections/CarouselSection/CarouselGlide";
import { ScrollTransition } from "@/components/transitions/ScrollTransition";

const Index = () => {
  return (
    <main className="relative min-h-screen bg-background">
      {/* Noise overlay for texture */}
      <div className="noise-overlay" />

      {/* Social links - top right */}
      <SocialLinks />

      {/* Contact link - bottom left */}
      <ContactLink />

      {/* Ambient background with gradient orbs */}
      <AmbientBackground />

      {/* Interactive particle field */}
      <ParticleField />

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
    </main>
  );
};

export default Index;
