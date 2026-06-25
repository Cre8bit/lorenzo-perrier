import { FC, ReactNode, useMemo, useState } from "react";
import { BootContext } from "./BootContext";

export const BootProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isParticleFieldInitialized, setIsParticleFieldInitialized] =
    useState(false);
  const [isCubeSpaceSceneReady, setIsCubeSpaceSceneReady] = useState(false);
  const [isCubeSpaceReady, setIsCubeSpaceReady] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  const value = useMemo(
    () => ({
      isParticleFieldInitialized,
      setIsParticleFieldInitialized,
      isCubeSpaceSceneReady,
      setIsCubeSpaceSceneReady,
      isCubeSpaceReady,
      setIsCubeSpaceReady,
      hasBooted,
      setHasBooted,
    }),
    [
      isParticleFieldInitialized,
      isCubeSpaceSceneReady,
      isCubeSpaceReady,
      hasBooted,
    ],
  );

  return <BootContext.Provider value={value}>{children}</BootContext.Provider>;
};
