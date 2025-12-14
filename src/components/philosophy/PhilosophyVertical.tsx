import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * POC 1: Vertical Stacked Cards
 * Cards stack vertically and reveal one by one as user scrolls
 * Minimalist with subtle glass effect and line connectors
 */
export const PhilosophyVertical = () => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    itemRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleItems((prev) => 
                prev.includes(index) ? prev : [...prev, index]
              );
            }
          });
        },
        { threshold: 0.3, rootMargin: '-50px' }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <section 
      ref={containerRef}
      className="min-h-screen py-32 px-8 relative"
    >
      <div className="max-w-2xl mx-auto">
        {/* Section title */}
        <h2 
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 mb-24 text-center"
          style={{
            opacity: visibleItems.length > 0 ? 1 : 0,
            transition: 'opacity 0.8s ease-out'
          }}
        >
          Philosophy
        </h2>

        {/* Vertical timeline line */}
        <div className="absolute left-1/2 top-48 bottom-32 w-px">
          <div 
            className="w-full bg-gradient-to-b from-transparent via-primary/20 to-transparent"
            style={{
              height: `${(visibleItems.length / philosophyItems.length) * 100}%`,
              transition: 'height 0.8s ease-out'
            }}
          />
        </div>

        {/* Philosophy items */}
        <div className="space-y-32">
          {philosophyItems.map((item, index) => (
            <div
              key={index}
              ref={(el) => (itemRefs.current[index] = el)}
              className="relative"
              style={{
                opacity: visibleItems.includes(index) ? 1 : 0,
                transform: visibleItems.includes(index) 
                  ? 'translateY(0)' 
                  : 'translateY(40px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`
              }}
            >
              {/* Connector dot */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 -top-4 w-2 h-2 rounded-full bg-primary/40"
                style={{
                  boxShadow: visibleItems.includes(index) 
                    ? '0 0 20px hsl(var(--primary) / 0.4)' 
                    : 'none',
                  transition: 'box-shadow 0.8s ease-out 0.3s'
                }}
              />

              {/* Content card */}
              <div 
                className="text-center px-8 py-12 rounded-2xl"
                style={{
                  background: 'hsl(var(--background) / 0.3)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid hsl(var(--primary) / 0.1)'
                }}
              >
                <span className="text-xs uppercase tracking-[0.2em] text-primary/60 block mb-2">
                  {item.subtitle}
                </span>
                <h3 className="text-2xl font-light text-foreground mb-4">
                  {item.title}
                </h3>
                <p className="text-muted-foreground/80 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
