export type Vec3 = { x: number; y: number; z: number };

export type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  linkedinUrl?: string;
  verified: boolean;
  photoUrl?: string;
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

export const listenUsers = (onChange: (users: StoredUser[]) => void): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, USERS_COLLECTION);
  return onSnapshot(ref, (snapshot) => {
    const users = snapshot.docs.map((item) => {
      const data = item.data() as StoredUser;
      return { ...data, id: data.id ?? item.id };
    });
    console.log("[firestore] users snapshot", users);
    onChange(users);
  });
};

export const listenCubes = (onChange: (cubes: StoredCube[]) => void): Unsubscribe => {
  const db = getFirestoreDb();
  const ref = collection(db, CUBES_COLLECTION);
  return onSnapshot(ref, (snapshot) => {
    const cubes = snapshot.docs.map((item) => {
      const data = item.data() as StoredCube;
      const parsedId = typeof data.id === "number" ? data.id : Number(item.id);
      return { ...data, id: Number.isNaN(parsedId) ? data.id : parsedId };
    });
    console.log("[firestore] cubes snapshot", cubes);
    onChange(cubes);
  });
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
