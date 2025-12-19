import React, { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { carouselContexts, sectionTitle } from "./CarouselData";
import { GlassCarouselCard, type CarouselTint } from "./GlassCarouselCard";
import { useAutoplayProgress } from "@/hooks/use-autoplay-progress";
import { useCarouselTransition } from "@/hooks/use-carousel-transition";
import { clampIndex, lerp } from "@/utils/animation";

const TIMER_DURATION = 5000;

const cardTints: CarouselTint[] = [
  {
    bg: "hsl(var(--carousel-tint-1))",
    border: "hsl(var(--carousel-tint-1-border))",
    glow: "hsl(var(--carousel-tint-1-glow))",
  },
  {
    bg: "hsl(var(--carousel-tint-2))",
    border: "hsl(var(--carousel-tint-2-border))",
    glow: "hsl(var(--carousel-tint-2-glow))",
  },
  {
    bg: "hsl(var(--carousel-tint-3))",
    border: "hsl(var(--carousel-tint-3-border))",
    glow: "hsl(var(--carousel-tint-3-glow))",
  },
];

function transformFor(
  slot: "left" | "center" | "right",
  t: number,
  dir: -1 | 1
) {
  // Base positions
  const X = 320;
  const base = {
    left: { x: -X, z: -80, scale: 0.84, ry: 18, rz: -2, opacity: 0.62 },
    center: { x: 0, z: 90, scale: 1, ry: 0, rz: 0, opacity: 1 },
    right: { x: X, z: -80, scale: 0.84, ry: -18, rz: 2, opacity: 0.62 },
  } as const;

  // During animation: the center travels to the opposite side, and the incoming side travels to center.
  // The opposite side stays lightly drifting so the motion feels continuous but not busy.
  const outgoingTarget = dir === 1 ? base.left : base.right;
  const incomingStart = dir === 1 ? base.right : base.left;
  const oppositeSide = dir === 1 ? base.left : base.right;

  if (slot === "center") {
    const from = base.center;
    const to = outgoingTarget;
    return {
      x: lerp(from.x, to.x, t),
      z: lerp(from.z, to.z, t),
      scale: lerp(from.scale, to.scale, t),
      ry: lerp(from.ry, to.ry, t),
      rz: lerp(from.rz, to.rz, t),
      // Keep it visible while it travels so it feels like a real object moving across space.
      opacity: lerp(from.opacity, 0.62, t),
    };
  }

  if ((dir === 1 && slot === "right") || (dir === -1 && slot === "left")) {
    const from = incomingStart;
    const to = base.center;
    return {
      x: lerp(from.x, to.x, t),
      z: lerp(from.z, to.z, t),
      scale: lerp(from.scale, to.scale, t),
      ry: lerp(from.ry, to.ry, t),
      rz: lerp(from.rz, to.rz, t),
      opacity: lerp(from.opacity, to.opacity, t),
    };
  }

  // Opposite side: subtle drift + small dim so it doesn't compete.
  const from = oppositeSide;
  const drift = dir === 1 ? -18 : 18;
  return {
    x: from.x + drift * t,
    z: from.z,
    scale: from.scale,
    ry: from.ry,
    rz: from.rz,
    opacity: lerp(from.opacity, 0.35, t),
  };
}

function CardLayer(props: {
  index: number;
  slot: "left" | "center" | "right";
  t: number;
  dir: -1 | 1;
  isAnimating: boolean;
  isActive: boolean;
  isFlipped: boolean;
  onFlip?: () => void;
  onClick?: () => void;
}) {
  const {
    index,
    slot,
    t,
    dir,
    isAnimating,
    isActive,
    isFlipped,
    onFlip,
    onClick,
  } = props;
  const tint = cardTints[index % cardTints.length];
  const context = carouselContexts[index];
  const m = isAnimating ? transformFor(slot, t, dir) : transformFor(slot, 0, 1);

  const zIndex = slot === "center" ? 30 : 20;

  return (
    <div
      className={slot !== "center" ? "cursor-pointer" : undefined}
      onClick={slot !== "center" ? onClick : undefined}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `perspective(1200px) translate3d(calc(-50% + ${m.x}px), -50%, ${m.z}px) scale(${m.scale}) rotateY(${m.ry}deg) rotateZ(${m.rz}deg)`,
        opacity: m.opacity,
        willChange: "transform, opacity",
        zIndex,
      }}
    >
      <GlassCarouselCard
        context={context}
        tint={tint}
        isActive={isActive}
        isFlipped={isFlipped}
        onFlip={onFlip}
      />
    </div>
  );
}

