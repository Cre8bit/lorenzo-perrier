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
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              width: "min(220px, 70vw)",
              background:
                "linear-gradient(165deg, hsl(220 20% 10% / 0.85), hsl(220 20% 6% / 0.75))",
              backdropFilter: "blur(24px)",
              border: "1px solid hsl(210 20% 92% / 0.06)",
              boxShadow:
                "0 12px 48px hsl(220 20% 4% / 0.6), inset 0 1px 0 hsl(210 20% 92% / 0.04)",
            }}
          >
            {/* Top accent line — matches CubeOwnerCard */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(185 50% 55% / 0.5), transparent)",
              }}
            />

            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.08))",
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
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: "hsl(185 50% 70%)" }}
                      >
                        {displayInitials}
                      </span>
                    )}
                  </div>

                  {/* Verified badge */}
                  {verified && (
                    <div
                      className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full p-[3px]"
                      style={{
                        background: "hsl(164 55% 48%)",
                        boxShadow: "0 0 0 2px hsl(220 20% 8%)",
                      }}
                    >
                      <Check size={7} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[13px] font-semibold leading-tight truncate"
                    style={{ color: "hsl(210 20% 92% / 0.95)" }}
                  >
                    {name}
                  </span>
                  <span
                    className="text-[10px] mt-0.5"
                    style={{ color: "hsl(215 15% 55%)" }}
                  >
                    Cube contributor
                  </span>
                </div>
              </div>

              {/* LinkedIn row — integrated, not floating */}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all group/li cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "hsl(210 60% 60% / 0.06)",
                    border: "1px solid hsl(210 60% 70% / 0.1)",
                  }}
                >
                  <Linkedin
                    size={11}
                    className="shrink-0 transition-colors"
                    style={{ color: "hsl(210 60% 70% / 0.7)" }}
                    strokeWidth={1.5}
                  />
                  <span
                    className="text-[10px] font-medium tracking-wide transition-colors"
                    style={{ color: "hsl(210 60% 80% / 0.6)" }}
                  >
                    View profile
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* Triangle pointer */}
          <div className="flex justify-center -mt-[1px]">
            <div
              className="h-2.5 w-2.5 rotate-45 transform"
              style={{
                background: "hsl(220 20% 8% / 0.9)",
                borderRight: "1px solid hsl(210 20% 92% / 0.06)",
                borderBottom: "1px solid hsl(210 20% 92% / 0.06)",
              }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};
