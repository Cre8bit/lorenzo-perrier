import { useEffect, useRef } from "react";
import { reportPerformance } from "./PerformanceOverlay";

type Dot = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
};

const DOT_COUNT = 30;
const CONNECTION_DISTANCE = 110; // a bit bigger for readability
const ACCENT = "hsl(185, 50%, 55%)";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// smoothstep for nicer fades
function smoothstep(t: number) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

export function ConstellationCanvas({
  active,
  seed, // changes each subtitle transition
  className,
}: {
  active: boolean;
  seed: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  // Resize to match element size (devicePixelRatio aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      // Smart DPR: reduce on low-memory devices to save GPU
      // @ts-expect-error - experimental API
      const deviceMemory = navigator.deviceMemory;
      const baseDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(
        baseDpr,
        deviceMemory && deviceMemory < 4 ? 1.25 : 1.5
      );

      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // initialize dots if empty (reduce count on small screens)
      if (dotsRef.current.length === 0) {
        const isSmallScreen = window.innerWidth < 768;
        const dotCount = isSmallScreen
          ? Math.floor(DOT_COUNT * 0.7)
          : DOT_COUNT;
        const dots: Dot[] = Array.from({ length: dotCount }, () => {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          return { x, y, tx: x, ty: y, vx: 0, vy: 0 };
        });
        dotsRef.current = dots;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => ro.disconnect();
  }, []);

  // On each "seed" change, assign new targets (small drift) so it morphs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dots = dotsRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // small morph: new targets within a radius, clamped
    for (const d of dots) {
      const r = 60; // morph radius; keep minimal
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      d.tx = Math.max(0, Math.min(w, d.x + Math.cos(angle) * dist));
      d.ty = Math.max(0, Math.min(h, d.y + Math.sin(angle) * dist));
    }
  }, [seed]);

  // Animate only when active
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!active) {
      // If you want it ONLY during transition: clear and stop
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    startRef.current = performance.now();
    let frameCount = 0;

    const tick = (now: number) => {
      const tickStart = performance.now();
      const t = (now - startRef.current) / 1100; // match transition duration
      const fadeIn = smoothstep(t / 0.25); // first 25%
      const fadeOut = smoothstep((1 - t) / 0.25); // last 25%
      const alpha = clamp01(Math.min(fadeIn, fadeOut)); // 0→1→0

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dots = dotsRef.current;

      // physics-ish easing toward target
      for (const d of dots) {
        const ax = (d.tx - d.x) * 0.012;
        const ay = (d.ty - d.y) * 0.012;
        d.vx = (d.vx + ax) * 0.88;
        d.vy = (d.vy + ay) * 0.88;
        d.x += d.vx;
        d.y += d.vy;
      }

      // draw connections only during transition
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i];
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CONNECTION_DISTANCE) {
            const strength = 1 - dist / CONNECTION_DISTANCE;
            ctx.strokeStyle = `hsla(185, 50%, 55%, ${0.25 * strength})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw dots with glow effect and pulsing animation
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // subtle pulse based on time and index for variety
        const pulse = 0.85 + 0.15 * Math.sin(t * Math.PI * 2 + i * 0.5);
        const baseRadius = 1.8 * pulse;

        // outer glow
        const gradient = ctx.createRadialGradient(
          d.x,
          d.y,
          0,
          d.x,
          d.y,
          baseRadius * 3
        );
        gradient.addColorStop(0, `hsla(185, 70%, 65%, ${0.8 * alpha})`);
        gradient.addColorStop(0.3, `hsla(185, 60%, 60%, ${0.4 * alpha})`);
        gradient.addColorStop(1, `hsla(185, 50%, 55%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(d.x, d.y, baseRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // core dot with shadow
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(185, 60%, 60%, ${0.7 * alpha})`;
        ctx.fillStyle = `hsla(185, 60%, 65%, ${0.9})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Report performance every 30 frames
      frameCount++;
      if (frameCount % 30 === 0) {
        const duration = performance.now() - tickStart;
        reportPerformance("ConstellationCanvas", duration);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // end: clear (so it's only during morph)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
      }
    };

    // Pause animation when the page/tab is hidden to save CPU
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        // restart if still active
        if (active && rafRef.current == null) {
          // resync timing to avoid huge jumps
          startRef.current = performance.now();
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "absolute inset-0 pointer-events-none"}
    />
  );
}
