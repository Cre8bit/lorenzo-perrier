import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3, Quaternion } from "three";
import { Check, Linkedin } from "lucide-react";

const CUBE_SIZE = 0.8;

type HoverBubbleProps = {
  name?: string; // Optional - undefined/empty means unnamed cube
  initials?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
  cubeColor?: string;
  profession?: string;
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
  cubeColor,
  profession,
}: Omit<HoverBubbleProps, "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const isUnnamed = !name || name.trim() === "";
  const di = isUnnamed ? "?" : getInitials(name, initials);

  function hslToHsla(hsl: string, alpha: number) {
    // supports "hsl(185 50% 55%)" and "hsl(185, 50%, 55%)"
    const m = hsl.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%\s*\)/i);
    if (!m) return hsl; // fallback: return as-is
    const [, h, s, l] = m;
    return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
  }

  const getAvatarStyles = (color?: string) => {
    if (!color) {
      return {
        background:
          "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.1))",
        border: "1px solid hsl(185 50% 55% / 0.25)",
        textColor: "hsl(185 50% 70%)",
      };
    }

    const c25 = hslToHsla(color, 0.25);
    const c12 = hslToHsla(color, 0.12);
    const c35 = hslToHsla(color, 0.35);
    const c95 = hslToHsla(color, 0.95);

    return {
      // ONE gradient, two stops — valid
      background: `linear-gradient(135deg, ${c25}, ${c12})`,
      border: `1px solid ${c35}`,
      textColor: c95,
    };
  };

  const avatarStyles = getAvatarStyles(cubeColor);
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
            background: avatarStyles.background,
            border: avatarStyles.border,
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
              style={{ color: avatarStyles.textColor }}
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
        {isUnnamed ? (
          <>
            <span
              className="text-[10px] font-medium leading-tight whitespace-nowrap"
              style={{ color: "hsl(45 80% 65%)" }}
            >
              ✨ Click to personalize
            </span>
            <span
              className="text-[11px] font-semibold leading-tight"
              style={{ color: "hsl(185 50% 70%)" }}
            >
              Name your cube
            </span>
          </>
        ) : (
          <>
            <span
              className="text-[9px] font-medium leading-tight"
              style={{ color: "hsl(215 15% 55%)" }}
            >
              Placed by
            </span>
            <span
              className="text-[12px] font-semibold whitespace-nowrap leading-tight"
              style={{ color: avatarStyles.textColor }}
            >
              {name}
            </span>
            {profession && (
              <span
                className="text-[10px] font-light leading-tight whitespace-nowrap"
                style={{ color: "hsl(215 15% 65% / 0.8)" }}
              >
                {profession}
              </span>
            )}
          </>
        )}
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
