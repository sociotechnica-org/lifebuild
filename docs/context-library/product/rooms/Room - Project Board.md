# Room - Project Board

## WHAT: Definition

The detail overlay that opens when a director clicks any project tile — a focused view showing everything about a single project: description, objectives, tasks, progress, history, and available actions. The Project Board is where detailed work happens.

## WHERE: Ecosystem

- Zone: [[Zone - Life Map]] — opens as overlay
- Agent: [[System - Category Advisors]] — in-context consultation available
- Artifacts:
  - [[Primitive - Project]] — all project details
  - [[Primitive - Task]] — task list within project
- Structures:
  - [[Structure - Kanban Board]] — task flow interface
- Capabilities:
  - Task completion, objective tracking, project pausing
- Adjacent:
  - [[Room - System Board]] — same pattern for systems
  - [[Room - Sorting Room]] — cross-project priority decisions
  - [[Room - Roster Room]] — delegation context
- Conforms to:
  - [[Standard - Project States]] — shows current state, enables transitions
  - [[Standard - Image Evolution]] — shows current illustration stage
  - [[Standard - Visual Language]] — project state indicators, category colors
- Implements: [[Strategy - Superior Process]] — detailed work needs detailed view

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — detailed work needs detailed view
- Principle: [[Principle - Familiarity Over Function]] — board metaphor feels natural for project management
- Driver: Directors need to work on projects, not just see them. The Project Board is the workspace within the workspace.
- Constraints: Project Board is for working within a single project. Cross-project decisions happen on [[Overlay - The Table]] and in the [[Room - Sorting Room]], not here. Overlay behavior preserves spatial context.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Project detail exists at `/projects/:projectId` via `ProjectDetailPage.tsx` with a dynamically-created Project Guide agent (not a Category Advisor). Tasks display with status-based kanban (`todo`, `doing`, `in_review`, `done`). However, it's a full-page route, not an overlay over the Life Map as described. No image evolution, no hex grid overlay behavior. Project Guide was a quick patch to give directors in-project help before Category Advisors were accessible.

Core to [[Zone - Life Map]] design. Project Board is where most execution work happens.

## HOW: Implementation

**Contents:**

- Header: Title, project illustration, state indicator, category
- Description: What this project is
- Objectives: What success looks like
- Tasks: The work to be done (checkable)
- Progress: Completion status, time tracking
- History: Recent activity, state transitions
- Actions: Pause, complete, add task, edit

**Overlay behavior:**

- Opens over [[Zone - Life Map]] (grid visible behind, dimmed)
- Close to return to grid
- Can navigate directly to other Project Boards

**Category Advisor access:**

- Subtle indicator when advisor available
- Click to open in-context consultation
- Conversation logs to advisor's Strategy Studio thread

**Task management:**

- Add tasks
- Check off completed
- Reorder
- Delegate (opens [[Room - Roster Room]] context)

### Examples

- Director clicks "Home Renovation" tile on [[Structure - Hex Grid]] → Project Board opens as overlay ([[Zone - Life Map]] dimmed behind) → shows title, illustration, state indicator, 8 tasks, 3 completed → director checks off "Get contractor quotes" → progress updates → director closes overlay → returns to [[Zone - Life Map]] at exact same position and zoom.
- Director sees Maya's indicator on a Health project board → clicks → asks about exercise frequency for their recovery plan → Maya responds drawing on past Health Studio conversations → consultation logged to Health Studio thread → unified history regardless of entry point.

### Anti-Examples

- **Project Board replacing [[Zone - Life Map]] entirely when opened** — it's an overlay, not a navigation event. The [[Zone - Life Map]] stays visible (dimmed) behind, maintaining spatial context. The director should feel like they opened a drawer, not left the room.
- **Showing identical detail density for all project states** — a Planning-state project shows objectives and scope questions. A Live project shows tasks and progress. A Completed project shows outcomes and learnings. Detail matches lifecycle state.
