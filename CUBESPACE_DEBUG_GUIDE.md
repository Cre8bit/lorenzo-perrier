# CubeSpace Debug Instrumentation - Quick Start Guide

## Overview

The CubeSpace feature now includes comprehensive debug instrumentation for tracking state transitions and performance metrics during development.

## Features

### 1. Debug Overlay (Cmd/Ctrl + Shift + D)

Visual overlay showing:

- **Active Flow**: Current cube flow ID and status
- **Cube Counts**: Total cubes and tracked flows
- **Flow Metrics**: Success rate, buffer hit rate, average duration
- **Recent Flows**: Last 5 flows with status indicators

### 2. Console Logging

When debug overlay is enabled, all state transitions are logged:

```
[CubeSpace] DROP_CUBE: none → draft { activeFlowId: "abc", buffered: false, cubeCount: 1 }
[CubeSpace] SAVE_SUCCESS: saving → saving { activeFlowId: null, buffered: false, cubeCount: 2 }
```

### 3. Programmatic Access

```javascript
// Get aggregate metrics
window.cubeSpaceMetrics.getMetrics();
// => { totalFlows: 5, successRate: 0.8, bufferHitRate: 0.4, avgDuration: 234ms }

// Get all flow details
window.cubeSpaceMetrics.getAllFlows();
// => [{ flowId, startTime, endTime, bufferHit, success, events[] }, ...]

// Reset metrics
window.cubeSpaceMetrics.reset();
```

## Usage Workflow

### Debugging a Save Flow Issue

1. **Enable Overlay**: Press `Cmd/Ctrl + Shift + D`
2. **Perform Action**: Drop a cube and attempt to save
3. **Check Metrics**:
   - Is activeFlowId set correctly?
   - Did the buffer get hit (snapshot arrived during save)?
   - What's the flow duration?
4. **Review Events**: Click on a flow to see detailed event timeline
5. **Check Console**: See state transitions in real-time

### Investigating Buffer Race Conditions

The key metric is **buffer hit rate**:

- **0-10%**: Excellent - Save completes before listener most of the time
- **10-30%**: Good - Occasional buffering is expected
- **30-50%**: Warning - High buffering, consider optimizing save speed
- **>50%**: Critical - Listener is consistently faster than save

**High buffer hit rate indicates**:

- Slow network/Firebase save operations
- Fast Firestore listener (good caching)
- Potential race condition if buffer is not being processed

### Performance Monitoring

Track **average flow duration**:

- **<500ms**: Excellent user experience
- **500-1000ms**: Good, acceptable
- **1000-2000ms**: Slow, investigate
- **>2000ms**: Poor, needs optimization

**Common causes of slow flows**:

- Network latency to Firebase
- User document creation delay
- Cube document creation delay
- Auth token refresh

## Integration with Existing Performance Tools

### Complementary to Performance Overlay (Cmd/Ctrl + Shift + P)

- **Performance Overlay**: Canvas rendering, FPS, frame times
- **CubeSpace Debug**: State management, flow orchestration, data sync

Both can be enabled simultaneously for comprehensive debugging.

### Quality Controls (Cmd/Ctrl + Shift + O)

Adjust particle quality while monitoring CubeSpace flows to test performance under different visual fidelity settings.

## Best Practices

### During Development

1. **Always enable debug overlay** when working on CubeSpace features
2. **Monitor buffer hit rate** - high rates indicate race conditions
3. **Check flow duration** - helps identify network bottlenecks
4. **Reset metrics** before testing to get clean data

### Before Commit

1. **Turn off debug overlay** (disabled by default for new sessions)
2. **Verify instrumentation is DEV-only** - no console logs in production build
3. **Run tests** - `npm run test` to ensure no regressions

### Performance Testing

1. **Enable both overlays** (Performance + CubeSpace Debug)
2. **Drop multiple cubes** in quick succession
3. **Monitor**:
   - FPS stays above 30
   - Flow duration stays below 1000ms
   - Buffer hit rate stays below 30%

## Troubleshooting

### Overlay Not Showing

- Check that you pressed the correct key combo: `Cmd/Ctrl + Shift + D`
- Ensure you're in DEV mode: `npm run dev`
- Check browser console for errors

### Metrics Not Updating

- Verify metrics are enabled: `window.cubeSpaceMetrics.isEnabled()`
- Try resetting: `window.cubeSpaceMetrics.reset()`
- Check that actions are actually dispatching (console logs should appear)

### Console Logs Cluttered

The instrumentation only logs when:

1. Debug overlay is enabled (`Cmd/Ctrl + Shift + D`)
2. Running in DEV mode (`import.meta.env.DEV`)

To reduce noise, disable the overlay when not actively debugging.

## Technical Details

### Zero Production Overhead

All instrumentation is gated by `import.meta.env.DEV`:

```typescript
if (import.meta.env.DEV && cubeSpaceMetrics.isEnabled()) {
  // Telemetry code
}
```

This ensures:

- **No runtime checks in production**
- **No console logs in production**
- **No performance impact in production**

### State Transition Tracking

The telemetry wrapper intercepts all reducer dispatches:

```
User Action → Dispatch → Telemetry Wrapper → Reducer → New State
                              ↓
                        Log & Metrics
```

### Flow Correlation

Each cube placement creates a unique `flowId` (UUID):

```
Drop → Settle → SaveRequest → [SaveSuccess | SaveFail]
  └─────────────── flowId ──────────────────┘
```

All events in a flow are correlated by this ID for analysis.

## Example Scenarios

### Scenario 1: User reports "cube not saving"

1. Enable debug overlay
2. Reproduce the issue
3. Check console for error in SAVE_REQUEST or SAVE_SUCCESS
4. Check ownerError in debug overlay
5. Review flow events for the failed flow

### Scenario 2: Intermittent display issues

1. Enable debug overlay
2. Monitor buffer hit rate while reproducing
3. If buffer hit rate is high:
   - Check that buffered snapshots are processed on SAVE_SUCCESS
   - Verify activeFlowId is cleared properly
4. Use console logs to trace state transitions

### Scenario 3: Performance degradation

1. Enable both overlays (Performance + CubeSpace)
2. Drop multiple cubes rapidly
3. Check:
   - FPS from performance overlay
   - Flow duration from CubeSpace debug
   - Buffer hit rate (high rate can cause flow delays)

## Keyboard Shortcuts Reference

| Shortcut               | Action                         |
| ---------------------- | ------------------------------ |
| `Cmd/Ctrl + Shift + P` | Toggle Performance Overlay     |
| `Cmd/Ctrl + Shift + D` | Toggle CubeSpace Debug Overlay |
| `Cmd/Ctrl + Shift + O` | Toggle Quality Controls        |

## Support

For issues or questions about the instrumentation:

1. Check the console for error messages
2. Review `TESTING_REPORT.md` for known issues
3. Inspect `src/lib/cubespaceMetrics.ts` for implementation details
4. Run tests: `npm run test` to verify expected behavior

---

**Remember**: This instrumentation is a development tool. It should never appear in production builds and has zero overhead in production.
