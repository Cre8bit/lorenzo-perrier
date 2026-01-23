# Enhanced Performance Tracking System

## Overview

The portfolio now features a comprehensive performance monitoring system that tracks all major components and provides real-time insights into compute-intensive operations causing lag or heat.

## What's New

### 🎯 Advanced Metrics Tracking

**Frame-Level Metrics:**

- **FPS (Frames Per Second)** - Real-time frame rate monitoring
- **Frame Time** - Average time per frame in milliseconds
- **Long Tasks** - Count of operations taking >50ms per second
- **Dropped Frames** - Count of frames exceeding 33ms (below 30fps)
- **CPU Load** - Estimated CPU load based on frame time variance (0-100%)

**Component-Level Metrics:**

- **Average Time** - Mean execution time per component
- **Min/Max Time** - Range of execution times
- **P95 Time** - 95th percentile (showing worst-case performance)
- **Call Count** - Number of times component executed
- **Severity Classification** - Automatic categorization (low/medium/high/critical)

**Memory Metrics (Chrome only):**

- **JS Heap Usage** - Current JavaScript memory usage
- **Heap Limit** - Maximum available memory
- **Usage Percentage** - Visual indicator with color coding

### 🎨 Enhanced Overlay UI

**New Features:**

- **Sort Modes** - Switch between sorting by Average Time, Call Count, or P95
- **Visual Indicators** - Color-coded severity levels (green/yellow/orange/red)
- **Progress Bars** - Visual representation of component timing vs 33ms budget
- **Detailed Stats** - Min/max/p95 times for each component
- **Smart Warnings** - Automatic detection of performance issues with actionable insights

**Color Coding:**

- 🟢 **Green** (Low): <8ms - Excellent performance
- 🟡 **Yellow** (Medium): 8-16.67ms - Good, within single frame budget
- 🟠 **Orange** (High): 16.67-33ms - Moderate, exceeds 1 frame
- 🔴 **Red** (Critical): >33ms - Severe, causes visible lag

### 📊 Tracked Components

Performance tracking has been added to all major components:

**Canvas/Animation Components:**

- `ParticleField3D` - Three.js particle system (already had tracking)
- `SkillsGraph` - Force-directed graph visualization (already had tracking)
- `ConstellationMinimal` - Background constellation effect
- `ConstellationCanvas` - Subtitle transition effect (already had tracking)
- `AmbientBackground:mouse` - Mouse-reactive gradient orbs

**Section Components:**

- `PhilosophyReveal:RAF` - Philosophy section scroll animations (already had tracking)
- `CarouselGlide:pose` - Carousel card position calculations
- `HeroSection:mouse` - Hero text parallax effect
- `AnimatedSubtitle:effect` - Subtitle transition logic
- `ExperienceSection:scroll` - Experience section scroll handler
- `Index:sectionSpy` - Main page section detection logic

## How to Use

### Keyboard Shortcuts

- **`Ctrl/Cmd + Shift + P`** - Toggle performance overlay
- **`Ctrl/Cmd + Shift + O`** - Toggle quality controls

### Reading the Overlay

1. **Check FPS** - Should be consistently >50 for smooth experience
2. **Monitor Frame Time** - Should be <16.67ms for 60fps
3. **Watch Long Tasks** - High count indicates expensive operations
4. **Review Components** - Red components need optimization

### Identifying Issues

**If you see red components (>16.67ms):**

1. Note which component is slow
2. Check if it's a canvas component (reduce quality settings)
3. For scroll handlers (look for `:scroll`, `:RAF`), the computation may be complex
4. Use the quality controls to reduce particle count/effects

**If FPS drops below 30:**

1. Look for multiple orange/red components
2. Check "Long Tasks" count - indicates blocking operations
3. Reduce browser zoom to 100%
4. Close other tabs/applications

**If CPU load is high (>60%):**

1. Indicates high variance in frame times
2. Usually caused by physics simulations or complex animations
3. Adjust quality settings via `Ctrl/Cmd + Shift + O`

### Performance Budget

At 60 FPS, each frame has **16.67ms** to complete:

- JavaScript execution: ~8ms budget
- Rendering/Paint: ~6ms budget
- Compositing: ~2ms budget

