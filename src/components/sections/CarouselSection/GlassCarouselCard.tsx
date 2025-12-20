import React from "react";
import { RotateCcw } from "lucide-react";
import type { CarouselContext } from "./CarouselData";
import { withHslAlpha } from "./tint";
import { lerp } from "@/utils/animation";

export type CarouselTint = {
  bg: string;
  border: string;
  glow: string;
};

export function GlassCarouselCard(props: {
  context: CarouselContext;
  tint: CarouselTint;
  isActive: boolean;
  activeStrength?: number;
  stackDepth?: number | null;
  isFlipped: boolean;
  onFlip?: () => void;
}) {
  const { context, tint, isActive, activeStrength, stackDepth, isFlipped, onFlip } = props;

  const strength = Math.max(
    0,
    Math.min(1, activeStrength ?? (isActive ? 1 : 0))
  );

  const frontBorderAlpha = lerp(0.19, 0.4, strength);
  const frontGlowAlpha = lerp(0.15, 0.27, strength);
  const insetAlpha = lerp(0.14, 0.22, strength);

  const shadowY = lerp(14, 30, strength);
  const shadowBlur = lerp(40, 70, strength);
  const shadowSpread = lerp(-16, -15, strength);
  const screenOpacity = lerp(0.65, 0.8, strength);

  // Keep blur modest so stacked cards still read through transparency.
  const blurPx = 200000;

  // Text opacity should not depend on stack depth; keep it readable off-center,
  // and gently "lift" it as a card becomes active.
  const bodyBaseOpacity = 0.2;
  const tagBaseOpacity = 0.9;
  const iconBaseOpacity = 0.95;

  // Keep non-centered cards readable: depth controls base opacity,
  // strength only "lifts" opacity as a card becomes active.
  const bodyOpacity = lerp(bodyBaseOpacity, 1, strength);
  const tagOpacity = lerp(tagBaseOpacity, 1, strength);
  const iconOpacity = lerp(iconBaseOpacity, 1, strength);

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
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 700ms var(--ease-smooth)",
          willChange: "transform",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border"
          style={{
            backfaceVisibility: "hidden",
            backdropFilter: `blur(${blurPx}px)`,
            WebkitBackdropFilter: `blur(${blurPx}px)`,
            borderColor: withHslAlpha(tint.border, frontBorderAlpha),
            boxShadow: `0 ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${withHslAlpha(
              tint.bg,
              frontGlowAlpha
            )}, inset 0 1px 0 rgba(255,255,255,${insetAlpha})`,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${withHslAlpha(
                tint.bg,
                0.22
              )} 0%, ${withHslAlpha(tint.bg, 0.125)} 55%, ${withHslAlpha(
                tint.bg,
                0.07
              )} 100%)`,
              mixBlendMode: "multiply",
              opacity: 0.9,
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              mixBlendMode: "screen",
              opacity: screenOpacity,
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(120% 90% at 80% 95%, ${withHslAlpha(
                tint.bg,
                0.145
              )} 0%, transparent 58%)`,
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.35%27/%3E%3C/svg%3E")',
            }}
          />

          <div className="relative z-10 h-full flex flex-col p-6">
            <div className="flex-shrink-0 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: `1px solid ${withHslAlpha(tint.border, 0.22)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px -14px ${withHslAlpha(
                    tint.glow,
                    0.7
                  )}`,
                  opacity: iconOpacity,
                  transition: "opacity 280ms var(--ease-smooth)",
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
            </div>

            <h3
              className="text-lg md:text-xl font-light mb-3 leading-tight text-foreground"
              style={{ textShadow: "0 10px 26px rgba(0,0,0,0.22)" }}
            >
              {context.title}
            </h3>

            <p
              className="text-sm leading-relaxed flex-grow text-foreground/75"
              style={{
                opacity: bodyOpacity,
                transition: "opacity 720ms var(--ease-smooth)",
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
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 26px -16px ${withHslAlpha(
                      tint.glow,
                      0.65
                    )}`,
                    opacity: tagOpacity,
                    transition: "opacity 420ms var(--ease-smooth)",
                    willChange: "opacity",
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>

            {isActive && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs opacity-50 text-foreground/70">
                <RotateCcw className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backdropFilter: `blur(${blurPx}px)`,
            WebkitBackdropFilter: `blur(${blurPx}px)`,
            borderColor: withHslAlpha(tint.border, 0.333),
            boxShadow: `0 30px 70px -15px ${withHslAlpha(
              tint.bg,
              0.27
            )}, inset 0 1px 0 rgba(255,255,255,0.25)`,
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

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              mixBlendMode: "screen",
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27120%27 height=%27120%27 filter=%27url(%23n)%27 opacity=%270.35%27/%3E%3C/svg%3E")',
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

            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs opacity-50 text-foreground/70">
              <RotateCcw className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
