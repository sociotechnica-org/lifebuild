# Room Chat Plan (032)

## Overview

LifeBuild is getting a parallel, stripped-down UI that eventually replaces the existing debug UI. The flagship feature for this track is a **room-scoped LLM chat**: every LifeBuild room (Life Map, each Life Category room, every Project room) should expose its own agent that understands the context of that room. The chat lives in a toggleable sidebar so users can pull the agent in when they need help, while keeping the primary workspace uncluttered. This document captures the plan for shipping that experience, grounded in the current codebase (notably `packages/web/src/components/chat`, `packages/web/src/hooks/useChatData.ts`, and the new `/new` UI scaffold defined in `packages/web/src/components/new`). After rebasing on `main`, we also have new LifeBuild concept surfaces such as `LifeMap.tsx`, `LifeCategory.tsx`, `ProjectCard.tsx`, and `new-ui.css` that should host the room chat work.

The existing layout (`packages/web/src/components/layout/Layout.tsx`) always renders `ChatInterface`, which allows any worker to be selected manually. The new experience must instead auto-provision the correct worker + conversation per room, show only that conversation, and feel purpose-built for the LifeBuild flows the agents support.

## Goals

1. Define a canonical data model for **rooms**, their associated workers, prompts, and conversations so both frontend and backend code can reason about the mapping.
2. Auto-provision (or auto-link to) the correct worker and conversation whenever a room loads, creating them on demand when necessary.
3. Expose a lightweight, unstyled-but-usable chat sidebar in the new UI shell with a left-side toggle that opens/closes the per-room chat.
4. Display user/assistant/tool messages with enough affordances to understand who said what, when tools ran, and what context was passed (even without final design polish).
5. Keep the implementation agent-friendly: clear seams for future prompt editing, admin overrides, and eventual styling.

## Non-Goals

- Shipping the admin interface for editing prompts or mapping rooms to workers (hard-coded for now).
- Rebuilding the legacy `Layout` chat panel—only the new LifeBuild UI gets room chat.
- Comprehensive visual styling, animations, or responsive polish beyond “usable and distinguishable.”
- Changing how the server-side agentic loop works beyond the metadata it needs to understand room context.
- Extending chat capabilities beyond what already exists (e.g., no new tools in this PR).

## Current State Summary

### Chat System

- `Layout` renders `ChatInterface`, which in turn uses `useChatData` to fetch conversations, workers, and messages from LiveStore tables (`chatMessages`, `conversations`, `workers`).
- Conversations are not scoped to rooms today. Users manually pick any worker via the conversation selector UI (`ChatPresenter`).
- `useCategoryAdvisorConversation` already demonstrates auto-provisioning a worker + conversation for the eight Life Category advisors, but it only auto-selects the conversation by manipulating URL params and still relies on the legacy chat panel.

### New UI Surfaces

- `docs/plans/026-new-ui-foundation/plan.md` established `/new` routes with `NewUiShell`, and after the latest merge we have actual concept components: `packages/web/src/components/new/life-map/LifeMap.tsx`, `packages/web/src/components/new/life-category/LifeCategory.tsx`, `packages/web/src/components/new/projects/ProjectCard.tsx`, and a `new/new-ui.css` baseline. Routing constants now include `ROUTES.NEW`, `ROUTES.NEW_LIFE_MAP`, and `ROUTES.NEW_CATEGORY`.
- There is still no chat entry point inside `/new`. The new components render purely informational UI and rely on the old Layout when outside `/new`.
- No “room” abstraction exists in code—the app speaks in terms of routes (Life Map, Category, Project) but there is no shared layer tying them to workers.

## Target Experience

### Key Constraints

- One worker per room (Life Map, category, project) stored as workspace-level records with deterministic IDs.
- One conversation per room per workspace for this release (shared). Personalized histories are explicitly out of scope.
- Worker lifecycle mirrors the parent room entity; archiving/deleting a project must deactivate its worker + conversation.
- Room chat surfaces ship behind a feature flag so we can roll out route-by-route and disable quickly if needed.

### Agent Roster

