import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * POC 3: Constellation Formation
 * Items start scattered and converge to form a connected constellation as you scroll
 * Lines draw between nodes to show relationships
 */
export const PhilosophyConstellation = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Node positions (scattered -> final)
  const nodePositions = [
    { startX: 15, startY: 20, endX: 25, endY: 30 },
    { startX: 85, startY: 15, endX: 75, endY: 30 },
    { startX: 10, startY: 80, endX: 25, endY: 70 },
    { startX: 90, startY: 85, endX: 75, endY: 70 }
  ];

  // Connections between nodes
  const connections = [
    [0, 1], [1, 3], [3, 2], [2, 0], [0, 3], [1, 2]
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress based on section position
      const start = windowHeight * 0.8;
      const end = -rect.height * 0.5;
      const current = rect.top;
      
      const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lerp = (start: number, end: number, progress: number) => 
    start + (end - start) * Math.min(1, progress * 1.5);

  return (
    <section 
      ref={sectionRef}
      className="min-h-[150vh] py-32 px-8 relative"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="relative w-full max-w-6xl h-[80vh]">
          
          {/* Section title */}
          <h2 
            className="absolute top-0 left-1/2 -translate-x-1/2 text-sm uppercase tracking-[0.3em] text-muted-foreground/60"
            style={{
              opacity: scrollProgress > 0.1 ? 1 : 0,
              transition: 'opacity 0.5s ease-out'
            }}
          >
            Philosophy
          </h2>

          {/* SVG for connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map(([from, to], index) => {
              const fromPos = nodePositions[from];
              const toPos = nodePositions[to];
              
              const x1 = lerp(fromPos.startX, fromPos.endX, scrollProgress);
              const y1 = lerp(fromPos.startY, fromPos.endY, scrollProgress);
              const x2 = lerp(toPos.startX, toPos.endX, scrollProgress);
              const y2 = lerp(toPos.startY, toPos.endY, scrollProgress);

              const lineProgress = Math.max(0, (scrollProgress - 0.3) * 2);

              return (
                <line
                  key={index}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="1"
                  style={{
                    opacity: lineProgress,
                    transition: 'opacity 0.3s ease-out'
                  }}
                />
              );
            })}
          </svg>

          {/* Philosophy nodes */}
          {philosophyItems.map((item, index) => {
            const pos = nodePositions[index];
            const x = lerp(pos.startX, pos.endX, scrollProgress);
            const y = lerp(pos.startY, pos.endY, scrollProgress);
            const itemOpacity = Math.min(1, scrollProgress * 2);
            const contentOpacity = Math.max(0, (scrollProgress - 0.4) * 2.5);

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  opacity: itemOpacity,
                  transition: 'opacity 0.3s ease-out'
                }}
              >
                {/* Node dot */}
                <div 
                  className="w-3 h-3 rounded-full bg-primary/60 mx-auto mb-4"
                  style={{
                    boxShadow: `0 0 ${20 + scrollProgress * 20}px hsl(var(--primary) / ${0.3 + scrollProgress * 0.3})`
                  }}
                />

                {/* Content */}
                <div 
                  className="text-center w-48"
                  style={{
                    opacity: contentOpacity,
                    transform: `translateY(${(1 - contentOpacity) * 10}px)`,
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  <span className="text-xs uppercase tracking-[0.15em] text-primary/50 block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-base font-light text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
