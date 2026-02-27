# Plan: Onboarding sequence (#713)

## 1. Architecture Decisions

### Decision: Persist onboarding progression in LiveStore (not local component state)

Options considered: (1) keep onboarding phase in React/localStorage only, (2) persist onboarding in LiveStore read model with event-sourced transitions.  
Chosen approach: option 2.  
Why: refresh must not restart onboarding, and state should survive route changes, worker restarts, and multi-tab usage.  
State boundaries: onboarding phase/milestones live in `@lifebuild/shared` schema + queries; UI renders from query state only.

### Decision: Model #713 as a deterministic 3-beat state machine with idempotent transitions

Options considered: (1) infer beat purely from UI conditions, (2) explicit phase + milestone events.  
Chosen approach: option 2.  
Why: avoids race conditions between map interactions, overlay routing, and chat auto-open behavior; enables reliable resume-after-refresh.  
State boundaries: transition events (`started`, `firstProjectCreated`, `revealCompleted`, `projectOpened`, `completed`) mutate onboarding state; view logic stays declarative.

### Decision: Use a mechanical Beat 1 project-seeding flow with Jarvis framing, not full free-form extraction

Options considered: (1) rely fully on open-ended LLM chat for project/task creation, (2) guided mechanical capture (name/description) wrapped in Jarvis UX, then deterministic sample-task seeding.  
Chosen approach: option 2.  
Why: issue scope is explicitly mechanical and requires predictable completion criteria (project + sample tasks) to unlock Beat 2.  
State boundaries: Beat 1 capture UI creates project/tasks via existing events; Jarvis chat/prompt tone is presentation, not transition authority.

### Decision: Drive reveal effects from phase-gated map layers instead of mutating core map data model

Options considered: (1) special-case map data writes for fog/reveal, (2) overlay/layer composition keyed off onboarding phase.  
Chosen approach: option 2.  
Why: keeps map data canonical (projects/hex positions) and makes Beat 1/2 visuals reversible, testable, and isolated.  
State boundaries: fog-of-war, dawn lighting, and landmark/sprite placement are UI layers in web; only project/task creation touches shared data.

### Decision: Integrate with post-#707/#708/#709/#710 shell and overlay architecture via onboarding UI policy

Options considered: (1) branch custom onboarding pages, (2) keep normal map/overlay stack and gate visibility/behavior through onboarding policy.  
Chosen approach: option 2.  
Why: onboarding must teach real interactions (building click, Attendant Rail, project overlay), not a separate tutorial surface.  
State boundaries: onboarding policy controls Attendant Rail/Task Queue visibility, Marvin pip, and first-time Marvin auto-open; existing overlay routing stays URL-driven.

### Decision: Treat existing workspaces as already onboarded

Options considered: (1) force onboarding for all users with no onboarding row, (2) bootstrap complete state for workspaces that already have project/map activity.  
Chosen approach: option 2.  
Why: avoids regressing existing users into first-time onboarding after deploy.  
State boundaries: first-run bootstrap check reads existing projects/hex positions and writes initial onboarding state once.

## 2. File Changes

