# Context Briefing: Issue #701 — Remove the Drafting Room

**Assembled by:** Conan the Librarian
**Date:** 2026-02-27
**Target type:** Room
**Task type:** Removal

---

## Task Frame

Remove the Drafting Room from the UI entirely. This includes the `DraftingRoom` component, `Stage1Form`, `Stage2Form`, `Stage3Form`, `StageWizard`, `PlanningQueueCard`, all `/drafting-room/*` routes, and nav links. Drafting will be rebuilt inside the Workshop in a later story.

**Key constraint:** This is a removal, not a replacement. The Planning Queue data model and project lifecycle stages remain in the schema/events layer. Only the UI surface is being removed.

---

## Primary Cards

### 1. Room - Drafting Room
**Path:** `docs/context-library/product/rooms/Room - Drafting Room.md`

Marvin's dedicated space where builders create new projects and systems via structured creation flows. Implements the Four-Stage Creation system. Located in the Strategy Studio zone. Creates Project and System primitives.

**Key implementation details (from WHEN section):**
- Lives at `/drafting-room` with Marvin agent active
- `Stage1Form.tsx`, `Stage2Form.tsx`, `Stage3Form.tsx` plus `StageWizard.tsx`
- `PlanningQueueCard` components render the Planning Queue
- CHORUS_TAG navigation links between stages

### 2. System - Four-Stage Creation
**Path:** `docs/context-library/product/systems/System - Four-Stage Creation.md`

Progressive development process: Identify (Stage 1), Scope (Stage 2), Draft (Stage 3), Prioritize (Stage 4). Separates cognitive modes. Stage 4 happens in the Sorting Room, not the Drafting Room.

**Impact note:** The system itself is conceptual/data-model level and persists. Only its UI surface in the Drafting Room is being removed.

### 3. System - Planning Queue
**Path:** `docs/context-library/product/systems/System - Planning Queue.md`

Holding area for projects in stages 1-3. Rendered via `PlanningQueueCard.tsx` in the Drafting Room. Builders click items to resume at the appropriate stage form.

**Impact note:** The queue concept persists in the data model (`status: 'planning'`, `stage: 1-3`). Only the UI rendering in the Drafting Room is removed.

---

## Supporting Cards

### 4. Zone - Strategy Studio
**Path:** `docs/context-library/product/zones/Zone - Strategy Studio.md`

Parent zone containing the Drafting Room, Sorting Room, Council Chamber, and Roster Room. Per GDD v0.2 design decision, the Strategy Studio as a separate zone is dissolved -- rooms move inside the sanctuary structure on the hex grid.

### 5. Agent - Marvin
**Path:** `docs/context-library/product/agents/Agent - Marvin.md`

Marvin's home rooms include the Drafting Room, Sorting Room, and Roster Room. Drafting Room removal affects Marvin's Drafting responsibilities but not his Sorting Room or Roster Room presence.

**Impact note:** The `DRAFTING_ROOM` constant in `packages/shared/src/rooms.ts` includes Marvin's prompt and room definition. This needs removal.

### 6. System - Pipeline Architecture
**Path:** `docs/context-library/product/systems/System - Pipeline Architecture.md`

Two-queue system (Planning Queue -> Priority Queue). The Drafting Room is the UI surface for the Planning Queue side. Removal means the Planning Queue temporarily has no UI surface until the Workshop rebuild.

### 7. Capability - Purpose Assignment
**Path:** `docs/context-library/product/capabilities/Capability - Purpose Assignment.md`

Purpose assignment happens during Stage 2 in the Drafting Room. Removal means this capability temporarily has no UI surface.

### 8. Primitive - Project
**Path:** `docs/context-library/product/primitives/Primitive - Project.md`

Projects are created in the Drafting Room. Removal means project creation temporarily has no UI surface until Workshop rebuild.

---

## Relationship Map

