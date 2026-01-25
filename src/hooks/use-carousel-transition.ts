import { useCallback, useEffect, useRef, useState } from "react";
import { clampIndex } from "@/utils/animation";

type Dir = -1 | 1;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function useCarouselTransition(
  len: number,
  options?: {
    durationMs?: number;
    onBeforeChange?: () => void;
    initialIndex?: number;
  },
) {
  const durationMs = options?.durationMs ?? 560;
  const initialIndex = options?.initialIndex ?? 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<Dir>(1);
  const [t, setT] = useState(0);

  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const toRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const onBeforeChangeRef = useRef(options?.onBeforeChange);

  // Keep callback ref in sync
  useEffect(() => {
    onBeforeChangeRef.current = options?.onBeforeChange;
  }, [options?.onBeforeChange]);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
  }, []);

  const animateTo = useCallback(
    (toIndex: number, dir: Dir) => {
      const fromIndex = activeIndex;
      if (isAnimating || toIndex === fromIndex) return;

      const clampedTo = clampIndex(toIndex, len);
      const dist = Math.abs(clampedTo - fromIndex);

      const duration = durationMs * Math.min(3, Math.max(1, dist)); // cap at 3x

      onBeforeChangeRef.current?.();

      fromRef.current = fromIndex;
      toRef.current = clampedTo;
      setDirection(dir);
      setIsAnimating(true);
      setT(0);

      stop();
      startRef.current = null;

      const tick = (ts: number) => {
        if (startRef.current == null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const raw = Math.min(elapsed / duration, 1);
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
    [activeIndex, durationMs, isAnimating, len, stop],
  );

  const next = useCallback(
    () => animateTo(activeIndex + 1, 1),
    [activeIndex, animateTo],
  );
  const prev = useCallback(
    () => animateTo(activeIndex - 1, -1),
    [activeIndex, animateTo],
  );

  const goTo = useCallback(
    (idx: number) => {
      const curr = activeIndex;
      if (idx === curr) return;
      const dir: Dir = idx > curr ? 1 : -1;
      animateTo(idx, dir);
    },
    [activeIndex, animateTo],
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
