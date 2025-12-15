import React, { useState, useEffect, useCallback } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';

const TIMER_DURATION = 5000;

export const CarouselDepth: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % carouselContexts.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, TIMER_DURATION);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  return (
    <section className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Depth gradient background that shifts */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at ${50 + activeIndex * 10}% ${40 + activeIndex * 5}%, 
            hsl(var(--primary) / 0.08) 0%, 
            transparent 50%)`,
        }}
      />
      
      {/* Layered blur circles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full transition-all duration-1000 blur-3xl"
          style={{
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
            left: `${30 + activeIndex * 10 + i * 5}%`,
            top: `${20 + i * 10}%`,
            background: `hsl(var(--primary) / ${0.03 - i * 0.005})`,
            transform: `translateZ(${i * -50}px)`,
          }}
        />
      ))}

      {/* Section title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase">
          {sectionTitle}
        </p>
      </div>

      {/* Stacked cards with depth */}
      <div 
        className="relative w-full max-w-4xl mx-auto px-8 h-[500px] perspective-1000"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {carouselContexts.map((context, idx) => {
          const offset = idx - activeIndex;
          const isActive = idx === activeIndex;
          
          return (
            <div
              key={context.id}
              onClick={() => setActiveIndex(idx)}
              className={`absolute inset-0 mx-auto max-w-2xl transition-all duration-700 cursor-pointer ${
                isActive ? 'z-30' : 'z-10'
              }`}
              style={{
                transform: `
                  translateZ(${offset * -100}px) 
                  translateY(${offset * 40}px)
                  scale(${1 - Math.abs(offset) * 0.1})
                `,
                opacity: 1 - Math.abs(offset) * 0.3,
                filter: isActive ? 'none' : `blur(${Math.abs(offset) * 2}px)`,
              }}
            >
              <div className={`
                h-full backdrop-blur-xl rounded-3xl p-12
                border transition-all duration-500
                ${isActive 
                  ? 'bg-background/10 border-primary/30' 
                  : 'bg-background/5 border-primary/10'
                }
              `}>
                <div className="h-full flex flex-col justify-center">
                  <h3 className="text-3xl font-light text-foreground mb-6">
                    {context.title}
                  </h3>
                  
                  <p className="text-lg text-muted-foreground/80 leading-relaxed mb-10">
                    {context.problem}
                  </p>

                  {/* Abstract visual */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-64 h-32">
                      {context.visualType === 'flow' && (
                        <svg className="w-full h-full" viewBox="0 0 256 128">
                          <path
                            d="M20 64 Q64 20 128 64 T236 64"
                            fill="none"
                            className="stroke-primary/30"
                            strokeWidth="2"
                            strokeDasharray="8 4"
                          />
                          {[20, 84, 148, 212].map((x, i) => (
                            <circle
                              key={i}
                              cx={x + 12}
                              cy={64 + Math.sin(i) * 20}
                              r="8"
                              className="fill-primary/20 animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </svg>
                      )}
                      {context.visualType === 'network' && (
                        <svg className="w-full h-full" viewBox="0 0 256 128">
                          {[[128, 64], [64, 32], [192, 32], [64, 96], [192, 96]].map(([cx, cy], i) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <line
                                  x1={128} y1={64} x2={cx} y2={cy}
                                  className="stroke-primary/20"
                                  strokeWidth="1"
                                />
                              )}
                              <circle
                                cx={cx} cy={cy}
                                r={i === 0 ? 12 : 6}
                                className="fill-primary/20 animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              />
                            </React.Fragment>
                          ))}
                        </svg>
                      )}
                      {context.visualType === 'layers' && (
                        <svg className="w-full h-full" viewBox="0 0 256 128">
                          {[0, 1, 2, 3].map((i) => (
                            <rect
                              key={i}
                              x={48 + i * 8}
                              y={20 + i * 24}
                              width={160 - i * 16}
                              height={20}
                              rx="4"
                              className="fill-primary/10 stroke-primary/20 animate-pulse"
                              strokeWidth="1"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Signals */}
                  <div className="flex flex-wrap gap-3 justify-center mt-8">
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
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
        {carouselContexts.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className="group relative h-1 w-16 bg-primary/10 rounded-full overflow-hidden"
          >
            <div 
              className={`absolute inset-y-0 left-0 bg-primary/50 rounded-full transition-all duration-300 ${
                idx === activeIndex ? 'w-full' : 'w-0 group-hover:w-1/3'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};
