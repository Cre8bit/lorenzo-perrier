import { useEffect, useRef, useState } from "react";

export function useAutoplayProgress(options: {
  enabled: boolean;
  durationMs: number;
  paused?: boolean;
  onDone: () => void;
}) {
  const { enabled, durationMs, paused, onDone } = options;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || paused) return;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        startRef.current = null;
        setProgress(0);
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [durationMs, enabled, onDone, paused]);

  const reset = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setProgress(0);
  };

  return { progress, reset };
}
