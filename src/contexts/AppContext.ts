import { createContext } from "react";

export type AppSection = "hero" | "philosophy" | "carousel" | "experience";

export interface AppContextType {
  // Particle field preset for current section
  activePresetIndex: number;
  setActivePresetIndex: (index: number) => void;

  // Current visible/active section
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;

  // Three.js initialization state
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;

  // Resume view visible: show experience header when scrolled past hero AND in experience section
  isResumeViewVisible: boolean;
  setIsResumeViewVisible: (visible: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
