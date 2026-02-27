# Plan: Sanctuary overlay shell (#710)

## 1. Architecture Decisions

### Decision: Implement Sanctuary as route-driven overlay content at `/sanctuary` using the shared building frame from #705

Options considered: create Sanctuary as a standalone page; open Sanctuary with local modal state; mount Sanctuary content inside the reusable `BuildingOverlay` route frame.  
Chosen approach: use the #705 overlay route pattern and render Sanctuary inside the shared frame/chrome.  
Why: preserves map context, supports deep linking, and satisfies back-button/Escape close behavior with one canonical overlay pattern.  
State boundaries: pathname controls overlay open/close; map state remains in the map shell.

### Decision: Add a dedicated `SANCTUARY_ROOM` for Jarvis and reuse existing room-chat provisioning

Options considered: reuse `LIFE_MAP_ROOM` (Mesa prompt) while in Sanctuary; create Sanctuary-specific static room definition.  
Chosen approach: add `SANCTUARY_ROOM` in `packages/shared/src/rooms.ts` with a temporary Jarvis sanctuary prompt, then wire Sanctuary UI/chat to that room.  
Why: finish line requires functional Jarvis chat in Sanctuary now, while keeping future charter flow prompt changes isolated to one room definition.  
State boundaries: no schema/event/query changes; only static room configuration and route wiring.

### Decision: Auto-select Jarvis via centralized route-aware attendant logic (not inside Sanctuary component)

Options considered: select Jarvis inside Sanctuary component mount effect; extend the global attendant route matcher from #707.  
Chosen approach: add `/sanctuary` route matching to the centralized attendant controller/provider so Jarvis is selected deterministically.  
Why: one source of truth avoids selection flicker and keeps behavior consistent for both map clicks and direct URL entry.  
State boundaries: attendant selection stays UI controller state; room chat lifecycle remains in existing hooks.

### Decision: Ship a warm Sanctuary placeholder interior, not an empty stub

Options considered: plain "coming soon" text; generic empty card; Sanctuary-specific placeholder that frames charter/visioning intent.  
Chosen approach: render a clear Sanctuary placeholder with Builder/Jarvis framing and explicit "charter experience coming soon" messaging.  
Why: meets scope (shell only) while avoiding a broken/blank first impression.

## 2. File Changes

