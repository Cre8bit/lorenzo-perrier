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
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div 
        ref={barRef}
        className="liquid-bar relative px-8 py-4 rounded-full animate-liquid-wobble cursor-pointer"
        style={{ minWidth: '320px' }}
      >
        {/* Chapter markers */}
        <div className="flex justify-between relative">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => setActiveIndex(index)}
              className={`relative z-10 font-body text-sm tracking-wide transition-all duration-500 ${
                index === activeIndex 
                  ? 'text-foreground' 
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {chapter.label}
            </button>
          ))}
        </div>

        {/* Liquid droplet indicator */}
        <div
          ref={dropletRef}
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full transition-all ${
            isDragging ? 'duration-75 scale-125' : 'duration-500'
          }`}
          style={{
            left: `calc(${dropletPosition}% + ${dragOffset}px)`,
            boxShadow: '0 0 20px hsla(185, 50%, 55%, 0.5)',
            marginLeft: '-6px',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Ripple effect on drag */}
          {isDragging && (
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}
        </div>

        {/* Track line */}
        <div 
          className="absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2"
          style={{ marginTop: '16px' }}
        />
      </div>

      {/* Hint text */}
      <p className={`text-center mt-3 font-body text-xs text-muted-foreground/30 tracking-wider transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        drag to explore chapters
      </p>
    </div>
  );
};
