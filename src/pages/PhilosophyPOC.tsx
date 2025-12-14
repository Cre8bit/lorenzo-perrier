import { AmbientBackground } from '@/components/AmbientBackground';
import { ParticleField } from '@/components/ParticleField';
import { PhilosophyShowcase } from '@/components/philosophy/PhilosophyShowcase';

/**
 * POC Page for Philosophy Section Variants
 * Navigate to /philosophy-poc to view and compare different implementations
 */
const PhilosophyPOC = () => {
  return (
    <main className="relative min-h-screen bg-background">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Ambient background */}
      <AmbientBackground />
      
      {/* Particle field */}
      <ParticleField />
      
      {/* Philosophy showcase with variant selector */}
      <PhilosophyShowcase />
    </main>
  );
};

export default PhilosophyPOC;
