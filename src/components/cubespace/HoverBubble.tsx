import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3, Quaternion } from "three";
import { Check, Linkedin } from "lucide-react";

const CUBE_SIZE = 0.8;

type HoverBubbleProps = {
  name: string;
  initials?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
};

/** Counter-rotate so bubble always faces camera */
function useBillboard() {
  const groupRef = useRef<Group>(null);
  const [isVisible, setIsVisible] = useState(false);

  const desiredOffset = new Vector3(0, CUBE_SIZE / 2 + 0.65, 0);
  const tempQuat = new Quaternion();
  const tempVec = new Vector3();

  useFrame(() => {
    if (groupRef.current && groupRef.current.parent) {
      const parent = groupRef.current.parent;
      parent.getWorldQuaternion(tempQuat);
      tempQuat.invert();
      tempVec.copy(desiredOffset).applyQuaternion(tempQuat);
      groupRef.current.position.copy(tempVec);
      groupRef.current.quaternion.copy(tempQuat);
      if (!isVisible) setIsVisible(true);
    }
  });

  return { groupRef, isVisible };
}

function getInitials(name: string, initials?: string) {
  return (
    initials ||
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );
}

/** Inline Row: avatar + "Hi, I'm Name" + tiny LI - Compact single-row layout */
function Bubble({
  name,
  initials,
  photoUrl,
  linkedinUrl,
  verified,
}: Omit<HoverBubbleProps, "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const di = getInitials(name, initials);
  return (
    <div
      className="group relative flex items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background:
          "linear-gradient(145deg, hsl(220 20% 10% / 0.95), hsl(220 20% 6% / 0.90))",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(210 20% 92% / 0.08)",
        boxShadow:
          "0 8px 32px hsl(220 20% 4% / 0.5), inset 0 1px 0 hsl(210 20% 92% / 0.04)",
      }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.1))",
            border: "1px solid hsl(185 50% 55% / 0.25)",
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="text-[9px] font-bold tracking-wider"
              style={{ color: "hsl(185 50% 70%)" }}
            >
              {di}
            </span>
          )}
        </div>
        {verified && (
          <div
            className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full p-[2px]"
            style={{
              background: "hsl(164 55% 48%)",
              boxShadow: "0 0 0 1.5px hsl(220 20% 8%)",
            }}
          >
            <Check size={6} className="text-white" strokeWidth={4} />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col">
        <span
          className="text-[9px] font-medium leading-tight"
          style={{ color: "hsl(215 15% 55%)" }}
        >
          Placed by
        </span>
        <span
          className="text-[12px] font-semibold whitespace-nowrap leading-tight"
          style={{ color: "hsl(210 20% 92% / 0.95)" }}
        >
          {name}
        </span>
      </div>

      {/* LinkedIn */}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open LinkedIn profile"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="
      absolute top-2 right-2
      opacity-40
      transition-opacity duration-150
      hover:opacity-90
    "
          style={{ color: "hsl(210 60% 70%)" }}
        >
          <Linkedin size={10} strokeWidth={1.25} />
        </a>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main HoverBubble — wraps bubble in billboard + pointer
   ──────────────────────────────────────────────────────────── */
export const HoverBubble = ({
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...bubbleProps
}: HoverBubbleProps) => {
  const { groupRef, isVisible } = useBillboard();

  return (
    <group ref={groupRef}>
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: "none",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      >
        <div
          className="pointer-events-auto select-none"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onPointerMove={onMouseEnter}
          onPointerDown={(e) => {
            e.stopPropagation();
            onMouseEnter?.();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick?.(e);
          }}
          role="button"
          tabIndex={-1}
        >
          <Bubble {...bubbleProps} />
          {/* Triangle pointer */}
          <div className="flex justify-center -mt-[1px]">
            <div
              className="h-2 w-2 rotate-45 transform"
              style={{
                background: "hsl(220 20% 8% / 0.9)",
                borderRight: "1px solid hsl(210 20% 92% / 0.08)",
                borderBottom: "1px solid hsl(210 20% 92% / 0.08)",
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};
