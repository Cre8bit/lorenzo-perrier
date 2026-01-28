import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SocialLinks, ContactActions } from "@/components/ui/social-links";
import { LiquidNavigation } from "@/components/sections/LiquidNavigation";
import { PageWrapper } from "@/components/transitions/PageTransition";
import { ConstellationRevealLoader } from "@/components/transitions/ConstellationRevealLoader";

import type { CubeSceneStats } from "@/components/cubespace/CubeScene";
import { CubeSpaceOverlay } from "@/components/cubespace/CubeSpaceOverlay";
import { CubeOwnerCard } from "@/components/cubespace/CubeOwnerCard";
import { getRandomColor } from "@/components/cubespace/cubeColors";
import {
  buildFullName,
  type CubeProfile,
  type CubeProfileMap,
} from "@/components/cubespace/cubeProfiles";
import { isAuth0Configured, loginWithLinkedInPopup } from "@/lib/auth0";
import { ensureAnonymousAuth } from "@/lib/firebase";
import {
  listenCubes,
  listenUsers,
  normalizeLinkedIn,
  normalizeNameKey,
  upsertCube,
  upsertUser,
  type StoredCube,
  type StoredUser,
  type Vec3,
} from "@/lib/cubespaceStorage";

// Lazy load the heavy Three.js scene
const CubeScene = lazy(() => import("@/components/cubespace/CubeScene"));

