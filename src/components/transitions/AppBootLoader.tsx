import { useMemo } from "react";
import { ConstellationRevealLoader } from "@/components/transitions/ConstellationRevealLoader";

export const AppBootLoader = () => {
  const seed = useMemo(() => Math.floor(Math.random() * 10000), []);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-background via-background to-background">
      <div className="text-center space-y-4">
        <ConstellationRevealLoader
          size={190}
          points={14}
          durationMs={4200}
          seed={seed}
          maxLinkDist={38}
          neighbors={2}
        />
        <p className="text-sm text-muted-foreground font-body">
          Initializing...
        </p>
      </div>
    </div>
  );
};

