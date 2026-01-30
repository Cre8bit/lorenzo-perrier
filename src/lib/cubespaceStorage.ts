export type Vec3 = { x: number; y: number; z: number };

export type FirestoreTimestampLike = {
  seconds: number;
  nanoseconds: number;
};

export type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  linkedinUrl?: string;
  verified: boolean;
  photoUrl?: string;
  profession?: string;
  createdAt?: number;
};

export type StoredCube = {
  id: number;
  userId: string;
  color: string;
  dropPosition: Vec3;
  finalPosition: Vec3;
  createdAt?: number;
};

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

const USERS_COLLECTION = "users";
const CUBES_COLLECTION = "cubes";

type SnapshotMeta = {
  fromCache: boolean;
  size: number;
  empty: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const hashStringToUint32 = (input: string): number => {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const parseTimestampToMillis = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!isRecord(value)) return undefined;

  const toMillis = value.toMillis;
  if (typeof toMillis === "function") {
    try {
      const millis = (toMillis as () => number)();
      return Number.isFinite(millis) ? millis : undefined;
    } catch {
      return undefined;
    }
  }

  const seconds = toFiniteNumber(value.seconds);
  const nanoseconds = toFiniteNumber(value.nanoseconds);
  if (seconds == null) return undefined;
  const msFromNanos = nanoseconds != null ? nanoseconds / 1e6 : 0;
  return seconds * 1000 + msFromNanos;
};

const parseVec3 = (value: unknown): Vec3 | null => {
  if (Array.isArray(value) && value.length >= 3) {
    const x = toFiniteNumber(value[0]);
    const y = toFiniteNumber(value[1]);
    const z = toFiniteNumber(value[2]);
    if (x == null || y == null || z == null) return null;
    return { x, y, z };
  }
  if (isRecord(value)) {
    const x = toFiniteNumber(value.x);
    const y = toFiniteNumber(value.y);
    const z = toFiniteNumber(value.z);
    if (x == null || y == null || z == null) return null;
    return { x, y, z };
  }
  return null;
};

const parseCubeId = (rawId: unknown, docId: string): number => {
  const fromRaw = toFiniteNumber(rawId);
  if (fromRaw != null) return fromRaw;
  const fromDoc = toFiniteNumber(docId);
  if (fromDoc != null) return fromDoc;
  const hashed = hashStringToUint32(docId);
  return hashed === 0 ? 1 : hashed;
};

const parseStoredUser = (docId: string, raw: unknown): StoredUser | null => {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id : docId;
  const firstName = typeof raw.firstName === "string" ? raw.firstName : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName : "";
  const fullName =
    typeof raw.fullName === "string" && raw.fullName.trim().length > 0
      ? raw.fullName
      : `${firstName} ${lastName}`.trim();

  return {
    id,
    firstName,
    lastName,
    fullName,
    linkedinUrl: typeof raw.linkedinUrl === "string" ? raw.linkedinUrl : undefined,
    verified: typeof raw.verified === "boolean" ? raw.verified : false,
    photoUrl: typeof raw.photoUrl === "string" ? raw.photoUrl : undefined,
    profession: typeof raw.profession === "string" ? raw.profession : undefined,
    createdAt: parseTimestampToMillis(raw.createdAt),
  };
};

const parseStoredCube = (docId: string, raw: unknown): StoredCube | null => {
  if (!isRecord(raw)) return null;
  const id = parseCubeId(raw.id, docId);
  const userId =
    typeof raw.userId === "string"
      ? raw.userId
      : typeof raw.userID === "string"
        ? raw.userID
          : "";
  const dropPosition = parseVec3(raw.dropPosition) ?? { x: 0, y: 0, z: 0 };
  const finalPosition =
    parseVec3(raw.finalPosition) ?? parseVec3(raw.final_position) ?? dropPosition;
  return {
    id,
    userId,
    color: typeof raw.color === "string" ? raw.color : "hsl(185, 40%, 45%)",
    dropPosition,
    finalPosition,
    createdAt: parseTimestampToMillis(raw.createdAt),
  };
};

export const listenUsers = (
  onChange: (users: StoredUser[], meta: SnapshotMeta) => void,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, USERS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => parseStoredUser(item.id, item.data()))
        .filter((item): item is StoredUser => item != null);
    console.log("[firestore] users snapshot", users);
      onChange(users, {
        fromCache: snapshot.metadata.fromCache,
        size: snapshot.size,
        empty: snapshot.empty,
      });
    },
    (error) => onError?.(error),
  );
};

export const listenCubes = (
  onChange: (cubes: StoredCube[], meta: SnapshotMeta) => void,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, CUBES_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const cubes = snapshot.docs
        .map((item) => parseStoredCube(item.id, item.data()))
        .filter((item): item is StoredCube => item != null);
    console.log("[firestore] cubes snapshot", cubes);
      onChange(cubes, {
        fromCache: snapshot.metadata.fromCache,
        size: snapshot.size,
        empty: snapshot.empty,
      });
    },
    (error) => onError?.(error),
  );
};

export const upsertUser = async (user: StoredUser) => {
  const db = getFirestoreDb();
  const ref = doc(db, USERS_COLLECTION, user.id);
  await setDoc(ref, user, { merge: true });
};

export const upsertCube = async (cube: StoredCube) => {
  const db = getFirestoreDb();
  const ref = doc(db, CUBES_COLLECTION, String(cube.id));
  await setDoc(ref, cube, { merge: true });
};

export const normalizeNameKey = (firstName: string, lastName: string) => {
  return `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;
};

export const normalizeLinkedIn = (url?: string) => {
  if (!url) return "";
  return url.trim().toLowerCase();
};
