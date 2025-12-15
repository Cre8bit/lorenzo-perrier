# Performance Optimization Guide

## How to Use the Performance Monitor

The portfolio now includes a built-in performance monitoring overlay to help identify performance bottlenecks.

### Keyboard Shortcuts

- **`Ctrl/Cmd + Shift + P`** - Toggle performance overlay on/off
- **`Ctrl/Cmd + Shift + O`** - Toggle quality controls panel on/off

### Activating the Performance Overlay

Press **`Ctrl/Cmd + Shift + P`** to toggle the performance overlay on/off.

The overlay shows:

- **FPS (Frames Per Second)**: Target is 60 FPS

  - Green (>50 FPS): Good performance
  - Orange (30-50 FPS): Moderate performance issues
  - Red (<30 FPS): Poor performance, needs optimization

- **Device Info**: Your device's pixel ratio and CPU cores

- **Component Times**: Shows which components are taking the most time per frame
  - Green (<8ms): Good
  - Orange (8-16.67ms): Moderate
  - Red (>16.67ms): Exceeds 60 FPS budget, causing dropped frames

### Interpreting Results

#### Common Culprits

1. **ParticleField** - Background particle animation

   - Uses canvas 2D rendering
   - O(n²) connection checks (now optimized with spatial grid)
   - High particle count on large screens

2. **ConstellationCanvas** - Animated constellation effects

   - Runs during subtitle transitions
   - Canvas drawing with gradients and shadows

3. **SkillsGraph** - Interactive skills visualization

   - Physics simulation for nodes
   - Canvas rendering with gradients

4. **PhilosophyReveal:scroll** - Scroll-driven animations
   - Heavy calculations during scroll
   - Multiple DOM measurements

### Optimizations Already Applied

✅ **Spatial Grid Partitioning** - Reduced ParticleField from O(n²) to O(n) for connection checks
✅ **Dynamic Quality Scaling** - Adapts particle count and DPR based on device capabilities
✅ **Visibility Pause** - Animations stop when tab is hidden
✅ **Throttled Event Handlers** - Mousemove and scroll throttled with requestAnimationFrame
✅ **Frame Skipping** - Low-power devices skip connection drawing on alternate frames
✅ **Reduced DPR** - Canvas resolution capped at 1.5x on low-memory devices

### Manual Quality Controls

Press **`Ctrl/Cmd + Shift + Q`** to open the ParticleField quality controls panel (bottom-right corner).

Adjust in real-time:

- **Max Particles** (50-400): Total number of particles rendered
- **Connection Distance** (60-200px): How far particles can connect with lines
- **Density Factor** (0.3-1.5x): Multiplier for particle spawn rate
- **Skip Frames** (1-5): Draw connections every Nth frame (higher = better perf)

Settings are saved automatically and persist across sessions.

**Quick Presets:**

- Low-end: 80 particles, 100px distance, 0.5x density, skip 3 frames
- Medium: 150 particles, 120px distance, 0.8x density, skip 2 frames
- High-end: 250 particles, 140px distance, 1.2x density, skip 1 frame

### If Performance is Still Poor

#### Quick Fixes

1. Close other browser tabs/apps
2. Enable hardware acceleration in browser settings
3. Reduce browser zoom to 100%
4. Use a Chromium-based browser (Chrome/Edge) for better canvas performance

#### Manual Adjustments

If specific components show red times (>16.67ms):

**For ParticleField:**

- Edit `src/lib/performance.ts` → `getQualitySettings()`
- Reduce `maxParticles` (default: 200 → try 120)
- Reduce `densityFactor` (default: 1 → try 0.6)

**For SkillsGraph:**

- Edit `src/components/SkillsGraph.tsx`
- Reduce node repulsion calculations frequency
- Lower canvas DPR further (1.5 → 1.0)

**General:**

- Enable `prefers-reduced-motion` in OS accessibility settings

### Device Quality Tiers

The app automatically detects device capabilities:

- **Low Tier**: <4GB RAM or <4 cores
  - Max 120 particles, 1.0x DPR, skip every 2nd connection frame
- **Medium Tier**: 4-8GB RAM or mobile

  - Max 150 particles, 1.5x DPR, skip every frame

- **High Tier**: ≥8GB RAM and ≥6 cores
  - Max 200 particles, 2.0x DPR, render all frames

### Profiling with Browser DevTools

For deeper analysis:

1. Open Chrome DevTools → Performance tab
2. Click Record
3. Interact with the site (scroll, move mouse)
4. Stop recording
5. Look for:
   - Long frames (yellow/red bars)
   - "Rendering" and "Painting" sections
   - JavaScript execution time

### Build for Production

Always test with production build for accurate performance:

```bash
npm run build
npm run preview
```

Development mode includes hot-reload overhead and source maps that slow things down.

---

## Technical Details

### What Makes Things Slow

1. **Canvas 2D Context**

   - `arc()` with gradients creates many draw calls
   - High resolution (retina displays) = 4x pixels to draw
   - Shadow effects are GPU-intensive

2. **Frequent DOM Measurements**

   - `getBoundingClientRect()` causes layout reflow
   - Scroll handlers firing 100+ times/second

3. **O(n²) Algorithms**

   - Checking every particle against every other particle
   - Fixed with spatial grid partitioning

4. **Event Handler Floods**
   - Mousemove fires 100-200 times/second
   - Style writes in handlers cause layout thrashing
   - Fixed with rAF throttling

### Performance Budget (60 FPS = 16.67ms/frame)

Typical breakdown:

- JavaScript: ~8ms
- Rendering/Paint: ~6ms
- Compositing: ~2ms
- Browser overhead: ~1ms

If any component takes >16ms, frames will drop.
