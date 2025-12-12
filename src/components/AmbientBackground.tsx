import { useEffect, useRef } from 'react';

export const AmbientBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };

      if (containerRef.current) {
        const orbs = containerRef.current.querySelectorAll('.ambient-orb');
        orbs.forEach((orb, index) => {
          const element = orb as HTMLElement;
          const speed = 0.02 + index * 0.01;
          const offsetX = (mouseRef.current.x - 0.5) * 100 * speed;
          const offsetY = (mouseRef.current.y - 0.5) * 100 * speed;
          element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base gradient */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, hsla(200, 20%, 8%, 0.8) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 100% 100%, hsla(220, 25%, 6%, 0.6) 0%, transparent 40%),
            radial-gradient(ellipse 50% 30% at 0% 80%, hsla(185, 15%, 5%, 0.5) 0%, transparent 35%),
            linear-gradient(180deg, hsl(220, 20%, 4%) 0%, hsl(225, 22%, 3%) 100%)
          `,
          backgroundSize: '200% 200%',
        }}
      />

      {/* Ambient orbs */}
      <div 
        className="ambient-orb absolute w-[600px] h-[600px] rounded-full transition-transform duration-1000 ease-out"
        style={{
          top: '10%',
          left: '60%',
          background: 'radial-gradient(circle, hsla(185, 50%, 30%, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="ambient-orb absolute w-[800px] h-[800px] rounded-full transition-transform duration-1000 ease-out animate-pulse-glow"
        style={{
          top: '50%',
          left: '-10%',
          background: 'radial-gradient(circle, hsla(200, 40%, 25%, 0.06) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="ambient-orb absolute w-[500px] h-[500px] rounded-full transition-transform duration-1000 ease-out"
        style={{
          bottom: '10%',
          right: '20%',
          background: 'radial-gradient(circle, hsla(190, 45%, 28%, 0.07) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animationDelay: '2s',
        }}
      />
    </div>
  );
};
