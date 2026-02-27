# Plan: Workshop overlay with coming soon sign (#709)

## 1. Architecture Decisions

### Decision: Implement Workshop as route-driven overlay content at `/workshop` on top of the map shell

Options considered: keep Workshop as a standalone full-page route; open Workshop via local modal state; use #705 building-overlay route pattern.  
Chosen approach: use the #705 overlay route pattern and mount Workshop content inside the shared `BuildingOverlay` frame.  
Why: meets URL-addressable overlay, deep-link, back-button, and Escape-close requirements while keeping map context mounted.  
State boundaries: overlay open/close is URL state; map/camera state remains in the map shell from #704/#705.

### Decision: Add a dedicated `WORKSHOP_ROOM` for Marvin with a temporary generic project-helper prompt

Options considered: reuse `DRAFTING_ROOM` room definition and full drafting prompt; add Workshop-specific room definition with an explicit placeholder prompt.  
Chosen approach: add `WORKSHOP_ROOM` in shared room definitions and wire it to Marvin.  
Why: finish line requires Marvin chat to be functional in Workshop now, while making it easy to replace prompt/interior after P1 prototype decisions.  
State boundaries: no new schema/events; only static room configuration changes in `packages/shared/src/rooms.ts`.

### Decision: Auto-select Marvin from centralized attendant route logic when Workshop opens

