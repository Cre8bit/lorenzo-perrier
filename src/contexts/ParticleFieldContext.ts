import { createContext } from "react";

export type ParticleFieldSection =
  | "hero"
  | "philosophy"
  | "carousel"
  | "experience";

export interface ParticleFieldContextType {
  activePresetIndex: number;
  setActivePresetIndex: (index: number) => void;
  currentSection: ParticleFieldSection;
  setCurrentSection: (section: ParticleFieldSection) => void;
}

export const ParticleFieldContext = createContext<
  ParticleFieldContextType | undefined
>(undefined);