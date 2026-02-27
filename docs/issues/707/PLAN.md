# Plan: Attendant Rail with attendant avatars (#707)

## 1. Architecture Decisions

### Decision: Move chat selection/open state from room-scoped layout state to a global attendant controller

Options considered: (1) keep `RoomLayout` room-scoped chat toggle/panel and add a separate rail UI wrapper, (2) create a single attendant controller above route-level and make the rail the only chat entrypoint.  
Chosen approach: option 2.  
Why: the story requires one global rail, one open panel at a time, and attendant access across map and overlay contexts.  
State boundaries: controller owns `activeAttendantId` (`jarvis` | `marvin` | `null`) and toggle logic; shell components only render UI from controller state.

### Decision: Reuse existing room-chat plumbing (`useRoomChat` + `RoomChatPanel`) with attendant-specific static room definitions

Options considered: (1) build a new chat data flow for attendants, (2) reuse existing worker/conversation provisioning by adding attendant room definitions in shared config.  
Chosen approach: option 2.  
Why: chat backend wiring is out of scope; existing provisioning and message flow already work.  
State boundaries: add `JARVIS_ATTENDANT_ROOM` and `MARVIN_ATTENDANT_ROOM` config in `packages/shared/src/rooms.ts`; no schema/event/query changes.

### Decision: Make the rail authoritative and remove header bubble/right-side room panel behavior

Options considered: (1) run old room chat and new rail in parallel, (2) replace current `onChatToggle` + fixed right panel with rail/panel behavior.  
Chosen approach: option 2.  
Why: avoids duplicate chat surfaces and enforces “only one chat panel can be open at a time.”  
State boundaries: `NewUiShell` renders rail/panel; `RoomLayout` no longer manages per-room open state or right-side offset for room chat.

### Decision: Centralize auto-selection rules in one route-aware effect (dependency on #705)

Options considered: (1) route components manually open attendants, (2) provider-level location effect applies deterministic route rules.  
Chosen approach: option 2.  
Why: keeps behavior consistent and testable as overlay routing evolves in #705.  
State boundaries: on pathname transition: `/sanctuary` => open Jarvis; `/projects/:projectId` overlay route => open Marvin; manual close/toggle still allowed after auto-selection.

## 2. File Changes

