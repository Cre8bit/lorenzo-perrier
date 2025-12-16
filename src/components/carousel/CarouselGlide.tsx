import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const TIMER_DURATION = 5000;

// Tinted glass colors for each card
const cardTints = [
  { bg: 'hsl(160 60% 45%)', border: 'hsl(160 60% 55%)', glow: 'hsl(160 60% 35%)' },
  { bg: 'hsl(200 30% 50%)', border: 'hsl(200 30% 60%)', glow: 'hsl(200 30% 40%)' },
  { bg: 'hsl(280 50% 55%)', border: 'hsl(280 50% 65%)', glow: 'hsl(280 50% 45%)' },
];

type Phase = 'idle' | 'exit' | 'enter';
type Dir = -1 | 1;

const clampIndex = (i: number, len: number) => (i + len) % len;

export const CarouselGlide: React.FC = () => {
  const len = carouselContexts.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [direction, setDirection] = useState<Dir>(1);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [heroBump, setHeroBump] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const phaseTimeoutRef = useRef<number | null>(null);
  const bumpTimeoutRef = useRef<number | null>(null);

  const activeRef = useRef(activeIndex);
  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const indices = useMemo(() => {
    const prev = clampIndex(activeIndex - 1, len);
    const next = clampIndex(activeIndex + 1, len);
    return { prev, active: activeIndex, next };
  }, [activeIndex, len]);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startTsRef.current = null;
  }, []);

  const stopTimers = useCallback(() => {
    if (phaseTimeoutRef.current != null) window.clearTimeout(phaseTimeoutRef.current);
    if (bumpTimeoutRef.current != null) window.clearTimeout(bumpTimeoutRef.current);
    phaseTimeoutRef.current = null;
    bumpTimeoutRef.current = null;
  }, []);

  const resetProgress = useCallback(() => {
    stopRaf();
    setProgress(0);
  }, [stopRaf]);

  const triggerHeroBump = useCallback(() => {
    setHeroBump(true);
    if (bumpTimeoutRef.current != null) window.clearTimeout(bumpTimeoutRef.current);
    bumpTimeoutRef.current = window.setTimeout(() => setHeroBump(false), 280);
  }, []);

  const runPhaseTransition = useCallback(
    (newIndex: number, dir: Dir) => {
      if (newIndex === activeRef.current) return;

      stopRaf();
      stopTimers();
      setDirection(dir);
      setProgress(0);

      setPhase('exit');

      phaseTimeoutRef.current = window.setTimeout(() => {
        setActiveIndex(newIndex);
        setPhase('enter');
        triggerHeroBump();

        phaseTimeoutRef.current = window.setTimeout(() => {
          setPhase('idle');
        }, 320);
      }, 280);
    },
    [stopRaf, stopTimers, triggerHeroBump]
  );

  const next = useCallback(() => {
    const curr = activeRef.current;
    runPhaseTransition(clampIndex(curr + 1, len), 1);
  }, [len, runPhaseTransition]);

  const prev = useCallback(() => {
    const curr = activeRef.current;
    runPhaseTransition(clampIndex(curr - 1, len), -1);
  }, [len, runPhaseTransition]);

  const goTo = useCallback(
    (idx: number) => {
      const curr = activeRef.current;
      if (idx === curr) return;

      const forwardDist = (idx - curr + len) % len;
      const backwardDist = (curr - idx + len) % len;
      const dir: Dir = forwardDist <= backwardDist ? 1 : -1;

      runPhaseTransition(idx, dir);
    },
    [len, runPhaseTransition]
  );

  const toggleFlip = useCallback((index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Smooth auto progress
  useEffect(() => {
    if (!isAutoPlaying || phase !== 'idle') return;

    stopRaf();
    startTsRef.current = null;

    const tick = (ts: number) => {
      if (startTsRef.current == null) startTsRef.current = ts;
      const elapsed = ts - startTsRef.current;
      const pct = Math.min((elapsed / TIMER_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        startTsRef.current = null;
        setProgress(0);
        next();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => stopRaf();
  }, [isAutoPlaying, phase, next, stopRaf]);

  useEffect(() => {
    return () => {
      stopRaf();
      stopTimers();
    };
  }, [stopRaf, stopTimers]);

  const activeTint = cardTints[activeIndex % cardTints.length];
  const prevTint = cardTints[clampIndex(activeIndex - 1, len) % cardTints.length];
  const nextTint = cardTints[clampIndex(activeIndex + 1, len) % cardTints.length];

  // Interpolate background based on transition phase
  const getBgStyle = () => {
    const baseBg = `radial-gradient(ellipse 80% 60% at 50% 40%, ${activeTint.glow}18 0%, transparent 70%)`;
    const accentLeft = `radial-gradient(ellipse 40% 50% at 15% 50%, ${prevTint.glow}08 0%, transparent 60%)`;
    const accentRight = `radial-gradient(ellipse 40% 50% at 85% 50%, ${nextTint.glow}08 0%, transparent 60%)`;
    
    return {
      background: `${baseBg}, ${accentLeft}, ${accentRight}, hsl(var(--background))`,
      transition: 'background 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  const slotStyle = (slot: 'left' | 'center' | 'right') => {
    const common = {
      position: 'absolute' as const,
      top: '50%',
      transformStyle: 'preserve-3d' as const,
      willChange: 'transform, opacity',
    };

    if (slot === 'center') {
      const exit = phase === 'exit';
      const enter = phase === 'enter';

      const baseZ = 80;
      const bumpZ = 120;
      const z = heroBump ? bumpZ : baseZ;

      const slideX = exit ? -40 * direction : enter ? 30 * direction : 0;
      const rotateY = exit ? 8 * direction : enter ? -5 * direction : 0;
      const scale = exit ? 0.92 : heroBump ? 1.05 : 1;
      const opacity = exit ? 0 : 1;

      return {
        ...common,
        left: '50%',
        transform: `perspective(1200px) translate3d(calc(-50% + ${slideX}px), -50%, ${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
        opacity,
        zIndex: 30,
        transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease',
      };
    }

    const isLeft = slot === 'left';
    const x = isLeft ? -320 : 320;
    const rotateY = isLeft ? 18 : -18;
    const rotateZ = isLeft ? -2 : 2;

    return {
      ...common,
      left: '50%',
      transform: `perspective(1200px) translate3d(calc(-50% + ${x}px), -50%, -80px) scale(0.82) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
      opacity: 0.65,
      zIndex: 20,
      transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease',
    };
  };

  const GlassCard = ({ 
    index, 
    isActive, 
    isFlipped,
    onFlip 
  }: { 
    index: number; 
    isActive: boolean;
    isFlipped: boolean;
    onFlip: () => void;
  }) => {
    const context = carouselContexts[index];
    const tint = cardTints[index % cardTints.length];

    return (
      <div
        className="relative w-[280px] md:w-[360px] h-[320px] cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={isActive ? onFlip : undefined}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border backdrop-blur-xl"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.03) 100%)',
              borderColor: isActive ? `${tint.border}66` : `${tint.border}30`,
              boxShadow: isActive
                ? `0 30px 70px -15px ${tint.bg}45, inset 0 1px 0 rgba(255,255,255,0.22)`
                : `0 14px 40px -16px ${tint.bg}26, inset 0 1px 0 rgba(255,255,255,0.14)`,
            }}
          >
            {/* Tinted glass wash */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${tint.bg}38 0%, ${tint.bg}20 55%, ${tint.bg}12 100%)`,
                mixBlendMode: 'multiply',
                opacity: 0.9,
              }}
            />

            {/* Sheen highlight */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(120% 80% at 18% 10%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 22%, transparent 60%)',
                mixBlendMode: 'screen',
                opacity: isActive ? 0.95 : 0.7,
              }}
            />

            {/* Bottom depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(120% 90% at 80% 95%, ${tint.bg}25 0%, transparent 58%)`,
              }}
            />

            {/* Noise texture */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.35%27/%3E%3C/svg%3E")',
              }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              <div className="flex-shrink-0 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${tint.border}2a`,
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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
                        <path
                          d="M9.5 10.5L6 8.5M14.5 10.5L18 8.5M9.5 13.5L6 15.5M14.5 13.5L18 15.5"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
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

              <h3 className="text-lg md:text-xl font-light mb-3 leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
                {context.title}
              </h3>

              <p className="text-sm leading-relaxed flex-grow" style={{ color: 'hsl(var(--muted-foreground) / 0.72)' }}>
                {context.problem}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {context.signals.slice(0, 3).map((signal) => (
                  <span
                    key={signal}
                    className="px-2.5 py-0.5 text-xs rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: tint.border,
                      border: `1px solid ${tint.border}2f`,
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>

              {isActive && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs opacity-50">
                  <RotateCcw className="w-3 h-3" />
                  <span>click to flip</span>
                </div>
              )}
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border backdrop-blur-xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.04) 100%)',
              borderColor: `${tint.border}55`,
              boxShadow: `0 30px 70px -15px ${tint.bg}45, inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          >
            {/* Tinted glass wash - slightly different angle */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(225deg, ${tint.bg}40 0%, ${tint.bg}22 55%, ${tint.bg}14 100%)`,
                mixBlendMode: 'multiply',
                opacity: 0.9,
              }}
            />

            {/* Sheen highlight - flipped position */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(120% 80% at 82% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 22%, transparent 60%)',
                mixBlendMode: 'screen',
              }}
            />

            {/* Noise texture */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.35%27/%3E%3C/svg%3E")',
              }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              <h4 className="text-sm font-medium uppercase tracking-wider mb-6" style={{ color: tint.border }}>
                {context.backTitle}
              </h4>

              <div className="flex-grow flex flex-col gap-4">
                {context.backDetails.map((detail, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: tint.border }}
                    />
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.85)' }}>
                      {detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs opacity-50">
                <RotateCcw className="w-3 h-3" />
                <span>click to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      className="min-h-[75vh] relative overflow-hidden flex flex-col items-center justify-center py-16"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => {
        setIsAutoPlaying(true);
        resetProgress();
      }}
    >
      {/* Dynamic background */}
      <div className="absolute inset-0" style={getBgStyle()} />
      
      {/* Floating accent orbs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${activeTint.bg} 0%, transparent 70%)`,
          left: '10%',
          top: '20%',
          transform: `translate(${phase === 'exit' ? '-20px' : '0'}, ${phase === 'enter' ? '20px' : '0'})`,
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03] blur-3xl pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${nextTint.bg} 0%, transparent 70%)`,
          right: '5%',
          bottom: '10%',
          transform: `translate(${phase === 'enter' ? '15px' : '0'}, ${phase === 'exit' ? '-15px' : '0'})`,
        }}
      />

      <div className="relative z-10 mb-12">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase text-center">{sectionTitle}</p>
      </div>

      <div className="relative z-10 w-full max-w-5xl h-[400px] flex items-center justify-center">
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            resetProgress();
            prev();
          }}
          className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button
          onClick={() => {
            setIsAutoPlaying(false);
            resetProgress();
            next();
          }}
          className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </button>

        <div className="relative w-full h-full" style={{ perspective: '1200px' }}>
          <div
            style={slotStyle('left')}
            className="cursor-pointer"
            onClick={() => {
              setIsAutoPlaying(false);
              resetProgress();
              prev();
            }}
          >
            <GlassCard 
              index={indices.prev} 
              isActive={false} 
              isFlipped={flippedCards.has(indices.prev)}
              onFlip={() => {}}
            />
          </div>

          <div style={slotStyle('center')}>
            <GlassCard 
              index={indices.active} 
              isActive 
              isFlipped={flippedCards.has(indices.active)}
              onFlip={() => toggleFlip(indices.active)}
            />
          </div>

          <div
            style={slotStyle('right')}
            className="cursor-pointer"
            onClick={() => {
              setIsAutoPlaying(false);
              resetProgress();
              next();
            }}
          >
            <GlassCard 
              index={indices.next} 
              isActive={false}
              isFlipped={flippedCards.has(indices.next)}
              onFlip={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="relative z-10 mt-10 flex items-center gap-3">
        {carouselContexts.map((_, idx) => {
          const tint = cardTints[idx % cardTints.length];
          const isActive = idx === activeIndex;

          return (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                resetProgress();
                goTo(idx);
              }}
              className="relative h-1.5 rounded-full overflow-hidden transition-all duration-400"
              style={{
                width: isActive ? 56 : 20,
                background: isActive ? `${tint.bg}25` : 'hsl(var(--muted) / 0.25)',
              }}
            >
              {isActive ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${tint.bg}90 0%, ${tint.border} 100%)`,
                    boxShadow: `0 0 8px ${tint.bg}60`,
                    transition: 'width 60ms linear',
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 rounded-full opacity-40 hover:opacity-70 transition-opacity"
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