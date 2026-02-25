# R3 Progress: Planting Season

## S1 — System schema: tables, events, materializers [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- Added `systems` table with columns: id, name, description, category, purposeStatement, lifecycleState, plantedAt, hibernatedAt, uprootedAt, midCycleUpdatedAt, createdAt, updatedAt
- Added `systemTaskTemplates` table with columns: id, systemId, title, description, cadence, lastGeneratedAt, nextGenerateAt, position, createdAt, updatedAt
- Updated `hexPositions.entityType` to include `'system'` (both in events.ts HexEntityTypeLiteral and schema.ts table definition)
- Added 11 system events: SystemCreated, SystemUpdated, SystemPlanted, SystemHibernated, SystemResumed, SystemUprooted, SystemTaskTemplateAdded, SystemTaskTemplateUpdated, SystemTaskTemplateRemoved, SystemTaskGenerated, SystemMidCycleUpdated
- Added materializers for all 11 events following existing codebase patterns
- Added 4 system queries: getSystems$, getSystemById$, getSystemTaskTemplates$, getPlantedSystems$
- Exported types: System, SystemTaskTemplate, SystemLifecycleState, SystemCadence

**Files modified:**

- `packages/shared/src/livestore/events.ts` — 11 new event definitions, HexEntityTypeLiteral updated
- `packages/shared/src/livestore/schema.ts` — 2 new tables, type exports, materializers, tables object updated
- `packages/shared/src/livestore/queries.ts` — 4 new queries

**Decisions:**

- Used `Schema.optional` for most system creation fields (description, category, purposeStatement) to allow progressive fill-in during Drafting Room stages
- `SystemMidCycleUpdated` takes an array of `templateOverrides` to allow batch updating all template schedules at once
- `SystemTaskGenerated` updates the template's lastGeneratedAt/nextGenerateAt in its materializer (not the system itself)
- Category reuses the same 8 categories as projects (health, relationships, finances, growth, leisure, spirituality, home, contribution)

**Notes for next story (S2):**

- Queries are already in queries.ts — S2 adds additional queries (getSystemHexPositions$, getAllHexPositions$, getUnplacedSystems$) and the `computeNextGenerateAt` utility
- The `computeNextGenerateAt` utility goes in `packages/shared/src/utils/system-schedule.ts`
- Pre-existing test failures exist in hex-map/ tests (missing @react-three/drei) and hex-grid-prototype typecheck — not related to system changes

---

## S2 — System queries + schedule helper [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- Added 3 additional queries: `getSystemHexPositions$`, `getAllHexPositions$`, `getUnplacedSystems$` (raw SQL join query matching `getUnplacedProjects$` pattern)
- Created `computeNextGenerateAt(cadence, from)` utility in `packages/shared/src/utils/system-schedule.ts`
- Uses UTC methods throughout to avoid DST-related time shifts
- Handles month-end clamping (Jan 31 + 1 month = Feb 28, leap years handled)
- 10 unit tests covering all 5 cadences, month-end clamping, leap years, and immutability
- Exported from shared package index

**Files modified:**

- `packages/shared/src/livestore/queries.ts` — 3 new queries
- `packages/shared/src/utils/system-schedule.ts` — new file
- `packages/shared/tests/utils/system-schedule.test.ts` — new file
- `packages/shared/src/index.ts` — re-export

**Decisions:**

- Used native Date UTC methods instead of date-fns (no new dependency needed)
- `getUnplacedSystems$` uses raw SQL with LEFT JOIN (same pattern as existing `getUnplacedProjects$`)
- `getAllHexPositions$` queries all entity types, complementing existing `getHexPositions$`

**Notes for next story (S3):**

- S3 (Entity type gate) depends on S1 and S2 — both complete
- S3 touches routes.ts, App.tsx router, DraftingRoom.tsx — read these first
- The gate is a simple binary choice (Project vs System), no Marvin involvement

---

