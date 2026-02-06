/**
 * CubeSpace Debug Overlay - Development-only debugging UI
 *
 * Shows:
 * - Current activeFlowId
 * - Buffer status
 * - Recent flow metrics
 * - State transition logs
 *
 * Toggle: Cmd/Ctrl + Shift + I
 * Pattern: Follows performance-overlay.tsx design
 */

import { useEffect, useState } from "react";
import { useCubeSpaceData } from "@/contexts/useCubeSpaceData";
import { cubeSpaceMetrics, type FlowSummary } from "@/lib/cubespaceMetrics";

export const CubeSpaceDebugOverlay = ({
  enabled = true,
}: {
  enabled?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [metrics, setMetrics] = useState({
    totalFlows: 0,
    successRate: 0,
    bufferHitRate: 0,
    avgDuration: 0,
  });
  const [recentFlows, setRecentFlows] = useState<FlowSummary[]>([]);

  // Now safe to use context - component is always inside CubeSpaceDataProvider
  const { activeFlowId, cubesByLocalId } = useCubeSpaceData();

  useEffect(() => {
    if (!import.meta.env.DEV || !enabled) return;

    // Enable metrics when overlay is shown
    cubeSpaceMetrics.enable();

    // Update metrics every 1 second
    const interval = setInterval(() => {
      setMetrics(cubeSpaceMetrics.getMetrics());
      setRecentFlows(cubeSpaceMetrics.getAllFlows().slice(-5));
    }, 1000);

    return () => {
      clearInterval(interval);
      // Don't disable metrics on unmount - let toggle handle it
    };
  }, [enabled]);

  // Only render in development
  if (!import.meta.env.DEV) return null;
  if (!enabled || !isVisible) return null;

  const activeCube = activeFlowId ? cubesByLocalId.get(activeFlowId) : null;
  const cubeCount = cubesByLocalId.size;

  return (
    <div
      className="fixed top-4 left-4 z-[9998] bg-black/95 backdrop-blur-md text-white rounded-xl text-xs font-mono shadow-2xl border border-purple-500/30"
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
        <div className="font-bold text-sm flex items-center gap-2">
          <span className="text-lg">🧊</span>
          CubeSpace Debug
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Active Flow Status */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
          <div className="text-purple-300 text-[10px] mb-1">Active Flow</div>
          {activeFlowId ? (
            <div className="space-y-1">
              <div className="font-bold text-purple-200 text-[11px]">
                {activeFlowId.slice(0, 8)}...
              </div>
              {activeCube && (
                <div className="text-white/60 text-[10px] space-y-0.5">
                  <div>
                    Status:{" "}
                    <span className="text-white/80">{activeCube.status}</span>
                  </div>
                  <div>
                    Color:{" "}
                    <span className="text-white/80">{activeCube.color}</span>
                  </div>
                  {activeCube.remoteId && (
                    <div>
                      Remote:{" "}
                      <span className="text-white/80">
                        {activeCube.remoteId.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/40 text-[10px]">No active flow</div>
          )}
        </div>

        {/* Cube Counts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[9px] mb-0.5">Total Cubes</div>
            <div className="font-bold text-lg text-blue-300">{cubeCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[9px] mb-0.5">Flows Tracked</div>
            <div className="font-bold text-lg text-green-300">
              {metrics.totalFlows}
            </div>
          </div>
        </div>

        {/* Metrics Summary */}
        {metrics.totalFlows > 0 && (
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-[10px] mb-2">Flow Metrics</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-[10px]">Success Rate</span>
                <span className="font-bold text-[11px] text-green-300">
                  {(metrics.successRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-[10px]">
                  Buffer Hit Rate
                </span>
                <span className="font-bold text-[11px] text-yellow-300">
                  {(metrics.bufferHitRate * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-[10px]">Avg Duration</span>
                <span className="font-bold text-[11px] text-blue-300">
                  {metrics.avgDuration.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Flows */}
        {recentFlows.length > 0 && (
          <div>
            <div className="text-white/50 text-[10px] mb-2">Recent Flows</div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
              {recentFlows.reverse().map((flow) => (
                <div
                  key={flow.flowId}
                  className="bg-white/5 rounded px-2 py-1.5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white/80 text-[10px] font-medium">
                      {flow.flowId.slice(0, 8)}...
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ${
                        flow.success
                          ? "bg-green-500/20 text-green-300"
                          : flow.endTime
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {flow.success
                        ? "✓ Success"
                        : flow.endTime
                          ? "✗ Failed"
                          : "⋯ Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/40">
                    <span>{flow.events.length} events</span>
                    {flow.duration && <span>{flow.duration.toFixed(0)}ms</span>}
                    {flow.bufferHit && (
                      <span className="text-yellow-300">📦 buffered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => cubeSpaceMetrics.reset()}
            className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded text-[10px] font-medium transition-colors"
          >
            Clear Metrics
          </button>
        </div>

        {/* Instructions */}
        <div className="text-white/30 text-[9px] text-center py-2 border-t border-white/10">
          Press Cmd/Ctrl + Shift + I to toggle
        </div>
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
