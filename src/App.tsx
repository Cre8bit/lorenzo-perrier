import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import VariationsIndex from "./pages/variations/index";
import VariationA from "./pages/variations/VariationA";
import VariationB from "./pages/variations/VariationB";
import VariationC from "./pages/variations/VariationC";
import VariationD from "./pages/variations/VariationD";
import VariationE from "./pages/variations/VariationE";
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/variations" element={<VariationsIndex />} />
            <Route path="/variations/a" element={<VariationA />} />
            <Route path="/variations/b" element={<VariationB />} />
            <Route path="/variations/c" element={<VariationC />} />
            <Route path="/variations/d" element={<VariationD />} />
            <Route path="/variations/e" element={<VariationE />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
