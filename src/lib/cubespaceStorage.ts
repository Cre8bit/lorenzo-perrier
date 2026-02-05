// Re-export types from centralized model
export type {
  Vec3,
  FirestoreTimestampLike,
  CubeStatus,
  CubeDomain,
  CubeFirestoreView,
  UserDomain,
  CreateUserInput,
  CreateCubeInput,
} from "@/types/CubeModel";

import type {
  Vec3,
  CubeFirestoreView,
  UserDomain,
  CreateUserInput,
  CreateCubeInput,
} from "@/types/CubeModel";

import {
  type Unsubscribe,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

const USERS_COLLECTION = import.meta.env.DEV ? "users_dev" : "users";
const CUBES_COLLECTION = import.meta.env.DEV ? "cubes_dev" : "cubes";

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

const parseStoredUser = (docId: string, raw: unknown): UserDomain | null => {
  if (!isRecord(raw)) return null;
  const firstName = typeof raw.firstName === "string" ? raw.firstName : "";
  const lastName = typeof raw.lastName === "string" ? raw.lastName : "";

  const userId =
    typeof raw.userId === "string" && raw.userId.trim().length > 0
      ? raw.userId
      : typeof raw.userID === "string" && raw.userID.trim().length > 0
        ? raw.userID
        : typeof raw.nameKey === "string" && raw.nameKey.trim().length > 0
          ? raw.nameKey
          : typeof raw.id === "string" && raw.id.trim().length > 0
            ? raw.id
            : docId;

  return {
    id: userId,
    firstName,
    lastName,
    linkedinUrl:
      typeof raw.linkedinUrl === "string" ? raw.linkedinUrl : undefined,
    verified: typeof raw.verified === "boolean" ? raw.verified : false,
    photoUrl: typeof raw.photoUrl === "string" ? raw.photoUrl : undefined,
    profession: typeof raw.profession === "string" ? raw.profession : undefined,
    createdAt: parseTimestampToMillis(raw.createdAt ?? raw.createdDate),
  };
};

const parseStoredCube = (
  docId: string,
  raw: unknown,
): CubeFirestoreView | null => {
  if (!isRecord(raw)) return null;
  const userId =
    typeof raw.userId === "string"
      ? raw.userId
      : typeof raw.userID === "string"
        ? raw.userID
        : "";
  const dropPosition = parseVec3(raw.dropPosition) ?? { x: 0, y: 0, z: 0 };
  const finalPosition =
    parseVec3(raw.finalPosition) ??
    parseVec3(raw.final_position) ??
    dropPosition;
  return {
    remoteId: docId,
    userId,
    color: typeof raw.color === "string" ? raw.color : "hsl(185, 40%, 45%)",
    dropPosition,
    finalPosition,
    createdAt: parseTimestampToMillis(raw.createdAt ?? raw.createdDate),
  };
};

export const listenUsers = (
  onChange: (users: UserDomain[], meta: SnapshotMeta) => void,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, USERS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => parseStoredUser(item.id, item.data()))
        .filter((item): item is UserDomain => item != null);
      console.warn("[firestore] users snapshot", users);
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
  onChange: (cubes: CubeFirestoreView[], meta: SnapshotMeta) => void,
  onError?: (error: unknown) => void,
): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, CUBES_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const cubes = snapshot.docs
        .map((item) => parseStoredCube(item.id, item.data()))
        .filter((item): item is CubeFirestoreView => item != null);
      console.warn("[firestore] cubes snapshot", cubes);
      onChange(cubes, {
        fromCache: snapshot.metadata.fromCache,
        size: snapshot.size,
        empty: snapshot.empty,
      });
    },
    (error) => onError?.(error),
  );
};

export const createUserDoc = async (user: CreateUserInput) => {
  const db = getFirestoreDb();
  const ref = collection(db, USERS_COLLECTION);
  const payload = {
    firstName: user.firstName,
    lastName: user.lastName,
    linkedinUrl: user.linkedinUrl ?? "",
    verified: user.verified,
    photoUrl: user.photoUrl ?? "",
    profession: user.profession ?? "",
    createdDate: serverTimestamp(),
  } as const;

  console.warn("[firestore][createUserDoc] payload", {
    ...payload,
    createdDate: "[serverTimestamp()]",
  });

  const docRef = await addDoc(ref, payload);
  const autogeneratedUserId = docRef.id;
  console.warn("[firestore][createUserDoc] created", {
    collection: USERS_COLLECTION,
    docId: autogeneratedUserId,
  });

  return autogeneratedUserId;
};

export const createCubeDoc = async (cube: CreateCubeInput) => {
  const db = getFirestoreDb();
  const ref = collection(db, CUBES_COLLECTION);
  const payload = {
    userId: cube.userId,
    color: cube.color,
    dropPosition: [
      cube.dropPosition.x,
      cube.dropPosition.y,
      cube.dropPosition.z,
    ],
    finalPosition: [
      cube.finalPosition.x,
      cube.finalPosition.y,
      cube.finalPosition.z,
    ],
    createdDate: serverTimestamp(),
  } as const;

  console.warn("[firestore][createCubeDoc] payload", {
    ...payload,
    createdDate: "[serverTimestamp()]",
  });

  const docRef = await addDoc(ref, payload);
  console.warn("[firestore][createCubeDoc] created", {
    collection: CUBES_COLLECTION,
    docId: docRef.id,
    userId: cube.userId,
  });

  return {
    docId: docRef.id,
  } as const;
};

export const normalizeLinkedIn = (url?: string) => {
  if (!url) return "";
  return url.trim().toLowerCase();
};
