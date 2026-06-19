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
  const innerTimeout1Ref = useRef<NodeJS.Timeout | null>(null);
  const innerTimeout2Ref = useRef<NodeJS.Timeout | null>(null);

  // Refs mirror state so the schedule loop can read fresh values
  // without re-running the effect (which would clear in-flight timeouts).
  const currentIndexRef = useRef(currentIndex);
  const usedIndicesRef = useRef(usedIndices);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    usedIndicesRef.current = usedIndices;
  }, [usedIndices]);

  // Only show/animate the constellation in the HERO section
  const isHero = currentSection === "hero";
  const shouldRenderCanvas = isHero; // avoid mounting/RAF work outside hero
  const canvasActive = isHero && isTransitioning; // keep your "only during transition" behavior

  useEffect(() => {
    // Only run effect in hero section
    if (!isHero) return;

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
        innerTimeout1Ref.current = setTimeout(() => {
          let nextIndex: number;

          const current = currentIndexRef.current;
          const used = usedIndicesRef.current;

          const available = Array.from(
            { length: SUBTITLES.length },
            (_, i) => i,
          ).filter((i) => i !== current);

          if (used.length >= SUBTITLES.length) {
            const reset = [current];
            usedIndicesRef.current = reset;
            setUsedIndices(reset);
            nextIndex = available[(Math.random() * available.length) | 0];
          } else {
            const unused = available.filter((i) => !used.includes(i));
            const pool = unused.length ? unused : available;
            nextIndex = pool[(Math.random() * pool.length) | 0];
          }

          currentIndexRef.current = nextIndex;
          setCurrentIndex(nextIndex);
          const nextUsed = [...usedIndicesRef.current, nextIndex];
          usedIndicesRef.current = nextUsed;
          setUsedIndices(nextUsed);

          // fade in text
          setTextVisible(true);
          innerTimeout1Ref.current = null;
        }, 350);

        // stop constellation a bit later
        innerTimeout2Ref.current = setTimeout(() => {
          setIsTransitioning(false);
          innerTimeout2Ref.current = null;
        }, 1100);

        scheduleNext();
      }, interval);
    };

    scheduleNext();
    reportPerformance("AnimatedSubtitle:effect", performance.now() - t0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (innerTimeout1Ref.current) clearTimeout(innerTimeout1Ref.current);
      if (innerTimeout2Ref.current) clearTimeout(innerTimeout2Ref.current);
    };
  }, [isHero]);

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
