import { useContext } from "react";
import { ParticleFieldContext } from "./ParticleFieldContext";

export const useParticleField = () => {
  const context = useContext(ParticleFieldContext);
  if (!context) {
    throw new Error("useParticleField must be used within ParticleFieldProvider");
  }
  return context;
};