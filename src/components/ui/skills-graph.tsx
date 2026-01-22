import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  Simulation,
} from "d3-force";
import { reportPerformance } from "./performance-overlay";

interface SkillNode {
  id: string;
  name: string;
  cardIndices: number[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree?: number;
  importance?: number;
  primaryCard?: number;
  labelX?: number;
  labelY?: number;
  hoverProgress?: number; // 0-1 for smooth transitions
}

interface Link {
  source: string | SkillNode;
  target: string | SkillNode;
  weight: number;
  sameCluster?: boolean; // Track if link is within same cluster
}

interface SkillsGraphProps {
  experiences: Array<{ tags: string[]; company: string }>;
  onSkillClick: (cardIndex: number) => void;
}

// Glassmorphic color palette - softer, more elegant
const EXPERIENCE_COLORS = [
  { hue: 200, sat: 65, light: 65 }, // Soft cyan
  { hue: 280, sat: 55, light: 70 }, // Soft purple
  { hue: 160, sat: 60, light: 60 }, // Soft teal
  { hue: 340, sat: 60, light: 70 }, // Soft pink
  { hue: 45, sat: 65, light: 65 }, // Soft gold
  { hue: 260, sat: 50, light: 68 }, // Soft violet
  { hue: 180, sat: 58, light: 62 }, // Soft aqua
  { hue: 20, sat: 62, light: 68 }, // Soft coral
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function baseRadius(n: SkillNode) {
  const baseSize = 8;
  const sizePerCard = 2.5;
  return baseSize + n.cardIndices.length * sizePerCard;
}

// Floating particles in background
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function createParticles(count: number, w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }
  return particles;
}

// Helper to blend colors for multi-experience nodes
function blendColors(indices: number[]): {
  hue: number;
  sat: number;
  light: number;
} {
  if (indices.length === 1) {
    return EXPERIENCE_COLORS[indices[0] % EXPERIENCE_COLORS.length];
  }

  let totalH = 0,
    totalS = 0,
    totalL = 0;
  const colors = indices
    .slice(0, 3)
    .map((i) => EXPERIENCE_COLORS[i % EXPERIENCE_COLORS.length]);

  colors.forEach((c) => {
    totalH += c.hue;
    totalS += c.sat;
    totalL += c.light;
  });

  return {
    hue: totalH / colors.length,
    sat: totalS / colors.length,
    light: totalL / colors.length,
  };
}

// Resolve label overlaps
function resolveLabels(nodes: SkillNode[], w: number, h: number) {
  const padding = 8;
  const labelHeight = 28;

  nodes.forEach((n) => {
    const baseR = baseRadius(n);
    n.labelX = n.x;
    n.labelY = n.y - baseR - 18;
  });

  // Simple iterative collision resolution
  for (let iter = 0; iter < 6; iter++) {
    let hasOverlap = false;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (!a.labelX || !a.labelY) continue;

      const aWidth = a.name.length * 6.5 + 20; // Approximate label width

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (!b.labelX || !b.labelY) continue;

        const bWidth = b.name.length * 6.5 + 20;

        const dx = b.labelX - a.labelX;
        const dy = b.labelY - a.labelY;
        const dist = Math.hypot(dx, dy);
        const minDist = Math.max(aWidth, bWidth) / 2 + padding;

        if (dist < minDist && dist > 0) {
          hasOverlap = true;
          const overlap = minDist - dist;
          const angle = Math.atan2(dy, dx);

          a.labelX -= Math.cos(angle) * overlap * 0.5;
          a.labelY -= Math.sin(angle) * overlap * 0.5;
          b.labelX += Math.cos(angle) * overlap * 0.5;
          b.labelY += Math.sin(angle) * overlap * 0.5;
        }
      }
    }

    if (!hasOverlap) break;
  }

  // Clamp to bounds
  nodes.forEach((n) => {
    if (!n.labelX || !n.labelY) return;
    const margin = 40;
    n.labelX = Math.max(margin, Math.min(w - margin, n.labelX));
    n.labelY = Math.max(margin, Math.min(h - margin, n.labelY));
  });
}

