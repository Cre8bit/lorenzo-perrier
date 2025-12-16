import React from "react";
import { useScrollProgress } from "./useScrollProgress";

export const TransitionRibbon: React.FC = () => {
  const { ref, progress, isVisible } = useScrollProgress();

  return (
    <section ref={ref} className="relative min-h-[42vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 600ms var(--ease-smooth)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-px w-[120vw]"
          style={{
            transform: `translate(-50%, -50%) rotate(${lerp(-8, 10, progress)}deg)` ,
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.22), transparent)",
            filter: "blur(0.2px)",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[2px] w-[120vw]"
          style={{
            transform: `translate(-50%, -50%) rotate(${lerp(10, -6, progress)}deg) translateY(${lerp(26, -18, progress)}px)` ,
            background:
              "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.06), transparent)",
            opacity: 0.9,
          }}
        />
      </div>

      <div
        className="relative z-10 rounded-full px-5 py-2 text-xs tracking-widest uppercase"
        style={{
          background: "hsl(var(--background) / 0.35)",
          border: "1px solid hsl(var(--border) / 0.3)",
          backdropFilter: "blur(10px)",
          opacity: isVisible ? lerp(0.2, 0.9, progress) : 0,
          transform: `translateY(${lerp(16, -6, progress)}px)`,
          transition: "opacity 300ms var(--ease-smooth)",
        }}
      >
        continue
      </div>
    </section>
  );
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
