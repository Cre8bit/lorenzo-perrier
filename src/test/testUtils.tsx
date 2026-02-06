/**
 * Test Utilities - Custom render functions and data factories
 */

import { render, type RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { CubeSpaceDataProvider } from "@/contexts/CubeSpaceDataProvider";
import { CubeFlowProvider } from "@/contexts/CubeFlowProvider";
import type {
  CubeDomain,
  UserDomain,
  CubeFirestoreView,
  Vec3,
} from "@/types/CubeModel";

/**
 * Data Factories for creating test data
 */

export const createMockVec3 = (overrides?: Partial<Vec3>): Vec3 => ({
  x: 0,
  y: 0,
  z: 0,
  ...overrides,
});

export const createMockCubeDomain = (
  overrides?: Partial<CubeDomain>,
): CubeDomain => ({
  localId: `local-${Date.now()}-${Math.random()}`,
  status: "draft",
  color: "hsl(200, 50%, 50%)",
  dropPosition: createMockVec3(),
  createdAtLocal: Date.now(),
  ...overrides,
});

export const createMockUserDomain = (
  overrides?: Partial<UserDomain>,
): UserDomain => ({
  id: `user-${Date.now()}-${Math.random()}`,
  firstName: "Test",
  lastName: "User",
  verified: true,
  createdAt: Date.now(),
  ...overrides,
});

export const createMockCubeFirestoreView = (
  overrides?: Partial<CubeFirestoreView>,
): CubeFirestoreView => ({
  remoteId: `remote-${Date.now()}-${Math.random()}`,
  userId: `user-${Date.now()}`,
  color: "hsl(200, 50%, 50%)",
  dropPosition: createMockVec3(),
  finalPosition: createMockVec3(),
  createdAt: Date.now(),
  ...overrides,
});

/**
 * Custom Render with Providers
 */

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  providerProps?: {
    dataProviderEnabled?: boolean;
  };
}

// Wrapper with all necessary providers
const AllProviders = ({
  children,
  enabled = false,
}: {
  children: ReactNode;
  enabled?: boolean;
}) => {
  return (
    <CubeSpaceDataProvider enabled={enabled}>
      <CubeFlowProvider>{children}</CubeFlowProvider>
    </CubeSpaceDataProvider>
  );
};

// Custom render function that includes providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { providerProps, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders enabled={providerProps?.dataProviderEnabled}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Helper to create a batch of mock cubes
 */
export const createMockCubeBatch = (
  count: number,
  baseOverrides?: Partial<CubeDomain>,
): CubeDomain[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCubeDomain({
      ...baseOverrides,
      localId: `local-${i}`,
    }),
  );
};

/**
 * Helper to create a batch of mock Firestore cubes
 */
export const createMockFirestoreCubeBatch = (
  count: number,
  baseOverrides?: Partial<CubeFirestoreView>,
): CubeFirestoreView[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCubeFirestoreView({
      ...baseOverrides,
      remoteId: `remote-${i}`,
    }),
  );
};

// Re-export everything from Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
