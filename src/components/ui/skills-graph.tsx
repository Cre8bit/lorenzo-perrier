import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
} from "d3-force";
import { reportPerformance } from "./performance-overlay";
// Optional: faster nearest-node lookup
// import { quadtree } from "d3-quadtree";

interface SkillNode {
  id: string;
  name: string;
  cardIndices: number[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string | SkillNode;
  target: string | SkillNode;
  // how many shared experiences connect these skills
  weight: number;
  // which card index to color by (pick first shared)
  primaryCard: number;
}

interface SkillsGraphProps {
  experiences: Array<{ tags: string[]; company: string }>;
  onSkillClick: (cardIndex: number) => void;
}

const EXPERIENCE_COLORS = [
  { hue: 185, sat: 50, light: 55 },
  { hue: 280, sat: 60, light: 60 },
  { hue: 30, sat: 70, light: 60 },
  { hue: 140, sat: 50, light: 55 },
  { hue: 350, sat: 65, light: 60 },
  { hue: 210, sat: 55, light: 60 },
  { hue: 50, sat: 70, light: 65 },
  { hue: 320, sat: 60, light: 60 },
];

function baseRadius(n: SkillNode) {
  return 10 + n.cardIndices.length * 3;
}

export const SkillsGraph = ({
  experiences,
  onSkillClick,
}: SkillsGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLDivElement>());

