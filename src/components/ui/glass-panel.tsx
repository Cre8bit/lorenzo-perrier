import { ReactNode, useEffect, useRef, useState } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const GlassPanel = ({
  children,
  className = "",
  delay = 0,
}: GlassPanelProps) => {
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
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };

    const shine = panelRef.current.querySelector(".glass-shine") as HTMLElement;
    if (shine) {
      shine.style.background = `
        radial-gradient(
          circle at ${50 + mouseRef.current.x * 100}% ${
        50 + mouseRef.current.y * 100
      }%,
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
        ${isHovered ? "scale-[1.01]" : "scale-100"}
        ${className}
      `}
      style={{
        transform: isVisible
          ? `translateY(0) ${isHovered ? "scale(1.01)" : ""}`
          : "translateY(40px)",
        opacity: isVisible ? 1 : 0,
        background: isVisible
          ? isHovered
            ? "linear-gradient(135deg, hsla(185, 50%, 55%, 0.04) 0%, hsla(220, 20%, 4%, 0.15) 50%, hsla(185, 50%, 55%, 0.02) 100%)"
            : "linear-gradient(135deg, hsla(185, 50%, 55%, 0.01) 0%, hsla(220, 20%, 4%, 0.05) 50%, hsla(185, 50%, 55%, 0.005) 100%)"
          : "transparent",
        backdropFilter: isVisible
          ? isHovered
            ? "blur(16px)"
            : "blur(12px)"
          : "blur(0px)",
        WebkitBackdropFilter: isVisible
          ? isHovered
            ? "blur(16px)"
            : "blur(12px)"
          : "blur(0px)",
        border: isVisible
          ? isHovered
            ? "1px solid hsla(185, 50%, 55%, 0.15)"
            : "1px solid hsla(185, 50%, 55%, 0.08)"
          : "1px solid transparent",
        boxShadow: isVisible
          ? isHovered
            ? `0 0 60px hsla(185, 50%, 55%, 0.12), 0 8px 32px hsla(0, 0%, 0%, 0.15), inset 0 1px 0 hsla(210, 20%, 92%, 0.1)`
            : `0 8px 32px hsla(0, 0%, 0%, 0.1), 0 0 40px hsla(185, 50%, 55%, 0.08), inset 0 1px 0 hsla(210, 20%, 92%, 0.08)`
          : "none",
      }}
    >
      {/* Liquid reveal effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-700"
        style={{
          background: isHovered
            ? "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0.1) 0%, transparent 70%)"
            : "radial-gradient(ellipse 120% 100% at 50% 100%, hsla(185, 50%, 55%, 0) 0%, transparent 70%)",
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Shine overlay */}
      <div
        className="glass-shine absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Content */}
      <div className="relative z-10 p-8">{children}</div>

      {/* Border glow on hover */}
      <div
        className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          boxShadow: "inset 0 0 0 1px hsla(185, 50%, 55%, 0.15)",
        }}
      />
    </div>
  );
};
