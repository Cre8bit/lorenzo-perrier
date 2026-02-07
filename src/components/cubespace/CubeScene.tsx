import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  Html,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getRandomColor } from "@/components/cubespace/cubeColors";
import type {
  CubeProfile,
  CubeProfileMap,
} from "@/components/cubespace/cubeProfiles";
import type { Vec3, CubeDomain } from "@/types/CubeModel";
import { BidirectionalMap } from "@/utils/BidirectionalMap";
import {
  reportFramePerformance,
  reportPerformance,
} from "@/components/ui/performance-overlay";
import { HoverBubble } from "./HoverBubbleVariants";

const FLOOR_Y = 0;
const CUBE_SIZE = 0.8;

const DROP_CLEARANCE = 8;
const DROP_PLANE_MAX_RADIUS = 7;
const FLAG_OFFSET = 0.45;
const HEIGHT_EPS = 0.0005;

// Internal representation for rendering
interface RenderCube {
  sceneId: number; // Stable numeric ID for rendering/physics
  localId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  quaternion?: [number, number, number, number]; // Preferred rotation format
  color: string;
  status: CubeDomain["status"];
  impulse?: [number, number, number];
  createdAt: number;
}

export type CubeSceneStats = {
  cubeCount: number;
  towerHeight: number;
};

type Props = {
  isPlacing?: boolean;
  onStatsChange?: (s: CubeSceneStats) => void;
  selectedColor?: string;
  onCubeDropped?: (payload: {
    localId: string;
    dropPosition: Vec3;
    color: string;
    createdAt: number;
  }) => void;
  onCubeSettled?: (payload: {
    localId: string;
    finalPosition: Vec3;
    finalRotation: { x: number; y: number; z: number; w: number };
  }) => void;
  onFocusComplete?: (payload: { localId: string }) => void;
  onActiveCubeScreenChange?: (payload: {
    localId: string | null;
    x: number;
    y: number;
    visible: boolean;
  }) => void;
  onSceneReady?: () => void;

  cubes?: CubeDomain[]; // Controlled cubes prop
  cubeProfiles?: CubeProfileMap; // Keyed by localId (UUID string)

  focusCubeId?: string | null;
  activeCubeId?: string | null;
  ownerCardOpen?: boolean;
  active?: boolean;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function lerpAngle(a: number, b: number, t: number) {
  const delta =
    THREE.MathUtils.euclideanModulo(b - a + Math.PI, Math.PI * 2) - Math.PI;
  return a + delta * t;
}

const InfiniteGrid = () => {
  return (
    <Grid
      position={[0, 0.01, 0]}
      infiniteGrid
      fadeDistance={45}
      fadeStrength={2.5}
      cellSize={1}
      cellThickness={0.35}
      sectionSize={4}
      sectionThickness={1}
      cellColor={"hsl(186, 38%, 38%)"}
      sectionColor={"hsl(249, 39%, 32%)"}
    />
  );
};

const DropPlane = ({
  enabled,
  y,
  onPlace,
  color,
  center,
  guard,
}: {
  enabled: boolean;
  y: number;
  onPlace: (pos: THREE.Vector3) => void;
  color: string;
  center: { x: number; z: number };
  guard: {
    placingStartedAtRef: { current: number };
    lastWheelAtRef: { current: number };
  };
}) => {
  const planeRef = useRef<THREE.Mesh>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const zoneRef = useRef<THREE.Mesh>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);

  const [hoverPos, setHoverPos] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (planeRef.current) planeRef.current.position.y = y;
    if (zoneRef.current) zoneRef.current.position.y = y + 0.01;
  }, [y]);

  useFrame(() => {
    if (!enabled) return;
    if (ghostRef.current && hoverPos) {
      ghostRef.current.position.copy(hoverPos);
      ghostRef.current.position.y = y + CUBE_SIZE / 2;
    }
    if (ringRef.current && hoverPos) {
      ringRef.current.position.set(hoverPos.x, y + 0.03, hoverPos.z);
    }
  });

  if (!enabled) return null;

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    const t0 = performance.now();
    const p = e.point as THREE.Vector3;
    const dx = p.x - center.x;
    const dz = p.z - center.z;
    const r = Math.sqrt(dx * dx + dz * dz);
    if (r > DROP_PLANE_MAX_RADIUS) {
      const t = DROP_PLANE_MAX_RADIUS / (r || 1);
      setHoverPos(new THREE.Vector3(center.x + dx * t, y, center.z + dz * t));
    } else {
      setHoverPos(new THREE.Vector3(p.x, y, p.z));
    }

    if (pointerDownRef.current) {
      const dx = e.clientX - pointerDownRef.current.x;
      const dy = e.clientY - pointerDownRef.current.y;
      if (dx * dx + dy * dy > 36) {
        pointerMovedRef.current = true;
      }
    }
    reportPerformance("DropPlane:hover", performance.now() - t0);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    pointerMovedRef.current = false;
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    const t0 = performance.now();
    if (!hoverPos) return;
    const now = Date.now();
    const recentlyEnabled = now - guard.placingStartedAtRef.current < 350;
    const recentlyWheeled = now - guard.lastWheelAtRef.current < 300;
    if (recentlyEnabled || recentlyWheeled) {
      pointerDownRef.current = null;
      pointerMovedRef.current = false;
      return;
    }
    if (pointerMovedRef.current) {
      pointerDownRef.current = null;
      pointerMovedRef.current = false;
      return;
    }
    e.stopPropagation();
    onPlace(new THREE.Vector3(hoverPos.x, y, hoverPos.z));
    pointerDownRef.current = null;
    pointerMovedRef.current = false;
    reportPerformance("DropPlane:click", performance.now() - t0);
  };

  return (
    <group>
      <mesh
        ref={zoneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center.x, y + 0.01, center.z]}
      >
        <circleGeometry args={[DROP_PLANE_MAX_RADIUS, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center.x, y + 0.02, center.z]}
      >
        <ringGeometry
          args={[
            DROP_PLANE_MAX_RADIUS - 0.05,
            DROP_PLANE_MAX_RADIUS + 0.05,
            96,
          ]}
        />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center.x, y, center.z]}
        onPointerMove={handleMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[center.x, y + 0.03, center.z]}
      >
        <ringGeometry args={[0.55, 0.75, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>

      <mesh ref={ghostRef} position={[center.x, y + CUBE_SIZE / 2, center.z]}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.18}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};

