/**
 * cubeReducerHandlers - Extracted reducer logic for testability
 *
 * Each handler is independently testable and handles one action type.
 * The main reducer becomes a simple dispatcher.
 */

import type { CubeDomain, Vec3 } from "@/types/CubeModel";
import type { CubeFirestoreView } from "@/types/CubeModel";

/**
 * State Shape
 */
export type CubeDataState = {
  cubesByLocalId: Map<string, CubeDomain>;
  localIdByRemoteId: Map<string, string>;
  bufferedSnapshot: CubeFirestoreView[] | null;
  activeFlowId: string | null; // NEW: O(1) flow detection
};

/**
 * Action Types
 */
export type CubeDataAction =
  | {
      type: "DROP_CUBE";
      payload: { localId: string; color: string; dropPosition: Vec3 };
    }
  | { type: "SETTLE_CUBE"; payload: { localId: string; finalPosition: Vec3 } }
  | { type: "SAVE_REQUEST"; payload: { localId: string } }
  | { type: "SAVE_SUCCESS"; payload: { localId: string; remoteId: string } }
  | { type: "SAVE_FAIL"; payload: { localId: string; error: string } }
  | { type: "ABANDON_FLOW" } // NEW: Explicit flow cleanup
  | { type: "LISTENER_SNAPSHOT"; payload: CubeFirestoreView[] }
  | { type: "RESET_WITH_FALLBACK"; payload: CubeFirestoreView[] };

/**
 * Helper: Process a Firestore snapshot into state
 */
const processSnapshot = (
  newCubes: Map<string, CubeDomain>,
  newLookup: Map<string, string>,
  snapshot: CubeFirestoreView[],
) => {
  for (const remoteCube of snapshot) {
    if (!remoteCube.remoteId) continue;

    let localId = newLookup.get(remoteCube.remoteId);

    if (localId) {
      // Update existing cube
      const existing = newCubes.get(localId);
      if (existing) {
        newCubes.set(localId, {
          ...existing,
          remoteId: remoteCube.remoteId,
          status: "synced",
          color: remoteCube.color,
          finalPosition: remoteCube.finalPosition,
          userId: remoteCube.userId,
          createdAtRemote: remoteCube.createdAt,
        });
      }
    } else {
      // New remote cube -> create local entity
      localId = crypto.randomUUID();
      newLookup.set(remoteCube.remoteId, localId);
      newCubes.set(localId, {
        localId,
        remoteId: remoteCube.remoteId,
        status: "synced",
        color: remoteCube.color,
        dropPosition: remoteCube.dropPosition,
        finalPosition: remoteCube.finalPosition,
        userId: remoteCube.userId,
        createdAtRemote: remoteCube.createdAt,
        createdAtLocal: Date.now(),
      });
    }
  }
};

/**
 * Handler: DROP_CUBE
 * Creates a new draft cube in client state
 */
export const handleDropCube = (
  state: CubeDataState,
  payload: { localId: string; color: string; dropPosition: Vec3 },
): CubeDataState => {
  const { localId, color, dropPosition } = payload;
  const newCubes = new Map(state.cubesByLocalId);

  newCubes.set(localId, {
    localId,
    status: "draft",
    color,
    dropPosition,
    createdAtLocal: Date.now(),
  });

  return {
    ...state,
    cubesByLocalId: newCubes,
    activeFlowId: localId, // Set active flow
  };
};

/**
 * Handler: SETTLE_CUBE
 * Updates the final position of a cube after physics settling
 */
export const handleSettleCube = (
  state: CubeDataState,
  payload: { localId: string; finalPosition: Vec3 },
): CubeDataState => {
  const { localId, finalPosition } = payload;
  const newCubes = new Map(state.cubesByLocalId);
  const cube = newCubes.get(localId);

  if (cube) {
    newCubes.set(localId, { ...cube, finalPosition });
  }

  return {
    ...state,
    cubesByLocalId: newCubes,
  };
};

/**
 * Handler: SAVE_REQUEST
 * Marks cube as "saving" before async Firebase operation
 */
export const handleSaveRequest = (
  state: CubeDataState,
  payload: { localId: string },
): CubeDataState => {
  const { localId } = payload;
  const newCubes = new Map(state.cubesByLocalId);
  const cube = newCubes.get(localId);

  if (cube) {
    newCubes.set(localId, { ...cube, status: "saving" });
  }

  return {
    ...state,
    cubesByLocalId: newCubes,
  };
};

/**
 * Handler: SAVE_SUCCESS
 * Optimistically updates cube and processes buffered snapshot
 */