_Lightweight prompts for each room agent (replace with richer copy later)._

- **Life Map – MESA**: “You are MESA, the navigator for LifeBuild’s Life Map. Help users zoom out, notice imbalances across categories, and suggest which area they should focus on next. Ask clarifying questions before prescribing actions.”
- **Health – Maya**: “You are Maya, the Health & Well-Being coach. Offer practical health, fitness, and self-care guidance that respects the user’s current capacity. Encourage sustainable habits over extremes.”
- **Purpose – Atlas**: “You are Atlas, the Purpose & Meaning guide. Help users explore values, spirituality, and long-term goals. Reflect back what you hear and suggest gentle experiments that build meaning.”
- **Finances – Brooks**: “You are Brooks, the Finances strategist. Give grounded advice on budgeting, saving, and financial planning. Emphasize clarity, small next steps, and responsible decision making.”
- **Relationships – Grace**: “You are Grace, the Relationships mentor. Help users nurture family, friends, and community connections. Encourage empathy, specific outreach ideas, and rituals that keep relationships strong.”
- **Home – Reed**: “You are Reed, the Home & Environment steward. Guide users through organization, maintenance, and improvement projects that make their spaces supportive and calm.”
- **Contribution – Finn**: “You are Finn, the Contribution advisor. Help users find meaningful ways to give back, volunteer, or advocate. Focus on sustainable commitments that align with their skills.”
- **Leisure – Indie**: “You are Indie, the Leisure & Joy curator. Suggest playful activities, rest rituals, and inspiration that help users recharge and enjoy life.”
- **Learning/Growth – Sage**: “You are Sage, the Learning companion. Help users set learning goals, design practice loops, and celebrate progress across skills or education.”
- **Project Guide Template**: “You are the project guide for `{{projectName}}`. Use the project description, objectives, and current tasks to suggest next actions, unblock work, and keep the project aligned with its intended outcome. Highlight risks, dependencies, and lightweight experiments.”

Each room associates with exactly one of these agents (projects mint their own derived worker per project).

### Category Slug Map

Room IDs must follow the canonical slugs defined in `PROJECT_CATEGORIES`. The table below aligns display names, slugs, and assigned agents to avoid ambiguity:

| Slug            | Display Name           | Agent  |
| --------------- | ---------------------- | ------ |
| `health`        | Health & Well-Being    | Maya   |
| `relationships` | Relationships          | Grace  |
| `finances`      | Finances               | Brooks |
| `growth`        | Learning & Growth      | Sage   |
| `leisure`       | Leisure & Joy          | Indie  |
| `spirituality`  | Purpose & Meaning      | Atlas  |
| `home`          | Home & Environment     | Reed   |
| `contribution`  | Contribution & Service | Finn   |

- **Rooms**: Life Map (“MESA”), the eight category rooms listed above (Maya, Atlas, Brooks, Grace, Reed, Finn, Indie, Sage), and every Project room. Each project room mints its own dedicated worker (namespaced by project) so the resulting prompt history and metadata can travel with that project.
- **Rooms**: Life Map (“MESA”), the eight category rooms listed above (Maya, Atlas, Brooks, Grace, Reed, Finn, Indie, Sage), and every Project room. Each project room mints its own dedicated worker (namespaced by project) so the resulting prompt history and metadata can travel with that project.
- **Entry point**: Each room view rendered under the new UI shell includes a slim left-side toolbar with at least a `Chat` button, but per guidance we can start with the button in the room header until the toolbar exists. Clicking the button slides in (or reveals) the chat sidebar; clicking again collapses it. Desktop/mobile behavior can stay simple (no animation required).
- **Chat content**: The panel shows:
  - Header with room+agent identity (name, role description).
  - Scrollable list of messages with role labels (User vs. agent vs. tool/status). Tool calls or context payloads should be displayed similarly to `MessageList` but can be simplified (e.g., text badges such as `Tool: create_task`).
  - Input box with submit button.
