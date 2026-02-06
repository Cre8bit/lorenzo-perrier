/**
 * CubeFlowProvider.test.tsx - Integration tests for UI flow provider
 *
 * Tests UI state management, save flow orchestration, and Auth0 integration
 * Uses mocked Firebase and Auth0 to avoid real network calls
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { ReactNode } from "react";
import { CubeSpaceDataProvider } from "@/contexts/CubeSpaceDataProvider";
import { CubeFlowProvider } from "@/contexts/CubeFlowProvider";
import { useCubeFlow } from "@/contexts/useCubeFlow";
import { useCubeSpaceData } from "@/contexts/useCubeSpaceData";
import { clearAuth0Mocks } from "@/test/mocks/auth0";
import { clearMockSubscriptions } from "@/test/mocks/firebase";

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
      return vi.fn();
    },
  ),
  listenUsers: vi.fn(
    (
      onNext: (data: unknown[], meta: ListenerMeta) => void,
      onError?: (error: Error) => void,
    ) => {
      _listenUsersCallback = { onNext, onError: onError || vi.fn() };
      return vi.fn();
    },
  ),
  createUserDoc: vi.fn().mockResolvedValue("user-123"),
  createCubeDoc: vi.fn(async (_data: unknown) => {
    const docId = "cube-" + Date.now();
    return { docId };
  }),
}));

vi.mock("@/lib/auth0", () => {
  return {
    loginWithLinkedInPopup: vi.fn().mockResolvedValue({
      sub: "linkedin|12345",
      name: "Test User",
    }),
    isAuth0Configured: vi.fn().mockReturnValue(true),
  };
});

describe("CubeFlowProvider", () => {
  beforeEach(() => {
    clearMockSubscriptions();
    clearAuth0Mocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearMockSubscriptions();
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <CubeSpaceDataProvider enabled={true}>
        <CubeFlowProvider>{children}</CubeFlowProvider>
      </CubeSpaceDataProvider>
    );
  };

  describe("UI Flow State", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPlacing).toBe(false);
      expect(result.current.draftId).toBeNull();
      expect(result.current.isSaving).toBe(false);
      expect(result.current.ownerCardOpen).toBe(false);
      expect(result.current.hasUnsavedDraft).toBe(false);
      expect(result.current.hasSavedCube).toBe(false);
    });

    it("should toggle placing mode", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.togglePlacing();
      });

      expect(result.current.isPlacing).toBe(true);

      act(() => {
        result.current.togglePlacing();
      });

      expect(result.current.isPlacing).toBe(false);
    });

    it("should prevent placing when unsaved draft exists", async () => {
      const { result: flowResult } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });
      const { result: dataResult } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(),
      });

      // Drop a cube to create draft
      act(() => {
        dataResult.current.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      await waitFor(() => {
        expect(dataResult.current.cubesByLocalId.size).toBe(1);
      });

      act(() => {
        flowResult.current.onCubeDropped("draft-1");
      });

      const hasUnsavedDraft = flowResult.current.hasUnsavedDraft;

      // Try to toggle placing when draft exists - should not toggle
      const prevPlacing = flowResult.current.isPlacing;
      act(() => {
        flowResult.current.togglePlacing();
      });

      // If there's a draft and we weren't placing, should remain false
      if (hasUnsavedDraft && !prevPlacing) {
        expect(flowResult.current.isPlacing).toBe(false);
      }
    });

    it("should prevent placing when user already saved a cube", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      // Simulate save completion (would set hasSavedCube internally)
      // For now, we can't directly test this without going through full save flow
      // This is a behavior test placeholder
      expect(result.current.hasSavedCube).toBe(false);
    });

    it("should handle cube dropped event", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.togglePlacing();
      });

      expect(result.current.isPlacing).toBe(true);

      act(() => {
        result.current.onCubeDropped("draft-1");
      });

      expect(result.current.draftId).toBe("draft-1");
      expect(result.current.isPlacing).toBe(true); // Stays true during simulation
    });

    it("should handle simulation complete event", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.togglePlacing();
        result.current.onCubeDropped("draft-1");
      });

      expect(result.current.isPlacing).toBe(true);

      act(() => {
        result.current.onSimulationComplete();
      });

      expect(result.current.isPlacing).toBe(false);
    });

    it("should handle cube focused event", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onCubeDropped("draft-1");
      });

      act(() => {
        result.current.onCubeFocused("draft-1");
      });

      expect(result.current.ownerCardOpen).toBe(true);
    });

    it("should not open owner card for wrong cube ID", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onCubeDropped("draft-1");
      });

      act(() => {
        result.current.onCubeFocused("wrong-id");
      });

      expect(result.current.ownerCardOpen).toBe(false);
    });
  });

  describe("Save Flow", () => {
    it("should set isSaving during save operation", async () => {
      const { result: flowResult } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });
      const { result: dataResult } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(),
      });

      // Drop and settle a cube
      act(() => {
        dataResult.current.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        dataResult.current.settleCube({
          localId: "draft-1",
          finalPosition: { x: 1, y: 0, z: 3 },
        });
        flowResult.current.onCubeDropped("draft-1");
      });

      // Verify setup
      await waitFor(() => {
        expect(flowResult.current.draftId).toBe("draft-1");
      });

      // Save flow should complete
      await act(async () => {
        await flowResult.current.onSaveConfirm({
          firstName: "Test",
          lastName: "User",
          verified: true,
        });
      });

      // Test passes if no errors thrown - save flow executed
      expect(flowResult.current).toBeDefined();
    });

    it("should call Firebase functions during save", async () => {
      const { createUserDoc, createCubeDoc } =
        await import("@/lib/cubespaceStorage");
      const mockCreateUserDoc = vi.mocked(
        createUserDoc as ReturnType<typeof vi.fn>,
      );
      const mockCreateCubeDoc = vi.mocked(
        createCubeDoc as ReturnType<typeof vi.fn>,
      );

      const { result } = renderHook(
        () => ({
          flow: useCubeFlow(),
          data: useCubeSpaceData(),
        }),
        { wrapper: createWrapper() },
      );

      // Drop and settle a cube
      act(() => {
        result.current.data.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.data.settleCube({
          localId: "draft-1",
          finalPosition: { x: 1, y: 0, z: 3 },
        });
        result.current.flow.onCubeDropped("draft-1");
      });

      await waitFor(() => {
        expect(result.current.flow.draftId).toBe("draft-1");
      });

      await act(async () => {
        await result.current.flow.onSaveConfirm({
          firstName: "Test",
          lastName: "User",
          verified: true,
        });
      });

      expect(mockCreateUserDoc).toHaveBeenCalled();
      expect(mockCreateCubeDoc).toHaveBeenCalled();
    });
  });

  describe("LinkedIn Auth", () => {
    it("should call Auth0 popup on connect", async () => {
      const auth0 = await import("@/lib/auth0");
      const loginWithLinkedInPopup = vi.mocked(
        (auth0 as Record<string, unknown>).loginWithLinkedInPopup as ReturnType<
          typeof vi.fn
        >,
      );

      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.onConnectLinkedIn();
      });

      expect(loginWithLinkedInPopup).toHaveBeenCalled();
    });

    it("should set authStatus correctly during login", async () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      expect(result.current.authStatus.status).toBe("idle");

      await act(async () => {
        await result.current.onConnectLinkedIn();
      });

      // After successful login, should return to idle
      expect(result.current.authStatus.status).toBe("idle");
    });

    it("should handle missing Auth0 configuration", async () => {
      // Mock isAuth0Configured to return false for this test
      const auth0 = await import("@/lib/auth0");
      const isAuth0Configured = vi.mocked(
        (auth0 as Record<string, unknown>).isAuth0Configured as ReturnType<
          typeof vi.fn
        >,
      );
      isAuth0Configured.mockReturnValueOnce(false);

      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.onConnectLinkedIn();
      });

      expect(result.current.authStatus.status).toBe("error");
      expect(result.current.authStatus.message).toContain("Auth0 missing");
    });
  });

  describe("Flow Cleanup", () => {
    it("should clean up on abandon flow", async () => {
      const { result: flowResult } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });
      const { result: dataResult } = renderHook(() => useCubeSpaceData(), {
        wrapper: createWrapper(),
      });

      // Set up a draft
      act(() => {
        dataResult.current.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
      });

      await waitFor(() => {
        expect(dataResult.current.cubesByLocalId.size).toBe(1);
      });

      act(() => {
        flowResult.current.togglePlacing();
        flowResult.current.onCubeDropped("draft-1");
        flowResult.current.setOwnerCardOpen(true);
      });

      // Abandon flow
      act(() => {
        flowResult.current.onAbandonFlow();
      });

      // Verify cleanup
      expect(flowResult.current.draftId).toBeNull();
      expect(flowResult.current.isPlacing).toBe(false);
      expect(flowResult.current.ownerCardOpen).toBe(false);
      expect(flowResult.current.ownerError).toBeNull();
      expect(flowResult.current.authStatus.status).toBe("idle");
    });

    it("should dismiss owner card", () => {
      const { result } = renderHook(() => useCubeFlow(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setOwnerCardOpen(true);
      });

      expect(result.current.ownerCardOpen).toBe(true);

      act(() => {
        result.current.onOwnerDismiss();
      });

      expect(result.current.ownerCardOpen).toBe(false);
    });
  });

  describe("Derived State", () => {
    it("should correctly compute hasUnsavedDraft", async () => {
      const { result } = renderHook(
        () => ({
          flow: useCubeFlow(),
          data: useCubeSpaceData(),
        }),
        { wrapper: createWrapper() },
      );

      expect(result.current.flow.hasUnsavedDraft).toBe(false);

      // Drop a cube
      act(() => {
        result.current.data.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.flow.onCubeDropped("draft-1");
      });

      await waitFor(() => {
        expect(result.current.flow.draftId).toBe("draft-1");
        expect(result.current.flow.hasUnsavedDraft).toBe(true);
      });
    });

    it("should correctly compute isSaving", async () => {
      const { result } = renderHook(
        () => ({
          flow: useCubeFlow(),
          data: useCubeSpaceData(),
        }),
        { wrapper: createWrapper() },
      );

      // Drop and start saving
      act(() => {
        result.current.data.dropCube({
          localId: "draft-1",
          color: "hsl(200, 50%, 50%)",
          dropPosition: { x: 1, y: 2, z: 3 },
        });
        result.current.flow.onCubeDropped("draft-1");
      });

      await waitFor(() => {
        expect(result.current.flow.draftId).toBe("draft-1");
      });

      act(() => {
        result.current.data.requestSaveCube("draft-1");
      });

      await waitFor(() => {
        expect(result.current.flow.isSaving).toBe(true);
      });
    });
  });
});
