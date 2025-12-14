import { AmbientBackground } from '@/components/AmbientBackground';
import { ParticleField } from '@/components/ParticleField';
import { HeroSection } from '@/components/HeroSection';
import { LiquidNavigation } from '@/components/LiquidNavigation';
import { ExperienceSection } from '@/components/ExperienceSection';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { ContactLink, SocialLinks } from '@/components/SocialLinks';
import { PhilosophyLineDrawing } from '@/components/philosophy/PhilosophyLineDrawing';
import { PhilosophySequential } from '@/components/philosophy/PhilosophySequential';

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
      
      {/* Philosophy Section 1: Line Drawing Animation */}
      <PhilosophyLineDrawing />
      
      {/* Philosophy Section 2: Sequential Reveal with Timer + Overview */}
      <PhilosophySequential />
      
      {/* Liquid horizontal navigation */}
      <LiquidNavigation />
      
      {/* Scrollable experience/resume section */}
      <ExperienceSection />
    </main>
  );
};

export default Index;
