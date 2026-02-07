import { Html } from "@react-three/drei";

const CUBE_SIZE = 0.8;

type HoverBubbleProps = {
  name: string;
  initials?: string;
};

export const HoverBubble = ({ name, initials }: HoverBubbleProps) => {
  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <Html position={[0, CUBE_SIZE / 2 + 0.6, 0]} center distanceFactor={10}>
      <div className="pointer-events-none select-none">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background:
              "linear-gradient(145deg, hsl(220 20% 10% / 0.8), hsl(220 20% 6% / 0.65))",
            backdropFilter: "blur(18px)",
            border: "1px solid hsl(210 20% 92% / 0.07)",
            boxShadow:
              "0 6px 28px hsl(220 20% 4% / 0.45), inset 0 1px 0 hsl(210 20% 92% / 0.04)",
          }}
        >
          {/* Initials circle */}
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tracking-wider"
            style={{
              background:
                "linear-gradient(135deg, hsl(185 50% 55% / 0.25), hsl(185 40% 45% / 0.1))",
              border: "1px solid hsl(185 50% 55% / 0.3)",
              color: "hsl(185 50% 70% / 0.9)",
            }}
          >
            {displayInitials}
          </div>
          <span
            className="text-[11px] font-medium"
            style={{
              color: "hsl(210 20% 92% / 0.88)",
              fontFamily: "var(--font-body)",
            }}
          >
            {name}
          </span>
        </div>
        {/* Triangle pointer */}
        <div className="flex justify-center">
          <div
            className="mt-0.5 h-2 w-2 rotate-45"
            style={{
              background: "hsl(220 20% 8% / 0.7)",
              border: "1px solid hsl(210 20% 92% / 0.07)",
              borderTop: "none",
              borderLeft: "none",
            }}
          />
        </div>
      </div>
    </Html>
  );
};
