# Plan: Remove the Drafting Room (#701)

## 1. Architecture Decisions

### Decision: Remove Drafting UI/routing surfaces, keep lifecycle/planning data intact

Options considered: (a) keep Drafting routes/components hidden but mounted, (b) fully remove Drafting UI/routes while preserving project lifecycle data in LiveStore.  
Chosen approach: fully remove Drafting UI/routes/components and keep all lifecycle/planning fields/events unchanged.  
Why: matches the story finish line and avoids accidental dependence on deprecated UI while preserving historical and current project data.  
State boundaries: LiveStore keeps `projectLifecycleState` (`status`, `stage`, `stream`, etc.); React drops Drafting components/hooks/routes; URL no longer exposes Drafting route constants.

### Decision: Preserve backward compatibility for legacy `/drafting-room/*` URLs via redirect

Options considered: (a) hard-remove Drafting paths and let them 404, (b) add a catch-all legacy redirect to `/life-map`.  
Chosen approach: add explicit route redirect `/drafting-room/* -> /life-map` in `Root.tsx` while removing Drafting routes from `ROUTES`/`generateRoute`.  
Why: protects bookmarks, old auth redirect targets, and stale links without reintroducing Drafting UI.  
State boundaries: URL accepts legacy Drafting paths only as redirect aliases; React never mounts Drafting components; LiveStore unaffected.

### Decision: Remove Drafting-specific navigation affordances, keep planning state visible as read-only

Options considered: (a) keep planning links/buttons and rely on redirect, (b) remove Drafting links/buttons and render non-interactive planning indicators.  
Chosen approach: remove Drafting links/buttons (header nav, Life Map/category chips, ProjectHeader stage badge links) and keep planning counts/lifecycle text as read-only UI.  
Why: avoids "dead-end" interactions and meets "no navigation element points to Drafting Room."  
State boundaries: LiveStore still computes planning/backlog state; React renders status/counters without Drafting navigation; URL has no Drafting generators.

### Decision: Remove Drafting room-definition and CHORUS Drafting-stage navigation paths

Options considered: (a) keep `DRAFTING_ROOM`/`drafting-stage*` handlers as dormant compatibility code, (b) remove them and route project links to project detail only.  
Chosen approach: remove `DRAFTING_ROOM` from `packages/shared/src/rooms.ts`, remove `drafting-stage1/2/3` handling in `useChorusNavigation`, and keep `project:` links navigating to `/projects/:id`.  
Why: prevents runtime references to deleted routes and keeps room/navigation model aligned with shipped UI.  
State boundaries: shared static room registry shrinks; React navigation hook no longer emits Drafting routes; URL only uses active routes.

### Decision: Keep test suite green without introducing replacement creation UI in this story

Options considered: (a) build test-only project seeding infrastructure in #701, (b) remove/retarget Drafting-dependent tests and mark creation-dependent E2E flows as deferred to Workshop (#709).  
Chosen approach: remove Drafting-only specs, retarget generic E2E entry points to `/life-map`, and convert creation-dependent flows to `fixme`/redirect-focused assertions.  
Why: #701 intentionally removes creation UI; introducing new creation/test infrastructure would be scope creep.  
State boundaries: production runtime unchanged; only test harness/spec expectations change.

## 2. File Changes

