# Flow State Studio – AI Coding Agent Instructions

## Project Overview

A high-performance, scroll-driven portfolio site built with Vite, React, TypeScript, shadcn/ui, and Tailwind CSS. The architecture emphasizes **performance-first canvas animations**, **scroll-based choreography**, and **glassmorphic UI patterns**.

## Architecture & Key Concepts

### Performance-First Canvas Animations

This is a **performance-critical** project. All canvas-based components ([particle-field.tsx](src/components/ui/particle-field.tsx), [constellation-canvas.tsx](src/components/ui/constellation-canvas.tsx), [skills-graph.tsx](src/components/ui/skills-graph.tsx)) use:

- **Spatial grid partitioning** to reduce O(n²) operations to O(n)
- **Dynamic quality scaling** via [performance.ts](src/lib/performance.ts) – detects device capabilities and adjusts particle counts, DPR, and skip frames
- **RAF-throttled event handlers** for scroll/mousemove (see [animation.ts](src/utils/animation.ts))
- Built-in **performance monitoring overlay** (`Ctrl/Cmd + Shift + P`) – use [reportPerformance()](src/components/ui/performance-overlay.tsx) to track component render times

**Always measure before optimizing**: Use the overlay to identify bottlenecks. See [PERFORMANCE.md](PERFORMANCE.md) for detailed profiling guide.

### Scroll-Driven Choreography

Sections use **scroll progress (0–1)** to orchestrate animations:

- [PhilosophyReveal.tsx](src/components/sections/PhilosophySection/PhilosophyReveal.tsx): Sequential reveal with "seen" state tracking, programmatic scroll locking, and opacity transitions
- Pattern: `computeSectionProgress(section)` calculates normalized scroll position within a sticky container
- Use [useScrollProgress](src/hooks/use-scroll-progress.ts) hook for new sections
- Key utilities: `clamp01()`, `smoothstep()`, `lerp()` from [animation.ts](src/utils/animation.ts)

### Component Structure

- **Sections** ([src/components/sections/](src/components/sections/)): Full-screen scroll-driven experiences (Hero, Philosophy, Carousel, Experience)
- **Data modules** ([PhilosophyData.ts](src/components/sections/PhilosophySection/PhilosophyData.ts), [CarouselData.ts](src/components/sections/CarouselSection/CarouselData.ts)): Separate content from logic – edit these for copy changes
- **UI primitives** ([src/components/ui/](src/components/ui/)): shadcn/ui components + custom glassmorphic/canvas elements
- Main composition: [Index.tsx](src/pages/Index.tsx) stacks all sections with shared backgrounds ([AmbientBackground](src/components/ui/ambient-background.tsx), [ParticleField](src/components/ui/particle-field.tsx))

### Styling Patterns

- **Glassmorphism**: Use `backdrop-blur-md`, `bg-white/5`, `border border-white/10` for glass effects
- [GlassPanel](src/components/ui/glass-panel.tsx) provides hover-reactive shine gradients
- **Typography**: `font-display` (Cormorant Garamond) for headings, `font-body` (Outfit) for text
- **CSS variables**: Defined in [index.css](src/index.css) via Tailwind's `hsl(var(--primary))` pattern
- `.noise-overlay` class adds subtle texture to backgrounds

## Development Workflow

- **Always verify performance** after changes using the overlay
- **Always verify that the code compiles** and no errors of typescript compilation exist
- **Run tests** before committing: `npm run test`
- `npm run build` to verify production build

### Debug Overlays

- **Performance Overlay**: `Cmd/Ctrl + Shift + P` - Canvas performance, FPS, memory
- **CubeSpace Debug**: `Cmd/Ctrl + Shift + I` - Flow tracking, buffer status, metrics
- Both overlays are DEV-only and persist state in localStorage

### Path Aliases

All imports use `@/` alias ([tsconfig.json](tsconfig.json), [vite.config.ts](vite.config.ts)):

```typescript
import { Button } from "@/components/ui/button";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { throttleRAF } from "@/utils/animation";
```

### Performance Debugging

2. Identify components >16.67ms (red threshold)
3. Use `reportPerformance(componentName, startTime)` to track new canvas components

## Critical Patterns

### Testing

- Tests use **Vitest** + React Testing Library
- Run: `npm run test` (watch) or `npm run test:ui` (interactive)
- Coverage: `npm run test:coverage`
- **All new features require tests** (unit for pure logic, integration for providers)
- Mock Firebase/Auth0 using `src/test/mocks/` patterns
- Follow existing test structure in `__tests__/` directories

### Canvas Component Template

```typescript
useEffect(() => {
  const startTime = performance.now();
  // ... canvas rendering logic
  reportPerformance("ComponentName", startTime);
}, [deps]);
```

### Scroll Progress Calculation

```typescript
const computeSectionProgress = (section: HTMLElement) => {
  const rect = section.getBoundingClientRect();
  const vh = window.innerHeight;
  const total = rect.height - vh;
  return Math.max(0, Math.min(1, -rect.top / total));
};
```

### Refs Over State for Animation

Use `useRef` for values updated every frame (scroll position, mouse coordinates) to avoid re-renders. Only use `useState` for UI-gating logic (visibility, active index).

## Anti-Patterns to Avoid

- ❌ Don't add `console.log` in scroll/RAF handlers – use the performance overlay
- ❌ Avoid inline styles for animations – prefer CSS classes with Tailwind or CSS variables
- ❌ Don't create new canvas contexts on every render – cache in refs
- ❌ Never skip tests for new features – tests are required
- ❌ Don't modify business logic when adding instrumentation

## TypeScript Configuration & Standards

**Permissive settings** for rapid prototyping ([tsconfig.json](tsconfig.json)):

- `strictNullChecks: false`

**Type Safety Requirements:**

- ❌ **Never use `any` type** – Always provide explicit types for variables, parameters, and returns
- ✅ Use `unknown` when type cannot be determined, then narrow appropriately
- ✅ Use `interface` over `type` for extensibility and object shapes
- ✅ Use generic types `<T>` for reusable components and utilities
- ✅ Define callback signatures precisely (don't rely on implicit inference)

**Examples:**

```typescript
// ❌ Bad - using any
const processData = (data: any) => { ... };

// ✅ Good - explicit types
interface CubeData {
  remoteId: string;
  color: string;
  position: Vector3;
}
const processData = (data: CubeData) => { ... };

// ❌ Bad - any callback
const callback = (result: any) => { ... };

// ✅ Good - typed callback
interface ListenerMeta {
  fromCache: boolean;
  size: number;
  empty: boolean;
}
type OnNext<T> = (data: T[], meta: ListenerMeta) => void;
const callback: OnNext<CubeData> = (cubes, meta) => { ... };
```

`IMPORTANT: Make sure that all added new code compiles and has no typescript errors. Always provide proper types – never use any.`
