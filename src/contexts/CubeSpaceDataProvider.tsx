import {
  type FC,
  type ReactNode,
  useEffect,
  useReducer,
  useRef,
  useState,
  useCallback,
} from "react";
import { CubeSpaceDataContext } from "@/contexts/CubeSpaceDataContext";
import { ensureAnonymousAuth } from "@/lib/firebase";
import { listenCubes, listenUsers } from "@/lib/cubespaceStorage";
import type { UserDomain, CubeFirestoreView, Vec3 } from "@/types/CubeModel";
import { cubeDataReducer } from "@/contexts/cubeReducerHandlers";

// --- Fallback Data ---
const FALLBACK_USER_ID = "xm87b1nkG3SvJF3Tovih";
const FALLBACK_USERS: UserDomain[] = [
  {
    id: FALLBACK_USER_ID,
    firstName: "Lorenzo",
    lastName: "Perrier de La Bâthie",
    linkedinUrl: "https://www.linkedin.com/in/lorenzoperrier/",
    profession: "AI & Software engineer",
    verified: true,
    createdAt: 1769555247650,
  },
];
const FALLBACK_CUBES: CubeFirestoreView[] = [
  {
    remoteId: "fallback-cube-1",
    userId: FALLBACK_USER_ID,
    color: "hsl(192, 55%, 58%)",
    dropPosition: { x: 0, y: 10, z: 0 },
    finalPosition: { x: 0, y: 0, z: 0 },
    createdAt: 1769555625311,
  },
];

export const CubeSpaceDataProvider: FC<{
  children: ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = false }) => {
  const startedRef = useRef(false);
  const [authReady, setAuthReady] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [cubesLoaded, setCubesLoaded] = useState(false);
  const [users, setUsers] = useState<UserDomain[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use new extracted reducer with activeFlowId tracking
  const [state, dispatch] = useReducer(cubeDataReducer, {
    cubesByLocalId: new Map(),
    localIdByRemoteId: new Map(),
    bufferedSnapshot: null,
    activeFlowId: null, // NEW: O(1) flow tracking
  });

  // Actions
  const dropCube = useCallback(
    (payload: { localId: string; color: string; dropPosition: Vec3 }) => {
      dispatch({ type: "DROP_CUBE", payload });
    },
    [],
  );

  const settleCube = useCallback(
    (payload: { localId: string; finalPosition: Vec3 }) => {
      dispatch({ type: "SETTLE_CUBE", payload });
    },
    [],
  );

  const requestSaveCube = useCallback((localId: string) => {
    dispatch({ type: "SAVE_REQUEST", payload: { localId } });
  }, []);

  const confirmSaveCube = useCallback((localId: string, remoteId: string) => {
    dispatch({ type: "SAVE_SUCCESS", payload: { localId, remoteId } });
  }, []);

  const failSaveCube = useCallback((localId: string, error: string) => {
    dispatch({ type: "SAVE_FAIL", payload: { localId, error } });
  }, []);

  const abandonFlow = useCallback(() => {
    dispatch({ type: "ABANDON_FLOW" });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let unsubUsers: (() => void) | null = null;
    let unsubCubes: (() => void) | null = null;
    let alive = true;

    const applyFallback = (message: string) => {
      if (!alive) return;
      setError(message);
      setUsersLoaded(true);
      setCubesLoaded(true);
      setUsers((prev) => (prev.length > 0 ? prev : FALLBACK_USERS));
      dispatch({ type: "RESET_WITH_FALLBACK", payload: FALLBACK_CUBES });
    };

    const start = async () => {
      try {
        await ensureAnonymousAuth();
        if (!alive) return;
        setAuthReady(true);

        unsubUsers = listenUsers(
          (snapshotUsers, meta) => {
            if (!alive) return;
            setError(null);
            if (!meta.fromCache || !meta.empty) setUsersLoaded(true);
            setUsers((prev) => {
              const merged = new Map(prev.map((u) => [u.id, u]));
              for (const u of snapshotUsers) merged.set(u.id, u);
              return Array.from(merged.values());
            });
          },
          (err) => {
            const message = err instanceof Error ? err.message : String(err);
            applyFallback(message);
          },
        );

        unsubCubes = listenCubes(
          (snapshotCubes, meta) => {
            if (!alive) return;
            setError(null);
            if (!meta.fromCache || !meta.empty) setCubesLoaded(true);
            // Dispatch snapshot to reducer
            dispatch({ type: "LISTENER_SNAPSHOT", payload: snapshotCubes });
          },
          (err) => {
            const message = err instanceof Error ? err.message : String(err);
            applyFallback(message);
          },
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        applyFallback(message);
      }
    };

    start();
    return () => {
      alive = false;
      unsubUsers?.();
      unsubCubes?.();
    };
  }, [enabled]);

  return (
    <CubeSpaceDataContext.Provider
      value={{
        authReady,
        usersLoaded,
        cubesLoaded,
        users,
        cubesByLocalId: state.cubesByLocalId,
        localIdByRemoteId: state.localIdByRemoteId,
        activeFlowId: state.activeFlowId, // NEW: Expose activeFlowId
        error,
        setUsers,
        dropCube,
        settleCube,
        requestSaveCube,
        confirmSaveCube,
        failSaveCube,
        abandonFlow, // NEW: Expose abandonFlow
      }}
    >
      {children}
    </CubeSpaceDataContext.Provider>
  );
};
