import { useEffect, useState, useRef } from "react";
import { PerformanceMonitor } from "@/lib/performance";
import type { ComponentMetrics, MemoryMetrics } from "@/lib/performance";

// Calculate severity from timing
const calculateSeverity = (
  avgTime: number,
): "low" | "medium" | "high" | "critical" => {
  if (avgTime > 33) return "critical"; // >2 frames
  if (avgTime > 16.67) return "high"; // >1 frame
  if (avgTime > 8) return "medium";
  return "low";
};

// Calculate 95th percentile
const p95 = (samples: number[]): number => {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.95);
  return sorted[idx] || 0;
};

export const PerformanceOverlay = ({
  enabled = true,
}: {
  enabled?: boolean;
}) => {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  const [longTasks, setLongTasks] = useState(0);
  const [droppedFrames, setDroppedFrames] = useState(0);
  const [cpuLoad, setCpuLoad] = useState(0);
  const [memory, setMemory] = useState<MemoryMetrics | undefined>(undefined);
  const [metrics, setMetrics] = useState<Map<string, ComponentMetrics>>(
    new Map(),
  );
  const [isVisible, setIsVisible] = useState(true);
  const [sortMode, setSortMode] = useState<"time" | "calls" | "p95">("time");
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    // Disable performance monitoring in production builds
    if (!import.meta.env.DEV || !enabled) {
      setPerformanceOverlayEnabled(false);
      return;
    }

    setPerformanceOverlayEnabled(true);

    // Start FPS monitoring
    const monitor = new PerformanceMonitor((avgFps) => {
      console.warn(`Low FPS detected: ${avgFps.toFixed(1)} fps`);
    });
    monitor.start();
    monitorRef.current = monitor;

    // Update all metrics every 500ms
    const metricsInterval = setInterval(() => {
      const currentMonitor = monitorRef.current;
      if (currentMonitor) {
        setFps(currentMonitor.getAverageFPS());
        setFrameTime(currentMonitor.getAverageFrameTime());
        setLongTasks(currentMonitor.getLongTaskCount());
        setDroppedFrames(currentMonitor.getDroppedFrameCount());
        setCpuLoad(currentMonitor.getCPULoad());
        setMemory(currentMonitor.getMemoryMetrics());
      }
    }, 500);

    // Listen for performance measurements from components
    const handlePerformance = (event: Event) => {
      const { name, duration } = (
        event as CustomEvent<{ name: string; duration: number }>
      ).detail;

      setMetrics((prev) => {
        const newMetrics = new Map(prev);
        const existing = newMetrics.get(name);

        if (existing) {
          const samples = [...existing.samples, duration].slice(-100); // keep last 100
          const callCount = existing.callCount + 1;
          const avgTime =
            (existing.avgTime * existing.callCount + duration) / callCount;
          const maxTime = Math.max(existing.maxTime, duration);
          const minTime = Math.min(existing.minTime, duration);
          const p95Time = p95(samples);

          newMetrics.set(name, {
            name,
            avgTime,
            maxTime,
            minTime,
            callCount,
            p95Time,
            lastUpdate: Date.now(),
            samples,
            severity: calculateSeverity(avgTime),
          });
        } else {
          newMetrics.set(name, {
            name,
            avgTime: duration,
            maxTime: duration,
            minTime: duration,
            callCount: 1,
            p95Time: duration,
            lastUpdate: Date.now(),
            samples: [duration],
            severity: calculateSeverity(duration),
          });
        }

        return newMetrics;
      });
    };

    window.addEventListener("performance-metric", handlePerformance);

    // Log device info on startup
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
      clearInterval(metricsInterval);
      window.removeEventListener("performance-metric", handlePerformance);
      setPerformanceOverlayEnabled(false);
    };
  }, [enabled]);

  // Only render overlay in development builds (after hooks)
  if (!import.meta.env.DEV) {
    setPerformanceOverlayEnabled(false);
    return null;
  }

  if (!enabled || !isVisible) return null;

  // Filter and sort metrics
  const sortedMetrics = Array.from(metrics.values())
    .filter((m) => Date.now() - m.lastUpdate < 5000) // Only show recent
    .sort((a, b) => {
      if (sortMode === "calls") return b.callCount - a.callCount;
      if (sortMode === "p95") return b.p95Time - a.p95Time;
      return b.avgTime - a.avgTime; // default: time
    })
    .slice(0, 12); // show top 12

  // Color helpers
  const fpsColor = fps > 50 ? "#10b981" : fps > 30 ? "#f59e0b" : "#ef4444";
  const cpuColor =
    cpuLoad < 0.3 ? "#10b981" : cpuLoad < 0.6 ? "#f59e0b" : "#ef4444";
  const memColor = !memory
    ? "#888"
    : memory.usedPercent < 60
      ? "#10b981"
      : memory.usedPercent < 80
        ? "#f59e0b"
        : "#ef4444";

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#eab308";
      default:
        return "#10b981";
    }
  };

  // Find worst offender
  const worstComponent = sortedMetrics[0];
  const hasPerformanceIssues =
    fps < 40 ||
    longTasks > 5 ||
    (worstComponent && worstComponent.avgTime > 20);

  return (
    <div
      className="fixed top-4 right-4 z-[9999] bg-black/95 backdrop-blur-md text-white rounded-xl text-xs font-mono shadow-2xl border border-white/20"
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
        <div className="font-bold text-sm flex items-center gap-2">
          <span className="text-lg">⚡</span>
          Performance Monitor
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSortMode((m) =>
                m === "time" ? "calls" : m === "calls" ? "p95" : "time",
              )
            }
            className="text-white/60 hover:text-white text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
            title="Change sort mode"
          >
            {sortMode === "time"
              ? "⏱ AVG"
              : sortMode === "calls"
                ? "# CALLS"
                : "📊 P95"}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Critical Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[9px] mb-0.5">FPS</div>
            <div className="font-bold text-lg" style={{ color: fpsColor }}>
              {fps.toFixed(0)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[9px] mb-0.5">Frame</div>
            <div className="font-bold text-lg" style={{ color: fpsColor }}>
              {frameTime.toFixed(1)}
              <span className="text-[10px] text-white/40 ml-0.5">ms</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[9px] mb-0.5">CPU</div>
            <div className="font-bold text-lg" style={{ color: cpuColor }}>
              {(cpuLoad * 100).toFixed(0)}
              <span className="text-[10px] text-white/40 ml-0.5">%</span>
            </div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5">
            <span className="text-white/60">Long Tasks</span>
            <span
              className="font-bold"
              style={{ color: longTasks > 5 ? "#ef4444" : "#10b981" }}
            >
              {longTasks}/s
            </span>
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5">
            <span className="text-white/60">Dropped</span>
            <span
              className="font-bold"
              style={{ color: droppedFrames > 10 ? "#ef4444" : "#10b981" }}
            >
              {droppedFrames}/s
            </span>
          </div>
        </div>

        {/* Memory (if available) */}
        {memory && (
          <div className="bg-white/5 rounded-lg p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-[10px]">JS Heap</span>
              <span
                className="font-bold text-[11px]"
                style={{ color: memColor }}
              >
                {memory.usedPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, memory.usedPercent)}%`,
                  backgroundColor: memColor,
                }}
              />
            </div>
            <div className="text-white/40 text-[9px] mt-1">
              {(memory.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB /{" "}
              {(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB
            </div>
          </div>
        )}

        {/* Device Info */}
        <div className="bg-white/5 rounded-lg p-2 text-[10px]">
          <div className="text-white/50 mb-1">Device</div>
          <div className="text-white/70 space-y-0.5">
            <div>
              DPR: {window.devicePixelRatio.toFixed(1)}x | Cores:{" "}
              {navigator.hardwareConcurrency || "N/A"}
            </div>
            <div>
              Viewport: {window.innerWidth}×{window.innerHeight}
            </div>
          </div>
        </div>

        {/* Component Metrics */}
        {sortedMetrics.length > 0 && (
          <div>
            <div className="text-white/50 text-[10px] mb-2 flex items-center justify-between">
              <span>Component Times ({sortMode.toUpperCase()})</span>
              <span className="text-white/30">
                {sortedMetrics.length} active
              </span>
            </div>
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {sortedMetrics.map((metric) => (
                <div
                  key={metric.name}
                  className="bg-white/5 rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-white/80 truncate font-medium text-[11px]"
                      title={metric.name}
                    >
                      {metric.name.length > 24
                        ? metric.name.substring(0, 24) + "…"
                        : metric.name}
                    </span>
                    <span
                      className="font-bold text-[13px] ml-2"
                      style={{
                        color: getSeverityColor(metric.severity),
                      }}
                    >
                      {metric.avgTime.toFixed(2)}
                      <span className="text-[9px] opacity-60">ms</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40">
                    <span>
                      min: {metric.minTime.toFixed(1)} | max:{" "}
                      {metric.maxTime.toFixed(1)} | p95:{" "}
                      {metric.p95Time.toFixed(1)}
                    </span>
                    <span>{metric.callCount} calls</span>
                  </div>
                  {/* Visual bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (metric.avgTime / 33) * 100)}%`,
                        backgroundColor: getSeverityColor(metric.severity),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {hasPerformanceIssues && (
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-3 space-y-1">
            <div className="text-red-300 text-[11px] font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              Performance Issues Detected
            </div>
            {fps < 40 && (
              <div className="text-red-200/90 text-[10px]">
                • FPS below 40 - experiencing lag
              </div>
            )}
            {longTasks > 5 && (
              <div className="text-orange-200/90 text-[10px]">
                • {longTasks} long tasks detected (&gt;50ms)
              </div>
            )}
            {worstComponent && worstComponent.avgTime > 20 && (
              <div className="text-yellow-200/90 text-[10px]">
                • "{worstComponent.name}" taking{" "}
                {worstComponent.avgTime.toFixed(1)}ms /frame
              </div>
            )}
            <div className="text-red-300/70 text-[9px] mt-2 pt-2 border-t border-red-500/20">
              Press Ctrl/Cmd + Shift + O for quality controls
            </div>
          </div>
        )}

        {sortedMetrics.length === 0 && (
          <div className="text-white/40 text-center py-4 text-[10px]">
            No component data yet. Interact with the page.
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

// Helper to show/hide overlay with keyboard shortcut
export const usePerformanceOverlay = () => {
  const [enabled, setEnabled] = useState(() => {
    // Only enable in DEV and respect saved preference
    if (!import.meta.env.DEV) return false;
    const saved = localStorage.getItem("performance-overlay-enabled");
    return saved === "true";
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P to toggle (dev-only)
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

// Global flag to guard dispatch overhead when overlay is disabled
let performanceOverlayEnabled = false;

export const setPerformanceOverlayEnabled = (enabled: boolean) => {
  performanceOverlayEnabled = enabled;
};

// Utility to report performance metrics from components
export const reportPerformance = (name: string, duration: number) => {
  if (!import.meta.env.DEV) return; // No-op in production
  if (!performanceOverlayEnabled) return; // Guard: avoid dispatch if overlay is off

  const event = new CustomEvent("performance-metric", {
    detail: { name, duration },
  });
  window.dispatchEvent(event);
};

// Frame accumulator for true ms/frame average
const frameAccumulators = new Map<
  string,
  { total: number; count: number; lastReport: number }
>();

export const reportFramePerformance = (name: string, startTime: number) => {
  if (!import.meta.env.DEV) return; // No-op in production
  if (!performanceOverlayEnabled) return; // Guard: skip accumulation if overlay is off

  const duration = performance.now() - startTime;

  let acc = frameAccumulators.get(name);
  if (!acc) {
    acc = { total: 0, count: 0, lastReport: Date.now() };
    frameAccumulators.set(name, acc);
  }

  acc.total += duration;
  acc.count++;

  // Report average every ~1 second (time-based, works at any framerate)
  const now = Date.now();
  if (now - acc.lastReport >= 1000) {
    const avgDuration = acc.total / acc.count;
    reportPerformance(name, avgDuration);

    // Reset accumulator
    acc.total = 0;
    acc.count = 0;
    acc.lastReport = now;
  }
};
