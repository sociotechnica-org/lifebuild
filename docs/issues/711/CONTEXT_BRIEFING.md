# Context Briefing: #711 -- Task Queue Panel

## Task Frame

**Task:** Build a persistent, collapsible panel in the top-right corner of the UI that provides an aggregated view of tasks across all projects, grouped by project. The panel should appear when a second project is placed (i.e., when the builder has 2+ active projects with tasks). Clicking a task navigates to the project overlay/detail page. TEMP DECISION: group by project, click to navigate.

**Target type:** Component (new UI component -- Task Queue Panel)

**Task type:** New feature

**Constraints:**

- Panel is persistent (visible across routes via the shell) and collapsible
- Positioned in top-right corner of the viewport
- Tasks grouped by project -- not a flat cross-project list
- Click on a task navigates to the project detail page (current route: `/projects/:projectId`)
- Appears only when builder has 2+ projects with tasks (not shown for single-project users)
- TEMP DECISION: grouping by project is provisional; may evolve

**Acceptance criteria:**

- Panel renders in top-right corner, collapsible to a minimal indicator
- Tasks from all active (non-archived) projects are aggregated and displayed grouped by project name
- Panel visibility is gated on 2+ projects having tasks
- Clicking a task navigates to the relevant project detail page
- Panel persists across route changes (rendered in shell)
- Collapsed/expanded state is preserved (localStorage or similar)
- Storybook story with real LiveStore events
- Unit tests for panel logic

## Primary Cards (full content)

### Primitive - Task

**Type:** Primitive
**Relevance:** The Task primitive is the core data entity displayed in the Task Queue panel. Understanding its schema, states, and relationships to projects is essential.

#### WHAT: Definition

A single, completable action that contributes to a project's objectives or fulfills a system's cycle. Tasks are the atomic unit of work in LifeBuild -- discrete, actionable, specific, and completable.

#### WHERE: Ecosystem

- Zone: Cross-zone -- tasks appear in Room - Project Board, Room - System Board, Component - Bronze Position
- Implements: Standard - Three-Stream Portfolio -- Bronze tasks flow to stack
- Used by: Primitive - Project -- projects contain tasks on kanban boards
- Used by: Primitive - System -- systems generate tasks from recurring task templates
- Governs: Structure - Kanban Board -- task flow interface
- Components: System - Bronze Stack

#### WHY: Rationale

- Strategy: Strategy - Superior Process -- work decomposed into actionable units
- Principle: Visibility Creates Agency -- tasks make progress visible
- Driver: Builders need atomic work units they can complete in a session (typically 15min-2hrs).

#### WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Task primitive exists with `tasks` table, status-based flow (`todo`, `doing`, `in_review`, `done`), and events (`taskCreated`, `taskStatusUpdated`, `taskDeleted`). Tasks belong to projects and display on project detail page. No CODAD types, no delegation, no system-generated tasks. The `in_review` status was added beyond the card's 3-state model to support agent review workflows.

#### HOW: Implementation

**Lifecycle States:** To Do, In Progress, Done, Blocked (code uses: `todo`, `doing`, `in_review`, `done`)

**Task cards show:** task name, CODAD type indicator (not implemented), delegation status (not implemented), completion checkbox.

**Anti-patterns:** Tasks must be discrete, actionable, specific, and completable. "Get healthier" is not a task. "Manage weekly groceries" is a system, not a task. "Renovate kitchen" is a project, not a task.

---

### Primitive - Project

**Type:** Primitive
**Relevance:** Tasks are grouped by project in the Task Queue panel. The Project primitive defines the container, its states, and the relationship to tasks.

#### WHAT: Definition

A discrete initiative with a finish line -- bounded work that completes and moves to Archives. Every project has objectives, tasks, and moves through states toward completion.

#### WHERE: Ecosystem

- Zone: Cross-zone -- projects live on Zone - Life Map, created in Room - Drafting Room
- Implements: Standard - Three-Stream Portfolio, System - Four-Stage Creation, System - Pipeline Architecture
- Depends on: Primitive - Task -- projects contain tasks
- Governs: Room - Project Board, Structure - Kanban Board

#### WHEN: Timeline

**Implementation status:** Implemented
**Reality note (2026-02-17):** Project primitive is fully operational. `projects` table in LiveStore schema with full event support. Projects render as `ProjectCard` components within category cards. Each project will have a unique hex position in future.

#### HOW: Implementation

**Required properties:** Life Category, Purpose (Gold/Silver/Bronze), Objectives, Tasks, Priority attributes.

**Lifecycle States:** Identified, Scoped, Drafted, Prioritized, Live, Work at Hand, Completed.

