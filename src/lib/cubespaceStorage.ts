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

const STORAGE_KEYS = {
  users: "cubespace-users",
  cubes: "cubespace-cubes",
} as const;

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadUsers = () => readStorage<StoredUser[]>(STORAGE_KEYS.users, []);

export const loadCubes = () => readStorage<StoredCube[]>(STORAGE_KEYS.cubes, []);

export const saveUsers = (users: StoredUser[]) => {
  writeStorage(STORAGE_KEYS.users, users);
};

export const saveCubes = (cubes: StoredCube[]) => {
  writeStorage(STORAGE_KEYS.cubes, cubes);
};

export const normalizeNameKey = (firstName: string, lastName: string) => {
  return `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;
};

export const normalizeLinkedIn = (url?: string) => {
  if (!url) return "";
  return url.trim().toLowerCase();
};