const VIEWER_PROFILE_KEY = "cubespace-viewer-profile";

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const CubeSpace = () => {
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());

  // NEW: placing mode + live stats from scene
  const [isPlacing, setIsPlacing] = useState(false);
  const [stats, setStats] = useState<CubeSceneStats>({
    cubeCount: 0,
    towerHeight: 0,
  });

  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]);
  const [storedCubes, setStoredCubes] = useState<StoredCube[]>([]);
  const [viewerProfile, setViewerProfile] = useState<CubeProfile | null>(() =>
    readStorage<CubeProfile | null>(VIEWER_PROFILE_KEY, null),
  );
  const [ephemeralProfiles, setEphemeralProfiles] = useState<CubeProfileMap>(
    {},
  );
  const [activeCubeId, setActiveCubeId] = useState<number | null>(null);
  const [focusCubeId, setFocusCubeId] = useState<number | null>(null);
  const [ownerCardOpen, setOwnerCardOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [cubesLoaded, setCubesLoaded] = useState(false);
  const [activeCubeScreen, setActiveCubeScreen] = useState<{
    id: number | null;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);
  const ownerPanelRef = useRef<HTMLDivElement | null>(null);
  const [ownerPanelRect, setOwnerPanelRect] = useState<DOMRect | null>(null);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const [authStatus, setAuthStatus] = useState<{
    status: "idle" | "loading" | "error";
    message?: string;
  }>({
    status: "idle",
  });
  const pendingCubesRef = useRef<
    Map<
      number,
      {
        id: number;
        color: string;
        dropPosition: Vec3;
        finalPosition?: Vec3;
        createdAt?: number;
        user?: StoredUser;
      }
    >
  >(new Map());
  const pendingRevealIdRef = useRef<number | null>(null);

  useEffect(() => {
    writeStorage(VIEWER_PROFILE_KEY, viewerProfile);
  }, [viewerProfile]);

  const handleUsersSnapshot = useCallback((users: StoredUser[]) => {
    setStoredUsers(users);
  }, []);

  const handleCubesSnapshot = useCallback((cubes: StoredCube[]) => {
    setStoredCubes(cubes);
    setCubesLoaded(true);
  }, []);

  useEffect(() => {
    let unsubUsers: (() => void) | null = null;
    let unsubCubes: (() => void) | null = null;
    let alive = true;

    const start = async () => {
      try {
        await ensureAnonymousAuth();
        if (!alive) return;
        unsubUsers = listenUsers(handleUsersSnapshot);
        unsubCubes = listenCubes(handleCubesSnapshot);
      } catch (error) {
        console.error("Failed to init anonymous auth:", error);
      }
    };

    start();
    return () => {
      alive = false;
      unsubUsers?.();
      unsubCubes?.();
    };
  }, [handleCubesSnapshot, handleUsersSnapshot]);

  useEffect(() => {
    if (!ownerCardOpen && authStatus.status !== "idle") {
      setAuthStatus({ status: "idle" });
    }
  }, [authStatus.status, ownerCardOpen]);

  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  useEffect(() => {
    if (!ownerCardOpen) {
      setOwnerPanelRect(null);
      return;
    }
    const element = ownerPanelRef.current;
    if (!element) return;
    const update = () => {
      if (!ownerPanelRef.current) return;
      setOwnerPanelRect(ownerPanelRef.current.getBoundingClientRect());
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ownerCardOpen]);

  const initialCubes = useMemo(
    () =>
      storedCubes.map((cube) => ({
        id: cube.id,
        position: [
          cube.finalPosition.x,
          cube.finalPosition.y,
          cube.finalPosition.z,
        ] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        color: cube.color,
        createdAt: cube.createdAt,
      })),
    [storedCubes],
  );

  const cubeProfiles = useMemo(() => {
    const profiles: CubeProfileMap = {};
    const userMap = new Map(storedUsers.map((user) => [user.id, user]));
    storedCubes.forEach((cube) => {
      const user = userMap.get(cube.userId);
      if (!user) return;
      profiles[cube.id] = {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        linkedinUrl: user.linkedinUrl,
        verified: user.verified,
        photoUrl: user.photoUrl,
      };
    });
    return { ...profiles, ...ephemeralProfiles };
  }, [ephemeralProfiles, storedCubes, storedUsers]);

  const activeProfile =
    activeCubeId != null ? (cubeProfiles[activeCubeId] ?? null) : null;

  const persistPendingCube = useCallback((id: number) => {
    const pending = pendingCubesRef.current.get(id);
    if (!pending?.finalPosition || !pending?.user) return;
    const user = pending.user;
    setStoredUsers((prev) =>
      prev.some((entry) => entry.id === user.id) ? prev : [...prev, user],
    );
    setStoredCubes((prev) =>
      prev.some((cube) => cube.id === pending.id)
        ? prev
        : [
            ...prev,
            {
              id: pending.id,
              userId: user.id,
              color: pending.color,
              dropPosition: pending.dropPosition,
              finalPosition: pending.finalPosition,
              createdAt: pending.createdAt ?? Date.now(),
            },
          ],
    );
    ensureAnonymousAuth()
      .then(() =>
        Promise.all([
          upsertUser(user),
          upsertCube({
            id: pending.id,
            userId: user.id,
            color: pending.color,
            dropPosition: pending.dropPosition,
            finalPosition: pending.finalPosition,
            createdAt: pending.createdAt ?? Date.now(),
          }),
        ]),
      )
      .catch((error) => {
        console.error("Failed to save cube or user:", error);
      });
    pendingCubesRef.current.delete(id);
    setEphemeralProfiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const collectUsersForValidation = useCallback(
    (excludeCubeId?: number | null) => {
      const pendingUsers = Array.from(pendingCubesRef.current.values())
        .filter((pending) => pending.user && pending.id !== excludeCubeId)
        .map((pending) => pending.user as StoredUser);
      return [...storedUsers, ...pendingUsers];
    },
    [storedUsers],
  );

  const registerUserForActiveCube = useCallback(
    (nextUser: StoredUser) => {
      if (activeCubeId == null) return;
      const nameKey = nextUser.id;
      const linkedKey = normalizeLinkedIn(nextUser.linkedinUrl);
      const users = collectUsersForValidation(activeCubeId);
      if (users.some((user) => user.id === nameKey)) {
        setOwnerError("That name is already used. Try a different name.");
        return;
      }
      if (
        linkedKey &&
        users.some((user) => normalizeLinkedIn(user.linkedinUrl) === linkedKey)
      ) {
        setOwnerError("That LinkedIn URL is already used.");
        return;
      }

      setOwnerError(null);
      const profile: CubeProfile = {
        firstName: nextUser.firstName,
        lastName: nextUser.lastName,
        fullName: nextUser.fullName,
        linkedinUrl: nextUser.linkedinUrl,
        verified: nextUser.verified,
        photoUrl: nextUser.photoUrl,
      };

      setViewerProfile(profile);
      setEphemeralProfiles((prev) => ({ ...prev, [activeCubeId]: profile }));

      const pending = pendingCubesRef.current.get(activeCubeId);
      if (pending) {
        pending.user = nextUser;
        pendingCubesRef.current.set(activeCubeId, pending);
      }

      persistPendingCube(activeCubeId);
      setOwnerCardOpen(false);
      setFocusCubeId(null);
      setActiveCubeId(null);
      pendingRevealIdRef.current = null;
    },
    [activeCubeId, collectUsersForValidation, persistPendingCube],
  );

  const handleCubeDropped = (payload: {
    id: number;
    dropPosition: Vec3;
    color: string;
    createdAt: number;
  }) => {
    pendingCubesRef.current.set(payload.id, {
      id: payload.id,
      color: payload.color,
      dropPosition: payload.dropPosition,
      createdAt: payload.createdAt,
    });
    setIsPlacing(false);
    setActiveCubeId(payload.id);
    setFocusCubeId(null);
    setOwnerCardOpen(false);
    setOwnerError(null);
    pendingRevealIdRef.current = payload.id;
    if (viewerProfile) {
      setEphemeralProfiles((prev) => ({
        ...prev,
        [payload.id]: viewerProfile,
      }));
    }
  };

  const handleCubeSettled = (payload: { id: number; finalPosition: Vec3 }) => {
    const pending = pendingCubesRef.current.get(payload.id);
    if (!pending) return;
    pending.finalPosition = payload.finalPosition;
    pendingCubesRef.current.set(payload.id, pending);
    if (payload.id === activeCubeId) {
      setFocusCubeId(payload.id);
      setFocusTick((tick) => tick + 1);
    }
    persistPendingCube(payload.id);
  };

  const handleTogglePlacing = () => {
    setOwnerCardOpen(false);
    setOwnerError(null);
    setFocusCubeId(null);
    setIsPlacing((value) => !value);
    pendingRevealIdRef.current = null;
  };

  const handleOwnerDismiss = () => {
    setOwnerCardOpen(false);
    setOwnerError(null);
    setFocusCubeId(null);
    setActiveCubeId(null);
    pendingRevealIdRef.current = null;
  };

  const handleActiveCubeScreenChange = useCallback(
    (payload: {
      id: number | null;
      x: number;
      y: number;
      visible: boolean;
    }) => {
      setActiveCubeScreen(payload);
    },
    [],
  );

  const handleFocusComplete = useCallback(
    (payload: { id: number }) => {
      if (payload.id !== activeCubeId) return;
      if (pendingRevealIdRef.current !== payload.id) return;
      setOwnerCardOpen(true);
      pendingRevealIdRef.current = null;
    },
    [activeCubeId],
  );

  const handleSaveName = (data: {
    firstName: string;
    lastName: string;
    linkedinUrl?: string;
  }) => {
    if (activeCubeId == null) return;
    setOwnerError(null);
    const nameKey = normalizeNameKey(data.firstName, data.lastName);
    const nextUser: StoredUser = {
      id: nameKey,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: buildFullName(data.firstName, data.lastName),
      linkedinUrl: data.linkedinUrl || viewerProfile?.linkedinUrl,
      verified: viewerProfile?.verified ?? false,
      photoUrl: viewerProfile?.photoUrl,
    };
    registerUserForActiveCube(nextUser);
  };

  const handleConnectLinkedIn = async () => {
    setOwnerError(null);
    if (!isAuth0Configured()) {
      setAuthStatus({
        status: "error",
        message: "Auth0 is not configured yet.",
      });
      return;
    }
    setAuthStatus({ status: "loading" });
    try {
      const user = await loginWithLinkedInPopup();
      if (!user) {
        setAuthStatus({ status: "idle" });
        return;
      }
      const name = user.name ?? "";
      const firstName = user.given_name ?? name.split(" ")[0] ?? "";
      const lastName =
        user.family_name ?? name.split(" ").slice(1).join(" ") ?? "";
      if (!firstName || !lastName) {
        setAuthStatus({ status: "idle" });
        setOwnerError(
          "We couldn't read your full name from LinkedIn. Try adding it manually.",
        );
        return;
      }
      const linkedInUrl =
        (user as { profile?: string }).profile ?? viewerProfile?.linkedinUrl;
      const nextUser: StoredUser = {
        id: normalizeNameKey(firstName, lastName),
        firstName,
        lastName,
        fullName: name || buildFullName(firstName, lastName),
        photoUrl: user.picture ?? viewerProfile?.photoUrl,
        linkedinUrl: linkedInUrl,
        verified: true,
      };
      setAuthStatus({ status: "idle" });
      registerUserForActiveCube(nextUser);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "LinkedIn connection failed.";
      setAuthStatus({ status: "error", message });
    }
  };

  return (
    <PageWrapper>
      <main className="relative h-screen w-full overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 10%, hsla(220, 30%, 12%, 0.8) 0%, transparent 50%),
                radial-gradient(ellipse 60% 50% at 80% 90%, hsla(200, 25%, 10%, 0.6) 0%, transparent 50%),
                linear-gradient(180deg, hsl(220, 20%, 6%) 0%, hsl(220, 15%, 4%) 100%)
              `,
            }}
          />

          {/* Subtle dots pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="dots-pattern"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="hsl(185, 50%, 55%)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-pattern)" />
          </svg>
        </div>

        {/* Three.js Scene */}
        <div className="absolute inset-0 z-10">
          <Suspense fallback={null}>
            <CubeScene
              isPlacing={isPlacing}
              onStatsChange={setStats}
              selectedColor={selectedColor}
              onCubeDropped={handleCubeDropped}
              onCubeSettled={handleCubeSettled}
              initialCubes={initialCubes}
              initialCubesLoaded={cubesLoaded}
              cubeProfiles={cubeProfiles}
              focusCubeId={focusCubeId}
              focusTick={focusTick}
              activeCubeId={activeCubeId}
              ownerCardOpen={ownerCardOpen}
              onFocusComplete={handleFocusComplete}
              onActiveCubeScreenChange={handleActiveCubeScreenChange}
              onSceneReady={handleSceneReady}
            />
          </Suspense>
        </div>

        {(!cubesLoaded || !sceneReady) && (
          <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm pointer-events-auto">
            <ConstellationRevealLoader
              size={190}
              points={14}
              durationMs={4200} // slower
              seed={Math.floor(Math.random() * 10000)}
              maxLinkDist={38}
              neighbors={2}
            />{" "}
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
              Loading cubes
            </div>
          </div>
        )}

        {/* UI Overlay Layer */}
        <div className="relative z-20 pointer-events-none">
          {/* Social links */}
          <div className="pointer-events-auto">
            <SocialLinks />
          </div>

          {/* Contact button */}
          <div className="pointer-events-auto">
            <ContactActions />
          </div>

          {/* NEW overlay */}
          {sceneReady && (
            <CubeSpaceOverlay
              cubeCount={stats.cubeCount}
              towerHeight={stats.towerHeight}
              isPlacing={isPlacing}
              onTogglePlacing={handleTogglePlacing}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
          )}

          {/* Owner panel + tether line */}
          {sceneReady && ownerCardOpen && (
            <>
              <svg className="fixed inset-0 h-full w-full pointer-events-none">
                {activeCubeScreen?.visible && ownerPanelRect && (
                  <>
                    <line
                      x1={activeCubeScreen.x}
                      y1={activeCubeScreen.y}
                      x2={ownerPanelRect.left}
                      y2={ownerPanelRect.top + ownerPanelRect.height / 2}
                      stroke="hsla(180, 60%, 75%, 0.65)"
                      strokeWidth="1"
                    />
                    <circle
                      cx={activeCubeScreen.x}
                      cy={activeCubeScreen.y}
                      r={3}
                      fill="hsla(180, 60%, 80%, 0.9)"
                    />
                  </>
                )}
              </svg>
              <div className="fixed right-8 top-1/2 -translate-y-1/2 pointer-events-auto">
                <div
                  ref={ownerPanelRef}
                  className="rounded-2xl border shadow-2xl"
                  style={{
                    backdropFilter: "blur(20px)",
                    background:
                      "linear-gradient(135deg, hsla(210, 30%, 18%, 0.65), hsla(210, 20%, 10%, 0.35))",
                    borderColor: "hsla(210, 40%, 80%, 0.14)",
                    boxShadow: "0 20px 60px hsla(210, 30%, 8%, 0.55)",
                  }}
                >
                  <CubeOwnerCard
                    open={ownerCardOpen}
                    profile={activeProfile}
                    authConfigured={isAuth0Configured()}
                    authStatus={authStatus}
                    error={ownerError}
                    onDismiss={handleOwnerDismiss}
                    onConnectLinkedIn={handleConnectLinkedIn}
                    onSaveName={handleSaveName}
                  />
                </div>
              </div>
            </>
          )}

          {/* Liquid Navigation */}
          <div className="pointer-events-auto">
            <LiquidNavigation />
          </div>
        </div>
      </main>
    </PageWrapper>
  );
};

export default CubeSpace;
