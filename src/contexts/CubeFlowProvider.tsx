/**
 * CubeFlowProvider - UI orchestration layer for cube add/edit flow
 *
 * Separates flow state (placing, saving, UI transitions) from data state.
 * Coordinates between Scene, Overlay, and OwnerCard components.
 *
 * Architecture:
 * - CubeSpaceDataProvider: Data persistence and Firestore sync
 * - CubeFlowProvider: UI flow and user interaction orchestration
 */

import { type FC, type ReactNode, useState, useCallback } from "react";
import { useCubeSpaceData } from "@/contexts/useCubeSpaceData";
import type { CreateUserInput } from "@/types/CubeModel";
import { createUserDoc, createCubeDoc } from "@/lib/cubespaceStorage";
import { loginWithLinkedInPopup, isAuth0Configured } from "@/lib/auth0";
import { ensureAnonymousAuth } from "@/lib/firebase";
import { CubeFlowContext, AUTH_IDLE } from "@/contexts/CubeFlowContext";
import type { AuthStatus } from "@/contexts/CubeFlowContext";

/**
 * CubeFlowProvider Component
 */
export const CubeFlowProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const {
    cubesByLocalId,
    requestSaveCube,
    confirmSaveCube,
    failSaveCube,
    abandonFlow: abandonDataFlow,
    error: dataError,
  } = useCubeSpaceData();

  // Local UI State
  const [isPlacing, setIsPlacing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AUTH_IDLE);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerCardOpen, setOwnerCardOpen] = useState(false);

  // Derived State
  const draftCube = draftId ? cubesByLocalId.get(draftId) : null;
  const isSaving = draftCube?.status === "saving";
  const saveError = draftCube?.status === "error" ? dataError : null;
  const hasUnsavedDraft = draftCube != null && draftCube.status !== "synced";

  // Actions
  const togglePlacing = useCallback(() => {
    if (hasUnsavedDraft && !isPlacing) {
      // Don't allow placing a new cube if there's an unsaved draft
      return;
    }
    setIsPlacing((prev) => !prev);
  }, [hasUnsavedDraft, isPlacing]);

  const onConnectLinkedIn = useCallback(async () => {
    if (!isAuth0Configured()) {
      setAuthStatus({ status: "error", message: "Auth0 missing" });
      return;
    }
    setAuthStatus({ status: "loading" });
    try {
      const user = await loginWithLinkedInPopup();
      setAuthStatus(AUTH_IDLE);
      return user;
    } catch (err) {
      setAuthStatus({ status: "error", message: "LinkedIn Login Failed" });
      throw err;
    }
  }, []);

  const onSaveConfirm = useCallback(
    async (ownerData: CreateUserInput) => {
      if (!draftId || !draftCube) return;

      setOwnerError(null);
      requestSaveCube(draftId); // Sets status to 'saving'

      try {
        await ensureAnonymousAuth();

        // 1. Create User
        const userId = await createUserDoc(ownerData);

        // 2. Create Cube
        const { docId: remoteId } = await createCubeDoc({
          userId,
          color: draftCube.color,
          dropPosition: draftCube.dropPosition,
          finalPosition: draftCube.finalPosition!,
        });

        confirmSaveCube(draftId, remoteId); // Updates to 'synced'

        // Success - clean up flow state
        setOwnerCardOpen(false);
        setDraftId(null);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : "Save failed";
        failSaveCube(draftId, msg);
        setOwnerError(msg);
      }
    },
    [draftId, draftCube, requestSaveCube, confirmSaveCube, failSaveCube],
  );

  const onOwnerDismiss = useCallback(() => {
    setOwnerCardOpen(false);
  }, []);

  const onAbandonFlow = useCallback(() => {
    // Clean up UI state
    setIsPlacing(false);
    setDraftId(null);
    setOwnerCardOpen(false);
    setOwnerError(null);
    setAuthStatus(AUTH_IDLE);

    // Clean up data state
    abandonDataFlow();
  }, [abandonDataFlow]);

  // Handle cube dropped - end placing mode and set draft
  const onCubeDropped = useCallback((localId: string) => {
    setDraftId(localId);
    setIsPlacing(false); // Exit placing mode
  }, []);

  // Handle focus complete - show owner card
  const onCubeFocused = useCallback(
    (localId: string) => {
      if (localId === draftId) {
        setOwnerCardOpen(true);
      }
    },
    [draftId],
  );

  return (
    <CubeFlowContext.Provider
      value={{
        isPlacing,
        draftId,
        isSaving,
        ownerCardOpen,
        authStatus,
        ownerError: ownerError || saveError,
        hasUnsavedDraft,
        togglePlacing,
        setDraftId,
        setOwnerCardOpen,
        onCubeDropped,
        onCubeFocused,
        onConnectLinkedIn,
        onSaveConfirm,
        onOwnerDismiss,
        onAbandonFlow,
      }}
    >
      {children}
    </CubeFlowContext.Provider>
  );
};
