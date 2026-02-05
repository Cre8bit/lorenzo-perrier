/**
 * CubeSpaceEvents - Explicit type definitions for all event callbacks
 *
 * Benefits:
 * - Better IDE autocomplete
 * - Refactor-safe (rename detection)
 * - Self-documenting
 * - Prevents callback signature drift
 */

import type { Vec3 } from "@/types/CubeModel";

/**
 * Scene Events - Fired by CubeScene component
 */

export type CubeDroppedEvent = {
  localId: string;
  dropPosition: Vec3;
  color: string;
  createdAt: number;
};

export type CubeSettledEvent = {
  localId: string;
  finalPosition: Vec3;
};

export type CubeFocusCompleteEvent = {
  localId: string;
};

export type ActiveCubeScreenChangeEvent = {
  localId: string | null;
  x: number;
  y: number;
  visible: boolean;
};

export type SceneStatsChangeEvent = {
  cubeCount: number;
  towerHeight: number;
};

/**
 * Event Handler Types
 */

export type CubeDroppedHandler = (event: CubeDroppedEvent) => void;
export type CubeSettledHandler = (event: CubeSettledEvent) => void;
export type CubeFocusCompleteHandler = (event: CubeFocusCompleteEvent) => void;
export type ActiveCubeScreenChangeHandler = (
  event: ActiveCubeScreenChangeEvent,
) => void;
export type SceneStatsChangeHandler = (event: SceneStatsChangeEvent) => void;
export type SceneReadyHandler = () => void;

/**
 * Flow Events - Fired by CubeFlowProvider
 */

export type FlowStateChangeEvent = {
  isPlacing: boolean;
  hasUnsavedDraft: boolean;
  draftId: string | null;
};

/**
 * Owner Card Events
 */

export type OwnerSaveEvent = {
  firstName: string;
  lastName: string;
  linkedinUrl?: string;
};

export type OwnerSaveHandler = (event: OwnerSaveEvent) => void;

/**
 * Context Action Types - For CubeSpaceDataContext
 */

export type DropCubeAction = (payload: {
  localId: string;
  color: string;
  dropPosition: Vec3;
}) => void;

export type SettleCubeAction = (payload: {
  localId: string;
  finalPosition: Vec3;
}) => void;

export type RequestSaveCubeAction = (localId: string) => void;

export type ConfirmSaveCubeAction = (localId: string, remoteId: string) => void;

export type FailSaveCubeAction = (localId: string, error: string) => void;

export type AbandonFlowAction = () => void;
