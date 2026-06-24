import { FC, ReactNode, useMemo, useState } from "react";
import { AppContext, AppSection } from "./AppContext";
import { BootProvider } from "./BootProvider";

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<AppSection>("hero");
  const [isResumeViewVisible, setIsResumeViewVisible] = useState(false);

  const value = useMemo(
    () => ({
      activePresetIndex,
      setActivePresetIndex,
      currentSection,
      setCurrentSection,
      isResumeViewVisible,
      setIsResumeViewVisible,
    }),
    [activePresetIndex, currentSection, isResumeViewVisible],
  );

  return (
    <BootProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </BootProvider>
  );
};
