import React, { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { carouselContexts, sectionTitle } from "./CarouselData";
import {
  EditorialCard,
  type CarouselTint,
  type ExtendedCarouselContext,
} from "./EditorialCard";
import { useAutoplayProgress } from "@/hooks/use-autoplay-progress";
import { useCarouselTransition } from "@/hooks/use-carousel-transition";
import { useInViewport } from "@/hooks/use-in-viewport";
import { lerp } from "@/utils/animation";
import { withHslAlpha } from "./tint";

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

type Pose = {
  x: number;
  y: number;
  z: number;
  scale: number;
  ry: number;
  rz: number;
  opacity: number;
};

const STACK_X = 300; // where the piles sit
const STACK_Y_STEP = 40; // vertical stacking
const STACK_X_STEP = 14; // subtle horizontal “fan”
const STACK_Z_STEP = 26; // depth stacking
const CENTER_Z = 110;

const TILT_Y = 18;
const TILT_Z = 3;

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

// offset = index - activeIndex
// offset < 0 => left pile, offset > 0 => right pile
function poseForOffset(offset: number): Pose {
  // Center
  if (Math.abs(offset) < 0.001) {
    return { x: 0, y: 0, z: CENTER_Z, scale: 1, ry: 0, rz: 0, opacity: 1 };
  }

  const side = offset < 0 ? -1 : 1;
  const depth = Math.abs(offset) - 1; // 0 = top of the side stack

  // Keep tilt constant on the side (as requested)
  const ry = side * -TILT_Y; // right stack tilts left (negative), left stack tilts right (positive)
  const rz = side * TILT_Z;

  const x = side * (STACK_X - depth * STACK_X_STEP);
  const y = depth * STACK_Y_STEP;
  const z = -depth * STACK_Z_STEP;

  const scale = Math.max(0.78, 0.88 - depth * 0.02);
  const opacity = Math.max(0.18, 0.62 - depth * 0.07);

  return { x, y, z, scale, ry, rz, opacity };
}

function poseBetweenOffsets(
  offsetFrom: number,
  offsetTo: number,
  t: number,
): Pose {
  const tt = smoothstep(t);
  const from = poseForOffset(offsetFrom);
  const to = poseForOffset(offsetTo);

  return {
    x: lerp(from.x, to.x, tt),
    y: lerp(from.y, to.y, tt),
    z: lerp(from.z, to.z, tt),
    scale: lerp(from.scale, to.scale, tt),
    ry: lerp(from.ry, to.ry, tt),
    rz: lerp(from.rz, to.rz, tt),
    opacity: lerp(from.opacity, to.opacity, tt),
  };
}

function CardLayer(props: {
  index: number;
  activeIndex: number;
  fromIndex: number;
  toIndex: number;
  t: number;
  isAnimating: boolean;
  isFlipped: boolean;
  onFlip?: () => void;
  onClick?: () => void;
}) {
  const {
    index,
    activeIndex,
    fromIndex,
    toIndex,
    t,
    isAnimating,
    isFlipped,
    onFlip,
    onClick,
  } = props;

  const tint = cardTints[index % cardTints.length];
  const context = carouselContexts[index] as ExtendedCarouselContext;

  const isActive = !isAnimating && index === activeIndex;

  const offsetStatic = index - activeIndex;
  const offsetFrom = index - fromIndex;
  const offsetTo = index - toIndex;

  const effectiveOffset = isAnimating
    ? lerp(offsetFrom, offsetTo, t)
    : offsetStatic;

  const m = isAnimating
    ? poseBetweenOffsets(offsetFrom, offsetTo, t)
    : poseForOffset(offsetStatic);

  // Active styling: blend from -> to
  const activeStrength = isAnimating
    ? index === fromIndex
      ? 1 - t
      : index === toIndex
        ? t
        : 0
    : isActive
      ? 1
      : 0;

  // Keep center on top, then closer cards above deeper ones
  const zIndex = 1000 - Math.abs(effectiveOffset) * 10 + (isActive ? 100 : 0);

  const clickable = !isActive && !isAnimating;

  return (
    <div
      className={clickable ? "cursor-pointer" : undefined}
      onClick={clickable ? onClick : undefined}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate3d(calc(-50% + ${m.x}px), calc(-50% + ${m.y}px), ${m.z}px)
          scale(${m.scale})
          rotateY(${m.ry}deg)
          rotateZ(${m.rz}deg)`,
        opacity: m.opacity,
        willChange: "transform, opacity",
        zIndex,
        pointerEvents: "auto",
      }}
    >
      <EditorialCard
        context={context}
        tint={tint}
        isActive={isActive}
        activeStrength={activeStrength}
        isFlipped={isFlipped}
        onFlip={onFlip}
      />
    </div>
  );
}

export const CarouselGlide: React.FC = () => {
  const len = carouselContexts.length;

  const { ref: sectionRef, inView } = useInViewport<HTMLElement>({
    threshold: 0.45,
    rootMargin: "0px 0px -10% 0px",
  });

  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [isHovering, setIsHovering] = useState(false);
  const [autoplayDir, setAutoplayDir] = useState<1 | -1>(1);

  // Touch tracking for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const clearAllFlips = useCallback(() => setFlippedCards(new Set()), []);

  const mid = Math.floor(len / 2);

  const { activeIndex, isAnimating, t, fromIndex, toIndex, next, prev, goTo } =
    useCarouselTransition(len, {
      durationMs: 620,
      onBeforeChange: clearAllFlips,
      initialIndex: mid,
    });

  const autoplayEnabled = inView && !isHovering && !isAnimating;

  const TIMER_DURATION_MS = 3_000;

  const { progress, reset } = useAutoplayProgress({
    enabled: autoplayEnabled,
    durationMs: TIMER_DURATION_MS,
    paused: isAnimating || isHovering,
    onDone: () => {
      if (autoplayDir === 1) {
        if (activeIndex >= len - 1) {
          setAutoplayDir(-1);
          reset();
          prev();
        } else {
          reset();
          next();
        }
      } else {
        if (activeIndex <= 0) {
          setAutoplayDir(1);
          reset();
          next();
        } else {
          reset();
          prev();
        }
      }
    },
  });

  const canPrev = inView && activeIndex > 0 && !isAnimating;
  const canNext = inView && activeIndex < len - 1 && !isAnimating;

  const safePrev = () => {
    if (!canPrev) return;
    reset();
    prev();
  };

  const safeNext = () => {
    if (!canNext) return;
    reset();
    next();
  };

  const MAX_STACK_SIDE = 6;

  const visibleIndices = useMemo(() => {
    const anchorA = isAnimating ? fromIndex : activeIndex;
    const anchorB = isAnimating ? toIndex : activeIndex;

    const minAnchor = Math.min(anchorA, anchorB);
    const maxAnchor = Math.max(anchorA, anchorB);

    const start = Math.max(0, minAnchor - MAX_STACK_SIDE);
    const end = Math.min(len - 1, maxAnchor + MAX_STACK_SIDE);

    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);

    const midAnchor = (anchorA + anchorB) / 2;
    return out.sort(
      (a, b) => Math.abs(b - midAnchor) - Math.abs(a - midAnchor),
    );
  }, [activeIndex, fromIndex, toIndex, isAnimating, len]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    touchEndX.current = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);

    const MIN_SWIPE_DISTANCE = 50;
    const MAX_VERTICAL_DISTANCE = 50;

    if (
      Math.abs(deltaX) > MIN_SWIPE_DISTANCE &&
      deltaY < MAX_VERTICAL_DISTANCE
    ) {
      if (deltaX > 0) safeNext();
      else safePrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-[75vh] relative overflow-visible flex flex-col items-center justify-center -mt-[83vh]"
      style={{ zIndex: 40 }}
      onMouseEnter={() => {
        setIsHovering(true);
        reset();
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        reset();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute left-0 right-0 z-10"
        style={{ top: "var(--carousel-title-offset-bigger)" }}
      >
        <h2
          className="text-primary uppercase text-center"
          style={{
            fontSize: "var(--section-title-font-size)",
            letterSpacing: "var(--section-title-tracking)",
            lineHeight: "var(--section-title-line-height)",
          }}
        >
          {sectionTitle}
        </h2>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto h-[400px] flex items-center justify-center">
        <button
          onClick={safePrev}
          disabled={!canPrev}
          className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-5 h-5 text-foreground/70" />
        </button>

        <button
          onClick={safeNext}
          disabled={!canNext}
          className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background/20 backdrop-blur-sm border border-primary/10 hover:bg-background/40 hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100"
          aria-label="Next card"
        >
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </button>

        <div
          className="relative w-full h-full"
          style={{ perspective: "1200px", perspectiveOrigin: "50% 50%" }}
        >
          {visibleIndices.map((idx) => (
            <CardLayer
              key={idx}
              index={idx}
              activeIndex={activeIndex}
              fromIndex={fromIndex}
              toIndex={toIndex}
              t={t}
              isAnimating={isAnimating}
              isFlipped={
                !isAnimating && idx === activeIndex && flippedCards.has(idx)
              }
              onFlip={
                !isAnimating && idx === activeIndex
                  ? () => {
                      setFlippedCards((prevSet) => {
                        const nextSet = new Set(prevSet);
                        if (nextSet.has(idx)) nextSet.delete(idx);
                        else nextSet.add(idx);
                        return nextSet;
                      });
                    }
                  : undefined
              }
              onClick={() => {
                const offset = idx - activeIndex;
                if (offset < 0) safePrev();
                if (offset > 0) safeNext();
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress stepper (no wrap) */}
      <div className="relative z-10 mt-10 flex items-center gap-3">
        {carouselContexts.map((_, idx) => {
          const tint = cardTints[idx % cardTints.length];
          const progressFill = progress / 100;

          const activity = isAnimating
            ? idx === fromIndex
              ? 1 - t
              : idx === toIndex
                ? t
                : 0
            : idx === activeIndex
              ? 1
              : 0;

          const width = lerp(20, 56, activity);
          const isCurrent = idx === activeIndex;

          const autoplayBlend =
            autoplayEnabled && !isAnimating && isCurrent ? 1 : 0;

          const opacityTransition = isAnimating
            ? "none"
            : "opacity 280ms var(--ease-smooth)";

          const staticOpacityTarget = activity * (autoplayBlend ? 0.08 : 0.9);
          const borderAlpha = lerp(0.12, 0.28, activity);
          const progressFillVisible = Math.max(0.02, progressFill);

          return (
            <button
              key={idx}
              onClick={() => {
                reset();
                goTo(idx);
              }}
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{
                width,
                background: withHslAlpha(tint.bg, 0.08),
                border: `1px solid ${withHslAlpha(tint.border, borderAlpha)}`,
              }}
              aria-label={`Go to card ${idx + 1}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: withHslAlpha(tint.bg, 0.18),
                  opacity: 0.6,
                }}
              />

              {activity > 0 ? (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    opacity: staticOpacityTarget,
                    transition: opacityTransition,
                    background: `linear-gradient(90deg, ${withHslAlpha(
                      tint.border,
                      0.95,
                    )} 0%, ${withHslAlpha(tint.bg, 0.65)} 100%)`,
                    boxShadow: `0 0 16px ${withHslAlpha(tint.glow, 0.55)}`,
                    willChange: isAnimating ? "opacity" : undefined,
                  }}
                />
              ) : null}

              {isCurrent && !isAnimating ? (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    opacity: autoplayBlend ? 1 : 0,
                    transition: opacityTransition,
                    transformOrigin: "0% 50%",
                    transform: `scaleX(${progressFillVisible})`,
                    background: `linear-gradient(90deg, ${
                      tint.bg
                    } 0%, ${withHslAlpha(tint.border, 0.9)} 100%)`,
                    boxShadow: `0 0 16px ${withHslAlpha(tint.glow, 0.65)}`,
                    willChange: "transform, opacity",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
};
