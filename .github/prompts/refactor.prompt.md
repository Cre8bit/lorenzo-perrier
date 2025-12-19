You are a senior React + TypeScript engineer. Refactor this project to simplify architecture, remove unused code, and group files logically, while preserving all UI, animations, and behaviors exactly.

Target architecture (must follow)

src/
  components/
    sections/   // page sections (Hero, Philosophy, Carousel, Experience…)
    ui/         // reusable UI components (buttons, cards, steppers…)
  hooks/        // reusable hooks
  utils/        // helpers, math, animation utils
  styles/       // global styles, tokens


⸻

Hard constraints
	•	No visual or behavioral regressions
	•	No animation / scroll timing changes
	•	No new dependencies
	•	TypeScript must stay strict
	•	After each step: typecheck + build + manual smoke check

⸻

Phase 1 — Explore (read-only)
	1.	Print and inspect the current src/ tree.
	2.	Identify:
	•	Section-level components (full-page or major sections)
	•	Reusable UI components
	•	Feature-specific vs shared hooks/utils
	3.	List unused or suspicious files (do not delete yet).
	4.	Write a baseline behavior checklist (scroll, animations, interactions).

Deliverable: short exploration summary + baseline checklist.

⸻

Phase 2 — Refactoring plan (no code changes yet)
	1.	Propose a before → after directory map using the target architecture.
	2.	List:
	•	Files to move into components/sections
	•	Files to move into components/ui
	•	Hooks/utils to centralize
	•	Candidates for removal (unused)
	3.	Identify risky areas (scroll math, animation timing) and how you’ll protect them.

Deliverable: concise refactoring plan

⸻

Phase 3 — Execute safely

Follow the plan exactly.

Step A — Guardrails
	•	Ensure typecheck, build, and local run work.
	•	Do not refactor until guardrails pass.

Step B — Remove unused code (tiny batches)
	•	Use TS references + IDE tooling.
	•	Remove only clearly unused files.
	•	Verify after every batch.

Step C — Move files into new structure
	•	Migrate one section or group at a time.
	•	Update imports immediately.
	•	Add index.ts barrel exports where helpful.

Step D — Consolidate shared logic
	•	Merge duplicated helpers (math, easing, raf, scroll) into utils/ or hooks/.
	•	Copy implementations exactly to avoid behavior drift.

Step E — Optional simplification
	•	Split very large components only if it reduces complexity.
	•	Do not change logic or timing.

⸻

Verification
	•	typecheck
	•	build
	•	Manual smoke check against baseline checklist
	•	No console errors

⸻

Final output required
	1.	Final directory tree
	2.	List of removed files (and why safe)
	3.	Summary of moved/renamed components
	4.	Confirmation that baseline behavior is unchanged