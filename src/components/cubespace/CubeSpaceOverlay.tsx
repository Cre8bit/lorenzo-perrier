// CubeSpaceOverlay.tsx — overlay with tower height + placing mode + vertical scale
import { useMemo } from "react";
import { Ruler, Palette, Shuffle } from "lucide-react";
import { CUBE_COLORS, getRandomColor } from "@/components/cubespace/cubeColors";

type Props = {
  cubeCount: number;
  towerHeight: number; // world units from CubeScene
  isPlacing: boolean;
  onTogglePlacing: () => void;

  selectedColor: string;
  onColorChange: (color: string) => void;
};

function formatHeight(h: number) {
  // interpret 1 unit ≈ 1 meter-ish for fun UI
  const meters = h;
  if (meters < 1) return "0.0m";
  return `${meters.toFixed(meters < 10 ? 1 : 0)}m`;
}

export const CubeSpaceOverlay = ({
  cubeCount,
  towerHeight,
  isPlacing,
  onTogglePlacing,
  selectedColor,
  onColorChange,
}: Props) => {
  const heightLabel = useMemo(() => formatHeight(towerHeight), [towerHeight]);
  const maxScale = useMemo(
    () => Math.max(10, Math.ceil((towerHeight + 2) / 5) * 5),
    [towerHeight]
  );
  const ticks = useMemo(
    () => Array.from({ length: maxScale / 5 + 1 }, (_, i) => i * 5),
    [maxScale]
  );
  const fillPercent = Math.min(100, (towerHeight / maxScale) * 100);
  const ctaSpectrum = useMemo(() => {
    const stops = CUBE_COLORS.map((color, index) => {
      const pct = Math.round((index / (CUBE_COLORS.length - 1)) * 100);
      const glow = color.replace("hsl(", "hsla(").replace(")", ", 0.35)");
      const bg = color.replace("hsl(", "hsla(").replace(")", ", 0.28)");
      const text = color.replace("hsl(", "hsla(").replace(")", ", 0.95)");
      return `${pct}% { background-color: ${bg}; border-color: ${color}; color: ${text}; box-shadow: 0 14px 32px ${glow}; }`;
    }).join("\n");
    return `@keyframes ctaSpectrum { ${stops} }`;
  }, []);

  return (
    <>
      {/* Title */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1
          className="text-2xl md:text-3xl font-display tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.6) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CubeSpace
        </h1>
        {isPlacing ? (
          <p className="mt-3 text-xs text-primary/80 tracking-wide">
            Click anywhere on the glowing plane to place your cube.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted-foreground/60 tracking-wide">
              Help us stack cubes and reach new heights!
            </p>
            <button
              onClick={onTogglePlacing}
              className="pointer-events-auto mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold tracking-[0.18em] uppercase transition-all"
              style={{
                backgroundColor: "hsla(185, 40%, 45%, 0.28)",
                border: "1px solid hsl(185, 40%, 45%)",
                color: "hsla(185, 40%, 45%, 0.95)",
                boxShadow: "0 14px 32px hsla(185, 40%, 45%, 0.35)",
                animation:
                  "ctaPulse 2.4s ease-in-out infinite, ctaSpectrum 22s ease-in-out infinite",
                transformOrigin: "center",
              }}
            >
              Add your cube !
            </button>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        {isPlacing && (
          <div
            className="relative px-4 py-3 rounded-xl flex flex-col gap-2"
            style={{
              backdropFilter: "blur(16px)",
              background: "hsl(var(--background) / 0.28)",
              border: "1px solid hsl(var(--foreground) / 0.06)",
              boxShadow: "0 12px 30px hsl(0 0% 0% / 0.2)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <Palette className="w-3.5 h-3.5" />
                <span>Cube color</span>
              </div>
              <button
                onClick={() => onColorChange(getRandomColor())}
                className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <span className="inline-flex items-center gap-1">
                  <Shuffle className="w-3 h-3" />
                  Random
                </span>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {CUBE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className="h-6 w-6 rounded-full border transition-all"
                  style={{
                    background: color,
                    borderColor:
                      selectedColor === color ? "hsl(var(--primary) / 0.8)" : "transparent",
                    boxShadow:
                      selectedColor === color
                        ? "0 0 0 2px hsl(var(--primary) / 0.25)"
                        : "0 0 0 1px hsl(0 0% 0% / 0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom-right stats (count + height) */}
      <div
        className="fixed bottom-28 right-8 pointer-events-none"
        style={{
          backdropFilter: "blur(12px)",
          background: "hsl(var(--background) / 0.28)",
          border: "1px solid hsl(var(--foreground) / 0.06)",
          borderRadius: "12px",
          padding: "10px 12px",
          minWidth: 160,
        }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
          <span>Cubes</span>
          <span className="text-foreground/85 font-medium">{cubeCount}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground/70">
          <span className="inline-flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            Height
          </span>
          <span className="text-foreground/85 font-medium">{heightLabel}</span>
        </div>
      </div>

      {/* Vertical scale (left) */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
        <div
          className="relative h-[240px] w-[14px] rounded-full"
          style={{
            backdropFilter: "blur(12px)",
            background: "hsl(var(--background) / 0.18)",
            border: "1px solid hsl(var(--foreground) / 0.06)",
          }}
        >
          {ticks.map((tick) => {
            const tickY = (tick / maxScale) * 100;
            return (
              <div
                key={tick}
                className="absolute left-4 flex items-center gap-2 text-[10px] text-muted-foreground/60"
                style={{ bottom: `calc(${tickY}% - 4px)` }}
              >
                <span
                  className="block h-[1px] w-3"
                  style={{ background: "hsl(var(--foreground) / 0.15)" }}
                />
                <span>{tick}m</span>
              </div>
            );
          })}
          {/* Fill */}
          <div
            className="absolute bottom-1 left-1 right-1 rounded-full"
            style={{
              height: `${fillPercent}%`,
              background: "linear-gradient(180deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.1))",
              boxShadow: "0 0 28px hsl(var(--primary) / 0.14)",
            }}
          />
          <div
            className="absolute -right-8 text-[10px] text-primary/80 font-semibold"
            style={{ bottom: `calc(${fillPercent}% - 6px)` }}
          >
            {heightLabel}
          </div>
        </div>
        <div className="mt-3 text-[11px] tracking-[0.22em] uppercase text-muted-foreground/50">
          Elevation
        </div>
      </div>

      <style>
        {`
          @keyframes ctaPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
          ${ctaSpectrum}
        `}
      </style>
    </>
  );
};
