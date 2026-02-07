# Flow State Studio – Architecture Reference

**Last Updated:** February 5, 2026  
**Scope:** Complete architecture documentation for CubeSpace cube management system

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Context Dependency Tree](#context-dependency-tree)
3. [Cube Lifecycle State Machine](#cube-lifecycle-state-machine)
4. [Event Flow Diagrams](#event-flow-diagrams)
5. [ID Mapping Architecture](#id-mapping-architecture)
6. [Data Flow](#data-flow)
7. [Performance Characteristics](#performance-characteristics)

---

## System Overview

The CubeSpace system is organized into **three distinct layers**:

```
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
│  CubeSpace.tsx, CubeScene.tsx, CubeSpaceOverlay             │
│  (React components, Three.js rendering)                      │
└──────────────────────────────────────────────────────────────┘
                              ↓↑
┌──────────────────────────────────────────────────────────────┐
│                      Flow Orchestration Layer                 │
│  CubeFlowProvider (UI state: placing, owner card, focus)    │
└──────────────────────────────────────────────────────────────┘
                              ↓↑
┌──────────────────────────────────────────────────────────────┐
│                    Data Management Layer                      │
│  CubeSpaceDataProvider (persistence, Firestore sync)        │
└──────────────────────────────────────────────────────────────┘
                              ↓↑
┌──────────────────────────────────────────────────────────────┐
│                  External Services                            │
│  Firestore (remote sync), Auth0 (LinkedIn), Three.js/Rapier │
└──────────────────────────────────────────────────────────────┘
```

### Key Principle: Separation of Concerns

- **Data Layer**: Manages cube state, persistence, Firestore sync
- **Flow Layer**: Manages transient UI state, user interactions, transitions
- **Render Layer**: Visualizes data, generates events
- **Separation prevents**: State logic from being fragmented across components

---

## Context Dependency Tree

```
App
├─ CubeSpaceDataProvider
│  └─ Manages: cubes, users, activeFlowId, bufferedSnapshot
│     Exports: dropCube, settleCube, requestSaveCube, confirmSaveCube, abandonFlow
│     State Shape:
│     {
│       cubesByLocalId: Map<string, CubeDomain>,
│       localIdByRemoteId: Map<string, string>,
│       bufferedSnapshot: CubeFirestoreView[] | null,
│       activeFlowId: string | null
│     }
│
└─ CubeFlowProvider (child of CubeSpaceDataProvider)
   └─ Manages: isPlacing, draftId, ownerCardOpen, authStatus
      Consumes: useCubeSpaceData (data context)
      Exports: togglePlacing, onCubeDropped, onCubeFocused, onSaveConfirm
      State Shape:
      {
        isPlacing: boolean,
        draftId: string | null,
        isSaving: boolean,
        ownerCardOpen: boolean,
        authStatus: AuthStatus,
        ownerError: string | null,
        hasUnsavedDraft: boolean
      }

CubeSpaceInner (component using both contexts)
├─ useCubeSpaceData()
│  └─ Read: cubesByLocalId, users
│     Write: dropCube, settleCube
│
├─ useCubeFlow()
│  └─ Read: isPlacing, draftId, ownerCardOpen
│     Write: togglePlacing, onCubeDropped, onCubeFocused
│
└─ CubeScene (render component)
   └─ Reads: cubes, isPlacing, draftId
      Emits: onCubeDropped, onCubeSettled, onFocusComplete
```

### Context Instantiation Order

```
1. CubeSpaceDataProvider initialized
   ├─ Connects to Firestore listeners
   ├─ Loads users and cubes
   └─ Reduces them into state

2. CubeFlowProvider mounted inside CubeSpaceDataProvider
   ├─ Can access useCubeSpaceData()
   ├─ Manages UI-specific state
   └─ Ready to handle user interactions

3. CubeSpaceInner component mounted
   ├─ Can access both contexts
   ├─ Passes state to CubeScene
   └─ Ready to render
```

---

## Cube Lifecycle State Machine

```
                         ┌──────────────────────────────────────┐
                         │      LIFECYCLE STATES                │
                         └──────────────────────────────────────┘

                              ┌─────────────┐
                              │ NO CUBE     │
                              └──────┬──────┘
                                     │
                    User drops cube in scene
                    (onCubeDropped event)
                                     ↓
                         ┌─────────────────────┐
                         │  DRAFT              │
                         │  (local only)       │
                         │  status: "draft"    │
                         └──────┬──────────────┘
                                │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    User cancels         Physics settles      (stays draft)
    (ABANDON_FLOW)        (onCubeSettled)
          │                      │
          ↓                      ↓
    ┌─────────────┐    ┌─────────────────────┐
    │ DELETED     │    │  DRAFT              │
    │ (removed)   │    │  (with position)    │
    └─────────────┘    │  status: "draft"    │
                       └──────┬──────────────┘
                              │
                   Camera focuses on cube
                   (onFocusComplete event)
                     Owner card opens
                              │
                              ↓
                     ┌─────────────────────┐
                     │  DRAFT              │
                     │  (ready for save)   │
                     │  status: "draft"    │
                     │  ownerCardOpen: T   │
                     └──────┬──────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                                 │
     User dismisses            User submits owner info
     owner card                (onSaveConfirm)
           │                       │
           ↓                       ↓
     (stays draft)      ┌─────────────────────┐
                        │  SAVING             │
                        │  status: "saving"   │
                        │  (Firebase write)   │
                        └──────┬──────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
          Save succeeds               Save fails
          SAVE_SUCCESS action        SAVE_FAIL action
                │                         │
                ↓                         ↓
        ┌──────────────────┐    ┌─────────────────┐
        │  SYNCED          │    │  ERROR          │
        │ status: "synced" │    │ status: "error" │
        │                  │    │ (show retry UI) │
        │ (Firestore      │    └─────────────────┘
        │  confirmed)      │           │
        └──────┬───────────┘           │
               │                       │
               │          ┌────────────┘
               │          │
               │    User retries save
               │    (requestSaveCube)
               │          │
               ↓          ↓
        ┌──────────────────────┐
        │  SYNCED / ERROR      │
        │  (flow continues)    │
        └──────────────────────┘
               │
          (Loop back to SAVING)
```

### State Transitions

| From   | To     | Trigger           | Action                                       |
| ------ | ------ | ----------------- | -------------------------------------------- |
| NONE   | DRAFT  | `onCubeDropped`   | Create cube, set `activeFlowId`              |
| DRAFT  | DRAFT  | `onCubeSettled`   | Update `finalPosition`                       |
| DRAFT  | DRAFT  | `onFocusComplete` | Open owner card UI                           |
| DRAFT  | SAVING | `requestSaveCube` | Set status, prepare for Firebase             |
| SAVING | SYNCED | `confirmSaveCube` | Update `remoteId`, process buffer            |
| SAVING | ERROR  | `failSaveCube`    | Set error status                             |
| ERROR  | SAVING | `requestSaveCube` | Retry (user clicks retry)                    |
| ANY    | NONE   | `abandonFlow`     | Delete draft, clear `activeFlowId`, reset UI |

### Critical: `activeFlowId` Flag

```typescript
// When DRAFT exists:
state.activeFlowId = draftId; // "a1b2c3d4-..."

// When listening for Firestore updates:
if (activeFlowId !== null) {
  // Incoming snapshot is buffered
  // Prevents visual glitches, race conditions
} else {
  // Snapshot processed immediately
}

// When SYNCED or flow abandoned:
state.activeFlowId = null;

// Benefit: O(1) check instead of O(n) loop over cubes
```

---

## Event Flow Diagrams

### Full User Journey: Drop → Settle → Save

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          USER DROPS CUBE                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    CubeScene emits onCubeDropped
                                    │
        CubeSpaceInner.handleCubeDropped()
                    │               │
                    ↓               ↓
        data: dropCube()    flow: onCubeDropped()
                    │               │
            Creates cube        Sets draftId
            status="draft"      Exits placing mode
            activeFlowId=id
                    │               │
                    └───────┬───────┘
                            │
                    ┌───────▼────────┐
                    │   DRAFT STATE  │
                    │   (stored)     │
                    └────────────────┘
                            │
                (Physics engine drops cube)
                            │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PHYSICS SETTLES                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                            │
            CubeScene detects settled
            onCubeSettled({ localId, finalPosition })
                            │
        CubeSpaceInner.handleCubeSettled()
                            │
                data: settleCube()
                            │
            Updates cube finalPosition
                            │
        ┌───────────────────▼────────────────────┐
        │  DRAFT STATE (with finalPosition)      │
        │  Ready for camera focus               │
        └──────────────────────────────────────┘
                            │
                (Camera animates to focus)
                            │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     CAMERA FOCUS COMPLETE                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                            │
      onFocusComplete({ localId })
                            │
        CubeSpaceInner.handleFocusComplete()
                            │
            flow: onCubeFocused()
                            │
            if (localId === draftId)
                setOwnerCardOpen(true)
                            │
        ┌───────────────────▼──────────────────┐
        │  OWNER CARD OPEN                     │
        │  User enters first/last name         │
        │  (optional) links LinkedIn           │
        └────────────────────────────────────┘
                            │
                User clicks "Save"
                            │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SAVING TO FIRESTORE                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                            │
        CubeOwnerCard.onSaveConfirm()
                            │
        CubeSpaceInner.handleSaveName()
                            │
            onSaveConfirm(ownerData)
                            │
        ┌───────────────────┬──────────────────┐
        ↓                   ↓
   1. Create User     2. Create Cube
      via Firebase       via Firebase
        │                 │
        ↓                 ↓
    userId             remoteId (docId)
        │                 │
        └───────────┬─────┘
                    │
        confirmSaveCube(draftId, remoteId)
                    │
        ┌───────────▼──────────────────┐
        │  Status: "saving"            │
        │  (waiting for confirmation)  │
        └──────────────────────────────┘
                    │
        Firestore listener receives update
                    │
        LISTENER_SNAPSHOT action fired
                    │
        ┌───────────▼──────────────────┐
        │  Process buffer              │
        │  ("draft" → "synced")        │
        │  Clear activeFlowId          │
        └──────────────────────────────┘
                    │
        ┌───────────▼──────────────────┐
        │  ✅ SUCCESS                  │
        │  Status: "synced"            │
        │  Close owner card            │
        │  Clear draftId               │
        │  resetFlow()                 │
        └──────────────────────────────┘
                    │
        Ready for next user action
```

### Error Path: Save Fails

```
confirmSaveCube(draftId, remoteId)
        │
        ↓
┌──────────────────────────┐
│  SAVING                  │
│  (Firebase write in      │
│   progress)              │
└──────────────────────────┘
        │
        ↓ (Firebase error, e.g., network)
┌──────────────────────────┐
│  ERROR                   │
│  ❌ failSaveCube        │
│  Status: "error"        │
│  Show error message     │
└──────────────────────────┘
        │
  ┌─────┴──────────────┐
  │                    │
User retries      User dismisses
  │                    │
  ↓                    ↓
requestSaveCube  abandonFlow
  │                    │
  ↓                    ↓
Loop back to      Delete draft
SAVING            Reset flow
```

### Buffer Mechanism: Race Condition Prevention

```
Timeline: User is in the middle of placing a cube

Time 0: User drops cube
        • activeFlowId = id
        • status = "draft"
                │
Time 1: Cube settles
        • Server (elsewhere): another user added a cube
        • Firestore listening to that user's cube
        • LISTENER_SNAPSHOT arrives
                │
                ↓
        ┌─────────────────────────┐
        │ Check: activeFlowId?    │
        │ YES → not null          │
        └──────────┬──────────────┘
                   │
                   ↓
        ┌─────────────────────────┐
        │ BUFFER snapshot         │
        │ (don't process yet)     │
        │ bufferedSnapshot = [..]│
        └─────────────────────────┘
                   │
                (User continues)
                   │
Time 2: User submits owner info
        • confirmSaveCube(id, remoteId)
                │
                ↓
        ┌─────────────────────────┐
        │ Process buffered data   │
        │ NOW apply the snapshot  │
        │ (cube is synced)        │
        └──────────┬──────────────┘
                   │
                   ↓
        ┌─────────────────────────┐
        │ Clear buffer            │
        │ Clear activeFlowId      │
        │ Flow complete ✅        │
        └─────────────────────────┘
```

---

## ID Mapping Architecture

### Why Three IDs?

```
Real World:
  User drops a cube
  Physics engine needs to track it
  Server needs to persist it
  App needs to identify it

Solution: Three cooperating IDs

┌─────────────────────────────┐
│ localId: "a1b2c3d4-..."     │◄─── UUID (collision-free)
│ (Client canonical ID)       │
│ - Used everywhere in app    │
│ - Persists across sessions  │
│ - Matches Firestore docId   │
└──────────┬──────────────────┘
           │
           │ BidirectionalMap
           │ (bidirectional lookup)
           │
        ┌──┴──┐
        │  ↓  │
        ↓     ↓
    ┌─────────────────────┐
    │ sceneId: 2001       │  ◄─── Number (physics engine)
    │ (Three.js rigid     │       - Fast lookups (O(1))
    │  body identifier)   │       - Generated per session
    │ [can be rebuilt]    │       - Session-specific
    └─────────────────────┘

    ┌─────────────────────┐
    │ remoteId: docId     │  ◄─── After Firestore sync
    │ (Firestore)         │       - Matches server state
    │ [set after save]    │       - Confirms persistence
    └─────────────────────┘
```

### Mapping Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│  BEFORE: No cube                                         │
│  sceneId → localId: empty                              │
│  localId → sceneId: empty                              │
└──────────────────────────────────────────────────────────┘
                        │
              User drops cube
                        │
                        ↓
┌──────────────────────────────────────────────────────────┐
│  DRAFT: Cube is local-only                              │
│  localId = "a1b2c3d4-..." (generated by client)        │
│  sceneId = 2001 (allocated from counter)               │
│  BidirectionalMap: [a1b2c3d4] ↔ [2001]        │
│  remoteId = undefined (not saved yet)                   │
└──────────────────────────────────────────────────────────┘
                        │
              Physics settles, focus, save
                        │
                        ↓
┌──────────────────────────────────────────────────────────┐
│  SYNCED: Cube confirmed on server                       │
│  localId = "a1b2c3d4-..." (unchanged)                   │
│  sceneId = 2001 (unchanged in this session)            │
│  BidirectionalMap: [a1b2c3d4] ↔ [2001]        │
│  remoteId = "a1b2c3d4-..." (set by server)             │
│                                                          │
│  Note: sceneId is session-specific                       │
│  If you refresh the page:                               │
│  - localId stays the same (loaded from server)         │
│  - sceneId gets new number (2001 → maybe 2002)         │
│  - BidirectionalMap rebuilds                            │
└──────────────────────────────────────────────────────────┘
```

### BidirectionalMap Usage in CubeScene

```typescript
// Storage
const idMappingRef = useRef(new BidirectionalMap<string, number>());

// When rendering cube:
let sceneId = idMappingRef.current.getByKey(cube.localId);
if (sceneId === undefined) {
  sceneId = nextSceneIdRef.current++;
  idMappingRef.current.set(cube.localId, sceneId);
}

// When handling physics collision:
const localId = idMappingRef.current.getByValue(sceneId);
if (localId) {
  onCubeSettled({ localId, finalPosition });
}

// Performance: O(1) bidirectional lookups
```

---

## Data Flow

### Unidirectional Data Flow (Redux-like)

```
┌─────────────────────────────────────────────────────────┐
│                  ACTION DISPATCH                        │
│  (user interaction, Firestore update, physics event)   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│  REDUCER (pure function)                                │
│  cubeDataReducer(state, action)                        │
│                                                          │
│  Handles:                                               │
│  - DROP_CUBE: create draft                             │
│  - SETTLE_CUBE: update position                        │
│  - SAVE_REQUEST: set status to saving                  │
│  - SAVE_SUCCESS: confirm sync                          │
│  - LISTENER_SNAPSHOT: merge remote data (with buffer)  │
│  - ABANDON_FLOW: cleanup                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│  STATE                                                   │
│  {                                                      │
│    cubesByLocalId: Map<string, CubeDomain>,           │
│    localIdByRemoteId: Map<string, string>,            │
│    bufferedSnapshot: CubeFirestoreView[] | null,      │
│    activeFlowId: string | null                        │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
              (state updated in context)
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│  COMPONENTS CONSUME STATE                               │
│  CubeSpaceInner:                                       │
│    - cubesByLocalId → pass to CubeScene               │
│    - draftId → highlight in scene                      │
│                                                          │
│  CubeScene:                                            │
│    - cubes → render 3D objects                        │
│    - sceneId mapping → physics updates                │
└──────────────────────┬──────────────────────────────────┘
                       │
            (component renders)
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│  USER INTERACTION / EXTERNAL EVENT                      │
│  Back to ACTION DISPATCH...                            │
└─────────────────────────────────────────────────────────┘
```

### Firestore Sync Cycle

```
App   │   Firestore Listener   │   Server
      │                         │
      │◄───────SNAPSHOT────────│  (cubes collection)
      │                         │
Receive snapshot
in reducer
      │
      ├─ If activeFlowId:
      │  └─ BUFFER snapshot
      │
      └─ Else:
         └─ PROCESS snapshot
             ├─ Match remoteId → localId
             ├─ Update existing cubes
             └─ Create new cubes
      │
      │
      └─────── (user saves) ──────→│
             confirmSaveCube        │
                   │                │
                   ↓                ↓
             Process buffer    Receives document
             Clear activeFlowId
```

---

## Performance Characteristics

### Time Complexity

| Operation                 | Complexity | Notes                           |
| ------------------------- | ---------- | ------------------------------- |
| Check if flow is active   | O(1)       | `activeFlowId !== null`         |
| Find cube by localId      | O(1)       | `Map.get(localId)`              |
| Map localId → sceneId     | O(1)       | `BidirectionalMap.getByKey()`   |
| Map sceneId → localId     | O(1)       | `BidirectionalMap.getByValue()` |
| Add cube to scene         | O(1)       | Direct Map insertion            |
| Firestore snapshot merge  | O(n)       | n = # remote cubes              |
| **Old**: Check flow state | O(n)       | Loop all cubes ❌               |

### Memory Usage

```
Per Cube:
├─ CubeDomain object: ~200 bytes
├─ Three.js RigidBody: ~1 KB
├─ Map entry (localId): ~100 bytes
├─ Map entry (remoteId): ~100 bytes
├─ BidirectionalMap entries: ~200 bytes
└─ Total: ~1.4 KB per cube
```

**Example:** 100 cubes = ~140 KB (negligible)

### Rendering Performance

```
useEffect(() => {
  const cubes = cubesByLocalId.values();  // O(1)

  return cubes.map(cube => {
    let sceneId = idMapping.getByKey(cube.localId);  // O(1)
    if (!sceneId) {
      sceneId = ++nextId;
      idMapping.set(cube.localId, sceneId);  // O(1)
    }

    return <MemoizedCubeRender key={cube.localId} />;
  });
}, [cubesByLocalId]);

// Total: O(n) where n = # cubes (can't do better)
// No O(n²) hidden operations
```

---

## Key Files & Responsibilities

| File                        | Purpose                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `CubeSpaceDataProvider.tsx` | Data layer: Firestore sync, cube state, reducer dispatch   |
| `cubeReducerHandlers.ts`    | Pure reducer logic (testable)                              |
| `CubeFlowProvider.tsx`      | Flow layer: UI state, user interactions                    |
| `CubeFlowContext.ts`        | Flow context definition (separated for React fast refresh) |
| `useCubeFlow.ts`            | Hook to consume CubeFlowContext                            |
| `CubeModel.ts`              | Domain model, type definitions, transformations            |
| `CubeSpaceEvents.ts`        | Event type definitions (self-documenting)                  |
| `BidirectionalMap.ts`       | Utility: bidirectional ID mapping                          |
| `CubeScene.tsx`             | Render layer: Three.js visualization, physics              |
| `CubeSpace.tsx`             | Orchestrator: connects all layers                          |

---

## Trade-offs & Alternatives

### Why BidirectionalMap instead of single numeric ID?

**Trade-off:** Slight overhead (one extra lookup) vs. robust distributed ID scheme

**Benefits of current approach:**

- ✅ UUID prevents collisions in multi-tab, offline-first scenarios
- ✅ Firestore document IDs are UUIDs (natural match)
- ✅ Future-proof for multiplayer, event sourcing
- ✅ Standard industry practice

**Alternative considered:** Use only numeric IDs

- ❌ Server coordination required
- ❌ Risk of collisions
- ❌ Harder to debug
- ❌ Non-portable data

### Why buffer snapshots instead of immediate merge?

**Problem solved:**

```
Without buffering:
  User drops cube A (activeFlowId = A)
  Server notifies of cube B from another user
  Snapshot arrives: "you have A (draft) + B (synced)"
  Before user even settles A, scene has both
  → Confusing visual state, race conditions

With buffering:
  activeFlowId = A
  Snapshot arrives → buffer it
  User saves A → activeFlowId = null
  Buffer is now applied (A + B together)
  → Consistent, clean state
```

**Cost:** One extra iteration when processing buffer

**Benefit:** Eliminates class of race-condition bugs

---

## Error Handling

### Save Error Recovery

```
User saves → confirmSaveCube(id, remoteId)
                       │
          (Firebase write succeeds,
           user confirms on client)

If Firestore listener delay:
  Cube status: "saving" (temporary)
  Will transition to "synced" when listener fires

If Firebase write fails:
  failSaveCube(id, error)
  Cube status: "error"
  User can retry or abandon

If Retry:
  requestSaveCube(id) → status back to "saving"
  Attempt write again
```

### Buffer Overflow (Not Needed Here)

```
currentImplementation: Simple single-snapshot buffer

If multiple snapshots arrive while activeFlowId set:
  Last one wins (overwrites buffer)

Why this works:
  Firestore listener is idempotent
  Last snapshot contains all data
  No data loss possible
```

---

## Future Enhancement Points

### 1. Optimistic Updates

```typescript
// Currently: wait for server confirmation
// Future: show cube immediately
// Mark as "optimistic" until confirmed
```

### 2. Multiplayer Presence

```typescript
// Could track activeFlowId per user
// Show "User X is placing a cube"
```

### 3. Undo/Redo

```typescript
// Reducer already supports action dispatch
// Could maintain action history
// Replay backwards for undo
```

### 4. Persistence (Time-travel)

```typescript
// cubeDataReducer is pure
// Could snapshot state at intervals
// Restore previous app state on reload
```

### 5. Analytics

```typescript
// Each reducer action is discrete event
// Could emit telemetry per action
// Track user flow abandonment, error rates
```

---

## Testing Strategy

### Unit Tests (Pure Functions)

```typescript
describe("cubeDataReducer", () => {
  it("DROP_CUBE creates draft", () => {
    const result = handleDropCube(initialState, payload);
    expect(result.cubesByLocalId.has(payload.localId)).true;
    expect(result.activeFlowId).equals(payload.localId);
  });

  it("LISTENER_SNAPSHOT buffers when flow active", () => {
    const stateWithFlow = { activeFlowId: "id-1" };
    const result = handleListenerSnapshot(stateWithFlow, snapshot);
    expect(result.bufferedSnapshot).equals(snapshot);
  });
});
```

### Integration Tests (Flow Context)

```typescript
describe("CubeFlowProvider", () => {
  it("onCubeDropped disables placing and sets draftId", () => {
    // Render with context
    // Call onCubeDropped
    // Assert isPlacing = false, draftId = id
  });
});
```

### E2E Tests (User Journey)

```
Given: User on CubeSpace page
When: User toggles placing mode
And: Drops cube
And: Waits for focus completion
And: Fills owner form
And: Clicks save
Then: Cube should appear synced
And: Owner card should close
```

---

## Conclusion

This architecture represents a **clean separation of concerns**:

1. **Data Layer** handles persistence and sync
2. **Flow Layer** handles UI state and transitions
3. **Render Layer** handles visualization
4. **Utility Layer** (BidirectionalMap) provides efficient ID translation

The system is **extensible** for future features (multiplayer, undo, analytics) without major rewrites.
