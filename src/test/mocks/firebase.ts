/**
 * Firebase Mocks - Mock Firebase Firestore functions for testing
 */

import { vi } from "vitest";
import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

// Mock Firebase types
type MockCollectionCallback = (
  snapshot: QuerySnapshot<DocumentData>,
  meta: { fromCache: boolean; empty: boolean },
) => void;
type MockErrorCallback = (error: Error) => void;

// Storage for mock subscriptions
export const mockSubscriptions = new Map<
  string,
  {
    onNext: MockCollectionCallback;
    onError: MockErrorCallback;
  }
>();

// Mock Firestore database
export const mockFirestoreDb = {
  app: { name: "test-app" },
  type: "firestore",
} as Firestore;

// Mock collection function
export const mockCollection = vi.fn((db: Firestore, path: string) => {
  return {
    path,
    type: "collection",
  } as unknown as CollectionReference<DocumentData>;
});

// Mock onSnapshot function
export const mockOnSnapshot = vi.fn(
  (
    ref: CollectionReference<DocumentData>,
    onNext: MockCollectionCallback,
    onError?: MockErrorCallback,
  ): Unsubscribe => {
    const path = (ref as unknown as { path: string }).path;

    // Store callbacks
    if (onError) {
      mockSubscriptions.set(path, { onNext, onError });
    }

    // Return unsubscribe function
    return vi.fn();
  },
);

// Mock addDoc function
export const mockAddDoc = vi.fn(
  async (ref: CollectionReference<DocumentData>, data: DocumentData) => {
    const mockId = `mock-${Date.now()}`;
    return {
      id: mockId,
      path: `${(ref as unknown as { path: string }).path}/${mockId}`,
    } as DocumentReference<DocumentData>;
  },
);

// Mock serverTimestamp
export const mockServerTimestamp = vi.fn(() => {
  return { _type: "server_timestamp" } as never;
});

// Helper: Simulate snapshot event for a collection
export const simulateSnapshot = (
  collectionPath: string,
  data: DocumentData[],
  meta: { fromCache?: boolean; empty?: boolean } = {},
) => {
  const subscription = mockSubscriptions.get(collectionPath);
  if (!subscription) {
    // Silently ignore if no subscription exists yet
    return;
  }

  // Create mock docs with proper structure
  const mockDocs = data.map((doc, index) => {
    const docId = doc.remoteId || doc.id || `doc-${index}`;
    return {
      id: docId,
      ref: { id: docId, path: `${collectionPath}/${docId}` },
      data: () => doc,
      get: (field: string) => doc[field],
      exists: () => true,
    };
  });

  // Make the snapshot iterable by adding Symbol.iterator
  const snapshot = {
    docs: mockDocs,
    empty: meta.empty ?? data.length === 0,
    size: data.length,
    metadata: {
      fromCache: meta.fromCache ?? false,
      hasPendingWrites: false,
    },
    forEach: (callback: (doc: (typeof mockDocs)[0]) => void) => {
      mockDocs.forEach(callback);
    },
    [Symbol.iterator]: function* () {
      for (const doc of mockDocs) {
        yield doc;
      }
    },
  } as unknown as QuerySnapshot<DocumentData>;

  subscription.onNext(snapshot, {
    fromCache: meta.fromCache ?? false,
    empty: meta.empty ?? data.length === 0,
  });
};

// Helper: Simulate error for a collection
export const simulateError = (collectionPath: string, errorMessage: string) => {
  const subscription = mockSubscriptions.get(collectionPath);
  if (!subscription) {
    throw new Error(`No subscription found for ${collectionPath}`);
  }

  subscription.onError(new Error(errorMessage));
};

// Helper: Clear all subscriptions
export const clearMockSubscriptions = () => {
  mockSubscriptions.clear();
  mockOnSnapshot.mockClear();
  mockAddDoc.mockClear();
  mockCollection.mockClear();
  mockServerTimestamp.mockClear();
};

// Mock getFirestoreDb
export const mockGetFirestoreDb = vi.fn(() => mockFirestoreDb);

// Default export with all mocks
export default {
  getFirestoreDb: mockGetFirestoreDb,
  collection: mockCollection,
  onSnapshot: mockOnSnapshot,
  addDoc: mockAddDoc,
  serverTimestamp: mockServerTimestamp,
};
