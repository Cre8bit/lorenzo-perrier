import { FC, ReactNode, useState } from "react";
import { AppContext, AppSection } from "./AppContext";

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<AppSection>("hero");
  const [isParticleFieldInitialized, setIsParticleFieldInitialized] =
    useState(false);
  const [isCubeSpaceSceneReady, setIsCubeSpaceSceneReady] = useState(false);
  const [isCubeSpaceReady, setIsCubeSpaceReady] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);
  const [isResumeViewVisible, setIsResumeViewVisible] = useState(false);

  return (
    <AppContext.Provider
      value={{
        activePresetIndex,
        setActivePresetIndex,
        currentSection,
        setCurrentSection,
        isParticleFieldInitialized,
        setIsParticleFieldInitialized,
        isCubeSpaceSceneReady,
        setIsCubeSpaceSceneReady,
        isCubeSpaceReady,
        setIsCubeSpaceReady,
        hasBooted,
        setHasBooted,
        isResumeViewVisible,
        setIsResumeViewVisible,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
