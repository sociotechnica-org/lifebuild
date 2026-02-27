# Plan: First project open: Marvin offers to help craft project details (#721)

## 1. Architecture Decisions

### Decision: Trigger first-project greeting through a one-time hidden bootstrap user turn sent via the existing room-chat event pipeline

Options considered: (1) hardcode Marvin greeting text in project UI, (2) add a backend "conversation started" endpoint/event, (3) dispatch one internal bootstrap `chatMessageSent` turn and let backend produce Marvin’s first visible assistant response.  
Chosen approach: option 3.  
Why: guarantees backend round-trip, keeps one transport path, and allows bootstrap payload to carry project context for greeting/offer language.  
State boundaries: web orchestrates one-time dispatch; server `EventProcessor` remains the single LLM execution path.

### Decision: Persist one-time intro completion in workspace settings, with onboarding-beat gating sourced from #708 when available

Options considered: (1) localStorage-only flag, (2) new LiveStore event/table for onboarding beat state, (3) `settings` key using existing `v1.SettingUpdated`.  
Chosen approach: option 3.  
Why: synced across devices/tabs and no schema migration required; avoids brittle local-only first-open behavior.  
State boundaries: web reads/writes `journey.firstProjectMarvinIntroCompletedAt` (and consumes #708 beat signal if exposed); no new materialized tables.

### Decision: Replace project-room worker identity/prompt with a Marvin project-helper shim that includes explicit project/task context

Options considered: (1) keep current generic `Project Guide` prompt, (2) inject context only through navigation context, (3) update `createProjectRoomDefinition` prompt template to Marvin voice and embed name/description/objectives/current tasks.  
Chosen approach: option 3.  
Why: issue requires a context-aware greeting and explicit shim marker in prompt code; embedding task snapshot in worker prompt makes the context deterministic on every turn.  
State boundaries: shared `rooms.ts` owns shim prompt text (`// SHIM: replace after prototype`); server project-room prompt resolution supplies current task snapshot.

### Decision: Implement task-change “observation” from explicit user task actions instead of passive task-table diffing

Options considered: (1) diff task query results and infer edits, (2) instrument explicit user actions (create/edit/status toggle) and emit internal observation turns.  
Chosen approach: option 2.  
Why: avoids AI self-observation loops from tool-created tasks and gives precise, low-noise context (“task added”, “task expanded”, “status changed”).  
State boundaries: project UI components emit action callbacks; a project-intro orchestration hook sends internal direct messages to current conversation.

### Decision: Enforce “create tasks only” for project-room Marvin at tool policy layer (not prompt text alone)

Options considered: (1) prompt-only instruction to avoid editing tasks, (2) server-side tool allowlist for project-room worker context.  
Chosen approach: option 2.  
Why: out-of-scope explicitly excludes Marvin editing existing tasks; server enforcement prevents accidental `update_task`/move/archive calls.  
State boundaries: Pi tool creation/execution filters by room/worker context; other room tool surfaces remain unchanged.

### Decision: Keep subsequent-open behavior unchanged except skipping bootstrap (chat remains user-controlled via existing shell toggle/rail)

Options considered: (1) always auto-open on every project open, (2) one-time auto-open only and preserve current manual access after.  
Chosen approach: option 2.  
Why: matches finish line and avoids repeat onboarding copy.  
State boundaries: one-time gate controls auto-open/bootstrap only; existing `RoomLayout` chat persistence/toggle behavior remains source of truth.

## 2. File Changes

| Action | File                                                                                             | Description                                                                                                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| modify | `packages/shared/src/rooms.ts`                                                                   | Replace project-room template with Marvin project-helper shim prompt; add explicit marker comment `// SHIM: replace after prototype`; include current task snapshot section in prompt interpolation and Marvin identity metadata.                                    |
| modify | `packages/shared/tests/rooms.test.ts`                                                            | Update/add assertions for project-room worker identity (`Marvin`), shim marker presence, and task-context interpolation behavior.                                                                                                                                    |
| modify | `packages/shared/src/settings.ts`                                                                | Add typed journey settings key(s) for first-project Marvin intro completion timestamp.                                                                                                                                                                               |
| modify | `packages/web/src/components/projects/ProjectDetailPage.tsx`                                     | Add first-open orchestration wiring: detect eligibility, auto-open chat once, dispatch bootstrap greeting trigger, and route task-action observations into chat. If #708 lands a wrapper (`ProjectOverlayRoute`), wire orchestration at that overlay entry boundary. |
| add    | `packages/web/src/components/projects/useFirstProjectMarvinIntro.ts`                             | New hook encapsulating settings gate lookup/write, one-time ref guards, bootstrap payload creation (project name/description/tasks), and observation message dispatch helpers.                                                                                       |
| modify | `packages/web/src/components/project-room/ProjectKanban.tsx`                                     | Emit structured callback for user-initiated task status changes so Marvin can observe and respond.                                                                                                                                                                   |
| modify | `packages/web/src/components/project-room/TaskDetailModal.tsx`                                   | Emit structured callbacks for task create/edit operations (while preserving existing mutation behavior).                                                                                                                                                             |
| modify | `packages/web/src/components/room-chat/RoomChatMessageList.tsx`                                  | Filter internal bootstrap/observation turns from visible transcript (sentinel-based) so only user-visible conversation appears.                                                                                                                                      |
| modify | `packages/web/src/components/room-chat/RoomChatMessageList.test.tsx`                             | Add tests for hidden internal turns plus regression checks for normal user/assistant rendering.                                                                                                                                                                      |
| modify | `packages/web/src/hooks/useProjectChatLifecycle.ts` _(optional depending on final wiring split)_ | Keep archive/unarchive behavior and, if chosen as orchestration home, host project-chat intro side effects with tests.                                                                                                                                               |
| modify | `packages/server/src/services/event-processor.ts`                                                | For dynamic `project:*` rooms, include current project tasks when building room definition so shim prompt always has latest task context.                                                                                                                            |
| modify | `packages/server/src/services/pi/tools.ts`                                                       | Add room/worker-aware tool filtering so project-room Marvin can create/read tasks but cannot edit/move/archive existing tasks.                                                                                                                                       |
| modify | `packages/server/src/services/pi/prompts.ts`                                                     | Align shared tool guidance text with create-only constraint in project-room shim context.                                                                                                                                                                            |
| add    | `packages/server/src/services/pi/tools.test.ts`                                                  | Validate project-room tool allowlist behavior (allowed `create_task`/read tools; blocked task-edit tools).                                                                                                                                                           |
| add    | `packages/web/e2e/project-first-open-marvin.spec.ts`                                             | E2E journey: first project open auto-opens chat and greets by name; task add/edit action produces Marvin response; subsequent project open does not auto-open/regreet.                                                                                               |

## 3. Data Model Changes

No new tables/events/materializers are required.

- Reused events:
  - `v1.ChatMessageSent` (bootstrap and observation turns)
  - Existing task mutation events (`v2.TaskCreated`, `v1.TaskUpdated`, `v2.TaskStatusChanged`)
  - `v1.SettingUpdated` (one-time intro completion flag)
- Reused queries:
  - `getSettingByKey$`
  - `getProjectById$`
  - `getProjectTasks$`
  - `getConversationByRoom$`

New settings key(s):

- `journey.firstProjectMarvinIntroCompletedAt` (ISO timestamp string)

Notes:

- No migration/backfill needed.
- Timestamp values remain ISO strings.

## 4. Component Hierarchy

Project overlay flow (post-#708 overlay route, mapped to current `ProjectDetailPage` if wrapper not yet merged):

```text
Project overlay entry (/projects/:projectId)
  RoomLayout(room=project room)
    Project-first-intro orchestration hook/component
      read journey intro setting (+ onboarding beat signal from #708 if present)
      on eligible first open:
        openChat()
        send hidden bootstrap turn with project context
        persist completion setting
      on user task actions:
        send hidden observation turn
    ProjectHeader
    ProjectKanban
    TaskDetailModal
```

LLM round-trip:

```text
Hidden bootstrap/observation user turn
  -> events.chatMessageSent
  -> EventProcessor.runAgenticLoop
  -> project-room Marvin shim prompt (with project + current tasks)
  -> assistant reply in transcript
  -> optional create_task tool call when user asks Marvin to add tasks
```

Subsequent opens:

```text
Completion setting exists
  -> no auto-open/bootstrap
  -> Marvin remains manually accessible via existing chat control (rail/toggle)
```

## 5. PR Breakdown

Single PR (after #708) success criteria:

1. First project overlay open triggers Marvin chat auto-open once.
2. Marvin’s first visible message acknowledges the specific project by name and offers task-shaping help.
3. Shim prompt includes project context fields (name, description, objectives/current lifecycle context, current tasks) and is explicitly marked interim.
4. User task actions (add/edit/status change) generate observation turns and Marvin responds contextually.
5. Marvin can create tasks when asked.
6. Project-room Marvin cannot edit existing tasks through tool calls in this shim.
7. Later project opens do not auto-open chat or replay first greeting.
8. Lint/tests/E2E/build pass.

## 6. Test Plan

Unit/integration (shared/web/server):

- `packages/shared/tests/rooms.test.ts`
  - project-room definition uses Marvin identity and contains shim marker
  - interpolated task snapshot appears in prompt
- `packages/web/src/components/projects/useFirstProjectMarvinIntro` tests
  - eligible first open auto-opens and dispatches bootstrap exactly once
  - completion setting write blocks subsequent auto-open/bootstrap
  - bootstrap payload includes project name/description/task snapshot
- `ProjectDetailPage` integration tests
  - first open orchestrator wiring calls chat control APIs
  - task create/edit/status callbacks dispatch observation turns
- `RoomChatMessageList` tests
  - internal bootstrap/observation messages are hidden
  - regular conversation messages remain visible
- `packages/server/src/services/pi/tools.test.ts`
  - project-room tool policy allows `create_task` + read calls
  - project-room tool policy blocks `update_task`, move/orphan/archive task tools
- `EventProcessor` prompt-context test (new or extended)
  - project-room prompt resolution includes current task snapshot for active project

E2E (Playwright):

- `project-first-open-marvin.spec.ts`
  - open first project overlay and verify chat auto-opens
  - verify Marvin greeting references project name
  - create/edit/toggle a task and verify Marvin follow-up response appears
  - ask Marvin to create a task and assert task appears in project list
  - close and reopen project overlay; verify no auto-open/re-greeting

Verification commands:

- `pnpm lint-all`
- `pnpm test`
- `CI=true pnpm test:e2e`
- `pnpm --filter @lifebuild/web build`

## 7. Risks and Mitigations

| Risk                                                              | Impact                           | Mitigation                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| #708 lands with different overlay entry points/beat state shape   | Integration drift                | Keep orchestration isolated in a dedicated hook and adapt only entry wiring; consume #708 beat signal via thin adapter function. |
| Internal bootstrap/observation turns leak into transcript         | Confusing UX                     | Use a single sentinel format + centralized render filter + explicit tests.                                                       |
| Duplicate bootstrap from remounts/query races                     | Multiple greetings               | Combine persisted setting gate with in-memory `useRef` dispatch guard and conversation-ready checks.                             |
| Observation messages trigger loops from AI-generated task changes | Noisy or recursive responses     | Emit observations only from explicit user UI actions, not passive task-table diffing.                                            |
| Tool restriction accidentally affects non-project rooms           | Capability regressions elsewhere | Scope allowlist to project-room worker/room context only and add targeted server tests.                                          |
| Prompt task snapshot grows too large for big projects             | Token bloat / degraded replies   | Cap snapshot size (e.g., most recent/priority subset) and include count summary in prompt.                                       |

## 8. What's Out of Scope

- Final scripted first-project experience beyond this shim.
- Unprompted proactive task suggestions without user action.
- Cross-project learning/pattern memory.
- Task dependency/subtask recommendation systems.
- Marvin editing existing tasks in this shim (create-only behavior).