---

### Room - Project Board

**Type:** Room
**Relevance:** The Task Queue panel navigates to the Project Board when a task is clicked. Understanding the current implementation (full-page route, not overlay) is critical for the navigation behavior.

#### WHAT: Definition

The detail overlay that opens when a builder clicks any project tile -- a focused view showing everything about a single project: description, objectives, tasks, progress, history, and available actions.

#### WHERE: Ecosystem

- Zone: Zone - Life Map -- opens as overlay (design) / full-page route (reality)
- Contains: Primitive - Task, Structure - Kanban Board
- Adjacent: Room - Sorting Room, Room - System Board

#### WHEN: Timeline

**Implementation status:** Partial
**Reality note (2026-02-10):** Project detail exists at `/projects/:projectId` via `ProjectDetailPage.tsx` with a dynamically-created Project Guide agent. It's a full-page route, not an overlay over the Life Map as described.

#### HOW: Implementation

**Contents:** Header (title, state, category), Description, Objectives, Tasks (kanban), Progress, History, Actions.

**Interaction (current reality):** Full-page navigation to `/projects/:projectId`. Uses `preserveStoreIdInUrl()` for LiveStore sync identity.

**Anti-patterns:**

- Project Board should not replace the Life Map entirely -- it's meant to be an overlay (not yet implemented).
- Detail density should match lifecycle state.

---

### Overlay - The Table

**Type:** Overlay
**Relevance:** The Table was the previous persistent UI element for cross-project visibility. Issue #699 removed it. The Task Queue panel partially fills the "persistent priority visibility" gap that The Table's removal created. Understanding The Table's design informs what the Task Queue panel should and should not replicate.

#### WHAT: Definition

A persistent priority spotlight that sat at the bottom of the screen, displaying the builder's Work at Hand across three distinct positions: Gold (expansion), Silver (capacity), and Bronze (operations).

#### WHERE: Ecosystem

- Was rendered in `NewUiShell.tsx` as `TableBar` component at bottom of shell
- Components: Component - Gold Position, Component - Silver Position, Component - Bronze Position
- Navigated to: Room - Project Board (click Gold/Silver), Bronze stack view

#### WHEN: Timeline

