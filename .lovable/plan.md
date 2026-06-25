# Mobile Overhaul — Plan

## Architecture

Add a `useIsMobile()` switch at the page level. For each redesigned section, render `<XMobile />` below the mobile breakpoint, keep desktop component untouched above. New files live in `src/components/sections/.../mobile/`. No props drift; same data sources.

```text
src/components/sections/
├── HeroSection.tsx                       (desktop, untouched)
├── HeroSectionMobile.tsx                 (new)
├── CarouselSection/
│   ├── CarouselGlide.tsx                 (desktop, untouched)
│   └── CarouselMobile.tsx                (new)
└── ExperienceSection/
    ├── ExperienceSection.tsx             (desktop, untouched)
    └── ExperienceMobile.tsx              (new)
```

A shared `src/components/mobile/` folder hosts reusable primitives:
`SectionZoom.tsx` (scroll-driven scale/opacity wrapper), `MarqueeBand.tsx`
(horizontal ribbon between sections), `PinnedHorizontalScroll.tsx`
(vertical-scroll → horizontal-pan for the carousel), `MobileBackdrop.tsx`
(reduced particle loop + tinted band per section).

## Signature mobile interactions

- **Hero → Philosophy**: full-bleed hero with name and one line, scrolls into a `SectionZoom` that scales the next block from 0.85 → 1 as it enters, then 1 → 0.92 as it leaves. flite.bike-style.
- **Between major sections**: a thin `MarqueeBand` ribbon (e.g. "BUILDING AT THE EDGE OF AI · SHIPPING · SYSTEMS · …") scrolling opposite to scroll direction. journey-digital-style.
- **Carousel**: pinned section. Vertical scroll inside the pin drives horizontal pan across the 5 work-context cards (full-bleed, tinted glass kept). Tap a card to flip — no hover. Exits pin → resumes vertical scroll.
- **Experience blocks**: each experience / KPI / skills / education / links block is a full-bleed glass band with alternating tint (dark → off-dark → deep-teal → dark) and a `SectionZoom` scale-in. KPIs animate count-up on first viewport entry (already exists — reuse).

## Background

`MobileBackdrop` reuses the existing `particle-field-3d` engine at ~30% particle count, paused via `IntersectionObserver` when the active section is offscreen. `prefers-reduced-motion` → static gradient + grain only. Tint of the backdrop is driven by the currently-pinned section id so the color rhythm reads even with particles muted.

## Accessibility & perf rules (hard constraints)

- All tap targets ≥ 48px (audit Carousel arrows, flip toggle, stepper dots, links).
- No hover-only reveals; every flip/expand has a tap affordance and a visible "tap to flip" hint on first card.
- Scroll-driven transforms use `transform` + `opacity` only, `will-change` pinned, `IntersectionObserver` to skip work offscreen.
- Marquee uses CSS `@keyframes translateX` (GPU), not JS.
- Pinned horizontal carousel uses native `scroll-snap-x` (no scroll-jacking library), with a `position: sticky` wrapper — works smoothly on iOS Safari without GSAP.
- Particles count: desktop 100% → mobile 30%; disable bloom on mobile.

## Scope of this pass (per your selection)

1. `HeroSectionMobile` — full-bleed, one line, scroll-zoom into next.
2. `CarouselMobile` — pinned + horizontal scroll-snap, tap-to-flip, full-bleed tinted cards.
3. `ExperienceMobile` — alternating full-bleed bands for ExperienceHero, each Experience entry, KPIs, Skills, Education, Links, with scroll-zoom + marquee dividers.
4. Shared mobile primitives: `SectionZoom`, `MarqueeBand`, `PinnedHorizontalScroll`, `MobileBackdrop`.
5. `Home.tsx` wires `useIsMobile` to swap component sets.

Philosophy section, PageTransition, navbar, ContactButton — left as-is this pass (already mobile-acceptable).

## Out of scope this pass

- Philosophy reveal redesign (already vertical, works on mobile).
- CubeSpace page (separate route, already handled).
- New copy/content — pure structural/visual overhaul, all text reused.

## Validation

After build: open preview at mobile viewport, scroll through Hero → Carousel → Experience, verify (a) zoom transitions trigger, (b) carousel pins and pans horizontally on vertical scroll, (c) marquee ribbons animate, (d) particle count visibly reduced, (e) no layout shift, (f) tap targets pass 48px on dev tools.
