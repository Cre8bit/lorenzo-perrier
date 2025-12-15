import { useState, useEffect } from "react";

export interface QualitySettings {
  maxParticles: number;
  connectionDistance: number;
  densityFactor: number;
  skipConnectionFrames: number;
}

interface QualityControlsProps {
  enabled?: boolean;
  onSettingsChange?: (settings: QualitySettings) => void;
}

export const QualityControls = ({
  enabled = false,
  onSettingsChange,
}: QualityControlsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [settings, setSettings] = useState<QualitySettings>({
    maxParticles: 200,
    connectionDistance: 120,
    densityFactor: 1,
    skipConnectionFrames: 1,
  });

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem("particle-quality-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        onSettingsChange?.(parsed);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSetting = (key: keyof QualitySettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(
      "particle-quality-settings",
      JSON.stringify(newSettings)
    );
    onSettingsChange?.(newSettings);
  };

  const resetToDefaults = () => {
    const defaults: QualitySettings = {
      maxParticles: 200,
      connectionDistance: 120,
      densityFactor: 1,
      skipConnectionFrames: 1,
    };
    setSettings(defaults);
    localStorage.setItem("particle-quality-settings", JSON.stringify(defaults));
    onSettingsChange?.(defaults);
  };

  if (!enabled || !isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg text-xs font-mono shadow-2xl border border-white/10"
      style={{ minWidth: "320px", maxWidth: "400px" }}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
        <div className="font-bold text-sm">ParticleField Quality</div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Max Particles */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-white/70">Max Particles:</label>
          <span className="font-bold text-cyan-400">
            {settings.maxParticles}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="400"
          step="10"
          value={settings.maxParticles}
          onChange={(e) =>
            updateSetting("maxParticles", parseInt(e.target.value))
          }
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-[10px] text-white/40 mt-1">
          <span>50</span>
          <span>400</span>
        </div>
      </div>

      {/* Connection Distance */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-white/70">Connection Distance:</label>
          <span className="font-bold text-cyan-400">
            {settings.connectionDistance}px
          </span>
        </div>
        <input
          type="range"
          min="60"
          max="200"
          step="10"
          value={settings.connectionDistance}
          onChange={(e) =>
            updateSetting("connectionDistance", parseInt(e.target.value))
          }
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-[10px] text-white/40 mt-1">
          <span>60px</span>
          <span>200px</span>
        </div>
      </div>

      {/* Density Factor */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-white/70">Density Factor:</label>
          <span className="font-bold text-cyan-400">
            {settings.densityFactor.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.3"
          max="1.5"
          step="0.1"
          value={settings.densityFactor}
          onChange={(e) =>
            updateSetting("densityFactor", parseFloat(e.target.value))
          }
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-[10px] text-white/40 mt-1">
          <span>0.3x</span>
          <span>1.5x</span>
        </div>
      </div>

      {/* Skip Connection Frames */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-white/70">Skip Frames (connections):</label>
          <span className="font-bold text-cyan-400">
            {settings.skipConnectionFrames}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={settings.skipConnectionFrames}
          onChange={(e) =>
            updateSetting("skipConnectionFrames", parseInt(e.target.value))
          }
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-[10px] text-white/40 mt-1">
          <span>Every frame</span>
          <span>Every 5th</span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefaults}
        className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded text-cyan-400 text-xs font-bold transition-colors"
      >
        Reset to Defaults
      </button>

      {/* Info */}
      <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-white/50">
        <p className="mb-1">💡 Lower values = better performance</p>
        <p>Settings persist across sessions</p>
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
    const saved = localStorage.getItem("quality-controls-enabled");
    return saved === "true";
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + Q to toggle
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
