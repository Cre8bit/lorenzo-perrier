import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useMatch } from "react-router-dom";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { ContactActions, SocialLinks } from "@/components/ui/social-links";
import { AppProvider } from "@/contexts/AppProvider";
import { GlobalBackground } from "@/components/ui/global-background";
import { AppLoaderGate } from "@/components/transitions/AppLoaderGate";
import { CubeSpaceDataProvider } from "@/contexts/CubeSpaceDataProvider";
import { CubeSpaceConstellationLoader } from "@/components/cubespace/CubeSpaceConstellationLoader";
import {
  PerformanceOverlay,
  usePerformanceOverlay,
} from "./components/ui/performance-overlay";
import {
  QualityControls,
  useQualityControls,
} from "./components/ui/quality-controls";
import { CubeSpaceDebugOverlay } from "./components/ui/cubespace-debug-overlay";
import { useCubeSpaceDebugOverlay } from "@/hooks/use-cubespace-debug-overlay";
import { setParticleField3DQuality } from "./components/ui/particle-quality";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";
import { useFlowHue } from "@/hooks/use-flow-hue";

const queryClient = new QueryClient();

const CubeSpace = lazy(() => import("./pages/CubeSpace"));

const AppRouterLayer = () => {
  const isCubeSpaceRoute = useMatch("/cubespace/*") != null;
  const [hasVisitedCubeSpace, setHasVisitedCubeSpace] = useState(false);
  const keepAliveEnabled = hasVisitedCubeSpace || isCubeSpaceRoute;
  const cubeDebugEnabled = useCubeSpaceDebugOverlay();

  // Drives the site-wide --flow-hue chromatic drift from the active section.
  useFlowHue();

  useEffect(() => {
    if (isCubeSpaceRoute) setHasVisitedCubeSpace(true);
  }, [isCubeSpaceRoute]);

  return (
    // Safari compositing fix: the fixed-position GlobalBackground and the
    // scrolling page content must share a single `position: relative;
    // overflow-x: clip` ancestor.
    <main
      className="relative min-h-screen w-full"
      style={{ overflowX: "clip" }}
    >
      <GlobalBackground particleMode={isCubeSpaceRoute ? "idle" : "active"} />
      <CursorGlow />
      {!isCubeSpaceRoute && <ScrollProgressBar />}
      <CubeSpaceDataProvider enabled={keepAliveEnabled}>
        <CubeSpaceDebugOverlay enabled={cubeDebugEnabled && keepAliveEnabled} />
        <AppLoaderGate>
          <SocialLinks />
          <ContactActions />
          <LiquidNavigation />

          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cubespace/*" element={null} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {keepAliveEnabled && (
            <Suspense
              fallback={
                isCubeSpaceRoute ? (
                  <CubeSpaceConstellationLoader
                    className="fixed inset-0 z-30"
                    message="Loading CubeSpace..."
                    size={170}
                  />
                ) : null
              }
            >
              <CubeSpace active={isCubeSpaceRoute} />
            </Suspense>
          )}
        </AppLoaderGate>
      </CubeSpaceDataProvider>
    </main>
  );
};

const AppShell = () => {
  const perfEnabled = usePerformanceOverlay();
  const qualityEnabled = useQualityControls();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PerformanceOverlay enabled={perfEnabled} />
      <QualityControls
        enabled={qualityEnabled}
        onSettingsChange={setParticleField3DQuality}
      />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRouterLayer />
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <AppShell />
    </AppProvider>
  </QueryClientProvider>
);

export default App;
