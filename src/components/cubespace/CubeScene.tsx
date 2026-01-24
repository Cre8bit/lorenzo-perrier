import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

// Simple physics constants
const GRAVITY = -15;
const BOUNCE_DAMPING = 0.3;
const FRICTION = 0.98;
const FLOOR_Y = 0;
const CUBE_SIZE = 0.8;
const MAX_CUBES = 100;

interface CubeData {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationVel: THREE.Vector3;
  color: string;
  settled: boolean;
  name: string;
}

// Matte color palette
const CUBE_COLORS = [
  "hsl(185, 40%, 45%)", // teal
  "hsl(220, 35%, 50%)", // blue
  "hsl(260, 30%, 55%)", // purple
  "hsl(340, 35%, 50%)", // rose
  "hsl(30, 40%, 50%)",  // amber
  "hsl(160, 35%, 45%)", // emerald
];

const getRandomColor = () =>
  CUBE_COLORS[Math.floor(Math.random() * CUBE_COLORS.length)];

// Single falling cube component
const FallingCube = ({
  data,
  allCubes,
  onUpdate,
}: {
  data: CubeData;
  allCubes: CubeData[];
  onUpdate: (id: number, updates: Partial<CubeData>) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current || data.settled) return;

    const clampedDelta = Math.min(delta, 0.05);

    // Apply gravity
    let newVelY = data.velocity.y + GRAVITY * clampedDelta;
    let newY = data.position.y + newVelY * clampedDelta;
    let newVelX = data.velocity.x * FRICTION;
    let newVelZ = data.velocity.z * FRICTION;
    let newX = data.position.x + newVelX * clampedDelta;
    let newZ = data.position.z + newVelZ * clampedDelta;

    // Check floor collision
    const halfSize = CUBE_SIZE / 2;
    if (newY - halfSize < FLOOR_Y) {
      newY = FLOOR_Y + halfSize;
      newVelY > -0.5
        ? ((newVelX = 0), (newVelZ = 0))
        : null;
      const bounceVelY = -newVelY * BOUNCE_DAMPING;
      
      // Check if settled
      if (Math.abs(bounceVelY) < 0.3) {
        onUpdate(data.id, {
          position: new THREE.Vector3(newX, newY, newZ),
          velocity: new THREE.Vector3(0, 0, 0),
          settled: true,
        });
        return;
      }
      
      onUpdate(data.id, {
        position: new THREE.Vector3(newX, newY, newZ),
        velocity: new THREE.Vector3(newVelX, bounceVelY, newVelZ),
      });
      return;
    }

    // Simple cube-cube collision (check against settled cubes)
    for (const other of allCubes) {
      if (other.id === data.id || !other.settled) continue;

      const dx = newX - other.position.x;
      const dy = newY - other.position.y;
      const dz = newZ - other.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < CUBE_SIZE * 0.95) {
        // Collision detected - push apart and bounce
        const overlap = CUBE_SIZE - dist;
        const nx = dx / dist || 0;
        const ny = dy / dist || 1;
        const nz = dz / dist || 0;

        newX += nx * overlap * 0.6;
        newY += ny * overlap * 0.6;
        newZ += nz * overlap * 0.6;

        // Reflect velocity
        const dot = newVelX * nx + newVelY * ny + newVelZ * nz;
        newVelX = (newVelX - 2 * dot * nx) * BOUNCE_DAMPING;
        newVelY = (newVelY - 2 * dot * ny) * BOUNCE_DAMPING;
        newVelZ = (newVelZ - 2 * dot * nz) * BOUNCE_DAMPING;

        // Check if should settle on top
        if (ny > 0.7 && Math.abs(newVelY) < 0.5) {
          onUpdate(data.id, {
            position: new THREE.Vector3(newX, other.position.y + CUBE_SIZE, newZ),
            velocity: new THREE.Vector3(0, 0, 0),
            settled: true,
          });
          return;
        }
      }
    }

    // Update rotation
    const newRotX = data.rotation.x + data.rotationVel.x * clampedDelta;
    const newRotZ = data.rotation.z + data.rotationVel.z * clampedDelta;

    onUpdate(data.id, {
      position: new THREE.Vector3(newX, newY, newZ),
      velocity: new THREE.Vector3(newVelX, newVelY, newVelZ),
      rotation: new THREE.Euler(newRotX, data.rotation.y, newRotZ),
    });
  });

  // Update mesh from data
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(data.position);
      meshRef.current.rotation.copy(data.rotation);
    }
  }, [data.position, data.rotation]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial
        color={data.color}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

// Floor platform
const Floor = () => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="hsl(220, 15%, 10%)"
        roughness={0.9}
        metalness={0.1}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
};

// Grid lines for subtle floor indication
const FloorGrid = () => {
  return (
    <gridHelper
      args={[20, 20, "hsl(185, 30%, 25%)", "hsl(220, 20%, 15%)"]}
      position={[0, 0.01, 0]}
    />
  );
};

// Scene content
const SceneContent = ({
  dropTrigger,
  guestName,
}: {
  dropTrigger: number;
  guestName: string;
}) => {
  const [cubes, setCubes] = useState<CubeData[]>([]);
  const cubeIdRef = useRef(0);
  const { camera } = useThree();

  // Set initial camera position
  useEffect(() => {
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 2, 0);
  }, [camera]);

  // Handle drop trigger
  useEffect(() => {
    if (dropTrigger === 0) return;

    // Limit max cubes
    setCubes((prev) => {
      const trimmed = prev.length >= MAX_CUBES ? prev.slice(-MAX_CUBES + 1) : prev;
      
      const newCube: CubeData = {
        id: cubeIdRef.current++,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          8 + Math.random() * 2,
          (Math.random() - 0.5) * 4
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        rotationVel: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          0,
          (Math.random() - 0.5) * 5
        ),
        color: getRandomColor(),
        settled: false,
        name: guestName,
      };

      return [...trimmed, newCube];
    });
  }, [dropTrigger, guestName]);

  const handleCubeUpdate = useCallback(
    (id: number, updates: Partial<CubeData>) => {
      setCubes((prev) =>
        prev.map((cube) =>
          cube.id === id ? { ...cube, ...updates } : cube
        )
      );
    },
    []
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-5, 8, -5]} intensity={0.3} color="hsl(185, 50%, 60%)" />

      {/* Environment for subtle reflections */}
      <Environment preset="night" />

      {/* Floor */}
      <Floor />
      <FloorGrid />

      {/* Cubes */}
      {cubes.map((cube) => (
        <FallingCube
          key={cube.id}
          data={cube}
          allCubes={cubes}
          onUpdate={handleCubeUpdate}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under floor
        minPolarAngle={0.2}
        enableDamping
        dampingFactor={0.05}
        target={[0, 1, 0]}
      />
    </>
  );
};

// Main exported component
const CubeScene = ({
  dropTrigger,
  guestName,
}: {
  dropTrigger: number;
  guestName: string;
}) => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ fov: 45, near: 0.1, far: 100 }}
    >
      <SceneContent dropTrigger={dropTrigger} guestName={guestName} />
    </Canvas>
  );
};

export default CubeScene;
