# Plan: Remove Mesa from the Map (#702)

## 1. Architecture Decisions

### Decision: Keep `LIFE_MAP_ROOM`, but remove Mesa identity and mark the room worker inactive

Options considered: (1) remove life-map room chat entirely by removing `LIFE_MAP_ROOM` usage in routes/layout, (2) rewire `LIFE_MAP_ROOM` to Jarvis or Marvin, (3) keep `LIFE_MAP_ROOM` contract but replace Mesa config with a neutral inactive worker.  
Chosen approach: option 3.  
Why: it satisfies “remove Mesa” and “no replacement agent” simultaneously, avoids broad route/layout refactors, and keeps room/chat plumbing stable for this release.  
State boundaries: LiveStore still provisions room worker/conversation records from `LIFE_MAP_ROOM`; React room chat remains available but read-only due inactive worker status; URL routes remain unchanged (`/`, `/life-map`, `/projects`).

### Decision: Keep the life-map room ID stable (`roomId: 'life-map'`)

Options considered: change room ID to force a fresh conversation history, or keep room ID stable.  
Chosen approach: keep room ID stable.  
Why: avoids route/session key churn, avoids migration complexity, and preserves compatibility with existing room lookup paths.  
State boundaries: URL and route state unchanged; LiveStore continues querying conversations by `roomId='life-map'`; React route wiring in `Root.tsx` remains stable.

### Decision: Treat this as config/identity cleanup, not data migration

Options considered: migrate historical `life-map-mesa` worker/conversation records, or leave historical data in place and stop referencing Mesa in code.  
Chosen approach: no migration/backfill in #702.  
Why: story scope is code/UI reference removal and runtime safety, not historical event rewriting.  
State boundaries: LiveStore schema/events/materializers unchanged; only room config and presentation/test fixtures change.

### Decision: Remove Mesa references from runtime code, tests, stories, and e2e coverage

Options considered: only update production runtime files, or also scrub hard-coded Mesa references from tests/stories/e2e.  
Chosen approach: scrub all code-path references under `packages/` (runtime + tests + stories + e2e).  
Why: prevents regressions, keeps assertions aligned with runtime behavior, and enforces the finish line unambiguously.

## 2. File Changes

| Action | File                                                               | Description                                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| modify | packages/shared/src/rooms.ts                                       | Remove `MESA_PROMPT`; update `LIFE_MAP_ROOM` so worker is no longer Mesa (`id`, `name`, `conversationTitle`, `prompt`), and set worker status to inactive to avoid introducing a new active attendant. |
| modify | packages/shared/tests/rooms.test.ts                                | Update `LIFE_MAP_ROOM` expectations to the new non-Mesa worker identity/status.                                                                                                                        |
| modify | packages/web/src/components/layout/RoomLayout.test.tsx             | Replace Mesa-specific mocked worker/conversation fixture values with non-Mesa values matching the new life-map room config.                                                                            |
| modify | packages/web/src/components/room-chat/RoomChatPanel.test.tsx       | Replace hard-coded `MESA` worker name expectations with non-Mesa fixture naming.                                                                                                                       |
| modify | packages/web/src/components/room-chat/RoomChatMessageList.test.tsx | Replace `workerName='MESA'` fixtures with non-Mesa worker name.                                                                                                                                        |
| modify | packages/web/src/components/room-chat/RoomChatPanel.stories.tsx    | Replace Mesa-specific story fixture values (`life-map-mesa`, `MESA`, `Life Map · MESA`) with neutral non-Mesa values.                                                                                  |
| modify | packages/web/src/components/life-map/LifeMap.stories.tsx           | Update story docs/seed data text that references “MESA chat sidebar”; align seeded worker status/metadata with updated `LIFE_MAP_ROOM`.                                                                |
| modify | packages/web/e2e/life-map-room-chat.spec.ts                        | Update flow expectations from “active Mesa chat” to “no Mesa-attendant behavior” (read-only/inactive attendant state).                                                                                 |

