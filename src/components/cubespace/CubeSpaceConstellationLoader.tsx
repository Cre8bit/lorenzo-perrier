import { useMemo } from "react";
import { ConstellationRevealLoader } from "@/components/transitions/ConstellationRevealLoader";

type Props = {
  className?: string;
  message?: string;
  size?: number;
};

export function CubeSpaceConstellationLoader({
  className,
  message = "Loading...",
  size = 190,
}: Props) {
  const seed = useMemo(() => Math.floor(Math.random() * 10000), []);
  return (
    <div className={className}>
      <div className="flex h-full w-full items-center justify-center pointer-events-none">
        <div
          className="text-center space-y-4 rounded-2xl px-8 py-7"
          style={{
            backdropFilter: "blur(18px)",
            background: "hsl(var(--background) / 0.28)",
            border: "1px solid hsl(var(--foreground) / 0.08)",
            boxShadow: "0 20px 60px hsl(0 0% 0% / 0.35)",
          }}
        >
          <ConstellationRevealLoader
            size={size}
            points={14}
            durationMs={4200}
            seed={seed}
            maxLinkDist={38}
            neighbors={2}
          />
          {message ? (
            <p className="text-sm text-muted-foreground font-body">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

