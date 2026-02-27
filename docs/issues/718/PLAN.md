# Plan: Campfire conversation: Jarvis guides first project creation (#718)

## 1. Architecture Decisions

### Decision: Implement campfire as a first-class room using existing room-chat + agent pipeline

Options considered: (1) build a bespoke campfire chat stack outside `RoomLayout`, (2) hardcode a temporary onboarding chat component with custom backend calls, (3) add a dedicated static `campfire` room and reuse `useRoomChat` + `EventProcessor` + Pi tools.  
Chosen approach: option 3.  
Why: it preserves existing room-scoped agent architecture, keeps AI round-trips on the established event pipeline, and minimizes one-off infrastructure.  
State boundaries: shared room registry (`packages/shared/src/rooms.ts`) defines campfire/Jarvis identity and prompt; web uses normal room conversation provisioning; server continues resolving prompt from room definitions.

### Decision: Use an internal bootstrap turn so Jarvis speaks first without hardcoded assistant text

Options considered: (1) hardcode Jarvis’s first message in the client, (2) add a new server-only “conversation started” endpoint/event path, (3) send one internal bootstrap chat message that triggers backend LLM generation and hide that bootstrap message from the transcript.  
Chosen approach: option 3.  
Why: satisfies “Jarvis initiates” and “not hardcoded responses” while avoiding a new transport path.  
State boundaries: web emits one internal bootstrap message when campfire conversation is ready; server processes internal-role messages for LLM turns; UI renders only user/assistant transcript content.

### Decision: Beat 1 uses onboarding-specific chat docking and shell suppression

Options considered: (1) use default chat toggle behavior, (2) fully custom page with duplicated chat UI, (3) extend shell/layout with onboarding mode (chat always visible in the temporary rail position, Attendant Rail hidden).  
Chosen approach: option 3.  
Why: reuses existing components while matching the Beat 1 layout requirement and keeping a clean switch back to normal shell behavior after Beat 2.  
State boundaries: `RoomLayout`/`NewUiShell` gain onboarding display controls; Beat 1 renders chat pinned in the temporary slot; normal routes remain unchanged outside onboarding mode.

### Decision: Trigger Beat 2 via onboarding orchestrator conditions, not ad-hoc UI checks

Options considered: (1) transition immediately when any project appears, (2) trigger from server tool callback only, (3) let #713 onboarding orchestration advance Beat 1 -> Beat 2 once campfire-created project + starter tasks criteria are satisfied.  
Chosen approach: option 3.  
Why: keeps phase progression in one state machine and avoids UI-local race conditions.  
State boundaries: #718 emits/creates the required artifacts (campfire conversation + project/tasks); #713 onboarding state logic performs phase advancement and reveal trigger.

## 2. File Changes

