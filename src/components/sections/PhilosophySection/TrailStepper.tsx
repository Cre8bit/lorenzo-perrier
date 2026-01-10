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
    <div className="flex flex-col items-center gap-4 md:gap-5">
      {items.map((_, index) => {
        const isActive = index === activeIndex;
        const hasBeenSeen = allTraversed || index <= maxSeenIndex;
        const isPast = index < activeIndex;

        // Fade trail: opacity decreases for items behind active
        const trailOpacity = isPast
          ? 0.2 + (index / activeIndex) * 0.3
          : hasBeenSeen
          ? 0.5
          : 0.1;

        return (
          <button
            key={index}
            type="button"
            onClick={() => hasBeenSeen && onStepClick(index)}
            disabled={!hasBeenSeen}
            aria-label={`Go to step ${index + 1}`}
            className="group relative p-2"
            style={{ pointerEvents: hasBeenSeen ? "auto" : "none" }}
          >
            {/* Outer ring for active - no animation for performance */}
            {isActive && (
              <span
                className="absolute inset-0 m-auto rounded-full"
                style={{
                  width: 16,
                  height: 16,
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
            )}
            <span
              className="relative block rounded-full transition-all duration-300 ease-out"
              style={{
                width: isActive ? 6 : 4,
                height: isActive ? 6 : 4,
                background: isActive
                  ? "rgba(255,255,255,0.95)"
                  : `rgba(255,255,255,${trailOpacity})`,
                boxShadow: isActive ? "0 0 10px rgba(255,255,255,0.3)" : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
