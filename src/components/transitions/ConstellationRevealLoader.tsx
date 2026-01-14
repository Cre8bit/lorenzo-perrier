import React, { useMemo } from "react";

type Props = {
  size?: number;
  points?: number;
  durationMs?: number;
  seed?: number;
  maxLinkDist?: number;
  neighbors?: number;
};

type Pt = { x: number; y: number };
type Edge = { a: number; b: number; len: number };

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ConstellationRevealLoader({
  size = 180,
  points = 14,
  durationMs = 3600,
  seed = 7,
  maxLinkDist = 36,
  neighbors = 2,
}: Props) {
  const { pts, edges } = useMemo(() => {
    const rnd = mulberry32(seed);

    // More spacing: Poisson-ish rejection sampling with a minimum separation.
    const margin = 18;
    const minDotDist = Math.max(9, Math.min(14, 16 - points * 0.35));

    const pts: Pt[] = [];
    const maxAttemptsPerPoint = 350;

    for (let i = 0; i < points; i++) {
      let placed = false;

      for (let attempt = 0; attempt < maxAttemptsPerPoint; attempt++) {
        // triangular-ish distribution to avoid clumping at edges
        const rx = (rnd() + rnd()) / 2;
        const ry = (rnd() + rnd()) / 2;

        const x = margin + rx * (100 - margin * 2);
        const y = margin + ry * (100 - margin * 2);
        const candidate = { x, y };

        let ok = true;
        for (const p of pts) {
          if (dist(candidate, p) < minDotDist) {
            ok = false;
            break;
          }
        }

        if (ok) {
          pts.push(candidate);
          placed = true;
          break;
        }
      }

      // Fallback (still deterministic) if we couldn't place with strict spacing
      if (!placed) {
        const x = margin + rnd() * (100 - margin * 2);
        const y = margin + rnd() * (100 - margin * 2);
        pts.push({ x, y });
      }
    }

    // Build edges: connect each point to its N nearest neighbors within maxLinkDist
    const edgeMap = new Map<string, Edge>();

    for (let i = 0; i < pts.length; i++) {
      const candidates: Array<{ j: number; len: number }> = [];
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const l = dist(pts[i], pts[j]);
        if (l <= maxLinkDist) candidates.push({ j, len: l });
      }
      candidates.sort((a, b) => a.len - b.len);

      for (let k = 0; k < Math.min(neighbors, candidates.length); k++) {
        const j = candidates[k].j;
        const a = Math.min(i, j);
        const b = Math.max(i, j);
        const key = `${a}-${b}`;
        if (!edgeMap.has(key))
          edgeMap.set(key, { a, b, len: candidates[k].len });
      }
    }

    // Reveal shorter links first
    const edges = Array.from(edgeMap.values()).sort(
      (e1, e2) => e1.len - e2.len
    );

    return { pts, edges };
  }, [points, seed, maxLinkDist, neighbors]);

  // Continuous fuzz & flow: links immediately visible and animated
  return (
    <div style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
        <defs>
          <radialGradient id="cGlow" cx="50%" cy="50%" r="60%">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.95"
            />
            <stop
              offset="65%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>

        <g>
          {/* Continuously animated links with fuzz effect */}
          {edges.map((e, idx) => {
            const p1 = pts[e.a];
            const p2 = pts[e.b];

            // Stagger animations by edge index for visual flow
            const staggerDelay =
              (idx / Math.max(1, edges.length)) * (durationMs * 0.3);

            return (
              <line
                key={`edge-${idx}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="cEdge"
                style={
                  {
                    animationDuration: `${durationMs}ms`,
                    animationDelay: `${staggerDelay}ms`,
                  } as React.CSSProperties
                }
                stroke="hsl(var(--primary))"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            );
          })}

          {/* Dots */}
          {pts.map((p, i) => (
            <g key={`dot-${i}`}>
              <circle cx={p.x} cy={p.y} r="6.2" fill="url(#cGlow)" />
              <circle
                cx={p.x}
                cy={p.y}
                r="1.9"
                fill="hsl(var(--primary))"
                opacity="0.92"
              />
            </g>
          ))}
        </g>
      </svg>

      <style>{`
        .cEdge {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          will-change: stroke-dashoffset, opacity, filter;
          backface-visibility: hidden;
          transform: translateZ(0);
          filter: drop-shadow(0px 0px 6px hsl(var(--primary) / 0.4))
                  drop-shadow(0px 0px 12px hsl(var(--primary) / 0.2));

          animation-name: cDraw, cFade;
          animation-timing-function: cubic-bezier(0.12, 0.85, 0.18, 1), ease-in-out;
          animation-iteration-count: infinite, infinite;
          animation-fill-mode: both, both;
        }

        /* Draw phase: line animates into view quickly */
        @keyframes cDraw {
          0%   { stroke-dashoffset: 200; }
          30%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }

        /* Fade phase: line holds then fades out for next cycle */
        @keyframes cFade {
          0%   { opacity: 0; }
          15%  { opacity: 0.9; }
          70%  { opacity: 0.9; }
          100% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cEdge { 
            animation: none;
            stroke-dashoffset: 0;
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  );
}
