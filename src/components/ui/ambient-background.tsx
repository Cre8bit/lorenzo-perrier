import { useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/useAppContext";

export const AmbientBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentSection } = useAppContext();

  useEffect(() => {
    if (currentSection !== "hero") return;

    const el = containerRef.current;
    if (!el) return;

    // start centered
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");

    let raf = 0;
    let tx = 0,
      ty = 0;
    let cx = 0,
      cy = 0;

    const onMove = (e: MouseEvent) => {
      // target in [-1, 1]
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;

      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // smooth follow (keeps it subtle)
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        el.style.setProperty("--mx", cx.toFixed(4));
        el.style.setProperty("--my", cy.toFixed(4));
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [currentSection]);

  return (
    <div
      ref={containerRef}
      className="ambient-root fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Dark base */}
      <div className="ambient-base absolute inset-0" />

      {/* Very subtle “mist” blobs (same hue family as particles, low alpha) */}
      <div className="ambient-mist mist-1" />
      <div className="ambient-mist mist-2" />

      {/* Grain + vignette (depth without stealing focus) */}
      <div className="ambient-noise absolute inset-0" />
      <div className="ambient-vignette absolute inset-0" />
    </div>
  );
};