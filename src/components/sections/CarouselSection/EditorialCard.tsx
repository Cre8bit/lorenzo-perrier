import React, { useMemo, useState } from "react";
import { RotateCcw, ArrowRight, MousePointerClick } from "lucide-react";
import type { CarouselContext } from "./CarouselData";
import { withHslAlpha } from "./tint";
import { lerp } from "@/utils/animation";

export type CarouselTint = {
  bg: string;
  border: string;
  glow: string;
};

export interface ExtendedCarouselContext extends CarouselContext {
  companyLine?: string;
  logoUrl?: string;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function useCardStyles(tint: CarouselTint, strength: number) {
  const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)";
  const overlayTransitionDuration = "520ms";

  return useMemo(() => {
    const transitionOpacity = `opacity ${overlayTransitionDuration} ${smoothEase}`;
    const glowBg = `radial-gradient(120% 120% at 50% 60%,
      ${withHslAlpha(tint.bg, 0.38)} 0%,
      ${withHslAlpha(tint.bg, 0.22)} 35%,
      ${withHslAlpha(tint.bg, 0.0)} 70%)`;

    return {
      smoothEase,
      transitionOpacity,
      glowBg,
      baseBorderColor: withHslAlpha(tint.border, 0.19),
      baseOuterShadow: `0 14px 40px -16px ${withHslAlpha(tint.bg, 0.15)}`,
      baseInsetShadow: `inset 0 1px 0 rgba(255,255,255,0.14)`,
    };
  }, [tint.bg, tint.border]);
}

interface EditorialCardProps {
  context: ExtendedCarouselContext;
  tint: CarouselTint;
  isActive: boolean;
  activeStrength?: number;
  isFlipped: boolean;
  onFlip?: () => void;
}

export const EditorialCard: React.FC<EditorialCardProps> = ({
  context,
  tint,
  isActive,
  activeStrength,
  isFlipped,
  onFlip,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);
  const bodyOpacity = lerp(0.3, 1, strength);

  // Hover should only matter when the card is actually interactive/active.
  const hoverOn = isActive && isHovered;

  // Metadata opacity tuning (point 5)
  const metaOpacity = hoverOn ? 0.55 : 0.38;

  // Logo opacity tuning (point 4)
  const logoOpacity = context.logoUrl
    ? hoverOn
      ? 0.45
      : isActive
      ? 0.22
      : 0.14
    : 0;

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px]"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={
        isActive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFlip?.();
              }
            }
          : undefined
      }
      aria-label={isActive ? "Flip card" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 700ms var(--ease-smooth)",
          willChange: "transform",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
        >
          {/* Glow overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: styles.glowBg,
              opacity: strength,
              boxShadow: `0 30px 70px -15px ${withHslAlpha(tint.bg, 0.27)}`,
              transition: styles.transitionOpacity,
            }}
          />

          {/* Main card surface */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{
              borderColor: styles.baseBorderColor,
              boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}`,
              contain: "paint",
            }}
          >
            {/* Background tint */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${withHslAlpha(
                  tint.bg,
                  0.08
                )} 0%, ${withHslAlpha(tint.bg, 0.18)} 100%)`,
                mixBlendMode: "multiply",
              }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Company line row (logo on left) */}
              {(context.companyLine || context.logoUrl) && (
                <div className="flex items-center gap-3 mb-4">
                  {context.logoUrl && (
                    <div
                      className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0"
                      style={{
                        opacity: logoOpacity,
                        transition: `opacity 500ms ${styles.smoothEase}`,
                      }}
                    >
                      <img
                        src={context.logoUrl}
                        alt=""
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                  )}

                  {context.companyLine && (
                    <div
                      className="text-[10px] uppercase tracking-[0.28em] font-medium truncate"
                      style={{
                        color: withHslAlpha(tint.border, metaOpacity),
                        transition: `color 500ms ${styles.smoothEase}`,
                      }}
                    >
                      {context.companyLine}
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <h3
                className="text-xl md:text-2xl font-light leading-tight text-foreground mb-4"
                style={{ textShadow: "0 10px 26px rgba(0,0,0,0.22)" }}
              >
                {context.title}
              </h3>

              {/* Divider */}
              <div
                className="w-12 h-px mb-4"
                style={{ background: withHslAlpha(tint.border, 0.3) }}
              />

              {/* Problem text */}
              <p
                className="text-sm leading-relaxed flex-grow text-foreground/70"
                style={{
                  opacity: bodyOpacity,
                  transition: styles.transitionOpacity,
                }}
              >
                {context.problem}
              </p>

              {/* Click hint */}
              <div
                className="flex items-center gap-2 mt-4 text-xs"
                style={{
                  color: withHslAlpha(tint.border, 0.5),
                  opacity: bodyOpacity,
                  transition: styles.transitionOpacity,
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </div>

              {/* Hover affordance icon (bottom-right) */}
              {isActive && (
                <div
                  className="absolute bottom-5 right-5 pointer-events-none"
                  style={{
                    opacity: hoverOn ? 0.85 : 0,
                    transform: hoverOn ? "translateY(0)" : "translateY(4px)",
                    transition: `opacity 360ms ${styles.smoothEase}, transform 360ms ${styles.smoothEase}`,
                  }}
                >
                  <MousePointerClick
                    className="w-3.5 h-3.5"
                    style={{ color: withHslAlpha(tint.border, 0.6) }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <CardBack
          context={context}
          tint={tint}
          styles={styles}
          isActive={isActive}
          bodyOpacity={bodyOpacity}
        />
      </div>
    </div>
  );
};

function CardBack({
  context,
  tint,
  styles,
  isActive,
  bodyOpacity,
}: {
  context: ExtendedCarouselContext;
  tint: CarouselTint;
  styles: ReturnType<typeof useCardStyles>;
  isActive: boolean;
  bodyOpacity: number;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg) translateZ(0)",
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: styles.glowBg,
          boxShadow: `0 30px 70px -15px ${withHslAlpha(tint.bg, 0.27)}`,
        }}
      />

      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border"
        style={{
          borderColor: withHslAlpha(tint.border, 0.2),
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(225deg, ${withHslAlpha(
              tint.bg,
              0.25
            )} 0%, ${withHslAlpha(tint.bg, 0.133)} 55%, ${withHslAlpha(
              tint.bg,
              0.078
            )} 100%)`,
            mixBlendMode: "multiply",
            opacity: 0.9,
          }}
        />

        <div className="relative z-10 h-full flex flex-col p-6">
          <h4
            className="text-sm font-medium uppercase tracking-wider mb-6"
            style={{ color: tint.border }}
          >
            {context.backTitle}
          </h4>

          <div className="flex-grow flex flex-col gap-4">
            {context.backDetails.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ background: tint.border }}
                />
                <p className="text-sm leading-relaxed text-foreground/85">
                  {detail}
                </p>
              </div>
            ))}
          </div>

          <div
            className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-foreground/70"
            style={{
              opacity: bodyOpacity,
              transition: styles.transitionOpacity,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            <RotateCcw className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