| Action | File                                                                                 | Description                                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | packages/shared/src/livestore/events.ts                                              | Add onboarding events for phase lifecycle (`onboarding.started`, `onboarding.first_project_created`, `onboarding.reveal_completed`, `onboarding.project_opened`, `onboarding.completed`). |
| modify | packages/shared/src/livestore/schema.ts                                              | Add `onboardingState` table + materializers; export `OnboardingState` type in schema exports.                                                                                             |
| modify | packages/shared/src/livestore/queries.ts                                             | Add `getOnboardingState$` and helper selectors used by web onboarding gates.                                                                                                              |
| create | packages/shared/src/livestore/**tests**/onboarding-materializers.test.ts             | Verify event replay yields correct phase progression and idempotent resume behavior.                                                                                                      |
| create | packages/web/src/components/onboarding/OnboardingProvider.tsx                        | Central onboarding controller hook/provider: bootstrap, transition helpers, and UI policy flags.                                                                                          |
| create | packages/web/src/components/onboarding/useOnboarding.ts                              | Typed consumer hook exposing phase, first project id, and transition actions.                                                                                                             |
| create | packages/web/src/components/onboarding/CampfireBeat.tsx                              | Beat 1 panel/surface with Jarvis-guided name/description capture and project+sample-task creation.                                                                                        |
| create | packages/web/src/components/onboarding/FogOfWarOverlay.tsx                           | Beat 1/2 fog layer and fade-out reveal effect.                                                                                                                                            |
| create | packages/web/src/components/onboarding/DawnRevealOverlay.tsx                         | Sunrise/dawn transition overlay used when Beat 2 starts.                                                                                                                                  |
| create | packages/web/src/components/onboarding/OnboardingLandmarksLayer.tsx                  | Campfire/sanctuary/workshop + Jarvis/Marvin sprite placements and teleport transitions by phase.                                                                                          |
| create | packages/web/src/components/onboarding/OnboardingGuideBanner.tsx                     | Beat 3 directional prompt (“click your project building”) tied to Marvin pip state.                                                                                                       |
| modify | packages/web/src/components/life-map/LifeMap.tsx                                     | Mount onboarding overlays, beat-specific guidance, and phase-aware map interaction gating.                                                                                                |
| modify | packages/web/src/components/hex-map/HexMap.tsx                                       | Accept onboarding visual/interactivity props (fog enabled, limited interaction in Beat 1, reveal callbacks).                                                                              |
| modify | packages/web/src/components/hex-map/HexGrid.tsx                                      | Support rendering fixed onboarding landmark tiles/sprites alongside project tiles.                                                                                                        |
| modify | packages/web/src/components/hex-map/CameraRig.tsx                                    | Add optional onboarding camera targets for campfire focus and reveal transition.                                                                                                          |
| modify | packages/web/src/components/layout/NewUiShell.tsx                                    | Consume onboarding UI policy to hide/show Attendant Rail and Task Queue at the required beats.                                                                                            |
| modify | packages/web/src/components/layout/AttendantRailProvider.tsx (from #707)             | Add onboarding overrides: hidden in Beat 1, fade-in in Beat 2, Marvin pip + first-open bookkeeping in Beat 3.                                                                             |
| modify | packages/web/src/components/projects/ProjectDetailPage.tsx or overlay host from #708 | Emit onboarding `project_opened` and completion triggers when first project overlay opens/closes.                                                                                         |
| modify | packages/web/src/Root.tsx                                                            | Mount `OnboardingProvider` in the protected app tree so onboarding state is available across map and overlays.                                                                            |
| create | packages/web/src/components/onboarding/\*.stories.tsx                                | Storybook stories for Beat 1/2/3 visual states seeded via real LiveStore events.                                                                                                          |
| create | packages/web/e2e/onboarding-sequence.spec.ts                                         | End-to-end 3-beat flow including refresh-resume checks and first-time-only Marvin auto-open assertion.                                                                                    |

## 3. Data Model Changes

New onboarding read model (shared):

- `onboardingState` (singleton row):
  - `id` (`'singleton-onboarding-state'`)
  - `phase` (`'not_started' | 'beat1_campfire' | 'beat2_reveal' | 'beat3_first_project' | 'complete'`)
  - `firstProjectId` (`string | null`)
  - `marvinAutoOpenedAt` (`Date | null`)
  - `projectOpenedAt` (`Date | null`)
  - `startedAt` (`Date`)
  - `updatedAt` (`Date`)
  - `completedAt` (`Date | null`)

New events:

- `onboarding.started`
- `onboarding.first_project_created`
- `onboarding.reveal_completed`
- `onboarding.project_opened`
- `onboarding.completed`

Materializer behavior:

- Events upsert the singleton row and only move phase forward (no backward transitions).
- `onboarding.completed` marks `completedAt` and locks out onboarding UI.
- Bootstrap path marks existing active workspaces as `complete` to prevent unintended onboarding replay.

Queries:

- `getOnboardingState$` (single-row query used by provider/gates).
- Optional derived helper in web hook for `isActive`, `isBeat1`, `isBeat2`, `isBeat3`, `isComplete`.

No migration/backfill scripts are required; replay + bootstrap event on first app load handles initialization.

## 4. Component Hierarchy

Target composition (post-#707/#708/#709/#710):

```text
ProtectedApp
  OnboardingProvider
    AttendantRailProvider (#707)
      RoomLayout / NewUiShell
        LifeMap
          HexMap
            CameraRig (phase-aware target)
            HexGrid
            OnboardingLandmarksLayer
            FogOfWarOverlay (Beat 1/2)
            DawnRevealOverlay (Beat 2 transition)
          CampfireBeat (Beat 1 only)
          OnboardingGuideBanner (Beat 3 only)
        Building overlays (#708/#709/#710)
          Project overlay (/projects/:id)
            Onboarding completion hook (first project open/close)
```

Transition flow:

```text
New workspace open
  -> onboarding.started (Beat 1)
  -> user submits first project in CampfireBeat
  -> onboarding.first_project_created (Beat 2)
  -> reveal animation done
  -> onboarding.reveal_completed (Beat 3)
  -> user opens first project building
  -> onboarding.project_opened (+ Marvin auto-open once)
  -> user closes overlay
  -> onboarding.completed
```

## 5. PR Breakdown

1. Shared onboarding state foundation
   - Add events/schema/materializers/queries.
   - Add shared tests for replay and forward-only transitions.
   - Add bootstrap guard for existing workspaces.

2. Beat 1 campfire flow
   - Add `OnboardingProvider`, `CampfireBeat`, and Beat 1 map gating.
   - Implement deterministic first-project + sample-task creation.
   - Persist `firstProjectId` and verify refresh resumes Beat 1 safely.

3. Beat 2 reveal + shell gating
   - Add fog/dawn/landmark layers and camera transition.
   - Hide rail/task queue in Beat 1, fade rail in Beat 2, set Marvin pip.
   - Verify reveal remains stable across refresh mid-transition.

4. Beat 3 first-project guidance + completion
   - Wire project-building open signal and first-time Marvin auto-open.
   - Allow task add/edit loop in overlay and finalize onboarding on close.
   - Add full E2E path and regression checks.

## 6. Test Plan

Unit and integration:

- `packages/shared/src/livestore/__tests__/onboarding-materializers.test.ts`
  - phase advances in correct order
  - duplicate events are idempotent
  - completed state is stable across replay
- `packages/web/src/components/onboarding/OnboardingProvider.test.tsx`
  - bootstrap logic (new vs existing workspace)
  - UI policy flags per phase
- `CampfireBeat.test.tsx`
  - requires name + description
  - commits project + sample tasks
  - emits `onboarding.first_project_created`
- `LifeMap/HexMap` onboarding tests
  - fog visible in Beat 1, reveal transition in Beat 2, guide banner in Beat 3
  - map click gating behavior by phase
- `AttendantRailProvider` onboarding tests (post-#707)
  - hidden Beat 1, visible Beat 2+, Marvin pip in Beat 3
  - Marvin chat auto-opens only once

E2E (`packages/web/e2e/onboarding-sequence.spec.ts`):

- New workspace enters Beat 1 with fog + campfire flow.
- Completing campfire creates project + sample tasks.
- Beat 2 reveal runs; rail appears with Marvin pip.
- User clicks first project building; overlay opens with seeded tasks.
- Marvin chat auto-opens first time only.
- Close overlay marks onboarding complete.
- Refresh during each beat resumes current phase instead of restarting.

Storybook:

- Beat 1 (fog + campfire)
- Beat 2 (dawn reveal)
- Beat 3 (project guidance + rail visible)

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                                | Impact                                 | Mitigation                                                                                                                                          |
| ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Post-blocker file/architecture drift (#707/#708/#709/#710)                          | Rebase churn and integration conflicts | Implement #713 on top of branch where blockers are merged; keep onboarding integration behind `OnboardingProvider` adapter to reduce surface area.  |
| Requirement tension around Day 1 visibility rules (rail/table vs issue finish line) | Conflicting behavior expectations      | Treat issue finish line as implementation contract for #713; document explicit UI policy in PR notes and align product copy/tests to that contract. |
| Reveal visuals degrade map interaction/perf on lower-end devices                    | Jank during Beat 2 transition          | Keep overlays CSS/Three-lightweight, cap transition duration, and provide deterministic fallback state after timeout.                               |
| Existing users accidentally enter onboarding after deploy                           | Severe UX regression                   | Bootstrap to `complete` when workspace already has map/project activity; add integration test for this path.                                        |
| Non-deterministic project seeding from LLM chat                                     | Flaky onboarding completion            | Keep Beat 1 creation mechanical and deterministic; use Jarvis framing text but not LLM-dependent transition criteria.                               |

## 8. What's Out of Scope

- Beat 4 (Unburdening) and Beat 5 (Visioning).
- Smooth walking animations for attendants/sprites (teleport transitions only).
- Sound effects/music.
- Skip/fast-forward onboarding controls.
- Full campfire MI posture prompt prototyping and six-field scorecard extraction.
- Broad redesign of non-onboarding room navigation unrelated to the three beats.
