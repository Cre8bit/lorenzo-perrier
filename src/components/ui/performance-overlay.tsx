import { useEffect, useState, useRef } from "react";
import { PerformanceMonitor } from "@/lib/performance";

interface ComponentMetric {
  name: string;
  avgTime: number;
  callCount: number;
  lastUpdate: number;
}

export const PerformanceOverlay = ({
  enabled = true,
}: {
  enabled?: boolean;
}) => {
  const [fps, setFps] = useState(60);
  const [metrics, setMetrics] = useState<Map<string, ComponentMetric>>(
    new Map()
  );
  const [isVisible, setIsVisible] = useState(true);
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Start FPS monitoring
    const monitor = new PerformanceMonitor((avgFps) => {
      console.warn(`Low FPS detected: ${avgFps.toFixed(1)} fps`);
    });
    monitor.start();
    monitorRef.current = monitor;

    // Update FPS display every second
    const fpsInterval = setInterval(() => {
      if (monitor) {
        setFps(monitor.getAverageFPS());
      }
    }, 1000);

    // Listen for performance measurements from components
    const handlePerformance = (event: CustomEvent) => {
      const { name, duration } = event.detail;

      setMetrics((prev) => {
        const newMetrics = new Map(prev);
        const existing = newMetrics.get(name);

        if (existing) {
          existing.avgTime =
            (existing.avgTime * existing.callCount + duration) /
            (existing.callCount + 1);
          existing.callCount++;
          existing.lastUpdate = Date.now();
        } else {
          newMetrics.set(name, {
            name,
            avgTime: duration,
            callCount: 1,
            lastUpdate: Date.now(),
          });
        }

        return newMetrics;
      });
    };

    window.addEventListener("performance-metric", handlePerformance);

    // Check GPU usage (if available)
    const checkGPU = async () => {
      // @ts-expect-error - experimental API
      if (navigator.deviceMemory) {
        // @ts-expect-error - experimental API
        console.log("Device Memory:", navigator.deviceMemory, "GB");
      }
      console.log("Hardware Concurrency:", navigator.hardwareConcurrency);
      console.log("Device Pixel Ratio:", window.devicePixelRatio);
    };
    checkGPU();

    return () => {
      monitor.stop();
      clearInterval(fpsInterval);
      window.removeEventListener("performance-metric", handlePerformance);
    };
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  const sortedMetrics = Array.from(metrics.values())
    .filter((m) => Date.now() - m.lastUpdate < 5000) // Only show recent
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 8);

  const fpsColor = fps > 50 ? "#10b981" : fps > 30 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="fixed top-4 right-4 z-[9999] bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg text-xs font-mono shadow-2xl border border-white/10"
      style={{ minWidth: "280px", maxWidth: "350px" }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
        <div className="font-bold text-sm">Performance Monitor</div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* FPS */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-white/70">FPS:</span>
        <span className="font-bold text-lg" style={{ color: fpsColor }}>
          {fps.toFixed(1)}
        </span>
      </div>

      {/* Device Info */}
      <div className="mb-3 pb-2 border-b border-white/10">
        <div className="text-white/50 text-[10px] mb-1">Device Info:</div>
        <div className="text-white/70">
          DPR: {window.devicePixelRatio.toFixed(1)}x | Cores:{" "}
          {navigator.hardwareConcurrency || "N/A"}
        </div>
      </div>

      {/* Component Metrics */}
      {sortedMetrics.length > 0 && (
        <>
          <div className="text-white/50 text-[10px] mb-2">
            Component Times (ms/frame):
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {sortedMetrics.map((metric) => (
              <div
                key={metric.name}
                className="flex items-center justify-between"
              >
                <span className="text-white/70 truncate" title={metric.name}>
                  {metric.name.length > 20
                    ? metric.name.substring(0, 20) + "..."
                    : metric.name}
                </span>
                <span
                  className="font-bold ml-2"
                  style={{
                    color:
                      metric.avgTime > 16.67
                        ? "#ef4444"
                        : metric.avgTime > 8
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                >
                  {metric.avgTime.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Warnings */}
      {fps < 30 && (
        <div className="mt-3 pt-2 border-t border-red-500/30 bg-red-500/10 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
          <div className="text-red-400 text-[10px] font-bold">
            ⚠ Low FPS Detected
          </div>
          <div className="text-red-300/80 text-[10px]">
            Check components with red times above
          </div>
        </div>
      )}

      {sortedMetrics.some((m) => m.avgTime > 16.67) && (
        <div className="mt-2 text-[10px] text-yellow-400/80">
          Some components exceed 16.67ms budget
        </div>
      )}
    </div>
  );
};

// Helper to show/hide overlay with keyboard shortcut
export const usePerformanceOverlay = () => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem("performance-overlay-enabled");
    return saved === "true";
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setEnabled((prev) => {
          const next = !prev;
          localStorage.setItem("performance-overlay-enabled", String(next));
          console.log("Performance overlay:", next ? "enabled" : "disabled");
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return enabled;
};

// Utility to report performance metrics from components
export const reportPerformance = (name: string, duration: number) => {
  const event = new CustomEvent("performance-metric", {
    detail: { name, duration },
  });
  window.dispatchEvent(event);
};
