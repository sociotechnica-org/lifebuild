# Phase 2: Life Category Planning - User Stories

> Purpose: To build the project planning system within Life Categories, enabling operators to create, develop, and prioritize projects through a structured 4-stage process before activation.

This phase introduces the Planning tab with three sub-tabs (Project Creation, Project Plans, Backlog) and implements the complete project planning workflow from initial idea to activation-ready projects. It emphasizes progressive planning with state persistence and intelligent tab selection.

---

## Section 1: Planning Tab Structure & Navigation

### Story 1.1 – Display three main tabs in Life Category view

**User story**: _As an operator, I want to see three main tabs (Planning, Active, Completed) when viewing a Life Category so I can organize and access projects based on their current state._

#### Tasks

- [ ] Routing: Ensure `/category/:categoryId` route supports tab parameter (e.g., `/category/:categoryId?tab=planning`)
- [ ] UI: Create tabbed interface in Life Category view with three tabs: Planning, Active, Completed
- [ ] UI: Selected tab visually distinct (bold, underline, category color accent)
- [ ] UI: Unselected tabs use muted styling
- [ ] Logic: Tab selection persists during session within that category
- [ ] Navigation: Clicking tab updates URL parameter and displays corresponding content
- [ ] DoD: Life Category views display three prominent tabs (Planning, Active, Completed) with clear visual distinction for the active tab.

**Status**:

---

### Story 1.2 – Smart default tab selection

**User story**: _As an operator, I want the system to pre-select the most relevant tab based on my project activity so I immediately see actionable content._

**Dependencies**: Story 1.1

#### Tasks

- [ ] Query: When loading category, check if any projects have `status = 'active'`
- [ ] Logic: If `activeProjectCount > 0`, pre-select Active tab
- [ ] Logic: If `activeProjectCount = 0`, pre-select Planning tab
- [ ] Logic: User can manually override by clicking any tab
- [ ] Logic: Manual tab selection persists for that category during session
- [ ] Logic: Selection logic only applies on initial category entry (not when returning from project detail)
- [ ] DoD: When entering a category, the system automatically selects Active tab if projects are active, otherwise Planning tab, with manual override capability.

**Status**:

---

### Story 1.3 – Display Planning sub-tabs

**User story**: _As an operator, I want to see three sub-tabs within Planning (Project Creation, Project Plans, Backlog) so I can manage different stages of project planning separately._

**Dependencies**: Story 1.1

#### Tasks

- [ ] UI: When Planning tab active, display three sub-tabs: Project Creation, Project Plans, Backlog
- [ ] UI: Sub-tabs positioned below main tabs with smaller, secondary styling
- [ ] UI: Each sub-tab clearly labeled
- [ ] UI: Navigation between sub-tabs is instant (no loading)
- [ ] UI: Visual indicator shows current sub-tab selection (underline or highlight)
- [ ] Logic: Sub-tab selection persists during session within Planning tab
- [ ] DoD: The Planning tab contains three distinct sub-tabs with instant navigation and clear selection indicators.

**Status**:

---

## Section 2: Project Creation Sub-Tab (Stage 1-4)

### Story 2.1 – Create project Stage 1 (Identified)

**User story**: _As an operator, I want to capture a project idea with title, description, and cover image so I can start planning without overthinking details._

**Dependencies**: Story 1.3

#### Tasks

- [ ] Schema: Ensure `projects` table has fields: `title`, `description`, `coverImage`, `planningStage` (1-4), `categoryId`, `status`
- [ ] Event: Define `project.created` event with payload `{ categoryId, title, description, coverImage?, createdAt }`
- [ ] UI: Project Creation sub-tab displays Stage 1 form with fields: Title (required), Description (textarea), Cover Image (upload or AI-generate button)
- [ ] UI: Show stage progress indicator (1/4) at top
- [ ] UI: "Save & Continue to Stage 2" (primary) and "Save Draft" (secondary) buttons
- [ ] Logic: On save, fire `project.created` event, set `status = 'planning'` and `planningStage = 1`
- [ ] Logic: "Save Draft" keeps project at Stage 1, "Save & Continue" advances to Stage 2
- [ ] DoD: Operators can create Stage 1 projects with title, description, and cover image, saving as draft or advancing to Stage 2.

**Status**:

---

