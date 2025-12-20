import { useEffect, useRef, useState } from "react";

export function useAutoplayProgress(options: {
  enabled: boolean;
  durationMs: number;
  paused?: boolean;
  onDone: () => void;
}) {
  const { enabled, durationMs, paused, onDone } = options;

  const [progress, setProgress] = useState(0); // 0..100
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Prevent effect restarts caused by changing onDone identity
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!enabled || paused) return;

    startRef.current = null;

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;

      const elapsed = ts - startRef.current;
      const pct01 = Math.min(elapsed / durationMs, 1);

      setProgress(pct01 * 100); // <-- 0..100

      if (pct01 >= 1) {
        startRef.current = null;
        setProgress(0);
        onDoneRef.current(); // <-- stable callback
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [durationMs, enabled, paused]);

  const reset = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setProgress(0);
  };

  return { progress, reset };
}
