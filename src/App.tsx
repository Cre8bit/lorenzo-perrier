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
import { useAppContext } from "@/contexts/useAppContext";
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

const queryClient = new QueryClient();

const CubeSpace = lazy(() => import("./pages/CubeSpace"));

const AppRouterLayer = () => {
  const isCubeSpaceRoute = useMatch("/cubespace/*") != null;
  const { currentSection } = useAppContext();
  const [hasVisitedCubeSpace, setHasVisitedCubeSpace] = useState(false);
  const keepAliveEnabled = hasVisitedCubeSpace || isCubeSpaceRoute;
  const cubeDebugEnabled = useCubeSpaceDebugOverlay();

  useEffect(() => {
    if (isCubeSpaceRoute) setHasVisitedCubeSpace(true);
  }, [isCubeSpaceRoute]);

  return (
    <>
      <GlobalBackground particleMode={isCubeSpaceRoute ? "idle" : "active"} />
      <CubeSpaceDataProvider enabled={keepAliveEnabled}>
        <CubeSpaceDebugOverlay enabled={cubeDebugEnabled && keepAliveEnabled} />
        <AppLoaderGate>
          <SocialLinks hide={currentSection === "experience"} />
          <ContactActions hide={currentSection === "experience"} />
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
    </>
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
