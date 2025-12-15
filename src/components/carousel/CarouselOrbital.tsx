import React, { useState, useEffect, useCallback } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TIMER_DURATION = 5000;

export const CarouselOrbital: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % carouselContexts.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + carouselContexts.length) % carouselContexts.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, TIMER_DURATION);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const context = carouselContexts[activeIndex];

  return (
    <section className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Dynamic orbital background */}
      <div className="absolute inset-0">
        {carouselContexts.map((_, idx) => (
          <div
            key={idx}
            className="absolute rounded-full transition-all duration-1000"
            style={{
              width: `${300 + idx * 150}px`,
              height: `${300 + idx * 150}px`,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${activeIndex * 30 + idx * 45}deg)`,
              border: `1px solid hsl(var(--primary) / ${idx === activeIndex ? 0.4 : 0.1})`,
              opacity: idx === activeIndex ? 1 : 0.3,
            }}
          />
        ))}
        
        {/* Floating particles that change with context */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40 transition-all duration-1000"
            style={{
              left: `${20 + (i * 7) + (activeIndex * 5)}%`,
              top: `${15 + (i * 6) + Math.sin(i + activeIndex) * 10}%`,
              opacity: 0.3 + (i % 3) * 0.2,
              transform: `scale(${1 + (i === activeIndex * 4 ? 1 : 0)})`,
            }}
          />
        ))}
      </div>

      {/* Section title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase">
          {sectionTitle}
        </p>
      </div>

      {/* Central content */}
      <div 
        className="relative z-10 max-w-2xl mx-auto px-8"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="backdrop-blur-xl bg-background/5 border border-primary/10 rounded-2xl p-12 transition-all duration-500">
          <h3 className="text-2xl font-light text-foreground mb-4 transition-all duration-500">
            {context.title}
          </h3>
          
          <p className="text-muted-foreground/80 leading-relaxed mb-8">
            {context.problem}
          </p>

          {/* Visual representation */}
          <div className="h-32 relative mb-8 flex items-center justify-center">
            {context.visualType === 'flow' && (
              <div className="flex items-center gap-4">
                {[...Array(4)].map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="w-12 h-12 rounded-lg border border-primary/30 bg-primary/5 animate-pulse" 
                         style={{ animationDelay: `${i * 0.2}s` }} />
                    {i < 3 && <div className="w-8 h-px bg-primary/30" />}
                  </React.Fragment>
                ))}
              </div>
            )}
            {context.visualType === 'network' && (
              <svg className="w-48 h-32" viewBox="0 0 200 100">
                <circle cx="100" cy="50" r="8" className="fill-primary/30" />
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <g key={i}>
                    <line
                      x1="100" y1="50"
                      x2={100 + Math.cos(angle * Math.PI / 180) * 40}
                      y2={50 + Math.sin(angle * Math.PI / 180) * 30}
                      className="stroke-primary/20"
                      strokeWidth="1"
                    />
                    <circle
                      cx={100 + Math.cos(angle * Math.PI / 180) * 40}
                      cy={50 + Math.sin(angle * Math.PI / 180) * 30}
                      r="5"
                      className="fill-primary/20 animate-pulse"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  </g>
                ))}
              </svg>
            )}
            {context.visualType === 'layers' && (
              <div className="relative w-48 h-24">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 -translate-x-1/2 w-32 h-8 rounded border border-primary/20 bg-primary/5 animate-pulse"
                    style={{ 
                      top: `${i * 24}px`,
                      width: `${128 - i * 16}px`,
                      animationDelay: `${i * 0.3}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Signals */}
          <div className="flex flex-wrap gap-2 justify-center">
            {context.signals.map((signal) => (
              <span 
                key={signal}
                className="px-3 py-1 text-xs text-primary/60 border border-primary/20 rounded-full"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-primary/60" />
          </button>
          
          <div className="flex gap-2">
            {carouselContexts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="p-2 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-primary/60" />
          </button>
        </div>
      </div>
    </section>
  );
};
