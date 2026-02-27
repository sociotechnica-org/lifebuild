# Context Briefing: Issue #707 — Attendant Rail with Attendant Avatars

**Assembled:** 2026-02-27
**Assembler:** Conan the Librarian
**Classification:** Component (new) | New Feature
**Blocked by:** #705 (Building overlay pattern and routing)

---

## Constellation

### Seed Cards

| Card                                                                                         | Role in This Issue                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [Agent - Jarvis](../../context-library/product/agents/Agent%20-%20Jarvis.md)                 | One of two attendants in the rail. Counselor agent. Auto-selected on `/sanctuary` navigation. Not yet implemented in codebase.             |
| [Agent - Marvin](../../context-library/product/agents/Agent%20-%20Marvin.md)                 | Second attendant in the rail. Manager agent. Auto-selected when opening a project. Partially implemented (Drafting Room and Sorting Room). |
| [Component - Campfire](../../context-library/product/components/Component%20-%20Campfire.md) | The rail must be hidden during the campfire onboarding beat and fade in during the reveal. Campfire is not yet built.                      |
| [Release - The Attendants](../../context-library/releases/Release%20-%20The%20Attendants.md) | The broader release context for attendant agents. This rail is a precursor UI component for that release.                                  |

### 1-Hop Expansion

| Card                                                                                                                       | Relationship                              | Relevance                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Strategy - AI as Teammates](../../context-library/rationale/strategies/Strategy%20-%20AI%20as%20Teammates.md)             | Standard (Jarvis + Marvin implement this) | The rail makes agents persistently accessible — advancing from "tool you use" to "teammate you work with." Currently at Level 1 (operational team with defined roles).                                                                    |
| [Capability - Workspace Navigation](../../context-library/product/capabilities/Capability%20-%20Workspace%20Navigation.md) | Sibling capability                        | Navigation currently lives in the header (`NewUiShell.tsx`). The rail is a new navigation surface that coexists with the header nav. The rail does not replace workspace navigation — it adds agent-context navigation.                   |
| [Standard - Onboarding Sequence](../../context-library/rationale/standards/Standard%20-%20Onboarding%20Sequence.md)        | Standard (rail conforms to)               | Day 1: only Campfire + Life Map visible. The rail must respect progressive disclosure — hidden until the appropriate onboarding beat. Not yet built.                                                                                      |
| [Journey - Builder Onboarding](../../context-library/experience/journeys/Journey%20-%20Builder%20Onboarding.md)            | Parent journey                            | The campfire-to-sanctuary walk is the threshold moment. Rail visibility ties to this journey's completion. Not yet built.                                                                                                                 |
| [Aesthetic - Sanctuary](../../context-library/experience/aesthetics/Aesthetic%20-%20Sanctuary.md)                          | Parent aesthetic                          | The `/sanctuary` route auto-selects Jarvis because the sanctuary is where Jarvis lives — the counselor's home. Sanctuary aesthetic: warm, persistent, no alerts competing for attention. Notification pips must be subtle, not demanding. |

---

## Key Design Decisions from Cards

1. **Jarvis is overlay/drawer, not route-based (D2, 2026-02-17):** Jarvis is accessible from anywhere on the Life Map via overlay in R1. The rail chat panel aligns with this decision — clicking Jarvis in the rail opens a panel, not a route change.

