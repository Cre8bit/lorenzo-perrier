/**
 * CubeSpaceDataProvider.test.tsx - Integration tests for the data provider
 *
 * Tests provider initialization, Firebase listener integration, and action dispatching
 * Uses mocked Firebase to avoid real network calls
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { ReactNode } from "react";
import { CubeSpaceDataProvider } from "@/contexts/CubeSpaceDataProvider";
import { useCubeSpaceData } from "@/contexts/useCubeSpaceData";
import {
  clearMockSubscriptions,
  simulateSnapshot,
} from "@/test/mocks/firebase";
import {
  createMockCubeFirestoreView,
  createMockUserDomain,
} from "@/test/testUtils";

// Type definitions for mock Firebase listeners
interface ListenerMeta {
  fromCache: boolean;
  size: number;
  empty: boolean;
}

interface FirestoreListenerCallback<T> {
  onNext: (data: T[], meta: ListenerMeta) => void;
  onError: (error: Error) => void;
}

type CubeListenerCallback = FirestoreListenerCallback<Record<string, unknown>>;
type UserListenerCallback = FirestoreListenerCallback<Record<string, unknown>>;

// Mock Firebase modules
vi.mock("@/lib/firebase", () => ({
  ensureAnonymousAuth: vi.fn().mockResolvedValue(undefined),
}));

let _listenCubesCallback: CubeListenerCallback | undefined;
let _listenUsersCallback: UserListenerCallback | undefined;

vi.mock("@/lib/cubespaceStorage", () => ({
  listenCubes: vi.fn(
    (
      onNext: (data: unknown[], meta: ListenerMeta) => void,
      onError?: (error: Error) => void,
    ) => {
      _listenCubesCallback = { onNext, onError: onError || vi.fn() };
      return vi.fn(); // mock unsubscribe
    },
  ),
  listenUsers: vi.fn(
    (
      onNext: (data: unknown[], meta: ListenerMeta) => void,
      onError?: (error: Error) => void,
    ) => {
      _listenUsersCallback = { onNext, onError: onError || vi.fn() };
      return vi.fn(); // mock unsubscribe
    },
  ),
  createUserDoc: vi.fn().mockResolvedValue("user-123"),
  createCubeDoc: vi.fn().mockResolvedValue({ docId: "cube-123" }),
}));

// Custom simulateSnapshot that matches the real Firebase callback signature
// The real callbacks receive: onChange(parsedArray, meta)
const simulateSnapshotLocal = (
  type: "cubes" | "users",
  data: unknown[],
): void => {
  const callback =
    type === "cubes" ? _listenCubesCallback : _listenUsersCallback;
  if (!callback) {
    console.warn(`No callback registered for ${type}`);
    return;
  }

  // Call onChange with the parsed array directly (not a snapshot object)
  const meta: ListenerMeta = {
    fromCache: false,
    size: data.length,
    empty: data.length === 0,
  };

  callback.onNext(data as Record<string, unknown>[], meta);
};

describe("CubeSpaceDataProvider", () => {
  beforeEach(() => {
    clearMockSubscriptions();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMockSubscriptions();
  });

  const createWrapper = (enabled = true) => {
    return ({ children }: { children: ReactNode }) => (
      <CubeSpaceDataProvider enabled={enabled}>
        {children}
      </CubeSpaceDataProvider>
    );
  };

  describe("Initialization", () => {
    it("should render without errors", () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      expect(result.current).toBeDefined();
    });

    it("should start with empty state when disabled", () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(false),
      });

      expect(result.current.cubesByLocalId.size).toBe(0);
      expect(result.current.users).toEqual([]);
      expect(result.current.authReady).toBe(false);
    });

    it("should initialize Firebase auth when enabled", async () => {
      const { ensureAnonymousAuth } = await import("@/lib/firebase");

      renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(ensureAnonymousAuth).toHaveBeenCalled();
      });
    });

    it("should expose all required context values", () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      expect(result.current).toHaveProperty("authReady");
      expect(result.current).toHaveProperty("usersLoaded");
      expect(result.current).toHaveProperty("cubesLoaded");
      expect(result.current).toHaveProperty("users");
      expect(result.current).toHaveProperty("cubesByLocalId");
      expect(result.current).toHaveProperty("localIdByRemoteId");
      expect(result.current).toHaveProperty("activeFlowId");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("dropCube");
      expect(result.current).toHaveProperty("settleCube");
      expect(result.current).toHaveProperty("requestSaveCube");
      expect(result.current).toHaveProperty("confirmSaveCube");
      expect(result.current).toHaveProperty("failSaveCube");
      expect(result.current).toHaveProperty("abandonFlow");
    });
  });

  describe("Firestore Listeners", () => {
    it("should load cubes from Firestore", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      const mockCubes = [
        createMockCubeFirestoreView({ remoteId: "cube-1" }),
        createMockCubeFirestoreView({ remoteId: "cube-2" }),
      ];

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      act(() => {
        simulateSnapshotLocal("cubes", mockCubes);
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(2);
      });

      const cubes = Array.from(result.current.cubesByLocalId.values());
      expect(cubes[0].status).toBe("synced");
      expect(cubes[1].status).toBe("synced");
    });

    it("should load users from Firestore", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      const mockUsers = [
        createMockUserDomain({ id: "user-1", firstName: "Alice" }),
        createMockUserDomain({ id: "user-2", firstName: "Bob" }),
      ];

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      act(() => {
        simulateSnapshotLocal("users", mockUsers);
      });

      await waitFor(() => {
        expect(result.current.users).toHaveLength(2);
      });

      expect(result.current.users[0].firstName).toBe("Alice");
      expect(result.current.users[1].firstName).toBe("Bob");
    });

    it("should update state on listener updates", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      // Initial snapshot
      act(() => {
        simulateSnapshotLocal("cubes", [
          createMockCubeFirestoreView({ remoteId: "cube-1" }),
        ]);
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      // Updated snapshot with more cubes
      act(() => {
        simulateSnapshotLocal("cubes", [
          createMockCubeFirestoreView({ remoteId: "cube-1" }),
          createMockCubeFirestoreView({ remoteId: "cube-2" }),
        ]);
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(2);
      });
    });

    it("should handle Firestore errors gracefully", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      // Simulate an error by calling the error callback directly
      act(() => {
        if (_listenCubesCallback?.onError) {
          _listenCubesCallback.onError(
            new Error("Firestore connection failed"),
          );
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toContain("Firestore connection failed");
    });

    it("should use fallback data on error", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      // Simulate error
      act(() => {
        if (_listenCubesCallback?.onError) {
          _listenCubesCallback.onError(new Error("Network error"));
        }
      });

      await waitFor(() => {
        expect(result.current.cubesLoaded).toBe(true);
      });

      // Should have fallback cube(s)
      expect(result.current.cubesByLocalId.size).toBeGreaterThan(0);
    });
  });

  describe("Action Dispatching", () => {
    it("should dispatch dropCube action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      const cube = result.current.cubesByLocalId.get("test-local-1");
      expect(cube?.status).toBe("draft");
      expect(result.current.activeFlowId).toBe("test-local-1");
    });

    it("should dispatch settleCube action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      // First drop a cube
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 10, z: 3 },
        });
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      // Then settle it
      act(() => {
        result.current.settleCube({
          localId: "test-local-1",
          finalPosition: { x: 1, y: 0, z: 3 },
        });
      });

      await waitFor(() => {
        const cube = result.current.cubesByLocalId.get("test-local-1");
        expect(cube?.finalPosition).toEqual({ x: 1, y: 0, z: 3 });
      });
    });

    it("should dispatch requestSaveCube action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      // Drop and settle a cube
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.settleCube({
          localId: "test-local-1",
          finalPosition: { x: 1, y: 0, z: 3 },
        });
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      // Request save
      act(() => {
        result.current.requestSaveCube("test-local-1");
      });

      await waitFor(() => {
        const cube = result.current.cubesByLocalId.get("test-local-1");
        expect(cube?.status).toBe("saving");
      });
    });

    it("should dispatch confirmSaveCube action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      // Drop and request save
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.requestSaveCube("test-local-1");
      });

      await waitFor(() => {
        const cube = result.current.cubesByLocalId.get("test-local-1");
        expect(cube?.status).toBe("saving");
      });

      // Confirm save
      act(() => {
        result.current.confirmSaveCube("test-local-1", "remote-123");
      });

      await waitFor(() => {
        const cube = result.current.cubesByLocalId.get("test-local-1");
        expect(cube?.remoteId).toBe("remote-123");
      });

      expect(result.current.localIdByRemoteId.get("remote-123")).toBe(
        "test-local-1",
      );
      expect(result.current.activeFlowId).toBeNull();
    });

    it("should dispatch failSaveCube action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      // Drop and request save
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.requestSaveCube("test-local-1");
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.get("test-local-1")?.status).toBe(
          "saving",
        );
      });

      // Fail save
      act(() => {
        result.current.failSaveCube("test-local-1", "Network error");
      });

      await waitFor(() => {
        const cube = result.current.cubesByLocalId.get("test-local-1");
        expect(cube?.status).toBe("error");
      });
    });

    it("should dispatch abandonFlow action", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      // Drop a cube
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      // Abandon flow
      act(() => {
        result.current.abandonFlow();
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(0);
      });

      expect(result.current.activeFlowId).toBeNull();
    });
  });

  describe("Buffer Management", () => {
    it("should buffer snapshots during active flow", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      // Start a flow
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      await waitFor(() => {
        expect(result.current.activeFlowId).toBe("test-local-1");
      });

      // Simulate snapshot during active flow
      act(() => {
        simulateSnapshot("cubes", [
          createMockCubeFirestoreView({ remoteId: "remote-999" }),
        ]);
      });

      // Should only have the draft cube, snapshot buffered
      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      const draftCube = result.current.cubesByLocalId.get("test-local-1");
      expect(draftCube?.status).toBe("draft");
    });

    it("should process buffered snapshot on save success", async () => {
      const { result } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(true),
      });

      await waitFor(() => {
        expect(result.current.authReady).toBe(true);
      });

      // Start a flow
      act(() => {
        result.current.dropCube({
          localId: "test-local-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      // Simulate buffered snapshot
      act(() => {
        simulateSnapshotLocal("cubes", [
          createMockCubeFirestoreView({ remoteId: "remote-999" }),
        ]);
      });

      await waitFor(() => {
        expect(result.current.cubesByLocalId.size).toBe(1);
      });

      // Confirm save - should process buffer
      act(() => {
        result.current.confirmSaveCube("test-local-1", "remote-123");
      });

      await waitFor(() => {
        // After save success, buffer should be processed
        // We should now have 2 cubes: the saved one and the buffered one
        expect(result.current.cubesByLocalId.size).toBe(2);
      });

      // Verify both cubes exist
      const cubes = Array.from(result.current.cubesByLocalId.values());
      expect(cubes.some((c) => c.remoteId === "remote-123")).toBe(true);
      expect(cubes.some((c) => c.remoteId === "remote-999")).toBe(true);
    });
  });
});
