import { useCallback, useEffect, useRef, useState } from "react";

type Dir = -1 | 1;

const clampIndex = (i: number, len: number) => (i + len) % len;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function useCarouselTransition(len: number, options?: { durationMs?: number; onBeforeChange?: () => void }) {
  const durationMs = options?.durationMs ?? 560;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<Dir>(1);
  const [t, setT] = useState(0);

  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const toRef = useRef(0);
  const startRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
  }, []);

  const animateTo = useCallback(
    (toIndex: number, dir: Dir) => {
      const fromIndex = activeIndex;
      if (isAnimating || toIndex === fromIndex) return;

      options?.onBeforeChange?.();

      fromRef.current = fromIndex;
      toRef.current = clampIndex(toIndex, len);
      setDirection(dir);
      setIsAnimating(true);
      setT(0);

      stop();
      startRef.current = null;

      const tick = (ts: number) => {
        if (startRef.current == null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const raw = Math.min(elapsed / durationMs, 1);
        const eased = easeInOutCubic(raw);
        setT(eased);

        if (raw >= 1) {
          setActiveIndex(toRef.current);
          setIsAnimating(false);
          setT(0);
          stop();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [activeIndex, durationMs, isAnimating, len, options, stop]
  );

  const next = useCallback(() => animateTo(activeIndex + 1, 1), [activeIndex, animateTo]);
  const prev = useCallback(() => animateTo(activeIndex - 1, -1), [activeIndex, animateTo]);

  const goTo = useCallback(
    (idx: number) => {
      const curr = activeIndex;
      if (idx === curr) return;
      const forwardDist = (idx - curr + len) % len;
      const backwardDist = (curr - idx + len) % len;
      const dir: Dir = forwardDist <= backwardDist ? 1 : -1;
      animateTo(idx, dir);
    },
    [activeIndex, animateTo, len]
  );

  useEffect(() => () => stop(), [stop]);

  return {
    activeIndex,
    isAnimating,
    direction,
    t,
    fromIndex: fromRef.current,
    toIndex: toRef.current,
    next,
    prev,
    goTo,
  };
}
