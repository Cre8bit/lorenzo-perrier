import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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

const App = () => {
  const perfEnabled = usePerformanceOverlay();
  const qualityEnabled = useQualityControls();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PerformanceOverlay enabled={perfEnabled} />
        <QualityControls
          enabled={qualityEnabled}
          onSettingsChange={setParticleField3DQuality}
        />
        <BrowserRouter basename="/lorenzo-perrier">
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
