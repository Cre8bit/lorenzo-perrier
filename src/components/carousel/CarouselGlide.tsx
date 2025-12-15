import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { carouselContexts, sectionTitle } from './CarouselData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TIMER_DURATION = 5000;

// Tinted glass colors for each card
const cardTints = [
  { bg: 'hsl(160 60% 45%)', border: 'hsl(160 60% 55%)' }, // Teal/Green
  { bg: 'hsl(200 30% 50%)', border: 'hsl(200 30% 60%)' }, // Slate/Gray-blue
  { bg: 'hsl(280 50% 55%)', border: 'hsl(280 50% 65%)' }, // Purple
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

  // NEW: hero projection bump when a card becomes the main tile
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
    // overshoot then settle
    setHeroBump(true);
    if (bumpTimeoutRef.current != null) window.clearTimeout(bumpTimeoutRef.current);
    bumpTimeoutRef.current = window.setTimeout(() => setHeroBump(false), 220);
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

        // NEW: bump when the new center appears
        setPhase('enter');
        triggerHeroBump();

        phaseTimeoutRef.current = window.setTimeout(() => {
          setPhase('idle');
        }, 260);
      }, 220);
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

      const y = -50;

      // NEW: “projection” feeling via translateZ + slight rotateX
      const baseZ = 70; // resting projection
      const bumpZ = 105; // overshoot projection
      const z = heroBump ? bumpZ : baseZ;

      // exit/enter motion along X (subtle)
      const slide = exit ? -14 * direction : enter ? 10 * direction : 0;

      // a little pop scale
      const scale = exit ? 0.97 : heroBump ? 1.045 : 1;

      const opacity = exit ? 0 : 1;

      return {
        ...common,
        left: '50%',
        transform: `perspective(1200px) translate3d(calc(-50% + ${slide}px), ${y}%, ${z}px) scale(${scale}) rotateX(${heroBump ? 2 : 0}deg)`,
        opacity,
        zIndex: 30,
        transition:
          'transform 360ms cubic-bezier(.18,.9,.18,1), opacity 200ms ease',
      };
    }

    const isLeft = slot === 'left';
    const x = isLeft ? -340 : 340;
    const y = -50;

    // inward tilt
    const rotateY = isLeft ? 14 : -14;
    const rotateZ = isLeft ? -1.5 : 1.5;

    return {
      ...common,
      left: '50%',
      transform: `perspective(1200px) translate3d(calc(-50% + ${x}px), ${y}%, -60px) scale(0.86) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
      opacity: 0.78,
      zIndex: 20,
      transition: 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease',
    };
  };

  const GlassCard = ({ index, isActive }: { index: number; isActive: boolean }) => {
    const context = carouselContexts[index];
    const tint = cardTints[index % cardTints.length];

    return (
      <div
        className="relative w-[280px] md:w-[380px] h-[340px] rounded-2xl overflow-hidden border backdrop-blur-xl"
        style={{
          // Neutral “glass” base; the tint is applied via overlay (below)
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.03) 100%)',
          borderColor: isActive ? `${tint.border}66` : `${tint.border}30`,
          boxShadow: isActive
            ? `0 34px 80px -20px ${tint.bg}40, inset 0 1px 0 rgba(255,255,255,0.22)`
            : `0 16px 44px -18px ${tint.bg}26, inset 0 1px 0 rgba(255,255,255,0.14)`,
        }}
      >
        {/* TRUE tinted glass wash: stays transparent but clearly colored */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${tint.bg}36 0%, ${tint.bg}22 55%, ${tint.bg}14 100%)`,
            mixBlendMode: 'multiply',
            opacity: 0.9,
          }}
        />

        {/* sheen / highlight sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 80% at 18% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.14) 22%, transparent 60%)',
            mixBlendMode: 'screen',
            opacity: isActive ? 0.9 : 0.7,
          }}
        />

        {/* bottom depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(120% 90% at 80% 95%, ${tint.bg}28 0%, transparent 58%)`,
            opacity: isActive ? 1 : 0.85,
          }}
        />

        {/* subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.35%27/%3E%3C/svg%3E")',
          }}
        />

        <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
          <div className="flex-shrink-0 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${tint.border}2a`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18)`,
              }}
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

          <h3 className="text-xl md:text-2xl font-light mb-4 leading-tight" style={{ color: 'hsl(var(--foreground))' }}>
            {context.title}
          </h3>

          <p className="text-sm leading-relaxed flex-grow" style={{ color: 'hsl(var(--muted-foreground) / 0.72)' }}>
            {context.problem}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {context.signals.slice(0, 3).map((signal) => (
              <span
                key={signal}
                className="px-3 py-1 text-xs rounded-full"
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
        </div>
      </div>
    );
  };

  return (
    <section
      className="min-h-[80vh] relative overflow-hidden flex flex-col items-center justify-center py-20"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => {
        setIsAutoPlaying(true);
        resetProgress();
      }}
    >
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at center, ${activeTint.bg}12 0%, hsl(var(--background)) 70%)`,
        }}
      />

      <div className="relative z-10 mb-16">
        <p className="text-muted-foreground/60 text-sm tracking-widest uppercase text-center">{sectionTitle}</p>
      </div>

      <div className="relative z-10 w-full max-w-6xl h-[420px] flex items-center justify-center">
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            resetProgress();
            prev();
          }}
          className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background/30 backdrop-blur-sm border border-primary/10 hover:bg-background/50 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button
          onClick={() => {
            setIsAutoPlaying(false);
            resetProgress();
            next();
          }}
          className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background/30 backdrop-blur-sm border border-primary/10 hover:bg-background/50 transition-all duration-300"
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
            <GlassCard index={indices.prev} isActive={false} />
          </div>

          <div style={slotStyle('center')}>
            <GlassCard index={indices.active} isActive />
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
            <GlassCard index={indices.next} isActive={false} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-12 flex items-center gap-3">
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
              className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
              style={{
                width: isActive ? 48 : 24,
                background: isActive ? `${tint.bg}30` : 'hsl(var(--muted) / 0.3)',
              }}
            >
              {isActive ? (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: tint.bg,
                    transition: 'width 60ms linear',
                  }}
                />
              ) : (
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