function updateParticles(particles: Particle[], w: number, h: number) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;
  }
}

export const SkillsGraph = ({
  experiences,
  onSkillClick,
}: SkillsGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<string, HTMLDivElement>());
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipSizeRef = useRef({ w: 260, h: 140 });

  const simRef = useRef<Simulation<SkillNode, Link> | null>(null);
  const nodesRef = useRef<SkillNode[]>([]);
  const linksRef = useRef<Link[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const wantsAnimationRef = useRef(false);
  const lastFrameTimesRef = useRef<number[]>([]);

  const [isVisible, setIsVisible] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);

  const hoveredRef = useRef<SkillNode | null>(null);
  const lastHoverIdRef = useRef<string | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, inside: false });

  // ------------- build nodes/links -------------
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

  const graphData = useMemo(() => {
    const nodes: SkillNode[] = skillsData.map((s) => ({
      id: s.name,
      name: s.name,
      cardIndices: s.cardIndices,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      primaryCard: s.cardIndices[0] ?? 0,
    }));

    const skillsByCard = new Map<number, string[]>();
    experiences.forEach((exp, cardIndex) =>
      skillsByCard.set(cardIndex, exp.tags),
    );

    const linkMap = new Map<string, { weight: number; sameCluster: boolean }>();
    for (const [cardIndex, tags] of skillsByCard.entries()) {
      const unique = Array.from(new Set(tags));
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const a = unique[i];
          const b = unique[j];
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;

          // Get primary card indices for both nodes to track same-cluster links
          const nodeA = skillsData.find((s) => s.name === a);
          const nodeB = skillsData.find((s) => s.name === b);
          const primaryA = nodeA?.cardIndices[0];
          const primaryB = nodeB?.cardIndices[0];
          const sameCluster = primaryA === primaryB;

          const prev = linkMap.get(key);
          if (!prev) {
            linkMap.set(key, { weight: 1, sameCluster });
          } else {
            linkMap.set(key, {
              weight: prev.weight + 1,
              sameCluster: prev.sameCluster || sameCluster,
            });
          }
        }
      }
    }

    const links: Link[] = Array.from(linkMap.entries()).map(([key, v]) => {
      const [a, b] = key.split("|");
      return {
        source: a,
        target: b,
        weight: v.weight,
        sameCluster: v.sameCluster,
      };
    });

    // degree + importance
    const degree = new Map<string, number>();
    for (const l of links) {
      degree.set(l.source as string, (degree.get(l.source as string) ?? 0) + 1);
      degree.set(l.target as string, (degree.get(l.target as string) ?? 0) + 1);
    }

    let maxDeg = 1;
    nodes.forEach((n) => {
      n.degree = degree.get(n.id) ?? 0;
      maxDeg = Math.max(maxDeg, n.degree);
    });

    nodes.forEach((n) => {
      const degN = (n.degree ?? 0) / maxDeg;
      const multi = clamp01((n.cardIndices.length - 1) / 3);
      n.importance = clamp01(degN * 0.75 + multi * 0.25);
    });

    return { nodes, links };
  }, [skillsData, experiences]);

  // ------------- intersection observer -------------
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.2 },
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ------------- animation loop  -------------
  const startAnimation = () => {
    wantsAnimationRef.current = true;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(frame);
  };

  const stopAnimationIfIdle = () => {
    const sim = simRef.current;
    const hovering = !!hoveredRef.current;
    const inside = mouseRef.current.inside;

    const simHot = sim ? sim.alpha() > 0.03 : false;
    if (!hovering && !inside && !simHot) {
      wantsAnimationRef.current = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  };

  const frame = () => {
    rafRef.current = null;

    if (document.hidden) {
      if (wantsAnimationRef.current) {
        rafRef.current = requestAnimationFrame(frame);
      }
      return;
    }

    const t0 = performance.now();
    drawFrame();
    const dt = performance.now() - t0;

    const arr = lastFrameTimesRef.current;
    arr.push(dt);
    if (arr.length > 60) arr.shift();

    if (arr.length === 60) {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      reportPerformance("SkillsGraph", avg);
    } else {
      reportPerformance("SkillsGraph", dt);
    }

    if (wantsAnimationRef.current) {
      rafRef.current = requestAnimationFrame(frame);
    } else {
      stopAnimationIfIdle();
    }
  };

  // ------------- draw -------------
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = dimsRef.current;
    ctx.clearRect(0, 0, w, h);

    const hovered = hoveredRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const particles = particlesRef.current;

    // Update hover progress for smooth transitions
    nodes.forEach((n) => {
      const target = hovered?.id === n.id ? 1 : 0;
      const current = n.hoverProgress ?? 0;
      n.hoverProgress = lerp(current, target, 0.15);
    });

    // Update and draw particles (reduced for performance)
    updateParticles(particles, w, h);

    ctx.save();
    for (const p of particles) {
      ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Build connected set
    let connected: Set<string> | null = null;
    if (hovered) {
      connected = new Set<string>();
      connected.add(hovered.id);
      for (const l of links) {
        const a = (l.source as SkillNode).id;
        const b = (l.target as SkillNode).id;
        if (a === hovered.id) connected.add(b);
        else if (b === hovered.id) connected.add(a);
      }
    }

    // Draw links with glassmorphic style
    ctx.save();
    for (const l of links) {
      const a = l.source as SkillNode;
      const b = l.target as SkillNode;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 250) continue;

      const isConnected =
        connected && connected.has(a.id) && connected.has(b.id);

      // Make same-cluster links much more subtle
      const isSameCluster = l.sameCluster ?? false;
      const baseAlpha = isSameCluster
        ? lerp(0.03, 0.08, 1 - dist / 250) // Much lighter for same-cluster
        : lerp(0.08, 0.18, 1 - dist / 250); // Normal for cross-cluster

      const alpha = hovered ? (isConnected ? 0.35 : 0.04) : baseAlpha;

      // Subtle gradient along link
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, `rgba(200, 220, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(180, 210, 255, ${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(200, 220, 255, ${alpha})`);

      ctx.strokeStyle = grad;
      // Same-cluster links are thinner
      ctx.lineWidth = isConnected ? 2 : isSameCluster ? 0.5 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    // Resolve label positions
    resolveLabels(nodes, w, h);

    // Draw nodes with glassmorphic style
    for (const n of nodes) {
      const isHovered = hovered?.id === n.id;
      const isConnected = !hovered || (connected?.has(n.id) ?? false);
      const imp = n.importance ?? 0;
      const hoverProg = n.hoverProgress ?? 0;

      const baseR = baseRadius(n);
      const r = baseR * (1 + hoverProg * 0.3); // Smooth size transition

      const baseOpacity = lerp(0.4, 0.9, imp);
      const opacity = hovered ? (isConnected ? 0.95 : 0.2) : baseOpacity;

      // Use blended color for multi-experience nodes
      const color = blendColors(n.cardIndices);

      // Outer glow
      if (hoverProg > 0.1 || imp > 0.6) {
        const glowR = r * lerp(2.2, 2.8, hoverProg);
        const glowAlpha = lerp(0.15, 0.3, hoverProg);

        const glow = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, glowR);
        glow.addColorStop(
          0,
          `hsla(${color.hue}, ${color.sat}%, ${color.light}%, ${glowAlpha * opacity})`,
        );
        glow.addColorStop(
          1,
          `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0)`,
        );

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glass node body with multi-color support
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

      if (n.cardIndices.length > 1) {
        // Create gradient blend for multi-experience nodes
        const colors = n.cardIndices
          .slice(0, 3)
          .map((i) => EXPERIENCE_COLORS[i % EXPERIENCE_COLORS.length]);
        const angle = Math.PI * 0.75;
        const nodeGrad = ctx.createLinearGradient(
          n.x - Math.cos(angle) * r,
          n.y - Math.sin(angle) * r,
          n.x + Math.cos(angle) * r,
          n.y + Math.sin(angle) * r,
        );

        colors.forEach((c, i) => {
          const pos = i / (colors.length - 1 || 1);
          nodeGrad.addColorStop(
            pos,
            `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${opacity * 0.8})`,
          );
        });

        ctx.fillStyle = nodeGrad;
      } else {
        // Single color gradient
        const nodeGrad = ctx.createRadialGradient(
          n.x - r * 0.3,
          n.y - r * 0.3,
          r * 0.1,
          n.x,
          n.y,
          r,
        );
        nodeGrad.addColorStop(
          0,
          `hsla(${color.hue}, ${color.sat}%, ${Math.min(85, color.light + 15)}%, ${opacity * 0.9})`,
        );
        nodeGrad.addColorStop(
          1,
          `hsla(${color.hue}, ${color.sat}%, ${color.light}%, ${opacity * 0.7})`,
        );

        ctx.fillStyle = nodeGrad;
      }

      ctx.fill();

      // Glass border
      ctx.strokeStyle = `hsla(${color.hue}, ${color.sat}%, ${Math.min(95, color.light + 20)}%, ${opacity * 0.8})`;
      ctx.lineWidth = lerp(1.5, 2.5, hoverProg);
      ctx.stroke();

      // Shine effect (top-left highlight)
      const shineGrad = ctx.createRadialGradient(
        n.x - r * 0.4,
        n.y - r * 0.4,
        0,
        n.x - r * 0.4,
        n.y - r * 0.4,
        r * 0.7,
      );
      shineGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.4})`);
      shineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = shineGrad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Multi-experience indicator (subtle dots) - only for 2+ experiences
      if (n.cardIndices.length > 1) {
        const dotCount = Math.min(n.cardIndices.length, 5);
        const dotR = r * 0.15;
        const orbitR = r * 0.65;

        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
          const dx = Math.cos(angle) * orbitR;
          const dy = Math.sin(angle) * orbitR;

          const dotColor =
            EXPERIENCE_COLORS[n.cardIndices[i] % EXPERIENCE_COLORS.length];

          ctx.fillStyle = `hsla(${dotColor.hue}, ${dotColor.sat}%, ${dotColor.light}%, ${opacity * 0.8})`;
          ctx.beginPath();
          ctx.arc(n.x + dx, n.y + dy, dotR, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `hsla(${dotColor.hue}, ${dotColor.sat}%, ${Math.min(95, dotColor.light + 20)}%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Update labels with smooth positioning
    if (labelsLayerRef.current) {
      for (const n of nodes) {
        const el = labelRefs.current.get(n.id);
        if (!el) continue;

        const labelX = n.labelX ?? n.x;
        const labelY = n.labelY ?? n.y - baseRadius(n) - 18;

        // Add connection line from node to label if displaced
        const labelDist = Math.hypot(
          labelX - n.x,
          labelY - (n.y - baseRadius(n) - 18),
        );
        if (labelDist > 5) {
          ctx.save();
          ctx.strokeStyle = `rgba(200, 220, 255, 0.15)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - baseRadius(n));
          ctx.lineTo(labelX, labelY + 14);
          ctx.stroke();
          ctx.restore();
        }

        el.style.transform = `translate(${labelX}px, ${labelY}px) translate(-50%, 0)`;

        const imp = n.importance ?? 0;
        const showIdle = imp > 0.5;
        const show = hovered
          ? hovered.id === n.id || (connected?.has(n.id) ?? false)
          : showIdle;

        el.style.opacity = show ? "1" : "0";
        el.style.transform += ` scale(${show ? 1 : 0.9})`;

        // Highlight selected label
        if (hovered?.id === n.id) {
          el.style.zIndex = "10";
        } else {
          el.style.zIndex = "1";
        }
      }
    }
  };

  // ------------- simulation setup -------------
  useEffect(() => {
    if (!isVisible || !containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      dimsRef.current = { w: rect.width, h: rect.height, dpr };

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Create particles (reduced count for performance)
      const particleCount = Math.floor((rect.width * rect.height) / 12000);
      particlesRef.current = createParticles(
        particleCount,
        rect.width,
        rect.height,
      );

      startAnimation();
    };

    resize();

    const { w, h } = dimsRef.current;
    const cx = w / 2;
    const cy = h / 2;

    // Group nodes by primary card for initial clustering
    const nodesByPrimary = new Map<number, typeof graphData.nodes>();
    graphData.nodes.forEach((n) => {
      const primary = n.cardIndices[0] ?? 0;
      const existing = nodesByPrimary.get(primary) || [];
      existing.push(n);
      nodesByPrimary.set(primary, existing);
    });

    const nodes: SkillNode[] = [];
    const clusterCount = nodesByPrimary.size;
    let clusterIdx = 0;

    // Position each cluster in a larger circular arrangement
    for (const [primary, clusterNodes] of nodesByPrimary.entries()) {
      // Cluster center position - wider spread
      const clusterAngle = (clusterIdx / clusterCount) * Math.PI * 2;
      const clusterRadius = Math.min(w, h) * 0.35; // Wider cluster placement
      const clusterCx = cx + Math.cos(clusterAngle) * clusterRadius;
      const clusterCy = cy + Math.sin(clusterAngle) * clusterRadius;

      // Scatter nodes within cluster
      clusterNodes.forEach((n, i) => {
        const nodeAngle =
          (i / Math.max(1, clusterNodes.length)) * Math.PI * 2 +
          Math.random() * 0.4;
        const nodeRadius = 50 + Math.random() * 60; // Random scatter within cluster

        nodes.push({
          ...n,
          x: clusterCx + Math.cos(nodeAngle) * nodeRadius,
          y: clusterCy + Math.sin(nodeAngle) * nodeRadius,
        });
      });

      clusterIdx++;
    }

    nodesRef.current = nodes;
    linksRef.current = graphData.links;

    const applyBoundaries = () => {
      const { w, h } = dimsRef.current;
      const margin = 26;
      const maxX = w - margin;
      const maxY = h - margin;

      const ns = nodesRef.current;
      for (let i = 0; i < ns.length; i++) {
        const n = ns[i];
        const r = baseRadius(n);

        if (n.x < margin + r) {
          n.x = margin + r;
          n.vx *= -0.3;
        } else if (n.x > maxX - r) {
          n.x = maxX - r;
          n.vx *= -0.3;
        }

        if (n.y < margin + r) {
          n.y = margin + r;
          n.vy *= -0.3;
        } else if (n.y > maxY - r) {
          n.y = maxY - r;
          n.vy *= -0.3;
        }
      }
    };

    const linkForce = forceLink<SkillNode, Link>(linksRef.current)
      .id((d) => d.id)
      .distance(() => 100) // Reduced for tighter links now that clusters are pre-formed
      .strength(() => 0.25); // Reduced strength for looser connections

    const sim = forceSimulation<SkillNode>(nodesRef.current)
      .alpha(0.6) // Lower initial alpha since we start pre-clustered
      .alphaDecay(0.04) // Faster decay since less work needed
      .alphaMin(0.001)
      .velocityDecay(0.5) // Higher decay for quicker settling
      .force("center", forceCenter(cx, cy).strength(0.015)) // Very weak center force
      .force(
        "charge",
        forceManyBody<SkillNode>().strength(-180).distanceMax(300), // Reduced repulsion since pre-clustered
      )
      .force(
        "collide",
        forceCollide<SkillNode>()
          .radius((d) => baseRadius(d) + 20) // Slightly more collision space
          .iterations(2),
      )
      .force("link", linkForce)
      .force("cluster", () => {
        // Gentle cluster force to maintain grouping
        const alpha = sim.alpha();
        const strength = 0.03 * alpha; // Reduced since clusters are pre-formed

        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          const aColor = a.primaryCard ?? 0;

          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const bColor = b.primaryCard ?? 0;

            if (aColor === bColor) {
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.hypot(dx, dy) || 1;

              // Very gentle attraction to maintain clusters
              if (dist > 30 && dist < 180) {
                // Tighter range for cluster cohesion
                const force = strength * (1 - dist / 180);
                a.vx += (dx / dist) * force;
                a.vy += (dy / dist) * force;
                b.vx -= (dx / dist) * force;
                b.vy -= (dy / dist) * force;
              }
            }
          }
        }
      });

    linkForce.links(linksRef.current);
    simRef.current = sim;

    sim.on("tick", () => {
      applyBoundaries();

      const hovered = hoveredRef.current;
      if (hovered && mouseRef.current.inside) {
        const { x: mx, y: my } = mouseRef.current;
        const dx = mx - hovered.x;
        const dy = my - hovered.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Very subtle magnetic pull - barely noticeable
        const pull = 0.0003; // Much more subtle
        hovered.vx += (dx / dist) * pull;
        hovered.vy += (dy / dist) * pull;

        // Very gentle transition - no sudden movements
        sim.alphaTarget(0.01).velocityDecay(0.6);
      } else {
        // Smooth transition out of active state
        sim.alphaTarget(0).velocityDecay(0.5);
      }

      startAnimation();

      if (
        !hoveredRef.current &&
        !mouseRef.current.inside &&
        sim.alpha() < 0.03
      ) {
        sim.stop();
        stopAnimationIfIdle();
      }
    });

    startAnimation();

    const onResize = () => {
      resize();
      const { w, h } = dimsRef.current;
      const nx = w / 2;
      const ny = h / 2;

      sim.force("center", forceCenter(nx, ny));
      sim.alpha(0.3).restart();

      particlesRef.current = createParticles(Math.floor((w * h) / 12000), w, h);

      startAnimation();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      sim.stop();
      simRef.current = null;
    };
  }, [isVisible, graphData]);

  // ------------- hover picking with spatial optimization -------------
  const hoverRaf = useRef<number | null>(null);

  const pickNode = (x: number, y: number) => {
    const nodes = nodesRef.current;

    // Quick spatial check - only test nearby nodes
    let closest: SkillNode | null = null;
    let closestDist = Infinity;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const dx = n.x - x;
      const dy = n.y - y;
      const dist = Math.hypot(dx, dy);

      const r = baseRadius(n) + 12;
      if (dist < r && dist < closestDist) {
        closest = n;
        closestDist = dist;
      }
    }

    return closest;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y, inside: true };
    startAnimation();

    if (hoverRaf.current) return;
    hoverRaf.current = requestAnimationFrame(() => {
      hoverRaf.current = null;

      const found = pickNode(x, y);
      hoveredRef.current = found;

      const newId = found?.id ?? null;
      if (newId !== lastHoverIdRef.current) {
        lastHoverIdRef.current = newId;
        setHoveredSkill((prev) => (prev?.id === found?.id ? prev : found));

        const sim = simRef.current;
        // Very subtle alpha bump - prevents jiggling
        if (sim && sim.alpha() < 0.05) sim.alpha(0.05);
      }

      startAnimation();
    });
  };

  const handleMouseLeave = () => {
    mouseRef.current.inside = false;
    hoveredRef.current = null;
    lastHoverIdRef.current = null;
    setHoveredSkill(null);

    // Don't restart simulation on mouse leave - prevents jiggling
    // Just let it settle naturally with alphaTarget(0)
    startAnimation();

    stopAnimationIfIdle();
  };

  const handleClick = () => {
    const h = hoveredRef.current;
    if (h && h.cardIndices.length > 0) onSkillClick(h.cardIndices[0]);
  };

  // ------------- tooltip size measurement -------------
  useEffect(() => {
    if (!tooltipRef.current) return;
    const el = tooltipRef.current;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      tooltipSizeRef.current = { w: r.width, h: r.height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hoveredSkill]);

  // tooltip position clamped within container
  const tooltipStyle = useMemo(() => {
    if (!containerRef.current) return undefined;

    const { w: tw, h: th } = tooltipSizeRef.current;
    const pad = 10;

    const { w, h } = dimsRef.current;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    let left = mx + 12;
    let top = my + 12;

    if (left + tw + pad > w) left = mx - tw - 12;
    left = Math.max(pad, Math.min(w - tw - pad, left));

    if (top + th + pad > h) top = my - th - 12;
    if (top < pad) top = pad;

    return { left, top };
  }, [hoveredSkill]);

  return (
    <div className="relative w-full space-y-3">
      <p className="font-body text-xs text-muted-foreground/70 px-4">
        Interactive skill network –{" "}
        <span className="text-primary/80 font-medium">
          hover nodes to reveal skills and connections
        </span>
        , click to view details
      </p>

      <div
        ref={containerRef}
        className={`relative w-full h-96 rounded-2xl overflow-hidden transition-all duration-700 ${
          hoveredSkill ? "cursor-pointer" : "cursor-default"
        } ${isVisible ? "opacity-100" : "opacity-0"}`}
        style={{
          background:
            "linear-gradient(135deg, hsla(220, 25%, 8%, 0.4) 0%, hsla(220, 20%, 5%, 0.6) 100%)",
          backdropFilter: "blur(16px)",
          border: "1px solid hsla(200, 50%, 60%, 0.12)",
          boxShadow:
            "0 8px 32px hsla(0, 0%, 0%, 0.3), inset 0 1px 0 hsla(255, 255%, 255%, 0.05)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        <div
          ref={labelsLayerRef}
          className="absolute inset-0 pointer-events-none"
        >
          {graphData.nodes.map((node) => {
            const color = blendColors(node.cardIndices);

            return (
              <div
                key={node.id}
                ref={(el) => {
                  if (!el) return;
                  labelRefs.current.set(node.id, el);
                }}
                className="absolute transition-all duration-300 ease-out"
                style={{
                  left: 0,
                  top: 0,
                  transform: "translate(-9999px, -9999px)",
                  opacity: 0,
                  willChange: "transform, opacity",
                }}
              >
                <div
                  className="px-3 py-1.5 rounded-lg backdrop-blur-md"
                  style={{
                    background: `hsla(${color.hue}, ${color.sat}%, ${Math.min(20, color.light - 40)}%, 0.75)`,
                    border: `1.5px solid hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.4)`,
                    boxShadow: `
                      0 4px 16px hsla(0, 0%, 0%, 0.5),
                      0 0 20px hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.2),
                      inset 0 1px 0 hsla(255, 255%, 255%, 0.15)
                    `,
                  }}
                >
                  <span
                    className="font-body text-xs font-semibold whitespace-nowrap tracking-wide"
                    style={{
                      color: `hsl(${color.hue}, ${color.sat}%, ${Math.min(98, color.light + 28)}%)`,
                      textShadow: `
                        0 1px 4px hsla(0, 0%, 0%, 0.9),
                        0 0 12px hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.3)
                      `,
                    }}
                  >
                    {node.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {hoveredSkill && (
          <div
            ref={tooltipRef}
            className="absolute z-10 px-3 py-2 rounded-lg pointer-events-none animate-in fade-in duration-200"
            style={{
              left: tooltipStyle?.left ?? mouseRef.current.x + 15,
              top: tooltipStyle?.top ?? mouseRef.current.y - 10,
              background: "hsla(220, 25%, 10%, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid hsla(200, 60%, 65%, 0.2)",
              boxShadow:
                "0 4px 16px hsla(0, 0%, 0%, 0.3), inset 0 1px 0 hsla(255, 255%, 255%, 0.08)",
              maxWidth: 200,
            }}
          >
            <div className="font-body text-xs space-y-1">
              {hoveredSkill.cardIndices.map((cardIndex) => {
                const company = experiences[cardIndex]?.company;
                const color =
                  EXPERIENCE_COLORS[cardIndex % EXPERIENCE_COLORS.length];
                return company ? (
                  <div key={cardIndex} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`,
                        boxShadow: `0 0 4px hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.6)`,
                      }}
                    />
                    <span
                      className="text-[11px]"
                      style={{
                        color: `hsl(${color.hue}, ${color.sat}%, ${Math.min(90, color.light + 12)}%)`,
                      }}
                    >
                      {company}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
