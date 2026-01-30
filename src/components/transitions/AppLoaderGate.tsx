import { type ReactNode, useEffect, useRef } from "react";
import { useMatch } from "react-router-dom";
import { useAppContext } from "@/contexts/useAppContext";
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
  } = useAppContext();

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

  return (
    <>
      {children}
      {showLoader && <AppBootLoader />}
    </>
  );
};
