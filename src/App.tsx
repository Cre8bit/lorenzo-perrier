import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { ContactActions, SocialLinks } from "@/components/ui/social-links";
import { ConstellationRevealLoader } from "@/components/transitions/ConstellationRevealLoader";
import { AppProvider } from "@/contexts/AppProvider";
import { useAppContext } from "@/contexts/useAppContext";
import {
  PerformanceOverlay,
  usePerformanceOverlay,
} from "./components/ui/performance-overlay";
import {
  QualityControls,
  useQualityControls,
} from "./components/ui/quality-controls";
import { setParticleField3DQuality } from "./components/ui/particle-quality";

const queryClient = new QueryClient();

const loadCubeSpace = () => import("./pages/CubeSpace");

const CubeSpace = lazy(loadCubeSpace);

const AppBootLoader = () => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-b from-background via-background to-background">
    <div className="text-center space-y-4">
      <ConstellationRevealLoader
        size={190}
        points={14}
        durationMs={4200}
        seed={Math.floor(Math.random() * 10000)}
        maxLinkDist={38}
        neighbors={2}
      />
      <p className="text-sm text-muted-foreground font-body">
        Initializing...
      </p>
    </div>
  </div>
);

const AppShell = () => {
  const perfEnabled = usePerformanceOverlay();
  const qualityEnabled = useQualityControls();
  const [routesReady, setRoutesReady] = useState(false);
  const { isParticleFieldInitialized, currentSection } = useAppContext();

  useEffect(() => {
    let alive = true;
    loadCubeSpace().then(() => {
      if (alive) setRoutesReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const bootReady = routesReady && isParticleFieldInitialized;

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PerformanceOverlay enabled={perfEnabled} />
      <QualityControls
        enabled={qualityEnabled}
        onSettingsChange={setParticleField3DQuality}
      />
      {!bootReady && <AppBootLoader />}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <SocialLinks hide={currentSection === "experience"}/>
        <ContactActions hide={currentSection === "experience"}/>
        <LiquidNavigation />
        <Suspense fallback={<AppBootLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cubespace" element={<CubeSpace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