## 3. Data Model Changes

No event, schema, query, or materializer changes are planned.

- Events: no changes in `packages/shared/src/livestore/events.ts`.
- Schema/materializers: no changes in `packages/shared/src/livestore/schema.ts`.
- Queries: no changes in `packages/shared/src/livestore/queries.ts`.
- Migration notes: no migrations or backfills.

Data notes:

- Historical `life-map-mesa` worker/conversation records may remain in existing stores.
- Runtime code will no longer reference Mesa identifiers/prompts.

## 4. Component Hierarchy

Removed identity wiring:

```
LIFE_MAP_ROOM
  worker.id: life-map-mesa
  worker.name: MESA
  worker.prompt: MESA prompt
  conversationTitle: MESA · Life Map
```

Remaining runtime tree (updated):

```
Root Routes
  / and /life-map
    RoomLayout(room=LIFE_MAP_ROOM)
      NewUiShell
      LifeMap
      RoomChatPanel
        worker = LIFE_MAP_ROOM.worker (non-Mesa, inactive)
        read-only state (no active attendant)
```

## 5. PR Breakdown

Single PR success criteria:

1. No Mesa identifiers/names/prompts remain in `packages/shared/**` or `packages/web/**` runtime code.
2. `LIFE_MAP_ROOM` no longer uses Mesa as worker identity/prompt.
3. Life Map room chat no longer behaves as a Mesa-backed active attendant.
4. Updated unit/e2e/storybook fixtures are aligned with the new non-Mesa room config.
5. Build and full test suite pass with no runtime errors.

## 6. Test Plan

Unit tests:

- `packages/shared/tests/rooms.test.ts`: assert new `LIFE_MAP_ROOM.worker.id` and related life-map room invariants.
- `packages/web/src/components/layout/RoomLayout.test.tsx`: ensure chat toggle/panel behavior remains valid with updated worker fixture values.
- `packages/web/src/components/room-chat/RoomChatPanel.test.tsx`: verify worker name rendering uses non-Mesa fixture.
- `packages/web/src/components/room-chat/RoomChatMessageList.test.tsx`: verify message list renders correctly with non-Mesa worker name.

E2E Playwright:

- `packages/web/e2e/life-map-room-chat.spec.ts`:
  - Validate Life Map loads.
  - Validate chat no longer represents an active Mesa attendant (inactive/read-only behavior).
  - Ensure no Mesa text appears in the UI flow.

Storybook:

- `packages/web/src/components/room-chat/RoomChatPanel.stories.tsx`: story labels/fixtures updated to non-Mesa naming.
- `packages/web/src/components/life-map/LifeMap.stories.tsx`: docs text and room-chat seed state aligned with updated life-map room worker config.

## 7. Risks and Mitigations

| Risk                                                                      | Impact                                             | Mitigation                                                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| A hard-coded Mesa reference remains in tests/stories                      | CI failures or stale naming in developer surfaces  | Run repo-wide `rg "MESA                                                                                             | Mesa | life-map-mesa" packages` before merge and update remaining hits. |
| Life-map chat behavior changes break existing e2e assumptions             | E2E failures in `life-map-room-chat.spec.ts`       | Rewrite the spec to assert inactive/non-Mesa behavior explicitly.                                                   |
| Existing stores retain historical Mesa worker/conversation rows           | Potential confusion when inspecting local DB state | Document as intentional non-migration in PR notes; rely on updated code paths that no longer reference Mesa config. |
| Inactive worker configuration is inconsistent between runtime and stories | Storybook diverges from app behavior               | Seed story worker/conversation from `LIFE_MAP_ROOM` fields instead of hard-coded Mesa-era values.                   |

## 8. What's Out of Scope

- Adding a replacement active agent for Life Map chat.
- Modifying Jarvis or Marvin configuration.
- Context library card updates for Mesa/Jarvis/Zone references.
- Event/history cleanup of legacy Mesa records in existing user stores.