| Action | File                                                                                       | Description                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| create | `packages/web/src/components/sanctuary/SanctuaryOverlay.tsx`                               | Sanctuary overlay content component with placeholder charter/visioning copy and room wiring expectations for Jarvis chat. |
| create | `packages/web/src/components/sanctuary/SanctuaryOverlay.test.tsx`                          | Component tests for placeholder rendering and Sanctuary room binding assumptions.                                         |
| create | `packages/web/src/components/sanctuary/SanctuaryOverlay.stories.tsx`                       | Storybook story for Sanctuary overlay state (using real LiveStore-seeded setup conventions).                              |
| modify | `packages/web/src/constants/routes.ts`                                                     | Add `ROUTES.SANCTUARY` and `generateRoute.sanctuary()` if not already present from #705.                                  |
| modify | `packages/web/src/Root.tsx`                                                                | Wire `/sanctuary` route to render `SanctuaryOverlay` inside the standard building overlay frame (from #705).              |
| modify | `packages/shared/src/rooms.ts`                                                             | Add/export `SANCTUARY_ROOM` with Jarvis worker prompt; register in `getRoomDefinitionByRoomId()`.                         |
| modify | `packages/shared/tests/rooms.test.ts`                                                      | Add deterministic assertions for `SANCTUARY_ROOM` identity, worker name, and lookup behavior.                             |
| modify | `packages/web/src/components/layout/AttendantRailProvider.tsx` _(from #707)_               | Extend route auto-selection rules: pathname `/sanctuary` selects Jarvis.                                                  |
| modify | `packages/web/src/components/hex-map/HexGrid.tsx` _(or map landmark click path from #705)_ | Verify Sanctuary landmark click navigates to `generateRoute.sanctuary()`; patch if wiring is missing.                     |
| modify | `packages/web/e2e/life-map-room-chat.spec.ts` _(or add `sanctuary-overlay.spec.ts`)_       | Add critical flow coverage for map-click open, `/sanctuary` URL, Jarvis selected, and chat send/receive usability.        |

## 3. Data Model Changes

No LiveStore schema, event, or query migrations are planned.

- Add static room metadata only (`SANCTUARY_ROOM` in shared room definitions).
- Reuse existing chat provisioning events and queries.
- No backfill/migration required.

## 4. Component Hierarchy

Target route layering (post-#705):

```text
Map route shell (always mounted)
  RoomLayout(LIFE_MAP_ROOM) or map shell equivalent from #705
    LifeMap / HexMap
    when pathname === /sanctuary:
      BuildingOverlay
        SanctuaryOverlay
          SanctuaryPlaceholder
```

Attendant + chat behavior (post-#707):

```text
AttendantRailProvider route effect
  /sanctuary -> activeAttendant = jarvis
  attendant chat panel -> SANCTUARY_ROOM (Jarvis worker)
```

## 5. PR Breakdown

Single PR (after #705 is merged; assumes #707 attendant rail provider contract is available):

1. Sanctuary building click from map navigates to `/sanctuary` and opens the shared overlay frame.
2. Sanctuary overlay shows explicit placeholder content for charter/visioning (shell only).
3. Jarvis is auto-selected in the Attendant Rail when entering Sanctuary (map click and direct URL).
4. Jarvis chat is functional in Sanctuary using a temporary generic welcoming/coaching prompt.
5. Overlay close semantics remain standard (close button, Escape, browser back via #705 frame behavior).
6. Build and quality gates pass.

## 6. Test Plan

Unit/integration:

- `SanctuaryOverlay.test.tsx`
  - renders Sanctuary placeholder title/body copy.
  - verifies Sanctuary uses expected room identity/wiring contract.
- `AttendantRailProvider` route-selection test updates
  - entering `/sanctuary` selects Jarvis.
  - manual attendant switching still works after route-based auto-selection.
- `packages/shared/tests/rooms.test.ts`
  - `SANCTUARY_ROOM` is exported and resolves via `getRoomDefinitionByRoomId('sanctuary')`.
- Route integration test (existing routing suite)
  - direct navigation to `/sanctuary` renders map + overlay composition.

Storybook:

- `SanctuaryOverlay.stories.tsx` for baseline shell state and visual review.

E2E (Playwright):

- click Sanctuary building on the map and assert URL `/sanctuary`.
- verify Sanctuary placeholder content appears in overlay.
- verify Jarvis avatar is active in attendant rail and chat panel is usable.
- send a user message in Jarvis chat and assert message appears.
- verify Escape/back closes overlay and returns to map-only state.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                      | Impact                                         | Mitigation                                                                                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| #705/#707 landed APIs differ from expected names/locations                | Integration churn and rework                   | Rebase on merged dependency branches first; map plan steps to actual component/file names before coding.    |
| Sanctuary click route wiring missing in final map landmark implementation | Finish-line miss (building click does nothing) | Add explicit integration/E2E assertion for map click -> `/sanctuary`; patch landmark click path if missing. |
| Route-based Jarvis auto-selection conflicts with other attendant defaults | Wrong attendant active or selection flicker    | Keep `/sanctuary` rule in one deterministic matcher with precedence tests.                                  |
| Temporary Jarvis prompt tone drifts from Sanctuary intent                 | UX mismatch for first-run Sanctuary shell      | Keep prompt isolated in `SANCTUARY_ROOM` and align copy with Builder/Jarvis naming standard.                |
| Placeholder appears as error/empty state                                  | Perceived feature breakage                     | Use explicit warm placeholder framing and validate in Storybook and E2E assertions.                         |

## 8. What's Out of Scope

- Full charter writing/editing UX and document model.
- Visioning conversation flow scripting beyond a generic temporary prompt.
- New charter-related events/schema/materializers/queries.
- Additional attendants or non-Jarvis sanctuary automation behavior.