```
Zone - Strategy Studio
  |
  +-- Room - Drafting Room  <-- REMOVING THIS
  |     |
  |     +-- System - Four-Stage Creation (UI surface removed, data model stays)
  |     +-- System - Planning Queue (UI surface removed, data model stays)
  |     +-- Capability - Purpose Assignment (UI surface removed)
  |     +-- Agent - Marvin (Drafting role suspended, Sorting role unaffected)
  |     +-- System - Pipeline Architecture (Planning Queue side loses UI)
  |     +-- Primitive - Project (creation flow suspended)
  |     +-- Primitive - System (creation flow suspended)
  |
  +-- Room - Sorting Room  (unaffected, keep as-is)
  +-- Room - Council Chamber (not implemented)
  +-- Room - Roster Room (not implemented)
```

---

## Codebase Impact Map

### Files to DELETE (6 files)

| File | Description |
|------|-------------|
| `packages/web/src/components/drafting-room/DraftingRoom.tsx` | Main Drafting Room component |
| `packages/web/src/components/drafting-room/Stage1Form.tsx` | Stage 1 (Identifying) form |
| `packages/web/src/components/drafting-room/Stage2Form.tsx` | Stage 2 (Scoping) form |
| `packages/web/src/components/drafting-room/Stage3Form.tsx` | Stage 3 (Drafting) form |
| `packages/web/src/components/drafting-room/StageWizard.tsx` | Stage wizard flow component |
| `packages/web/src/components/drafting-room/PlanningQueueCard.tsx` | Planning Queue item card |

### Files to EDIT (significant changes)

| File | Change Required |
|------|-----------------|
| `packages/web/src/Root.tsx` | Remove 5 drafting routes (`DRAFTING_ROOM`, `PROJECT_CREATE`, `PROJECT_STAGE1/2/3`), remove imports of `DraftingRoom`, `Stage1Form`, `Stage2Form`, `Stage3Form`, `DRAFTING_ROOM` room constant. Add redirect from `/drafting-room/*` to `/life-map`. |
| `packages/web/src/constants/routes.ts` | Remove `DRAFTING_ROOM`, `PROJECT_CREATE`, `PROJECT_STAGE1`, `PROJECT_STAGE2`, `PROJECT_STAGE3` from `ROUTES`. Remove `draftingRoom`, `projectCreate`, `projectStage1/2/3` from `generateRoute`. |
| `packages/web/src/components/layout/NewUiShell.tsx` | Remove "Drafting Room" nav link from header navigation. |
| `packages/shared/src/rooms.ts` | Remove `DRAFTING_ROOM_PROMPT`, `DRAFTING_ROOM` constant, and `getRoomDefinition` case for `'drafting-room'`. Remove CHORUS_TAG patterns for `drafting-stage1/2/3`. |
| `packages/web/src/hooks/useChorusNavigation.ts` | Remove `drafting-stage1`, `drafting-stage2`, `drafting-stage3` cases from the CHORUS_TAG handler. |
| `packages/web/src/hooks/useNavigationContext.ts` | Remove `/drafting-room` path matching logic. |
| `packages/web/src/components/life-map/LifeMap.tsx` | Remove link to `generateRoute.draftingRoom()`. Remove planning project count reference that links to Drafting Room. |
| `packages/web/src/components/life-map/CategoryCard.tsx` | Remove link to Drafting Room with category filter (`generateRoute.draftingRoom()` with `?category=`). |
| `packages/web/src/components/project-room/ProjectHeader.tsx` | Remove `draftingStageUrl` logic and the button that navigates to drafting stages. Replace with a non-interactive lifecycle badge. |

### Files to EDIT (test files)

