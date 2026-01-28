// CubeScene.tsx — drop-in replacement using @react-three/rapier
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Html, useGLTF, useTexture } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getRandomColor } from "@/components/cubespace/cubeColors";
import type { CubeProfile, CubeProfileMap } from "@/components/cubespace/cubeProfiles";
import type { Vec3 } from "@/lib/cubespaceStorage";

const FLOOR_Y = 0;
const CUBE_SIZE = 0.8;
const MAX_CUBES = 150;

const DROP_CLEARANCE = 8;
const DROP_PLANE_MAX_RADIUS = 7;
const FLAG_OFFSET = 0.45;
const HEIGHT_EPS = 0.0005;

interface CubeData {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  impulse?: [number, number, number];
  createdAt?: number;
}

export type CubeSceneStats = {
  cubeCount: number;
  towerHeight: number;
};

type Props = {
  isPlacing?: boolean;
  onStatsChange?: (s: CubeSceneStats) => void;
  selectedColor?: string;
  onCubeDropped?: (payload: { id: number; dropPosition: Vec3; color: string; createdAt: number }) => void;
  onCubeSettled?: (payload: { id: number; finalPosition: Vec3 }) => void;
  onFocusComplete?: (payload: { id: number }) => void;
  onActiveCubeScreenChange?: (payload: { id: number | null; x: number; y: number; visible: boolean }) => void;
  onSceneReady?: () => void;
  initialCubes?: CubeData[];
  cubeProfiles?: CubeProfileMap;
  focusCubeId?: number | null;
  focusTick?: number;
  activeCubeId?: number | null;
  ownerCardOpen?: boolean;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
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
}: {
  enabled: boolean;
  y: number;
  onPlace: (pos: THREE.Vector3) => void;
  color: string;
  center: { x: number; z: number };
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
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    pointerMovedRef.current = false;
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverPos) return;
    if (pointerMovedRef.current) {
      pointerDownRef.current = null;
      pointerMovedRef.current = false;
      return;
    }
    e.stopPropagation();
    onPlace(new THREE.Vector3(hoverPos.x, y, hoverPos.z));
    pointerDownRef.current = null;
    pointerMovedRef.current = false;
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, y + 0.02, center.z]}>
        <ringGeometry args={[DROP_PLANE_MAX_RADIUS - 0.05, DROP_PLANE_MAX_RADIUS + 0.05, 96]} />
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
  onHover,
  hoverEnabled,
  highlight,
}: {
  cube: CubeData;
  onRegister: (id: number, api: RapierRigidBody | null) => void;
  profile?: CubeProfile;
  isHovered?: boolean;
  onHover?: (id: number | null) => void;
  hoverEnabled?: boolean;
  highlight?: boolean;
}) => {
  const bodyRef = useRef<RapierRigidBody | null>(null);
  const displayName = profile?.fullName;
  const showBubble = Boolean(displayName && isHovered);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverEnabled) return;
    e.stopPropagation();
    onHover?.(cube.id);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!hoverEnabled) return;
    e.stopPropagation();
    onHover?.(null);
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
        onRegister(cube.id, api);
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
        <mesh castShadow receiveShadow onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
          <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
          <meshStandardMaterial color={cube.color} roughness={0.82} metalness={0.08} />
        </mesh>
        {highlight && <HighlightShell />}
        {profile?.photoUrl && <PhotoBadge url={profile.photoUrl} verified={profile.verified} />}
        {showBubble && displayName ? <HoverBubble name={displayName} /> : null}
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
        <meshBasicMaterial map={texture} transparent opacity={0.98} toneMapped={false} />
      </mesh>
      {verified && (
        <mesh position={[0.17, 0.17, 0.01]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="hsl(164, 55%, 58%)" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
};

const HoverBubble = ({ name }: { name: string }) => {
  return (
    <Html position={[0, CUBE_SIZE / 2 + 0.55, 0]} center distanceFactor={10}>
      <div className="pointer-events-none select-none">
        <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 shadow-lg backdrop-blur">
          Hi, I'm {name}!
        </div>
        <div className="mx-auto mt-1 h-1.5 w-1.5 rotate-45 border border-white/10 bg-black/60" />
      </div>
    </Html>
  );
};

const HighlightShell = () => {
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    const next = Math.min(0.28, opacityRef.current + delta * 1.2);
    if (next === opacityRef.current) return;
    opacityRef.current = next;
    if (materialRef.current) {
      materialRef.current.opacity = next;
    }
  });

  return (
    <mesh raycast={() => null}>
      <boxGeometry args={[CUBE_SIZE + 0.06, CUBE_SIZE + 0.06, CUBE_SIZE + 0.06]} />
      <meshBasicMaterial
        ref={materialRef}
        color="hsl(185, 60%, 62%)"
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
  initialCubes,
  cubeProfiles,
  focusCubeId,
  focusTick,
  activeCubeId,
  ownerCardOpen,
}: Props) => {
  const [cubes, setCubes] = useState<CubeData[]>(() => initialCubes ?? []);
  const [towerHeight, setTowerHeight] = useState(0);
  const [hoveredCubeId, setHoveredCubeId] = useState<number | null>(null);
  const [flagPose, setFlagPose] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
  } | null>(null);
  const cubeIdRef = useRef(0);
  const pendingPlaceIdRef = useRef<number | null>(null);
  const pendingPlaceSettledFramesRef = useRef(0);
  const isDropLockedRef = useRef(false);
  const flagCubeIdRef = useRef<number | null>(null);
  const flagLockIdRef = useRef<number | null>(null);
  const lastHighestSettledIdRef = useRef<number | null>(null);
  const lastHighestSettledPosRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const flagRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const flagRotationReadyRef = useRef(false);
  const wasActiveRef = useRef(false);
  const bodyMapRef = useRef<Map<number, RapierRigidBody>>(new Map());
  const updateTickRef = useRef(0);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const fallbackColorRef = useRef(getRandomColor());
  const initialCameraSetRef = useRef(false);
  const sceneReadyRef = useRef(false);
  const baseTargetRef = useRef({ target: new THREE.Vector3(0, 2, 0), distance: 10 });
  const [focusDistance, setFocusDistance] = useState(6);
  const pendingFocusRef = useRef<{ id: number; tick: number } | null>(null);
  const dropInFlightRef = useRef(false);
  const lastDropSettledAtRef = useRef<number | null>(null);
  const lastScreenRef = useRef<{ x: number; y: number; visible: boolean } | null>(null);
  const createdAtMapRef = useRef<Map<number, number>>(new Map());
  const desiredDistanceRef = useRef(10);
  const [dropCenter, setDropCenter] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const placementTargetRef = useRef(0);
  const placementDistanceRef = useRef(0);
  const transitionRef = useRef<{
    active: boolean;
    progress: number;
    duration: number;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromDistance: number;
    toDistance: number;
    theta: number;
    phi: number;
    kind: "base" | "placing" | "focus";
    focusId: number | null;
  }>({
    active: false,
    progress: 0,
    duration: 1.1,
    fromTarget: new THREE.Vector3(0, 0, 0),
    toTarget: new THREE.Vector3(0, 0, 0),
    fromDistance: 0,
    toDistance: 0,
    theta: 0,
    phi: Math.PI / 3,
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
    [towerHeight]
  );

  const placementTargetY = useMemo(() => clamp(dropY * 0.6, 5, 30), [dropY]);
  const placementDistance = useMemo(() => clamp(16 + dropY * 1.1, 22, 90), [dropY]);

  useEffect(() => {
    desiredDistanceRef.current = desiredDistance;
  }, [desiredDistance]);

  useEffect(() => {
    const map = new Map<number, number>();
    cubes.forEach((cube) => {
      map.set(cube.id, cube.createdAt ?? 0);
    });
    createdAtMapRef.current = map;
  }, [cubes]);

  useEffect(() => {
    placementTargetRef.current = placementTargetY;
    placementDistanceRef.current = placementDistance;
  }, [placementDistance, placementTargetY]);

  useEffect(() => {
    if (isPlacing) {
      setHoveredCubeId(null);
      dropInFlightRef.current = false;
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

  const beginTransition = useCallback(
    (
      target: THREE.Vector3,
      distance: number,
      duration = 1.15,
      meta?: { kind?: "base" | "placing" | "focus"; focusId?: number | null }
    ) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const currentTarget = controls.target.clone();
      const offset = camera.position.clone().sub(currentTarget);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      const startDistance = offset.length();

      transitionRef.current = {
        active: true,
        progress: 0,
        duration,
        fromTarget: currentTarget,
        toTarget: target.clone(),
        fromDistance: startDistance,
        toDistance: distance,
        theta: spherical.theta,
        phi: spherical.phi,
        kind: meta?.kind ?? "base",
        focusId: meta?.focusId ?? null,
      };
      controls.enabled = false;
    },
    [camera]
  );

  const resolveCubePosition = useCallback(
    (id: number) => {
      const body = bodyMapRef.current.get(id);
      const bodyPos = body?.translation?.();
      if (bodyPos) return new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z);
      const fallback = cubes.find((cube) => cube.id === id);
      if (!fallback) return null;
      return new THREE.Vector3(fallback.position[0], fallback.position[1], fallback.position[2]);
    },
    [cubes]
  );

  useEffect(() => {
    if (!controlsRef.current || !initialCameraSetRef.current) return;
    if (isPlacing) {
      if (dropInFlightRef.current) return;
      beginTransition(
        new THREE.Vector3(0, placementTargetRef.current, 0),
        placementDistanceRef.current,
        1.05,
        { kind: "placing" }
      );
      return;
    }
    if (focusCubeId != null) return;
    if (dropInFlightRef.current) return;
    if (lastDropSettledAtRef.current) {
      const elapsed = Date.now() - lastDropSettledAtRef.current;
      if (elapsed < 700) return;
      lastDropSettledAtRef.current = null;
    }
    beginTransition(baseTargetRef.current.target.clone(), baseTargetRef.current.distance, 1.1, {
      kind: "base",
    });
  }, [beginTransition, focusCubeId, isPlacing]);

  useEffect(() => {
    if (!controlsRef.current || !initialCameraSetRef.current) return;
    if (focusCubeId == null) {
      return;
    }
    if (isPlacing) return;
    lastDropSettledAtRef.current = null;
    pendingFocusRef.current = { id: focusCubeId, tick: focusTick ?? 0 };
    const focusPos = resolveCubePosition(focusCubeId);
    if (!focusPos) return;
    const target = focusPos.clone().add(new THREE.Vector3(0, 0.15, 0));
    const nextDistance = clamp(5.2 + target.y * 0.08, 5.2, 12);
    setFocusDistance(nextDistance);
    beginTransition(target, nextDistance, 0.95, { kind: "focus", focusId: focusCubeId });
    pendingFocusRef.current = null;
  }, [beginTransition, focusCubeId, focusTick, isPlacing, resolveCubePosition]);

  useEffect(() => {
    onStatsChange?.({ cubeCount: cubes.length, towerHeight });
  }, [cubes.length, towerHeight, onStatsChange]);

  const registerBody = useCallback((id: number, api: RapierRigidBody | null) => {
    if (api) bodyMapRef.current.set(id, api);
    else bodyMapRef.current.delete(id);
  }, []);

  useFrame(() => {
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
      const createdAt = createdAtMapRef.current.get(id ?? -1);
      const recency = createdAt ?? (id ?? 0);
      const isHigher = topY > highestSettledTop + HEIGHT_EPS;
      const isTie = Math.abs(topY - highestSettledTop) <= HEIGHT_EPS;
      if (isHigher || (isTie && recency >= highestSettledCreatedAt)) {
        highestSettledTop = topY;
        highestSettledId = id ?? null;
        highestSettledPos = pos;
        highestSettledCreatedAt = recency;
      }
    });

    const justSettled = wasActiveRef.current && !hasActive;
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
          highestSettledPos.z
        );
        baseTargetRef.current = { target, distance: nextDistance };
        if (
          dropCenter.x !== highestSettledPos.x ||
          dropCenter.z !== highestSettledPos.z
        ) {
          setDropCenter({ x: highestSettledPos.x, z: highestSettledPos.z });
        }
        if (!initialCameraSetRef.current && controlsRef.current) {
          const dir = new THREE.Vector3(1, 0.9, 1).normalize();
          const desiredPos = target.clone().add(dir.multiplyScalar(nextDistance));
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
        if (dropCenter.x !== 0 || dropCenter.z !== 0) {
          setDropCenter({ x: 0, z: 0 });
        }
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

    if (!hasActive) {
      const bodiesReady =
        bodyMapRef.current.size >= cubes.length || (cubes.length === 0 && bodyMapRef.current.size === 0);
      if (!sceneReadyRef.current && bodiesReady && initialCameraSetRef.current) {
        sceneReadyRef.current = true;
        onSceneReady?.();
      }
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
          onCubeSettled?.({
            id: pendingId,
            finalPosition: { x: finalPos.x, y: finalPos.y, z: finalPos.z },
          });
        }
      }
    } else if (!hasActive) {
      dropInFlightRef.current = false;
    }
  });

  useFrame((_, delta) => {
    if (!transitionRef.current.active || !controlsRef.current) return;
    const t = transitionRef.current;
    t.progress = Math.min(1, t.progress + delta / t.duration);
    const eased = t.progress * t.progress * (3 - 2 * t.progress);
    const distanceValue = t.fromDistance + (t.toDistance - t.fromDistance) * eased;

    const target = t.fromTarget.clone().lerp(t.toTarget, eased);
    const spherical = new THREE.Spherical(distanceValue, t.phi, t.theta);
    const desiredPos = new THREE.Vector3().setFromSpherical(spherical).add(target);

    camera.position.copy(desiredPos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();

    if (t.progress >= 1) {
      transitionRef.current.active = false;
      controlsRef.current.enabled = true;
      if (t.kind === "focus" && t.focusId != null) {
        onFocusComplete?.({ id: t.focusId });
      }
    }
  });

  useFrame(() => {
    if (transitionRef.current.active) return;
    if (isPlacing) return;
    const pending = pendingFocusRef.current;
    if (!pending) return;
    if (pending.id !== focusCubeId || focusCubeId == null) {
      pendingFocusRef.current = null;
      return;
    }
    const focusPos = resolveCubePosition(pending.id);
    if (!focusPos) return;
    const target = focusPos.clone().add(new THREE.Vector3(0, 0.15, 0));
    const nextDistance = clamp(5.2 + target.y * 0.08, 5.2, 12);
    setFocusDistance(nextDistance);
    beginTransition(target, nextDistance, 0.95, { kind: "focus", focusId: pending.id });
    pendingFocusRef.current = null;
  });

  useFrame(() => {
    if (!onActiveCubeScreenChange) return;
    if (!ownerCardOpen || activeCubeId == null) {
      if (lastScreenRef.current?.visible !== false) {
        lastScreenRef.current = { x: 0, y: 0, visible: false };
        onActiveCubeScreenChange({ id: null, x: 0, y: 0, visible: false });
      }
      return;
    }
    const x = size.width * 0.5;
    const y = size.height * 0.5;
    const visible = true;
    lastScreenRef.current = { x, y, visible };
    onActiveCubeScreenChange({ id: activeCubeId, x, y, visible });
  });

  const spawnCubeAt = useCallback(
    (pos: THREE.Vector3, opts?: { impulse?: boolean; color?: string; createdAt?: number }) => {
      const newId = cubeIdRef.current++;
      setCubes((prev) => {
        const trimmed = prev.length >= MAX_CUBES ? prev.slice(-MAX_CUBES + 1) : prev;
        const impulse = opts?.impulse ?? true;
        const impulseVec: [number, number, number] | undefined = impulse
          ? [
              (Math.random() - 0.5) * 1.2,
              0.4 + Math.random() * 0.6,
              (Math.random() - 0.5) * 1.2,
            ]
          : undefined;

        const newCube: CubeData = {
          id: newId,
          position: [pos.x, pos.y, pos.z],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          color: opts?.color ?? getRandomColor(),
          impulse: impulseVec,
          createdAt: opts?.createdAt ?? Date.now(),
        };

        return [...trimmed, newCube];
      });
      return newId;
    },
    []
  );

  useEffect(() => {
    if (!initialCubes || initialCubes.length === 0) return;
    setCubes((prev) => (prev.length > 0 ? prev : initialCubes));
    const maxId = initialCubes.reduce((max, cube) => Math.max(max, cube.id), 0);
    cubeIdRef.current = Math.max(cubeIdRef.current, maxId + 1);
  }, [initialCubes]);

  useEffect(() => {
    if (initialCubes && initialCubes.length > 0) return;
    setCubes((prev) => {
      if (prev.length > 0) return prev;
      const baseY = FLOOR_Y + CUBE_SIZE / 2;
      const seed: CubeData[] = Array.from({ length: 3 }, (_, i) => ({
        id: cubeIdRef.current++,
        position: [0, baseY + i * CUBE_SIZE, 0],
        rotation: [
          (Math.random() - 0.5) * 0.12,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.12,
        ],
        color: getRandomColor(),
        createdAt: Date.now() - (2 - i) * 1000,
      }));
      return seed;
    });
  }, [initialCubes]);

  const focusActive = focusCubeId != null;
  const minDistance = isPlacing
    ? placementDistance
    : focusActive
      ? focusDistance * 0.75
      : Math.max(6, (baseTargetRef.current.distance || 14) * 0.35);
  const maxDistance = isPlacing
    ? placementDistance
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
      <pointLight position={[-5, 8, -5]} intensity={0.32} color="hsl(185, 50%, 60%)" />

      <Environment preset="night" />

      <InfiniteGrid />

      <Physics gravity={[0, -18, 0]}>
        <RigidBody type="fixed" colliders={false} friction={1} restitution={0.05}>
          <CuboidCollider args={[60, 0.1, 60]} position={[0, FLOOR_Y - 0.1, 0]} />
        </RigidBody>

        <DropPlane
          enabled={!!isPlacing && !isDropLockedRef.current}
          y={dropY}
          color={selectedColor ?? fallbackColorRef.current}
          center={dropCenter}
          onPlace={(p) => {
            if (isDropLockedRef.current || pendingPlaceIdRef.current !== null) return;
            const lockId = lastHighestSettledIdRef.current;
            if (lockId !== null) {
              flagLockIdRef.current = lockId;
              flagCubeIdRef.current = lockId;
              const lockPos = lastHighestSettledPosRef.current;
              if (lockPos) {
                setFlagPose({
                  position: [
                    lockPos.x,
                    lockPos.y + CUBE_SIZE / 2 + FLAG_OFFSET,
                    lockPos.z,
                  ],
                  rotation: flagRotationRef.current,
                });
              }
            }
            const spawnPos = new THREE.Vector3(p.x, p.y + CUBE_SIZE / 2, p.z);
            const color = selectedColor ?? fallbackColorRef.current;
            const createdAt = Date.now();
            const id = spawnCubeAt(spawnPos, {
              impulse: false,
              color,
              createdAt,
            });
            pendingPlaceIdRef.current = id;
            pendingPlaceSettledFramesRef.current = 0;
            isDropLockedRef.current = true;
            dropInFlightRef.current = true;
            onCubeDropped?.({
              id,
              dropPosition: { x: p.x, y: p.y, z: p.z },
              color,
              createdAt,
            });
          }}
        />

        {cubes.map((cube) => (
          <CubeRigid
            key={cube.id}
            cube={cube}
            onRegister={registerBody}
            profile={cubeProfiles?.[cube.id]}
            isHovered={hoveredCubeId === cube.id}
            onHover={setHoveredCubeId}
            hoverEnabled={!isPlacing && !ownerCardOpen}
            highlight={ownerCardOpen && activeCubeId === cube.id}
          />
        ))}
        {flagPose && <FlagMarker position={flagPose.position} rotation={flagPose.rotation} />}
      </Physics>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={!isPlacing}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2 - 0.12}
        minPolarAngle={0.2}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
};

const CubeScene = (props: Props) => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, near: 0.1, far: 140 }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
};

export default CubeScene;

useGLTF.preload("/flag.glb");
