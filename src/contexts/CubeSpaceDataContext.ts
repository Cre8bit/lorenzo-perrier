import { createContext, type Dispatch, type SetStateAction } from "react";
import type { StoredCube, StoredUser } from "@/lib/cubespaceStorage";

export type CubeSpaceDataContextType = {
  authReady: boolean;
  usersLoaded: boolean;
  cubesLoaded: boolean;
  users: StoredUser[];
  cubes: StoredCube[];
  error: string | null;
  setUsers: Dispatch<SetStateAction<StoredUser[]>>;
  setCubes: Dispatch<SetStateAction<StoredCube[]>>;
};

export const CubeSpaceDataContext = createContext<
  CubeSpaceDataContextType | undefined
>(undefined);
