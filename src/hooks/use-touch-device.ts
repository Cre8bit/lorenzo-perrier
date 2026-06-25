import { useEffect, useState } from "react";

/**
 * True for devices whose primary input is a coarse pointer (touch / pen).
 * Cheaper and more accurate than `useIsMobile` for disabling hover/parallax
 * effects: a small laptop window still has a fine pointer, while a large
 * tablet still has a coarse one.
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const onChange = () => setIsTouch(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}
