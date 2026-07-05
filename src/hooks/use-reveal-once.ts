import { useEffect, useRef, useState } from "react";

/**
 * One-shot viewport reveal. Returns a ref and a boolean that flips to true
 * the first time the element enters the viewport, then disconnects — zero
 * ongoing cost. Pair with the `.reveal-up` CSS class (data-inview attr).
 * Honors prefers-reduced-motion by revealing immediately.
 */
export function useRevealOnce<T extends HTMLElement>(
  rootMargin = "0px 0px -8% 0px",
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
