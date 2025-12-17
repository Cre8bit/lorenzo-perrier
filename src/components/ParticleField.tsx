import { useEffect, useRef, useCallback } from "react";
import { reportPerformance } from "./PerformanceOverlay";

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number;
  densityFactor: number;
  skipConnectionFrames: number;
}

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

// Spatial grid for optimized neighbor lookups
class SpatialGrid {
  private cellSize: number;
  private width: number;
  private height: number;
  private cols: number;
  private rows: number;
  private grid: Map<number, Particle[]>;

  constructor(width: number, height: number, cellSize: number = 120) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = new Map();
  }

  private hash(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return row * this.cols + col;
  }

  clear() {
    this.grid.clear();
  }

  insert(particle: Particle) {
    const key = this.hash(particle.x, particle.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(particle);
  }

  getNearby(particle: Particle, radius: number): Particle[] {
    const nearby: Particle[] = [];
    const col = Math.floor(particle.x / this.cellSize);
    const row = Math.floor(particle.y / this.cellSize);
    const range = Math.ceil(radius / this.cellSize);

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const key = (row + dy) * this.cols + (col + dx);
        const cell = this.grid.get(key);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }
    return nearby;
  }
}

// Detect device capabilities
const getQualitySettings = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;

  // @ts-expect-error - navigator.deviceMemory is experimental but useful
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;

  const isLowPower = memory && memory < 4;
  const isSmallScreen = width < 768;
  const isHighDPI = pixelRatio > 2;

  return {
    densityFactor: isSmallScreen ? 0.5 : isLowPower ? 0.7 : 1,
    maxParticles: isLowPower ? 120 : isSmallScreen ? 150 : 200,
    connectionDistance: isLowPower ? 100 : 120,
    skipConnectionFrames: isLowPower || cores < 4 ? 2 : 1,
  };
};

// Allow external quality settings to be passed in
let externalQualitySettings: QualitySettings | null = null;

export const setParticleFieldQuality = (settings: QualitySettings) => {
  externalQualitySettings = settings;
};

