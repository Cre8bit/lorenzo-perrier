import { useContext } from "react";
import { BootContext } from "./BootContext";

export const useBootContext = () => {
  const context = useContext(BootContext);
  if (!context) {
    throw new Error("useBootContext must be used within BootProvider");
  }
  return context;
};
