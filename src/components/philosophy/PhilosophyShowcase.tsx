import { useState } from 'react';
import { PhilosophyVertical } from './PhilosophyVertical';
import { PhilosophyGrid } from './PhilosophyGrid';
import { PhilosophyConstellation } from './PhilosophyConstellation';
import { PhilosophyHorizontal } from './PhilosophyHorizontal';
import { PhilosophyReveal } from './PhilosophyReveal';

const variants = [
  { id: 'vertical', name: 'Vertical Stack', component: PhilosophyVertical },
  { id: 'grid', name: 'Grid Layout', component: PhilosophyGrid },
  { id: 'constellation', name: 'Constellation', component: PhilosophyConstellation },
  { id: 'horizontal', name: 'Horizontal Flow', component: PhilosophyHorizontal },
  { id: 'reveal', name: 'Sequential Reveal', component: PhilosophyReveal },
];

export const PhilosophyShowcase = () => {
  const [activeVariant, setActiveVariant] = useState('vertical');

  const ActiveComponent = variants.find(v => v.id === activeVariant)?.component || PhilosophyVertical;

  return (
    <div className="relative">
      {/* Variant selector - fixed at top */}
      <div 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 rounded-full"
        style={{
          background: 'hsl(var(--background) / 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--primary) / 0.2)'
        }}
      >
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => setActiveVariant(variant.id)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all duration-300 ${
              activeVariant === variant.id 
                ? 'bg-primary/20 text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {variant.name}
          </button>
        ))}
      </div>

      {/* Active variant */}
      <ActiveComponent />
    </div>
  );
};