export const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const frameCountRef = useRef(0);
  const isInAboutSectionRef = useRef(false);
  const spatialGridRef = useRef<SpatialGrid | null>(null);
  const qualityRef = useRef(getQualitySettings());

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
      const quality = qualityRef.current;
      const baseCount = Math.floor((width * height) / 12000);
      const count = Math.min(
        Math.floor(baseCount * quality.densityFactor),
        quality.maxParticles
      );

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
      // Use external settings if available, otherwise auto-detect
      qualityRef.current = externalQualitySettings || getQualitySettings();
      particlesRef.current = createParticles(canvas.width, canvas.height);
      const quality = qualityRef.current;
      spatialGridRef.current = new SpatialGrid(
        canvas.width,
        canvas.height,
        quality.connectionDistance
      );
    };

    // Throttle mousemove updates with rAF to avoid flooding with events
    let mouseScheduled = false;
    const handleMouseMove = (e: MouseEvent) => {
      const px = e.clientX;
      const py = e.clientY;
      if (mouseScheduled) {
        // store latest values; animate loop will pick them up
        mouseRef.current = { x: px, y: py };
        return;
      }
      mouseScheduled = true;
      mouseRef.current = { x: px, y: py };
      requestAnimationFrame(() => {
        mouseScheduled = false;
      });
    };

    // Observe the hero section to disable mouse effect when scrolled past it
    let observer: IntersectionObserver | null = null;

    // Wait for DOM to be ready
    const observeHero = () => {
      const heroSection = document.querySelector("section.h-screen");

      if (heroSection) {
        observer = new IntersectionObserver(
          ([entry]) => {
            // Disable mouse attraction when hero is no longer significantly visible
            isInAboutSectionRef.current = entry.intersectionRatio < 0.3;
          },
          { threshold: [0, 0.3, 0.5, 1] }
        );

        observer.observe(heroSection);
      }
    };

    // Call immediately and also set a short timeout as fallback
    observeHero();
    const timeoutId = setTimeout(observeHero, 100);

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      const frameStart = performance.now();

      if (!ctx || !canvas) return;
      if (document.hidden) {
        // avoid running heavy updates when page not visible
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Apply external quality settings if they changed
      if (externalQualitySettings) {
        const current = qualityRef.current;
        const external = externalQualitySettings;

        // Check if settings changed
        if (
          current.maxParticles !== external.maxParticles ||
          current.connectionDistance !== external.connectionDistance ||
          current.densityFactor !== external.densityFactor ||
          current.skipConnectionFrames !== external.skipConnectionFrames
        ) {
          qualityRef.current = { ...external };

          // Trim particles if max reduced
          if (particlesRef.current.length > external.maxParticles) {
            particlesRef.current = particlesRef.current.slice(
              0,
              external.maxParticles
            );
          }

          // Recreate spatial grid if connection distance changed
          if (current.connectionDistance !== external.connectionDistance) {
            spatialGridRef.current = new SpatialGrid(
              canvas.width,
              canvas.height,
              external.connectionDistance
            );
          }
        }
      }

      frameCountRef.current++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles periodically (respecting quality limits)
      const spawnSettings = qualityRef.current;
      if (
        frameCountRef.current % 15 === 0 &&
        particlesRef.current.length < spawnSettings.maxParticles
      ) {
        particlesRef.current.push(
          createParticle(canvas.width, canvas.height, true)
        );
      }

      const settings = qualityRef.current;
      const grid = spatialGridRef.current;

      // Rebuild spatial grid
      if (grid) {
        grid.clear();
        particlesRef.current.forEach((p) => grid.insert(p));
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        // Check mouse distance for attraction influence
        const mouseDx = mouseRef.current.x - particle.x;
        const mouseDy = mouseRef.current.y - particle.y;
        const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        const maxMouseDistance = 250;
        const nearMouse = mouseDistance < maxMouseDistance;

        // Check if particle has connections using spatial grid (O(1) instead of O(n))
        let connectionCount = 0;
        if (grid) {
          const nearby = grid.getNearby(particle, settings.connectionDistance);
          for (const other of nearby) {
            if (other !== particle) {
              const dx = particle.x - other.x;
              const dy = particle.y - other.y;
              const distSq = dx * dx + dy * dy;
              const maxDistSq =
                settings.connectionDistance * settings.connectionDistance;
              if (distSq < maxDistSq) {
                connectionCount++;
              }
            }
          }
        }

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

      // Draw connections (skip frames on low-power devices)
      const connSettings = qualityRef.current;
      if (
        frameCountRef.current % connSettings.skipConnectionFrames === 0 &&
        grid
      ) {
        const drawn = new Set<string>();
        particlesRef.current.forEach((p1) => {
          const nearby = grid.getNearby(p1, connSettings.connectionDistance);
          nearby.forEach((p2) => {
            if (p1 === p2) return;

            // Avoid drawing same connection twice
            const key =
              p1.x < p2.x
                ? `${p1.x},${p1.y}-${p2.x},${p2.y}`
                : `${p2.x},${p2.y}-${p1.x},${p1.y}`;
            if (drawn.has(key)) return;
            drawn.add(key);

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            const maxDistSq =
              connSettings.connectionDistance * connSettings.connectionDistance;

            if (distSq < maxDistSq) {
              const distance = Math.sqrt(distSq);
              const opacity =
                0.2 *
                (1 - distance / connSettings.connectionDistance) *
                Math.min(p1.opacity, p2.opacity);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `hsla(185, 45%, 65%, ${opacity})`;
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
          });
        });
      }

      // Report performance every 60 frames
      if (frameCountRef.current % 60 === 0) {
        const duration = performance.now() - frameStart;
        reportPerformance("ParticleField", duration);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
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
