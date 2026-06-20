import React from "react";
import { PhilosophyItem } from "./PhilosophyData";

interface TrailStepperProps {
  items: readonly PhilosophyItem[];
  activeIndex: number;
  maxSeenIndex: number;
  allTraversed: boolean;
  onStepClick: (index: number) => void;
}

/**
 * TrailStepper: Dots with trailing opacity based on seen progress
 * Optimized for performance with static ring (no animation)
 */
export const TrailStepper: React.FC<TrailStepperProps> = ({
  items,
  activeIndex,
  maxSeenIndex,
  allTraversed,
  onStepClick,
}) => {
  return (
    <div className="relative flex flex-col items-center gap-4 md:gap-5">
      {/* Vertical connecting line behind dots */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-px"
        style={{
          top: 8,
          bottom: 8,
          background:
            "linear-gradient(to bottom, hsl(var(--primary) / 0.0) 0%, hsl(var(--primary) / 0.18) 50%, hsl(var(--primary) / 0.0) 100%)",
        }}
      />

      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const hasBeenSeen = allTraversed || index <= maxSeenIndex;
        const isPast = index < activeIndex;

        // Fade trail: opacity decreases for items behind active
        const trailOpacity = isPast
          ? 0.2 + (index / Math.max(activeIndex, 1)) * 0.3
          : hasBeenSeen
            ? 0.5
            : 0.12;

        return (
          <button
            key={index}
            type="button"
            onClick={() => hasBeenSeen && onStepClick(index)}
            disabled={!hasBeenSeen}
            aria-label={`Go to step ${index + 1}: ${item.title}`}
            className="group relative p-2"
            style={{ pointerEvents: hasBeenSeen ? "auto" : "none" }}
          >
            {/* Outer rings for active — layered halo, all centered on the dot */}
            {isActive && (
              <>
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-all duration-500"
                  style={{
                    width: 18,
                    height: 18,
                    transform: "translate(-50%, -50%)",
                    border: "1px solid hsl(var(--primary) / 0.35)",
                    boxShadow: "0 0 18px hsl(var(--primary) / 0.25)",
                  }}
                />
                <span
                  className="pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-all duration-500"
                  style={{
                    width: 28,
                    height: 28,
                    transform: "translate(-50%, -50%)",
                    border: "1px solid hsl(var(--primary) / 0.10)",
                  }}
                />
              </>
            )}
            <span
              className="relative block rounded-full transition-all duration-300 ease-out"
              style={{
                width: isActive ? 7 : 4,
                height: isActive ? 7 : 4,
                background: isActive
                  ? "hsl(var(--primary))"
                  : `hsl(210 20% 92% / ${trailOpacity})`,
                boxShadow: isActive
                  ? "0 0 14px hsl(var(--primary) / 0.7)"
                  : "none",
              }}
            />

            {/* Floating label that appears for active step */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 whitespace-nowrap text-[10px] uppercase tracking-[0.3em] font-body transition-all duration-500 hidden min-[1150px]:inline-block"
              style={{
                opacity: isActive ? 0.7 : 0,
                transform: `translateY(-50%) translateX(${isActive ? 0 : -4}px)`,
                color: "hsl(var(--primary))",
              }}
            >
              {item.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};