| Action | File                                                            | Description                                                                                                                                           |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| delete | packages/web/src/components/drafting-room/DraftingRoom.tsx      | Remove Drafting Room page and planning queue UI surface.                                                                                              |
| delete | packages/web/src/components/drafting-room/Stage1Form.tsx        | Remove Stage 1 project creation/editing form UI.                                                                                                      |
| delete | packages/web/src/components/drafting-room/Stage2Form.tsx        | Remove Stage 2 scoping form UI.                                                                                                                       |
| delete | packages/web/src/components/drafting-room/Stage3Form.tsx        | Remove Stage 3 task-drafting form UI.                                                                                                                 |
| delete | packages/web/src/components/drafting-room/StageWizard.tsx       | Remove Drafting stage stepper component.                                                                                                              |
| delete | packages/web/src/components/drafting-room/PlanningQueueCard.tsx | Remove Planning Queue card component used by Drafting Room.                                                                                           |
| delete | packages/web/src/components/drafting-room/StageColumn.tsx       | Remove Drafting-only stage column wrapper component (dead after Drafting removal).                                                                    |
| modify | packages/web/src/Root.tsx                                       | Remove Drafting imports/routes and `DRAFTING_ROOM` usage; add legacy `/drafting-room/*` redirect to `/life-map`.                                      |
| modify | packages/web/src/constants/routes.ts                            | Remove `DRAFTING_ROOM`, `PROJECT_CREATE`, `PROJECT_STAGE1/2/3` and matching `generateRoute.*` helpers.                                                |
| modify | packages/web/src/components/layout/NewUiShell.tsx               | Remove Drafting Room nav link and active-state check.                                                                                                 |
| modify | packages/web/src/components/life-map/LifeMap.tsx                | Remove Drafting CTA link from empty state; update planning-related copy/comments to non-Drafting language.                                            |
| modify | packages/web/src/components/life-map/CategoryCard.tsx           | Replace Drafting planning chip link with non-link informational chip/text.                                                                            |
| modify | packages/web/src/components/project-room/ProjectHeader.tsx      | Remove planning-stage link computation to Drafting routes; render lifecycle badge as non-interactive text.                                            |
| modify | packages/web/src/hooks/useChorusNavigation.ts                   | Remove Drafting-stage route branches; stop routing planning projects to Drafting stages.                                                              |
| modify | packages/web/src/hooks/useNavigationContext.ts                  | Remove Drafting-specific path detection (`/drafting-room`, `/stage1/2/3`) from view descriptions.                                                     |
| modify | packages/shared/src/rooms.ts                                    | Remove `DRAFTING_ROOM_PROMPT` + `DRAFTING_ROOM` definition + room lookup case; remove any prompt guidance pointing users to Drafting Room/stage tags. |
| modify | packages/web/src/components/sorting-room/GoldSilverPanel.tsx    | Update empty-state copy that currently instructs users to use Drafting Room.                                                                          |
| modify | packages/web/src/components/sorting-room/BronzePanel.tsx        | Update empty-state copy that currently instructs users to use Drafting Room.                                                                          |
| modify | packages/web/src/hooks/useChorusNavigation.test.tsx             | Remove/update expectations for Drafting-stage navigation and planning project redirects.                                                              |
| modify | packages/web/src/components/project-room/ProjectHeader.test.tsx | Update tests to assert lifecycle badge is not a Drafting route button.                                                                                |
| delete | packages/web/e2e/drafting-room-back-button.spec.ts              | Remove Drafting-specific browser-back behavior suite.                                                                                                 |
| modify | packages/web/e2e/test-utils.ts                                  | Change default app-entry helper from `/drafting-room` to `/life-map`.                                                                                 |
| modify | packages/web/e2e/smoke.spec.ts                                  | Replace Drafting route assertions with Life Map and Drafting-redirect assertions.                                                                     |
| modify | packages/web/e2e/auth-integration.spec.ts                       | Replace Drafting destinations with Life Map and update redirect expectations.                                                                         |
| modify | packages/web/e2e/auth-flow-comprehensive.spec.ts                | Replace Drafting destinations/nav expectations with Life Map equivalents.                                                                             |
| modify | packages/web/e2e/user-dropdown.spec.ts                          | Replace Drafting route usage with Life Map route usage.                                                                                               |
| modify | packages/web/e2e/feedback-button.spec.ts                        | Navigate to Life Map (not Drafting) before header feedback assertions.                                                                                |
| modify | packages/web/e2e/workflow.spec.ts                               | Remove or mark `fixme` for Drafting-dependent create-stage flows; keep route/navigation coverage valid post-removal.                                  |
| modify | packages/web/e2e/life-map-placement.spec.ts                     | Remove or mark `fixme` for Drafting-dependent setup until Workshop creation UI exists (#709).                                                         |
| modify | packages/web/README.md                                          | Remove Drafting page/event analytics entries tied to deleted components.                                                                              |
| modify | packages/web/src/components/README.md                           | Remove `drafting-room/` directory entry.                                                                                                              |

## 3. Data Model Changes

No LiveStore data-model changes are planned in #701.

- Events: no additions/removals in `packages/shared/src/livestore/events.ts`.
- Schema/materializers: no changes in `packages/shared/src/livestore/schema.ts`.
- Queries: no changes in `packages/shared/src/livestore/queries.ts`.
- Migration notes: none.

Explicitly preserved:

- `projects.projectLifecycleState` including planning stages (`stage: 1..4`) and status/stream fields.
- Existing project/task/event history.

## 4. Component Hierarchy

Removed:

```
Root Routes
  /drafting-room
    RoomLayout(room=DRAFTING_ROOM)
      DraftingRoom
        StageColumn
          PlanningQueueCard
  /drafting-room/new
    RoomLayout(room=DRAFTING_ROOM)
      Stage1Form
        StageWizard
  /drafting-room/:projectId/stage1
    Stage1Form
  /drafting-room/:projectId/stage2
    Stage2Form
      StageWizard
  /drafting-room/:projectId/stage3
    Stage3Form
      StageWizard
```

Removed from chrome/navigation:

```
NewUiShell
  nav
    Drafting Room link
```

Remaining (updated):

```
Root Routes
  /life-map
    RoomLayout(room=LIFE_MAP_ROOM)
      LifeMap
  /sorting-room (if present in branch)
    RoomLayout(room=SORTING_ROOM)
      SortingRoom
  /projects/:projectId
    ProjectDetailPage
  /drafting-room/*
    Navigate -> /life-map (legacy redirect only)

ProjectDetailPage
  ProjectHeader
    lifecycle badge (non-interactive)

LifeMap
  CategoryCard
    planning/backlog counts (non-Drafting navigation)
```

## 5. PR Breakdown

Single PR success criteria:

1. Drafting routes/components are removed and no app navigation points to Drafting Room.
2. Legacy `/drafting-room/*` URLs redirect to `/life-map` without runtime errors.
3. `DRAFTING_ROOM` room definition and Drafting-stage navigation code paths are removed.
4. Planning lifecycle data remains intact and visible where applicable (read-only).
5. Build succeeds and test suite passes with updated/removal-aware specs.

## 6. Test Plan

Unit tests:

- Update `packages/web/src/hooks/useChorusNavigation.test.tsx`:
  - `project:` links for planning projects no longer navigate to Drafting stage URLs.
  - Drafting-stage path handling is removed (or explicitly ignored without navigation).
- Update `packages/web/src/components/project-room/ProjectHeader.test.tsx`:
  - planning lifecycle badge is rendered as non-clickable text, not a Drafting route button.

E2E Playwright:

- Add/update redirect coverage:
  - `/drafting-room`
  - `/drafting-room/new`
  - `/drafting-room/:id/stage2`
  - all should resolve to `/life-map` with `storeId` preserved.
- Update auth and header specs to use `/life-map` as protected destination (`auth-integration`, `auth-flow-comprehensive`, `user-dropdown`, `feedback-button`, `smoke`, `test-utils`).
- Remove `drafting-room-back-button.spec.ts`.
- Convert Drafting-creation-dependent scenarios in `workflow.spec.ts` and `life-map-placement.spec.ts` to `fixme` (linked to #709) or replacement non-creation assertions so CI remains green.

Storybook:

- No new presenter components in this issue.
- No new stories required.

## 7. Risks and Mitigations

| Risk                                                             | Impact                                         | Mitigation                                                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Hidden Drafting imports/routes remain after file deletion        | Build/runtime failures from unresolved imports | Run repo-wide `rg` checks for `drafting-room`, `projectStage1/2/3`, `generateRoute.draftingRoom`, `DRAFTING_ROOM` before merge. |
| Legacy bookmarks or auth redirect targets break                  | Users hit invalid routes                       | Keep explicit `/drafting-room/* -> /life-map` redirect route.                                                                   |
| Users cannot create new projects after removal (intentional gap) | Perceived regression in workflow capability    | Update empty-state/copy to clearly indicate temporary removal and track rebuild in #709.                                        |
| Agent/chat guidance still points to Drafting Room                | Navigation advice becomes incorrect            | Update `packages/shared/src/rooms.ts` prompts and CHORUS guidance in same PR.                                                   |
| E2E suite instability due removed creation flow                  | CI failures or broad test deletions            | Retarget generic tests to Life Map + redirects; mark creation-dependent flows `fixme` with explicit follow-up issue reference.  |

## 8. What's Out of Scope

- Rebuilding project creation in Workshop (`#709`).
- Removing the Sorting Room (`#700`).
- Removing the Table (`#699`).
- Changing/removing lifecycle/planning data model semantics (stages, statuses, stream classification).
- Introducing a new replacement project-creation UI in this PR.