## S3 — Entity type gate (Project vs System) [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `EntityTypeGate` component with two large cards: Project ("Bounded work with a finish line") and System ("Infrastructure that runs indefinitely")
- Updated routes: `ENTITY_TYPE_GATE` at `/drafting-room/new`, `PROJECT_CREATE` moved to `/drafting-room/new/project`, `SYSTEM_CREATE` at `/drafting-room/new/system`
- DraftingRoom "New Project" button renamed to "New", navigates to gate
- System create placeholder page (for S4)
- E2E tests updated for new project create URL
- Storybook stories for EntityTypeGate (default + narrow viewport)
- `useNavigationContext` updated for new routes

**Files modified:** routes.ts, Root.tsx, DraftingRoom.tsx, useNavigationContext.ts, 3 E2E specs
**Files created:** EntityTypeGate.tsx, EntityTypeGate.stories.tsx

---

## S8 — System Board: basic list view [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `SystemBoard` component with list view of planted/hibernating systems
- Each row: system name, category badge, lifecycle state badge, template count, next-due (relative time), last-generated
- Collapsible "Uprooted" section for decommissioned systems
- Empty state with link to Drafting Room
- "System Board" nav item in shell header navigation
- `SYSTEM_BOARD_ROOM` definition in rooms.ts with minimal prompt
- Stubbed Hibernate/Resume/Uproot action buttons (for S9)
- Additional queries: `getAllSystems$`, `getUprootedSystems$`, `getAllSystemTaskTemplates$`
- Storybook stories: Empty, ThreePlantedSystems, WithHibernating, WithUprooted

**Files modified:** routes.ts, Root.tsx, NewUiShell.tsx, rooms.ts, queries.ts
**Files created:** SystemBoard.tsx, SystemBoard.stories.tsx

**Notes for next stories:**

- S4 (System Stage 1) depends on S3 — complete, can proceed
- S9 (lifecycle actions) depends on S8 — complete, can proceed
- S4 and S9 are independent and can run in parallel

---

## S4 — System Stage 1: Identify form [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `SystemStage1Form` component: title, description, category fields with auto-save on blur
- `SystemStageWizard` component: 3-stage wizard (Identify/Scope/Detail) using system routes
- `SystemQueueCard` component: card for systems in Drafting Room queue with "System" badge
- DraftingRoom updated to show planning systems alongside projects, grouped by stage
- Route `SYSTEM_STAGE1` added for editing existing systems at stage 1
- Root.tsx updated to use SystemStage1Form instead of placeholder
- Storybook stories: Default (new system) and WithExistingSystem

**Files modified:** Root.tsx, DraftingRoom.tsx, routes.ts
**Files created:** SystemStage1Form.tsx, SystemStageWizard.tsx, SystemQueueCard.tsx, SystemStage1Form.stories.tsx

**Decisions:**

