import React from "react";
import { useScrollProgress } from "./useScrollProgress";

export const TransitionOrbit: React.FC = () => {
  const { ref, progress, isVisible } = useScrollProgress();

  const rot = 160 * progress;
  const ringScale = 0.75 + progress * 0.35;

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
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 360,
            height: 360,
            transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${ringScale})`,
            border: "1px solid hsl(var(--primary) / 0.18)",
            boxShadow: "0 0 60px hsl(var(--primary) / 0.06)",
            background:
              "radial-gradient(circle at 50% 50%, transparent 55%, hsl(var(--foreground) / 0.03) 65%, transparent 72%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 220,
            height: 220,
            transform: `translate(-50%, -50%) rotate(${-rot}deg) scale(${0.85 + progress * 0.25})`,
            border: "1px solid hsl(var(--foreground) / 0.06)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 rounded-full blur-3xl"
          style={{
            width: 220,
            height: 220,
            transform: `translate(-50%, -50%) scale(${0.8 + progress * 0.5})`,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
            opacity: 0.55 * progress,
          }}
        />
      </div>

      <div className="relative z-10 text-xs tracking-widest uppercase text-muted-foreground/60">drift</div>
    </section>
  );
};