Options considered: set attendant selection inside Workshop component; add `/workshop` to the global route-aware attendant selector (from #707).  
Chosen approach: extend attendant provider route matching so `/workshop` deterministically selects Marvin.  
Why: keeps one authoritative selection path and ensures consistent behavior for map click and direct URL entry.  
State boundaries: attendant selection remains controller UI state; chat/conversation provisioning stays in existing room chat hooks.

### Decision: Use a warm, explicit “Coming soon” placeholder interior (not a blank/error state)

Options considered: plain text stub; generic empty card; themed placeholder sign inside Workshop surface.  
Chosen approach: implement a simple themed placeholder panel/sign within Workshop content.  
Why: satisfies release intent (“under construction” while preserving sanctuary/map-first visual language) and keeps scope tight.

## 2. File Changes

| Action | File                                                                                        | Description                                                                                                                         |
| ------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| create | `packages/web/src/components/workshop/Workshop.tsx`                                         | New Workshop overlay content component: placeholder “Coming soon” sign + minimal contextual copy, rendered inside map overlay flow. |
| create | `packages/web/src/components/workshop/Workshop.test.tsx`                                    | Unit/integration tests for Workshop placeholder rendering and chat/room wiring assumptions (room ID, base content).                 |
| create | `packages/web/src/components/workshop/Workshop.stories.tsx`                                 | Storybook story for Workshop placeholder using real LiveStore-seeded setup per `packages/web/AGENTS.md`.                            |
| modify | `packages/web/src/Root.tsx`                                                                 | Wire `/workshop` route to render Workshop content through #705 building-overlay route composition (map remains mounted).            |
| modify | `packages/web/src/constants/routes.ts`                                                      | Ensure `ROUTES.WORKSHOP` and `generateRoute.workshop()` are present and used by map/building navigation paths.                      |
| modify | `packages/shared/src/rooms.ts`                                                              | Add/export `WORKSHOP_ROOM` (Marvin worker + temporary generic helper prompt) and include it in `getRoomDefinitionByRoomId`.         |
| modify | `packages/shared/tests/rooms.test.ts`                                                       | Add deterministic assertions for `WORKSHOP_ROOM` metadata and Marvin worker identity.                                               |
| modify | `packages/web/src/components/layout/AttendantRailProvider.tsx` _(from #707)_                | Extend route auto-selection effect: pathname `/workshop` => Marvin selected/open.                                                   |
| modify | `packages/web/src/components/hex-map/HexGrid.tsx` _(from #704/#705 if needed)_              | Confirm Workshop landmark click action routes to `generateRoute.workshop()` when Workshop building is selected.                     |
| modify | `packages/web/e2e/life-map-room-chat.spec.ts` _(or add focused `workshop-overlay.spec.ts`)_ | Add critical flow coverage for Workshop open, placeholder visible, Marvin selected, and chat usability.                             |

## 3. Data Model Changes

No LiveStore schema/event/query changes are planned.

- Reuse existing chat provisioning and message events (`workerCreatedV2`, `conversationCreatedV2`, `chatMessageSent`).
- Add only static room configuration (`WORKSHOP_ROOM`) in shared room definitions.
- No migrations/backfills.

## 4. Component Hierarchy

Target route layering (post-#705):

```text
Map route shell (always mounted)
  RoomLayout(LIFE_MAP_ROOM)
    NewUiShell
      LifeMap / HexMap (includes fixed buildings)
      when pathname === /workshop:
        BuildingOverlay
          Workshop
            ComingSoonSign
```

Attendant behavior (post-#707):

```text
AttendantRailProvider route effect
  /workshop -> activeAttendant = marvin
  attendant panel uses WORKSHOP_ROOM chat plumbing
```

## 5. PR Breakdown

Single PR (after #705 is merged; assumes #707 attendant provider exists or lands first) success criteria:

1. Clicking the Workshop building navigates to `/workshop` and opens the overlay frame over the map.
2. Workshop overlay shows a clear “Coming soon” drafting-under-construction placeholder.
3. Marvin is auto-selected in the Attendant Rail when Workshop is opened (map click or direct URL).
4. Marvin chat is functional in Workshop with the temporary generic project-helper prompt.
5. Overlay behavior remains standard (close button/Escape/back handled by #705 frame behavior).
6. Web build, lint, unit/integration, and E2E suites pass.

## 6. Test Plan

Unit/integration:

- `Workshop.test.tsx`
  - renders placeholder sign/copy in Workshop overlay content.
  - verifies Workshop uses expected room wiring contract (Workshop room identity).
- `AttendantRailProvider` route test update
  - entering `/workshop` selects Marvin.
  - manual close/switch still behaves consistently after auto-selection.
- Routing integration test (existing route test surface or new focused test)
  - direct navigation to `/workshop` renders map + overlay composition.

Storybook:

- `Workshop.stories.tsx` showing default placeholder state with seeded LiveStore events.

E2E (Playwright):

- open Workshop from map building and assert URL `/workshop`.
- verify placeholder content is visible inside overlay.
- verify Marvin attendant is selected and panel/chat is usable.
- verify close via Escape/back returns to map-only state.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                               | Impact                                          | Mitigation                                                                                                                        |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| #705/#707 landed code differs from planned file names/APIs                         | Rework and merge friction                       | Rebase on merged dependencies first; map plan steps to actual landed component names before coding.                               |
| Workshop route exists but building click handler is not wired in final #705 branch | Finish-line regression (map click does nothing) | Add explicit integration/E2E assertion for map-click -> `/workshop`; patch click wiring in the map/landmark component if missing. |
| Marvin auto-selection conflicts with other route-driven attendant rules            | Wrong attendant selected or panel flicker       | Keep `/workshop` rule in a single deterministic matcher with precedence tests.                                                    |
| Placeholder styling appears as error/empty state                                   | UX mismatch with sanctuary tone                 | Add a lightweight themed sign/card and Storybook visual review before merge.                                                      |
| Temporary Workshop prompt drifts from eventual P1 direction                        | Follow-up churn                                 | Mark prompt as temporary in code comments and keep prompt isolated to `WORKSHOP_ROOM` for easy replacement.                       |

## 8. What's Out of Scope

- Actual Workshop drafting flow (Unburdening/P1 interior behavior).
- Project sketch management or creation wizard replacement details.
- Placement flow from Workshop output back onto the map.
- Broader Drafting Room deprecation/removal work not required for this placeholder story.
