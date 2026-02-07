import { useMemo, useRef } from "react";
import { AmbientBackground } from "@/components/ui/ambient-background";
import ParticleField3D from "@/components/ui/particle-field-3d";
import { useAppContext } from "@/contexts/useAppContext";

type ParticleMode = "active" | "idle";

type Props = {
  particleMode?: ParticleMode;
};

export function GlobalBackground({ particleMode = "active" }: Props) {
  const { activePresetIndex, currentSection, setIsParticleFieldInitialized } =
    useAppContext();
  const readyFiredRef = useRef(false);

  const effectivePresetIndex = useMemo(
    () => (currentSection === "philosophy" ? activePresetIndex : -1),
    [activePresetIndex, currentSection],
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-background" />
      <div className="noise-overlay" />
      <AmbientBackground />
      <ParticleField3D
        activePresetIndex={effectivePresetIndex}
        mode={particleMode}
        onReady={() => {
          if (readyFiredRef.current) return;
          readyFiredRef.current = true;
          setIsParticleFieldInitialized(true);
        }}
      />
    </div>
  );
}
