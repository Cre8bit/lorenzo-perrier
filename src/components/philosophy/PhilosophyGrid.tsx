import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * POC 2: Grid Layout with Staggered Reveal
 * 2x2 grid that reveals with staggered timing
 * Each card has a unique border animation
 */
export const PhilosophyGrid = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen py-32 px-8 flex items-center justify-center"
    >
      <div className="max-w-4xl w-full">
        {/* Section title */}
        <h2 
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground/60 mb-16 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease-out'
          }}
        >
          Philosophy
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {philosophyItems.map((item, index) => {
            const delays = [0, 0.15, 0.3, 0.45];
            
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl overflow-hidden"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delays[index]}s`,
                  background: 'hsl(var(--background) / 0.2)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                {/* Animated border */}
                <div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(${90 + index * 45}deg, 
                      transparent 0%, 
                      hsl(var(--primary) / 0.3) 50%, 
                      transparent 100%)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    padding: '1px',
                    opacity: isVisible ? 1 : 0,
                    transition: `opacity 0.8s ease-out ${delays[index] + 0.3}s`
                  }}
                />

                {/* Index number */}
                <span 
                  className="text-6xl font-extralight text-primary/10 absolute top-4 right-6"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: `opacity 0.6s ease-out ${delays[index] + 0.4}s`
                  }}
                >
                  0{index + 1}
                </span>

                {/* Content */}
                <div className="relative z-10">
                  <span className="text-xs uppercase tracking-[0.2em] text-primary/60 block mb-3">
                    {item.subtitle}
                  </span>
                  <h3 className="text-xl font-light text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground/70 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Hover glow */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