| Action | File                                                         | Description                                                                                                                                                |
| ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| create | packages/web/src/components/layout/AttendantRail.tsx         | Rail UI (left vertical strip), avatar buttons (`J`, `M`), selected styling, and prop-driven notification pips.                                             |
| create | packages/web/src/components/layout/AttendantRail.test.tsx    | Unit tests for avatar rendering, toggle/switch behavior, and pip rendering.                                                                                |
| create | packages/web/src/components/layout/AttendantRail.stories.tsx | Storybook states: default, Jarvis selected, Marvin selected, pips enabled.                                                                                 |
| create | packages/web/src/components/layout/AttendantChatPanel.tsx    | Left-adjacent panel wrapper with close button; composes `RoomChatPanel` for attendant conversations.                                                       |
| create | packages/web/src/components/layout/AttendantRailProvider.tsx | Global controller for selected attendant, route auto-selection, and attendant chat instances.                                                              |
| modify | packages/web/src/components/layout/NewUiShell.tsx            | Render rail + attendant panel in shell chrome; remove header chat bubble dependency and keep shell/map content unobstructed by default rail width.         |
| modify | packages/web/src/components/layout/RoomLayout.tsx            | Remove room-scoped chat toggle/panel; keep layout/content responsibilities only; expose attendant control hook for child flows that need direct send/open. |
| modify | packages/web/src/components/drafting-room/Stage3Form.tsx     | Replace `useRoomChatControl` usage with attendant-targeted control so “Ask Marvin” always opens/sends to Marvin.                                           |
| modify | packages/web/src/Root.tsx                                    | Mount attendant provider within protected app tree so rail state persists across context changes; integrate route-trigger rules with #705 overlay routing. |
| modify | packages/web/src/constants/routes.ts                         | Ensure `SANCTUARY` route constant exists (from #705) and expose helper pattern(s) used by auto-selection matcher.                                          |
| modify | packages/shared/src/rooms.ts                                 | Add exported static attendant room definitions (Jarvis/Marvin) used by provider chat hooks.                                                                |
| modify | packages/shared/tests/rooms.test.ts                          | Add assertions for attendant room IDs, worker IDs/names, and stable scope values.                                                                          |
| modify | packages/web/src/components/layout/RoomLayout.test.tsx       | Update tests from header chat-toggle semantics to attendant rail/panel semantics.                                                                          |
| modify | packages/web/e2e/life-map-room-chat.spec.ts                  | Rework to rail behavior assertions (avatar click opens panel, same avatar closes, switching attendants works).                                             |
| modify | packages/web/e2e/workflow.spec.ts                            | Update any assumptions that rely on old room chat toggle/button so workflow remains green with rail-based chat access.                                     |

## 3. Data Model Changes

No LiveStore schema/materializer/query changes are planned.

- Events: no new event types in `packages/shared/src/livestore/events.ts`.
- Schema/materializers: no changes in `packages/shared/src/livestore/schema.ts`.
- Queries: no changes in `packages/shared/src/livestore/queries.ts`.
- Shared config only: add attendant static room definitions in `packages/shared/src/rooms.ts`.

Data notes:

- Attendant conversations are provisioned through existing `conversationCreatedV2` and `workerCreatedV2` paths.
- No migrations/backfills; existing room/project/category conversations remain untouched.

## 4. Component Hierarchy

Current (room-scoped chat):

```text
RoomLayout(room=...)
  NewUiShell
    Header chat button
    Main content
  Fixed right RoomChatPanel (room-specific)
```

Target (global attendant rail):

```text
ProtectedApp
  AttendantRailProvider (global selected attendant + chat state)
    Routes
      RoomLayout / overlay content
        NewUiShell
          AttendantRail (left strip, always visible in app contexts)
          AttendantChatPanel (left-adjacent; one at a time)
          Header + main content + table bar
```

Route-driven selection layer (provider):

```text
pathname '/sanctuary'        -> activeAttendant = 'jarvis'
pathname '/projects/:id'     -> activeAttendant = 'marvin'
avatar click same attendant  -> close panel
avatar click other attendant -> switch panel
```

## 5. PR Breakdown

Single PR (after #705 is merged) success criteria:

1. Rail appears on left edge with Jarvis and Marvin avatars across map and overlay contexts.
2. Clicking avatar opens adjacent panel; clicking same avatar or close button collapses.
3. Exactly one panel can be open at a time; switching attendants swaps panel content.
4. Notification pip rendering is prop-driven (no backend logic coupling).
5. Route auto-selection works: `/sanctuary` selects Jarvis, project overlay route selects Marvin.
6. Legacy room chat bubble/right-side panel behavior is removed or fully superseded.
7. Build, unit/integration tests, and E2E tests pass.

## 6. Test Plan

Unit/integration (Vitest + RTL):

- `AttendantRail.test.tsx`:
  - renders J/M avatars
  - toggles open/close on same avatar click
  - switches attendants when clicking the other avatar
  - renders pip indicator when prop is true
- `AttendantRailProvider`/layout integration test:
  - route `/sanctuary` auto-opens Jarvis on navigation
  - route `/projects/:projectId` auto-opens Marvin on navigation
  - manual close remains possible after auto-open
- `RoomLayout.test.tsx`:
  - remove expectations for old header chat button
  - assert attendant rail and panel integration still renders children correctly

E2E (Playwright):

- Update `life-map-room-chat.spec.ts` to validate rail behavior end-to-end.
- Add route auto-selection checks:
  - direct navigation to `/sanctuary?...` shows Jarvis selected/open
  - navigating/opening `/projects/:id?...` shows Marvin selected/open
- Verify switching avatars keeps a single visible panel.

Storybook:

- Add `AttendantRail.stories.tsx` covering default/selected/pip combinations.
- (Optional but recommended) Add `AttendantChatPanel` story for closed/open states with seeded conversation data.

Validation commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`

## 7. Risks and Mitigations

| Risk                                                                                           | Impact                                        | Mitigation                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| #705 route shape differs from assumptions (especially sanctuary/project overlays)              | Auto-selection may not fire correctly         | Implement a single route matcher utility with explicit tests for each expected path pattern; rebase after #705 before merging #707.   |
| Migration from room-scoped chat breaks existing direct-send flows (e.g., Stage 3 “Ask Marvin”) | User actions open wrong panel or fail to send | Provide attendant-targeted control API and update Stage 3 flow to explicitly open/send to Marvin; test with integration coverage.     |
| Rail/panel layering conflicts with map overlays/modals                                         | UI overlap regressions and unusable controls  | Define z-index contract (`rail/panel` below blocking modals, above map/base) and verify with visual/unit tests in overlay contexts.   |
| Introducing new attendant room config causes unintended worker/conversation duplication        | Confusing chat histories                      | Use stable deterministic room/worker IDs and keep one conversation per attendant room via existing `getConversationByRoom$` behavior. |

## 8. What's Out of Scope

- AI backend/chat-response implementation changes.
- Attendant sprite animations on the map.
- Onboarding-specific rail reveal/hide animation.
- Supporting more than two attendants.
- Structural overlay architecture work in #705 (this issue only integrates with its resulting routes).