const CubeRigid = ({
  cube,
  onRegister,
  profile,
  isHovered,
  isSelected,
  onHover,
  onClick,
  hoverEnabled,
  highlight,
}: {
  cube: RenderCube;
  onRegister: (sceneId: number, api: RapierRigidBody | null) => void;
  profile?: CubeProfile;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (sceneId: number | null) => void;
  onClick?: (sceneId: number) => void;
  hoverEnabled?: boolean;
  highlight?: boolean;
}) => {
  const bodyRef = useRef<RapierRigidBody | null>(null);
  const displayName = profile?.fullName;
  const showBubble = Boolean(displayName && (isHovered || isSelected));

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    const t0 = performance.now();
    if (!hoverEnabled) return;
    e.stopPropagation();
    onHover?.(cube.sceneId);
    reportPerformance("CubeRigid:hover", performance.now() - t0);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    const t0 = performance.now();
    if (!hoverEnabled) return;
    e.stopPropagation();
    onHover?.(null);
    reportPerformance("CubeRigid:unhover", performance.now() - t0);
  };

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverEnabled) return; // Reuse hoverEnabled as "interactEnabled"
    e.stopPropagation();
    onClick?.(cube.sceneId);
  };

  useEffect(() => {
    if (bodyRef.current && cube.impulse) {
      const [x, y, z] = cube.impulse;
      bodyRef.current.setLinvel({ x, y, z }, true);
    }
  }, [cube.impulse]);

  return (
    <RigidBody
      ref={(api) => {
        bodyRef.current = api;
        onRegister(cube.sceneId, api);
      }}
      colliders={false}
      position={cube.position}
      rotation={cube.rotation}
      restitution={0.12}
      friction={0.7}
      linearDamping={0.4}
      angularDamping={0.6}
      canSleep
    >
      <CuboidCollider args={[CUBE_SIZE / 2, CUBE_SIZE / 2, CUBE_SIZE / 2]} />
      <group>
        <mesh
          castShadow
          receiveShadow
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
          <meshStandardMaterial
            color={cube.color}
            roughness={0.82}
            metalness={0.08}
          />
        </mesh>
        {/* Visual highlighting - selected takes precedence over hover */}
        {isSelected ? (
          <HighlightShell color="hsl(185, 60%, 62%)" maxOpacity={0.35} />
        ) : isHovered && hoverEnabled ? (
          <HighlightShell color="hsl(0, 0%, 95%)" maxOpacity={0.12} />
        ) : null}
        {/* Additional highlight for active cube in owner card */}
        {highlight && !isSelected && (
          <HighlightShell color="hsl(185, 60%, 62%)" maxOpacity={0.28} />
        )}
        {profile?.photoUrl && (
          <PhotoBadge url={profile.photoUrl} verified={profile.verified} />
        )}
        {showBubble && displayName ? (
          <HoverBubble
            name={displayName}
            initials={
              profile?.firstName && profile?.lastName
                ? `${profile.firstName[0]}${profile.lastName[0]}`
                : undefined
            }
          />
        ) : null}
      </group>
    </RigidBody>
  );
};

const FlagMarker = ({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) => {
  const { scene } = useGLTF("/flag.glb");
  const flagScene = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={position} rotation={rotation} scale={[0.6, 0.6, 0.6]}>
      <primitive object={flagScene} />
    </group>
  );
};

