import { useEffect, useRef, useState } from 'react';
import { philosophyItems } from './PhilosophyData';

/**
 * POC 5: Sequential Reveal with Morphing Container
 * Single container that morphs and reveals each philosophy one at a time
 * Text fades between items as you scroll
 */
export const PhilosophyReveal = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;
      
      // Progress through the section
      const scrolled = windowHeight - rect.top;
      const totalScrollable = sectionHeight;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      
      setScrollProgress(progress);
      
      // Determine active item
      const itemProgress = progress * philosophyItems.length;
      const newIndex = Math.min(
        Math.floor(itemProgress),
        philosophyItems.length - 1
      );
      setActiveIndex(newIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getItemOpacity = (index: number) => {
    const itemStart = index / philosophyItems.length;
    const itemEnd = (index + 1) / philosophyItems.length;
    const itemMid = (itemStart + itemEnd) / 2;
    
    if (scrollProgress < itemStart) return 0;
    if (scrollProgress > itemEnd) return 0;
    if (scrollProgress < itemMid) {
      return (scrollProgress - itemStart) / (itemMid - itemStart);
    }
    return 1 - (scrollProgress - itemMid) / (itemEnd - itemMid);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-[300vh] relative"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center px-8">
        {/* Progress indicators */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          {philosophyItems.map((_, index) => (
            <div
              key={index}
              className="w-1 h-8 rounded-full overflow-hidden bg-primary/10"
            >
              <div 
                className="w-full bg-primary/60 rounded-full"
                style={{
                  height: index === activeIndex ? '100%' : index < activeIndex ? '100%' : '0%',
                  opacity: index === activeIndex ? 1 : 0.4,
                  transition: 'all 0.4s ease-out'
                }}
              />
            </div>
          ))}
        </div>

        {/* Central container */}
        <div 
          className="max-w-2xl w-full relative"
          style={{
            minHeight: '300px'
          }}
        >
          {/* Background glow */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `radial-gradient(ellipse at center, hsl(var(--primary) / ${0.05 + scrollProgress * 0.1}) 0%, transparent 70%)`,
              transform: `scale(${1 + scrollProgress * 0.2})`,
              transition: 'transform 0.3s ease-out'
            }}
          />

          {/* Items */}
          {philosophyItems.map((item, index) => {
            const opacity = getItemOpacity(index);
            
            return (
              <div
                key={index}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 20}px) scale(${0.95 + opacity * 0.05})`,
                  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                {/* Number */}
                <span 
                  className="text-8xl font-extralight text-primary/10 mb-4"
                  style={{
                    transform: `translateY(${(1 - opacity) * -20}px)`,
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  0{index + 1}
                </span>

                {/* Subtitle */}
                <span className="text-xs uppercase tracking-[0.3em] text-primary/60 mb-4">
                  {item.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-3xl font-light text-foreground mb-6">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-lg text-muted-foreground/70 font-light leading-relaxed max-w-md">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section label */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <span 
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground/40 writing-mode-vertical"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              opacity: scrollProgress > 0.05 ? 1 : 0,
              transition: 'opacity 0.5s ease-out'
            }}
          >
            Philosophy
          </span>
        </div>
      </div>
    </section>
  );
};
