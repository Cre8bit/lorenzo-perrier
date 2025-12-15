import React, { useState } from 'react';
import { CarouselOrbital } from './CarouselOrbital';
import { CarouselDepth } from './CarouselDepth';
import { CarouselLiquid } from './CarouselLiquid';
import { CarouselSplit } from './CarouselSplit';
import { CarouselParticles } from './CarouselParticles';

const variants = [
  { id: 'orbital', name: 'Orbital', component: CarouselOrbital },
  { id: 'depth', name: 'Depth Stack', component: CarouselDepth },
  { id: 'liquid', name: 'Liquid Morph', component: CarouselLiquid },
  { id: 'split', name: 'Split Screen', component: CarouselSplit },
  { id: 'particles', name: 'Particle Field', component: CarouselParticles },
];

export const CarouselShowcase: React.FC = () => {
  const [activeVariant, setActiveVariant] = useState('orbital');

  const ActiveComponent = variants.find(v => v.id === activeVariant)?.component || CarouselOrbital;

  return (
    <div className="relative">
      {/* Variant selector */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-background/80 backdrop-blur-xl rounded-full border border-primary/20">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => setActiveVariant(variant.id)}
            className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
              activeVariant === variant.id
                ? 'bg-primary/20 text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
            }`}
          >
            {variant.name}
          </button>
        ))}
      </div>

      {/* Active carousel */}
      <ActiveComponent />
    </div>
  );
};
