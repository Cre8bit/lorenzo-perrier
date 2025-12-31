import { useEffect, useMemo, useRef } from "react";
import { reportPerformance } from "./performance-overlay";
import { clamp01, smoothstep } from "@/utils/animation";

type Dot = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
};

const DOT_COUNT = 30;
const CONNECTION_DISTANCE = 110;
const ACCENT = "hsla(185, 50%, 55%, 1)";

// Safe-area tuning (adjust to match your UI)
const SAFE_PAD_X = 0.05;
const SAFE_PAD_Y = 0.05;
const FORBID_TOP = 0.05;

type SafeArea = { x: number; y: number; w: number; h: number };

// === Visual tuning (links) ===
const LINK_BASE_ALPHA = 0.42; // was ~0.25 * strength
const LINK_MIN_STRENGTH = 0.25; // keeps faint links visible
const MAX_LINKS_PER_DOT = 5; // was 4
const LINE_WIDTH = 1.25;

// === Motion tuning (smoother start) ===
const WARMUP_MS = 260; // how long we ramp in the motion

// ============================================================================
// Small spatial grid for O(n) neighbor search
// ============================================================================

type Grid = {
  cell: number;
  cols: number;
  rows: number;
  buckets: Int32Array; // head per cell
  next: Int32Array; // next per dot
};

function buildGrid(w: number, h: number, cell: number, dotCount: number): Grid {
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(h / cell));
  return {
    cell,
    cols,
    rows,
    buckets: new Int32Array(cols * rows).fill(-1),
    next: new Int32Array(dotCount).fill(-1),
  };
}

function gridIndex(g: Grid, x: number, y: number) {
  const cx = Math.max(0, Math.min(g.cols - 1, (x / g.cell) | 0));
  const cy = Math.max(0, Math.min(g.rows - 1, (y / g.cell) | 0));
  return cy * g.cols + cx;
}

function gridClear(g: Grid) {
  g.buckets.fill(-1);
  g.next.fill(-1);
}

function gridInsert(g: Grid, dots: Dot[]) {
  for (let i = 0; i < dots.length; i++) {
    const d = dots[i];
    const idx = gridIndex(g, d.x, d.y);
    g.next[i] = g.buckets[idx];
    g.buckets[idx] = i;
  }
}

function forNeighbors(
  g: Grid,
  dots: Dot[],
  i: number,
  radius: number,
  fn: (j: number) => void
) {
  const d = dots[i];
  const cx = (d.x / g.cell) | 0;
  const cy = (d.y / g.cell) | 0;
  const r = Math.ceil(radius / g.cell);

  const minX = Math.max(0, cx - r);
  const maxX = Math.min(g.cols - 1, cx + r);
  const minY = Math.max(0, cy - r);
  const maxY = Math.min(g.rows - 1, cy + r);

  for (let yy = minY; yy <= maxY; yy++) {
    for (let xx = minX; xx <= maxX; xx++) {
      let head = g.buckets[yy * g.cols + xx];
      while (head !== -1) {
        fn(head);
        head = g.next[head];
      }
    }
  }
}

// ============================================================================
// Glow sprite cache
// ============================================================================

function makeGlowSprite(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const r = size / 2;

  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "hsla(185, 70%, 70%, 1)");
  grad.addColorStop(0.25, "hsla(185, 60%, 62%, 0.55)");
  grad.addColorStop(1, "hsla(185, 50%, 55%, 0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

// ============================================================================
// Safe-area + target generation helpers
// ============================================================================

function computeSafeArea(canvasW: number, canvasH: number): SafeArea {
  const padX = canvasW * SAFE_PAD_X;
  const padY = canvasH * SAFE_PAD_Y;
  const forbidTopPx = canvasH * FORBID_TOP;

  const x = padX;
  const y = padY + forbidTopPx;
  const w = Math.max(1, canvasW - padX * 2);
  const h = Math.max(1, canvasH - (padY + forbidTopPx) - padY);

  return { x, y, w, h };
}

function assignTargetsInSafeArea(dots: Dot[], safe: SafeArea) {
  const n = dots.length;

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  const cellW = safe.w / cols;
  const cellH = safe.h / rows;

  const targets: Array<{ x: number; y: number }> = [];
  let k = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (k++ >= n) break;

      const jx = (Math.random() - 0.5) * 0.8;
      const jy = (Math.random() - 0.5) * 0.8;

      const x = safe.x + (c + 0.5 + jx) * cellW;
      const y = safe.y + (r + 0.5 + jy) * cellH;

      targets.push({
        x: Math.max(safe.x, Math.min(safe.x + safe.w, x)),
        y: Math.max(safe.y, Math.min(safe.y + safe.h, y)),
      });
    }
  }

  for (let i = targets.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  for (let i = 0; i < dots.length; i++) {
    dots[i].tx = targets[i].x;
    dots[i].ty = targets[i].y;
  }
}

