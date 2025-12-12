import { ReactNode, useEffect, useRef, useState } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const GlassPanel = ({ children, className = '', delay = 0 }: GlassPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) - 0.5,
      y: ((e.clientY - rect.top) / rect.height) - 0.5,
    };

    const shine = panelRef.current.querySelector('.glass-shine') as HTMLElement;
    if (shine) {
      shine.style.background = `
        radial-gradient(
          circle at ${50 + mouseRef.current.x * 100}% ${50 + mouseRef.current.y * 100}%,
          hsla(185, 50%, 70%, 0.1) 0%,
          transparent 50%
        )
      `;
    }
  };

  return (
    <div
      ref={panelRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-700 ease-smooth
        ${isHovered ? 'scale-[1.01]' : 'scale-100'}
        ${className}
      `}
      style={{
        transform: isVisible 
          ? `translateY(0) ${isHovered ? 'scale(1.01)' : ''}` 
          : 'translateY(40px)',
        opacity: isVisible ? 1 : 0,
        background: isVisible 
          ? 'linear-gradient(135deg, hsla(220, 20%, 8%, 0.5) 0%, hsla(220, 20%, 6%, 0.3) 100%)'
          : 'transparent',
        backdropFilter: isVisible ? 'blur(20px)' : 'blur(0px)',
        WebkitBackdropFilter: isVisible ? 'blur(20px)' : 'blur(0px)',
        border: isVisible 
          ? '1px solid hsla(210, 20%, 92%, 0.06)' 
          : '1px solid transparent',
        boxShadow: isVisible 
          ? `0 0 40px hsla(185, 40%, 45%, 0.06), inset 0 1px 0 hsla(210, 20%, 92%, 0.04)`
          : 'none',
      }}
    >
      {/* Shine overlay */}
      <div className="glass-shine absolute inset-0 pointer-events-none transition-opacity duration-300" 
        style={{ opacity: isHovered ? 1 : 0 }} 
      />
      
      {/* Content */}
      <div className="relative z-10 p-8">
        {children}
      </div>

      {/* Border glow on hover */}
      <div 
        className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: 'inset 0 0 0 1px hsla(185, 50%, 55%, 0.12)',
        }}
      />
    </div>
  );
};
