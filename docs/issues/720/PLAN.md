# Plan: Sanctuary first visit: Jarvis guides Visioning and charter creation (#720)

## 1. Architecture Decisions

### Decision: Implement #720 as an extension of the #710 Sanctuary overlay + room-chat pipeline

Options considered: (1) build a bespoke Sanctuary-first-visit flow outside `RoomLayout`, (2) hardcode a one-off UI wizard for Visioning, (3) extend the #710 Sanctuary room route with first-visit orchestration layered on existing room chat.  
Chosen approach: option 3.  
Why: preserves existing worker/conversation provisioning (`useRoomAgent`, `useRoomConversation`, `useRoomChat`) and keeps AI turns on the established event-processor path.
State boundaries: Sanctuary UI controls first-visit orchestration; AI generation remains in server `EventProcessor` + Pi loop.

### Decision: Start Jarvis-first conversation via a hidden bootstrap user turn

Options considered: (1) hardcode Jarvis greeting text in UI, (2) add a new backend “conversation started” endpoint/event, (3) dispatch one internal bootstrap chat message through normal `chatMessageSent` flow and hide it from transcript rendering.  
Chosen approach: option 3.  
Why: satisfies “Jarvis initiates” and “conversation round-trips through AI backend” without introducing a second transport path.
State boundaries: bootstrap emission and one-time guards live in Sanctuary web hook/component; server continues processing only user-role chat messages.

### Decision: Persist charter using existing document + settings events, created by a dedicated server tool

Options considered: (1) add new LiveStore charter table/events, (2) re-enable generic document tools for LLM, (3) add a focused `create_charter` LLM tool that writes `DocumentCreated` + `SettingUpdated` metadata.  
Chosen approach: option 3.  
Why: avoids schema migration, keeps charter creation explicit and auditable in backend tool execution, and avoids broadly re-enabling document tool surface that is currently intentionally disabled.
State boundaries: charter content stored in existing `documents` table; “current charter” pointer/metadata stored in `settings`.

### Decision: Use charter existence as first-visit gate and render charter on all subsequent Sanctuary visits

Options considered: (1) explicit boolean first-visit-complete flag, (2) derive first-visit from existence of persisted charter reference.  
Chosen approach: option 2 (with optional completion timestamp for analytics/debugging).  
Why: simplest one-time gating model aligned with finish line behavior.
State boundaries: Sanctuary first-visit state derives from `journey.sanctuaryCharterDocumentId` setting.

### Decision: Drive Workshop nudge from visited-state signal passed in bootstrap context

Options considered: (1) always nudge to Workshop, (2) never nudge, (3) nudge only when Workshop has not been visited (derived from workshop journey key when available, with conversation-based fallback).  
Chosen approach: option 3.  
Why: matches requirement and “Guide When Helpful” principle.
State boundaries: web computes `workshopVisited` and passes it in hidden bootstrap payload; Jarvis prompt handles conditional nudge language.

### Decision: Ship a clearly marked interim Sanctuary Visioning prompt

Options considered: (1) keep generic coaching prompt unchanged, (2) implement final scripted Visioning now, (3) introduce a shim prompt that explicitly marks interim status and tool-use expectations.  
Chosen approach: option 3.  
Why: issue explicitly calls for a shim pending P8 prototype.
State boundaries: prompt lives in shared room definition; follow-up story can replace prompt without reworking mechanics.

## 2. File Changes

