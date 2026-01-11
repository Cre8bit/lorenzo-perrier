import { useEffect, useRef, useMemo } from "react";

interface ConstellationMinimalProps {
  className?: string;
  dotCount?: number;
  region?: "full" | "corner" | "side";
}

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
};

export const ConstellationMinimal = ({
  className = "",
  dotCount = 40,
  region = "corner",
}: ConstellationMinimalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const glowSprite = useMemo(() => {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, "rgba(120, 200, 200, 0.6)");
    grad.addColorStop(0.4, "rgba(120, 200, 200, 0.2)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Initialize dots in region
      dotsRef.current = [];
      for (let i = 0; i < dotCount; i++) {
        let x = 0,
          y = 0;
        if (region === "corner") {
          // Bottom-right corner
          x = width * 0.5 + Math.random() * width * 0.5;
          y = height * 0.5 + Math.random() * height * 0.5;
        } else if (region === "side") {
          // Right side
          x = width * 0.6 + Math.random() * width * 0.4;
          y = Math.random() * height;
        } else {
          x = Math.random() * width;
          y = Math.random() * height;
        }
        dotsRef.current.push({
          x,
          y,
          vx: 0,
          vy: 0,
          targetX: x,
          targetY: y,
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const dots = dotsRef.current;
      const mouse = mouseRef.current;

      // Update and draw dots
      for (const dot of dots) {
        // Mouse repulsion
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          dot.vx += (dx / dist) * force * 0.5;
          dot.vy += (dy / dist) * force * 0.5;
        }

        // Return to target
        dot.vx += (dot.targetX - dot.x) * 0.01;
        dot.vy += (dot.targetY - dot.y) * 0.01;

        // Damping
        dot.vx *= 0.92;
        dot.vy *= 0.92;

        dot.x += dot.vx;
        dot.y += dot.vy;
      }

      // Draw connections
      ctx.strokeStyle = "rgba(120, 200, 200, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.globalAlpha = (1 - dist / 100) * 0.5;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      ctx.globalAlpha = 1;
      for (const dot of dots) {
        ctx.drawImage(glowSprite, dot.x - 8, dot.y - 8, 16, 16);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dotCount, region, glowSprite]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.6 }}
    />
  );
};
