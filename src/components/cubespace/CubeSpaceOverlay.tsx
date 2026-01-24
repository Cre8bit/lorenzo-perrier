import { useState } from "react";
import { Box, User, X } from "lucide-react";

interface CubeSpaceOverlayProps {
  cubeCount: number;
  guestName: string;
  onDropCube: () => void;
  onNameChange: (name: string) => void;
}

export const CubeSpaceOverlay = ({
  cubeCount,
  guestName,
  onDropCube,
  onNameChange,
}: CubeSpaceOverlayProps) => {
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(guestName);
  const [isHoveredDrop, setIsHoveredDrop] = useState(false);
  const [isHoveredName, setIsHoveredName] = useState(false);

  const handleNameSubmit = () => {
    onNameChange(nameInput.trim());
    setIsNameModalOpen(false);
  };

  return (
    <>
      {/* Title and hint - top left area */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <h1
          className="text-2xl md:text-3xl font-display tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(var(--foreground) / 0.6) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CubeSpace
        </h1>
        <p className="mt-2 text-xs text-muted-foreground/60 tracking-wide">
          Drop cubes together and build higher.
        </p>
      </div>

      {/* Controls - right side */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        {/* Drop Cube Button */}
        <button
          onClick={onDropCube}
          onMouseEnter={() => setIsHoveredDrop(true)}
          onMouseLeave={() => setIsHoveredDrop(false)}
          className="relative group"
        >
          <div
            className={`absolute inset-0 rounded-xl blur-xl transition-opacity duration-500 ${
              isHoveredDrop ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 70%)",
            }}
          />
          <div
            className="relative px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-300"
            style={{
              backdropFilter: "blur(16px)",
              background: isHoveredDrop
                ? "hsl(var(--primary) / 0.2)"
                : "hsl(var(--background) / 0.4)",
              border: "1px solid",
              borderColor: isHoveredDrop
                ? "hsl(var(--primary) / 0.5)"
                : "hsl(var(--foreground) / 0.08)",
              boxShadow: isHoveredDrop
                ? "0 0 30px hsl(var(--primary) / 0.2), inset 0 1px 1px hsl(var(--primary) / 0.1)"
                : "0 4px 20px hsl(0 0% 0% / 0.2)",
              transform: isHoveredDrop ? "scale(1.02)" : "scale(1)",
            }}
          >
            <Box
              className={`w-4 h-4 transition-colors duration-300 ${
                isHoveredDrop ? "text-primary" : "text-foreground/70"
              }`}
            />
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                isHoveredDrop ? "text-primary" : "text-foreground/70"
              }`}
            >
              Drop a cube
            </span>
          </div>
        </button>

        {/* Set Name Button */}
        <button
          onClick={() => setIsNameModalOpen(true)}
          onMouseEnter={() => setIsHoveredName(true)}
          onMouseLeave={() => setIsHoveredName(false)}
          className="relative group"
        >
          <div
            className="relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300"
            style={{
              backdropFilter: "blur(16px)",
              background: isHoveredName
                ? "hsl(var(--foreground) / 0.08)"
                : "hsl(var(--background) / 0.3)",
              border: "1px solid",
              borderColor: isHoveredName
                ? "hsl(var(--foreground) / 0.15)"
                : "hsl(var(--foreground) / 0.05)",
            }}
          >
            <User
              className={`w-3.5 h-3.5 transition-colors duration-300 ${
                isHoveredName
                  ? "text-foreground/80"
                  : "text-muted-foreground/60"
              }`}
            />
            <span
              className={`text-xs transition-colors duration-300 ${
                isHoveredName
                  ? "text-foreground/80"
                  : "text-muted-foreground/60"
              }`}
            >
              {guestName}
            </span>
          </div>
        </button>
      </div>

      {/* Cube Counter - bottom right (above nav) */}
      <div
        className="fixed bottom-28 right-8 pointer-events-none"
        style={{
          backdropFilter: "blur(8px)",
          background: "hsl(var(--background) / 0.3)",
          border: "1px solid hsl(var(--foreground) / 0.05)",
          borderRadius: "8px",
          padding: "8px 12px",
        }}
      >
        <span className="text-xs text-muted-foreground/60">
          Cubes dropped:{" "}
          <span className="text-foreground/80 font-medium">{cubeCount}</span>
        </span>
      </div>

      {/* Name Modal */}
      {isNameModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNameModalOpen(false);
          }}
        >
          <div
            className="absolute inset-0 bg-black/30"
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-sm rounded-xl p-5"
            style={{
              backdropFilter: "blur(20px)",
              background: "hsl(var(--background) / 0.7)",
              border: "1px solid hsl(var(--foreground) / 0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Set your name</h2>
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{
                background: "hsl(var(--background) / 0.5)",
                border: "1px solid hsl(var(--foreground) / 0.1)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "hsl(var(--primary) / 0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "hsl(var(--foreground) / 0.1)";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
              }}
              autoFocus
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: "transparent",
                  border: "1px solid hsl(var(--foreground) / 0.1)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleNameSubmit}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: "hsl(var(--primary) / 0.2)",
                  border: "1px solid hsl(var(--primary) / 0.4)",
                  color: "hsl(var(--primary))",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
