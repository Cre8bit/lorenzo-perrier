import React, { useState, useEffect, useCallback, useRef } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';

const TIMER_DURATION = 5000;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  cluster: number;
}

export const CarouselParticles: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        speed: 0.02 + Math.random() * 0.03,
        angle: Math.random() * Math.PI * 2,
        cluster: i % carouselContexts.length,
      });
    }
    setParticles(newParticles);
  }, []);

  // Animate particles based on active context
  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev.map(p => {
        // Particles in active cluster move faster and glow more
        const isActive = p.cluster === activeIndex;
        const targetX = isActive ? 50 + (p.id % 10 - 5) * 8 : p.x;
        const targetY = isActive ? 50 + Math.floor(p.id / 10) * 8 : p.y;
        
        return {
          ...p,
          x: p.x + (targetX - p.x) * 0.02 + Math.sin(p.angle) * p.speed,
          y: p.y + (targetY - p.y) * 0.02 + Math.cos(p.angle) * p.speed,
          angle: p.angle + 0.01,
        };
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [activeIndex]);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % carouselContexts.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, TIMER_DURATION);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const context = carouselContexts[activeIndex];

  return (
    <section 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Particle field background */}
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <defs>
            <filter id="particle-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Connecting lines between particles of same cluster */}
          {particles.map((p1, i) => 
            particles.slice(i + 1).map((p2, j) => {
              if (p1.cluster !== p2.cluster) return null;
              const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
              if (distance > 15) return null;
              
              return (
                <line
                  key={`${i}-${j}`}
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  className={`transition-all duration-500 ${
                    p1.cluster === activeIndex 
                      ? 'stroke-primary/30' 
                      : 'stroke-primary/10'
                  }`}
                  strokeWidth="1"
                />
              );
            })
          )}
          
          {/* Particles */}
          {particles.map((p) => (
            <circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${p.y}%`}
              r={p.cluster === activeIndex ? p.size * 1.5 : p.size}
              className={`transition-all duration-500 ${
                p.cluster === activeIndex 
                  ? 'fill-primary/60' 
                  : 'fill-primary/20'
              }`}
              filter={p.cluster === activeIndex ? 'url(#particle-glow)' : undefined}
            />
          ))}
        </svg>
      </div>

      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at ${40 + activeIndex * 15}% 50%, 
            transparent 0%, 
            hsl(var(--background) / 0.8) 50%,
            hsl(var(--background)) 80%)`,
        }}
      />

      {/* Section title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase">
          {sectionTitle}
        </p>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-8 text-center">
        <div className="backdrop-blur-sm bg-background/30 rounded-3xl p-12 border border-primary/10">
          <h3 className="text-3xl font-extralight text-foreground mb-6">
            {context.title}
          </h3>
          
          <p className="text-lg text-muted-foreground/80 leading-relaxed mb-10">
            {context.problem}
          </p>

          {/* Visual indicator */}
          <div className="h-24 flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              {[...Array(carouselContexts.length)].map((_, i) => (
                <div
                  key={i}
                  className={`transition-all duration-500 rounded-full ${
                    i === activeIndex 
                      ? 'w-16 h-16 bg-primary/20 border-2 border-primary/40' 
                      : 'w-8 h-8 bg-primary/10 border border-primary/20'
                  }`}
                  style={{
                    transform: i === activeIndex ? 'scale(1)' : 'scale(0.8)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Signals */}
          <div className="flex flex-wrap gap-3 justify-center">
            {context.signals.map((signal) => (
              <span 
                key={signal}
                className="px-4 py-1.5 text-sm text-primary/60 border border-primary/20 rounded-full bg-primary/5"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-6 mt-10">
          {carouselContexts.map((ctx, idx) => (
            <button
              key={ctx.id}
              onClick={() => setActiveIndex(idx)}
              className={`px-6 py-3 rounded-full border transition-all duration-300 ${
                idx === activeIndex 
                  ? 'border-primary/40 bg-primary/10 text-foreground' 
                  : 'border-primary/20 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <span className="text-sm font-light">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-primary/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary/40 rounded-full transition-all duration-300"
          style={{
            width: `${((activeIndex + 1) / carouselContexts.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
};
