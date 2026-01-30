import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { CubeSpaceDataContext } from "@/contexts/CubeSpaceDataContext";
import { ensureAnonymousAuth } from "@/lib/firebase";
import { listenCubes, listenUsers, type StoredCube, type StoredUser } from "@/lib/cubespaceStorage";

const FALLBACK_USER_ID = "xm87b1nkG3SvJF3Tovih";
const FALLBACK_USERS: StoredUser[] = [
  {
    id: FALLBACK_USER_ID,
    firstName: "Lorenzo",
    lastName: "Perrier de La Bâthie",
    fullName: "Lorenzo Perrier de La Bâthie",
    linkedinUrl: "https://www.linkedin.com/in/lorenzoperrier/",
    profession: "AI & Software engineer",
    verified: true,
    createdAt: 1769555247650,
  },
];
const FALLBACK_CUBES: StoredCube[] = [
  {
    id: 1,
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
}> = ({
  children,
  enabled = false,
}) => {
  const startedRef = useRef(false);
  const [authReady, setAuthReady] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [cubesLoaded, setCubesLoaded] = useState(false);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [cubes, setCubes] = useState<StoredCube[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setCubes((prev) => (prev.length > 0 ? prev : FALLBACK_CUBES));
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
            setCubes((prev) => {
              const merged = new Map(prev.map((c) => [c.id, c]));
              for (const c of snapshotCubes) merged.set(c.id, c);
              return Array.from(merged.values());
            });
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
        cubes,
        error,
        setUsers,
        setCubes,
      }}
    >
      {children}
    </CubeSpaceDataContext.Provider>
  );
};