- **Visibility**: Conversations remain shared across everyone in the workspace/store (current LiveStore behavior). Authentication / personalization changes come later.
- **Auto-initialization**:
  - When a user opens the chat toggle, ensure the worker exists (creating via `events.workerCreated`) and is linked to the room metadata.
  - Ensure a conversation exists for that room (by `roomId`) and automatically load it into the sidebar; that conversation is shared workspace-wide to keep everyone in sync.
  - On first message, include `navigationContext` (already provided by `useNavigationContext`) plus new room metadata so the worker knows which room is in play.
- **Minimal styling**: Raw HTML, stack layout, and maybe monospace separators are acceptable if they differentiate roles/tool lines. All final polish happens later.

### Message Metadata Example

```jsonc
{
  "role": "user",
  "message": "What should I focus on this week?",
  "roomId": "category:health",
  "roomKind": "category",
  "navigationContext": {
    "path": "/new/category/health",
    "subtab": "planning",
  },
  "roomContext": {
    "categoryId": "health",
    "categoryName": "Health & Well-Being",
  },
}
```

## Data Model & Schema

| Room Kind | `roomId` Format       | Example           | Worker ID Pattern      | Conversation Scope | Notes                                |
| --------- | --------------------- | ----------------- | ---------------------- | ------------------ | ------------------------------------ |
| life-map  | `life-map`            | `life-map`        | `life-map-mesa`        | workspace          | Singleton room                       |
| category  | `category:<slug>`     | `category:health` | `category-health-maya` | workspace          | Eight fixed categories               |
| project   | `project:<projectId>` | `project:abc123`  | `project-abc123-guide` | workspace          | Dynamic per project (template-based) |

- `conversations` table gains nullable `roomId` (text), `roomKind` (text enum), and `scope` (default `'workspace'`). Legacy conversations remain `NULL`.
- `workers` table gains nullable `roomId`, `roomKind`, and `status` (`'active' | 'inactive' | 'archived'`), allowing 1:1 binding between worker and room.
- Add indexes on `conversations.roomId` and `workers.roomId` to keep lookups fast.
- Migration strategy (PR1):
  - Add new columns with `NULL` defaults to avoid locking existing rows.
  - Backfill `scope = 'workspace'` for all current conversations.
  - Leave `roomId` `NULL` for legacy chat so new queries can filter on `roomId IS NOT NULL`.
  - Add validation within provisioning hooks that new room-bound conversations must include both `roomId` and `roomKind`.
- Prompt templating for projects happens client-side before emitting `events.workerCreated`:

```ts
const prompt = PROJECT_PROMPT_TEMPLATE.replace('{{projectName}}', project.name ?? 'this project')
```

## Lifecycle & Provisioning Flow

```
RoomChatToggle opens →
  useRoomAgent(room) →
    getWorkerByRoomId(roomId)
    if missing → emit events.workerCreated + workerRoomBound
  useRoomConversation(room) →
    getConversationByRoom(roomId)
    if missing → emit events.conversationCreated with room metadata
  useRoomChat() →
    subscribe to getConversationMessages$(conversationId)
    send messages with room + navigation metadata
```

- Provisioning hooks store pending promises in module scope to dedupe concurrent tabs/users.
- Workers are created lazily on first chat open to avoid unnecessary work when users just browse the page.
- Worker lifecycle:
  - **Project archived** → mark worker `status = 'inactive'`, emit `events.conversationArchived`.
  - **Project restored** → mark worker `status = 'active'`, emit `events.conversationUnarchived`.
  - **Project deleted** → emit deletion events and optionally purge associated conversation once history is exported.
- Conversations inherit the existing `processingState` column; new `scope` column positions us for per-user conversations later even though scope remains `'workspace'` for now.

## Launch Controls & Rollback

- Global feature flag (`VITE_ENABLE_ROOM_CHAT`) plus per-room toggle in LiveStore settings.
- Developer override: append `?roomChat=1` to URLs (or set `localStorage['room-chat:override']='true'`) to enable the sidebar without rebuilding when dogfooding or running Storybook/E2E specs.
- Rolling back only requires flipping the flag because schema changes are additive and nullable.
- Monitoring includes worker creation failures, conversation provisioning duration, and LLM response errors per room.

## Pull Request Breakdown (Horizontal Slices)