  const simRef = useRef<Simulation<SkillNode, Link> | null>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const linksRef = useRef<Link[]>([]);
  const rafRef = useRef<number | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const hoveredRef = useRef<SkillNode | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, inside: false });

  // Build skills (same as your logic)
  const skillsData = useMemo(() => {
    const skillMap = new Map<string, number[]>();
    experiences.forEach((exp, cardIndex) => {
      exp.tags.forEach((tag) => {
        const existing = skillMap.get(tag) || [];
        if (!existing.includes(cardIndex)) existing.push(cardIndex);
        skillMap.set(tag, existing);
      });
    });

    return Array.from(skillMap.entries()).map(([name, cardIndices]) => ({
      name,
      cardIndices,
    }));
  }, [experiences]);

  // Precompute links ONCE (cheap at runtime)
  const graphData = useMemo(() => {
    // nodes
    const nodes: SkillNode[] = skillsData.map((s) => ({
      id: s.name,
      name: s.name,
      cardIndices: s.cardIndices,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));

    // Build per-card skill lists
    const skillsByCard = new Map<number, string[]>();
    experiences.forEach((exp, cardIndex) => {
      skillsByCard.set(cardIndex, exp.tags);
    });

    // links: connect skills that appear in the same card, accumulate weight
    // Key: "a|b" with stable ordering
    const linkMap = new Map<string, { weight: number; primaryCard: number }>();

    for (const [cardIndex, tags] of skillsByCard.entries()) {
      // de-dup within a card
      const unique = Array.from(new Set(tags));
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const a = unique[i];
          const b = unique[j];
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          const prev = linkMap.get(key);
          if (!prev) linkMap.set(key, { weight: 1, primaryCard: cardIndex });
          else
            linkMap.set(key, {
              weight: prev.weight + 1,
              primaryCard: prev.primaryCard,
            });
        }
      }
    }

    const links: Link[] = Array.from(linkMap.entries()).map(([key, v]) => {
      const [a, b] = key.split("|");
      return {
        source: a,
        target: b,
        weight: v.weight,
        primaryCard: v.primaryCard,
      };
    });

    return { nodes, links };
  }, [skillsData, experiences]);

  // IntersectionObserver (same)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.2 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Setup + run simulation & rendering
  useEffect(() => {
    if (!isVisible || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize helper
    const resize = () => {
      const rect = container.getBoundingClientRect();
      // lower DPR for perf, similar to your logic
      // @ts-expect-error experimental
      const deviceMemory = navigator.deviceMemory;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        deviceMemory && deviceMemory < 4 ? 1 : 1.5
      );

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Init nodes positions in a loose circle
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.35;

    const nodes = graphData.nodes.map((n, i) => {
      const angle = (i / Math.max(1, graphData.nodes.length)) * Math.PI * 2;
      const clusterOffset = (n.cardIndices[0] ?? 0) * 0.18;
      return {
        ...n,
        x: centerX + Math.cos(angle + clusterOffset) * radius,
        y: centerY + Math.sin(angle + clusterOffset) * radius,
      };
    });

    nodesRef.current = nodes;
    linksRef.current = graphData.links;

    // Boundary enforcement function
    const applyBoundaries = () => {
      const margin = 30;
      const maxX = rect.width - margin;
      const maxY = rect.height - margin;

      nodesRef.current.forEach((node) => {
        const r = baseRadius(node);
        // Soft boundary constraint with damping
        if (node.x < margin + r) {
          node.x = margin + r;
          node.vx *= -0.5;
        } else if (node.x > maxX - r) {
          node.x = maxX - r;
          node.vx *= -0.5;
        }

        if (node.y < margin + r) {
          node.y = margin + r;
          node.vy *= -0.5;
        } else if (node.y > maxY - r) {
          node.y = maxY - r;
          node.vy *= -0.5;
        }
      });
    };

    // D3 simulation tuned for "less movement" with gentle idle motion
    const linkForce = forceLink<SkillNode, Link>(linksRef.current)
      .id((d) => d.id)
      .distance((l) => 140 - Math.min(40, l.weight * 10)) // slightly tighter when shared more
      .strength((l) => 0.03 + Math.min(0.05, l.weight * 0.015)); // subtle

    const sim = forceSimulation<SkillNode>(nodesRef.current)
      .alpha(0.3)
      .alphaDecay(0.02) // slower decay for gentle idle movement
      .alphaMin(0.005) // keep minimal energy for subtle animation
      .velocityDecay(0.4) // less damping for smoother movement
      .force("center", forceCenter(centerX, centerY))
      .force(
        "charge",
        forceManyBody<SkillNode>().strength(-40).distanceMax(220)
      )
      .force(
        "collide",
        forceCollide<SkillNode>()
          .radius((d) => baseRadius(d) + 10)
          .iterations(1)
      )
      .force("link", linkForce);

    simRef.current = sim;

    // Pointer “tension” (very gentle). Implemented manually in tick.
    const applyColorClustering = () => {
      const hovered = hoveredRef.current;
      if (!hovered) return;

      const { inside } = mouseRef.current;
      if (!inside) return;

      const hoveredPrimaryCard = hovered.cardIndices[0];
      const sameColorNodes = nodesRef.current.filter(
        (n) => n.cardIndices[0] === hoveredPrimaryCard
      );

      if (sameColorNodes.length <= 1) return;

      // Calculate centroid of same-color nodes
      let cx = 0,
        cy = 0;
      sameColorNodes.forEach((n) => {
        cx += n.x;
        cy += n.y;
      });
      cx /= sameColorNodes.length;
      cy /= sameColorNodes.length;

      // Pull same-color nodes toward their centroid
      const clusterStrength = 0.15;
      sameColorNodes.forEach((node) => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Apply gentle pull toward centroid
        if (dist > 5) {
          const pull = clusterStrength * (dist / 100);
          node.vx += (dx / dist) * pull;
          node.vy += (dy / dist) * pull;
        }
      });

      // Keep gentle energy while hovering for smooth clustering
      sim.alphaTarget(0.04);
    };

    // Render loop (throttled to rAF; sim ticks independently)
    let frameCount = 0;

    const draw = () => {
      const frameStart = performance.now();

      if (document.hidden) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Let simulation run a bit, but you can also step it manually if you want.
      // We keep it simple: d3 ticks; we draw on rAF.
      applyColorClustering();
      applyBoundaries();

      const r = container.getBoundingClientRect();
      const w = r.width;
      const h = r.height;

      ctx.clearRect(0, 0, w, h);

      const time = performance.now() * 0.001;

      // Draw links (only if close-ish, similar to your maxDist logic)
      const links = linksRef.current;
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        const a = l.source as SkillNode;
        const b = l.target as SkillNode;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 320;

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18 * Math.min(l.weight, 2);
          const color =
            EXPERIENCE_COLORS[l.primaryCard % EXPERIENCE_COLORS.length];

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsla(${color.hue}, ${color.sat}%, ${color.light}%, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw nodes
      const nodes = nodesRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isHovered = hoveredRef.current?.id === node.id;

        const color =
          EXPERIENCE_COLORS[
            (node.cardIndices[0] ?? 0) % EXPERIENCE_COLORS.length
          ];
        const br = baseRadius(node);
        const radius = isHovered ? br * 1.35 : br;

        // much smaller idle pulse (less motion)
        const pulse =
          Math.sin(time * 1.1 + (node.cardIndices[0] ?? 0)) * 0.08 + 1;

        // glow
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          radius * 2.4 * pulse
        );
        gradient.addColorStop(
          0,
          isHovered
            ? `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.45)`
            : `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.18)`
        );
        gradient.addColorStop(
          1,
          `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0)`
        );

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? `hsla(${color.hue}, ${color.sat}%, ${color.light + 10}%, 1)`
          : `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.82)`;
        ctx.fill();

        // border
        ctx.strokeStyle = isHovered
          ? `hsla(${color.hue}, ${color.sat}%, ${color.light + 20}%, 1)`
          : `hsla(${color.hue}, ${color.sat}%, ${color.light + 5}%, 0.6)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update label positions imperatively (no React re-render per tick)
      if (labelsLayerRef.current) {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const el = labelRefs.current.get(node.id);
          if (!el) continue;
          el.style.transform = `translate(${node.x}px, ${
            node.y - 32
          }px) translate(-50%, 0)`;
        }
      }

      // Maintain gentle idle movement even when not hovering
      if (!hoveredRef.current) sim.alphaTarget(0.003);

      // Performance report
      frameCount++;
      if (frameCount % 60 === 0) {
        reportPerformance("SkillsGraph", performance.now() - frameStart);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // Start sim & drawing
    sim.on("end", () => {
      // When sim ends, we keep drawing only if hovering; otherwise we can stop.
      // (We still keep the current code running; if you want ultra-low CPU,
      // you can cancel rAF here when not hovering.)
    });

    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      const rr = container.getBoundingClientRect();
      sim.force("center", forceCenter(rr.width / 2, rr.height / 2));
      sim.alpha(0.25).restart();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sim.stop();
      simRef.current = null;
    };
  }, [isVisible, graphData]);

  // Hover detection with throttling + “only update state if changed”
  const hoverRaf = useRef<number | null>(null);

  const pickNode = (x: number, y: number) => {
    const nodes = nodesRef.current;
    // For typical skill counts, O(n) is fine and cheaper than maintaining a quadtree.
    // If you have 200+ nodes, switch to d3-quadtree.
    let found: SkillNode | null = null;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < baseRadius(n) + 12) {
        found = n;
        break;
      }
    }
    return found;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y, inside: true };

    if (hoverRaf.current) return;
    hoverRaf.current = requestAnimationFrame(() => {
      hoverRaf.current = null;

      const found = pickNode(x, y);

      // Update refs first (used by draw loop)
      hoveredRef.current = found;

      // Update React state only if changed (prevents spam re-renders)
      setHoveredSkill((prev) => {
        if (prev?.id === found?.id) return prev;
        return found;
      });

      // Give a small kick when hover changes (for clustering)
      if (found && simRef.current) {
        simRef.current.alpha(0.15).restart();
      }
    });
  };

  const handleMouseLeave = () => {
    mouseRef.current.inside = false;
    hoveredRef.current = null;
    setHoveredSkill(null);
    if (simRef.current) simRef.current.alphaTarget(0.003);
  };

  const handleClick = () => {
    const h = hoveredRef.current;
    if (h && h.cardIndices.length > 0) {
      onSkillClick(h.cardIndices[0]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-96 rounded-2xl overflow-hidden transition-all duration-700 ${
        hoveredSkill ? "cursor-pointer" : "cursor-default"
      } ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        background:
          "linear-gradient(135deg, hsla(185, 50%, 55%, 0.02) 0%, hsla(220, 20%, 4%, 0.08) 50%, hsla(185, 50%, 55%, 0.01) 100%)",
        backdropFilter: "blur(12px)",
        border: "1px solid hsla(185, 50%, 55%, 0.1)",
        boxShadow:
          "0 8px 32px hsla(0, 0%, 0%, 0.1), 0 0 40px hsla(185, 50%, 55%, 0.05)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Labels layer (imperative positioning; no per-frame React map over positions) */}
      <div
        ref={labelsLayerRef}
        className="absolute inset-0 pointer-events-none"
      >
        {
          nodesRef.current.length > 0
            ? null
            : null /* nodesRef is filled after mount; labels are created below from graphData */
        }
        {graphData.nodes.map((node) => {
          const primaryCard = node.cardIndices[0] ?? 0;
          const color =
            EXPERIENCE_COLORS[primaryCard % EXPERIENCE_COLORS.length];

          return (
            <div
              key={node.id}
              ref={(el) => {
                if (!el) return;
                labelRefs.current.set(node.id, el);
              }}
              className="absolute transition-opacity duration-200 opacity-80"
              style={{
                left: 0,
                top: 0,
                transform: "translate(-9999px, -9999px)",
              }}
            >
              <span
                className="font-body text-sm font-medium whitespace-nowrap"
                style={{
                  color: `hsl(${color.hue}, ${color.sat}%, ${
                    color.light + 5
                  }%)`,
                  textShadow: "0 2px 4px hsla(0, 0%, 0%, 0.6)",
                }}
              >
                {node.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip (same behavior) */}
      {hoveredSkill && (
        <div
          className="absolute z-10 px-3 py-2 rounded-lg pointer-events-none"
          style={{
            left: mouseRef.current.x + 15,
            top: mouseRef.current.y - 10,
            background: "hsla(220, 20%, 8%, 0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid hsla(185, 50%, 55%, 0.2)",
          }}
        >
          <p className="font-body text-xs text-foreground font-medium mb-1">
            {hoveredSkill.name}
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Used in:{" "}
            {hoveredSkill.cardIndices
              .map((i) => experiences[i]?.company)
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="font-body text-[10px] text-primary/60 mt-1">
            Click to view
          </p>
        </div>
      )}
    </div>
  );
};
