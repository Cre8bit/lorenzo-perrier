import React, { useMemo } from "react";
import { RotateCcw, ArrowRight, Layers, MousePointerClick } from "lucide-react";
import type { CarouselContext } from "./CarouselData";
import { withHslAlpha } from "./tint";
import { lerp } from "@/utils/animation";

export type CarouselTint = {
  bg: string;
  border: string;
  glow: string;
};

// Extended context with optional company/logo info
export interface ExtendedCarouselContext extends CarouselContext {
  companyLine?: string; // e.g., "Bpifrance - B2C Platform"
  logoUrl?: string;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Shared styles hook
function useCardStyles(tint: CarouselTint, strength: number) {
  const smoothEase = "cubic-bezier(0.22, 1, 0.36, 1)";
  const overlayTransitionDuration = "520ms";

  return useMemo(() => {
    const transitionOpacity = `opacity ${overlayTransitionDuration} ${smoothEase}`;
    const glowBg = `radial-gradient(120% 120% at 50% 60%,
      ${withHslAlpha(tint.bg, 0.38)} 0%,
      ${withHslAlpha(tint.bg, 0.22)} 35%,
      ${withHslAlpha(tint.bg, 0.0)} 70%)`;
    const clipRoundRect = "inset(0 round 1rem)";

    return {
      transitionOpacity,
      glowBg,
      clipRoundRect,
      baseBorderColor: withHslAlpha(tint.border, 0.19),
      baseOuterShadow: `0 14px 40px -16px ${withHslAlpha(tint.bg, 0.15)}`,
      baseInsetShadow: `inset 0 1px 0 rgba(255,255,255,0.14)`,
      borderOverlayShadow: `inset 0 0 0 1px ${withHslAlpha(tint.border, 0.21)}`,
      insetHighlightShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
      tagShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 26px -16px ${withHslAlpha(tint.glow, 0.65)}`,
      iconShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px -14px ${withHslAlpha(tint.glow, 0.7)}`,
    };
  }, [tint.bg, tint.border, tint.glow]);
}

// Common props for all variants
interface CardVariantProps {
  context: ExtendedCarouselContext;
  tint: CarouselTint;
  isActive: boolean;
  activeStrength?: number;
  isFlipped: boolean;
  onFlip?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT A: "Editorial Stack" - Company line prominent, layered card feel
// ═══════════════════════════════════════════════════════════════════════════
export function CardVariantEditorial(props: CardVariantProps) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;
  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);

  const bodyOpacity = lerp(0.3, 1, strength);
  const screenOpacity = lerp(0.65, 0.8, strength);

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px]"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip?.(); } } : undefined}
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
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
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
                background: `linear-gradient(180deg, ${withHslAlpha(tint.bg, 0.08)} 0%, ${withHslAlpha(tint.bg, 0.18)} 100%)`,
                mixBlendMode: "multiply",
              }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Company line - editorial style */}
              {context.companyLine && (
                <div 
                  className="text-[10px] uppercase tracking-[0.2em] mb-4 font-medium"
                  style={{ color: withHslAlpha(tint.border, 0.7) }}
                >
                  {context.companyLine}
                </div>
              )}

              {/* Title - larger, editorial typography */}
              <h3
                className="text-xl md:text-2xl font-light leading-tight text-foreground mb-4"
                style={{ textShadow: "0 10px 26px rgba(0,0,0,0.22)" }}
              >
                {context.title}
              </h3>

              {/* Subtle divider line */}
              <div 
                className="w-12 h-px mb-4"
                style={{ background: withHslAlpha(tint.border, 0.3) }}
              />

              {/* Problem text */}
              <p
                className="text-sm leading-relaxed flex-grow text-foreground/70"
                style={{ opacity: bodyOpacity, transition: styles.transitionOpacity }}
              >
                {context.problem}
              </p>

              {/* Logo area (if present) */}
              {context.logoUrl && (
                <div className="absolute top-6 right-6 w-8 h-8 rounded-lg overflow-hidden opacity-40">
                  <img src={context.logoUrl} alt="" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Click hint - subtle arrow */}
              <div 
                className="flex items-center gap-2 mt-4 text-xs"
                style={{ 
                  color: withHslAlpha(tint.border, 0.5),
                  opacity: isActive ? bodyOpacity : 0,
                  transition: styles.transitionOpacity 
                }}
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Back - kept similar for all variants */}
        <CardBack context={context} tint={tint} styles={styles} isActive={isActive} bodyOpacity={bodyOpacity} onFlip={onFlip} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT B: "Minimal Focus" - Icon prominent, clean hierarchy