export const handleSaveSuccess = (
  state: CubeDataState,
  payload: { localId: string; remoteId: string },
): CubeDataState => {
  const { localId, remoteId } = payload;
  const newCubes = new Map(state.cubesByLocalId);
  const newLookup = new Map(state.localIdByRemoteId);
  const cube = newCubes.get(localId);

  if (cube) {
    // Update cube with remote ID
    newCubes.set(localId, { ...cube, remoteId, status: "saving" });
    newLookup.set(remoteId, localId);

    // Process buffered snapshot if exists
    if (state.bufferedSnapshot) {
      processSnapshot(newCubes, newLookup, state.bufferedSnapshot);
    }
  }

  return {
    cubesByLocalId: newCubes,
    localIdByRemoteId: newLookup,
    bufferedSnapshot: null,
    activeFlowId: null, // Clear active flow
  };
};

/**
 * Handler: SAVE_FAIL
 * Marks cube as error state
 */
export const handleSaveFail = (
  state: CubeDataState,
  payload: { localId: string; error: string },
): CubeDataState => {
  const { localId } = payload;
  const newCubes = new Map(state.cubesByLocalId);
  const cube = newCubes.get(localId);

  if (cube) {
    newCubes.set(localId, { ...cube, status: "error" });
  }

  // Keep buffer in case user retries
  return {
    ...state,
    cubesByLocalId: newCubes,
  };
};

/**
 * Handler: ABANDON_FLOW
 * User cancels the add flow - clean up draft and buffer
 */
export const handleAbandonFlow = (state: CubeDataState): CubeDataState => {
  const { activeFlowId } = state;
  if (!activeFlowId) return state;

  const newCubes = new Map(state.cubesByLocalId);
  const cube = newCubes.get(activeFlowId);

  // Remove draft cube if it exists and hasn't been synced
  if (cube && cube.status !== "synced") {
    newCubes.delete(activeFlowId);
  }

  // Process any buffered snapshot
  const newLookup = new Map(state.localIdByRemoteId);
  if (state.bufferedSnapshot) {
    processSnapshot(newCubes, newLookup, state.bufferedSnapshot);
  }

  return {
    cubesByLocalId: newCubes,
    localIdByRemoteId: newLookup,
    bufferedSnapshot: null,
    activeFlowId: null,
  };
};

/**
 * Handler: LISTENER_SNAPSHOT
 * Incoming Firestore data - buffer if flow is active
 */
export const handleListenerSnapshot = (
  state: CubeDataState,
  payload: CubeFirestoreView[],
): CubeDataState => {
  // Buffer if we have an active flow
  if (state.activeFlowId !== null) {
    return {
      ...state,
      bufferedSnapshot: payload,
    };
  }

  // Otherwise process immediately
  const newCubes = new Map(state.cubesByLocalId);
  const newLookup = new Map(state.localIdByRemoteId);
  processSnapshot(newCubes, newLookup, payload);

  return {
    cubesByLocalId: newCubes,
    localIdByRemoteId: newLookup,
    bufferedSnapshot: null,
    activeFlowId: null,
  };
};

/**
 * Handler: RESET_WITH_FALLBACK
 * Reset state with fallback data (for offline mode)
 */
export const handleResetWithFallback = (
  state: CubeDataState,
  payload: CubeFirestoreView[],
): CubeDataState => {
  const newCubes = new Map<string, CubeDomain>();
  const newLookup = new Map<string, string>();

  for (const fb of payload) {
    const localId = crypto.randomUUID();
    newLookup.set(fb.remoteId, localId);
    newCubes.set(localId, {
      localId,
      remoteId: fb.remoteId,
      status: "synced",
      color: fb.color,
      dropPosition: fb.dropPosition,
      finalPosition: fb.finalPosition,
      userId: fb.userId,
      createdAtRemote: fb.createdAt,
      createdAtLocal: Date.now(),
    });
  }

  return {
    cubesByLocalId: newCubes,
    localIdByRemoteId: newLookup,
    bufferedSnapshot: null,
    activeFlowId: null,
  };
};

/**
 * Main Reducer - Simple dispatcher
 */
export function cubeDataReducer(
  state: CubeDataState,
  action: CubeDataAction,
): CubeDataState {
  switch (action.type) {
    case "DROP_CUBE":
      return handleDropCube(state, action.payload);
    case "SETTLE_CUBE":
      return handleSettleCube(state, action.payload);
    case "SAVE_REQUEST":
      return handleSaveRequest(state, action.payload);
    case "SAVE_SUCCESS":
      return handleSaveSuccess(state, action.payload);
    case "SAVE_FAIL":
      return handleSaveFail(state, action.payload);
    case "ABANDON_FLOW":
      return handleAbandonFlow(state);
    case "LISTENER_SNAPSHOT":
      return handleListenerSnapshot(state, action.payload);
    case "RESET_WITH_FALLBACK":
      return handleResetWithFallback(state, action.payload);
    default:
      return state;
  }
}
