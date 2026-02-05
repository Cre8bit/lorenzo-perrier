/**
 * useCubeFlow - Hook to access CubeFlowContext
 * Separated from provider to avoid fast refresh issues
 */

import { useContext } from "react";
import { CubeFlowContext } from "@/contexts/CubeFlowContext";

export const useCubeFlow = () => {
  const context = useContext(CubeFlowContext);
  if (!context) {
    throw new Error("useCubeFlow must be used within CubeFlowProvider");
  }
  return context;
};
