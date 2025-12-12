import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  life: number;
  maxLife: number;
  spawning: boolean;
}

export const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const isInAboutSectionRef = useRef(false);

  const createParticle = useCallback(
    (width: number, height: number, spawning = true): Particle => {
      const baseOpacity = Math.random() * 0.5 + 0.2;
      const maxLife = Math.random() * 400 + 200;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
        opacity: spawning ? 0 : baseOpacity,
        baseOpacity,
        life: spawning ? 0 : Math.random() * maxLife,
        maxLife,
        spawning,
      };
    },
    []
  );

  const createParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      const count = Math.floor((width * height) / 12000);

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(width, height, false));
      }
      return particles;
    },
    [createParticle]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = createParticles(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Observe the experience section to disable mouse effect when scrolled to it
    const experienceSection = document.querySelector(
      'section[class*="min-h-screen"]'
    );
    let observer: IntersectionObserver | null = null;

    if (experienceSection) {
      observer = new IntersectionObserver(
        ([entry]) => {
          // Enable mouse attraction when experience section is NOT visible
          isInAboutSectionRef.current = !(
            entry.isIntersecting && entry.intersectionRatio > 0.3
          );
        },
        { threshold: [0, 0.3, 1] }
      );

      observer.observe(experienceSection);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!ctx || !canvas) return;
      frameCountRef.current++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles periodically
      if (
        frameCountRef.current % 20 === 0 &&
        particlesRef.current.length < 200
      ) {
        particlesRef.current.push(
          createParticle(canvas.width, canvas.height, true)
        );
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        // Check mouse distance for attraction influence
        const mouseDx = mouseRef.current.x - particle.x;
        const mouseDy = mouseRef.current.y - particle.y;
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        const maxMouseDistance = 250;
        const nearMouse = mouseDistance < maxMouseDistance;

        // Check if particle has connections (is part of a constellation)
        let connectionCount = 0;
        particlesRef.current.forEach((other) => {
          if (other !== particle) {
            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
              connectionCount++;
            }
          }
        });

        // Life cycle - connected particles and particles near mouse age slower
        let ageRate = 1;
        if (connectionCount >= 2) ageRate *= 0.5;
        if (nearMouse) ageRate *= 0.3;
        particle.life += ageRate;

        // Spawning fade in
        if (particle.spawning && particle.opacity < particle.baseOpacity) {
          particle.opacity += 0.02;
          if (particle.opacity >= particle.baseOpacity) {
            particle.spawning = false;
          }
        }

        // Fade out when nearing end of life
        const lifeRatio = particle.life / particle.maxLife;
        if (lifeRatio > 0.8) {
          particle.opacity =
            particle.baseOpacity * (1 - (lifeRatio - 0.8) / 0.2);
        }

        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          return false;
        }

        // Mouse influence - only if enabled (not in experience section)
        if (!isInAboutSectionRef.current) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 250;

          if (distance < maxDistance && !particle.spawning) {
            const force = (1 - distance / maxDistance) * 0.03;
            particle.vx += dx * force * 0.01;
            particle.vy += dy * force * 0.01;
            particle.opacity = Math.min(
              particle.baseOpacity + (1 - distance / maxDistance) * 0.4,
              1
            );
          }
        }

        // Idle movement - slight pulsing
        const pulse =
          Math.sin(frameCountRef.current * 0.02 + particle.x * 0.01) * 0.1;
        particle.vx += pulse * 0.002;
        particle.vy +=
          Math.cos(frameCountRef.current * 0.015 + particle.y * 0.01) * 0.002;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3
        );
        gradient.addColorStop(0, `hsla(185, 50%, 65%, ${particle.opacity})`);
        gradient.addColorStop(
          0.4,
          `hsla(185, 45%, 60%, ${particle.opacity * 0.5})`
        );
        gradient.addColorStop(1, `hsla(185, 40%, 55%, 0)`);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core of particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(185, 50%, 70%, ${particle.opacity})`;
        ctx.fill();

        return true;
      });

      // Draw connections
      particlesRef.current.forEach((p1, i) => {
        particlesRef.current.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const opacity =
              0.2 * (1 - distance / 120) * Math.min(p1.opacity, p2.opacity);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(185, 45%, 65%, ${opacity})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (observer) {
        observer.disconnect();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticles, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};
