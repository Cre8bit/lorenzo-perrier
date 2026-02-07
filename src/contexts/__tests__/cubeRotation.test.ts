/**
 * Tests for cube rotation persistence
 */

import { describe, it, expect } from "vitest";
import type { Quaternion, CubeDomain } from "@/types/CubeModel";
import type { CubeFirestoreView } from "@/types/CubeModel";
import { handleSettleCube } from "@/contexts/cubeReducerHandlers";
import type { CubeDataState } from "@/contexts/cubeReducerHandlers";

describe("Cube Rotation Persistence", () => {
  const identityRotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

  describe("handleSettleCube", () => {
    it("should store rotation when cube settles", () => {
      const initialState: CubeDataState = {
        cubesByLocalId: new Map([
          [
            "cube-1",
            {
              localId: "cube-1",
              status: "draft",
              color: "hsl(192, 55%, 58%)",
              dropPosition: { x: 0, y: 10, z: 0 },
              finalRotation: identityRotation,
              createdAtLocal: Date.now(),
            },
          ],
        ]),
        localIdByRemoteId: new Map(),
        bufferedSnapshot: null,
        activeFlowId: null,
      };

      const rotation: Quaternion = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };

      const nextState = handleSettleCube(initialState, {
        localId: "cube-1",
        finalPosition: { x: 0, y: 0.5, z: 0 },
        finalRotation: rotation,
      });

      const cube = nextState.cubesByLocalId.get("cube-1");
      expect(cube).toBeDefined();
      expect(cube?.finalPosition).toEqual({ x: 0, y: 0.5, z: 0 });
      expect(cube?.finalRotation).toEqual(rotation);
    });

    it("should update rotation when cube settles", () => {
      const oldRotation: Quaternion = { x: 0.1, y: 0.1, z: 0.1, w: 0.9 };
      const newRotation: Quaternion = { x: 0.5, y: 0.5, z: 0, w: 0.7 };

      const initialState: CubeDataState = {
        cubesByLocalId: new Map([
          [
            "cube-1",
            {
              localId: "cube-1",
              status: "draft",
              color: "hsl(192, 55%, 58%)",
              dropPosition: { x: 0, y: 10, z: 0 },
              finalRotation: oldRotation,
              createdAtLocal: Date.now(),
            },
          ],
        ]),
        localIdByRemoteId: new Map(),
        bufferedSnapshot: null,
        activeFlowId: null,
      };

      const nextState = handleSettleCube(initialState, {
        localId: "cube-1",
        finalPosition: { x: 0, y: 0.5, z: 0 },
        finalRotation: newRotation,
      });

      const cube = nextState.cubesByLocalId.get("cube-1");
      expect(cube?.finalRotation).toEqual(newRotation);
    });
  });

  describe("Firestore integration", () => {
    it("should include rotation in Firestore view format", () => {
      const rotation: Quaternion = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
      const firestoreCube: CubeFirestoreView = {
        remoteId: "remote-1",
        userId: "user-1",
        color: "hsl(192, 55%, 58%)",
        dropPosition: { x: 0, y: 10, z: 0 },
        finalPosition: { x: 0, y: 0.5, z: 0 },
        finalRotation: rotation,
        createdAt: Date.now(),
      };

      expect(firestoreCube.finalRotation).toEqual(rotation);
    });

    it("should require rotation in Firestore view", () => {
      const firestoreCube: CubeFirestoreView = {
        remoteId: "remote-1",
        userId: "user-1",
        color: "hsl(192, 55%, 58%)",
        dropPosition: { x: 0, y: 10, z: 0 },
        finalPosition: { x: 0, y: 0.5, z: 0 },
        finalRotation: identityRotation,
        createdAt: Date.now(),
      };

      expect(firestoreCube.finalRotation).toBeDefined();
      expect(firestoreCube.finalRotation).toEqual(identityRotation);
    });
  });

  describe("Domain model", () => {
    it("should allow rotation in CubeDomain", () => {
      const rotation: Quaternion = { x: 0.1, y: 0.2, z: 0.3, w: 0.9 };
      const cube: CubeDomain = {
        localId: "cube-1",
        status: "synced",
        color: "hsl(192, 55%, 58%)",
        dropPosition: { x: 0, y: 10, z: 0 },
        finalPosition: { x: 0, y: 0.5, z: 0 },
        finalRotation: rotation,
        createdAtLocal: Date.now(),
      };

      expect(cube.finalRotation).toEqual(rotation);
    });

    it("should normalize quaternion values", () => {
      const rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
      const cube: CubeDomain = {
        localId: "cube-1",
        status: "draft",
        color: "hsl(192, 55%, 58%)",
        dropPosition: { x: 0, y: 10, z: 0 },
        finalRotation: rotation,
        createdAtLocal: Date.now(),
      };

      // Identity quaternion (no rotation)
      expect(cube.finalRotation?.w).toBe(1);
      expect(cube.finalRotation?.x).toBe(0);
      expect(cube.finalRotation?.y).toBe(0);
      expect(cube.finalRotation?.z).toBe(0);
    });
  });
});
