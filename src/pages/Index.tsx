import { AmbientBackground } from '@/components/AmbientBackground';
import { ParticleField } from '@/components/ParticleField';
import { HeroSection } from '@/components/HeroSection';
import { LiquidNavigation } from '@/components/LiquidNavigation';
import { ExperienceSection } from '@/components/ExperienceSection';

const Index = () => {
  return (
    <main className="relative min-h-screen bg-background">
      {/* Noise overlay for texture */}
      <div className="noise-overlay" />
      
      {/* Ambient background with gradient orbs */}
      <AmbientBackground />
      
      {/* Interactive particle field */}
      <ParticleField />
      
      {/* Hero section with floating text */}
      <HeroSection />
      
      {/* Liquid horizontal navigation */}
      <LiquidNavigation />
      
      {/* Scrollable experience/resume section */}
      <ExperienceSection />
    </main>
  );
};

export default Index;
