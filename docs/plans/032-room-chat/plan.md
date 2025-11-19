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

- **Rooms**: Life Map (“MESA”), the eight category rooms listed above (Maya, Atlas, Brooks, Grace, Reed, Finn, Indie, Sage), and every Project room. Each project room mints its own dedicated worker (namespaced by project) so the resulting prompt history and metadata can travel with that project.
- **Entry point**: Each room view rendered under the new UI shell includes a slim left-side toolbar with at least a `Chat` button, but per guidance we can start with the button in the room header until the toolbar exists. Clicking the button slides in (or reveals) the chat sidebar; clicking again collapses it. Desktop/mobile behavior can stay simple (no animation required).
- **Chat content**: The panel shows:
  - Header with room+agent identity (name, role description).
  - Scrollable list of messages with role labels (User vs. agent vs. tool/status). Tool calls or context payloads should be displayed similarly to `MessageList` but can be simplified (e.g., text badges such as `Tool: create_task`).
  - Input box with submit button.
- **Visibility**: Conversations remain shared across everyone in the workspace/store (current LiveStore behavior). Authentication / personalization changes come later.
- **Auto-initialization**:
  - When a room loads, ensure the worker exists (creating via `events.workerCreated`) and is linked to the relevant record (e.g., category assignment via `events.workerAssignedToCategory` or a room metadata record).
  - Ensure a conversation exists for that room (by `roomId`) and automatically load it into the sidebar; that conversation is shared workspace-wide to keep everyone in sync.
  - On first message, include `navigationContext` (already provided by `useNavigationContext`) plus new room metadata so the worker knows which room is in play.
- **Minimal styling**: Raw HTML, stack layout, and maybe monospace separators are acceptable if they differentiate roles/tool lines. All final polish happens later.

## Pull Request Breakdown (Horizontal Slices)

Each PR creates a usable end-to-end scenario (UI, data, backend, tests) so we can ship incrementally without landing half-implemented pieces.

### PR1 – Room Metadata & Infrastructure

**Scope**
- Add `roomId`/`roomKind` columns to `conversations` (schema + events + migrations) and extend queries (`getConversationsByRoom$`, helpers for room lookups).
- Introduce shared room definitions (`packages/shared/src/rooms.ts`) containing the Life Map agent plus the eight Life Category agents listed above (names, prompts, role descriptions, default models).
- Extract reusable provisioning hooks (`useRoomAgent`, `useRoomConversation`) and utilities (promise de-duplication, worker creation helpers). Refactor `useCategoryAdvisorConversation` to rely on them.
- Build core room chat primitives (`useRoomChat`, `RoomChatPanel`, `RoomChatInput`, `RoomChatMessageList`, `RoomChatToggle`) and wire them to LiveStore queries/messages. Minimal styling only.
- Backend alignment: ensure server event processor logs and payloads include `roomId` when available.
- Tests for schema, hooks, and room chat components; Storybook stories for the new primitives.

**Deliverable**  
A hidden (behind feature flag) room chat system that can be mounted in future PRs but already pulls data end-to-end with a mock room descriptor.

### PR2 – Life Map Room (MESA) Slice

**Scope**
- Wrap the new Life Map concept component (`packages/web/src/components/new/life-map/LifeMap.tsx`) in `RoomLayout` using `roomId: 'life-map'` and the MESA agent definition.
- Add a header-level Chat toggle that opens the sidebar. Persist toggle state per room via `localStorage`.
- Ensure entering the Life Map auto-creates the MESA worker (if missing), the associated conversation (shared across the workspace), and renders real chat history/messages using the new components.
- Add instrumentation/tests verifying the Life Map route renders chat, sends messages, and streaming states work.

**Deliverable**  
`/new/life-map` becomes the first publicly usable room chat surface. Users can open/close the chat and converse with MESA without touching other rooms.

### PR3 – Life Category Rooms with Agent Roster

**Scope**
- Update `packages/web/src/components/new/life-category/LifeCategory.tsx` to use `RoomLayout` and define `roomId: category:<slug>` for all eight categories.
- Seed the roster into `rooms.ts` (Health→Maya, Purpose→Atlas, Finances→Brooks, Relationships→Grace, Home→Reed, Contribution→Finn, Leisure→Indie, Learning→Sage). Include per-agent prompts/role descriptions.
- Ensure visiting each category auto-creates the correct worker (tied to category) and conversation, reusing the shared workspace conversation.
- Provide targeted tests/stories showing at least two categories in action, plus manual test instructions covering the entire roster.

**Deliverable**  
All `/new/category/:categoryId` pages gain their dedicated chat, so users can talk to Maya/Atlas/etc. while reviewing category dashboards.

### PR4 – Project Rooms & Per-Project Workers

**Scope**
- Wrap `ProjectDetailPage` (new UI) with `RoomLayout`, set `roomId: project:<projectId>`, and ensure the chat toggle appears on every project page.
- Implement per-project worker provisioning:
  - `workerId = project-${projectId}-guide`.
  - Prompt template referencing project metadata.
  - Lifecycle hooks to mark workers inactive / conversations archived when a project is archived/deleted.
- Ensure project conversations are shared per workspace (multiple teammates can review the same project chat).
- Add regression tests verifying new worker creation and cleanup logic, plus Storybook/RTL coverage for the project chat variant.

**Deliverable**  
Every project page under `/new/projects/:projectId` now includes an agent that understands that project’s context, completing the room chat rollout.

### PR5 – Polishing & Telemetry (optional follow-up)

**Scope**
- Refine layout (left sidebar toggle, align with forthcoming toolbar), add analytics/telemetry for chat usage per room, and backfill Storybook stories for combined layouts.
- Address feedback from earlier PRs (performance, accessibility, additional tests).

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

## Risks & Mitigations

- **Explosion of worker records (one per project)**  
  Mitigation: Namespace worker IDs predictably, mark workers inactive when their project is archived, and consider capping auto-creation behind a flag until validated.

- **Concurrent initialization races**  
  Mitigation: Follow the promise de-duplication pattern already used in `useCategoryAdvisor` and gate conversation creation on `isMounted` checks.

- **Schema drift / backwards compatibility**  
  Mitigation: Make new conversation fields optional with sane defaults, add regression tests, and ensure server-side queries tolerate missing `roomId`.

- **UI regressions in legacy chat**  
  Mitigation: Keep new hooks/components scoped to `/new`. Legacy `ChatInterface` continues to rely on `useChatData`.

## Open Questions / Clarifications Needed

- _None at this time._ Future feedback will be captured in subsequent PR descriptions.
