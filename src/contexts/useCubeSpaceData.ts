import { useContext } from "react";
import { CubeSpaceDataContext } from "@/contexts/CubeSpaceDataContext";

export const useCubeSpaceData = () => {
  const context = useContext(CubeSpaceDataContext);
  if (!context) {
    throw new Error("useCubeSpaceData must be used within CubeSpaceDataProvider");
  }
  return context;
};

