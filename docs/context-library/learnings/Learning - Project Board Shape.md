# Learning - Project Board Shape

## Divergence

**Vision:** The Project Board is an overlay or room within the Life Map where builders manage a single project's tasks via a Kanban board. A Project Guide agent provides project-specific guidance. The board renders as three columns (To Do, In Progress, Done) with WIP limits.

**Reality:** The Project Board is a full-page route (`/project/:id`) with its own layout, not an overlay. It uses a **Project Guide** agent (dynamically created per project via `createProjectRoomDefinition()`) — the settled pattern for project-specific assistance. The Kanban board has four columns (To Do, In Progress, In Review, Done) instead of three — an `in_review` status was added. No WIP limits are enforced.

## Why It Matters

Three distinct divergences in one room:

### 1. Full page vs overlay

The card says overlay; reality is a standalone route. This affects navigation flow — the builder leaves the Life Map context to enter a project, rather than opening a panel over it. This may be an intentional UX decision (more screen real estate for the board) or a pragmatic MVP choice.

### 2. Project Guide pattern

Each project gets its own dynamically-created Project Guide agent via `createProjectRoomDefinition()` in `rooms.ts`. The Project Guide is scoped to that specific project's context and provides project-specific help. This is the settled pattern for project-specific assistance.

### 3. Four columns vs three

The Kanban has an extra `in_review` status column. The Task primitive card describes three statuses (pending, in_progress, completed). Reality adds `in_review` between in_progress and completed. This supports a review/QA step before marking work done.

## Implications

- The **Project Guide** agent pattern should probably get its own card — it's a meaningful architectural pattern where agents are dynamically created per entity.
- The `in_review` task status should be reflected in the Task primitive card (already noted in Status Audit).
- The Kanban board's [[Standard - Three-Stream Portfolio]] describes WIP limits that aren't implemented. This is a Post-MVP feature.
- Builders referencing the Project Board card should check the actual route structure and component tree.

## When This Closes

When deliberate decisions are made about: (1) page vs overlay (may stay as-is), (2) Project Guide gets documented (new card or update to Project Board card), (3) Task primitive card updated to reflect four statuses.