2. **Campfire is temporary and hidden during onboarding (Component - Campfire):** The rail must not be visible during the campfire beat. Progressive disclosure rules from the Onboarding Sequence say Day 1 shows only Campfire + Life Map basics. Rail fade-in happens after the campfire walk completes. (Issue notes this is out of scope for #707 — separate onboarding story.)

3. **Auto-selection logic:**
   - `/sanctuary` auto-selects Jarvis — Jarvis's home is the Council Chamber / sanctuary structure. He is the counselor who greets you at home.
   - Opening a project auto-selects Marvin — Marvin manages projects. When context shifts to operational/project work, Marvin is the appropriate attendant.

4. **Notification pips: prop-driven, not wired yet.** Per the Sanctuary aesthetic, pips must be subtle — the sanctuary does not demand attention. Pips should be small colored dots, not badge counts or alert banners.

---

## Codebase Impact Map

### Files to Create

| File                                                           | Purpose                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/web/src/components/layout/AttendantRail.tsx`         | New component: vertical rail with avatar icons, notification pips, click handlers |
| `packages/web/src/components/layout/AttendantRail.test.tsx`    | Unit tests for rail behavior (selection, toggle, auto-select logic)               |
| `packages/web/src/components/layout/AttendantRail.stories.tsx` | Storybook stories (per web AGENTS.md: add stories for UI components)              |
| `packages/web/src/components/layout/AttendantChatPanel.tsx`    | Chat panel that opens adjacent to the rail (may reuse or wrap `RoomChatPanel`)    |

### Files to Modify

| File                                                | Change                                                                                                                                                                                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/web/src/components/layout/NewUiShell.tsx` | Add the AttendantRail to the left edge of the shell layout. The rail sits outside the main content area, always visible. Current layout: header (top) + main (center) + TableBar (bottom). New: rail (left) + header (top) + main (center) + TableBar (bottom). |
| `packages/web/src/components/layout/RoomLayout.tsx` | Currently manages chat panel open/close state and positions it on the right. The attendant rail replaces or supplements this pattern. The existing `RoomChatPanel` integration may need refactoring — the rail decouples chat from room context.                |
| `packages/web/src/Root.tsx`                         | Auto-selection logic: `/sanctuary` route (does not exist yet, but when added) should pass prop to auto-select Jarvis. Project routes (`/projects/:projectId`) should auto-select Marvin.                                                                        |
| `packages/web/src/constants/routes.ts`              | May need a `/sanctuary` route constant if the auto-select behavior needs a route to key off. Currently no sanctuary route exists.                                                                                                                               |
| `packages/shared/src/rooms.ts`                      | Jarvis does not have a room definition yet. A `JARVIS_ROOM` or equivalent `StaticRoomDefinition` will be needed for the chat panel to work. Marvin already has `DRAFTING_ROOM` but may need a context-free variant for rail-based chat.                         |

### Existing Patterns to Reuse

| Pattern                   | Location                                                  | How                                                                                                                                                                                                       |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RoomChatPanel`           | `packages/web/src/components/room-chat/RoomChatPanel.tsx` | The existing chat panel component handles message display, scroll behavior, input, and processing state. The rail's chat panel should reuse this component (or a variant) rather than rebuilding chat UI. |
| `useRoomChat` hook        | `packages/web/src/hooks/useRoomChat.ts`                   | Manages conversation state, message sending, worker connection. The rail panel needs equivalent functionality per-attendant.                                                                              |
| `usePersistentChatToggle` | `packages/web/src/components/layout/RoomLayout.tsx`       | LocalStorage-persisted open/close state per room. The rail should use a similar pattern for remembering which attendant was last selected.                                                                |
| `RoomWorkerDefinition`    | `packages/shared/src/rooms.ts`                            | Jarvis and Marvin need worker definitions with prompts, names, and role descriptions. Marvin already has one (`drafting-room-marvin`). Jarvis needs one.                                                  |

### Architecture Considerations

1. **Decoupling chat from rooms:** Currently, chat is tightly coupled to `RoomLayout` — each room has one agent, one conversation. The rail introduces a second axis: the builder can talk to Jarvis or Marvin from ANY context. This means the rail's chat state is global (lives above route-level), not room-scoped.

2. **Single panel at a time:** Issue specifies only one chat panel open at a time. Clicking Marvin while Jarvis is open switches to Marvin. This is simpler than the current room-chat model (where each room independently toggles).

3. **Coexistence with room chat:** The existing room-based chat toggle (the speech bubble in the header) currently opens a right-side panel. With the rail, the left-side attendant panel may replace or coexist with the right-side room chat. This needs a design decision. The issue says the rail is "visible from any context" and "decouples conversation from buildings."

4. **The `/sanctuary` route does not exist yet.** The current app has `/life-map`, `/drafting-room`, `/sorting-room`, and `/projects/:projectId`. Auto-selecting Jarvis on `/sanctuary` will only work once that route is created (likely part of #705 or a subsequent issue). For now, the auto-select prop interface should be designed to accept route-based triggers.

---

## Open Questions

1. **Does the rail replace the existing room chat toggle?** The header currently has a speech bubble button that opens a right-side chat panel per room. The rail introduces a left-side panel for attendants. Do both coexist, or does the rail subsume room chat?

2. **What is the `/sanctuary` route?** It does not exist in the codebase. Is it the Life Map? A new dedicated route? This affects auto-select implementation.

3. **Chat backend wiring is out of scope** per the issue, but the component needs to accept props for conversation data. Should the component stub out a placeholder chat, or render the full `RoomChatPanel` with empty state?

---

## Provenance

| Card                              | Full Path                                                                        | Read? |
| --------------------------------- | -------------------------------------------------------------------------------- | ----- |
| Agent - Jarvis                    | `docs/context-library/product/agents/Agent - Jarvis.md`                          | Yes   |
| Agent - Marvin                    | `docs/context-library/product/agents/Agent - Marvin.md`                          | Yes   |
| Component - Campfire              | `docs/context-library/product/components/Component - Campfire.md`                | Yes   |
| Release - The Attendants          | `docs/context-library/releases/Release - The Attendants.md`                      | Yes   |
| Strategy - AI as Teammates        | `docs/context-library/rationale/strategies/Strategy - AI as Teammates.md`        | Yes   |
| Capability - Workspace Navigation | `docs/context-library/product/capabilities/Capability - Workspace Navigation.md` | Yes   |
| Standard - Onboarding Sequence    | `docs/context-library/rationale/standards/Standard - Onboarding Sequence.md`     | Yes   |
| Journey - Builder Onboarding      | `docs/context-library/experience/journeys/Journey - Builder Onboarding.md`       | Yes   |
| Aesthetic - Sanctuary             | `docs/context-library/experience/aesthetics/Aesthetic - Sanctuary.md`            | Yes   |
| Journey - Sanctuary Progression   | `docs/context-library/experience/journeys/Journey - Sanctuary Progression.md`    | Yes   |

### Codebase Files Examined

- `packages/web/src/components/layout/NewUiShell.tsx` — current shell layout
- `packages/web/src/components/layout/RoomLayout.tsx` — room-level chat integration
- `packages/web/src/components/room-chat/RoomChatPanel.tsx` — existing chat panel component
- `packages/web/src/Root.tsx` — routing and app structure
- `packages/web/src/constants/routes.ts` — route definitions
- `packages/shared/src/rooms.ts` — room and worker definitions
