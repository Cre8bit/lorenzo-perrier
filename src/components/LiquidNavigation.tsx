import { useState, useRef, useEffect } from 'react';

const chapters = [
  { id: 'systems', label: 'Systems' },
  { id: 'motion', label: 'Motion' },
  { id: 'data', label: 'Data' },
  { id: 'craft', label: 'Craft' },
];

export const LiquidNavigation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const bottomThreshold = window.innerHeight - 150;
      setIsVisible(e.clientY > bottomThreshold);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current) return;
      
      const rect = barRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newIndex = Math.round(percentage * (chapters.length - 1));
      
      setDragOffset((percentage - newIndex / (chapters.length - 1)) * 20);
      setActiveIndex(newIndex);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const dropletPosition = (activeIndex / (chapters.length - 1)) * 100;

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ease-smooth ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div 
        ref={barRef}
        className={`relative px-10 py-5 rounded-full cursor-pointer overflow-hidden ${
          isVisible ? 'animate-glass-reveal' : ''
        }`}
        style={{ 
          minWidth: '360px',
          background: 'linear-gradient(135deg, hsla(var(--primary), 0.08) 0%, hsla(var(--background), 0.4) 50%, hsla(var(--primary), 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsla(var(--primary), 0.15)',
          boxShadow: `
            0 0 40px hsla(var(--primary), 0.1),
            inset 0 1px 0 hsla(255, 255, 255, 0.1),
            inset 0 -1px 0 hsla(0, 0, 0, 0.1)
          `,
        }}
      >
        {/* Glass flare effect */}
        <div 
          className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-1000 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(105deg, transparent 20%, hsla(var(--primary), 0.2) 35%, hsla(255, 255, 255, 0.15) 40%, transparent 50%)',
            animation: isVisible ? 'glass-flare 1.5s ease-out forwards' : 'none',
          }}
        />
        
        {/* Subtle inner glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsla(var(--primary), 0.15) 0%, transparent 60%)',
          }}
        />

        {/* Chapter markers */}
        <div className="flex justify-between relative z-10">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => setActiveIndex(index)}
              className={`relative font-body text-sm tracking-wide transition-all duration-500 ${
                index === activeIndex 
                  ? 'text-foreground drop-shadow-[0_0_8px_hsla(var(--primary),0.5)]' 
                  : 'text-muted-foreground/40 hover:text-muted-foreground/70'
              }`}
            >
              {chapter.label}
            </button>
          ))}
        </div>

        {/* Liquid droplet indicator */}
        <div
          ref={dropletRef}
          className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all ${
            isDragging ? 'duration-75 scale-150' : 'duration-500'
          }`}
          style={{
            left: `calc(${dropletPosition}% + ${dragOffset}px)`,
            marginLeft: '-5px',
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsla(var(--primary), 0.6) 100%)',
            boxShadow: `
              0 0 20px hsla(var(--primary), 0.6),
              0 0 40px hsla(var(--primary), 0.3),
              inset 0 1px 2px hsla(255, 255, 255, 0.3)
            `,
          }}
          onMouseDown={handleMouseDown}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
        </div>

        {/* Track line */}
        <div 
          className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 pointer-events-none"
          style={{ 
            marginTop: '18px',
            background: 'linear-gradient(90deg, transparent 0%, hsla(var(--primary), 0.2) 20%, hsla(var(--primary), 0.2) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* Hint text */}
      <p className={`text-center mt-4 font-body text-xs text-muted-foreground/25 tracking-widest uppercase transition-all duration-700 delay-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        drag to explore
      </p>
    </div>
  );
};
