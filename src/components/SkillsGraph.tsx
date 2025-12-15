import { useEffect, useRef, useState, useMemo } from "react";
import { reportPerformance } from "./PerformanceOverlay";

interface SkillNode {
  id: string;
  name: string;
  cardIndices: number[]; // Which experience cards use this skill
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SkillsGraphProps {
  experiences: Array<{ tags: string[]; company: string }>;
  onSkillClick: (cardIndex: number) => void;
}

// Color palette for different experiences
const EXPERIENCE_COLORS = [
  { hue: 185, sat: 50, light: 55 }, // Cyan (default)
  { hue: 280, sat: 60, light: 60 }, // Purple
  { hue: 30, sat: 70, light: 60 }, // Orange
  { hue: 140, sat: 50, light: 55 }, // Green
  { hue: 350, sat: 65, light: 60 }, // Pink
  { hue: 210, sat: 55, light: 60 }, // Blue
  { hue: 50, sat: 70, light: 65 }, // Yellow
  { hue: 320, sat: 60, light: 60 }, // Magenta
];

export const SkillsGraph = ({
  experiences,
  onSkillClick,
}: SkillsGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const nodesRef = useRef<SkillNode[]>([]);
  const animationRef = useRef<number>();

  // Extract unique skills with their card associations
  const skillsData = useMemo(() => {
    const skillMap = new Map<string, number[]>();

    experiences.forEach((exp, cardIndex) => {
      exp.tags.forEach((tag) => {
        const existing = skillMap.get(tag) || [];
        if (!existing.includes(cardIndex)) {
          existing.push(cardIndex);
        }
        skillMap.set(tag, existing);
      });
    });

    return Array.from(skillMap.entries()).map(([name, cardIndices]) => ({
      name,
      cardIndices,
    }));
  }, [experiences]);

  // Initialize nodes with positions
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.4;

    nodesRef.current = skillsData.map((skill, i) => {
      const angle = (i / skillsData.length) * Math.PI * 2;
      const clusterOffset = skill.cardIndices[0] * 0.2;
      const spreadRadius = radius * (0.8 + Math.random() * 0.4); // More spread out

      return {
        id: skill.name,
        name: skill.name,
        cardIndices: skill.cardIndices,
        x: centerX + Math.cos(angle + clusterOffset) * spreadRadius,
        y: centerY + Math.sin(angle + clusterOffset) * spreadRadius,
        vx: 0,
        vy: 0,
      };
    });
  }, [skillsData]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isVisible || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    // Lower DPR for performance (canvas animation is heavy)
    // @ts-expect-error - experimental API
    const deviceMemory = navigator.deviceMemory;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      deviceMemory && deviceMemory < 4 ? 1 : 1.5
    );
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    let frameCount = 0;

    const animate = () => {
      const frameStart = performance.now();

      // Pause when page is hidden
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const nodes = nodesRef.current;
      const time = Date.now() * 0.001;

      // Apply forces to keep nodes separated and readable
      nodes.forEach((nodeA, i) => {
        // Reset velocities
        nodeA.vx = 0;
        nodeA.vy = 0;

        // Repulsion from other nodes - keep them apart (only check forward)
        nodes.slice(i + 1).forEach((nodeB) => {
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distSq = dx * dx + dy * dy;
          const minDistance = 100;
          const minDistSq = minDistance * minDistance;

          if (distSq < minDistSq && distSq > 0) {
            const distance = Math.sqrt(distSq);
            const force = (minDistance - distance) / minDistance;
            const fx = (dx / distance) * force * 2;
            const fy = (dy / distance) * force * 2;
            nodeA.vx += fx;
            nodeA.vy += fy;
            nodeB.vx -= fx;
            nodeB.vy -= fy;
          }
        });

        // Very gentle attraction to center to keep graph centered
        const toCenterX = centerX - nodeA.x;
        const toCenterY = centerY - nodeA.y;
        const distToCenter = Math.hypot(toCenterX, toCenterY);
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;

        if (distToCenter > maxRadius) {
          nodeA.vx += (toCenterX / distToCenter) * 0.5;
          nodeA.vy += (toCenterY / distToCenter) * 0.5;
        }

        // Apply velocities with damping
        nodeA.x += nodeA.vx * 0.3;
        nodeA.y += nodeA.vy * 0.3;

        // Add very subtle idle movement (slower)
        nodeA.x += Math.sin(time * 0.2 + nodeA.cardIndices[0]) * 0.08;
        nodeA.y += Math.cos(time * 0.15 + nodeA.cardIndices[0]) * 0.08;

        // Boundary constraints
        const margin = 80;
        if (nodeA.x < margin) nodeA.x = margin;
        if (nodeA.x > canvas.width - margin) nodeA.x = canvas.width - margin;
        if (nodeA.y < margin) nodeA.y = margin;
        if (nodeA.y > canvas.height - margin) nodeA.y = canvas.height - margin;
      });

      // Draw connections between skills used in the same card
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach((nodeB) => {
          const sharedCards = nodeA.cardIndices.filter((c) =>
            nodeB.cardIndices.includes(c)
          );
          if (sharedCards.length > 0) {
            const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
            const maxDist = 300;
            if (distance < maxDist) {
              const alpha =
                (1 - distance / maxDist) *
                0.2 *
                Math.min(sharedCards.length, 2);

              // Use color of the shared experience
              const primaryCard = sharedCards[0];
              const color =
                EXPERIENCE_COLORS[primaryCard % EXPERIENCE_COLORS.length];

              ctx.beginPath();
              ctx.moveTo(nodeA.x, nodeA.y);
              ctx.lineTo(nodeB.x, nodeB.y);
              ctx.strokeStyle = `hsla(${color.hue}, ${color.sat}%, ${color.light}%, ${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const isHovered = hoveredSkill?.id === node.id;
        const baseRadius = 10 + node.cardIndices.length * 3; // Larger nodes
        const radius = isHovered ? baseRadius * 1.4 : baseRadius;
        const pulse = Math.sin(time * 1.5 + node.cardIndices[0]) * 0.15 + 1;

        // Get color based on primary experience
        const primaryCard = node.cardIndices[0];
        const color = EXPERIENCE_COLORS[primaryCard % EXPERIENCE_COLORS.length];

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          radius * 2.5 * pulse
        );
        gradient.addColorStop(
          0,
          isHovered
            ? `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.5)`
            : `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.2)`
        );
        gradient.addColorStop(
          1,
          `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0)`
        );

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? `hsla(${color.hue}, ${color.sat}%, ${color.light + 10}%, 1)`
          : `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.8)`;
        ctx.fill();

        // Border
        ctx.strokeStyle = isHovered
          ? `hsla(${color.hue}, ${color.sat}%, ${color.light + 20}%, 1)`
          : `hsla(${color.hue}, ${color.sat}%, ${color.light + 5}%, 0.6)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Report performance every 60 frames
      frameCount++;
      if (frameCount % 60 === 0) {
        const duration = performance.now() - frameStart;
        reportPerformance("SkillsGraph", duration);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, hoveredSkill]);

  // Handle mouse move for hover detection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const nodes = nodesRef.current;
    let found: SkillNode | null = null;

    for (const node of nodes) {
      const distance = Math.hypot(node.x - x, node.y - y);
      const baseRadius = 10 + node.cardIndices.length * 3;
      if (distance < baseRadius + 10) {
        // Larger hit area
        found = node;
        break;
      }
    }

    setHoveredSkill(found);
  };

  const handleClick = () => {
    if (hoveredSkill && hoveredSkill.cardIndices.length > 0) {
      onSkillClick(hoveredSkill.cardIndices[0]);
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
      onMouseLeave={() => setHoveredSkill(null)}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Skill labels */}
      {isVisible &&
        nodesRef.current.map((node) => {
          const primaryCard = node.cardIndices[0];
          const color =
            EXPERIENCE_COLORS[primaryCard % EXPERIENCE_COLORS.length];
          const isHovered = hoveredSkill?.id === node.id;

          return (
            <div
              key={node.id}
              className={`absolute pointer-events-none transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-80"
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y - 32}px`,
                transform: "translate(-50%, 0)",
              }}
            >
              <span
                className="font-body text-sm font-medium whitespace-nowrap"
                style={{
                  color: `hsl(${color.hue}, ${color.sat}%, ${
                    isHovered ? color.light + 15 : color.light + 5
                  }%)`,
                  textShadow: isHovered
                    ? `0 0 10px hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.6), 0 2px 4px hsla(0, 0%, 0%, 0.8)`
                    : "0 2px 4px hsla(0, 0%, 0%, 0.6)",
                }}
              >
                {node.name}
              </span>
            </div>
          );
        })}

      {/* Tooltip */}
      {hoveredSkill && (
        <div
          className="absolute z-10 px-3 py-2 rounded-lg pointer-events-none"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y - 10,
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
              .join(", ")}
          </p>
          <p className="font-body text-[10px] text-primary/60 mt-1">
            Click to view
          </p>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-4 left-6">
        <h4 className="font-display text-lg text-foreground/80">
          Skills Network
        </h4>
        <p className="font-body text-xs text-muted-foreground/60">
          Click a skill to see related experience
        </p>
      </div>
    </div>
  );
};
