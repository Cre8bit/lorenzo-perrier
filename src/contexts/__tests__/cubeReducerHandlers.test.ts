/**
 * cubeReducerHandlers.test.ts - Unit tests for all reducer handlers
 *
 * Tests each handler function independently to ensure correct state transformations
 * Validates behavioral invariants, not implementation details
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  handleDropCube,
  handleSettleCube,
  handleSaveRequest,
  handleSaveSuccess,
  handleSaveFail,
  handleAbandonFlow,
  handleListenerSnapshot,
  handleResetWithFallback,
  cubeDataReducer,
  type CubeDataState,
  type CubeDataAction,
} from "@/contexts/cubeReducerHandlers";
import type { CubeDomain, CubeFirestoreView, Vec3 } from "@/types/CubeModel";

describe("cubeReducerHandlers", () => {
  let initialState: CubeDataState;

  beforeEach(() => {
    initialState = {
      cubesByLocalId: new Map(),
      localIdByRemoteId: new Map(),
      bufferedSnapshot: null,
      activeFlowId: null,
    };
  });

  describe("handleDropCube", () => {
    it("should create a new cube with draft status", () => {
      const payload = {
        localId: "test-local-1",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 } as Vec3,
      };

      const result = handleDropCube(initialState, payload);

      expect(result.cubesByLocalId.size).toBe(1);
      const cube = result.cubesByLocalId.get("test-local-1");
      expect(cube).toBeDefined();
      expect(cube?.localId).toBe("test-local-1");
      expect(cube?.status).toBe("draft");
      expect(cube?.color).toBe("hsl(200, 50%, 50%)");
      expect(cube?.dropPosition).toEqual({ x: 1, y: 2, z: 3 });
      expect(cube?.createdAtLocal).toBeGreaterThan(0);
    });

    it("should set activeFlowId correctly", () => {
      const payload = {
        localId: "test-local-1",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 0, y: 0, z: 0 } as Vec3,
      };

      const result = handleDropCube(initialState, payload);

      expect(result.activeFlowId).toBe("test-local-1");
    });

    it("should preserve existing cubes", () => {
      const existingCube: CubeDomain = {
        localId: "existing-1",
        status: "synced",
        color: "hsl(100, 50%, 50%)",
        dropPosition: { x: 5, y: 6, z: 7 },
        createdAtLocal: Date.now() - 1000,
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["existing-1", existingCube]]),
      };

      const payload = {
        localId: "test-local-2",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 } as Vec3,
      };

      const result = handleDropCube(stateWithCube, payload);

      expect(result.cubesByLocalId.size).toBe(2);
      expect(result.cubesByLocalId.get("existing-1")).toEqual(existingCube);
      expect(result.cubesByLocalId.get("test-local-2")).toBeDefined();
    });
  });

  describe("handleSettleCube", () => {
    it("should update finalPosition", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 10, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        activeFlowId: "test-local-1",
      };

      const payload = {
        localId: "test-local-1",
        finalPosition: { x: 1, y: 0, z: 3 } as Vec3,
      };

      const result = handleSettleCube(stateWithCube, payload);

      const updatedCube = result.cubesByLocalId.get("test-local-1");
      expect(updatedCube?.finalPosition).toEqual({ x: 1, y: 0, z: 3 });
    });

    it("should handle missing cube gracefully", () => {
      const payload = {
        localId: "non-existent",
        finalPosition: { x: 1, y: 0, z: 3 } as Vec3,
      };

      const result = handleSettleCube(initialState, payload);

      // Should not crash, state unchanged
      expect(result.cubesByLocalId.size).toBe(0);
    });

    it("should preserve other cube properties", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 10, z: 3 },
        createdAtLocal: 12345,
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
      };

      const payload = {
        localId: "test-local-1",
        finalPosition: { x: 1, y: 0, z: 3 } as Vec3,
      };

      const result = handleSettleCube(stateWithCube, payload);
      const updatedCube = result.cubesByLocalId.get("test-local-1");

      expect(updatedCube?.localId).toBe("test-local-1");
      expect(updatedCube?.status).toBe("draft");
      expect(updatedCube?.color).toBe("hsl(200, 50%, 50%)");
      expect(updatedCube?.createdAtLocal).toBe(12345);
    });
  });

  describe("handleSaveRequest", () => {
    it('should change status to "saving"', () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        finalPosition: { x: 1, y: 0, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
      };

      const payload = { localId: "test-local-1" };
      const result = handleSaveRequest(stateWithCube, payload);

      const updatedCube = result.cubesByLocalId.get("test-local-1");
      expect(updatedCube?.status).toBe("saving");
    });

    it("should not affect other cubes", () => {
      const cube1: CubeDomain = {
        localId: "cube-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const cube2: CubeDomain = {
        localId: "cube-2",
        status: "synced",
        color: "hsl(100, 50%, 50%)",
        dropPosition: { x: 4, y: 5, z: 6 },
        createdAtLocal: Date.now(),
      };

      const stateWithCubes: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([
          ["cube-1", cube1],
          ["cube-2", cube2],
        ]),
      };

      const payload = { localId: "cube-1" };
      const result = handleSaveRequest(stateWithCubes, payload);

      expect(result.cubesByLocalId.get("cube-1")?.status).toBe("saving");
      expect(result.cubesByLocalId.get("cube-2")?.status).toBe("synced");
    });

    it("should handle missing cube gracefully", () => {
      const payload = { localId: "non-existent" };
      const result = handleSaveRequest(initialState, payload);

      expect(result.cubesByLocalId.size).toBe(0);
    });
  });

  describe("handleSaveSuccess", () => {
    it("should update cube with remoteId", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        finalPosition: { x: 1, y: 0, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        activeFlowId: "test-local-1",
      };

      const payload = { localId: "test-local-1", remoteId: "remote-123" };
      const result = handleSaveSuccess(stateWithCube, payload);

      const updatedCube = result.cubesByLocalId.get("test-local-1");
      expect(updatedCube?.remoteId).toBe("remote-123");
      expect(updatedCube?.status).toBe("saving"); // Status remains "saving" until listener confirms
    });

    it("should update localIdByRemoteId map", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
      };

      const payload = { localId: "test-local-1", remoteId: "remote-123" };
      const result = handleSaveSuccess(stateWithCube, payload);

      expect(result.localIdByRemoteId.get("remote-123")).toBe("test-local-1");
    });

    it("should process buffered snapshot if exists", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const bufferedSnapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-999",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 5, y: 6, z: 7 },
          finalPosition: { x: 5, y: 0, z: 7 },
          createdAt: Date.now(),
        },
      ];

      const stateWithBuffer: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        bufferedSnapshot,
        activeFlowId: "test-local-1",
      };

      const payload = { localId: "test-local-1", remoteId: "remote-123" };
      const result = handleSaveSuccess(stateWithBuffer, payload);

      // Buffered cube should be processed
      expect(result.cubesByLocalId.size).toBe(2);
      expect(result.bufferedSnapshot).toBeNull();
    });

    it("should clear activeFlowId", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        activeFlowId: "test-local-1",
      };

      const payload = { localId: "test-local-1", remoteId: "remote-123" };
      const result = handleSaveSuccess(stateWithCube, payload);

      expect(result.activeFlowId).toBeNull();
    });
  });

  describe("handleSaveFail", () => {
    it('should set status to "error"', () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
      };

      const payload = { localId: "test-local-1", error: "Network error" };
      const result = handleSaveFail(stateWithCube, payload);

      const updatedCube = result.cubesByLocalId.get("test-local-1");
      expect(updatedCube?.status).toBe("error");
    });

    it("should preserve buffer for retry", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "saving",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const bufferedSnapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-999",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 5, y: 6, z: 7 },
          finalPosition: { x: 5, y: 0, z: 7 },
          createdAt: Date.now(),
        },
      ];

      const stateWithBuffer: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        bufferedSnapshot,
      };

      const payload = { localId: "test-local-1", error: "Network error" };
      const result = handleSaveFail(stateWithBuffer, payload);

      expect(result.bufferedSnapshot).toEqual(bufferedSnapshot);
    });
  });

  describe("handleAbandonFlow", () => {
    it("should remove draft cube", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        activeFlowId: "test-local-1",
      };

      const result = handleAbandonFlow(stateWithCube);

      expect(result.cubesByLocalId.size).toBe(0);
    });

    it("should not remove synced cube", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "synced",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        remoteId: "remote-123",
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        activeFlowId: "test-local-1",
      };

      const result = handleAbandonFlow(stateWithCube);

      expect(result.cubesByLocalId.size).toBe(1);
      expect(result.cubesByLocalId.get("test-local-1")).toEqual(cube);
    });

    it("should process buffered snapshot", () => {
      const cube: CubeDomain = {
        localId: "test-local-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        createdAtLocal: Date.now(),
      };

      const bufferedSnapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-999",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 5, y: 6, z: 7 },
          finalPosition: { x: 5, y: 0, z: 7 },
          createdAt: Date.now(),
        },
      ];

      const stateWithBuffer: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-local-1", cube]]),
        bufferedSnapshot,
        activeFlowId: "test-local-1",
      };

      const result = handleAbandonFlow(stateWithBuffer);

      // Draft cube removed, buffered cube added
      expect(result.cubesByLocalId.size).toBe(1);
      expect(result.bufferedSnapshot).toBeNull();

      const processedCube = Array.from(result.cubesByLocalId.values())[0];
      expect(processedCube.status).toBe("synced");
    });

    it("should clear activeFlowId", () => {
      const stateWithFlow: CubeDataState = {
        ...initialState,
        activeFlowId: "test-local-1",
      };

      const result = handleAbandonFlow(stateWithFlow);

      expect(result.activeFlowId).toBeNull();
    });

    it("should handle no active flow gracefully", () => {
      const result = handleAbandonFlow(initialState);

      expect(result).toBe(initialState); // Returns same state
    });
  });

  describe("handleListenerSnapshot", () => {
    it("should buffer data when flow is active", () => {
      const snapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-123",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0, z: 3 },
          createdAt: Date.now(),
        },
      ];

      const stateWithFlow: CubeDataState = {
        ...initialState,
        activeFlowId: "test-local-1",
      };

      const result = handleListenerSnapshot(stateWithFlow, snapshot);

      expect(result.bufferedSnapshot).toEqual(snapshot);
      expect(result.cubesByLocalId.size).toBe(0); // Not processed yet
    });

    it("should process immediately when no active flow", () => {
      const snapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-123",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0, z: 3 },
          createdAt: Date.now(),
        },
      ];

      const result = handleListenerSnapshot(initialState, snapshot);

      expect(result.bufferedSnapshot).toBeNull();
      expect(result.cubesByLocalId.size).toBe(1);

      const cube = Array.from(result.cubesByLocalId.values())[0];
      expect(cube.status).toBe("synced");
      expect(cube.remoteId).toBe("remote-123");
    });

    it("should merge with existing cubes correctly", () => {
      const existingCube: CubeDomain = {
        localId: "local-existing",
        remoteId: "remote-123",
        status: "synced",
        color: "hsl(100, 50%, 50%)",
        dropPosition: { x: 1, y: 2, z: 3 },
        finalPosition: { x: 1, y: 0, z: 3 },
        createdAtLocal: Date.now(),
        createdAtRemote: Date.now(),
        userId: "user-1",
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["local-existing", existingCube]]),
        localIdByRemoteId: new Map([["remote-123", "local-existing"]]),
      };

      const snapshot: CubeFirestoreView[] = [
        {
          remoteId: "remote-123",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0.1, z: 3 }, // Slightly different
          createdAt: Date.now(),
        },
        {
          remoteId: "remote-456",
          userId: "user-2",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 4, y: 5, z: 6 },
          finalPosition: { x: 4, y: 0, z: 6 },
          createdAt: Date.now(),
        },
      ];

      const result = handleListenerSnapshot(stateWithCube, snapshot);

      expect(result.cubesByLocalId.size).toBe(2);

      // Existing cube updated
      const updated = result.cubesByLocalId.get("local-existing");
      expect(updated?.finalPosition?.y).toBe(0.1);

      // New cube added
      const newCubes = Array.from(result.cubesByLocalId.values()).filter(
        (c) => c.remoteId === "remote-456",
      );
      expect(newCubes).toHaveLength(1);
    });
  });

  describe("handleResetWithFallback", () => {
    it("should create fresh state from fallback data", () => {
      const fallback: CubeFirestoreView[] = [
        {
          remoteId: "fallback-1",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0, z: 3 },
          createdAt: Date.now(),
        },
        {
          remoteId: "fallback-2",
          userId: "user-2",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 4, y: 5, z: 6 },
          finalPosition: { x: 4, y: 0, z: 6 },
          createdAt: Date.now(),
        },
      ];

      const result = handleResetWithFallback(initialState, fallback);

      expect(result.cubesByLocalId.size).toBe(2);
      expect(result.localIdByRemoteId.size).toBe(2);
      expect(result.bufferedSnapshot).toBeNull();
      expect(result.activeFlowId).toBeNull();
    });

    it("should mark all cubes as synced", () => {
      const fallback: CubeFirestoreView[] = [
        {
          remoteId: "fallback-1",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0, z: 3 },
          createdAt: Date.now(),
        },
      ];

      const result = handleResetWithFallback(initialState, fallback);

      const cube = Array.from(result.cubesByLocalId.values())[0];
      expect(cube.status).toBe("synced");
    });

    it("should replace existing state completely", () => {
      const existingCube: CubeDomain = {
        localId: "old-cube",
        status: "draft",
        color: "hsl(50, 50%, 50%)",
        dropPosition: { x: 9, y: 9, z: 9 },
        createdAtLocal: Date.now(),
      };

      const stateWithOldData: CubeDataState = {
        cubesByLocalId: new Map([["old-cube", existingCube]]),
        localIdByRemoteId: new Map(),
        bufferedSnapshot: null,
        activeFlowId: "old-cube",
      };

      const fallback: CubeFirestoreView[] = [
        {
          remoteId: "fallback-1",
          userId: "user-1",
          color: "hsl(100, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
          finalPosition: { x: 1, y: 0, z: 3 },
          createdAt: Date.now(),
        },
      ];

      const result = handleResetWithFallback(stateWithOldData, fallback);

      expect(result.cubesByLocalId.size).toBe(1);
      expect(result.cubesByLocalId.has("old-cube")).toBe(false);
      expect(result.activeFlowId).toBeNull();
    });
  });

  describe("cubeDataReducer", () => {
    it("should dispatch to DROP_CUBE handler", () => {
      const action: CubeDataAction = {
        type: "DROP_CUBE",
        payload: {
          localId: "test-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        },
      };

      const result = cubeDataReducer(initialState, action);

      expect(result.cubesByLocalId.size).toBe(1);
      expect(result.activeFlowId).toBe("test-1");
    });

    it("should dispatch to SETTLE_CUBE handler", () => {
      const cube: CubeDomain = {
        localId: "test-1",
        status: "draft",
        color: "hsl(200, 50%, 50%)",
        dropPosition: { x: 1, y: 10, z: 3 },
        createdAtLocal: Date.now(),
      };

      const stateWithCube: CubeDataState = {
        ...initialState,
        cubesByLocalId: new Map([["test-1", cube]]),
      };

      const action: CubeDataAction = {
        type: "SETTLE_CUBE",
        payload: {
          localId: "test-1",
          finalPosition: { x: 1, y: 0, z: 3 },
        },
      };

      const result = cubeDataReducer(stateWithCube, action);

      expect(result.cubesByLocalId.get("test-1")?.finalPosition).toEqual({
        x: 1,
        y: 0,
        z: 3,
      });
    });

    it("should return unchanged state for unknown action", () => {
      const unknownAction = { type: "UNKNOWN_ACTION" } as never;

      const result = cubeDataReducer(initialState, unknownAction);

      expect(result).toBe(initialState);
    });

    it("should handle all action types without errors", () => {
      const actions: CubeDataAction[] = [
        {
          type: "DROP_CUBE",
          payload: {
            localId: "test-1",
            color: "hsl(200, 50%, 50%)",
            dropPosition: { x: 1, y: 2, z: 3 },
          },
        },
        {
          type: "SETTLE_CUBE",
          payload: { localId: "test-1", finalPosition: { x: 1, y: 0, z: 3 } },
        },
        {
          type: "SAVE_REQUEST",
          payload: { localId: "test-1" },
        },
        {
          type: "SAVE_SUCCESS",
          payload: { localId: "test-1", remoteId: "remote-1" },
        },
      ];

      let state = initialState;
      // Should not throw
      expect(() => {
        for (const action of actions) {
          state = cubeDataReducer(state, action);
        }
      }).not.toThrow();
    });
  });
});
