import { AmbientBackground } from "@/components/AmbientBackground";
import { ParticleField } from "@/components/ParticleField";
import { HeroSection } from "@/components/HeroSection";
import { LiquidNavigation } from "@/components/LiquidNavigation";
import { ExperienceSection } from "@/components/ExperienceSection";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { ContactLink, SocialLinks } from "@/components/SocialLinks";
import { PhilosophyReveal } from "@/components/philosophy/PhilosophyReveal";

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
      <div className="-mt-[80vh]">
        <PhilosophyReveal />
      
      </div>
      {/* Scrollable experience/resume section */}
      <div className="-mt-[20vh]">
      <ExperienceSection />
      </div>

      {/* Liquid horizontal navigation */}
      <LiquidNavigation />

    </main>
  );
};

export default Index;