| Action | File                                                                               | Description                                                                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | `packages/shared/src/rooms.ts`                                                     | Update/add `SANCTUARY_ROOM` prompt to Visioning shim behavior, including explicit interim marker comment `// SHIM: replace after P8 prototype` and `create_charter` usage guidance. |
| modify | `packages/shared/tests/rooms.test.ts`                                              | Add deterministic assertions for Sanctuary room wiring (`roomId`, Jarvis identity, prompt presence, shim marker).                                                                   |
| modify | `packages/shared/src/settings.ts`                                                  | Add typed journey key constants for Sanctuary charter metadata (e.g., charter document ID and completion timestamp), without adding default values.                                 |
| add    | `packages/server/src/tools/charter.ts`                                             | New focused tool implementation for `create_charter` that creates charter document content and persists current-charter settings pointer.                                           |
| modify | `packages/server/src/tools/schemas.ts`                                             | Add `create_charter` schema to `llmToolSchemas` (title/content/summary payload contract).                                                                                           |
| modify | `packages/server/src/tools/index.ts`                                               | Register `create_charter` execution path in `executeLLMTool`.                                                                                                                       |
| modify | `packages/server/src/services/pi/prompts.ts`                                       | Update shared tool guidance text so the runtime prompt inventory includes the new charter tool semantics.                                                                           |
| add    | `packages/server/src/tools/charter.test.ts`                                        | Unit coverage for successful charter creation, validation failures, and settings pointer updates.                                                                                   |
| modify | `packages/web/src/components/sanctuary/SanctuaryOverlay.tsx` _(from #710)_         | Add first-visit orchestration: detect missing charter, open chat, send one hidden bootstrap turn, and switch to charter display when created.                                       |
| add    | `packages/web/src/components/sanctuary/useSanctuaryVisioning.ts`                   | Encapsulate first-visit detection, one-time bootstrap guard, Workshop-visited signal derivation, and charter lookup wiring.                                                         |
| modify | `packages/web/src/components/room-chat/RoomChatMessageList.tsx`                    | Hide internal bootstrap messages from transcript rendering while preserving normal user/assistant chat display.                                                                     |
| modify | `packages/web/src/components/room-chat/RoomChatMessageList.test.tsx`               | Add tests proving internal bootstrap messages are hidden and normal messages still render.                                                                                          |
| modify | `packages/web/src/hooks/useNavigationContext.ts`                                   | Ensure `/sanctuary` (and `/workshop` if not already present from #709/#710) emits route context text aligned with Sanctuary/Workshop surfaces.                                      |
| modify | `packages/web/src/components/sanctuary/SanctuaryOverlay.stories.tsx` _(from #710)_ | Add stories for first-visit Visioning state and returning-user charter state using real LiveStore events.                                                                           |
| add    | `packages/web/e2e/sanctuary-visioning-first-visit.spec.ts`                         | E2E journey: first Sanctuary visit triggers Jarvis-first flow and charter persistence; revisit shows charter without rerunning Visioning bootstrap.                                 |

## 3. Data Model Changes

No new LiveStore tables or event types are required.

- Reuse existing events:
  - `v1.ChatMessageSent` for bootstrap and user turns
  - `v1.DocumentCreated` for charter persistence
  - `v1.SettingUpdated` for current-charter pointer and completion metadata
- Reuse existing tables:
  - `documents` for charter body content
  - `settings` for journey metadata (`journey.sanctuaryCharterDocumentId`, `journey.sanctuaryVisioningCompletedAt`)
- Reuse existing queries:
  - `getSettingByKey$` for charter pointer and workshop status keys
  - `getDocumentById$` for charter content rendering
  - `getConversationByRoom$('workshop')` as fallback Workshop-visited signal when dedicated workshop completion key is absent

Notes:

- Settings values remain strings (document ID and ISO timestamp).
- No migration/backfill required.

## 4. Component Hierarchy

Sanctuary route flow (post-#710):

```text
Root
  /sanctuary route
    RoomLayout(room=SANCTUARY_ROOM)
      SanctuaryOverlay
        useSanctuaryVisioning
          read charter setting + document
          derive workshopVisited signal
          on first visit: open chat + send hidden bootstrap user turn once
        first-visit state: Jarvis conversation panel
        returning state: Charter content panel
```

Conversation and charter creation:

```text
Hidden Sanctuary bootstrap message (user role)
  -> events.chatMessageSent
  -> EventProcessor.runAgenticLoop
  -> Jarvis Sanctuary shim prompt
  -> create_charter tool call
  -> events.documentCreated + events.settingUpdated
  -> Sanctuary charter query updates and overlay switches to charter view
```

Nudge behavior:

```text
If workshopVisited === false in bootstrap context
  -> Jarvis includes Workshop nudge at end of Visioning
Else
  -> Jarvis completes Visioning without Workshop nudge
```

## 5. PR Breakdown

Single PR success criteria:

1. First Sanctuary visit after onboarding triggers Jarvis-first greeting through backend round-trip (not hardcoded assistant text).
2. Jarvis shim conversation elicits life direction/values and creates a persisted charter artifact.
3. Charter content is visible in Sanctuary overlay after creation.
4. Workshop nudge appears only when builder has not yet visited/completed Workshop first-visit flow.
5. Subsequent Sanctuary visits show existing charter and do not retrigger first-visit bootstrap flow.
6. Sanctuary prompt includes explicit interim marker comment (`// SHIM: replace after P8 prototype`).
7. Lint/tests/E2E/build pass.

## 6. Test Plan

Unit/integration (shared/web/server):

- `packages/shared/tests/rooms.test.ts`
  - Sanctuary room definition remains deterministic and includes shim marker.
- `packages/server/src/tools/charter.test.ts`
  - `create_charter` creates a document and updates charter settings pointer.
  - validation rejects empty/invalid charter payloads.
- `packages/web/src/components/sanctuary/useSanctuaryVisioning` tests
  - first-visit path sends bootstrap once.
  - returning-user path skips bootstrap when charter setting exists.
  - bootstrap payload correctly includes Workshop-visited state.
- `packages/web/src/components/room-chat/RoomChatMessageList.test.tsx`
  - internal bootstrap messages hidden.
  - regular user/assistant transcript unaffected.
- `packages/web/src/components/sanctuary/SanctuaryOverlay` tests
  - first-visit renders Visioning/chat state.
  - charter-created state renders persisted charter content.

E2E (Playwright):

- `sanctuary-visioning-first-visit.spec.ts`
  - open `/sanctuary` as first visit and verify Jarvis-first assistant response after backend round-trip.
  - complete conversation path that triggers charter creation.
  - assert charter content appears in Sanctuary.
  - leave/re-enter Sanctuary and verify one-time flow does not rerun.
  - assert Workshop nudge appears only when workshop-visited signal is false.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                                                    | Impact                                        | Mitigation                                                                                                                       |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| #710 lands with different Sanctuary component path/contracts                            | Integration churn                             | Keep first-visit logic isolated in `useSanctuaryVisioning` hook and adapt only thin route/component glue after rebasing on #710. |
| Hidden bootstrap message leaks into visible transcript                                  | Confusing UX/trust regression                 | Use one centralized internal-message marker + rendering filter with explicit tests.                                              |
| New charter tool appears in global tool set and may be called outside Sanctuary context | Unintended charter writes                     | Add server-side guardrails (worker/room context checks) and tighten Sanctuary prompt instructions.                               |
| Duplicate bootstrap on rapid remounts                                                   | Multiple greetings/duplicate charter attempts | Use in-memory `useRef` guard plus persisted charter-exists gate before dispatch.                                                 |
| Workshop-visited detection diverges from #719 final key names                           | Incorrect nudge behavior                      | Support layered detection: prefer typed workshop journey key, fallback to workshop conversation existence.                       |
| Charter content quality is uneven with shim prompt                                      | Weak first-use experience                     | Keep shim prompt explicit about elicitation goals and schedule P8 replacement with final script.                                 |

## 8. What's Out of Scope

- Final scripted Visioning dialogue from P8 prototype.
- Charter editing/revision workflows after initial creation.
- Priority/tier computation driven by charter content.
- Rich charter formatting/template system.
- Broad onboarding state-machine redesign beyond one-time Sanctuary Visioning mechanics.
