# Plan: Workshop first visit: Marvin greets and guides Unburdening (#719)

## 1. Architecture Decisions

### Decision: Implement #719 on top of the #709 Workshop overlay and existing room-chat pipeline

Options considered: (1) build a one-off Workshop conversation stack outside room chat, (2) repurpose legacy `DraftingRoom` stage UI for first-visit flow, (3) extend the #709 Workshop overlay with `RoomLayout`/Marvin room chat plus first-visit orchestration logic.  
Chosen approach: option 3.  
Why: preserves the current room-based AI architecture, keeps all AI turns in the existing event pipeline, and avoids short-lived bespoke infrastructure.  
State boundaries: Workshop overlay component controls first-visit orchestration/UI; room worker prompt lives in `packages/shared/src/rooms.ts`; server keeps processing via `EventProcessor` + Pi tools.

### Decision: Trigger Marvin-first behavior via an internal bootstrap user turn (hidden in transcript)

Options considered: (1) hardcode Marvin greeting text in UI, (2) add a new backend endpoint/event for “start conversation”, (3) send one hidden bootstrap chat message through normal `chatMessageSent` flow and let backend generate Marvin’s first visible reply.  
Chosen approach: option 3.  
Why: meets “Marvin initiates” and “round-trip through AI backend” without adding a new transport path. Bootstrap content can carry first-visit context (including sanctuary-visited state).  
State boundaries: Workshop UI emits bootstrap once; room chat renderer hides internal bootstrap messages; EventProcessor remains the single backend execution path.

### Decision: Persist one-time and sanctuary-visit state via existing settings infrastructure

Options considered: (1) add new LiveStore event/table for workshop journey state, (2) use localStorage-only flags, (3) store lifecycle flags in `settings` via existing `v1.SettingUpdated`.  
Chosen approach: option 3.  
Why: no schema migration required, state is synchronized with workspace data (unlike localStorage), and implementation remains small for shim scope.  
State boundaries: keys read/written in web (`getSettingByKey$`, `events.settingUpdated`); shared exposes typed key constants.

### Decision: Use a Workshop-specific Marvin shim prompt focused on Stage 1 sketch capture only

Options considered: (1) reuse current Drafting Room prompt unchanged, (2) build a final scripted Unburdening flow now, (3) introduce an interim Workshop prompt explicitly marked for replacement after P7.  
Chosen approach: option 3.  
Why: issue explicitly requests a shim; prompt must bias toward rapid multi-project capture (`create_project`) and avoid deep stage progression.  
State boundaries: prompt + worker identity defined in shared room definitions; backend system prompt assembly remains unchanged.

### Decision: Represent sketches as existing unplaced projects and render them in Workshop overlay

Options considered: (1) add a new “sketch” primitive/table, (2) render only chat transcript and rely on map for visibility, (3) render a Workshop-local list/card view from existing unplaced project query.  
Chosen approach: option 3.  
Why: aligns with existing model (Stage 1 projects) and placement flow; no new primitive required.  
State boundaries: Workshop UI queries unplaced projects; map placement remains owned by existing hex placement flow.

### Decision: Enable category capture at creation time by extending `create_project` tool schema

Options considered: (1) rely on a follow-up `update_project` call for category, (2) skip category in shim, (3) add optional `category` to `create_project` tool schema (already supported by tool implementation).  
Chosen approach: option 3.  
Why: improves model reliability for Stage 1 completeness and reduces extra tool calls.  
State boundaries: server tool schema describes API contract; existing project tool implementation remains the executor.

## 2. File Changes

