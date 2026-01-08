import { useEffect, useRef, useState } from "react";

export function useInViewport<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with stable callback
    observerRef.current = new IntersectionObserver(([e]) => {
      setEntry(e);
      setInView(e.isIntersecting);
      setRatio(e.intersectionRatio);
    }, options);

    observerRef.current.observe(el);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []); // Empty deps - observer is created once and persists

  return { ref, inView, ratio, entry };
}
