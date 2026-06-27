import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const computeIsMobile = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(computeIsMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(computeIsMobile());
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
