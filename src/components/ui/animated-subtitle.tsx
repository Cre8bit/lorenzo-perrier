import { useEffect, useRef, useState } from "react";
import { ConstellationCanvas } from "./constellation-canvas";
import { useAppContext } from "@/contexts/useAppContext";
import { reportPerformance } from "./performance-overlay";

interface SubtitleSegment {
  text: string;
  isAccent: boolean;
  newLine?: boolean;
}

interface Subtitle {
  segments: SubtitleSegment[];
}

const SUBTITLES: Subtitle[] = [
  {
    segments: [
      { text: "Exploring the architecture of systems,", isAccent: false },
      { text: "motion", isAccent: true, newLine: true },
      { text: ", and ", isAccent: false },
      { text: "flow", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Connecting the dots between ", isAccent: false },
      { text: "systems", isAccent: true },
      { text: " and ", isAccent: false },
      { text: "motion", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Designing ", isAccent: false },
      { text: "systems", isAccent: true },
      { text: " that ", isAccent: false },
      { text: "move", isAccent: true },
      { text: " and ", isAccent: false },
      { text: "adapt", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "From ", isAccent: false },
      { text: "abstraction", isAccent: true },
      { text: " to ", isAccent: false },
      { text: "behavior", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Systems in ", isAccent: false },
      { text: "motion", isAccent: true },
      { text: ", by design.", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Crafting ", isAccent: false },
      { text: "clarity", isAccent: true },
      { text: " from ", isAccent: false },
      { text: "complexity", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Architectures that ", isAccent: false },
      { text: "reason", isAccent: true },
      { text: " and ", isAccent: false },
      { text: "react", isAccent: true },
      { text: ".", isAccent: false },
    ],
  },
  {
    segments: [
      { text: "Where ideas ", isAccent: false },
      { text: "flow", isAccent: true },
      { text: " into form.", isAccent: false },
    ],
  },
];

export const AnimatedSubtitle = () => {
  const { currentSection } = useAppContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState<number[]>([0]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const [transitionKey, setTransitionKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Only show/animate the constellation in the HERO section
  const isHero = currentSection === "hero";
  const shouldRenderCanvas = isHero; // avoid mounting/RAF work outside hero
  const canvasActive = isHero && isTransitioning; // keep your "only during transition" behavior

  useEffect(() => {
    // Only run effect in hero section
    if (!isHero) {
      // Clear any existing timeout when leaving hero
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      return;
    }

    const t0 = performance.now();
    const scheduleNext = () => {
      const interval = 6000 + Math.random() * 2000;

      timeoutRef.current = setTimeout(() => {
        // start transition
        setIsTransitioning(true);
        setTransitionKey((k) => k + 1);

        // fade out text quickly
        setTextVisible(false);

        // swap index mid-transition (after fade out)
        setTimeout(() => {
          let nextIndex: number;

          const available = Array.from(
            { length: SUBTITLES.length },
            (_, i) => i,
          ).filter((i) => i !== currentIndex);

          if (usedIndices.length >= SUBTITLES.length) {
            setUsedIndices([currentIndex]);
            nextIndex = available[(Math.random() * available.length) | 0];
          } else {
            const unused = available.filter((i) => !usedIndices.includes(i));
            const pool = unused.length ? unused : available;
            nextIndex = pool[(Math.random() * pool.length) | 0];
          }

          setCurrentIndex(nextIndex);
          setUsedIndices((prev) => [...prev, nextIndex]);

          // fade in text
          setTextVisible(true);
        }, 350);

        // stop constellation a bit later
        setTimeout(() => setIsTransitioning(false), 1100);

        scheduleNext();
      }, interval);
    };

    scheduleNext();
    reportPerformance("AnimatedSubtitle:effect", performance.now() - t0);
    return () => timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [currentIndex, usedIndices, isHero]); // Added isHero to deps

  const currentSubtitle = SUBTITLES[currentIndex];

  return (
    <div className="relative mx-auto max-w-md min-h-[3.5rem] md:min-h-[4rem] flex items-center justify-center">
      {/* Constellation only exists in HERO, and only animates during transitions */}
      {shouldRenderCanvas && (
        <ConstellationCanvas active={canvasActive} seed={transitionKey} />
      )}

      <p
        className={[
          "text-center font-body text-lg md:text-xl font-extralight tracking-wide",
          "transition-opacity duration-300",
          textVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {currentSubtitle.segments.map((segment, idx) => (
          <span key={idx}>
            {segment.newLine && <br />}
            <span
              className={
                segment.isAccent
                  ? "text-[hsl(185,50%,55%)]"
                  : "text-muted-foreground"
              }
            >
              {segment.text}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
};
