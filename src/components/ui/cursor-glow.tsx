import { useEffect, useRef, useState } from "react";

/**
 * A pair of soft, cursor-following ambient glows that add depth to the UI.
 */
export const CursorGlow = () => {
  const rafRef = useRef<number | null>(null);
  const sharpElRef = useRef<HTMLDivElement | null>(null);
  const deepElRef = useRef<HTMLDivElement | null>(null);

  const target = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });
  const soft = useRef({ ...target.current });
  const lastWritten = useRef({ tx: -1, ty: -1, sx: -1, sy: -1 });
  const runningRef = useRef(false);

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (isTouch || prefersReduced) return;

    setEnabled(true);

    const SHARP_HALF = 300; // half of cursor-glow width (600 / 2)
    const DEEP_HALF = 450; // half of cursor-glow--deep width (900 / 2)
    const EPS = 0.25; // sub-pixel threshold for "converged"

    const writeTransforms = () => {
      const tx = target.current.x;
      const ty = target.current.y;
      const sx = soft.current.x;
      const sy = soft.current.y;

      // Only touch the DOM when the rounded pixel value actually changed.
      const rtx = Math.round(tx);
      const rty = Math.round(ty);
      const rsx = Math.round(sx);
      const rsy = Math.round(sy);

      if (
        rtx !== lastWritten.current.tx ||
        rty !== lastWritten.current.ty
      ) {
        if (sharpElRef.current) {
          sharpElRef.current.style.transform = `translate3d(${
            rtx - SHARP_HALF
          }px, ${rty - SHARP_HALF}px, 0)`;
        }
        lastWritten.current.tx = rtx;
        lastWritten.current.ty = rty;
      }

      if (
        rsx !== lastWritten.current.sx ||
        rsy !== lastWritten.current.sy
      ) {
        if (deepElRef.current) {
          deepElRef.current.style.transform = `translate3d(${
            rsx - DEEP_HALF
          }px, ${rsy - DEEP_HALF}px, 0)`;
        }
        lastWritten.current.sx = rsx;
        lastWritten.current.sy = rsy;
      }
    };

    const tick = () => {
      // Ease the deep layer toward the target.
      soft.current.x += (target.current.x - soft.current.x) * 0.08;
      soft.current.y += (target.current.y - soft.current.y) * 0.08;

      writeTransforms();

      const dx = target.current.x - soft.current.x;
      const dy = target.current.y - soft.current.y;
      const stillEasing = Math.abs(dx) > EPS || Math.abs(dy) > EPS;

      if (stillEasing) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Snap and stop. Next mousemove will reignite the loop.
        soft.current.x = target.current.x;
        soft.current.y = target.current.y;
        writeTransforms();
        runningRef.current = false;
        rafRef.current = null;
      }
    };

    const startIfNeeded = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      startIfNeeded();
    };

    // Prime the initial position once.
    writeTransforms();

    window.addEventListener("mousemove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={deepElRef}
        className="cursor-glow cursor-glow--deep"
        aria-hidden
      />
      <div ref={sharpElRef} className="cursor-glow" aria-hidden />
    </>
  );
};