Each PR creates a usable end-to-end scenario (UI, data, backend, tests) so we can ship incrementally without landing half-implemented pieces. We briefly considered splitting PR1 into backend/ frontend tracks, but to honor the “horizontal slice” requirement we keep it as a single feature-flagged delivery that already exercises the full pipeline (albeit with mock room descriptors).

### PR1 – Room Metadata & Infrastructure

**Scope**

- Add `roomId`/`roomKind`/`scope` columns to `conversations` + indexes, update `events.conversationCreated` to accept them, and extend queries (`getConversationsByRoom$`, `getConversationByRoom$`).
- Per event-versioning standards, introduce `v2.ConversationCreated` (and subsequent handlers) that include the new room metadata fields while keeping `v1` untouched for backwards compatibility (similar to `v2.ProjectCreated`); schema columns remain optional with sensible defaults so legacy events continue to materialize.
- Add `roomId`/`roomKind`/`status` to `workers` plus deterministic ID helper + prompt templating utilities.
- Introduce shared room definitions (`packages/shared/src/rooms.ts`) containing the Life Map agent plus the eight Life Category agents listed above (names, prompts, role descriptions, default models).
- Extract reusable provisioning hooks (`useRoomAgent`, `useRoomConversation`) and utilities (promise de-duplication, worker creation helpers). Refactor `useCategoryAdvisorConversation` to rely on them.
- Build core room chat primitives (`useRoomChat`, `RoomChatPanel`, `RoomChatInput`, `RoomChatMessageList`, `RoomChatToggle`) and wire them to LiveStore queries/messages. Minimal styling only.
- Backend alignment: ensure server event processor logs and payloads include `roomId`/`roomKind` metadata.
- Tests & stories:
  - Unit: room definition validation, prompt templating, hook idempotency.
  - Integration: LiveStore provisioning flow using test adapter.
  - Storybook: RoomChatPanel states (empty, processing, tool call).
  - E2E: none (feature flag off).

**Deliverable**  
A hidden (behind feature flag) room chat system that can be mounted in future PRs but already pulls data end-to-end with a mock room descriptor.

### PR2 – Life Map Room (MESA) Slice

**Scope**

- Wrap the new Life Map concept component (`packages/web/src/components/new/life-map/LifeMap.tsx`) in `RoomLayout` using `roomId: 'life-map'` and the MESA agent definition.
- Add a header-level Chat toggle that opens the sidebar. Persist toggle state per room via `localStorage`.
- Ensure entering the Life Map auto-creates the MESA worker (if missing), the associated conversation (shared across the workspace), and renders real chat history/messages using the new components.
- Add instrumentation/tests verifying the Life Map route renders chat, sends messages, and streaming states work.
- Telemetry: count worker creations, conversation provisioning time, and user-open events for `/new/life-map`.
- Tests:
  - Integration: toggle state persistence and lazy worker creation.
  - E2E: Cypress spec hitting `/new/life-map`, sending a message, ensuring assistant response renders (with mock).
  - Regression: ensure legacy layout chat still renders (smoke test).

**Deliverable**  
`/new/life-map` becomes the first publicly usable room chat surface. Users can open/close the chat and converse with MESA without touching other rooms.

### PR3 – Life Category Rooms with Agent Roster

**Scope**

- Update `packages/web/src/components/new/life-category/LifeCategory.tsx` to use `RoomLayout` and define `roomId: category:<slug>` for all eight categories.
- Seed the roster into `rooms.ts` (Health→Maya, Purpose→Atlas, Finances→Brooks, Relationships→Grace, Home→Reed, Contribution→Finn, Leisure→Indie, Learning→Sage). Include per-agent prompts/role descriptions.
- Ensure visiting each category auto-creates the correct worker (tied to category) and conversation, reusing the shared workspace conversation.
- Provide targeted tests/stories showing at least two categories in action, plus manual test instructions covering the entire roster.
- Document known limitation: category chats are workspace-shared even though they may feel personal; plan follow-up research item.
- Tests:
  - Unit: verify category roster definitions.
  - Integration: `useRoomAgent` handles repeated mounts without duplication.
  - E2E: sample spec covering `/new/category/health`.

