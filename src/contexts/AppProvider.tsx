import { FC, ReactNode, useState } from "react";
import { AppContext, AppSection } from "./AppContext";

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<AppSection>("hero");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResumeViewVisible, setIsResumeViewVisible] = useState(false);

  return (
    <AppContext.Provider
      value={{
        activePresetIndex,
        setActivePresetIndex,
        currentSection,
        setCurrentSection,
        isInitialized,
        setIsInitialized,
        isResumeViewVisible,
        setIsResumeViewVisible,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
