import { useEffect, useRef, useState } from "react";

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const xOffset = (clientX / innerWidth - 0.5) * 20;
      const yOffset = (clientY / innerHeight - 0.5) * 15;

      textRef.current.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <div
        ref={textRef}
        className="text-center transition-transform duration-700 ease-smooth"
      >
        <h1
          className={`font-display text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 transition-all duration-1000 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="block bg-gradient-to-b from-foreground to-primary bg-clip-text text-transparent font-extralight tracking-wider mb-1">
            Lorenzo
          </span>
          <span className="block bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent font-normal tracking-tight">
            Perrier de La Bâthie
          </span>
        </h1>

        <p
          className={`font-body text-lg md:text-xl font-extralight text-muted-foreground max-w-md mx-auto tracking-wide transition-all duration-1000 delay-300 ease-smooth ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Exploring the architecture of systems,
          <br />
          <span className="text-primary/70">motion, and flow.</span>
        </p>

      </div>
    </section>
  );
};