function softContain(d: Dot, safe: SafeArea) {
  const margin = 10;
  const left = safe.x + margin;
  const right = safe.x + safe.w - margin;
  const top = safe.y + margin;
  const bottom = safe.y + safe.h - margin;

  const k = 0.02;

  if (d.x < left) d.vx += (left - d.x) * k;
  else if (d.x > right) d.vx -= (d.x - right) * k;

  if (d.y < top) d.vy += (top - d.y) * k;
  else if (d.y > bottom) d.vy -= (d.y - bottom) * k;
}

export function ConstellationCanvas({
  active,
  seed,
  className,
}: {
  active: boolean;
  seed: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const gridRef = useRef<Grid | null>(null);
  const safeRef = useRef<SafeArea | null>(null);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const perfFrameRef = useRef(0);
  const skipRef = useRef(0);

  const glowSprite = useMemo(() => makeGlowSprite(64), []);

  // Resize to match parent (DPR aware) + init dots/grid + safe area
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      // @ts-expect-error - experimental API
      const deviceMemory = navigator.deviceMemory;
      const baseDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(
        baseDpr,
        deviceMemory && deviceMemory < 4 ? 1.25 : 1.5
      );

      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      safeRef.current = computeSafeArea(w, h);

      if (dotsRef.current.length === 0) {
        const isSmall = window.innerWidth < 768;
        const count = isSmall ? Math.floor(DOT_COUNT * 0.7) : DOT_COUNT;

        const safe = safeRef.current;
        const sx = safe ? safe.x : 0;
        const sy = safe ? safe.y : 0;
        const sw = safe ? safe.w : w;
        const sh = safe ? safe.h : h;

        dotsRef.current = Array.from({ length: count }, () => {
          const x = sx + Math.random() * sw;
          const y = sy + Math.random() * sh;
          return { x, y, tx: x, ty: y, vx: 0, vy: 0 };
        });

        if (safe) assignTargetsInSafeArea(dotsRef.current, safe);
      }

      gridRef.current = buildGrid(
        w,
        h,
        CONNECTION_DISTANCE,
        dotsRef.current.length
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // On seed change: assign new targets
  useEffect(() => {
    const safe = safeRef.current;
    if (!safe) return;
    assignTargetsInSafeArea(dotsRef.current, safe);
  }, [seed]);

  // Animate only when active
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dots = dotsRef.current;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    if (!active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stop();
      return;
    }

    startRef.current = performance.now();
    perfFrameRef.current = 0;
    skipRef.current = 0;

    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = ACCENT;

    const tick = (now: number) => {
      const tickStart = performance.now();

      const skip = skipRef.current;
      if (skip > 0) {
        skipRef.current = skip - 1;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // overall timeline (fade)
      const t = (now - startRef.current) / 1100;
      const fadeIn = smoothstep(t / 0.25);
      const fadeOut = smoothstep((1 - t) / 0.25);
      const alpha = clamp01(Math.min(fadeIn, fadeOut));

      // warmup (motion) — prevents “fast snap” at the beginning
      const warm = smoothstep(clamp01((now - startRef.current) / WARMUP_MS));

      if (alpha < 0.02) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else rafRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const safe = safeRef.current;

      // physics easing (ramped)
      const spring = 0.01 * warm; // starts near 0, ramps up
      const damping = 0.92 + 0.06 * (1 - warm); // slightly more damping early

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        const ax = (d.tx - d.x) * spring;
        const ay = (d.ty - d.y) * spring;

        d.vx = (d.vx + ax) * damping;
        d.vy = (d.vy + ay) * damping;

        if (safe) softContain(d, safe);

        d.x += d.vx;
        d.y += d.vy;
      }

      // Grid
      const g = gridRef.current;
      if (g) {
        gridClear(g);
        gridInsert(g, dots);
      }

      // Connections
      ctx.save();

      const r = CONNECTION_DISTANCE;
      const r2 = r * r;

      for (let i = 0; i < dots.length; i++) {
        let made = 0;
        if (!g) break;

        forNeighbors(g, dots, i, r, (j) => {
          if (j <= i) return;
          if (made >= MAX_LINKS_PER_DOT) return;

          const a = dots[i];
          const b = dots[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= r2) return;

          const dist = Math.sqrt(d2);
          const strength = Math.max(LINK_MIN_STRENGTH, 1 - dist / r);

          ctx.globalAlpha = alpha * (LINK_BASE_ALPHA * strength);

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          made++;
        });
      }

      // Dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const pulse = 0.85 + 0.15 * Math.sin(t * Math.PI * 2 + i * 0.5);
        const coreR = 1.7 * pulse;

        const glowR = coreR * 5.0;
        ctx.globalAlpha = alpha * 0.9;
        ctx.drawImage(
          glowSprite,
          d.x - glowR,
          d.y - glowR,
          glowR * 2,
          glowR * 2
        );

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "hsla(185, 60%, 70%, 0.95)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, coreR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Perf reporting + adaptive skip
      perfFrameRef.current++;
      if (perfFrameRef.current % 30 === 0) {
        const duration = performance.now() - tickStart;
        reportPerformance("ConstellationCanvas", duration);
        if (duration > 10) skipRef.current = 1;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (active && rafRef.current == null) {
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, glowSprite]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "absolute inset-0 pointer-events-none"}
    />
  );
}
