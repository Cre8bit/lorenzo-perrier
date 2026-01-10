import React from "react";

interface StepperProps {
  items: readonly any[];
  activeIndex: number;
  maxSeenIndex: number;
  allTraversed: boolean;
  progress: number;
  onStepClick: (index: number) => void;
}

/* ─────────────────────────────────────────────────────────────
   VARIANT A: "Whisper Dots"
   Ultra-minimal floating dots with soft glow on active
   ───────────────────────────────────────────────────────────── */
export const StepperWhisperDots: React.FC<StepperProps> = ({
  items,
  activeIndex,
  maxSeenIndex,
  allTraversed,
  onStepClick,
}) => {
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4">
      {items.map((_, index) => {
        const isActive = index === activeIndex;
        const hasBeenSeen = allTraversed || index <= maxSeenIndex;

        return (
          <button
            key={index}
            type="button"
            onClick={() => hasBeenSeen && onStepClick(index)}
            disabled={!hasBeenSeen}
            aria-label={`Go to step ${index + 1}`}
            className="group relative p-2 md:p-3"
            style={{ pointerEvents: hasBeenSeen ? "auto" : "none" }}
          >
            <span
              className="block rounded-full transition-all duration-300 ease-out"
              style={{
                width: isActive ? 8 : 5,
                height: isActive ? 8 : 5,
                background: hasBeenSeen
                  ? `rgba(255,255,255,${isActive ? 0.9 : 0.35})`
                  : "rgba(255,255,255,0.12)",
                boxShadow: isActive
                  ? "0 0 12px rgba(255,255,255,0.25), 0 0 24px rgba(255,255,255,0.1)"
                  : "none",
                transform: `scale(${isActive ? 1 : 0.9})`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   VARIANT B: "Glass Capsule"
   Vertical track with sliding glass indicator
   ───────────────────────────────────────────────────────────── */
export const StepperGlassCapsule: React.FC<StepperProps> = ({
  items,
  activeIndex,
  maxSeenIndex,
  allTraversed,
  progress,
  onStepClick,
}) => {
  const n = items.length;
  const trackHeight = 120; // Fixed track height
  const indicatorHeight = trackHeight / n;

  return (
    <div className="relative flex flex-col items-center">
      {/* Glass track */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: 3,
          height: trackHeight,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Sliding indicator */}
        <div
          className="absolute left-0 right-0 rounded-full transition-all duration-500 ease-out"
          style={{
            height: indicatorHeight,
            top: progress * (trackHeight - indicatorHeight),
            background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)",
            boxShadow: "0 0 10px rgba(255,255,255,0.2)",
          }}
        />
      </div>

      {/* Invisible touch targets */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{ height: trackHeight }}
      >
        {items.map((_, index) => {
          const hasBeenSeen = allTraversed || index <= maxSeenIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => hasBeenSeen && onStepClick(index)}
              disabled={!hasBeenSeen}
              aria-label={`Go to step ${index + 1}`}
              className="flex-1 w-full min-w-[44px] -ml-5"
              style={{
                pointerEvents: hasBeenSeen ? "auto" : "none",
                cursor: hasBeenSeen ? "pointer" : "default",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   VARIANT C: "Breath Line"
   Single morphing line that breathes with scroll
   ───────────────────────────────────────────────────────────── */
export const StepperBreathLine: React.FC<StepperProps> = ({
  items,
  activeIndex,
  maxSeenIndex,
  allTraversed,
  progress,
  onStepClick,
}) => {
  const n = items.length;

  return (
    <div className="flex flex-col items-center gap-0">
      {items.map((_, index) => {
        const isActive = index === activeIndex;
        const hasBeenSeen = allTraversed || index <= maxSeenIndex;
        const isPast = index < activeIndex;

        // Breathing effect based on distance from active
        const dist = Math.abs(index - activeIndex);
        const breathScale = 1 - dist * 0.15;

        return (
          <button
            key={index}
            type="button"
            onClick={() => hasBeenSeen && onStepClick(index)}
            disabled={!hasBeenSeen}
            aria-label={`Go to step ${index + 1}`}
            className="group relative py-2 md:py-3 px-3"
            style={{ pointerEvents: hasBeenSeen ? "auto" : "none" }}
          >
            <span
              className="block rounded-full transition-all duration-400 ease-out"
              style={{
                width: isActive ? 24 : isPast ? 14 : 10,
                height: 2,
                background: hasBeenSeen
                  ? `rgba(255,255,255,${isActive ? 0.85 : isPast ? 0.5 : 0.2})`
                  : "rgba(255,255,255,0.08)",
                transform: `scaleY(${breathScale})`,
                boxShadow: isActive
                  ? "0 0 8px rgba(255,255,255,0.15)"
                  : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   VARIANT D: "Fade Trail"
   Dots with trailing opacity based on seen progress
   ───────────────────────────────────────────────────────────── */
export const StepperFadeTrail: React.FC<StepperProps> = ({
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
            {/* Outer ring for active */}
            {isActive && (
              <span
                className="absolute inset-0 m-auto rounded-full animate-pulse"
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
                boxShadow: isActive
                  ? "0 0 10px rgba(255,255,255,0.3)"
                  : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DEFAULT EXPORT: Component selector
   ───────────────────────────────────────────────────────────── */
export type StepperVariant = "whisper" | "capsule" | "breath" | "trail";

export const StepperSelector: React.FC<StepperProps & { variant: StepperVariant }> = ({
  variant,
  ...props
}) => {
  switch (variant) {
    case "whisper":
      return <StepperWhisperDots {...props} />;
    case "capsule":
      return <StepperGlassCapsule {...props} />;
    case "breath":
      return <StepperBreathLine {...props} />;
    case "trail":
      return <StepperFadeTrail {...props} />;
    default:
      return <StepperWhisperDots {...props} />;
  }
};
