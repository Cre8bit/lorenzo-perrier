import React, { useState, useEffect, useCallback } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';

const TIMER_DURATION = 5000;

export const CarouselLiquid: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [morphProgress, setMorphProgress] = useState(0);

  const next = useCallback(() => {
    setMorphProgress(0);
    setActiveIndex((prev) => (prev + 1) % carouselContexts.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, TIMER_DURATION);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMorphProgress((prev) => Math.min(prev + 0.02, 1));
    }, 50);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const context = carouselContexts[activeIndex];

  // Generate liquid blob paths based on context
  const getBlobPath = (index: number, progress: number) => {
    const baseRadius = 150 + index * 50;
    const wobble = Math.sin(progress * Math.PI * 2 + index) * 20;
    const points = 8;
    
    let path = '';
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = baseRadius + wobble * Math.sin(angle * 3 + progress * 5);
      const x = 400 + Math.cos(angle) * r;
      const y = 300 + Math.sin(angle) * r;
      path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
    }
    return path + 'Z';
  };

  return (
    <section className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Liquid morphing background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="liquid-blur">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={getBlobPath(i, morphProgress + activeIndex)}
            fill="url(#liquid-gradient)"
            filter="url(#liquid-blur)"
            className="transition-all duration-1000"
            style={{
              opacity: i === activeIndex % 3 ? 0.8 : 0.3,
            }}
          />
        ))}
      </svg>

      {/* Section title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase">
          {sectionTitle}
        </p>
      </div>

      {/* Content with liquid container */}
      <div 
        className="relative z-10 max-w-3xl mx-auto px-8"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div 
          className="relative backdrop-blur-2xl bg-background/5 rounded-[3rem] p-16 overflow-hidden"
          style={{
            borderRadius: `${48 + Math.sin(morphProgress * Math.PI) * 8}px`,
          }}
        >
          {/* Liquid border effect */}
          <div 
            className="absolute inset-0 rounded-[3rem] border-2 border-primary/20"
            style={{
              borderRadius: `${48 + Math.sin(morphProgress * Math.PI) * 8}px`,
            }}
          />
          
          {/* Inner glow */}
          <div 
            className="absolute inset-4 rounded-[2.5rem] opacity-50"
            style={{
              background: `radial-gradient(ellipse at ${30 + morphProgress * 40}% ${30 + morphProgress * 40}%, 
                hsl(var(--primary) / 0.1) 0%, transparent 60%)`,
              borderRadius: `${40 + Math.sin(morphProgress * Math.PI) * 8}px`,
            }}
          />

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-extralight text-foreground mb-6 tracking-wide">
                {context.title}
              </h3>
              
              <p className="text-xl text-muted-foreground/70 leading-relaxed max-w-xl mx-auto">
                {context.problem}
              </p>
            </div>

            {/* Liquid visual representation */}
            <div className="h-40 flex items-center justify-center mb-10">
              <svg className="w-72 h-40" viewBox="0 0 288 160">
                {context.visualType === 'flow' && (
                  <>
                    <path
                      d={`M 24 80 Q ${72 + morphProgress * 20} ${40 + morphProgress * 20} 144 80 
                          T ${264 - morphProgress * 10} 80`}
                      fill="none"
                      className="stroke-primary/30"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {[0, 1, 2, 3].map((i) => (
                      <circle
                        key={i}
                        cx={48 + i * 72}
                        cy={80 + Math.sin((morphProgress + i) * Math.PI) * 15}
                        r={10 + Math.sin(morphProgress * 2 + i) * 3}
                        className="fill-primary/20"
                      />
                    ))}
                  </>
                )}
                {context.visualType === 'network' && (
                  <>
                    {[[144, 80], [72, 40], [216, 40], [72, 120], [216, 120]].map(([cx, cy], i) => (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <line
                            x1={144} y1={80}
                            x2={cx + Math.sin(morphProgress * 2 + i) * 5}
                            y2={cy + Math.cos(morphProgress * 2 + i) * 5}
                            className="stroke-primary/20"
                            strokeWidth="2"
                          />
                        )}
                        <circle
                          cx={cx + Math.sin(morphProgress * 2 + i) * 5}
                          cy={cy + Math.cos(morphProgress * 2 + i) * 5}
                          r={i === 0 ? 16 : 8 + Math.sin(morphProgress * 3 + i) * 2}
                          className="fill-primary/20"
                        />
                      </React.Fragment>
                    ))}
                  </>
                )}
                {context.visualType === 'layers' && (
                  <>
                    {[0, 1, 2, 3].map((i) => (
                      <rect
                        key={i}
                        x={64 + i * 8 + Math.sin(morphProgress * 2 + i) * 4}
                        y={20 + i * 32}
                        width={160 - i * 16}
                        height={24}
                        rx={12}
                        className="fill-primary/10 stroke-primary/20"
                        strokeWidth="1.5"
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>

            {/* Signals as liquid pills */}
            <div className="flex flex-wrap gap-4 justify-center">
              {context.signals.map((signal, i) => (
                <span 
                  key={signal}
                  className="px-6 py-2 text-sm text-primary/70 rounded-full bg-primary/5 border border-primary/15"
                  style={{
                    transform: `translateY(${Math.sin(morphProgress * 2 + i) * 3}px)`,
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation dots with liquid connection */}
        <div className="flex items-center justify-center gap-4 mt-12">
          {carouselContexts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                setMorphProgress(0);
              }}
              className={`relative w-4 h-4 rounded-full transition-all duration-500 ${
                idx === activeIndex 
                  ? 'bg-primary/50 scale-125' 
                  : 'bg-primary/20 hover:bg-primary/30'
              }`}
            >
              {idx === activeIndex && (
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