| Action | File                                                                          | Description                                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| modify | packages/shared/src/rooms.ts                                                  | Add/adjust `WORKSHOP_ROOM` (from #709) to use a dedicated Marvin Unburdening shim prompt, explicitly marked `// SHIM: replace after P7 prototype`; ensure room lookup returns Workshop definition by roomId. |
| modify | packages/shared/tests/rooms.test.ts                                           | Add deterministic assertions for Workshop room identity/prompt wiring (roomId, worker id/name, prompt presence, shim marker).                                                                                |
| modify | packages/shared/src/settings.ts                                               | Add typed settings keys for Workshop Unburdening completion and Sanctuary first-visit tracking.                                                                                                              |
| modify | packages/web/src/components/workshop/Workshop.tsx                             | Replace “coming soon” behavior with first-visit orchestrator: detect one-time state, open chat, send hidden bootstrap turn, render sketch list/card view using unplaced projects.                            |
| add    | packages/web/src/components/workshop/useWorkshopUnburdening.ts                | Encapsulate bootstrap eligibility logic, settings read/write, and bootstrap payload construction (including sanctuary-visited signal).                                                                       |
| modify | packages/web/src/components/workshop/Workshop.stories.tsx                     | Update/add stories covering first-visit (bootstrap pending), post-unburdening view, and populated sketch list using real LiveStore events.                                                                   |
| modify | packages/web/src/components/room-chat/RoomChatMessageList.tsx                 | Filter internal bootstrap messages from visible transcript while preserving normal user/assistant messages.                                                                                                  |
| modify | packages/web/src/components/room-chat/RoomChatMessageList.test.tsx            | Add tests proving hidden internal bootstrap messages do not render and normal chat still renders.                                                                                                            |
| modify | packages/web/src/hooks/useNavigationContext.ts                                | Add Workshop/Sanctuary route context descriptions (`/workshop`, `/sanctuary`) so Marvin prompt context remains route-aware post-#709.                                                                        |
| modify | packages/web/src/components/sanctuary/Sanctuary.tsx (or #705 equivalent path) | On first sanctuary entry, persist “sanctuary visited” setting used by Workshop bootstrap conditioning.                                                                                                       |
| modify | packages/server/src/tools/schemas.ts                                          | Add optional `category` enum to `create_project` tool schema so Marvin can create complete Stage 1 sketches in one call.                                                                                     |
| modify | packages/server/src/tools/projects.test.ts                                    | Add/extend coverage confirming project creation with category remains successful.                                                                                                                            |
| add    | packages/web/e2e/workshop-unburdening-first-visit.spec.ts                     | E2E journey (post-#709 route): first Workshop visit triggers Marvin-first response, creates sketches, and does not retrigger on revisit.                                                                     |
| modify | packages/web/e2e/life-map-room-chat.spec.ts                                   | Keep room-chat baseline aligned with hidden bootstrap behavior and Workshop route availability after #709.                                                                                                   |

## 3. Data Model Changes

No new LiveStore tables or events are required for #719.

- Reuse existing events: `v1.ChatMessageSent`, `v2.ProjectCreated`, `v2.ProjectUpdated`, `v2.ProjectLifecycleUpdated` (as needed by tools), `v1.SettingUpdated`.
- Add settings keys (string values, ISO timestamps):
  - `journey.workshopUnburdeningCompletedAt`
  - `journey.sanctuaryVisitedAt`
- Workshop “one-time” behavior reads these keys through `getSettingByKey$`.
- No migrations/backfills required.

Notes:

- Timestamp values must remain ISO strings in settings payloads/reads.
- Sketches remain ordinary projects at Stage 1 (`status='planning'`, `stage=1`) until user places them on the map.

## 4. Component Hierarchy

Workshop route flow (post-#709):

```text
Root
  /workshop route
    RoomLayout(room=WORKSHOP_ROOM)
      Workshop
        useWorkshopUnburdening
          read settings (unburdening completed, sanctuary visited)
          open chat + send hidden bootstrap message once
          persist unburdening completed setting
        WorkshopSketchList (query unplaced projects)
        RoomChatPanel (Marvin)
```

Conversation and sketch creation:

```text
Workshop bootstrap message (hidden user turn)
  -> events.chatMessageSent
  -> EventProcessor.runAgenticLoop
  -> Marvin Workshop shim prompt
  -> create_project (+ optional update_project) tool calls
  -> v2.ProjectCreated / v2.ProjectUpdated events
  -> Workshop sketch list updates from getUnplacedProjects$
```

Lifecycle behavior:

```text
First Workshop visit + no completion flag
  => bootstrap runs (one-time)
Subsequent Workshop visits
  => bootstrap skipped
Project placed on map via existing placement flow
  => project leaves unplaced query and disappears from Workshop sketch list
```

## 5. PR Breakdown

Single PR success criteria:

1. Workshop route runs Marvin Unburdening shim prompt end-to-end through backend (no hardcoded assistant greeting).
2. First Workshop visit triggers one-time hidden bootstrap and Marvin initiates visible greeting.
3. Marvin creates project sketches from conversation using existing project tools.
4. Workshop overlay shows sketches in a simple list/card view, backed by unplaced projects.
5. Sanctuary nudge is conditionally included only when sanctuary-visited flag is absent.
6. Re-entering Workshop does not re-trigger first-visit Unburdening.
7. Lint/tests/E2E/build pass.

## 6. Test Plan

Unit/integration (web):

- `Workshop`/`useWorkshopUnburdening` tests:
  - sends bootstrap exactly once when completion key absent
  - writes completion setting after bootstrap dispatch
  - does not bootstrap when completion key exists
  - includes sanctuary-visited state in bootstrap payload
- `RoomChatMessageList` tests:
  - internal bootstrap messages are hidden
  - normal user/assistant messages still render
- `useNavigationContext` tests for `/workshop` and `/sanctuary` route descriptions.
- Sanctuary component test: first sanctuary visit commits `journey.sanctuaryVisitedAt` once.

Server/tool tests:

- `projects.test.ts`: `createProject` handles category parameter correctly.
- `schemas` alignment test (or equivalent): `create_project` schema exposes optional category enum values.

E2E (Playwright):

- `workshop-unburdening-first-visit.spec.ts`:
  - navigate to `/workshop`
  - verify Marvin speaks first after backend round-trip
  - submit multi-project input; verify multiple sketches appear in Workshop list
  - leave/re-enter Workshop; verify no second bootstrap greeting
- Update `life-map-room-chat.spec.ts` as needed for post-#709 routing/chat behavior.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                                      | Impact                       | Mitigation                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| #709/#705 final file paths differ from assumptions                                        | Rework during implementation | Treat Workshop/Sanctuary component paths as adapter points; keep orchestration logic in isolated hook for easy relocation.                       |
| Hidden bootstrap message leaks into transcript                                            | Confusing UX and trust hit   | Centralize internal-message detection and add explicit rendering tests.                                                                          |
| LLM skips tool calls or misses category on some turns                                     | Incomplete sketch capture    | Strengthen shim prompt with explicit per-project tool instructions and category requirement; extend `create_project` schema to include category. |
| One-time flag race causes duplicate bootstrap on rapid remounts                           | Duplicate greetings          | Guard bootstrap with in-memory `useRef` + persisted completion key write immediately after successful dispatch.                                  |
| Sanctuary-visited signal unavailable due integration gap                                  | Incorrect nudge behavior     | Write sanctuary setting on route mount in sanctuary component and default to conservative nudge only when key is absent.                         |
| Route naming transition (`/drafting-room` -> `/workshop`) causes navigation-context drift | Lower prompt quality/context | Add route-aware context branches and include both legacy/new route coverage during transition window.                                            |

## 8. What's Out of Scope

- Final scripted Unburdening dialogue from P7 prototype.
- Editing/refining sketches inside Workshop beyond initial capture.
- Starter template recommendations or automated task generation during Unburdening.
- Repeat/recurring Unburdening sessions.
- Broader onboarding state-machine design beyond keys needed for this one-time Workshop shim.