const PhotoBadge = ({ url, verified }: { url: string; verified?: boolean }) => {
  const texture = useTexture(url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <group position={[0, 0, CUBE_SIZE / 2 + 0.01]}>
      <mesh>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.98}
          toneMapped={false}
        />
      </mesh>
      {verified && (
        <mesh position={[0.17, 0.17, 0.01]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial
            color="hsl(164, 55%, 58%)"
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  );
};

const HighlightShell = ({
  color = "hsl(185, 60%, 62%)",
  maxOpacity = 0.28,
}: {
  color?: string;
  maxOpacity?: number;
}) => {
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    const next = Math.min(maxOpacity, opacityRef.current + delta * 1.2);
    if (next === opacityRef.current) return;
    opacityRef.current = next;
    if (materialRef.current) {
      materialRef.current.opacity = next;
    }
  });

  return (
    <mesh raycast={() => null}>
      <boxGeometry
        args={[CUBE_SIZE + 0.06, CUBE_SIZE + 0.06, CUBE_SIZE + 0.06]}
      />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        wireframe
      />
    </mesh>
  );
};

const SceneContent = ({
  isPlacing,
  onStatsChange,
  selectedColor,
  onCubeDropped,
  onCubeSettled,
  onFocusComplete,
  onActiveCubeScreenChange,
  onSceneReady,
  cubes = [],
  cubeProfiles,
  focusCubeId,
  activeCubeId,
  ownerCardOpen,
  active = true,
}: Props) => {
  // --- ID Mapping ---
  // Map localId (stable string) <-> sceneId (stable number for physics/rendering)
  // Using BidirectionalMap for automatic consistency
  const idMappingRef = useRef(new BidirectionalMap<string, number>());
  const nextSceneIdRef = useRef(2000);

  // --- Derived State ---
  const renderCubes = useMemo<RenderCube[]>(() => {
    return cubes.map((c) => {
      let sid = idMappingRef.current.getByKey(c.localId);
      if (sid === undefined) {
        sid = nextSceneIdRef.current++;
        idMappingRef.current.set(c.localId, sid);
      }

      const useFinal = c.status !== "draft" && c.finalPosition;
      const x = useFinal ? c.finalPosition!.x : c.dropPosition.x;
      const y = useFinal ? c.finalPosition!.y : c.dropPosition.y;
      const z = useFinal ? c.finalPosition!.z : c.dropPosition.z;

      const renderCube: RenderCube = {
        sceneId: sid,
        localId: c.localId,
        position: [x, y, z],
        rotation: [0, 0, 0], // Fallback Euler angles
        color: c.color,
        status: c.status,
        createdAt: c.createdAtLocal,
      };

      // Apply saved rotation if available (Quaternion format)
      if (c.finalRotation) {
        // Convert quaternion to Euler angles for RigidBody
        const quat = new THREE.Quaternion(
          c.finalRotation.x,
          c.finalRotation.y,
          c.finalRotation.z,
          c.finalRotation.w,
        );
        const euler = new THREE.Euler().setFromQuaternion(quat);
        renderCube.rotation = [euler.x, euler.y, euler.z];

        // Keep quaternion for reference
        renderCube.quaternion = [
          c.finalRotation.x,
          c.finalRotation.y,
          c.finalRotation.z,
          c.finalRotation.w,
        ];
      }

      return renderCube;
    });
  }, [cubes]);

  const [towerHeight, setTowerHeight] = useState(0);
  const [hoveredCubeId, setHoveredCubeId] = useState<number | null>(null); // Scene ID
  const [selectedCubeId, setSelectedCubeId] = useState<number | null>(null); // Scene ID - Click selection
  const [isSimulating, setIsSimulating] = useState(false);
  const [flagPose, setFlagPose] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
  } | null>(null);

  // Refs
  const pendingPlaceIdRef = useRef<number | null>(null); // Scene ID
  const pendingPlaceSettledFramesRef = useRef(0);
  const isDropLockedRef = useRef(false);
  const wasActiveRef = useRef(active);
  const flagCubeIdRef = useRef<number | null>(null); // Scene ID
  const flagLockIdRef = useRef<number | null>(null); // Scene ID
  const lastHighestSettledIdRef = useRef<number | null>(null); // Scene ID
  const lastHighestSettledPosRef = useRef<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const flagRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const flagRotationReadyRef = useRef(false);
  const bodyMapRef = useRef<Map<number, RapierRigidBody>>(new Map()); // Key: Scene ID
  const updateTickRef = useRef(0);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const fallbackColorRef = useRef(getRandomColor());
  const initialCameraSetRef = useRef(false);
  const sceneReadyRef = useRef(false);
  const initialSimulationCompleteRef = useRef(false);
  const baseTargetRef = useRef({
    target: new THREE.Vector3(0, 2, 0),
    distance: 10,
  });
  const [focusDistance, setFocusDistance] = useState(6);
  const pendingFocusRef = useRef<{ id: number } | null>(null); // Scene ID
  const dropInFlightRef = useRef(false);
  const lastDropSettledAtRef = useRef<number | null>(null);
  const lastScreenRef = useRef<{
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);
  const desiredDistanceRef = useRef(10);
  const placingStartedAtRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const simulatingRef = useRef(false);
  const placementTargetRef = useRef(0);
  const placementDistanceRef = useRef(0);

  // Camera navigation detection
  const isNavigatingCameraRef = useRef(false);

  // Hover debounce/hysteresis
  const hoverTimerRef = useRef<number | null>(null);
  const pendingHoverIdRef = useRef<number | null>(null);

  const transitionRef = useRef<{
    active: boolean;
    progress: number;
    duration: number;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromDistance: number;
    toDistance: number;
    fromTheta: number;
    toTheta: number;
    fromPhi: number;
    toPhi: number;
    kind: "base" | "placing" | "focus";
    focusId: number | null; // Scene ID
  }>({
    active: false,
    progress: 0,
    duration: 1.1,
    fromTarget: new THREE.Vector3(0, 0, 0),
    toTarget: new THREE.Vector3(0, 0, 0),
    fromDistance: 0,
    toDistance: 0,
    fromTheta: 0,
    toTheta: 0,
    fromPhi: Math.PI / 3,
    toPhi: Math.PI / 3,
    kind: "base",
    focusId: null,
  });
  const { camera, size } = useThree();

  const dropY = useMemo(() => {
    const base = Math.max(8, towerHeight + DROP_CLEARANCE);
    return clamp(base, 8, 60);
  }, [towerHeight]);

  const desiredDistance = useMemo(
    () => clamp(8 + towerHeight * 0.75, 8, 42),
    [towerHeight],
  );

  const placementTargetY = useMemo(() => clamp(dropY * 0.6, 5, 30), [dropY]);
  const placementDistance = useMemo(
    () => clamp(16 + dropY * 1.1, 22, 90),
    [dropY],
  );

  useEffect(() => {
    desiredDistanceRef.current = desiredDistance;
  }, [desiredDistance]);

  useEffect(() => {
    placementTargetRef.current = placementTargetY;
    placementDistanceRef.current = placementDistance;
  }, [placementDistance, placementTargetY]);

  // NOTE: createdAtMap removed as it's not strictly needed if we have store access or pass via props.
  // But if sorting relies on it...
  // Actually, we can just use renderCubes index or createdAt property.

  useEffect(() => {
    if (isPlacing) {
      // Clear all highlights when starting to add a cube
      setHoveredCubeId(null);
      setSelectedCubeId(null);
      dropInFlightRef.current = false;
      placingStartedAtRef.current = Date.now();
    }
    if (!isPlacing) {
      isDropLockedRef.current = false;
      if (!dropInFlightRef.current) {
        pendingPlaceIdRef.current = null;
        pendingPlaceSettledFramesRef.current = 0;
      }
    }
  }, [isPlacing]);

  useEffect(() => {
    if (ownerCardOpen) {
      setHoveredCubeId(null);
    }
  }, [ownerCardOpen]);

  // Clear hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlacing) return;
    const handleWheel = () => {
      lastWheelAtRef.current = Date.now();
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isPlacing]);

  const beginTransition = useCallback(
    (
      target: THREE.Vector3,
      distance: number,
      duration = 1.15,
      meta?: { kind?: "base" | "placing" | "focus"; focusId?: number | null },
    ) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const currentTarget = controls.target.clone();
      const offset = camera.position.clone().sub(currentTarget);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const startDistance = offset.length();
      const kind = meta?.kind ?? "base";
      const fromTheta = spherical.theta;
      const fromPhi = spherical.phi;
      const toTheta = kind === "placing" ? Math.PI / 4 : fromTheta;
      const toPhi = kind === "placing" ? Math.PI / 3 : fromPhi;

      transitionRef.current = {
        active: true,
        progress: 0,
        duration,
        fromTarget: currentTarget,
        toTarget: target.clone(),
        fromDistance: startDistance,
        toDistance: distance,
        fromTheta,
        toTheta,
        fromPhi,
        toPhi,
        kind,
        focusId: meta?.focusId ?? null,
      };
      controls.enabled = false;
    },
    [camera],
  );

  const resolveCubePosition = useCallback(
    (sceneId: number) => {
      const body = bodyMapRef.current.get(sceneId);
      const bodyPos = body?.translation?.();
      if (bodyPos) return new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z);
      const fallback = renderCubes.find((cube) => cube.sceneId === sceneId);
      if (!fallback) return null;
      return new THREE.Vector3(
        fallback.position[0],
        fallback.position[1],
        fallback.position[2],
      );
    },
    [renderCubes],
  );

  // Debounced hover handler with camera navigation check
  const handleHoverChange = useCallback((sceneId: number | null) => {
    // Immediate clear if null or navigation active
    if (sceneId === null || isNavigatingCameraRef.current) {
      if (hoverTimerRef.current !== null) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      pendingHoverIdRef.current = null;
      setHoveredCubeId(null);
      return;
    }

    // Debounce hover updates (50ms hysteresis to prevent flicker)
    pendingHoverIdRef.current = sceneId;
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      if (
        pendingHoverIdRef.current === sceneId &&
        !isNavigatingCameraRef.current
      ) {
        setHoveredCubeId(sceneId);
      }
      hoverTimerRef.current = null;
    }, 50);
  }, []);

  // Camera navigation handlers
  const handleCameraNavigationStart = useCallback(() => {
    isNavigatingCameraRef.current = true;
    // Clear hover immediately when navigation starts
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    pendingHoverIdRef.current = null;
    setHoveredCubeId(null);
  }, []);

  const handleCameraNavigationEnd = useCallback(() => {
    isNavigatingCameraRef.current = false;
  }, []);

  useEffect(() => {
    if (!controlsRef.current || !initialCameraSetRef.current) return;
    if (isPlacing) {
      if (dropInFlightRef.current) return;
      beginTransition(
        new THREE.Vector3(0, placementTargetRef.current, 0),
        placementDistanceRef.current,
        1.05,
        { kind: "placing" },
      );
      return;
    }
    // Lookup scene ID from localId
    const focusSceneId = focusCubeId
      ? idMappingRef.current.getByKey(focusCubeId)
      : null;

    if (focusSceneId != null) return;
    if (dropInFlightRef.current) return;
    if (lastDropSettledAtRef.current) {
      const elapsed = Date.now() - lastDropSettledAtRef.current;
      if (elapsed < 700) return;
      lastDropSettledAtRef.current = null;
    }
    beginTransition(
      baseTargetRef.current.target.clone(),
      baseTargetRef.current.distance,
      1.1,
      {
        kind: "base",
      },
    );
  }, [beginTransition, focusCubeId, isPlacing]);

  useEffect(() => {
    if (!controlsRef.current || !initialCameraSetRef.current) return;

    const focusSceneId = focusCubeId
      ? idMappingRef.current.getByKey(focusCubeId)
      : null;
    if (focusSceneId == null) {
      return;
    }
    if (isPlacing) return;

    lastDropSettledAtRef.current = null;
    const focusPos = resolveCubePosition(focusSceneId);
    if (!focusPos) {
      // If we can't get position yet, defer to pending focus mechanism
      pendingFocusRef.current = { id: focusSceneId };
      return;
    }
    const target = focusPos.clone().add(new THREE.Vector3(0, 0.15, 0));
    const nextDistance = clamp(5.2 + target.y * 0.08, 5.2, 12);
    setFocusDistance(nextDistance);
    beginTransition(target, nextDistance, 0.95, {
      kind: "focus",
      focusId: focusSceneId,
    });
    pendingFocusRef.current = null;
  }, [beginTransition, focusCubeId, isPlacing, resolveCubePosition]);

  useEffect(() => {
    onStatsChange?.({ cubeCount: renderCubes.length, towerHeight });
  }, [renderCubes.length, towerHeight, onStatsChange]);

  const registerBody = useCallback(
    (id: number, api: RapierRigidBody | null) => {
      if (api) bodyMapRef.current.set(id, api);
      else bodyMapRef.current.delete(id);
    },
    [],
  );

  useFrame(() => {
    const t0 = performance.now();
    if (!active) return;
    updateTickRef.current += 1;
    if (updateTickRef.current % 4 !== 0) return;

    let maxSettledTop = 0;
    let hasActive = false;
    let highestSettledTop = -Infinity;
    let highestSettledId: number | null = null;
    let highestSettledPos = { x: 0, y: 0, z: 0 };
    let highestSettledCreatedAt = -Infinity;
    let highestOverallTop = -Infinity;
    let highestOverallId: number | null = null;
    let highestOverallPos = { x: 0, y: 0, z: 0 };

    bodyMapRef.current.forEach((api, id) => {
      const pos = api?.translation?.() ?? { x: 0, y: 0, z: 0 };
      const topY = pos.y + CUBE_SIZE / 2;
      if (topY > highestOverallTop) {
        highestOverallTop = topY;
        highestOverallId = id ?? null;
        highestOverallPos = pos;
      }
      const lin = api?.linvel?.() ?? { x: 0, y: 0, z: 0 };
      const ang = api?.angvel?.() ?? { x: 0, y: 0, z: 0 };
      const speed = Math.hypot(lin.x, lin.y, lin.z);
      const spin = Math.hypot(ang.x, ang.y, ang.z);
      const isSettled = api?.isSleeping?.() ?? (speed < 0.05 && spin < 0.05);
      if (!isSettled) {
        hasActive = true;
        return;
      }
      maxSettledTop = Math.max(maxSettledTop, topY);

      // Find createdAt from renderCubes
      const cube = renderCubes.find((c) => c.sceneId === id);
      const createdAt = cube?.createdAt;

      const recency = createdAt ?? id ?? 0;
      const isHigher = topY > highestSettledTop + HEIGHT_EPS;
      const isTie = Math.abs(topY - highestSettledTop) <= HEIGHT_EPS;
      if (isHigher || (isTie && recency >= highestSettledCreatedAt)) {
        highestSettledTop = topY;
        highestSettledId = id ?? null;
        highestSettledPos = pos;
        highestSettledCreatedAt = recency;
      }
    });

    if (!initialCameraSetRef.current && controlsRef.current) {
      const nextDistance = desiredDistanceRef.current || 10;
      // Force initial focus to center (0,0,0) as requested
      const target = new THREE.Vector3(0, 0, 0);

      const dir = new THREE.Vector3(1, 0.9, 1).normalize();
      const desiredPos = target.clone().add(dir.multiplyScalar(nextDistance));
      camera.position.copy(desiredPos);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
      baseTargetRef.current = { target, distance: nextDistance };
      initialCameraSetRef.current = true;
    }

    if (simulatingRef.current !== hasActive) {
      simulatingRef.current = hasActive;
      setIsSimulating(hasActive);
      if (hasActive) setHoveredCubeId(null);
    }

    // Track when initial simulation completes
    if (
      !hasActive &&
      !initialSimulationCompleteRef.current &&
      bodyMapRef.current.size > 0
    ) {
      initialSimulationCompleteRef.current = true;
    }

    wasActiveRef.current = hasActive;

    if (!hasActive) {
      const nextHeight = bodyMapRef.current.size > 0 ? maxSettledTop : 0;
      const nextDistance = clamp(8 + nextHeight * 0.75, 8, 42);
      setTowerHeight(nextHeight);
      desiredDistanceRef.current = nextDistance;
      lastHighestSettledIdRef.current = highestSettledId;
      lastHighestSettledPosRef.current =
        highestSettledId !== null ? highestSettledPos : null;
      if (highestSettledId !== null) {
        const target = new THREE.Vector3(
          highestSettledPos.x,
          highestSettledPos.y,
          highestSettledPos.z,
        );
        baseTargetRef.current = { target, distance: nextDistance };
        if (!initialCameraSetRef.current && controlsRef.current) {
          const dir = new THREE.Vector3(1, 0.9, 1).normalize();
          const desiredPos = target
            .clone()
            .add(dir.multiplyScalar(nextDistance));
          camera.position.copy(desiredPos);
          controlsRef.current.target.copy(target);
          controlsRef.current.update();
          initialCameraSetRef.current = true;
        }
      } else if (!initialCameraSetRef.current && controlsRef.current) {
        const target = new THREE.Vector3(0, 1.4, 0);
        const dir = new THREE.Vector3(1, 0.9, 1).normalize();
        const desiredPos = target.clone().add(dir.multiplyScalar(nextDistance));
        camera.position.copy(desiredPos);
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
        baseTargetRef.current = { target, distance: nextDistance };
        initialCameraSetRef.current = true;
      }
    }

    if (hasActive && flagLockIdRef.current !== null) {
      const locked = bodyMapRef.current.get(flagLockIdRef.current);
      const pos = locked?.translation?.();
      if (pos) {
        setFlagPose({
          position: [pos.x, pos.y + CUBE_SIZE / 2 + FLAG_OFFSET, pos.z],
          rotation: flagRotationRef.current,
        });
      }
    }

    if (!hasActive && highestSettledId !== null) {
      const prevFlagId = flagCubeIdRef.current;
      const shouldUpdatePose = highestSettledId !== prevFlagId || !flagPose;
      if (shouldUpdatePose) {
        flagCubeIdRef.current = highestSettledId;
        flagLockIdRef.current = null;
        if (highestSettledId !== prevFlagId || !flagPose) {
          flagRotationRef.current = [
            (Math.random() - 0.5) * 0.25,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.25,
          ];
          flagRotationReadyRef.current = true;
        }
        setFlagPose({
          position: [
            highestSettledPos.x,
            highestSettledPos.y + CUBE_SIZE / 2 + FLAG_OFFSET,
            highestSettledPos.z,
          ],
          rotation: flagRotationRef.current,
        });
      }
    } else if (!hasActive && highestSettledId === null && flagPose) {
      setFlagPose(null);
    }

    const bodiesReady =
      bodyMapRef.current.size >= renderCubes.length ||
      (renderCubes.length === 0 && bodyMapRef.current.size === 0);

    const towerReady =
      renderCubes.length === 0 || // No cubes, ready immediately
      (initialSimulationCompleteRef.current &&
        !hasActive &&
        flagPose !== null &&
        towerHeight > 0); // Initial sim done, settled, flag positioned, height calculated

    if (
      !sceneReadyRef.current &&
      bodiesReady &&
      initialCameraSetRef.current &&
      towerReady
    ) {
      sceneReadyRef.current = true;
      onSceneReady?.();
    }

    const pendingId = pendingPlaceIdRef.current;
    if (pendingId !== null) {
      const api = bodyMapRef.current.get(pendingId);
      if (api) {
        const lin = api?.linvel?.() ?? { x: 0, y: 0, z: 0 };
        const ang = api?.angvel?.() ?? { x: 0, y: 0, z: 0 };
        const speed = Math.hypot(lin.x, lin.y, lin.z);
        const spin = Math.hypot(ang.x, ang.y, ang.z);
        const isSettled = api?.isSleeping?.() ?? (speed < 0.05 && spin < 0.05);
        if (isSettled) {
          pendingPlaceSettledFramesRef.current += 1;
        } else {
          pendingPlaceSettledFramesRef.current = 0;
        }
        if (pendingPlaceSettledFramesRef.current >= 2 && !hasActive) {
          pendingPlaceIdRef.current = null;
          pendingPlaceSettledFramesRef.current = 0;
          dropInFlightRef.current = false;
          lastDropSettledAtRef.current = Date.now();
          const finalPos = api?.translation?.() ?? { x: 0, y: 0, z: 0 };
          const finalRot = api?.rotation?.() ?? { x: 0, y: 0, z: 0, w: 1 };
          const localId = idMappingRef.current.getByValue(pendingId);
          if (localId) {
            onCubeSettled?.({
              localId,
              finalPosition: { x: finalPos.x, y: finalPos.y, z: finalPos.z },
              finalRotation: {
                x: finalRot.x,
                y: finalRot.y,
                z: finalRot.z,
                w: finalRot.w,
              },
            });
          }
        }
      }
    } else if (!hasActive) {
      dropInFlightRef.current = false;
    }

    reportFramePerformance("CubeScene:physics", t0);
  });

  useFrame((_, delta) => {
    const t0 = performance.now();
    if (!active) return;
    if (!transitionRef.current.active || !controlsRef.current) return;
    const t = transitionRef.current;
    t.progress = Math.min(1, t.progress + delta / t.duration);
    const eased = t.progress * t.progress * (3 - 2 * t.progress);
    const distanceValue =
      t.fromDistance + (t.toDistance - t.fromDistance) * eased;

    const target = t.fromTarget.clone().lerp(t.toTarget, eased);
    const theta = lerpAngle(t.fromTheta, t.toTheta, eased);
    const phi = THREE.MathUtils.lerp(t.fromPhi, t.toPhi, eased);
    const spherical = new THREE.Spherical(distanceValue, phi, theta);
    const desiredPos = new THREE.Vector3()
      .setFromSpherical(spherical)
      .add(target);

    camera.position.copy(desiredPos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();

    if (t.progress >= 1) {
      transitionRef.current.active = false;
      controlsRef.current.enabled = true;
      if (t.kind === "focus" && t.focusId != null) {
        const localId = idMappingRef.current.getByValue(t.focusId);
        if (localId) {
          onFocusComplete?.({ localId });
        }
      }
    }

    reportFramePerformance("CubeScene:transition", t0);
  });

  useFrame(() => {
    const t0 = performance.now();
    if (!active) return;
    if (transitionRef.current.active) return;
    if (isPlacing) return;

    const pending = pendingFocusRef.current;
    if (!pending) return;

    // If we're waiting for this specific cube to settle, defer transition
    if (pendingPlaceIdRef.current === pending.id) return;

    const focusSceneId = focusCubeId
      ? idMappingRef.current.getByKey(focusCubeId)
      : null;
    if (pending.id !== focusSceneId || focusSceneId == null) {
      pendingFocusRef.current = null;
      return;
    }
    const focusPos = resolveCubePosition(pending.id);
    if (!focusPos) return;
    const target = focusPos.clone().add(new THREE.Vector3(0, 0.15, 0));
    const nextDistance = clamp(5.2 + target.y * 0.08, 5.2, 12);
    setFocusDistance(nextDistance);
    beginTransition(target, nextDistance, 0.95, {
      kind: "focus",
      focusId: pending.id,
    });
    pendingFocusRef.current = null;

    reportFramePerformance("CubeScene:pendingFocus", t0);
  });

  useFrame(() => {
    const t0 = performance.now();
    if (!active) return;
    if (!onActiveCubeScreenChange) return;
    if (!ownerCardOpen || activeCubeId == null) {
      if (lastScreenRef.current?.visible !== false) {
        lastScreenRef.current = { x: 0, y: 0, visible: false };
        onActiveCubeScreenChange({ localId: null, x: 0, y: 0, visible: false });
      }
      reportFramePerformance("CubeScene:screenTrack", t0);
      return;
    }
    const x = size.width * 0.5;
    const y = size.height * 0.5;
    const visible = true;
    lastScreenRef.current = { x, y, visible };
    onActiveCubeScreenChange({ localId: activeCubeId, x, y, visible });

    reportFramePerformance("CubeScene:screenTrack", t0);
  });

  const handleCubeClick = useCallback(
    (sceneId: number) => {
      const t0 = performance.now();
      // Don't allow selection while placing or if owner card is open
      if (isPlacing || ownerCardOpen || isSimulating) return;

      setSelectedCubeId(sceneId);

      const focusPos = resolveCubePosition(sceneId);
      if (!focusPos) return;

      const target = focusPos.clone().add(new THREE.Vector3(0, 0.15, 0));
      // Calculate optimal distance based on height
      const nextDistance = clamp(5.2 + target.y * 0.08, 5.2, 12);

      setFocusDistance(nextDistance);
      beginTransition(target, nextDistance, 0.95, {
        kind: "focus",
        focusId: sceneId,
      });
      reportPerformance("CubeScene:cubeClick", performance.now() - t0);
    },
    [
      isPlacing,
      ownerCardOpen,
      isSimulating,
      resolveCubePosition,
      beginTransition,
    ],
  );

  const handleAddCube = useCallback(
    (pos: THREE.Vector3) => {
      if (isDropLockedRef.current) return;
      isDropLockedRef.current = true;
      dropInFlightRef.current = true;

      // Pre-generate ID
      const localId = crypto.randomUUID();
      // Reserve Scene ID
      const sceneId = nextSceneIdRef.current++;
      idMappingRef.current.set(localId, sceneId);

      pendingPlaceIdRef.current = sceneId;

      onCubeDropped?.({
        localId,
        dropPosition: { x: pos.x, y: pos.y, z: pos.z },
        color: selectedColor ?? getRandomColor(),
        createdAt: Date.now(),
      });
    },
    [onCubeDropped, selectedColor],
  );
  const focusActive = focusCubeId != null;
  const minDistance = isPlacing
    ? clamp(placementDistance * 0.72, 12, 120)
    : focusActive
      ? focusDistance * 0.75
      : Math.max(6, (baseTargetRef.current.distance || 14) * 0.35);
  const maxDistance = isPlacing
    ? clamp(placementDistance * 1.28, minDistance + 2, 160)
    : focusActive
      ? focusDistance * 2.4
      : 140;

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[10, 16, 10]}
        intensity={0.85}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <pointLight
        position={[-5, 8, -5]}
        intensity={0.32}
        color="hsl(185, 50%, 60%)"
      />

      <Environment preset="night" />

      <InfiniteGrid />

      <Physics gravity={[0, -18, 0]}>
        <RigidBody
          type="fixed"
          colliders={false}
          friction={1}
          restitution={0.05}
        >
          <CuboidCollider
            args={[60, 0.1, 60]}
            position={[0, FLOOR_Y - 0.1, 0]}
          />
        </RigidBody>

        <DropPlane
          enabled={!!isPlacing && !isDropLockedRef.current}
          y={dropY}
          color={selectedColor ?? fallbackColorRef.current}
          center={{ x: 0, z: 0 }}
          guard={{
            placingStartedAtRef,
            lastWheelAtRef,
          }}
          onPlace={(p) => {
            const spawnPos = new THREE.Vector3(p.x, p.y + CUBE_SIZE / 2, p.z);
            handleAddCube(spawnPos);
          }}
        />

        {renderCubes.map((cube) => (
          <CubeRigid
            key={cube.localId}
            cube={cube}
            onRegister={registerBody}
            profile={cubeProfiles?.[cube.localId]}
            isHovered={hoveredCubeId === cube.sceneId}
            isSelected={selectedCubeId === cube.sceneId}
            onHover={handleHoverChange}
            onClick={handleCubeClick}
            hoverEnabled={!isPlacing && !ownerCardOpen && !isSimulating}
            highlight={
              (ownerCardOpen && activeCubeId === cube.localId) ||
              selectedCubeId === cube.sceneId
            }
          />
        ))}
        {flagPose && (
          <FlagMarker
            position={flagPose.position}
            rotation={flagPose.rotation}
          />
        )}
      </Physics>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2 - 0.12}
        minPolarAngle={0.2}
        enableDamping
        dampingFactor={0.06}
        onStart={handleCameraNavigationStart}
        onEnd={handleCameraNavigationEnd}
      />
    </>
  );
};

const CubeScene = (props: Props) => {
  const { active = true, ...rest } = props;
  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "demand"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 140 }}
    >
      <SceneContent active={active} {...rest} />
    </Canvas>
  );
};

export default CubeScene;

useGLTF.preload("/flag.glb");
