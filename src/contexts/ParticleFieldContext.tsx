import { createContext, useContext, useState, ReactNode, FC } from "react";

export type ParticleFieldSection =
  | "hero"
  | "philosophy"
  | "carousel"
  | "experience";

interface ParticleFieldContextType {
  activePresetIndex: number;
  setActivePresetIndex: (index: number) => void;
  currentSection: ParticleFieldSection;
  setCurrentSection: (section: ParticleFieldSection) => void;
}

const ParticleFieldContext = createContext<
  ParticleFieldContextType | undefined
>(undefined);

export const ParticleFieldProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
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

export const useParticleField = () => {
  const context = useContext(ParticleFieldContext);
  if (!context) {
    throw new Error(
      "useParticleField must be used within ParticleFieldProvider"
    );
  }
  return context;
};