Components exceeding 16.67ms will cause frame drops.

## Technical Details

### reportPerformance vs reportFramePerformance

**Use `reportPerformance(name, duration)`** for:

- One-time operations (event handlers, effects)
- Calculations that don't run every frame
- Pass duration directly: `performance.now() - startTime`

```typescript
const handleClick = () => {
  const t0 = performance.now();
  // ... expensive work
  reportPerformance("ComponentName:click", performance.now() - t0);
};
```

**Use `reportFramePerformance(name, startTime)`** for:

- RAF loops that run every frame
- Canvas animation loops
- Automatically accumulates and reports average every ~1 second

```typescript
const animate = () => {
  const t0 = performance.now();
  // ... render frame
  reportFramePerformance("CanvasComponent", t0);
  rafId = requestAnimationFrame(animate);
};
```

### Adding Tracking to New Components

1. Import the function:

```typescript
import { reportPerformance } from "@/components/ui/performance-overlay";
// or
import { reportFramePerformance } from "@/components/ui/performance-overlay";
```

2. Wrap expensive operations:

```typescript
// For event handlers
const handleEvent = () => {
  const t0 = performance.now();
  // ... your code
  reportPerformance("YourComponent:event", performance.now() - t0);
};

// For RAF loops
const animate = () => {
  const t0 = performance.now();
  // ... render code
  reportFramePerformance("YourComponent", t0);
  requestAnimationFrame(animate);
};
```

3. Choose descriptive names:
   - Format: `ComponentName` or `ComponentName:operation`
   - Examples: `SkillsGraph`, `HeroSection:mouse`, `PhilosophyReveal:RAF`

### Performance Monitor Class

The `PerformanceMonitor` class now tracks:

- Average FPS over last 60 frames
- Average frame time
- Count of long tasks (>50ms)
- Count of dropped frames (>33ms)
- CPU load estimation (based on frame time variance)
- Memory metrics (Chrome only via `performance.memory`)

### Data Collection

- **Component metrics** are stored with last 100 samples for percentile calculation
- **Metrics older than 5 seconds** are filtered from display
- **Accumulation happens per-frame** for RAF loops to avoid overwhelming the overlay
- **Global flag** (`performanceOverlayEnabled`) prevents overhead when overlay is hidden

## Best Practices

1. **Keep the overlay open** while developing to catch regressions
2. **Test on different devices** - Low-end devices show issues first
3. **Profile after every major change** - Use the overlay to verify performance
4. **Target <8ms for most components** - Leaves headroom for compositing
5. **Use quality controls** for user-facing performance tuning

## Known Bottlenecks

Based on typical performance profiles:

**Compute-Heavy:**

- `ParticleField3D` - 3D particle physics and rendering
- `SkillsGraph` - Force simulation with spatial partitioning
- `PhilosophyReveal:RAF` - Multi-section scroll calculations

**Event-Heavy:**

- `AmbientBackground:mouse` - Runs on every mousemove
- `HeroSection:mouse` - Parallax calculations
- `Index:sectionSpy` - Section detection on intersection changes

**Usually Fine:**

- `ConstellationMinimal` - Runs only in hero section
- `CarouselGlide:pose` - Only during transitions
- `AnimatedSubtitle:effect` - Infrequent (every 6-8s)

## Troubleshooting

**Overlay doesn't show:**

- Press `Ctrl/Cmd + Shift + P`
- Check console for "Performance overlay: enabled"

**No component data:**

- Interact with the page (scroll, move mouse)
- Wait 1-2 seconds for data to accumulate
- Check that components are in view

**FPS counter stuck at 60:**

- Good! This means smooth performance
- Look at individual component times for bottlenecks

**Memory keeps growing:**

- Indicates a memory leak
- Check for unreleased event listeners
- Verify canvas contexts are reused, not recreated

## Future Enhancements

Potential additions:

- [ ] Timeline graph showing performance over time
- [ ] Export performance data to JSON
- [ ] Performance regression testing
- [ ] GPU utilization tracking (when API available)
- [ ] Network request monitoring
- [ ] Render count tracking for React components