- Kept S3's entity type gate pattern (single "New" button → gate) rather than separate Project/System buttons
- System stage determined by data completeness: Stage 1 = no purposeStatement, Stage 2 = has purposeStatement
- Reused PROJECT_CATEGORIES for systems (same 8 life categories)
- Systems in planning with `tierFilter !== 'all'` are hidden (systems don't have tiers)

---

## S9 — Lifecycle actions: Hibernate/Resume/Uproot [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- Hibernate button: confirm dialog, commits `systemHibernated`, amber styling
- Resume button: no confirm, commits `systemResumed` + `systemMidCycleUpdated` to recalculate all template `nextGenerateAt`
- Uproot button: destructive confirm dialog, commits `systemUprooted` + removes hex position if exists
- Upgrade button: disabled stub with "Coming soon" tooltip (planted systems only)
- New `MixedLifecycleStates` Storybook story demonstrating all actions
- Fixed bug in stories: lifecycle events used `systemId` instead of `id`

**Files modified:** SystemBoard.tsx, SystemBoard.stories.tsx, EntityTypeGate.stories.tsx (format)

**Decisions:**

- Resume uses `systemMidCycleUpdated` to batch-update template schedules (consistent with mid-cycle flow)
- `computeNextGenerateAt` imported from shared package for schedule recalculation
- Hex position removal on uproot via `hexPositionRemoved` event

---

## S13 — Cameron prompt: system investment advice [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- Cameron's SORTING_ROOM_PROMPT updated with System Awareness section
- Added: finish line test, when to suggest creating a system, system vs Silver project distinction
- Added CHORUS_TAG links: entity-type-gate for system creation, system-board for monitoring
- Charter alignment guidance (suggest checking Charter but no live data access)
- SYSTEM_BOARD_PROMPT upgraded with comprehensive lifecycle actions guidance, health diagnostics

**Files modified:** rooms.ts

---

## S5 — System Stage 2: Scope + task templates [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `SystemStage2Form` component: purpose statement textarea + recurring task template editor
- Template editor: add/edit/delete templates with title, cadence dropdown, description
- Mid-cycle button: "I'm already doing this" inline panel with per-template date inputs
- Batch commit on "Continue": new templates via `systemTaskTemplateAdded`, modified via `systemTaskTemplateUpdated`, deleted via `systemTaskTemplateRemoved`
- Auto-save purpose statement on blur
- Fixed invalid `lifecycleState` field in SystemStage1Form's `systemCreated` event call
- Storybook stories: Default, WithExistingTemplates, MidCycleFlow

**Files modified:** Root.tsx, SystemStage1Form.tsx, SystemStage1Form.stories.tsx
**Files created:** SystemStage2Form.tsx, SystemStage2Form.stories.tsx

---

## S6 — System Stage 3 + Plant action [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `SystemStage3Form` component: health notes + delegation notes (optional textareas)
- Notes stored in description field using section markers (## Health Notes / ## Delegation Notes)
- "Plant System" button: commits `systemPlanted` + `systemMidCycleUpdated` for template scheduling
- Read-only template summary displayed
- Navigates to Life Map after planting
- Storybook stories: Default, WithNotes

**Files modified:** Root.tsx
**Files created:** SystemStage3Form.tsx, SystemStage3Form.stories.tsx

---

## S10 — Client-side task generation engine [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- `SystemTaskGenerator` component: background utility mounted in ProtectedApp after SettingsInitializer
- Pure function `computeTasksToGenerate()` extracted for testability
- Queries planted systems + all templates, generates overdue tasks via `taskCreatedV2` + `systemTaskGenerated`
- 52-task cap per template per session prevents unbounded catch-up
- Generated tasks are orphaned (no projectId)
- One-shot pattern with global flag (runs once per session)
- 10 unit tests: weekly/monthly cadences, cap enforcement, future/null nextGenerateAt, boundary conditions

**Files modified:** Root.tsx
**Files created:** SystemTaskGenerator.tsx, system-task-generator.test.ts

---

## S12 — Marvin prompt: system creation guidance [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- DRAFTING_ROOM_PROMPT updated with System Creation: The 3-Stage Process section
- Entity Types section with finish line test
- Mid-cycle awareness, System vs Project distinction
- System navigation CHORUS_TAG links (system-stage2, system-stage3, entity-type-gate)
- "What You Do NOT Do" section for system boundaries
- Stream Assignment labeled "(Projects Only)"
- Guidelines updated for simple-system approach

**Files modified:** rooms.ts

---

## S7 — System hex tile [DEFERRED]

**Status:** Deferred (dependency not installable)
**Date:** 2026-02-24

**Reason:** `@react-three/drei` and `@react-three/fiber` are declared in package.json but not installed in node_modules. All existing hex-map code has pre-existing typecheck failures. The hex tile visual treatment requires these packages to compile and test. S7 and S11 (which depends on S7) are deferred until the Three.js dependency issue is resolved.

---

## S11 — Smoke signals [DEFERRED]

**Status:** Deferred (blocked on S7)
**Date:** 2026-02-24

**Reason:** Depends on S7 (hex tile), which is deferred due to missing Three.js dependencies.

---

## Summary

**Complete:** S1, S2, S3, S4, S5, S6, S8, S9, S10, S12, S13 (11/13)
**Deferred:** S7, S11 (hex map visual features — blocked on missing @react-three/drei install)
