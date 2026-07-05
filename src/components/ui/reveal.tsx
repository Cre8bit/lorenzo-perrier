import type { CSSProperties, ReactNode } from "react";
import { useRevealOnce } from "@/hooks/use-reveal-once";

interface RevealProps {
  children: ReactNode;
  /** Stagger slot — multiplied by 90ms in CSS (--ri). */
  delayIndex?: number;
  className?: string;
}

/**
 * Thin wrapper around useRevealOnce + `.reveal-up`: fades/rises its content
 * the first time it scrolls into view, with optional sibling staggering.
 */
export const Reveal = ({ children, delayIndex = 0, className }: RevealProps) => {
  const { ref, inView } = useRevealOnce<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className ? `reveal-up ${className}` : "reveal-up"}
      data-inview={inView ? "true" : "false"}
      style={{ "--ri": delayIndex } as CSSProperties}
    >
      {children}
    </div>
  );
};
