import { useEffect, useState } from "react";
import { cubeSpaceMetrics } from "@/lib/cubespaceMetrics";

/**
 * Hook to toggle CubeSpace debug overlay with keyboard shortcut
 *
 * Toggle: Cmd/Ctrl + Shift + I
 * Persists state in localStorage
 */
export const useCubeSpaceDebugOverlay = () => {
  const [enabled, setEnabled] = useState(() => {
    if (!import.meta.env.DEV) return false;
    const saved = localStorage.getItem("cubespace-debug-overlay-enabled");
    return saved === "true";
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + I to toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        setEnabled((prev) => {
          const next = !prev;
          localStorage.setItem("cubespace-debug-overlay-enabled", String(next));

          // Enable/disable metrics tracking
          if (next) {
            cubeSpaceMetrics.enable();
          } else {
            cubeSpaceMetrics.disable();
          }

          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return enabled;
};
