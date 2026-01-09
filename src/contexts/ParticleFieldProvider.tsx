import { FC, ReactNode, useState } from "react";
import {
  ParticleFieldContext,
  ParticleFieldSection,
} from "./ParticleFieldContext";

export const ParticleFieldProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [currentSection, setCurrentSection] =
    useState<ParticleFieldSection>("hero");

  return (
    <ParticleFieldContext.Provider
      value={{
        activePresetIndex,
        setActivePresetIndex,
        currentSection,
        setCurrentSection,
      }}
    >
      {children}
    </ParticleFieldContext.Provider>
  );
};