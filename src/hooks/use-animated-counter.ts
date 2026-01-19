import { useEffect, useState, useRef } from "react";

interface UseAnimatedCounterOptions {
  end: number;
  duration?: number;
  delay?: number;
  startOnView?: boolean;
}

export const useAnimatedCounter = ({
  end,
  duration = 1500,
  delay = 0,
  startOnView = true,
}: UseAnimatedCounterOptions) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const timeout = setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth deceleration
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        const currentCount = Math.round(easeOutExpo * end);

        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [hasStarted, end, duration, delay]);

  return { count, ref, hasStarted };
};

// Parse a label like "3+" or "15K+" and return the numeric part
export const parseKPILabel = (label: string): { value: number; suffix: string } => {
  const match = label.match(/^(\d+)(.*)$/);
  if (match) {
    return { value: parseInt(match[1], 10), suffix: match[2] };
  }
  return { value: 0, suffix: label };
};
