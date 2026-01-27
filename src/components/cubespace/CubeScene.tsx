// CubeScene.tsx — drop-in replacement using @react-three/rapier
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, useGLTF } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getRandomColor } from "@/components/cubespace/cubeColors";

const FLOOR_Y = 0;
const CUBE_SIZE = 0.8;
const MAX_CUBES = 150;

const DROP_CLEARANCE = 8;
const DROP_PLANE_MAX_RADIUS = 7;
const FLAG_OFFSET = 0.45;

interface CubeData {
  id: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  impulse?: [number, number, number];
}

export type CubeSceneStats = {
  cubeCount: number;
  towerHeight: number;
};

type Props = {
  isPlacing?: boolean;
  onStatsChange?: (s: CubeSceneStats) => void;
  selectedColor?: string;
  onPlaced?: () => void;
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
      // Keep mood: subtle, not neon
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
}: {
  enabled: boolean;
  y: number;
  onPlace: (pos: THREE.Vector3) => void;
  color: string;
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
    const r = Math.sqrt(p.x * p.x + p.z * p.z);
    if (r > DROP_PLANE_MAX_RADIUS) {
      const t = DROP_PLANE_MAX_RADIUS / (r || 1);
      setHoverPos(new THREE.Vector3(p.x * t, y, p.z * t));
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
    onPlace(new THREE.Vector3(hoverPos.x, y + CUBE_SIZE / 2, hoverPos.z));
    pointerDownRef.current = null;
    pointerMovedRef.current = false;
  };

  return (
    <group>
      <mesh ref={zoneRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.01, 0]}>
        <circleGeometry args={[DROP_PLANE_MAX_RADIUS, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.02, 0]}>
        <ringGeometry args={[DROP_PLANE_MAX_RADIUS - 0.05, DROP_PLANE_MAX_RADIUS + 0.05, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, y, 0]}
        onPointerMove={handleMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.03, 0]}>
        <ringGeometry args={[0.55, 0.75, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>

      <mesh ref={ghostRef} position={[0, y + CUBE_SIZE / 2, 0]}>
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
}: {
  cube: CubeData;
  onRegister: (id: number, api: RapierRigidBody | null) => void;
}) => {
  const bodyRef = useRef<RapierRigidBody | null>(null);

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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial color={cube.color} roughness={0.82} metalness={0.08} />
      </mesh>
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

const SceneContent = ({
  isPlacing,
  onStatsChange,
  selectedColor,
  onPlaced,
}: Props) => {
  const [cubes, setCubes] = useState<CubeData[]>([]);
  const [towerHeight, setTowerHeight] = useState(0);
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
  const baseTargetRef = useRef({ y: 2, distance: 10 });
  const placementTargetRef = useRef(0);
  const placementDistanceRef = useRef(0);
  const transitionRef = useRef<{
    active: boolean;
    progress: number;
    duration: number;
    fromTargetY: number;
    toTargetY: number;
    fromDistance: number;
    toDistance: number;
    theta: number;
    phi: number;
  }>({
    active: false,
    progress: 0,
    duration: 1.1,
    fromTargetY: 0,
    toTargetY: 0,
    fromDistance: 0,
    toDistance: 0,
    theta: 0,
    phi: Math.PI / 3,
  });
  const { camera } = useThree();

  const dropY = useMemo(() => {
    const base = Math.max(8, towerHeight + DROP_CLEARANCE);
    return clamp(base, 8, 60);
  }, [towerHeight]);

  const targetY = useMemo(
    () => clamp(towerHeight * 0.5 + 0.6, 1.4, 24),
    [towerHeight]
  );
  const desiredDistance = useMemo(
    () => clamp(8 + towerHeight * 0.75, 8, 42),
    [towerHeight]
  );

  const placementTargetY = useMemo(() => clamp(dropY * 0.6, 5, 30), [dropY]);
  const placementDistance = useMemo(() => clamp(16 + dropY * 1.1, 22, 90), [dropY]);

  useEffect(() => {
    placementTargetRef.current = placementTargetY;
    placementDistanceRef.current = placementDistance;
  }, [placementDistance, placementTargetY]);

  useEffect(() => {
    if (!isPlacing) {
      isDropLockedRef.current = false;
      pendingPlaceIdRef.current = null;
      pendingPlaceSettledFramesRef.current = 0;
    }
  }, [isPlacing]);

  useEffect(() => {
    if (!controlsRef.current || initialCameraSetRef.current) return;
    if (towerHeight < 0.2 && cubes.length > 0) return;
    const target = new THREE.Vector3(0, targetY, 0);
    const dir = new THREE.Vector3(1, 0.9, 1).normalize();
    const desiredPos = target.clone().add(dir.multiplyScalar(desiredDistance));
    camera.position.copy(desiredPos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
    baseTargetRef.current = { y: targetY, distance: desiredDistance };
    initialCameraSetRef.current = true;
  }, [camera, desiredDistance, targetY, towerHeight, cubes.length]);

  useEffect(() => {
    if (!controlsRef.current || !initialCameraSetRef.current) return;
    const controls = controlsRef.current;
    const currentTarget = controls.target.clone();
    const offset = camera.position.clone().sub(currentTarget);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const startDistance = offset.length();

    transitionRef.current = {
      active: true,
      progress: 0,
      duration: 1.15,
      fromTargetY: currentTarget.y,
      toTargetY: isPlacing ? placementTargetRef.current : baseTargetRef.current.y,
      fromDistance: startDistance,
      toDistance: isPlacing ? placementDistanceRef.current : baseTargetRef.current.distance,
      theta: spherical.theta,
      phi: spherical.phi,
    };
    controls.enabled = false;
  }, [camera, isPlacing]);

  useEffect(() => {
    onStatsChange?.({ cubeCount: cubes.length, towerHeight });
  }, [cubes.length, towerHeight, onStatsChange]);

  const registerBody = useCallback((id: number, api: RapierRigidBody | null) => {
    if (api) bodyMapRef.current.set(id, api);
    else bodyMapRef.current.delete(id);
  }, []);

  useFrame(() => {
    updateTickRef.current += 1;
    if (updateTickRef.current % 6 !== 0) return;

    let maxSettledTop = 0;
    let hasActive = false;
    let highestSettledTop = -Infinity;
    let highestSettledId: number | null = null;
    let highestSettledPos = { x: 0, y: 0, z: 0 };
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
      if (topY > highestSettledTop) {
        highestSettledTop = topY;
        highestSettledId = id ?? null;
        highestSettledPos = pos;
      }
    });

    const justSettled = wasActiveRef.current && !hasActive;
    wasActiveRef.current = hasActive;

    if (!hasActive) {
      const nextHeight = bodyMapRef.current.size > 0 ? maxSettledTop : 0;
      setTowerHeight(nextHeight);
      lastHighestSettledIdRef.current = highestSettledId;
      lastHighestSettledPosRef.current =
        highestSettledId !== null ? highestSettledPos : null;
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
        if (pendingPlaceSettledFramesRef.current >= 8) {
          pendingPlaceIdRef.current = null;
          pendingPlaceSettledFramesRef.current = 0;
          onPlaced?.();
        }
      }
    }
  });

  useFrame((_, delta) => {
    if (!transitionRef.current.active || !controlsRef.current) return;
    const t = transitionRef.current;
    t.progress = Math.min(1, t.progress + delta / t.duration);
    const eased = t.progress * t.progress * (3 - 2 * t.progress);
    const targetYValue = t.fromTargetY + (t.toTargetY - t.fromTargetY) * eased;
    const distanceValue = t.fromDistance + (t.toDistance - t.fromDistance) * eased;

    const target = new THREE.Vector3(0, targetYValue, 0);
    const spherical = new THREE.Spherical(distanceValue, t.phi, t.theta);
    const desiredPos = new THREE.Vector3().setFromSpherical(spherical).add(target);

    camera.position.copy(desiredPos);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();

    if (t.progress >= 1) {
      transitionRef.current.active = false;
      controlsRef.current.enabled = true;
    }
  });

  const spawnCubeAt = useCallback(
    (pos: THREE.Vector3, opts?: { impulse?: boolean; color?: string }) => {
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
        };

        return [...trimmed, newCube];
      });
      return newId;
    },
    []
  );

  useEffect(() => {
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
        name: "Seed",
      }));
      return seed;
    });
  }, []);

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
            const id = spawnCubeAt(p, {
              impulse: false,
              color: selectedColor ?? fallbackColorRef.current,
            });
            pendingPlaceIdRef.current = id;
            pendingPlaceSettledFramesRef.current = 0;
            isDropLockedRef.current = true;
          }}
        />

        {cubes.map((cube) => (
          <CubeRigid key={cube.id} cube={cube} onRegister={registerBody} />
        ))}
        {flagPose && <FlagMarker position={flagPose.position} rotation={flagPose.rotation} />}
      </Physics>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={!isPlacing}
        minDistance={
          isPlacing ? placementDistance : Math.max(6, (baseTargetRef.current.distance || 14) * 0.35)
        }
        maxDistance={isPlacing ? placementDistance : 140}
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
