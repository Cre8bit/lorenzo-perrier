import { useEffect, useRef, useState, useCallback } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * Philosophy Section: Sequential Reveal with Timer + Horizontal Overview
 * User scrolls through each value with auto-timer switching
 * After all seen, horizontal overview animation appears
 */
export const PhilosophySequential = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [hasSeenAll, setHasSeenAll] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [itemProgress, setItemProgress] = useState(0);
  const [overviewProgress, setOverviewProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const TIMER_DURATION = 3000; // 3 seconds per item

  // Handle auto-advance timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setItemProgress(0);
    const startTime = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / TIMER_DURATION, 1);
      setItemProgress(progress);
      
      if (progress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        
        if (currentIndex < philosophyItems.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setHasSeenAll(true);
          setTimeout(() => setShowOverview(true), 500);
        }
      }
    }, 16);
  }, [currentIndex]);

  // Intersection observer for section visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting && entry.intersectionRatio > 0.5;
        setIsInView(inView);
        
        if (inView && !hasSeenAll) {
          startTimer();
        } else if (!inView && timerRef.current) {
          clearInterval(timerRef.current);
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer, hasSeenAll]);

  // Start timer when index changes
  useEffect(() => {
    if (isInView && !hasSeenAll) {
      startTimer();
    }
  }, [currentIndex, isInView, hasSeenAll, startTimer]);

  // Animate overview items
  useEffect(() => {
    if (showOverview) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.02;
        setOverviewProgress(Math.min(progress, 1));
        if (progress >= 1) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [showOverview]);

  const currentItem = philosophyItems[currentIndex];

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen py-32 px-8 relative flex items-center justify-center"
    >
      {/* Main sequential view */}
      {!showOverview && (
        <div className="max-w-2xl w-full relative">
          {/* Progress dots */}
          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col gap-6">
            {philosophyItems.map((_, index) => (
              <div
                key={index}
                className="relative"
              >
                <div 
                  className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                  style={{
                    borderColor: index <= currentIndex 
                      ? 'hsl(var(--primary) / 0.6)' 
                      : 'hsl(var(--primary) / 0.2)',
                    background: index < currentIndex 
                      ? 'hsl(var(--primary) / 0.4)' 
                      : index === currentIndex 
                        ? 'hsl(var(--background))' 
                        : 'transparent',
                    boxShadow: index === currentIndex 
                      ? '0 0 20px hsl(var(--primary) / 0.5)' 
                      : 'none'
                  }}
                />
                {/* Timer ring for current item */}
                {index === currentIndex && (
                  <svg 
                    className="absolute -inset-1 w-5 h-5"
                    viewBox="0 0 20 20"
                  >
                    <circle
                      cx="10" cy="10" r="8"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray={`${itemProgress * 50.26} 50.26`}
                      strokeLinecap="round"
                      transform="rotate(-90 10 10)"
                      style={{ opacity: 0.6 }}
                    />
                  </svg>
                )}
                {/* Connector line */}
                {index < philosophyItems.length - 1 && (
                  <div 
                    className="absolute left-1/2 top-full w-px h-6 -translate-x-1/2"
                    style={{
                      background: index < currentIndex 
                        ? 'hsl(var(--primary) / 0.3)' 
                        : 'hsl(var(--primary) / 0.1)',
                      transition: 'background 0.3s ease-out'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content area */}
          <div 
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'hsl(var(--background) / 0.2)',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(var(--primary) / 0.15)'
            }}
          >
            {/* Progress bar at top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/10">
              <div 
                className="h-full bg-primary/50"
                style={{
                  width: `${itemProgress * 100}%`,
                  transition: 'width 0.05s linear'
                }}
              />
            </div>

            {/* Item content with transition */}
            <div className="p-12 text-center min-h-[300px] flex flex-col justify-center">
              {/* Number */}
              <span 
                className="text-7xl font-extralight text-primary/15 mb-4"
                key={`num-${currentIndex}`}
                style={{
                  animation: 'fadeSlideIn 0.5s ease-out'
                }}
              >
                0{currentIndex + 1}
              </span>

              {/* Subtitle */}
              <span 
                className="text-xs uppercase tracking-[0.3em] text-primary/60 block mb-4"
                key={`sub-${currentIndex}`}
                style={{
                  animation: 'fadeSlideIn 0.5s ease-out 0.1s both'
                }}
              >
                {currentItem.subtitle}
              </span>

              {/* Title */}
              <h3 
                className="text-3xl font-light text-foreground mb-6"
                key={`title-${currentIndex}`}
                style={{
                  animation: 'fadeSlideIn 0.5s ease-out 0.2s both'
                }}
              >
                {currentItem.title}
              </h3>

              {/* Description */}
              <p 
                className="text-lg text-muted-foreground/70 font-light leading-relaxed max-w-md mx-auto"
                key={`desc-${currentIndex}`}
                style={{
                  animation: 'fadeSlideIn 0.5s ease-out 0.3s both'
                }}
              >
                {currentItem.description}
              </p>
            </div>
          </div>

          {/* Skip/navigation hint */}
          <div className="mt-8 text-center">
            <span className="text-xs text-muted-foreground/40">
              {currentIndex + 1} / {philosophyItems.length}
            </span>
          </div>
        </div>
      )}

      {/* Horizontal overview after all seen */}
      {showOverview && (
        <div className="w-full max-w-6xl mx-auto">
          {/* Section title */}
          <h2 
            className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 mb-16 text-center"
            style={{
              opacity: overviewProgress > 0.1 ? 1 : 0,
              transform: overviewProgress > 0.1 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out'
            }}
          >
            What I Build
          </h2>

          {/* Horizontal timeline */}
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/10 -translate-y-1/2">
              <div 
                className="h-full bg-gradient-to-r from-primary/40 to-primary/20"
                style={{
                  width: `${overviewProgress * 100}%`,
                  transition: 'width 0.3s ease-out'
                }}
              />
            </div>

            {/* Items */}
            <div className="flex justify-between items-center gap-4">
              {philosophyItems.map((item, index) => {
                const itemThreshold = (index + 0.3) / philosophyItems.length;
                const isVisible = overviewProgress > itemThreshold;
                const itemOpacity = Math.max(0, Math.min(1, (overviewProgress - itemThreshold) * 4));

                return (
                  <div
                    key={index}
                    className="flex-1 relative"
                    style={{
                      opacity: itemOpacity,
                      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                      transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1)`
                    }}
                  >
                    {/* Node */}
                    <div className="relative flex flex-col items-center">
                      {/* Dot on line */}
                      <div 
                        className="w-3 h-3 rounded-full bg-background border-2 border-primary/40 mb-6"
                        style={{
                          boxShadow: isVisible 
                            ? '0 0 20px hsl(var(--primary) / 0.4)' 
                            : 'none',
                          transition: 'box-shadow 0.5s ease-out'
                        }}
                      />

                      {/* Card - alternating above/below */}
                      <div 
                        className={`absolute ${index % 2 === 0 ? 'bottom-full mb-8' : 'top-full mt-8'} left-1/2 -translate-x-1/2 w-44`}
                      >
                        <div 
                          className="p-5 rounded-xl text-center"
                          style={{
                            background: 'hsl(var(--background) / 0.3)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid hsl(var(--primary) / 0.1)',
                          }}
                        >
                          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/50 block mb-2">
                            {item.subtitle}
                          </span>
                          <h3 className="text-sm font-light text-foreground mb-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted-foreground/60 font-light leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Connector line to dot */}
                        <div 
                          className={`absolute left-1/2 w-px bg-primary/20 ${
                            index % 2 === 0 ? 'top-full h-8' : 'bottom-full h-8'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSS for fade animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};
