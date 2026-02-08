import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3, Quaternion } from "three";
import { Check, Linkedin, ExternalLink } from "lucide-react";

const CUBE_SIZE = 0.8;

export type BubbleVariant = "A" | "B" | "C" | "D" | "E";

type HoverBubbleProps = {
  name: string;
  initials?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  verified?: boolean;
  variant?: BubbleVariant;
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

/* ────────────────────────────────────────────────────────────
   Variant A — Inline Row: avatar + "Hi, I'm Name" + tiny LI
   Compact single-row, everything aligned horizontally
   ──────────────────────────────────────────────────────────── */
function BubbleA({ name, initials, photoUrl, linkedinUrl, verified }: Omit<HoverBubbleProps, "variant" | "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const di = getInitials(name, initials);
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background: "linear-gradient(145deg, hsl(220 20% 10% / 0.95), hsl(220 20% 6% / 0.90))",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(210 20% 92% / 0.08)",
        boxShadow: "0 8px 32px hsl(220 20% 4% / 0.5), inset 0 1px 0 hsl(210 20% 92% / 0.04)",
      }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(185 50% 55% / 0.2), hsl(185 40% 45% / 0.1))",
            border: "1px solid hsl(185 50% 55% / 0.25)",
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[9px] font-bold tracking-wider" style={{ color: "hsl(185 50% 70%)" }}>{di}</span>
          )}
        </div>
        {verified && (
          <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full p-[2px]" style={{ background: "hsl(164 55% 48%)", boxShadow: "0 0 0 1.5px hsl(220 20% 8%)" }}>
            <Check size={6} className="text-white" strokeWidth={4} />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col">
        <span className="text-[9px] font-medium leading-tight" style={{ color: "hsl(215 15% 55%)" }}>Hi, I'm</span>
        <span className="text-[12px] font-semibold whitespace-nowrap leading-tight" style={{ color: "hsl(210 20% 92% / 0.95)" }}>{name}</span>
      </div>

      {/* LinkedIn */}
      {linkedinUrl && (
        <a
          href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 ml-1 p-1 rounded-md transition-all cursor-pointer hover:brightness-150"
          onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          style={{ color: "hsl(210 60% 70% / 0.5)" }}
        >
          <Linkedin size={10} strokeWidth={1.5} />
        </a>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Variant B — Pill Tag: super compact pill with name + LI dot
   Ultra-minimal, great for dense scenes
   ──────────────────────────────────────────────────────────── */
function BubbleB({ name, linkedinUrl, verified }: Omit<HoverBubbleProps, "variant" | "onMouseEnter" | "onMouseLeave" | "onClick">) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{
        background: "linear-gradient(145deg, hsl(220 20% 10% / 0.92), hsl(220 20% 6% / 0.88))",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(210 20% 92% / 0.08)",
        boxShadow: "0 6px 24px hsl(220 20% 4% / 0.5)",
      }}
    >
      <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "hsl(210 20% 92% / 0.9)" }}>{name}</span>
      {verified && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "hsl(164 55% 55%)" }} />}
      {linkedinUrl && (
        <a
          href={linkedinUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 transition-all cursor-pointer hover:brightness-150"
          onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          style={{ color: "hsl(210 60% 65% / 0.5)" }}
        >
          <Linkedin size={9} strokeWidth={1.5} />
        </a>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Variant C — Stacked Card: two-row mini card with accent bar
   Name on top, "View on LinkedIn →" subtle link below
   ──────────────────────────────────────────────────────────── */
function BubbleC({ name, initials, photoUrl, linkedinUrl, verified }: Omit<HoverBubbleProps, "variant" | "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const di = getInitials(name, initials);
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(165deg, hsl(220 20% 10% / 0.93), hsl(220 20% 6% / 0.88))",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(210 20% 92% / 0.07)",
        boxShadow: "0 8px 32px hsl(220 20% 4% / 0.5), inset 0 1px 0 hsl(210 20% 92% / 0.03)",
      }}
    >
      {/* Accent line */}
      <div className="h-[1.5px] w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(185 50% 55% / 0.4), transparent)" }} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(185 50% 55% / 0.18), hsl(185 40% 45% / 0.08))",
              border: "1px solid hsl(185 50% 55% / 0.2)",
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[8px] font-bold tracking-wider" style={{ color: "hsl(185 50% 70%)" }}>{di}</span>
            )}
          </div>
          <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: "hsl(210 20% 92% / 0.95)" }}>{name}</span>
          {verified && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "hsl(164 55% 55%)" }} />}
        </div>
        {linkedinUrl && (
          <a
            href={linkedinUrl} target="_blank" rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1 cursor-pointer transition-all hover:brightness-150"
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          >
            <Linkedin size={8} strokeWidth={1.5} style={{ color: "hsl(210 60% 65% / 0.45)" }} />
            <span className="text-[9px] font-medium" style={{ color: "hsl(210 60% 70% / 0.4)" }}>LinkedIn</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Variant D — Speech Bubble: friendly greeting with arrow
   "Hi, I'm" prefix feels conversational
   ──────────────────────────────────────────────────────────── */
function BubbleD({ name, linkedinUrl, verified }: Omit<HoverBubbleProps, "variant" | "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const firstName = name.split(" ")[0];
  const lastName = name.split(" ").slice(1).join(" ");
  return (
    <div>
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: "linear-gradient(145deg, hsl(220 20% 10% / 0.93), hsl(220 20% 6% / 0.88))",
          backdropFilter: "blur(20px)",
          border: "1px solid hsl(210 20% 92% / 0.08)",
          boxShadow: "0 6px 24px hsl(220 20% 4% / 0.5)",
        }}
      >
        <div className="flex items-baseline gap-1">
          <span className="text-[10px]" style={{ color: "hsl(215 15% 55%)" }}>Hi, I'm</span>
          <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: "hsl(185 50% 75%)" }}>{firstName}</span>
          {lastName && <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "hsl(210 20% 92% / 0.7)" }}>{lastName}</span>}
          {verified && <div className="h-1.5 w-1.5 rounded-full shrink-0 ml-0.5" style={{ background: "hsl(164 55% 55%)" }} />}
          {linkedinUrl && (
            <a
              href={linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 ml-0.5 cursor-pointer transition-all hover:brightness-150"
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
              style={{ color: "hsl(210 60% 65% / 0.4)" }}
            >
              <ExternalLink size={9} strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Variant E — Left-accent Bar: vertical accent + name block
   Structured, editorial feel
   ──────────────────────────────────────────────────────────── */
function BubbleE({ name, initials, photoUrl, linkedinUrl, verified }: Omit<HoverBubbleProps, "variant" | "onMouseEnter" | "onMouseLeave" | "onClick">) {
  const di = getInitials(name, initials);
  return (
    <div
      className="flex overflow-hidden rounded-lg"
      style={{
        background: "linear-gradient(145deg, hsl(220 20% 10% / 0.93), hsl(220 20% 6% / 0.88))",
        backdropFilter: "blur(20px)",
        border: "1px solid hsl(210 20% 92% / 0.07)",
        boxShadow: "0 6px 24px hsl(220 20% 4% / 0.5)",
      }}
    >
      {/* Accent bar */}
      <div className="w-[2px] shrink-0" style={{ background: "hsl(185 50% 55% / 0.5)" }} />
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden"
          style={{
            background: "hsl(185 50% 55% / 0.12)",
            border: "1px solid hsl(185 50% 55% / 0.2)",
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[8px] font-bold" style={{ color: "hsl(185 50% 70%)" }}>{di}</span>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold whitespace-nowrap leading-tight" style={{ color: "hsl(210 20% 92% / 0.9)" }}>{name}</span>
            {verified && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "hsl(164 55% 55%)" }} />}
          </div>
          {linkedinUrl && (
            <a
              href={linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-0.5 cursor-pointer transition-all hover:brightness-150"
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
            >
              <Linkedin size={7} strokeWidth={1.5} style={{ color: "hsl(210 60% 65% / 0.4)" }} />
              <span className="text-[8px]" style={{ color: "hsl(215 15% 50% / 0.6)" }}>in</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Main HoverBubble — wraps variant in billboard + pointer
   ──────────────────────────────────────────────────────────── */
export const HoverBubble = ({
  variant = "A",
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...bubbleProps
}: HoverBubbleProps) => {
  const { groupRef, isVisible } = useBillboard();

  const Inner = {
    A: BubbleA,
    B: BubbleB,
    C: BubbleC,
    D: BubbleD,
    E: BubbleE,
  }[variant];

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
          onPointerDown={(e) => { e.stopPropagation(); onMouseEnter?.(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick?.(e); }}
          role="button"
          tabIndex={-1}
        >
          <Inner {...bubbleProps} />
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