### Story 2.2 – Create project Stage 2 (Scoped)

**User story**: _As an operator, I want to define project objective and deadline, and archetype so I establish clear parameters before detailed planning._

**Dependencies**: Story 2.1

#### Tasks

- [ ] Schema: Add fields to `projects`: `objectives` (array/text), `deadline`, `archetype`, `estimatedDuration`, `urgency`, `importance`, `complexity`, `scale`
- [ ] Event: Define `project.stageAdvanced` event with payload `{ projectId, newStage: 2, updatedAt }`
- [ ] UI: Stage 2 form displays: Objective (plain text), Deadline (date picker), Archetype (dropdown: Quick Task, Discovery Mission, Critical Response, Maintenance Loop, System Build, Major Initiative)
- [ ] UI: Include trait selectors: Urgency, Importance, Complexity, Scale (dropdowns with predefined values)
- [ ] UI: Show stage progress indicator (2/4)
- [ ] UI: "Back to Stage 1", "Save Draft", "Continue to Stage 3" buttons
- [ ] Logic: On continue, fire `project.stageAdvanced` event with `newStage = 2`
- [ ] DoD: Operators can define objectives, deadlines, archetype, and traits in Stage 2, with ability to navigate back or advance to Stage 3.

**Status**:

---

### Story 2.3 – Create project Stage 3 (Drafted)

**User story**: _As an operator, I want to review and edit an AI-generated task list so I can ensure the project plan matches my vision._

**Dependencies**: Story 2.2

#### Tasks

- [ ] Event: Define `tasks.generated` event with payload `{ projectId, tasks: Task[], generatedAt }`
- [ ] Logic: On entering Stage 3, trigger AI to generate task list based on Stage 1-2 data (title, objectives, archetype)
- [ ] UI: Stage 3 displays: AI-generated task list (editable), each task shows title, type, estimated duration
- [ ] UI: Operators can add, remove, reorder, or edit tasks
- [ ] UI: Show stage progress indicator (3/4)
- [ ] UI: "Regenerate Tasks" button (asks AI to create new list), "Back to Stage 2", "Save Draft", "Continue to Stage 4" buttons
- [ ] Logic: On continue, fire `project.stageAdvanced` event with `newStage = 3`, tasks associated with project
- [ ] DoD: Operators review an AI-generated task list in Stage 3, with full editing capabilities and the option to regenerate before advancing to Stage 4.

**Status**:

#### Implementation Notes

- **AI Integration**: Initial implementation can use simple template-based task generation based on archetype. Full AI integration with LLM can be added later.
- **Task Schema**: Tasks created here should match the schema from Phase 3, starting in 'todo' status.

---

### Story 2.4 – Create project Stage 4 (Prioritized)

**User story**: _As an operator, I want to set my project's priority relative to other projects so it gets placed appropriately in my backlog._

**Dependencies**: Story 2.3

#### Tasks

- [ ] Schema: Add `priority` field to `projects` table (number representing rank)
- [ ] Query: Create `getProjectsForPrioritization$` query returning all active and backlog projects for category ordered by priority
- [ ] UI: Stage 4 displays list of existing projects with priority ranks
- [ ] UI: Show new project card with drag handle for positioning
- [ ] UI: Operators drag new project into desired position in priority list
- [ ] UI: Show stage progress indicator (4/4)
- [ ] UI: "Back to Stage 3", "Save as Low Priority", "Set Priority & Add to Backlog" buttons
- [ ] Logic: On complete, fire `project.stageAdvanced` event with `newStage = 4` and `project.prioritized` event with priority value
- [ ] DoD: Operators drag their Stage 4 project into priority order relative to existing projects, with visual positioning and clear completion action.

**Status**:

---

### Story 2.5 – Move Stage 4 project to Backlog

**User story**: _As an operator, I want Stage 4 completed projects to automatically move to the Backlog sub-tab so they're ready for activation._

**Dependencies**: Story 2.4

#### Tasks