**Implementation status:** Removed (Issue #699)
**Reality note:** The Table was removed per issue #699. Its persistent cross-project visibility function is partially what the Task Queue panel addresses, though with a different scope (tasks not projects, grouped not streamed).

#### Key Design Lessons

- Persistence matters: The Table was always visible. The Task Queue panel is collapsible -- a different persistence model.
- Navigation on click: The Table navigated to Project Board on click. The Task Queue panel should follow this same pattern.
- The Table answered "what am I working on?" The Task Queue panel answers "what tasks remain across my projects?"

## Supporting Cards (summaries)

| Card                                  | Type      | Key Insight                                                                                                                                                                                                                                                                 |
| ------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone - Life Map                       | Zone      | Primary workspace. The Task Queue panel will float over this zone. Life Map renders via `NewUiShell.tsx` which is where the panel should be added.                                                                                                                          |
| Structure - Kanban Board              | Structure | Task flow interface within projects. The Task Queue panel shows a cross-project view of tasks that normally live on per-project kanban boards. WIP limit of 3 per project is relevant context.                                                                              |
| System - Priority Queue Architecture  | System    | Defines how projects are ordered by stream-specific priority. The Task Queue groups by project, not by priority stream -- a simpler model.                                                                                                                                  |
| Component - Bronze Position           | Component | Previously showed a stack of operational tasks on The Table. The Task Queue panel is broader (all tasks, all projects) but Bronze Position's "stack of tasks" pattern is a relevant precedent for compact task display.                                                     |
| Standard - Three-Stream Portfolio     | Standard  | Gold/Silver/Bronze classification. The Task Queue panel groups by project, not by stream. This is a TEMP DECISION -- future iterations may add stream-based grouping or filtering.                                                                                          |
| Principle - Visibility Creates Agency | Principle | "Builders can't control what they can't see." The Task Queue panel increases task visibility across projects. Aligns with the principle's guidance to default to showing, not hiding. The collapsible nature is acceptable because it's opt-in collapse, not opt-in reveal. |

## Relationship Map

- **Task Queue Panel** renders-in `NewUiShell.tsx` (persistent shell component)
- **Task Queue Panel** operates-on Primitive - Task (displays tasks from all projects)
- **Task Queue Panel** operates-on Primitive - Project (groups tasks by project, uses project name)
- **Task Queue Panel** navigates-to Room - Project Board (click task -> `/projects/:projectId`)
- **Task Queue Panel** uses `getAllTasks$` or `getProjectTasks$` queries from `packages/shared/src/livestore/queries.ts`
- **Task Queue Panel** uses `getProjects$` query for project metadata
- Primitive - Task depends-on Primitive - Project (tasks belong to projects via `projectId`)
- `NewUiShell.tsx` contains Task Queue Panel (top-right position, alongside existing header controls)

## Codebase Impact Map

Files that will be created or modified:

| File                                                            | Impact                                                                                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/web/src/components/layout/TaskQueuePanel.tsx`         | **Create** -- new component for the collapsible task queue panel                                                                                                                     |
| `packages/web/src/components/layout/TaskQueuePanel.stories.tsx` | **Create** -- Storybook story with real LiveStore events                                                                                                                             |
| `packages/web/src/components/layout/TaskQueuePanel.test.tsx`    | **Create** -- unit tests for panel logic                                                                                                                                             |
| `packages/web/src/components/layout/NewUiShell.tsx`             | **Edit** -- add TaskQueuePanel rendering in header area (top-right)                                                                                                                  |
| `packages/shared/src/livestore/queries.ts`                      | **Review** -- existing `getAllTasks$` query returns all non-archived tasks; may need a new query for tasks grouped by project with project name join, or handle grouping client-side |

Key existing queries to leverage:

- `getAllTasks$` -- all non-archived tasks, ordered by position
- `getProjects$` -- all projects for metadata (name, category, status)
- `getProjectTasks$` / `getBoardTasks$` -- tasks for a single project (useful reference but panel needs cross-project)

Key patterns to follow:

- `preserveStoreIdInUrl()` for all navigation to project detail pages
- `useQuery()` from `livestore-compat.js` for reactive data queries
- PascalCase component file naming (`TaskQueuePanel.tsx`)
- Tailwind CSS for styling (consistent with `NewUiShell.tsx` patterns)
- `localStorage` for collapsed/expanded state persistence (see `usePersistentChatToggle` as precedent)

## Gap Manifest

| Dimension | Topic                                                   | Searched | Found   | Recommendation                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HOW       | Task filtering logic (which statuses to show)           | Yes      | Partial | Tasks table has statuses: `todo`, `doing`, `in_review`, `done`. The panel should likely show only incomplete tasks (`todo`, `doing`, `in_review`). Not explicitly specified in the issue -- recommend filtering out `done` tasks.                                                                                                                                            |
| HOW       | Panel appearance trigger ("when second project placed") | Yes      | No      | "Second project placed" is ambiguous -- does it mean 2+ projects exist in LiveStore, or 2+ projects with non-done tasks? Recommend: show panel when 2+ projects have at least one non-done, non-archived task.                                                                                                                                                               |
| HOW       | Task ordering within project groups                     | Yes      | No      | Issue does not specify ordering. Recommend: order by task `position` field (existing kanban order) within each project group, and order project groups alphabetically or by most recent activity.                                                                                                                                                                            |
| HOW       | Collapsible state persistence mechanism                 | Yes      | Partial | `usePersistentChatToggle` uses localStorage for chat panel state. Follow same pattern for Task Queue collapsed/expanded state.                                                                                                                                                                                                                                               |
| WHERE     | Exact positioning in header vs. floating panel          | Yes      | No      | Issue says "top-right corner." The header in `NewUiShell.tsx` already has items in the top-right (feedback button, chat toggle, user menu). The Task Queue panel could be: (a) a new header button that toggles a dropdown, or (b) a fixed-position floating panel. Recommend: floating panel overlaying content, toggled by a header button, similar to chat panel pattern. |
| WHAT      | Maximum tasks to show before truncation                 | Yes      | No      | With many projects and tasks, the panel could become very long. Recommend: show top N tasks per project (e.g., 3-5) with a "show all" link that navigates to the project.                                                                                                                                                                                                    |

## WHEN Section Divergences

1. **Room - Project Board WHEN:** Card describes an overlay behavior. Reality is a full-page route at `/projects/:projectId`. The Task Queue panel's "click to navigate" will use full-page navigation, not overlay. This is consistent with current reality but diverges from the design vision.

2. **Overlay - The Table WHEN:** The Table has been removed (Issue #699). The Task Queue panel is not a replacement for The Table -- it serves a different purpose (cross-project task visibility vs. weekly priority commitment). However, it partially fills the "persistent visibility" role The Table served.

3. **Primitive - Task WHEN:** Tasks currently have 4 statuses (`todo`, `doing`, `in_review`, `done`) not the 3 described in the card. The Task Queue panel should use the real 4-status model from the codebase, not the card's idealized 3-state model.
