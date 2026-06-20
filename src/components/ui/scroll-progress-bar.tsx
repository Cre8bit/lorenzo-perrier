import { useEffect, useRef } from "react";

/**
 * Iridescent beam fixed at the top of the viewport. Scales horizontally
 * based on document scroll progress.
 */
export const ScrollProgressBar = () => {
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let pending = false;
    let cachedMax = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );

    const update = () => {
      pending = false;
      const el = beamRef.current;
      if (!el) return;
      const p = cachedMax > 0
        ? Math.min(1, Math.max(0, window.scrollY / cachedMax))
        : 0;
      el.style.transform = `scaleX(${p})`;
      el.style.opacity = p > 0.001 ? "1" : "0";
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(update);
    };

    const refreshMax = () => {
      cachedMax = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      update();
    };

    // Refresh max on resize and when the document's size changes (sections
    // expanding, fonts loading, etc.).
    const ro = new ResizeObserver(refreshMax);
    ro.observe(document.documentElement);

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", refreshMax, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", refreshMax);
    };
  }, []);

  return (
    <div
      ref={beamRef}
      className="scroll-beam"
      aria-hidden
      style={{ transform: "scaleX(0)", opacity: 0, transition: "opacity 300ms" }}
    />
  );
};
