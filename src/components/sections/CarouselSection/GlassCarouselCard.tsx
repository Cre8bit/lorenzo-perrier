import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import type { CarouselContext } from "./CarouselData";
import { withHslAlpha } from "./tint";
import { lerp } from "@/utils/animation";

export type CarouselTint = {
  bg: string;
  border: string;
  glow: string;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function GlassCarouselCard(props: {
  context: CarouselContext;
  tint: CarouselTint;
  isActive: boolean;
  activeStrength?: number;
  stackDepth?: number | null;
  isFlipped: boolean;
  onFlip?: () => void;
}) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;

  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));

  // Static base values (keep paint stable)
  const baseBorderAlpha = 0.19;
  const baseGlowAlpha = 0.15;
  const baseInsetAlpha = 0.14;

  const frontBorderOverlayOpacity = strength;
  const frontGlowOverlayOpacity = strength;
  const insetOverlayOpacity = strength;

  const screenOpacity = lerp(0.65, 0.8, strength);

  const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)";
  const overlayTransitionDuration = "520ms";

  const bodyOpacity = lerp(0.2, 1, strength);
  const tagOpacity = lerp(0.9, 1, strength);
  const iconOpacity = lerp(0.95, 1, strength);

  const styles = useMemo(() => {
    const transitionOpacity = `opacity ${overlayTransitionDuration} ${smoothEase}`;

    // Use a gradient glow (cheaper + avoids some shadow rasterization artifacts)
    const glowBg = `radial-gradient(120% 120% at 50% 60%,
      ${withHslAlpha(tint.bg, 0.38)} 0%,
      ${withHslAlpha(tint.bg, 0.22)} 35%,
      ${withHslAlpha(tint.bg, 0.0)} 70%)`;

    const clipRoundRect = "inset(0 round 1rem)";

    return {
      transitionOpacity,
      glowBg,
      clipRoundRect,

      baseBorderColor: withHslAlpha(tint.border, baseBorderAlpha),
      baseOuterShadow: `0 14px 40px -16px ${withHslAlpha(
        tint.bg,
        baseGlowAlpha
      )}`,
      baseInsetShadow: `inset 0 1px 0 rgba(255,255,255,${baseInsetAlpha})`,

      borderOverlayShadow: `inset 0 0 0 1px ${withHslAlpha(tint.border, 0.21)}`,
      insetHighlightShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,

      tagShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 26px -16px ${withHslAlpha(
        tint.glow,
        0.65
      )}`,
      iconShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px -14px ${withHslAlpha(
        tint.glow,
        0.7
      )}`,
    };
  }, [
    tint.bg,
    tint.border,
    tint.glow,
    baseBorderAlpha,
    baseGlowAlpha,
    baseInsetAlpha,
    overlayTransitionDuration,
    smoothEase,
  ]);

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
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 700ms var(--ease-smooth)",
          willChange: "transform",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          {/* Glow overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: styles.glowBg,
              opacity: frontGlowOverlayOpacity,
              boxShadow: `0 30px 70px -15px ${withHslAlpha(tint.bg, 0.27)}`,
              transition: styles.transitionOpacity,
              willChange: "opacity",
              transform: "translateZ(0)",
              contain: "paint",
            }}
          />

          {/* Border overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: styles.borderOverlayShadow,
              opacity: frontBorderOverlayOpacity,
              transition: styles.transitionOpacity,
              willChange: "opacity",
              transform: "translateZ(0)",
              contain: "paint",
            }}
          />

          {/* Inset highlight overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: styles.insetHighlightShadow,
              opacity: insetOverlayOpacity,
              transition: styles.transitionOpacity,
              willChange: "opacity",
              transform: "translateZ(0)",
              contain: "paint",
            }}
          />

          {/* Main card surface */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{
              borderColor: styles.baseBorderColor,
              boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}`,
              transform: "translateZ(0)",
              contain: "paint",
              isolation: "isolate",
              backfaceVisibility: "hidden",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(0deg, ${withHslAlpha(
                  tint.bg,
                  0.22
                )} 0%, ${withHslAlpha(tint.bg, 0.125)} 85%, ${withHslAlpha(
                  tint.bg,
                  0.07
                )} 100%)`,
                mixBlendMode: "multiply",
                opacity: 0.9,
                transform: "translateZ(0)",
                clipPath: styles.clipRoundRect,
                WebkitClipPath: styles.clipRoundRect,
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                mixBlendMode: "screen",
                opacity: screenOpacity,
                transition: styles.transitionOpacity,
                willChange: "opacity",
                transform: "translateZ(0)",
                contain: "paint",
              }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: `1px solid ${withHslAlpha(tint.border, 0.22)}`,
                    boxShadow: styles.iconShadow,
                    opacity: iconOpacity,
                    transition: styles.transitionOpacity,
                    willChange: "opacity",
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    {context.visualType === "flow" && (
                      <path
                        d="M4 12h4m4 0h4m4 0h4M8 12a4 4 0 108 0 4 4 0 00-8 0z"
                        stroke={tint.border}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    )}
                    {context.visualType === "network" && (
                      <>
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="4"
                          cy="8"
                          r="2"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="20"
                          cy="8"
                          r="2"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="4"
                          cy="16"
                          r="2"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="20"
                          cy="16"
                          r="2"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <path
                          d="M9.5 10.5L6 8.5M14.5 10.5L18 8.5M9.5 13.5L6 15.5M14.5 13.5L18 15.5"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                    {context.visualType === "layers" && (
                      <>
                        <rect
                          x="4"
                          y="4"
                          width="16"
                          height="4"
                          rx="1"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="4"
                          rx="1"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                        <rect
                          x="4"
                          y="16"
                          width="16"
                          height="4"
                          rx="1"
                          stroke={tint.border}
                          strokeWidth="1.5"
                        />
                      </>
                    )}
                  </svg>
                </div>

                <h3
                  className="text-lg md:text-xl font-light leading-tight text-foreground"
                  style={{ textShadow: "0 10px 26px rgba(0,0,0,0.22)" }}
                >
                  {context.title}
                </h3>
              </div>

              <p
                className="text-sm leading-relaxed flex-grow text-foreground/75"
                style={{
                  opacity: bodyOpacity,
                  transition: styles.transitionOpacity,
                  willChange: "opacity",
                  textShadow: "0 10px 22px rgba(0,0,0,0.18)",
                }}
              >
                {context.problem}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {context.signals.slice(0, 3).map((signal) => (
                  <span
                    key={signal}
                    className="px-2.5 py-0.5 text-xs rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      color: tint.border,
                      border: `1px solid ${withHslAlpha(tint.border, 0.24)}`,
                      boxShadow: styles.tagShadow,
                      opacity: tagOpacity,
                      transition: styles.transitionOpacity,
                      willChange: "opacity",
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>

              <div
                className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs text-foreground/70"
                style={{
                  opacity: bodyOpacity,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: styles.transitionOpacity,
                  willChange: "opacity",
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(0)",
          }}
        >
          {/* Back glow overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: styles.glowBg,
              boxShadow: `0 30px 70px -15px ${withHslAlpha(tint.bg, 0.27)}`,
              opacity: 1,
              transform: "translateZ(0)",
              contain: "paint",
            }}
          />

          {/* Back border overlay */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${withHslAlpha(tint.border, 0.133)}`,
              opacity: 1,
              transform: "translateZ(0)",
              contain: "paint",
            }}
          />

          {/* Back main surface */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{
              borderColor: withHslAlpha(tint.border, 0.2),
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25)`,
              transform: "translateZ(0)",
              contain: "paint",
              isolation: "isolate",
              backfaceVisibility: "hidden",
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
                transform: "translateZ(0)",
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
                  opacity: isActive ? bodyOpacity : 0,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: styles.transitionOpacity,
                  willChange: "opacity",
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
