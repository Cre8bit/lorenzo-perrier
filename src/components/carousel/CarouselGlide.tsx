import React, { useState, useEffect, useCallback, useRef } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TIMER_DURATION = 5000;

// Tinted glass colors for each card
const cardTints = [
  { bg: 'hsl(160 60% 45%)', border: 'hsl(160 60% 55%)' }, // Teal/Green
  { bg: 'hsl(200 30% 50%)', border: 'hsl(200 30% 60%)' }, // Slate/Gray-blue
  { bg: 'hsl(280 50% 55%)', border: 'hsl(280 50% 65%)' }, // Purple
];

export const CarouselGlide: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const transition = useCallback((newIndex: number) => {
    setTransitionPhase('exit');
    setProgress(0);
    setTimeout(() => {
      setActiveIndex(newIndex);
      setTransitionPhase('enter');
      setTimeout(() => setTransitionPhase('idle'), 400);
    }, 300);
  }, []);

  const next = useCallback(() => {
    transition((activeIndex + 1) % carouselContexts.length);
  }, [activeIndex, transition]);

  const prev = useCallback(() => {
    transition((activeIndex - 1 + carouselContexts.length) % carouselContexts.length);
  }, [activeIndex, transition]);

  const goTo = useCallback((index: number) => {
    if (index !== activeIndex) {
      transition(index);
    }
  }, [activeIndex, transition]);

  // Auto-advance timer with progress animation
  useEffect(() => {
    if (!isAutoPlaying || transitionPhase !== 'idle') return;
    
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / TIMER_DURATION) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        progressRef.current = setTimeout(updateProgress, 16);
      } else {
        next();
      }
    };
    
    progressRef.current = setTimeout(updateProgress, 16);
    
    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, [isAutoPlaying, activeIndex, transitionPhase, next]);

  const getCardPosition = (index: number) => {
    const diff = index - activeIndex;
    
    if (diff === 0) return { x: 0, scale: 1, opacity: 1, z: 30 };
    if (diff === 1 || diff === -(carouselContexts.length - 1)) {
      return { x: 320, scale: 0.85, opacity: 0.7, z: 20 };
    }
    if (diff === -1 || diff === carouselContexts.length - 1) {
      return { x: -320, scale: 0.85, opacity: 0.7, z: 20 };
    }
    return { x: diff > 0 ? 600 : -600, scale: 0.7, opacity: 0, z: 10 };
  };

  return (
    <section 
      className="min-h-[80vh] relative overflow-hidden flex flex-col items-center justify-center py-20"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Subtle background gradient */}
      <div 
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, 
            ${cardTints[activeIndex % cardTints.length].bg}10 0%,
            hsl(var(--background)) 70%)`,
        }}
      />

      {/* Section title */}
      <div className="relative z-10 mb-16">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase text-center">
          {sectionTitle}
        </p>
      </div>

      {/* Carousel container */}
      <div className="relative z-10 w-full max-w-6xl h-[400px] flex items-center justify-center">
        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background/30 backdrop-blur-sm border border-primary/10 hover:bg-background/50 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button
          onClick={next}
          className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background/30 backdrop-blur-sm border border-primary/10 hover:bg-background/50 transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Cards */}
        <div className="relative w-full h-full flex items-center justify-center">
          {carouselContexts.map((context, index) => {
            const pos = getCardPosition(index);
            const tint = cardTints[index % cardTints.length];
            
            return (
              <div
                key={context.id}
                onClick={() => goTo(index)}
                className="absolute cursor-pointer transition-all duration-500 ease-out"
                style={{
                  transform: `translateX(${pos.x}px) scale(${pos.scale})`,
                  opacity: pos.opacity,
                  zIndex: pos.z,
                }}
              >
                {/* Glass card with tint */}
                <div 
                  className="relative w-[280px] md:w-[360px] h-[340px] rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${tint.bg}20 0%, ${tint.bg}08 100%)`,
                    borderColor: index === activeIndex ? `${tint.border}40` : `${tint.border}20`,
                    boxShadow: index === activeIndex 
                      ? `0 25px 50px -12px ${tint.bg}30, inset 0 1px 0 ${tint.border}20`
                      : `0 10px 30px -10px ${tint.bg}20`,
                  }}
                >
                  {/* Glassmorphic overlay */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(180deg, ${tint.border}15 0%, transparent 50%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
                    {/* Visual icon area */}
                    <div className="flex-shrink-0 mb-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${tint.bg}25` }}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          {context.visualType === 'flow' && (
                            <path 
                              d="M4 12h4m4 0h4m4 0h4M8 12a4 4 0 108 0 4 4 0 00-8 0z" 
                              stroke={tint.border}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          )}
                          {context.visualType === 'network' && (
                            <>
                              <circle cx="12" cy="12" r="3" stroke={tint.border} strokeWidth="1.5" />
                              <circle cx="4" cy="8" r="2" stroke={tint.border} strokeWidth="1.5" />
                              <circle cx="20" cy="8" r="2" stroke={tint.border} strokeWidth="1.5" />
                              <circle cx="4" cy="16" r="2" stroke={tint.border} strokeWidth="1.5" />
                              <circle cx="20" cy="16" r="2" stroke={tint.border} strokeWidth="1.5" />
                              <path d="M9.5 10.5L6 8.5M14.5 10.5L18 8.5M9.5 13.5L6 15.5M14.5 13.5L18 15.5" stroke={tint.border} strokeWidth="1.5" />
                            </>
                          )}
                          {context.visualType === 'layers' && (
                            <>
                              <rect x="4" y="4" width="16" height="4" rx="1" stroke={tint.border} strokeWidth="1.5" />
                              <rect x="4" y="10" width="16" height="4" rx="1" stroke={tint.border} strokeWidth="1.5" />
                              <rect x="4" y="16" width="16" height="4" rx="1" stroke={tint.border} strokeWidth="1.5" />
                            </>
                          )}
                        </svg>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 
                      className={`text-xl md:text-2xl font-light mb-4 leading-tight transition-all duration-500 ${
                        transitionPhase === 'exit' && index === activeIndex
                          ? 'opacity-0 -translate-y-4' 
                          : transitionPhase === 'enter' && index === activeIndex
                            ? 'opacity-100 translate-y-0'
                            : ''
                      }`}
                      style={{ color: index === activeIndex ? 'hsl(var(--foreground))' : `${tint.border}` }}
                    >
                      {context.title}
                    </h3>

                    {/* Problem text - only visible on active */}
                    <p 
                      className={`text-sm leading-relaxed flex-grow transition-all duration-500 ${
                        index === activeIndex ? 'opacity-100' : 'opacity-0'
                      } ${
                        transitionPhase === 'exit' && index === activeIndex
                          ? 'translate-y-4' 
                          : ''
                      }`}
                      style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}
                    >
                      {context.problem}
                    </p>

                    {/* Signals - only on active */}
                    <div 
                      className={`flex flex-wrap gap-2 mt-4 transition-all duration-500 ${
                        index === activeIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {context.signals.slice(0, 3).map((signal) => (
                        <span 
                          key={signal}
                          className="px-3 py-1 text-xs rounded-full"
                          style={{ 
                            background: `${tint.bg}20`,
                            color: tint.border,
                            border: `1px solid ${tint.border}30`,
                          }}
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom stepper with progress animation */}
      <div className="relative z-10 mt-12 flex items-center gap-3">
        {carouselContexts.map((_, idx) => {
          const tint = cardTints[idx % cardTints.length];
          const isActive = idx === activeIndex;
          
          return (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
              style={{ 
                width: isActive ? 48 : 24,
                background: isActive ? `${tint.bg}30` : 'hsl(var(--muted) / 0.3)',
              }}
            >
              {/* Progress fill for active */}
              {isActive && (
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                  style={{ 
                    width: `${progress}%`,
                    background: tint.bg,
                  }}
                />
              )}
              {/* Dot for inactive */}
              {!isActive && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 hover:opacity-80 transition-opacity"
                  style={{ background: tint.bg }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
