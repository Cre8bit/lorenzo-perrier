import { type ReactNode, useEffect, useRef } from "react";
import { useMatch } from "react-router-dom";
import { useBootContext } from "@/contexts/useBootContext";
import { AppBootLoader } from "@/components/transitions/AppBootLoader";

type Props = {
  children: ReactNode;
};

export const AppLoaderGate = ({ children }: Props) => {
  const {
    isParticleFieldInitialized,
    isCubeSpaceReady,
    hasBooted,
    setHasBooted,
  } = useBootContext();

  const isCubeSpaceRoute = useMatch("/cubespace/*") != null;
  const startedOnCubeSpaceRouteRef = useRef(isCubeSpaceRoute);

  const routeReady = isCubeSpaceRoute
    ? isParticleFieldInitialized && isCubeSpaceReady
    : isParticleFieldInitialized;

  useEffect(() => {
    if (isParticleFieldInitialized && !hasBooted) {
      setHasBooted(true);
    }
  }, [hasBooted, isParticleFieldInitialized, setHasBooted]);

  const showLoader = isCubeSpaceRoute
    ? startedOnCubeSpaceRouteRef.current
      ? !routeReady
      : !hasBooted
    : !hasBooted;

    console.log("AppLoaderGate", {
      isCubeSpaceRoute,
      startedOnCubeSpaceRouteRef: startedOnCubeSpaceRouteRef.current,
      isParticleFieldInitialized,
      isCubeSpaceReady,
      hasBooted,
      routeReady,
      showLoader,
    });
  return (
    <>
      {children}
      {showLoader && <AppBootLoader />}
    </>
  );
};
