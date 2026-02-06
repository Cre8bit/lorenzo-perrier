/**
 * CubeFlowContext - React Context for cube flow state
 * Separated from provider to avoid fast refresh issues
 */

import { createContext } from "react";
import type { CreateUserInput } from "@/types/CubeModel";

/**
 * Auth Status
 */
export type AuthStatus = {
  status: "idle" | "loading" | "error";
  message?: string;
};

export const AUTH_IDLE: AuthStatus = { status: "idle" };

/**
 * Flow Context Type
 */
export type CubeFlowContextType = {
  // State
  isPlacing: boolean;
  draftId: string | null;
  isSaving: boolean;
  ownerCardOpen: boolean;
  authStatus: AuthStatus;
  ownerError: string | null;
  hasUnsavedDraft: boolean;
  hasSavedCube: boolean;

  // Actions
  togglePlacing: () => void;
  setDraftId: (id: string | null) => void;
  setOwnerCardOpen: (open: boolean) => void;
  onCubeDropped: (localId: string) => void;
  onSimulationComplete: () => void;
  onCubeFocused: (localId: string) => void;
  onConnectLinkedIn: () => Promise<
    { name?: string; given_name?: string; email?: string } | undefined
  >;
  onSaveConfirm: (ownerData: CreateUserInput) => Promise<void>;
  onOwnerDismiss: () => void;
  onAbandonFlow: () => void;
};

export const CubeFlowContext = createContext<CubeFlowContextType | undefined>(
  undefined,
);
