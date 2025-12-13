import { useEffect, useRef, useState, useMemo } from "react";

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

export const SkillsGraph = ({ experiences, onSkillClick }: SkillsGraphProps) => {
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
    const radius = Math.min(rect.width, rect.height) * 0.35;

    nodesRef.current = skillsData.map((skill, i) => {
      const angle = (i / skillsData.length) * Math.PI * 2;
      const clusterOffset = skill.cardIndices[0] * 0.3; // Cluster by first card
      
      return {
        id: skill.name,
        name: skill.name,
        cardIndices: skill.cardIndices,
        x: centerX + Math.cos(angle + clusterOffset) * radius * (0.6 + Math.random() * 0.4),
        y: centerY + Math.sin(angle + clusterOffset) * radius * (0.6 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
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
    canvas.width = rect.width;
    canvas.height = rect.height;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const time = Date.now() * 0.001;

      // Update node positions with gentle idle movement
      nodes.forEach((node) => {
        // Add gentle oscillation
        node.x += Math.sin(time + node.cardIndices[0]) * 0.15;
        node.y += Math.cos(time * 0.7 + node.cardIndices[0]) * 0.15;

        // Boundary constraints with soft bounce
        const margin = 60;
        if (node.x < margin) node.x = margin;
        if (node.x > canvas.width - margin) node.x = canvas.width - margin;
        if (node.y < margin) node.y = margin;
        if (node.y > canvas.height - margin) node.y = canvas.height - margin;

        // Gentle attraction to center
        node.x += (centerX - node.x) * 0.001;
        node.y += (centerY - node.y) * 0.001;
      });

      // Draw connections between skills used in the same card
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach((nodeB) => {
          const sharedCards = nodeA.cardIndices.filter((c) =>
            nodeB.cardIndices.includes(c)
          );
          if (sharedCards.length > 0) {
            const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
            const maxDist = 200;
            if (distance < maxDist) {
              const alpha = ((1 - distance / maxDist) * 0.3 * sharedCards.length);
              
              ctx.beginPath();
              ctx.moveTo(nodeA.x, nodeA.y);
              ctx.lineTo(nodeB.x, nodeB.y);
              ctx.strokeStyle = `hsla(185, 50%, 55%, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      // Draw nodes
      nodes.forEach((node) => {
        const isHovered = hoveredSkill?.id === node.id;
        const baseRadius = 6 + node.cardIndices.length * 2;
        const radius = isHovered ? baseRadius * 1.5 : baseRadius;
        const pulse = Math.sin(time * 2 + node.cardIndices[0]) * 0.2 + 1;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 3 * pulse
        );
        gradient.addColorStop(0, isHovered ? "hsla(185, 50%, 55%, 0.4)" : "hsla(185, 50%, 55%, 0.15)");
        gradient.addColorStop(1, "hsla(185, 50%, 55%, 0)");
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "hsla(185, 50%, 65%, 0.9)" : "hsla(185, 50%, 55%, 0.6)";
        ctx.fill();
        
        // Border
        ctx.strokeStyle = isHovered ? "hsla(185, 50%, 70%, 0.8)" : "hsla(185, 50%, 55%, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

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
      if (distance < 20) {
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
      className={`relative w-full h-80 rounded-2xl overflow-hidden transition-all duration-700 cursor-pointer ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "linear-gradient(135deg, hsla(185, 50%, 55%, 0.02) 0%, hsla(220, 20%, 4%, 0.08) 50%, hsla(185, 50%, 55%, 0.01) 100%)",
        backdropFilter: "blur(12px)",
        border: "1px solid hsla(185, 50%, 55%, 0.1)",
        boxShadow: "0 8px 32px hsla(0, 0%, 0%, 0.1), 0 0 40px hsla(185, 50%, 55%, 0.05)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredSkill(null)}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Skill labels */}
      {isVisible && nodesRef.current.map((node) => (
        <div
          key={node.id}
          className={`absolute pointer-events-none transition-all duration-300 ${
            hoveredSkill?.id === node.id ? "opacity-100 scale-110" : "opacity-60"
          }`}
          style={{
            left: node.x,
            top: node.y - 25,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-body text-xs text-primary/80 whitespace-nowrap">
            {node.name}
          </span>
        </div>
      ))}

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
            Used in: {hoveredSkill.cardIndices.map(i => experiences[i]?.company).join(", ")}
          </p>
          <p className="font-body text-[10px] text-primary/60 mt-1">
            Click to view
          </p>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-4 left-6">
        <h4 className="font-display text-lg text-foreground/80">Skills Network</h4>
        <p className="font-body text-xs text-muted-foreground/60">Click a skill to see related experience</p>
      </div>
    </div>
  );
};