import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * Philosophy Section: Line Drawing Animation
 * Lines draw along the edges of each block, traveling from top to bottom
 * Lines enter from both sides and meet at the bottom, then continue to the next block
 */
export const PhilosophyLineDrawing = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      const scrolled = windowHeight - rect.top;
      const totalScrollable = sectionHeight + windowHeight * 0.5;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate progress for each card (each card gets 25% of total progress)
  const getCardProgress = (index: number) => {
    const cardStart = index / philosophyItems.length;
    const cardEnd = (index + 1) / philosophyItems.length;
    const adjustedProgress = (scrollProgress - cardStart) / (cardEnd - cardStart);
    return Math.max(0, Math.min(1, adjustedProgress));
  };

  // Calculate line drawing progress (0-1 for full perimeter travel)
  const getLineProgress = (index: number) => {
    const cardProgress = getCardProgress(index);
    return cardProgress;
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-[200vh] py-32 px-8 relative"
    >
      <div className="max-w-xl mx-auto">
        {/* Section title */}
        <h2 
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 mb-16 text-center sticky top-8"
          style={{
            opacity: scrollProgress > 0.02 ? 1 : 0,
            transition: 'opacity 0.8s ease-out'
          }}
        >
          What I Build
        </h2>

        {/* Philosophy items with line drawing */}
        <div className="space-y-8 relative">
          {/* Central connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div 
              className="w-full bg-gradient-to-b from-primary/30 via-primary/20 to-transparent"
              style={{
                height: `${scrollProgress * 100}%`,
                transition: 'height 0.1s linear'
              }}
            />
          </div>

          {philosophyItems.map((item, index) => {
            const lineProgress = getLineProgress(index);
            const cardProgress = getCardProgress(index);
            const isActive = cardProgress > 0;
            const isComplete = cardProgress >= 1;
            
            // Line travels: top → down left side → across bottom ← up right side ← top
            // Total perimeter = 2 * height + 2 * width, normalized to 0-1
            // Left side: 0-0.35, Bottom: 0.35-0.65, Right side: 0.65-1
            
            const leftLineProgress = Math.min(lineProgress / 0.35, 1);
            const bottomLineProgress = Math.max(0, Math.min((lineProgress - 0.35) / 0.3, 1));
            const rightLineProgress = Math.max(0, Math.min((lineProgress - 0.65) / 0.35, 1));

            return (
              <div
                key={index}
                className="relative"
                style={{
                  opacity: isActive ? 1 : 0.3,
                  transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Entry dot from central line */}
                <div 
                  className="absolute left-1/2 -top-4 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(0)',
                    boxShadow: isActive ? '0 0 15px hsl(var(--primary) / 0.5)' : 'none',
                    transition: 'all 0.4s ease-out'
                  }}
                />

                {/* Content card with animated border */}
                <div 
                  className="relative px-8 py-10 rounded-2xl overflow-hidden"
                  style={{
                    background: 'hsl(var(--background) / 0.2)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* Animated border lines */}
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                  >
                    {/* Left border - travels down */}
                    <line
                      x1="1" y1="0" x2="1" y2="100%"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="100%"
                      strokeDashoffset={`${(1 - leftLineProgress) * 100}%`}
                      style={{ 
                        opacity: 0.4,
                        transition: 'stroke-dashoffset 0.05s linear'
                      }}
                    />
                    
                    {/* Right border - travels down (from other side) */}
                    <line
                      x1="calc(100% - 1px)" y1="0" x2="calc(100% - 1px)" y2="100%"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="100%"
                      strokeDashoffset={`${(1 - leftLineProgress) * 100}%`}
                      style={{ 
                        opacity: 0.4,
                        transition: 'stroke-dashoffset 0.05s linear'
                      }}
                    />

                    {/* Bottom border - left half, travels right */}
                    <line
                      x1="0" y1="calc(100% - 1px)" x2="50%" y2="calc(100% - 1px)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="50%"
                      strokeDashoffset={`${(1 - bottomLineProgress) * 50}%`}
                      style={{ 
                        opacity: 0.5,
                        transition: 'stroke-dashoffset 0.05s linear'
                      }}
                    />

                    {/* Bottom border - right half, travels left */}
                    <line
                      x1="100%" y1="calc(100% - 1px)" x2="50%" y2="calc(100% - 1px)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="50%"
                      strokeDashoffset={`${(1 - bottomLineProgress) * 50}%`}
                      style={{ 
                        opacity: 0.5,
                        transition: 'stroke-dashoffset 0.05s linear'
                      }}
                    />

                    {/* Top border - appears after complete */}
                    <line
                      x1="0" y1="1" x2="100%" y2="1"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      style={{ 
                        opacity: isActive ? 0.2 : 0,
                        transition: 'opacity 0.3s ease-out'
                      }}
                    />
                  </svg>

                  {/* Corner glow effects when lines meet */}
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
                    style={{
                      background: 'hsl(var(--primary) / 0.6)',
                      filter: 'blur(8px)',
                      opacity: bottomLineProgress > 0.9 ? 1 : 0,
                      transition: 'opacity 0.3s ease-out'
                    }}
                  />

                  {/* Content */}
                  <div className="text-center relative z-10">
                    <span 
                      className="text-xs uppercase tracking-[0.2em] text-primary/60 block mb-3"
                      style={{
                        opacity: cardProgress > 0.2 ? 1 : 0,
                        transform: cardProgress > 0.2 ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 0.4s ease-out 0.1s'
                      }}
                    >
                      {item.subtitle}
                    </span>
                    <h3 
                      className="text-2xl font-light text-foreground mb-4"
                      style={{
                        opacity: cardProgress > 0.3 ? 1 : 0,
                        transform: cardProgress > 0.3 ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 0.4s ease-out 0.2s'
                      }}
                    >
                      {item.title}
                    </h3>
                    <p 
                      className="text-muted-foreground/80 font-light leading-relaxed"
                      style={{
                        opacity: cardProgress > 0.4 ? 1 : 0,
                        transform: cardProgress > 0.4 ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 0.4s ease-out 0.3s'
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Exit line to next card */}
                {index < philosophyItems.length - 1 && (
                  <div 
                    className="absolute left-1/2 -bottom-8 -translate-x-1/2 w-px h-8"
                    style={{
                      background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2))',
                      opacity: isComplete ? 1 : 0,
                      transform: isComplete ? 'scaleY(1)' : 'scaleY(0)',
                      transformOrigin: 'top',
                      transition: 'all 0.3s ease-out'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