- [ ] Event: Define `project.movedToBacklog` event with payload `{ projectId, movedAt }`
- [ ] Logic: After completing Stage 4, trigger `project.movedToBacklog` event
- [ ] Logic: Set project `status = 'backlog'` (remains distinct from 'planning' and 'active')
- [ ] UI: Show confirmation modal: "Ready to add [Project Name] to your backlog?"
- [ ] UI: Modal options: "Add to Backlog" (primary), "Keep Planning" (secondary), "Cancel"
- [ ] UI: On add, project moves from Project Plans to Backlog sub-tab
- [ ] UI: Toast notification: "[Project] added to backlog at position #X"
- [ ] DoD: Completing Stage 4 prompts the operator to move the project to Backlog, which changes its status and relocates it to the Backlog sub-tab.

**Status**:

---

## Section 3: Project Plans Sub-Tab

### Story 3.1 – Display in-progress project plans

**User story**: _As an operator, I want to see all in-progress project plans (Stages 1-3) so I can continue developing incomplete plans._

**Dependencies**: Story 1.3, Story 2.1

#### Tasks

- [ ] Query: Create `getProjectPlansInProgress$` query filtering projects where `status = 'planning'` and `planningStage < 4`
- [ ] UI: Project Plans sub-tab displays cards for all in-progress projects
- [ ] UI: Each card shows: Cover image (thumbnail), Title, Current stage indicator (1/4, 2/4, or 3/4), Last modified date
- [ ] UI: "Continue Planning" button on each card
- [ ] UI: Empty state: "No projects in planning. Start a new project in Project Creation."
- [ ] DoD: The Project Plans sub-tab shows all projects in Stages 1-3 with clear stage indicators and last modified dates.

**Status**:

---

### Story 3.2 – Resume project planning with persistence

**User story**: _As an operator, I want to click a project plan to resume at exactly where I left off so I can continue work without losing context._

**Dependencies**: Story 3.1

#### Tasks

