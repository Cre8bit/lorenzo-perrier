import { AmbientBackground } from "@/components/AmbientBackground";
import { ParticleField } from "@/components/ParticleField";
import { HeroSection } from "@/components/HeroSection";
import { LiquidNavigation } from "@/components/LiquidNavigation";
import { ExperienceSection } from "@/components/ExperienceSection";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { ContactLink, SocialLinks } from "@/components/SocialLinks";
import { PhilosophyReveal } from "@/components/philosophy/PhilosophyReveal";
import { CarouselGlide } from "@/components/carousel/CarouselGlide";
import { ScrollTransition } from "@/components/ScrollTransition";
import { TransitionPulseGate } from "@/components/transitions/TransitionPulseGate";

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
      <TransitionPulseGate />

      {/* Scrollable experience/resume section */}
      <ExperienceSection />

      {/* Liquid horizontal navigation */}
      <LiquidNavigation />
    </main>
  );
};

export default Index;