| Action | File                                                                    | Description                                                                                                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | packages/shared/src/rooms.ts                                            | Add `CAMPFIRE_ROOM` with Jarvis worker identity and a shim system prompt that is explicitly marked `// SHIM: replace after P6 prototype`; add `getRoomDefinitionByRoomId('campfire')` mapping; keep `roomKind: 'life-map'` to avoid room-kind schema expansion. |
| modify | packages/shared/tests/rooms.test.ts                                     | Add deterministic assertions for `CAMPFIRE_ROOM` (`roomId`, worker identity, scope, prompt presence).                                                                                                                                                           |
| modify | packages/web/src/hooks/useRoomChat.ts                                   | Add programmatic internal-message send path for one-time campfire bootstrap turns (separate from user-typed sends).                                                                                                                                             |
| modify | packages/web/src/components/room-chat/RoomChatMessageList.tsx           | Hide internal bootstrap/system transcript items so only user/assistant dialogue is shown.                                                                                                                                                                       |
| modify | packages/web/src/components/layout/RoomLayout.tsx                       | Add onboarding chat mode support (always-open chat panel, temporary rail placement, optional toggle suppression).                                                                                                                                               |
| modify | packages/web/src/components/layout/NewUiShell.tsx                       | Add Beat 1 shell controls to hide Attendant Rail and any conflicting chrome while keeping map/chat canvas stable.                                                                                                                                               |
| add    | packages/web/src/components/onboarding/CampfireConversation.tsx         | New Beat 1 container: boots Jarvis conversation, renders temporary-position chat UI, handles first-project completion callbacks into onboarding flow.                                                                                                           |
| add    | packages/web/src/components/onboarding/CampfireConversation.test.tsx    | Unit/integration tests for bootstrap behavior, one-time send, and chat visibility placement.                                                                                                                                                                    |
| add    | packages/web/src/components/onboarding/CampfireConversation.stories.tsx | Storybook coverage for Beat 1 campfire chat surface using real LiveStore events.                                                                                                                                                                                |
| modify | packages/web/src/components/life-map/LifeMap.tsx                        | Integrate campfire conversation surface when onboarding phase is Beat 1 (dependency: #713 onboarding state).                                                                                                                                                    |
| modify | packages/web/src/Root.tsx                                               | Wire campfire room/layout entry in onboarding flow and keep normal life-map routing for non-onboarding users.                                                                                                                                                   |
| modify | packages/server/src/services/event-processor.ts                         | Extend intake filtering to process internal bootstrap chat role/messages (while still ignoring assistant outputs); keep existing dedupe/rate-limit behavior.                                                                                                    |
| modify | packages/server/src/services/event-processor-infinite-loop.test.ts      | Add/adjust coverage for internal bootstrap message processing and guard against assistant-message reprocessing.                                                                                                                                                 |
| modify | packages/web/e2e/life-map-room-chat.spec.ts                             | Update/extend to cover onboarding Beat 1 auto-start behavior and Jarvis-first message expectations.                                                                                                                                                             |
| add    | packages/web/e2e/onboarding-campfire-first-project.spec.ts              | End-to-end flow: campfire arrival -> AI round-trip -> project + 3-5 tasks -> Beat 2 transition signal.                                                                                                                                                          |
| modify | packages/web/src/components/onboarding/\* (from #713)                   | Hook Beat 2 trigger to campfire-created first project completion criteria and reveal transition entrypoint.                                                                                                                                                     |

## 3. Data Model Changes

No new #718-specific LiveStore schema/event additions are planned.

- Reuse existing chat/project/task events: `v1.ChatMessageSent`, `v2.ProjectCreated`, `v2.TaskCreated`.
- Reuse #713 onboarding state/events for Beat transitions (no duplicate onboarding model in #718).
- No migrations/backfills.

Notes:

- Internal bootstrap uses existing chat event role support and remains a presentation-layer hide/filter concern.
- Project/task creation remains tool-driven and event-sourced through current materializers.

## 4. Component Hierarchy

Beat 1 flow (new):

```
Root (/ or /life-map)
  Onboarding gate/state resolver (#713)
    Beat 1 active
      RoomLayout(room=CAMPFIRE_ROOM, onboardingMode)
        NewUiShell (Attendant Rail hidden)
        LifeMap canvas (campfire context)
        CampfireConversation
          useRoomConversation/useRoomAgent
          bootstrap internal message (one-time)
          RoomChatPanel (temporary rail position)
```

AI + creation flow:

```
CampfireConversation bootstrap/send
  -> events.chatMessageSent
  -> EventProcessor runAgenticLoop (Jarvis campfire shim prompt)
  -> create_project + create_task tool calls
  -> v2.ProjectCreated + v2.TaskCreated events materialized
  -> #713 onboarding orchestrator advances to Beat 2 (Reveal)
```

Post-transition:

```
Beat 2 active
  standard life-map/reveal surfaces from #713
  campfire bootstrap path disabled
```

## 5. PR Breakdown

Single PR success criteria:

1. Campfire room/Jarvis shim prompt is wired end-to-end with explicit interim marker comment.
2. Jarvis sends the first visible message via backend round-trip (no hardcoded assistant transcript).
3. Beat 1 renders chat in temporary position while Attendant Rail remains hidden.
4. Conversation-driven tool calls create one project plus 3-5 starter tasks.
5. First project creation advances onboarding to Beat 2 through #713 orchestration.
6. Lint, unit/integration tests, E2E, and web build pass.

## 6. Test Plan

Unit tests:

- `packages/shared/tests/rooms.test.ts`: validate campfire room definition and Jarvis wiring.
- `packages/web/src/components/onboarding/CampfireConversation.test.tsx`: validate one-time bootstrap send and visible Jarvis-first behavior.
- `packages/web/src/components/room-chat/RoomChatMessageList` tests: validate internal/system bootstrap messages are hidden.
- `packages/web/src/components/layout/RoomLayout` tests: validate onboarding chat-dock mode and toggle suppression behavior.

Server tests:

- `packages/server/src/services/event-processor-infinite-loop.test.ts`: verify internal bootstrap messages are processed once; assistant messages remain non-triggering.
- Add/extend prompt-context tests to ensure campfire room resolves Jarvis shim prompt through room definition lookup.

E2E Playwright:

- `packages/web/e2e/onboarding-campfire-first-project.spec.ts`:
  - New user enters Beat 1 and sees campfire chat in temporary slot.
  - Jarvis initiates the first assistant message.
  - User provides project name/description.
  - Project appears with 3-5 tasks.
  - Onboarding transitions to Beat 2 reveal state.
- Update `packages/web/e2e/life-map-room-chat.spec.ts` for onboarding-aware chat behavior.

Storybook:

- Add `CampfireConversation.stories.tsx` with LiveStore boot events to exercise Beat 1 layout states.

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                       | Impact                                  | Mitigation                                                                                                                          |
| ---------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| #713 onboarding API/state surface differs from assumptions | Integration churn or rework             | Keep #718 implementation behind a small onboarding adapter boundary; align against #713 contracts before final coding.              |
| Internal bootstrap message leaks into visible transcript   | Confusing first-turn UX                 | Filter internal/system messages in message list and add explicit tests for hidden bootstrap behavior.                               |
| LLM sometimes creates fewer than 3 tasks                   | Fails finish-line criteria              | Add campfire prompt constraints + onboarding transition guard that waits for starter-task minimum before Beat 2; add E2E assertion. |
| Beat 2 triggers from non-campfire project creation         | Incorrect onboarding progression        | Gate transition by Beat 1 active state and campfire conversation/session context from #713 orchestrator.                            |
| EventProcessor role filtering change causes regressions    | Duplicate processing or missed messages | Extend existing infinite-loop and role-filter tests; keep assistant-role exclusion strict.                                          |

## 8. What's Out of Scope

- Final scripted campfire dialogue (P6-prototyped script and branching).
- Voice/audio/rich media chat interactions.
- Multi-branch dialogue trees or full campfire scorecard extraction.
- Post-onboarding return to campfire conversation.
- Jarvis sprite locomotion/walking animation.
