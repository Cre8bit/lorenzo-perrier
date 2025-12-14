import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * POC 4: Horizontal Flow Timeline
 * Items flow horizontally like a timeline with connecting line
 * Reveals left to right as you scroll
 */
export const PhilosophyHorizontal = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const start = windowHeight * 0.7;
      const end = -rect.height * 0.3;
      const current = rect.top;
      
      const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen py-32 px-8 flex items-center overflow-hidden"
    >
      <div className="w-full max-w-6xl mx-auto">
        {/* Section title */}
        <h2 
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 mb-20 text-center"
          style={{
            opacity: scrollProgress > 0.1 ? 1 : 0,
            transform: scrollProgress > 0.1 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          Philosophy
        </h2>

        {/* Horizontal timeline container */}
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/10 -translate-y-1/2">
            <div 
              className="h-full bg-gradient-to-r from-primary/40 to-primary/20"
              style={{
                width: `${scrollProgress * 100}%`,
                transition: 'width 0.1s linear'
              }}
            />
          </div>

          {/* Items */}
          <div className="flex justify-between items-center gap-4">
            {philosophyItems.map((item, index) => {
              const itemThreshold = (index + 0.5) / philosophyItems.length;
              const isVisible = scrollProgress > itemThreshold * 0.8;
              const itemProgress = Math.max(0, Math.min(1, (scrollProgress - itemThreshold * 0.6) * 3));

              return (
                <div
                  key={index}
                  className="flex-1 relative"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`
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
                        transition: 'box-shadow 0.5s ease-out 0.3s'
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
                          opacity: itemProgress,
                          transform: `scale(${0.9 + itemProgress * 0.1})`,
                          transition: 'all 0.4s ease-out'
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
                        style={{
                          opacity: itemProgress,
                          transition: 'opacity 0.3s ease-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
