import React from "react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

export const TransitionPulseGate: React.FC = () => {
  const { ref, progress, isVisible } = useScrollProgress();

  const barW = 320;
  const barH = 10;

  return (
    <section ref={ref} className="relative min-h-[1vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 600ms var(--ease-smooth)",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: barW,
            height: barH,
            transform: `translate(-50%, -50%) scaleX(${0.7 + progress * 0.6})`,
            borderRadius: 999,
            background: "hsl(var(--background) / 0.35)",
            border: "1px solid hsl(var(--border) / 0.28)",
            backdropFilter: "blur(12px)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: barW,
            height: barH,
            transform: `translate(-50%, -50%) scaleX(${progress})`,
            transformOrigin: "0% 50%",
            borderRadius: 999,
            background: "linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.25))",
            boxShadow: "0 0 22px hsl(var(--primary) / 0.18)",
            opacity: 0.9,
          }}
        />
      </div>

      <div
        className="relative z-10 text-xs tracking-widest uppercase"
        style={{
          color: "hsl(var(--foreground) / 0.6)",
          opacity: isVisible ? 0.55 + progress * 0.35 : 0,
          transform: `translateY(${(1 - progress) * 10}px)`,
          transition: "opacity 300ms var(--ease-smooth)",
        }}
      >
        enter
      </div>
    </section>
  );
};
