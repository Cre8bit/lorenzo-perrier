import React, { useState, useEffect, useCallback } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';
import { ChevronUp, ChevronDown } from 'lucide-react';

const TIMER_DURATION = 5000;

export const CarouselSplit: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');

  const transition = useCallback((newIndex: number) => {
    setTransitionPhase('exit');
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

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(next, TIMER_DURATION);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next]);

  const context = carouselContexts[activeIndex];

  return (
    <section 
      className="min-h-screen relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <div 
          className="w-1/2 transition-all duration-700"
          style={{
            background: `linear-gradient(135deg, 
              hsl(var(--background)) 0%,
              hsl(var(--primary) / ${0.03 + activeIndex * 0.02}) 100%)`,
          }}
        />
        <div 
          className="w-1/2 transition-all duration-700"
          style={{
            background: `linear-gradient(225deg, 
              hsl(var(--background)) 0%,
              hsl(var(--primary) / ${0.05 + activeIndex * 0.02}) 100%)`,
          }}
        />
      </div>

      {/* Animated divider */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent transition-all duration-500"
          style={{
            transform: `scaleY(${transitionPhase === 'exit' ? 0 : 1})`,
            opacity: transitionPhase === 'exit' ? 0 : 1,
          }}
        />
      </div>

      {/* Section title */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase">
          {sectionTitle}
        </p>
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen flex items-center">
        {/* Left side - Visual */}
        <div className="w-1/2 flex items-center justify-center p-12">
          <div 
            className={`transition-all duration-500 ${
              transitionPhase === 'exit' 
                ? 'opacity-0 -translate-x-12' 
                : transitionPhase === 'enter'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-100'
            }`}
          >
            <div className="w-80 h-80 relative">
              {/* Abstract visual based on type */}
              <svg className="w-full h-full" viewBox="0 0 320 320">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {context.visualType === 'flow' && (
                  <g filter="url(#glow)">
                    <path
                      d="M 40 160 Q 120 80 160 160 T 280 160"
                      fill="none"
                      className="stroke-primary/40"
                      strokeWidth="3"
                    />
                    {[40, 120, 200, 280].map((x, i) => (
                      <circle
                        key={i}
                        cx={x}
                        cy={160 + Math.sin(i * 0.8) * 40}
                        r={16}
                        className="fill-primary/20 animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                    {/* Flow arrows */}
                    {[80, 160, 240].map((x, i) => (
                      <path
                        key={i}
                        d={`M ${x-8} 160 L ${x+8} 160 M ${x+4} 156 L ${x+8} 160 L ${x+4} 164`}
                        fill="none"
                        className="stroke-primary/30"
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                )}
                
                {context.visualType === 'network' && (
                  <g filter="url(#glow)">
                    <circle cx="160" cy="160" r="24" className="fill-primary/30" />
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                      const x = 160 + Math.cos(angle * Math.PI / 180) * 80;
                      const y = 160 + Math.sin(angle * Math.PI / 180) * 80;
                      return (
                        <g key={i}>
                          <line x1="160" y1="160" x2={x} y2={y} className="stroke-primary/20" strokeWidth="2" />
                          <circle
                            cx={x} cy={y} r="12"
                            className="fill-primary/20 animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        </g>
                      );
                    })}
                  </g>
                )}
                
                {context.visualType === 'layers' && (
                  <g filter="url(#glow)">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <rect
                        key={i}
                        x={60 + i * 12}
                        y={80 + i * 36}
                        width={200 - i * 24}
                        height={32}
                        rx="8"
                        className="fill-primary/10 stroke-primary/25 animate-pulse"
                        strokeWidth="1.5"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Right side - Text */}
        <div className="w-1/2 flex items-center p-12">
          <div 
            className={`max-w-md transition-all duration-500 ${
              transitionPhase === 'exit' 
                ? 'opacity-0 translate-x-12' 
                : transitionPhase === 'enter'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-100'
            }`}
          >
            <h3 className="text-4xl font-extralight text-foreground mb-8 leading-tight">
              {context.title}
            </h3>
            
            <p className="text-xl text-muted-foreground/70 leading-relaxed mb-10">
              {context.problem}
            </p>

            <div className="flex flex-wrap gap-3">
              {context.signals.map((signal) => (
                <span 
                  key={signal}
                  className="px-5 py-2 text-sm text-primary/60 border border-primary/20 rounded-full"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical navigation */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20">
        <button
          onClick={prev}
          className="p-2 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
        >
          <ChevronUp className="w-5 h-5 text-primary/60" />
        </button>
        
        <div className="flex flex-col gap-3 py-4">
          {carouselContexts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => transition(idx)}
              className={`w-2 h-8 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? 'bg-primary/50 h-12' 
                  : 'bg-primary/20 hover:bg-primary/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="p-2 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-primary/60" />
        </button>
      </div>
    </section>
  );
};
