import { lazy, Suspense, useState } from "react";
import { SocialLinks, ContactActions } from "@/components/ui/social-links";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { PageWrapper } from "@/components/transitions/PageTransition";

import type { CubeSceneStats } from "@/components/cubespace/CubeScene";
import { CubeSpaceOverlay } from "@/components/cubespace/CubeSpaceOverlay";
import { getRandomColor } from "@/components/cubespace/cubeColors";

// Lazy load the heavy Three.js scene
const CubeScene = lazy(() => import("@/components/cubespace/CubeScene"));

const CubeSpace = () => {
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());

  // NEW: placing mode + live stats from scene
  const [isPlacing, setIsPlacing] = useState(false);
  const [stats, setStats] = useState<CubeSceneStats>({
    cubeCount: 0,
    towerHeight: 0,
  });

  return (
    <PageWrapper>
      <main className="relative h-screen w-full overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 10%, hsla(220, 30%, 12%, 0.8) 0%, transparent 50%),
                radial-gradient(ellipse 60% 50% at 80% 90%, hsla(200, 25%, 10%, 0.6) 0%, transparent 50%),
                linear-gradient(180deg, hsl(220, 20%, 6%) 0%, hsl(220, 15%, 4%) 100%)
              `,
            }}
          />

          {/* Subtle dots pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dots-pattern"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="hsl(185, 50%, 55%)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-pattern)" />
          </svg>
        </div>

        {/* Three.js Scene */}
        <div className="absolute inset-0 z-10">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-muted-foreground text-sm animate-pulse">
                  Loading scene...
                </div>
              </div>
            }
          >
            <CubeScene
              isPlacing={isPlacing}
              onStatsChange={setStats}
              selectedColor={selectedColor}
              onPlaced={() => setIsPlacing(false)}
            />
          </Suspense>
        </div>

        {/* UI Overlay Layer */}
        <div className="relative z-20 pointer-events-none">
          {/* Social links */}
          <div className="pointer-events-auto">
            <SocialLinks />
          </div>

          {/* Contact button */}
          <div className="pointer-events-auto">
            <ContactActions />
          </div>

          {/* NEW overlay */}
          <CubeSpaceOverlay
            cubeCount={stats.cubeCount}
            towerHeight={stats.towerHeight}
            isPlacing={isPlacing}
            onTogglePlacing={() => setIsPlacing((v) => !v)}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
          />

          {/* Liquid Navigation */}
          <div className="pointer-events-auto">
            <LiquidNavigation />
          </div>
        </div>
      </main>
    </PageWrapper>
  );
};

export default CubeSpace;
