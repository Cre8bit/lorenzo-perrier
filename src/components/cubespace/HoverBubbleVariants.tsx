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

export const HoverBubble = ({
  name,
  initials,
  photoUrl,
  linkedinUrl,
  verified,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: HoverBubbleProps) => {
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

  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const firstName = name.split(" ")[0];

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
            // Immediately sustain hover on pointer down
            e.stopPropagation();
            onMouseEnter?.();
          }}
          onClick={(e) => {
            // Prevent default behavior and stop propagation
            e.preventDefault();
            e.stopPropagation();
            // Execute click handler
            onClick?.(e);
          }}
          role="button"
          tabIndex={-1}
        >
          <div
            className="relative flex flex-col items-center gap-2 rounded-xl px-4 py-3 min-w-[140px]"
            style={{
              background:
                "linear-gradient(145deg, hsl(220 20% 10% / 0.95), hsl(220 20% 6% / 0.90))",
              backdropFilter: "blur(20px)",
              border: "1px solid hsl(210 20% 92% / 0.1)",
              boxShadow:
                "0 8px 32px hsl(220 20% 4% / 0.6), inset 0 1px 0 hsl(210 20% 92% / 0.05)",
            }}
          >
            <div className="flex items-center gap-3 w-full">
              {/* Profile Photo / Initials */}
              <div className="relative">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.1))",
                    border: "1px solid hsl(185 50% 55% / 0.3)",
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
                      className="text-xs font-bold tracking-wider"
                      style={{ color: "hsl(185 50% 70% / 0.9)" }}
                    >
                      {displayInitials}
                    </span>
                  )}
                </div>

                {/* Verified Badge */}
                {verified && (
                  <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-emerald-500 p-[2px] shadow-sm ring-2 ring-[#0f1115]">
                    <Check size={8} className="text-white" strokeWidth={4} />
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 font-medium leading-tight">
                  Hey, I'm
                </span>
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{
                    color: "hsl(210 20% 92% / 0.95)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {firstName}!
                </span>
              </div>
            </div>

            {/* Linkedin Link - Bottom Right Minimalist & Transparent */}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full text-white hover:scale-110 transition-all cursor-pointer flex items-center justify-center group/linkedin"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "hsl(210 20% 92% / 0.08)",
                  border: "1px solid hsl(185 50% 55% / 0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Linkedin
                  size={12}
                  className="text-white group-hover/linkedin:text-[#0077b5] transition-colors"
                  strokeWidth={1.5}
                />
              </a>
            )}
          </div>

          {/* Triangle pointer */}
          <div className="flex justify-center -mt-[1px]">
            <div
              className="h-2.5 w-2.5 rotate-45 transform"
              style={{
                background: "hsl(220 20% 8% / 0.9)",
                borderRight: "1px solid hsl(210 20% 92% / 0.1)",
                borderBottom: "1px solid hsl(210 20% 92% / 0.1)",
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};
