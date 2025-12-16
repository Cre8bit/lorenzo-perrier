import React from "react";
import { useScrollProgress } from "./useScrollProgress";

export const TransitionSoftDivider: React.FC = () => {
  const { ref, progress, isVisible } = useScrollProgress();

  return (
    <section ref={ref} className="relative min-h-[38vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 600ms var(--ease-smooth)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-px w-[92vw] max-w-4xl"
          style={{
            transform: `translate(-50%, -50%) scaleX(${0.7 + progress * 0.3})`,
            transformOrigin: "50% 50%",
            background:
              "linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.08), transparent)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 rounded-full blur-3xl"
          style={{
            width: 220,
            height: 220,
            transform: `translate(-50%, -50%) scale(${0.85 + progress * 0.35})`,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.09) 0%, transparent 70%)",
            opacity: 0.65 * progress,
          }}
        />
      </div>

      <div className="relative z-10 text-xs tracking-widest uppercase text-muted-foreground/50">scroll</div>
    </section>
  );
};
