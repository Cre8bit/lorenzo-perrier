import { useState, useEffect } from "react";
import {
  getQualitySettings,
  type QualitySettings as PerfQualitySettings,
} from "@/lib/performance";

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number;
  densityFactor: number;
  skipConnectionFrames: number;
}

interface QualityControlsProps {
  enabled?: boolean;
  onSettingsChange?: (settings: Partial<QualitySettings> | null) => void;
}

export const QualityControls = ({
  enabled = false,
  onSettingsChange,
}: QualityControlsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [autoDetectedSettings, setAutoDetectedSettings] =
    useState<PerfQualitySettings>(() => getQualitySettings());
  const [customSettings, setCustomSettings] = useState<QualitySettings>(() => {
    const auto = getQualitySettings();
    return {
      maxParticles: auto.maxParticles,
      connectionDistance: auto.connectionDistance,
      densityFactor: auto.densityFactor,
      skipConnectionFrames: auto.skipConnectionFrames,
    };
  });

  useEffect(() => {
    // Update auto-detected settings on window resize (device tier may change)
    const updateAutoSettings = () => {
      setAutoDetectedSettings(getQualitySettings());
    };

    window.addEventListener("resize", updateAutoSettings);
    return () => window.removeEventListener("resize", updateAutoSettings);
  }, []);

  const updateCustomSetting = (key: keyof QualitySettings, value: number) => {
    setCustomSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applyCustomSettings = () => {
    setIsAutoMode(false);
    // Only send runtime-safe parameters (exclude maxParticles and dpr)
    const runtimeSettings = {
      densityFactor: customSettings.densityFactor,
      connectionDistance: customSettings.connectionDistance,
      skipConnectionFrames: customSettings.skipConnectionFrames,
    };
    onSettingsChange?.(runtimeSettings);
  };

  const resetToAutoDetect = () => {
    setIsAutoMode(true);
    const auto = getQualitySettings();
    setCustomSettings({
      maxParticles: auto.maxParticles,
      connectionDistance: auto.connectionDistance,
      densityFactor: auto.densityFactor,
      skipConnectionFrames: auto.skipConnectionFrames,
    });
    onSettingsChange?.(null); // null = reset to auto-detect
  };

  if (!enabled || !isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg text-xs font-mono shadow-2xl border border-white/10"
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
        <div className="font-bold text-sm">
          ParticleField Quality
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            DEV
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Mode Indicator */}
      <div className="mb-4 p-2 rounded bg-white/5 border border-white/10">
        <div className="text-[10px] text-white/50 mb-1">CURRENT MODE:</div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isAutoMode ? "bg-green-400" : "bg-yellow-400"}`}
          ></div>
          <span className="font-bold text-sm">
            {isAutoMode ? "Auto-Detected" : "Custom Override"}
          </span>
        </div>
      </div>

      {/* Auto-Detected Settings Display */}
      <div className="mb-4 p-3 rounded bg-blue-500/10 border border-blue-500/20">
        <div className="text-[10px] text-blue-300 font-bold mb-2">
          AUTO-DETECTED SETTINGS:
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-white/50">Max Particles:</span>
            <span className="ml-1 text-blue-300 font-bold">
              {autoDetectedSettings.maxParticles}
            </span>
          </div>
          <div>
            <span className="text-white/50">Density:</span>
            <span className="ml-1 text-blue-300 font-bold">
              {autoDetectedSettings.densityFactor.toFixed(2)}x
            </span>
          </div>
          <div>
            <span className="text-white/50">Connection:</span>
            <span className="ml-1 text-blue-300 font-bold">
              {autoDetectedSettings.connectionDistance}px
            </span>
          </div>
          <div>
            <span className="text-white/50">Skip Frames:</span>
            <span className="ml-1 text-blue-300 font-bold">
              {autoDetectedSettings.skipConnectionFrames}
            </span>
          </div>
        </div>
        <div className="mt-2 text-[9px] text-blue-200/60">
          Active particles:{" "}
          {Math.floor(
            autoDetectedSettings.maxParticles *
              autoDetectedSettings.densityFactor,
          )}
        </div>
      </div>

      {/* Custom Settings Controls */}
      <div
        className={`transition-opacity ${isAutoMode ? "opacity-50" : "opacity-100"}`}
      >
        <div className="text-[10px] text-cyan-300 font-bold mb-3">
          CUSTOM OVERRIDE:
        </div>

        {/* Density Factor */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/70">Density Factor:</label>
            <span className="font-bold text-cyan-400">
              {customSettings.densityFactor.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={customSettings.densityFactor}
            onChange={(e) =>
              updateCustomSetting("densityFactor", parseFloat(e.target.value))
            }
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>0.1x</span>
            <span>1.0x</span>
          </div>
        </div>

        {/* Connection Distance */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/70">Connection Distance:</label>
            <span className="font-bold text-cyan-400">
              {customSettings.connectionDistance}px
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="200"
            step="10"
            value={customSettings.connectionDistance}
            onChange={(e) =>
              updateCustomSetting(
                "connectionDistance",
                parseInt(e.target.value),
              )
            }
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>60px</span>
            <span>200px</span>
          </div>
        </div>

        {/* Skip Connection Frames */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-white/70">Skip Frames (connections):</label>
            <span className="font-bold text-cyan-400">
              {customSettings.skipConnectionFrames}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={customSettings.skipConnectionFrames}
            onChange={(e) =>
              updateCustomSetting(
                "skipConnectionFrames",
                parseInt(e.target.value),
              )
            }
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>Every frame</span>
            <span>Every 5th</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={applyCustomSettings}
          disabled={
            !isAutoMode &&
            JSON.stringify(customSettings) ===
              JSON.stringify({
                maxParticles: autoDetectedSettings.maxParticles,
                connectionDistance: autoDetectedSettings.connectionDistance,
                densityFactor: autoDetectedSettings.densityFactor,
                skipConnectionFrames: autoDetectedSettings.skipConnectionFrames,
              })
          }
          className="flex-1 py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-white/5 disabled:text-white/30 border border-cyan-500/30 disabled:border-white/10 rounded text-cyan-400 disabled:text-white/30 text-xs font-bold transition-colors"
        >
          Apply Custom
        </button>
        <button
          onClick={resetToAutoDetect}
          disabled={isAutoMode}
          className="flex-1 py-2 px-4 bg-green-500/20 hover:bg-green-500/30 disabled:bg-white/5 disabled:text-white/30 border border-green-500/30 disabled:border-white/10 rounded text-green-400 disabled:text-white/30 text-xs font-bold transition-colors"
        >
          Reset to Auto
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/50">
        <p className="mb-1">💡 Auto mode uses device-tier detection</p>
        <p>⚠️ maxParticles requires remount (not runtime-safe)</p>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(34, 211, 238);
          cursor: pointer;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(34, 211, 238);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </div>
  );
};

// Hook for keyboard shortcut
export const useQualityControls = () => {
  const [enabled, setEnabled] = useState(() => {
    // Only enable if in DEV mode AND localStorage says enabled
    if (!import.meta.env.DEV) return false;
    const saved = localStorage.getItem("quality-controls-enabled");
    return saved === "true";
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + O to toggle (only works in dev mode)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "O") {
        e.preventDefault();
        setEnabled((prev) => {
          const next = !prev;
          localStorage.setItem("quality-controls-enabled", String(next));
          console.log("Quality controls:", next ? "enabled" : "disabled");
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return enabled;
};