export const CarouselGlide: React.FC = () => {
  const len = carouselContexts.length;

  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const clearAllFlips = useCallback(() => setFlippedCards(new Set()), []);

  const { activeIndex, direction, isAnimating, t, next, prev, goTo } =
    useCarouselTransition(len, {
      durationMs: 620,
      onBeforeChange: clearAllFlips,
    });

  const { progress, reset } = useAutoplayProgress({
    enabled: isAutoPlaying,
    durationMs: TIMER_DURATION,
    paused: isAnimating,
    onDone: next,
  });

  const indices = useMemo(() => {
    return {
      left: clampIndex(activeIndex - 1, len),
      center: activeIndex,
      right: clampIndex(activeIndex + 1, len),
    };
  }, [activeIndex, len]);

  const activeTint = cardTints[activeIndex % cardTints.length];

  return (
    <section
      className="min-h-[75vh] relative overflow-visible flex flex-col items-center justify-center py-16 -mt-[83vh]"
      style={{ zIndex: 40 }}
      onMouseEnter={() => {
        setIsAutoPlaying(false);
        reset();
      }}
      onMouseLeave={() => {
        setIsAutoPlaying(true);
        reset();
      }}
    >
      {/* Floating accent orbs (very low opacity) */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02] blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${activeTint.bg} 0%, transparent 70%)`,
          left: "15%",
          top: "30%",
        }}
      />

      <div
        className="absolute left-0 right-0 z-10"
        style={{ top: "var(--carousel-title-offset)" }}
      >
        <h2
          className="text-primary uppercase text-center px-4"
          style={{
            fontSize: "var(--section-title-font-size)",
            letterSpacing: "var(--section-title-tracking)",
            lineHeight: "var(--section-title-line-height)",
          }}
        >
          {sectionTitle}
        </h2>
      </div>

      <div className="relative z-10 w-full max-w-5xl h-[400px] flex items-center justify-center">
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            reset();
            prev();
          }}
          className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button
          onClick={() => {
            setIsAutoPlaying(false);
            reset();
            next();
          }}
          className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </button>

        <div
          className="relative w-full h-full"
          style={{ perspective: "1200px" }}
        >
          <CardLayer
            index={indices.left}
            slot="left"
            t={t}
            dir={direction}
            isAnimating={isAnimating}
            isActive={false}
            isFlipped={false}
            onClick={() => {
              setIsAutoPlaying(false);
              reset();
              prev();
            }}
          />

          <CardLayer
            index={indices.center}
            slot="center"
            t={t}
            dir={direction}
            isAnimating={isAnimating}
            isActive
            isFlipped={flippedCards.has(indices.center)}
            onFlip={() =>
              setFlippedCards((prevSet) => {
                const nextSet = new Set(prevSet);
                if (nextSet.has(indices.center)) nextSet.delete(indices.center);
                else nextSet.add(indices.center);
                return nextSet;
              })
            }
          />

          <CardLayer
            index={indices.right}
            slot="right"
            t={t}
            dir={direction}
            isAnimating={isAnimating}
            isActive={false}
            isFlipped={false}
            onClick={() => {
              setIsAutoPlaying(false);
              reset();
              next();
            }}
          />
        </div>
      </div>

      {/* Progress stepper */}
      <div className="relative z-10 mt-10 flex items-center gap-3">
        {carouselContexts.map((_, idx) => {
          const tint = cardTints[idx % cardTints.length];
          const isActive = idx === activeIndex;

          return (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                reset();
                goTo(idx);
              }}
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{
                width: isActive ? 56 : 20,
                transition: "width 300ms var(--ease-smooth)",
                background: isActive
                  ? `${tint.bg}18`
                  : "hsl(var(--muted) / 0.25)",
              }}
              aria-label={`Go to card ${idx + 1}`}
            >
              {isActive ? (
                <div
                  className="absolute inset-0"
                  style={{
                    transformOrigin: "0% 50%",
                    transform: `scaleX(${progress / 100})`,
                    background: `linear-gradient(90deg, ${tint.bg}90 0%, ${tint.border} 100%)`,
                    boxShadow: `0 0 8px ${tint.bg}60`,
                    willChange: "transform",
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-40 hover:opacity-70 transition-opacity"
                  style={{ background: tint.bg }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
