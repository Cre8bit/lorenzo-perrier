import { createContext } from "react";
import type { CubeDomain, UserDomain } from "@/types/CubeModel";
import type {
  DropCubeAction,
  SettleCubeAction,
  RequestSaveCubeAction,
  ConfirmSaveCubeAction,
  FailSaveCubeAction,
  AbandonFlowAction,
} from "@/types/CubeSpaceEvents";

export type CubeSpaceDataContextType = {
  // State
  authReady: boolean;
  usersLoaded: boolean;
  cubesLoaded: boolean;

  users: UserDomain[];
  cubesByLocalId: Map<string, CubeDomain>;
  localIdByRemoteId: Map<string, string>;
  activeFlowId: string | null;

  error: string | null;

  // Actions - now with explicit types
  dropCube: DropCubeAction;
  settleCube: SettleCubeAction;
  requestSaveCube: RequestSaveCubeAction;
  confirmSaveCube: ConfirmSaveCubeAction;
  failSaveCube: FailSaveCubeAction;
  abandonFlow: AbandonFlowAction;

  // For users flow
  setUsers: (users: UserDomain[]) => void;
};

export const CubeSpaceDataContext = createContext<
  CubeSpaceDataContextType | undefined
>(undefined);
