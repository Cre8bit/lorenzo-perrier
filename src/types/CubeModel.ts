/**
 * CubeModel - Single source of truth for all cube-related types
 *
 * Transformation Chain:
 * Domain → Firestore (storage)
 * Domain → Render (scene visualization)
 *
 * This consolidates types previously scattered across:
 * - cubespaceStorage.ts
 * - CubeScene.tsx
 * - Context files
 */

export type Vec3 = { x: number; y: number; z: number };

export type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

/**
 * Cube Status Lifecycle:
 * draft → saving → synced
 *              ↓
 *           error
 */
export type CubeStatus = "draft" | "saving" | "synced" | "error";

/**
 * DOMAIN MODEL - Single source of truth
 * All cube instances in the application should use this type
 */
export type CubeDomain = {
  localId: string; // UUID - stable across lifecycle
  remoteId?: string; // Firestore document ID - set after save
  userId?: string; // Owner's user ID
  status: CubeStatus;
  color: string; // HSL format: "hsl(192, 55%, 58%)"
  dropPosition: Vec3; // Initial drop coordinates
  finalPosition?: Vec3; // Physics-settled position
  createdAtLocal: number; // Client timestamp (ms)
  createdAtRemote?: number; // Server timestamp (ms) - set after save
};

/**
 * FIRESTORE VIEW - For persistence layer
 * Used when reading/writing to Firestore
 */
export type CubeFirestoreView = Pick<CubeDomain, "color" | "dropPosition"> & {
  remoteId: string; // Document ID
  userId: string; // Required in storage
  finalPosition: Vec3; // Required in storage
  createdAt?: number; // Server timestamp
};

/**
 * RENDER VIEW - For Three.js scene
 * Used by CubeScene for visualization and physics
 */
export type CubeRenderView = Pick<
  CubeDomain,
  "localId" | "color" | "status"
> & {
  sceneId: number; // Stable numeric ID for physics engine
  position: [number, number, number]; // Three.js format
  rotation: [number, number, number]; // Three.js format
  impulse?: [number, number, number]; // Initial physics impulse
  createdAt: number; // For animation timing
};

/**
 * USER MODEL
 */
export type UserDomain = {
  id: string; // User ID (Firestore doc ID or custom)
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  verified: boolean;
  photoUrl?: string;
  profession?: string;
  createdAt?: number;
};

/**
 * INPUT TYPES - For creation operations
 */
export type CreateUserInput = {
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
  verified: boolean;
  photoUrl?: string;
  profession?: string;
};

export type CreateCubeInput = {
  userId: string;
  color: string;
  dropPosition: Vec3;
  finalPosition: Vec3;
};

/**
 * UTILITY TYPES
 */
export type DropCubePayload = {
  localId: string;
  color: string;
  dropPosition: Vec3;
};

export type SettleCubePayload = {
  localId: string;
  finalPosition: Vec3;
};

/**
 * TYPE GUARDS
 */
export const isCubeSynced = (cube: CubeDomain): boolean =>
  cube.status === "synced";

export const isCubeDraft = (cube: CubeDomain): boolean =>
  cube.status === "draft";

export const isCubeSaving = (cube: CubeDomain): boolean =>
  cube.status === "saving";

export const hasCubeFinalPosition = (
  cube: CubeDomain,
): cube is CubeDomain & { finalPosition: Vec3 } =>
  cube.finalPosition !== undefined;

/**
 * TRANSFORMATION UTILITIES
 */

/**
 * Convert domain cube to render view
 */
export const toRenderView = (
  cube: CubeDomain,
  sceneId: number,
): CubeRenderView => {
  const pos = cube.finalPosition ?? cube.dropPosition;
  return {
    sceneId,
    localId: cube.localId,
    color: cube.color,
    status: cube.status,
    position: [pos.x, pos.y, pos.z],
    rotation: [0, 0, 0],
    createdAt: cube.createdAtLocal,
  };
};

/**
 * Convert Vec3 to Three.js tuple
 */
export const vec3ToTuple = (v: Vec3): [number, number, number] => [
  v.x,
  v.y,
  v.z,
];

/**
 * Convert Three.js tuple to Vec3
 */
export const tupleToVec3 = (t: [number, number, number]): Vec3 => ({
  x: t[0],
  y: t[1],
  z: t[2],
});
