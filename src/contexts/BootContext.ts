import { createContext } from "react";

export interface BootContextType {
  isParticleFieldInitialized: boolean;
  setIsParticleFieldInitialized: (initialized: boolean) => void;

  isCubeSpaceSceneReady: boolean;
  setIsCubeSpaceSceneReady: (ready: boolean) => void;

  isCubeSpaceReady: boolean;
  setIsCubeSpaceReady: (ready: boolean) => void;

  hasBooted: boolean;
  setHasBooted: (booted: boolean) => void;
}

export const BootContext = createContext<BootContextType | undefined>(
  undefined,
);