// ═══════════════════════════════════════════════════════════════════════════
export function CardVariantMinimal(props: CardVariantProps) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;
  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);

  const bodyOpacity = lerp(0.3, 1, strength);

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px]"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip?.(); } } : undefined}
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
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: styles.glowBg, opacity: strength, transition: styles.transitionOpacity }}
          />

          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{ borderColor: styles.baseBorderColor, boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(180deg, ${withHslAlpha(tint.bg, 0.06)} 0%, ${withHslAlpha(tint.bg, 0.14)} 100%)` }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Large centered icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${withHslAlpha(tint.bg, 0.15)} 0%, ${withHslAlpha(tint.bg, 0.08)} 100%)`,
                  border: `1px solid ${withHslAlpha(tint.border, 0.2)}`,
                  boxShadow: styles.iconShadow,
                }}
              >
                <VisualTypeIcon type={context.visualType} color={tint.border} size={28} />
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-light leading-tight text-foreground mb-3">
                {context.title}
              </h3>

              {/* Problem */}
              <p
                className="text-sm leading-relaxed text-foreground/70 flex-grow"
                style={{ opacity: bodyOpacity, transition: styles.transitionOpacity }}
              >
                {context.problem}
              </p>

              {/* Logo watermark */}
              {context.logoUrl && (
                <div 
                  className="absolute bottom-6 right-6 w-6 h-6 opacity-30"
                  style={{ filter: "grayscale(1)" }}
                >
                  <img src={context.logoUrl} alt="" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Subtle flip indicator */}
              <div 
                className="flex items-center justify-center gap-1.5 mt-4"
                style={{ 
                  opacity: isActive ? lerp(0.4, 0.7, strength) : 0,
                  transition: styles.transitionOpacity 
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ 
                    background: withHslAlpha(tint.border, 0.1),
                    border: `1px solid ${withHslAlpha(tint.border, 0.15)}`
                  }}
                >
                  <RotateCcw className="w-3 h-3" style={{ color: tint.border }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardBack context={context} tint={tint} styles={styles} isActive={isActive} bodyOpacity={bodyOpacity} onFlip={onFlip} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT C: "Layered Depth" - Stacked card effect, signals as badges
// ═══════════════════════════════════════════════════════════════════════════
export function CardVariantLayered(props: CardVariantProps) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;
  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);

  const bodyOpacity = lerp(0.3, 1, strength);

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px]"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip?.(); } } : undefined}
      aria-label={isActive ? "Flip card" : undefined}
    >
      {/* Stacked card shadow layers */}
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          transform: "translateY(8px) scale(0.96)",
          background: withHslAlpha(tint.bg, 0.08),
          border: `1px solid ${withHslAlpha(tint.border, 0.08)}`,
          opacity: strength * 0.5,
          transition: "opacity 400ms ease",
        }}
      />
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          transform: "translateY(4px) scale(0.98)",
          background: withHslAlpha(tint.bg, 0.1),
          border: `1px solid ${withHslAlpha(tint.border, 0.1)}`,
          opacity: strength * 0.7,
          transition: "opacity 400ms ease",
        }}
      />

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
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: styles.glowBg, opacity: strength, transition: styles.transitionOpacity }}
          />

          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{ borderColor: styles.baseBorderColor, boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(180deg, ${withHslAlpha(tint.bg, 0.05)} 0%, ${withHslAlpha(tint.bg, 0.15)} 100%)` }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Top row: Icon + Company */}
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: withHslAlpha(tint.bg, 0.12),
                    border: `1px solid ${withHslAlpha(tint.border, 0.18)}`,
                  }}
                >
                  <VisualTypeIcon type={context.visualType} color={tint.border} size={20} />
                </div>
                
                {context.companyLine && (
                  <span 
                    className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ 
                      background: withHslAlpha(tint.bg, 0.12),
                      color: withHslAlpha(tint.border, 0.7),
                      border: `1px solid ${withHslAlpha(tint.border, 0.12)}`
                    }}
                  >
                    {context.companyLine.split(" - ")[0]}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-light leading-tight text-foreground mb-3">
                {context.title}
              </h3>

              {/* Problem */}
              <p
                className="text-sm leading-relaxed text-foreground/70 flex-grow"
                style={{ opacity: bodyOpacity, transition: styles.transitionOpacity }}
              >
                {context.problem}
              </p>

              {/* Signals as inline badges */}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {context.signals.slice(0, 3).map((signal) => (
                  <span
                    key={signal}
                    className="px-2 py-0.5 text-[10px] rounded-md"
                    style={{
                      background: withHslAlpha(tint.bg, 0.1),
                      color: withHslAlpha(tint.border, 0.8),
                      border: `1px solid ${withHslAlpha(tint.border, 0.12)}`,
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>

              {/* Click area indicator */}
              <div 
                className="absolute bottom-4 right-4"
                style={{ 
                  opacity: isActive ? lerp(0.3, 0.6, strength) : 0,
                  transition: styles.transitionOpacity 
                }}
              >
                <Layers className="w-4 h-4" style={{ color: tint.border }} />
              </div>
            </div>
          </div>
        </div>

        <CardBack context={context} tint={tint} styles={styles} isActive={isActive} bodyOpacity={bodyOpacity} onFlip={onFlip} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT D: "Interactive Reveal" - Hover-aware with clear tap zone
// ═══════════════════════════════════════════════════════════════════════════
export function CardVariantInteractive(props: CardVariantProps) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;
  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);

  const bodyOpacity = lerp(0.3, 1, strength);

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px] group"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip?.(); } } : undefined}
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
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: styles.glowBg, opacity: strength, transition: styles.transitionOpacity }}
          />

          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border transition-all duration-300"
            style={{ 
              borderColor: styles.baseBorderColor, 
              boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(160deg, ${withHslAlpha(tint.bg, 0.05)} 0%, ${withHslAlpha(tint.bg, 0.18)} 100%)` }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Header with icon and optional logo */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${withHslAlpha(tint.bg, 0.18)} 0%, ${withHslAlpha(tint.bg, 0.08)} 100%)`,
                    border: `1px solid ${withHslAlpha(tint.border, 0.2)}`,
                    boxShadow: styles.iconShadow,
                  }}
                >
                  <VisualTypeIcon type={context.visualType} color={tint.border} size={22} />
                </div>

                {context.logoUrl && (
                  <div 
                    className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ 
                      background: withHslAlpha(tint.bg, 0.1),
                      border: `1px solid ${withHslAlpha(tint.border, 0.1)}`,
                    }}
                  >
                    <img src={context.logoUrl} alt="" className="w-5 h-5 object-contain opacity-50" />
                  </div>
                )}
              </div>

              {/* Title with optional company subtitle */}
              <div className="mb-3">
                <h3 className="text-lg md:text-xl font-light leading-tight text-foreground">
                  {context.title}
                </h3>
                {context.companyLine && (
                  <p 
                    className="text-[11px] mt-1.5 tracking-wide"
                    style={{ color: withHslAlpha(tint.border, 0.6) }}
                  >
                    {context.companyLine}
                  </p>
                )}
              </div>

              {/* Problem */}
              <p
                className="text-sm leading-relaxed text-foreground/70 flex-grow"
                style={{ opacity: bodyOpacity, transition: styles.transitionOpacity }}
              >
                {context.problem}
              </p>

              {/* Interactive tap zone indicator */}
              <div 
                className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg self-start transition-all duration-300"
                style={{ 
                  background: isActive ? withHslAlpha(tint.bg, 0.12) : "transparent",
                  border: `1px solid ${withHslAlpha(tint.border, isActive ? 0.15 : 0)}`,
                  opacity: isActive ? lerp(0.5, 1, strength) : 0,
                  transition: styles.transitionOpacity,
                }}
              >
                <MousePointerClick className="w-3.5 h-3.5" style={{ color: tint.border }} />
                <span className="text-xs" style={{ color: withHslAlpha(tint.border, 0.8) }}>
                  Tap for details
                </span>
              </div>
            </div>
          </div>
        </div>

        <CardBack context={context} tint={tint} styles={styles} isActive={isActive} bodyOpacity={bodyOpacity} onFlip={onFlip} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT E: "Compact Editorial" - Newspaper-style, logo as masthead
// ═══════════════════════════════════════════════════════════════════════════
export function CardVariantCompact(props: CardVariantProps) {
  const { context, tint, isActive, activeStrength, isFlipped, onFlip } = props;
  const strength = clamp01(activeStrength ?? (isActive ? 1 : 0));
  const styles = useCardStyles(tint, strength);

  const bodyOpacity = lerp(0.3, 1, strength);

  return (
    <div
      className="relative w-[280px] md:w-[360px] h-[320px]"
      style={{ perspective: "1100px" }}
      onClick={isActive ? onFlip : undefined}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip?.(); } } : undefined}
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
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}>
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: styles.glowBg, opacity: strength, transition: styles.transitionOpacity }}
          />

          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border"
            style={{ borderColor: styles.baseBorderColor, boxShadow: `${styles.baseOuterShadow}, ${styles.baseInsetShadow}` }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(180deg, ${withHslAlpha(tint.bg, 0.04)} 0%, ${withHslAlpha(tint.bg, 0.12)} 100%)` }}
            />

            <div className="relative z-10 h-full flex flex-col p-6">
              {/* Masthead area */}
              <div 
                className="flex items-center gap-3 pb-4 mb-4"
                style={{ borderBottom: `1px solid ${withHslAlpha(tint.border, 0.12)}` }}
              >
                {context.logoUrl ? (
                  <img src={context.logoUrl} alt="" className="w-5 h-5 object-contain opacity-50" />
                ) : (
                  <div 
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: withHslAlpha(tint.border, 0.15) }}
                  >
                    <VisualTypeIcon type={context.visualType} color={tint.border} size={12} />
                  </div>
                )}
                <span 
                  className="text-[10px] uppercase tracking-[0.15em] font-medium"
                  style={{ color: withHslAlpha(tint.border, 0.6) }}
                >
                  {context.companyLine || context.signals[0]}
                </span>
              </div>

              {/* Title - editorial sizing */}
              <h3 
                className="text-xl md:text-[22px] font-light leading-snug text-foreground mb-4"
                style={{ fontFeatureSettings: "'kern' 1" }}
              >
                {context.title}
              </h3>

              {/* Problem as lead paragraph */}
              <p
                className="text-sm leading-relaxed text-foreground/70 flex-grow"
                style={{ opacity: bodyOpacity, transition: styles.transitionOpacity }}
              >
                {context.problem}
              </p>

              {/* Footer with signals and flip hint */}
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${withHslAlpha(tint.border, 0.08)}` }}>
                <div className="flex gap-2">
                  {context.signals.slice(0, 2).map((signal) => (
                    <span
                      key={signal}
                      className="text-[10px]"
                      style={{ color: withHslAlpha(tint.border, 0.5) }}
                    >
                      #{signal.replace(/\s/g, "")}
                    </span>
                  ))}
                </div>
                <div 
                  className="flex items-center gap-1"
                  style={{ 
                    opacity: isActive ? lerp(0.4, 0.7, strength) : 0,
                    transition: styles.transitionOpacity 
                  }}
                >
                  <RotateCcw className="w-3 h-3" style={{ color: tint.border }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardBack context={context} tint={tint} styles={styles} isActive={isActive} bodyOpacity={bodyOpacity} onFlip={onFlip} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════════════════════════

function VisualTypeIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {type === "flow" && (
        <path
          d="M4 12h4m4 0h4m4 0h4M8 12a4 4 0 108 0 4 4 0 00-8 0z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {type === "network" && (
        <>
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
          <circle cx="4" cy="8" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="8" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="4" cy="16" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="20" cy="16" r="2" stroke={color} strokeWidth="1.5" />
          <path d="M9.5 10.5L6 8.5M14.5 10.5L18 8.5M9.5 13.5L6 15.5M14.5 13.5L18 15.5" stroke={color} strokeWidth="1.5" />
        </>
      )}
      {type === "layers" && (
        <>
          <rect x="4" y="4" width="16" height="4" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="4" y="10" width="16" height="4" rx="1" stroke={color} strokeWidth="1.5" />
          <rect x="4" y="16" width="16" height="4" rx="1" stroke={color} strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

function CardBack({ 
  context, 
  tint, 
  styles, 
  isActive, 
  bodyOpacity,
  onFlip 
}: { 
  context: ExtendedCarouselContext; 
  tint: CarouselTint; 
  styles: ReturnType<typeof useCardStyles>;
  isActive: boolean;
  bodyOpacity: number;
  onFlip?: () => void;
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
            background: `linear-gradient(225deg, ${withHslAlpha(tint.bg, 0.25)} 0%, ${withHslAlpha(tint.bg, 0.133)} 55%, ${withHslAlpha(tint.bg, 0.078)} 100%)`,
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
              opacity: isActive ? bodyOpacity : 0,
              pointerEvents: isActive ? "auto" : "none",
              transition: styles.transitionOpacity,
            }}
          >
            <RotateCcw className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export all variants for easy switching
export const CardVariants = {
  editorial: CardVariantEditorial,
  minimal: CardVariantMinimal,
  layered: CardVariantLayered,
  interactive: CardVariantInteractive,
  compact: CardVariantCompact,
};

export type CardVariantKey = keyof typeof CardVariants;
