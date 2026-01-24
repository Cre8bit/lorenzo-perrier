import { lazy, Suspense, useState, useCallback } from "react";
import { SocialLinks, ContactActions } from "@/components/ui/social-links";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { CubeSpaceOverlay } from "@/components/cubespace/CubeSpaceOverlay";
import { PageWrapper } from "@/components/transitions/PageTransition";

// Lazy load the heavy Three.js scene
const CubeScene = lazy(() => import("@/components/cubespace/CubeScene"));

const CubeSpace = () => {
  const [cubeCount, setCubeCount] = useState(0);
  const [guestName, setGuestName] = useState("Guest");
  const [dropTrigger, setDropTrigger] = useState(0);

  const handleDropCube = useCallback(() => {
    setDropTrigger((prev) => prev + 1);
    setCubeCount((prev) => prev + 1);
  }, []);

  const handleNameChange = useCallback((name: string) => {
    setGuestName(name || "Guest");
  }, []);

  return (
    <PageWrapper>
      <main className="relative h-screen w-full overflow-hidden">
      {/* Background gradient - subtle, distinct from homepage */}
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
        
        {/* Subtle connected dots hint - very light, non-interactive */}
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
          <CubeScene dropTrigger={dropTrigger} guestName={guestName} />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-20 pointer-events-none">
        {/* Social links - top right */}
        <div className="pointer-events-auto">
          <SocialLinks />
        </div>

        {/* Contact button - bottom left */}
        <div className="pointer-events-auto">
          <ContactActions />
        </div>

        {/* CubeSpace UI Overlay */}
        <CubeSpaceOverlay
          cubeCount={cubeCount}
          guestName={guestName}
          onDropCube={handleDropCube}
          onNameChange={handleNameChange}
        />

        {/* Liquid Navigation - bottom center */}
        <div className="pointer-events-auto">
          <LiquidNavigation />
        </div>
      </div>
      </main>
    </PageWrapper>
  );
};

export default CubeSpace;
