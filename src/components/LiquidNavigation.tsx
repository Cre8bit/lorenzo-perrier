import { useState, useRef, useEffect } from 'react';

const chapters = [
  { id: 'systems', label: 'Systems' },
  { id: 'motion', label: 'Motion' },
  { id: 'data', label: 'Data' },
  { id: 'craft', label: 'Craft' },
];

export const LiquidNavigation = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);

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
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={barRef}
        className="relative px-10 py-5 rounded-full cursor-pointer overflow-hidden transition-all duration-700 ease-smooth"
        style={{ 
          minWidth: '360px',
          background: isHovered 
            ? 'linear-gradient(135deg, hsla(185, 50%, 55%, 0.12) 0%, hsla(220, 20%, 4%, 0.6) 50%, hsla(185, 50%, 55%, 0.08) 100%)'
            : 'linear-gradient(135deg, hsla(185, 50%, 55%, 0.02) 0%, hsla(220, 20%, 4%, 0.15) 50%, hsla(185, 50%, 55%, 0.01) 100%)',
          backdropFilter: isHovered ? 'blur(24px)' : 'blur(4px)',
          WebkitBackdropFilter: isHovered ? 'blur(24px)' : 'blur(4px)',
          border: isHovered 
            ? '1px solid hsla(185, 50%, 55%, 0.2)' 
            : '1px solid hsla(185, 50%, 55%, 0.03)',
          boxShadow: isHovered 
            ? `0 0 60px hsla(185, 50%, 55%, 0.15), 0 0 100px hsla(185, 50%, 55%, 0.08), inset 0 1px 0 hsla(210, 20%, 92%, 0.1)`
            : '0 0 20px hsla(185, 50%, 55%, 0.02)',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Liquid reveal effect */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none transition-all duration-1000"
          style={{
            background: isHovered 
              ? 'radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0) 0%, transparent 70%)',
            opacity: isHovered ? 1 : 0,
          }}
        />
        
        {/* Glass flare sweep */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, hsla(185, 50%, 70%, 0.15) 45%, hsla(210, 20%, 92%, 0.1) 50%, transparent 55%)',
            transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Subtle inner glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsla(185, 50%, 55%, 0.12) 0%, transparent 60%)',
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Chapter markers */}
        <div className="flex justify-between relative z-10">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => setActiveIndex(index)}
              className="relative font-body text-sm tracking-wide transition-all duration-500"
              style={{
                color: index === activeIndex 
                  ? 'hsl(210, 20%, 92%)' 
                  : isHovered 
                    ? 'hsla(210, 20%, 92%, 0.4)' 
                    : 'hsla(210, 20%, 92%, 0.15)',
                textShadow: index === activeIndex && isHovered 
                  ? '0 0 20px hsla(185, 50%, 55%, 0.5)' 
                  : 'none',
              }}
            >
              {chapter.label}
            </button>
          ))}
        </div>

        {/* Liquid droplet indicator */}
        <div
          ref={dropletRef}
          className={`absolute top-1/2 -translate-y-1/2 rounded-full transition-all ${
            isDragging ? 'duration-75' : 'duration-500'
          }`}
          style={{
            left: `calc(${dropletPosition}% + ${dragOffset}px)`,
            marginLeft: '-5px',
            width: isHovered ? '10px' : '6px',
            height: isHovered ? '10px' : '6px',
            background: isHovered 
              ? 'linear-gradient(135deg, hsl(185, 50%, 55%) 0%, hsla(185, 50%, 55%, 0.6) 100%)'
              : 'hsla(185, 50%, 55%, 0.3)',
            boxShadow: isHovered 
              ? `0 0 20px hsla(185, 50%, 55%, 0.6), 0 0 40px hsla(185, 50%, 55%, 0.3), inset 0 1px 2px hsla(210, 20%, 92%, 0.3)`
              : '0 0 10px hsla(185, 50%, 55%, 0.1)',
            transform: isDragging ? 'translateY(-50%) scale(1.5)' : 'translateY(-50%) scale(1)',
          }}
          onMouseDown={handleMouseDown}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
        </div>

        {/* Track line */}
        <div 
          className="absolute left-10 right-10 top-1/2 h-px -translate-y-1/2 pointer-events-none transition-opacity duration-700"
          style={{ 
            marginTop: '18px',
            background: 'linear-gradient(90deg, transparent 0%, hsla(185, 50%, 55%, 0.15) 20%, hsla(185, 50%, 55%, 0.15) 80%, transparent 100%)',
            opacity: isHovered ? 1 : 0.2,
          }}
        />
      </div>

      {/* Hint text */}
      <p 
        className="text-center mt-4 font-body text-xs tracking-widest uppercase transition-all duration-700"
        style={{
          color: 'hsla(210, 20%, 92%, 0.2)',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        drag to explore
      </p>
    </div>
  );
};