| File | Change Required |
|------|-----------------|
| `packages/web/e2e/drafting-room-back-button.spec.ts` | DELETE entire file (tests Drafting Room specific behavior). |
| `packages/web/e2e/workflow.spec.ts` | Rewrite project creation tests -- currently create projects via `/drafting-room/new`. Need alternative creation path or skip. |
| `packages/web/e2e/life-map-placement.spec.ts` | Update -- creates projects via `/drafting-room/new`. |
| `packages/web/e2e/smoke.spec.ts` | Check for drafting room references and update. |
| `packages/web/e2e/test-utils.ts` | Remove `page.goto('/drafting-room')` helper. |
| `packages/web/e2e/auth-integration.spec.ts` | Update -- uses `/drafting-room` as test destination. Replace with `/life-map`. |
| `packages/web/e2e/auth-flow-comprehensive.spec.ts` | Update -- uses `/drafting-room` as test destination. Replace with `/life-map`. |
| `packages/web/e2e/user-dropdown.spec.ts` | Update -- navigates to `/drafting-room` for tests. Replace with `/life-map`. |
| `packages/web/e2e/feedback-button.spec.ts` | Update -- navigates to `/drafting-room`. Replace with `/life-map`. |
| `packages/web/src/hooks/useChorusNavigation.test.tsx` | Remove `drafting-stage1/2/3` test cases. |
| `packages/web/src/components/project-room/ProjectHeader.test.tsx` | Remove drafting stage URL test expectations. |

### Files UNAFFECTED (confirmed)

| File | Reason |
|------|--------|
| `packages/shared/src/events.ts` | Project events/schema unchanged |
| `packages/shared/src/schema.ts` | Data model unchanged (planning status, stages remain) |
| `packages/shared/src/queries.ts` | Queries unchanged |
| `packages/web/src/components/sorting-room/*` | No drafting references |
| `packages/web/src/components/markdown/MarkdownRenderer.test.tsx` | Only mentions "drafting" in string content, not imports |

---

## Gap Manifest

| Dimension | Gap | Searched | Notes |
|-----------|-----|----------|-------|
| HOW | No Workshop design card exists yet | Yes | Workshop is mentioned as the future home for drafting. No context library card for it. |
| WHEN | No timeline for Workshop rebuild | Yes | Issue says "later story" but no issue/card exists. |
| HOW | Project creation path after removal | Yes | With Drafting Room removed, there is temporarily no way to create projects in the UI. This is intentional per the issue. |
| WHERE | No redirect strategy documented | No | `/drafting-room/*` URLs in bookmarks/links will break. Recommend adding redirects to `/life-map`. |

---

## WHEN Divergences

| Card | WHEN Says | Reality |
|------|-----------|---------|
| Room - Drafting Room | "Implementation status: Implemented" | Will become "Removed" after this issue. Card needs WHEN update. |
| System - Four-Stage Creation | "Implementation status: Implemented" | UI removed; data model persists. Card needs WHEN update noting UI removal. |
| System - Planning Queue | "Implementation status: Implemented" | UI removed; data model persists. Card needs WHEN update. |
| System - Pipeline Architecture | "Implementation status: Implemented" | Planning Queue side loses UI surface. Card needs WHEN update. |
| Zone - Strategy Studio | Lists Drafting Room as a room | Room being removed. Card needs update. |
| Agent - Marvin | "fully active in the Drafting Room" | Drafting Room being removed. Card needs WHEN update. |

---

## Context Library Cards Needing Updates Post-Merge

After the PR merges, these cards need WHEN section updates:

1. `Room - Drafting Room` -- add reality note: "Removed in #701. Drafting to be rebuilt in Workshop."
2. `System - Four-Stage Creation` -- add reality note: "UI removed in #701. Data model intact."
3. `System - Planning Queue` -- add reality note: "UI removed in #701. Data model intact."
4. `System - Pipeline Architecture` -- add reality note: "Planning Queue UI removed in #701."
5. `Agent - Marvin` -- update reality note: "Drafting Room removed in #701."
6. `Zone - Strategy Studio` -- update reality note about Drafting Room removal.
7. `Capability - Purpose Assignment` -- add reality note: "UI surface removed with Drafting Room in #701."