**Deliverable**  
All `/new/category/:categoryId` pages gain their dedicated chat, so users can talk to Maya/Atlas/etc. while reviewing category dashboards.

### PR4 – Project Rooms & Per-Project Workers

**Scope**

- Wrap `ProjectDetailPage` (new UI) with `RoomLayout`, set `roomId: project:<projectId>`, and ensure the chat toggle appears on every project page.
- Implement per-project worker provisioning:
  - `workerId = project-${projectId}-guide`.
  - Prompt template referencing project metadata (title, description, objectives, deadlines).
  - Lifecycle hooks:
    - On project archive → set worker `status = 'inactive'`, emit `events.conversationArchived`.
    - On project unarchive → restore worker/conversation to `active`.
    - On project delete → emit worker deletion + conversation archival events (soft-delete) with nightly cleanup job.
- Ensure project conversations are shared per workspace (multiple teammates can review the same project chat).
- Add regression tests verifying new worker creation and cleanup logic, plus Storybook/RTL coverage for the project chat variant.
- Tests:
  - Unit: prompt templating uses latest project metadata.
  - Integration: archiving/unarchiving fires correct lifecycle events.
  - E2E: `/new/projects/:projectId` chat happy path.

**Deliverable**  
Every project page under `/new/projects/:projectId` now includes an agent that understands that project’s context, completing the room chat rollout.

### PR5 – Polishing & Telemetry (optional follow-up)

**Scope**

- Refine layout (left sidebar toggle, align with forthcoming toolbar), add analytics/telemetry for chat usage per room, and backfill Storybook stories for combined layouts.
- Address feedback from earlier PRs (performance, accessibility, additional tests).
- Ship dashboards for worker creation latency, conversation processing failures, and engagement per room.
- Evaluate prefetch vs. lazy worker creation for frequently accessed rooms; keep default lazy.

**Deliverable**  
Production-ready room chat experience with metrics and UX refinements.

## Milestones

1. **Foundation (Room model + schema)**
   - Implement `rooms.ts`, schema updates, new queries, and hook scaffolding.
   - Deliver tests proving worker/conversation provisioning works for static rooms.

2. **Life Map vertical slice**
   - Wire `/new/life-map` (or `/new` landing) to render `RoomLayout` with chat toggle.
   - Verify MESA auto-creates, chat works end-to-end, and UI is minimally usable.

3. **Category + Project rollout**
   - Generalize hook usage for category/project descriptors, handle dynamic project worker creation/cleanup, and ensure toggles appear across the relevant pages.
   - Capture telemetry (logs) for room chat usage to guide future iterations.

Each milestone can ship behind a feature flag or `/new`-only route to keep production stable.

## Known Limitations

- Room conversations are shared across the workspace even for personal-feeling rooms (Life Map, categories). We will monitor feedback and consider per-user scopes once the shared model proves stable.
- Prompt copy is intentionally lightweight placeholder text; expect follow-up prompts work once product finalizes voice & tone.

## Risks & Mitigations

- **Explosion of worker records (one per project)**  
  Mitigation: Namespace worker IDs predictably, mark workers inactive when their project is archived, and consider capping auto-creation behind a flag until validated.

- **Concurrent initialization races**  
  Mitigation: Follow the promise de-duplication pattern already used in `useCategoryAdvisor` and gate conversation creation on `isMounted` checks.

- **Schema drift / backwards compatibility**  
  Mitigation: Make new conversation fields optional with sane defaults, add regression tests, and ensure server-side queries tolerate missing `roomId`.

- **UI regressions in legacy chat**  
  Mitigation: Keep new hooks/components scoped to `/new`. Legacy `ChatInterface` continues to rely on `useChatData`.

- **Shared conversation expectations**  
  Mitigation: Document prominently (chat header tooltip, release notes) that room chats are workspace-visible and collect feedback to inform future scoped conversations.

## Open Questions / Clarifications Needed

- _None at this time._ Future feedback will be captured in subsequent PR descriptions.