- [ ] UI: Clicking project card in Project Plans opens Project Creation sub-tab at the project's current stage
- [ ] Logic: Load all previously entered data (title, description, cover, objectives, tasks, etc.)
- [ ] Logic: Scroll position and form state preserved from last session
- [ ] UI: Stage indicator updates to show current position (e.g., highlights Stage 2 if that's where user left off)
- [ ] Logic: "Picking up" a plan automatically "puts down" any previously active plan (saves its state)
- [ ] DoD: Clicking a project in Project Plans reopens it at its exact stage with all data preserved, enabling seamless continuation.

**Status**:

#### Implementation Notes

- **State Management**: Consider using browser localStorage or database to persist form state, scroll position, and cursor location for optimal resume experience.
- **Single Active Plan**: Only one project plan can be "picked up" at a time per category to maintain focus.

---

### Story 3.3 – Update project plan card visuals as stage progresses

**User story**: _As an operator, I want project plan cards to visually reflect their progress through stages so I can see development at a glance._

**Dependencies**: Story 3.1, Story 2.1, Story 2.2, Story 2.3

#### Tasks

- [ ] UI: Stage 1-2 cards show: Title, Description preview (2 lines), Cover thumbnail
- [ ] UI: Stage 3 cards additionally show: Task count preview (e.g., "8 tasks")
- [ ] UI: Stage 4 cards show: Full plan summary with archetype badge, priority indicator
- [ ] UI: Stage progress bar or indicator updates color/fill as stage advances
- [ ] Logic: Card appearance updates in real-time as user advances through stages
- [ ] DoD: Project plan cards in the Project Plans sub-tab dynamically update their visual representation as they progress from Stage 1 to Stage 4.

**Status**:

---

### Story 3.4 – Archive or delete abandoned project plans

**User story**: _As an operator, I want to archive or delete project plans I'm no longer interested in so my Project Plans view stays focused._

**Dependencies**: Story 3.1

#### Tasks

- [ ] Event: Define `project.abandoned` event with payload `{ projectId, abandonedAt }`
- [ ] UI: Add "⋮" menu button on project plan cards
- [ ] UI: Menu options: "Archive Plan", "Delete Plan"
- [ ] UI: "Archive Plan" confirmation: "Archive [Project]? You can restore it later."
- [ ] UI: "Delete Plan" confirmation: "Delete [Project]? This cannot be undone." (shows warning if project has tasks or documents)
- [ ] Logic: Archive sets `archivedAt` timestamp, removes from Project Plans view
- [ ] Logic: Delete fires project deletion event, permanently removes
- [ ] UI: Show "View Archived Plans" link in Project Plans header with count
- [ ] DoD: Operators can archive or delete project plans from the Project Plans sub-tab with appropriate confirmations and warnings.

**Status**:

---

### Story 3.5 – Indicate idle project plans

**User story**: _As an operator, I want to see which project plans haven't been touched in a while so I can decide whether to resume or abandon them._

**Dependencies**: Story 3.1

#### Tasks

- [ ] Query: Calculate days since `lastModifiedAt` for each project plan
- [ ] UI: Plans idle >7 days show visual indicator (amber dot or "Stale" badge)
- [ ] UI: Plans idle >30 days show stronger indicator (red dot or "Abandoned?" badge)
- [ ] UI: Hover tooltip shows: "Last worked on [date]" with suggestion "Resume or archive?"
- [ ] UI: Sort option in Project Plans header: "Recently Modified" (default), "Oldest First", "By Stage"
- [ ] DoD: Project plan cards show visual indicators for plans idle more than 7 or 30 days, with tooltips and sorting options to surface neglected work.

**Status**:

---

## Section 4: Backlog Sub-Tab

### Story 4.1 – Display backlog projects in priority order

**User story**: _As an operator, I want to see all Stage 4 projects awaiting activation in priority order so I can review my pipeline._

**Dependencies**: Story 2.5

#### Tasks

- [ ] Query: Create `getBacklogProjects$` query filtering projects where `status = 'backlog'` ordered by `priority`
- [ ] UI: Backlog sub-tab displays project cards in vertical list
- [ ] UI: Each card shows: Cover thumbnail, Title, Archetype badge, Estimated duration, Objectives preview (2 lines)
- [ ] UI: Cards numbered with priority position (#1, #2, #3...)
- [ ] UI: Empty state: "No projects in backlog. Complete Stage 4 planning to add projects here."
- [ ] DoD: The Backlog sub-tab shows all completed project plans in priority order with key details visible on each card.

**Status**:

---

### Story 4.2 – Reorder backlog projects

**User story**: _As an operator, I want to change the priority order of backlog projects so I can adapt as circumstances change._

**Dependencies**: Story 4.1

#### Tasks

- [ ] Event: Define `project.reprioritized` event with payload `{ projectId, newPriority, reprioritizedAt }`
- [ ] UI: Enable drag-and-drop on backlog project cards (vertical reordering)
- [ ] UI: Show blue line indicator at drop position
- [ ] UI: Other cards shift to show insertion point
- [ ] Logic: On drop, fire `project.reprioritized` event updating `priority` values for affected projects
- [ ] Logic: Priority order persists across sessions
- [ ] UI: Subtle toast: "[Project] moved to position #X"
- [ ] DoD: Operators can drag backlog projects to reorder priority, with visual feedback and persistent changes.

**Status**:

---

### Story 4.3 – Activate backlog project to Active state

**User story**: _As an operator, I want to activate a backlog project so it moves to the Active tab and I can start working on tasks._

**Dependencies**: Story 4.1

#### Tasks

- [ ] Event: Define `project.activated` event with payload `{ projectId, activatedAt }`
- [ ] UI: Add "Activate" button on backlog project cards
- [ ] UI: Confirmation modal: "Activate [Project Name]? It will move to your Active projects."
- [ ] UI: Modal shows: Project title, archetype, task count, estimated duration
- [ ] Logic: On confirm, fire `project.activated` event, set `status = 'active'`, set `activatedAt` timestamp
- [ ] Logic: Project removed from Backlog sub-tab
- [ ] Logic: Project appears in Active tab
- [ ] UI: Toast: "[Project] is now active! Start working on tasks."
- [ ] DoD: Backlog projects can be activated with confirmation, moving them from Backlog to Active tab and enabling task work.

**Status**:

---

### Story 4.4 – Edit backlog project details

**User story**: _As an operator, I want to edit backlog project details before activation so I can refine plans without going back to planning stages._

**Dependencies**: Story 4.1

#### Tasks

- [ ] UI: Add "Edit" icon button on backlog project cards
- [ ] UI: Clicking edit opens project in Project Creation sub-tab at Stage 2
- [ ] UI: All stages (2-4) remain editable
- [ ] Logic: Saving returns to Backlog sub-tab with "Updated" badge on card (persists 24 hours)
- [ ] Logic: Priority position preserved unless manually changed
- [ ] DoD: Operators can edit backlog projects, reopening them in the planning interface with all stages editable, then returning to Backlog.

**Status**:

---

### Story 4.5 – Filter and search backlog projects

**User story**: _As an operator, I want to filter and search my backlog so I can find specific projects quickly._

**Dependencies**: Story 4.1

#### Tasks

- [ ] UI: Add search bar at top of Backlog sub-tab
- [ ] Query: Create `searchBacklogProjects$` query searching `title` and `objectives` fields
- [ ] UI: Add filter dropdown: All Archetypes, By Deadline (Next Week, Next Month, No Deadline), By Importance
- [ ] Logic: Search with debounce (300ms) as user types
- [ ] UI: Display count: "Showing X of Y backlog projects"
- [ ] UI: Clear button (X) resets search and filters
- [ ] DoD: Operators can search and filter backlog projects by text, archetype, deadline, and importance with live results.

**Status**:

---

## Technical Implementation Notes

### Database Schema

```typescript
// Projects table additions for planning
projects: {
  // ... existing fields
  status: 'planning' | 'backlog' | 'active' | 'completed' | 'archived'
  planningStage: 1 | 2 | 3 | 4 // Only relevant when status = 'planning'
  title: string
  description: string
  coverImage?: string
  objectives: string // JSON array or newline-separated
  deadline?: number
  archetype: 'quicktask' | 'discovery' | 'critical' | 'maintenance' | 'systembuild' | 'initiative'
  estimatedDuration?: number
  urgency: 'low' | 'normal' | 'high' | 'critical'
  importance: 'low' | 'normal' | 'high' | 'critical'
  complexity: 'simple' | 'complicated' | 'complex' | 'chaotic'
  scale: 'micro' | 'minor' | 'major' | 'epic'
  priority: number // Lower number = higher priority
  lastModifiedAt: number
  movedToBacklogAt?: number
  activatedAt?: number
  abandonedAt?: number
}
```

### Event System

```typescript
type PlanningEvent =
  | {
      type: 'project.created'
      categoryId: string
      title: string
      description: string
      coverImage?: string
      createdAt: number
    }
  | { type: 'project.stageAdvanced'; projectId: string; newStage: 1 | 2 | 3 | 4; updatedAt: number }
  | { type: 'tasks.generated'; projectId: string; tasks: Task[]; generatedAt: number }
  | { type: 'project.prioritized'; projectId: string; priority: number; prioritizedAt: number }
  | { type: 'project.movedToBacklog'; projectId: string; movedAt: number }
  | { type: 'project.reprioritized'; projectId: string; newPriority: number; reprioritizedAt: number }
  | { type: 'project.activated'; projectId: string; activatedAt: number }
  | { type: 'project.abandoned'; projectId: string; abandonedAt: number }
```

### State Management Patterns

- **Single Active Plan**: Only one project plan can be "picked up" at a time within a category. Opening a new plan auto-saves the previous plan's state.
- **Stage Persistence**: All form data, scroll position, and UI state should persist when switching between plans or leaving the planning interface.
- **Real-time Updates**: Project plan cards should reactively update as stage progresses without page refresh.

### Testing Strategy

- **Unit Tests**: Stage validation logic, priority calculation, query filters
- **Integration Tests**: Full planning flow (Stage 1 → 2 → 3 → 4 → Backlog), resume planning from any stage, backlog activation
- **E2E Tests**: Create project through all stages → Add to backlog → Edit backlog project → Activate → Verify in Active tab

---

## Story Summary

### Section 1: Planning Tab Structure & Navigation (3 stories)

Stories 1.1-1.3 establish the three-tab Life Category structure with smart default selection and Planning sub-tabs for organizing project development.

### Section 2: Project Creation Sub-Tab (5 stories)

Stories 2.1-2.5 implement the 4-stage project planning workflow from initial idea through prioritization and backlog placement.

### Section 3: Project Plans Sub-Tab (5 stories)

Stories 3.1-3.5 enable managing in-progress plans with full persistence, visual stage indicators, and options to archive or delete abandoned work.

### Section 4: Backlog Sub-Tab (5 stories)

Stories 4.1-4.5 provide priority-ordered backlog management with reordering, activation, editing, and filtering capabilities.

**Total: 18 user stories**
