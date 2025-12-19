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

### Commands

```bash
npm run dev          # Dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Dev build with source maps
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Path Aliases

All imports use `@/` alias ([tsconfig.json](tsconfig.json), [vite.config.ts](vite.config.ts)):

```typescript
import { Button } from "@/components/ui/button";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { throttleRAF } from "@/utils/animation";
```

### Adding shadcn/ui Components

Uses [components.json](components.json) config. Install via `npx shadcn@latest add <component>`. Always import from `@/components/ui/`.

### Performance Debugging

1. Press `Ctrl/Cmd + Shift + P` to toggle overlay
2. Identify components >16.67ms (red threshold)
3. Press `Ctrl/Cmd + Shift + Q` for ParticleField quality controls (live tuning)
4. Use `reportPerformance(componentName, startTime)` to track new canvas components

## Critical Patterns

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

- ❌ Never store derived values (like `activeIndex`) in state if they can be computed from `progress`
- ❌ Don't add `console.log` in scroll/RAF handlers – use the performance overlay
- ❌ Avoid inline styles for animations – prefer CSS classes with Tailwind or CSS variables
- ❌ Don't create new canvas contexts on every render – cache in refs

## TypeScript Configuration

**Permissive settings** for rapid prototyping ([tsconfig.json](tsconfig.json)):

- `strictNullChecks: false`

When adding types, prefer interfaces over types for extensibility.

## External Dependencies

- **Radix UI**: Accessible primitives for dialogs, dropdowns, etc.
- **Embla Carousel**: Powers [CarouselGlide](src/components/sections/CarouselSection/CarouselGlide.tsx)
- **Lucide React**: Icon library
- **TanStack Query**: Used in [App.tsx](src/App.tsx) but currently unused (future API integration)
- **Lovable Tagger**: Dev-only plugin for component tagging

## Key Files to Reference

- [performance.ts](src/lib/performance.ts) – Device tier detection, DPR optimization, throttling
- [animation.ts](src/utils/animation.ts) – Math utilities (`smoothstep`, `lerp`, `clamp01`)
- [PhilosophyReveal.tsx](src/components/sections/PhilosophySection/PhilosophyReveal.tsx) – Complex scroll-driven state machine (best example of scroll choreography)
- [particle-field.tsx](src/components/ui/particle-field.tsx) – Spatial grid implementation for canvas optimization
