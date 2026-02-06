import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PageWrapper } from "@/components/transitions/PageTransition";
import type { CubeSceneStats } from "@/components/cubespace/CubeScene";
import { CubeSpaceOverlay } from "@/components/cubespace/CubeSpaceOverlay";
import { CubeOwnerCard } from "@/components/cubespace/CubeOwnerCard";
import { CubeSpaceConstellationLoader } from "@/components/cubespace/CubeSpaceConstellationLoader";
import { getRandomColor } from "@/components/cubespace/cubeColors";
import {
  buildFullName,
  type CubeProfileMap,
} from "@/components/cubespace/cubeProfiles";
import { useAppContext } from "@/contexts/useAppContext";
import { useCubeSpaceData } from "@/contexts/useCubeSpaceData";
import { useCubeFlow } from "@/contexts/useCubeFlow";
import { CubeFlowProvider } from "@/contexts/CubeFlowProvider";
import type { Vec3 } from "@/types/CubeModel";
import { isAuth0Configured } from "@/lib/auth0";
import { reportPerformance } from "@/components/ui/performance-overlay";

// Lazy load the heavy Three.js scene
const CubeScene = lazy(() => import("@/components/cubespace/CubeScene"));

type Props = {
  active?: boolean;
};

function useOwnerPanelRect(open: boolean) {
  const ownerPanelRef = useRef<HTMLDivElement | null>(null);
  const [ownerPanelRect, setOwnerPanelRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  return { ownerPanelRef, ownerPanelRect };
}

const CubeSpaceInner = ({ active = true }: Props) => {
  const { setCurrentSection, setIsCubeSpaceReady, setIsCubeSpaceSceneReady } =
    useAppContext();

  // --- Data Context ---
  const {
    authReady,
    usersLoaded,
    cubesLoaded,
    users: storedUsers,
    cubesByLocalId,
    error: cubeSpaceDataError,
    dropCube,
    settleCube,
  } = useCubeSpaceData();

  // --- Flow Context ---
  const {
    isPlacing,
    togglePlacing,
    draftId,
    ownerCardOpen,
    hasSavedCube,
    onCubeDropped: flowHandleCubeDropped,
    onSimulationComplete,
    onCubeFocused: flowHandleCubeFocused,
    onOwnerDismiss,
    onSaveConfirm,
    onConnectLinkedIn,
    authStatus,
    ownerError,
    isSaving,
  } = useCubeFlow();

  // --- Local UI State ---
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());
  const [stats, setStats] = useState<CubeSceneStats>({
    cubeCount: 0,
    towerHeight: 0,
  });
  const [sceneReady, setSceneReady] = useState(false);
  const [activeCubeScreen, setActiveCubeScreen] = useState<{
    localId: string | null;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);

  // --- Event Handlers ---

  // 1. Drop: Create a new draft in the store
  const handleCubeDropped = useCallback(
    (payload: {
      localId?: string;
      dropPosition: Vec3;
      color: string;
      createdAt: number;
    }) => {
      const newLocalId = payload.localId || crypto.randomUUID();

      dropCube({
        localId: newLocalId,
        color: payload.color,
        dropPosition: payload.dropPosition,
      });

      // Notify flow that cube was dropped (sets draftId, turns off placing mode)
      flowHandleCubeDropped(newLocalId);
    },
    [dropCube, flowHandleCubeDropped],
  );

  // 2. Settle: Update position and end placing mode for camera focus
  const handleCubeSettled = useCallback(
    (payload: { localId: string; finalPosition: Vec3 }) => {
      settleCube(payload);
      // End placing mode so camera can focus on the settled cube
      onSimulationComplete();
    },
    [settleCube, onSimulationComplete],
  );

  // 3. Focus Complete: Ready for Owner Input
  const handleFocusComplete = useCallback(
    (payload: { localId: string }) => {
      // Notify flow that cube is focused (opens owner card if it's the draft)
      flowHandleCubeFocused(payload.localId);
    },
    [flowHandleCubeFocused],
  );

  const { ownerPanelRef, ownerPanelRect } = useOwnerPanelRect(
    active && ownerCardOpen,
  );

  // --- Effects ---
  useEffect(() => {
    if (!active) return;
    setCurrentSection("cubeSpace");
  }, [active, setCurrentSection]);

  const cubeSpaceReady =
    sceneReady &&
    (cubeSpaceDataError != null || (authReady && usersLoaded && cubesLoaded));

  useEffect(() => {
    if (!active) return;
    setIsCubeSpaceReady(cubeSpaceReady);
  }, [active, cubeSpaceReady, setIsCubeSpaceReady]);

  const handleSceneReady = useCallback(() => {
    if (!active) return;
    setSceneReady(true);
    setIsCubeSpaceSceneReady(true);
  }, [active, setIsCubeSpaceSceneReady]);

  // --- Memos ---
  const cubesList = useMemo(
    () => Array.from(cubesByLocalId.values()),
    [cubesByLocalId],
  );

  const cubeProfiles = useMemo(() => {
    const t0 = performance.now();
    const profiles: CubeProfileMap = {};
    const userMap = new Map(storedUsers.map((user) => [user.id, user]));

    for (const cube of cubesList) {
      // Only mapped cubes have profiles
      if (cube.userId && userMap.has(cube.userId)) {
        const user = userMap.get(cube.userId)!;
        profiles[cube.localId] = {
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: buildFullName(user.firstName, user.lastName),
          linkedinUrl: user.linkedinUrl,
          verified: user.verified,
          photoUrl: user.photoUrl,
        };
      }
    }
    reportPerformance("CubeSpace:profiles", performance.now() - t0);
    return profiles;
  }, [cubesList, storedUsers]);

  // Active profile for the owner card
  const activeProfile = draftId ? cubeProfiles[draftId] : null;

  // --- Events ---
  const handleActiveCubeScreenChange = useCallback(
    (payload: {
      localId: string | null;
      x: number;
      y: number;
      visible: boolean;
    }) => {
      setActiveCubeScreen(payload);
    },
    [],
  );

  // Bridge for OwnerCard onSaveName
  const handleSaveName = useCallback(
    (data: { firstName: string; lastName: string; linkedinUrl?: string }) => {
      onSaveConfirm({
        firstName: data.firstName,
        lastName: data.lastName,
        linkedinUrl: data.linkedinUrl,
        verified: false,
      });
    },
    [onSaveConfirm],
  );

  // Bridge for OwnerCard onConnectLinkedIn
  const handleConnectLinkedIn = useCallback(async () => {
    const user = await onConnectLinkedIn();
    if (user) {
      const name = user.name ?? "";
      const firstName = user.given_name ?? name.split(" ")[0] ?? "";
      const lastName = name.split(" ").slice(1).join(" ") ?? "";

      const linkedInUrl = (user as { profile?: string }).profile;
      const photoUrl = (user as { picture?: string }).picture;

      onSaveConfirm({
        firstName,
        lastName,
        linkedinUrl: linkedInUrl,
        verified: true,
        photoUrl: photoUrl ?? undefined,
      });
    }
  }, [onConnectLinkedIn, onSaveConfirm]);

  const showSceneLoader = active && !cubeSpaceReady;
  const sceneLoaderMessage = sceneReady
    ? "Loading cubes..."
    : "Loading scene...";

  return (
    <div
      aria-hidden={!active}
      className={`fixed inset-0 z-20 ${active ? "" : "invisible pointer-events-none"}`}
    >
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

          <div className="absolute inset-0 z-10">
            <Suspense fallback={null}>
              {(cubesLoaded || cubeSpaceDataError) && (
                <CubeScene
                  active={active}
                  isPlacing={isPlacing}
                  onStatsChange={setStats}
                  selectedColor={selectedColor}
                  onCubeDropped={handleCubeDropped}
                  onCubeSettled={handleCubeSettled}
                  cubes={cubesList}
                  cubeProfiles={cubeProfiles}
                  focusCubeId={draftId}
                  activeCubeId={draftId}
                  ownerCardOpen={ownerCardOpen}
                  onFocusComplete={handleFocusComplete}
                  onActiveCubeScreenChange={handleActiveCubeScreenChange}
                  onSceneReady={handleSceneReady}
                />
              )}
            </Suspense>
            {showSceneLoader && (
              <CubeSpaceConstellationLoader
                className="absolute inset-0 z-20"
                message={sceneLoaderMessage}
                size={170}
              />
            )}
          </div>

          {/* UI Overlay Layer */}
          <div className="relative z-20 pointer-events-none">
            {active && cubeSpaceReady && (
              <CubeSpaceOverlay
                cubeCount={stats.cubeCount}
                towerHeight={stats.towerHeight}
                isPlacing={isPlacing}
                onTogglePlacing={togglePlacing}
                canAddCube={!draftId && !hasSavedCube}
                hasDraft={!!draftId}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            )}

            {active && cubeSpaceReady && ownerCardOpen && (
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
                      saving={isSaving}
                      onDismiss={isSaving ? undefined : onOwnerDismiss}
                      onConnectLinkedIn={
                        isSaving ? undefined : handleConnectLinkedIn
                      }
                      onSaveName={isSaving ? undefined : handleSaveName}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </PageWrapper>
    </div>
  );
};

// Wrap with provider to separate flow state from presentation
const CubeSpace = (props: Props) => {
  return (
    <CubeFlowProvider>
      <CubeSpaceInner {...props} />
    </CubeFlowProvider>
  );
};

export default CubeSpace;
