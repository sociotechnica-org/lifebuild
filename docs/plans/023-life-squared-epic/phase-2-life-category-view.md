# Phase 2: Life Category Planning - User Stories

> Purpose: To build the project planning system within Life Categories, enabling operators to create, develop, and prioritize projects through a structured 4-stage process before activation.

This phase introduces the Planning tab with three sub-tabs (Project Creation, Project Plans, Backlog) and implements the complete project planning workflow from initial idea to activation-ready projects. It emphasizes progressive planning with state persistence and intelligent tab selection.

## Progress Overview

- ✅ **Section 1: Planning Tab Structure & Navigation** (Stories 1.1-1.3) - COMPLETED in PR #246 (merged 2025-10-17)
- 🔄 **Section 2: Project Creation Sub-Tab** (Stories 2.1-2.7) - IN PROGRESS
  - ✅ Story 2.1 (Stage 1) - COMPLETED in PR #250 (merged 2025-10-17)
  - 🔄 Story 2.2 (Cover Upload) - IN PROGRESS in PR #252
  - ⏸️ Story 2.3 (AI Cover) - NOT STARTED
  - ✅ Story 2.4 (Stage 2) - COMPLETED in PR #250 (merged 2025-10-17)
  - ⏸️ Story 2.5 (Stage 3) - NOT STARTED
  - ⏸️ Story 2.6 (Stage 4) - NOT STARTED
  - ⏸️ Story 2.7 (Move to Backlog) - NOT STARTED
- ⏸️ **Section 3: Project Plans Sub-Tab** (Stories 3.1-3.5) - NOT STARTED
- ⏸️ **Section 4: Backlog Sub-Tab** (Stories 4.1-4.5) - NOT STARTED

---

## Section 1: Planning Tab Structure & Navigation

### Story 1.1 – Display three main tabs in Life Category view

**User story**: _As an operator, I want to see three main tabs (Planning, Active, Completed) when viewing a Life Category so I can organize and access projects based on their current state._

#### Tasks

- [x] Routing: Ensure `/category/:categoryId` route supports tab parameter (e.g., `/category/:categoryId?tab=planning`)
- [x] UI: Create tabbed interface in Life Category view with three tabs: Planning, Active, Completed
- [x] UI: Selected tab visually distinct (bold, underline, category color accent)
- [x] UI: Unselected tabs use muted styling
- [x] Logic: Tab selection persists during session within that category
- [x] Navigation: Clicking tab updates URL parameter and displays corresponding content
- [x] DoD: Life Category views display three prominent tabs (Planning, Active, Completed) with clear visual distinction for the active tab.

**Status**: ✅ **COMPLETED** in PR#246 (merged 2025-10-17)

---

### Story 1.2 – Smart default tab selection

**User story**: _As an operator, I want the system to pre-select the most relevant tab based on my project activity so I immediately see actionable content._

**Dependencies**: Story 1.1

#### Tasks

- [x] Query: When loading category, check if any projects have `status = 'active'`
- [x] Logic: If `activeProjectCount > 0`, pre-select Active tab
- [x] Logic: If `activeProjectCount = 0`, pre-select Planning tab
- [x] Logic: User can manually override by clicking any tab
- [x] Logic: Manual tab selection persists for that category during session
- [x] Logic: Selection logic only applies on initial category entry (not when returning from project detail)
- [x] DoD: When entering a category, the system automatically selects Active tab if projects are active, otherwise Planning tab, with manual override capability.

**Status**: ✅ **COMPLETED** in PR#246 (merged 2025-10-17)

---

### Story 1.3 – Display Planning sub-tabs

**User story**: _As an operator, I want to see three sub-tabs within Planning (Project Creation, Project Plans, Backlog) so I can manage different stages of project planning separately._

**Dependencies**: Story 1.1

#### Tasks

- [x] UI: When Planning tab active, display three sub-tabs: Project Creation, Project Plans, Backlog
- [x] UI: Sub-tabs positioned below main tabs with smaller, secondary styling
- [x] UI: Each sub-tab clearly labeled
- [x] UI: Navigation between sub-tabs is instant (no loading)
- [x] UI: Visual indicator shows current sub-tab selection (underline or highlight)
- [x] Logic: Sub-tab selection persists during session within Planning tab
- [x] DoD: The Planning tab contains three distinct sub-tabs with instant navigation and clear selection indicators.

**Status**: ✅ **COMPLETED** in PR#246 (merged 2025-10-17)

---

## Section 2: Project Creation Sub-Tab (Stage 1-4)

**Implementation Strategy**: Breaking into small, focused PRs for easier review:

- **PR #1**: Stories 2.1 + 2.4 (Stage 1 & 2) - Schema, events, basic planning forms
- **PR #2**: Story 2.5 (Stage 3) - Task planning integration
- **PR #3**: Stories 2.6 + 2.7 (Stage 4 & Backlog transition) - Priority + status changes
- **PR #4**: Stories 2.2 + 2.3 (Cover images) - Upload + AI generation

---

### Story 2.1 – Create project Stage 1 (Identified)

**User story**: _As an operator, I want to capture a project idea with title and description so I can start planning without overthinking details._

**Dependencies**: Story 1.3

#### Tasks

- [x] Schema: Use PR4 schema with `projects.attributes` containing `status`, `planningStage` fields
- [x] Event: Use existing `v2.ProjectCreated` event with `category` field
- [x] UI: Project Creation sub-tab displays Stage 1 form with fields: Title (required), Description (textarea)
- [x] UI: Show stage progress indicator (1/4) at top
- [x] UI: "Save & Continue to Stage 2" (primary) and "Save Draft" (secondary) buttons
- [x] Logic: On save, commit `projectCreated` event with `attributes: { status: 'planning', planningStage: 1 }`
- [x] Logic: "Save Draft" keeps project at Stage 1, "Save & Continue" advances to Stage 2
- [x] DoD: Operators can create Stage 1 projects with title and description, saving as draft or advancing to Stage 2.

**Status**: ✅ **Completed in PR #250** (merged 2025-10-17)

---

### Story 2.2 – Add cover image via upload

**User story**: _As an operator, I want to upload a cover image for my project so I can visually distinguish projects at a glance._

**Dependencies**: Story 2.1

#### Tasks

- [x] Schema: Add `coverImage` field to `projects.attributes` JSON (stores R2 URL or key)
- [x] Event: Create `v1.ProjectCoverImageSet` event with payload `{ projectId, coverImageUrl, updatedAt, actorId }`
- [x] Backend: Set up Cloudflare R2 bucket for image storage (production)
- [x] Backend: Configure local development setup using Wrangler R2 preview or local file storage
- [x] API: Create image upload endpoint that accepts file, uploads to R2, returns URL
- [x] UI: Add "Upload Cover Image" button in Stage 1 form (optional field)
- [x] UI: Show image preview after upload with option to remove/replace
- [x] Logic: On upload, commit `projectCoverImageSet` event with R2 URL
- [x] DoD: Operators can upload cover images that are stored in R2 and displayed on project cards.

**Status**: 🔄 **In Progress in PR #252**

#### Implementation Notes

**Local Development Setup for R2:**

- Use Wrangler's local R2 preview: `wrangler r2 bucket create work-squared-images-local`
- Or fallback to local filesystem storage during development
- Images uploaded in local development won't persist to production R2

---

### Story 2.3 – AI-generate cover image

**User story**: _As an operator, I want to AI-generate a cover image for my project so I can quickly add visual appeal without sourcing images._

**Dependencies**: Story 2.2

#### Tasks

- [ ] API: Integrate with image generation service (DALL-E, Midjourney, or Stable Diffusion)
- [ ] Logic: Generate prompt from project title + description (e.g., "A minimalist icon representing [project title]")
- [ ] UI: Add "AI Generate Image" button in Stage 1 form alongside upload button
- [ ] UI: Show loading state while generating (typically 5-15 seconds)
- [ ] UI: Display generated image with "Regenerate" and "Accept" options
- [ ] Logic: On accept, upload generated image to R2 and commit `projectCoverImageSet` event
- [ ] DoD: Operators can AI-generate cover images that are stored in R2 and displayed on project cards.

**Status**:

---

### Story 2.4 – Create project Stage 2 (Scoped)

**User story**: _As an operator, I want to define project objective, deadline, archetype, and traits so I establish clear parameters before detailed planning._

**Dependencies**: Story 2.1

#### Tasks

- [x] Schema: Add fields to `projects.attributes`: `objectives`, `deadline`, `archetype`, `estimatedDuration`, `urgency`, `importance`, `complexity`, `scale`
- [x] Event: Use `v2.ProjectAttributesUpdated` event with payload `{ projectId, attributes, updatedAt, actorId }`
- [x] UI: Stage 2 form displays: Objective (plain text), Deadline (date picker)
- [x] UI: Trait selectors: Urgency, Importance, Complexity, Scale (dropdowns with predefined values)
- [x] UI: Archetype selector (dropdown: Quick Task, Discovery Mission, Critical Response, Maintenance Loop, System Build, Major Initiative)
- [x] UI: Show stage progress indicator (2/4)
- [x] UI: "Back to Stage 1", "Save Draft", "Continue to Stage 3" buttons
- [x] Logic: On continue, commit `projectAttributesUpdated` event with `planningStage: 2` and all Stage 2 fields
- [x] DoD: Operators can define objectives, deadlines, traits, and archetype in Stage 2, with ability to navigate back or advance to Stage 3.

**Status**: ✅ **Completed in PR #250** (merged 2025-10-17)

#### Implementation Notes

- Traits influence archetype suggestion, but archetype can be manually overridden
- Archetype and traits relationship may be refined in future iterations

---

### Story 2.5 – Create project Stage 3 (Drafted - Task Planning)

**User story**: _As an operator, I want to plan my project tasks using the existing project page so I can leverage familiar tools and workflows._

**Dependencies**: Story 2.4

#### Tasks

- [ ] UI: Stage 3 displays message: "Now let's plan your tasks" with "Open Project" button
- [ ] Navigation: "Open Project" button navigates to existing project detail page (kanban board)
- [ ] UI: Project page shows existing task management interface (from current Work Squared)
- [ ] UI: Add "Approve Plan" or "Done Planning" button to project page header (visible when `planningStage = 3`)
- [ ] Event: Use `v1.ProjectAttributesUpdated` to update `planningStage: 4` when approved
- [ ] UI: Show stage progress indicator (3/4) on project page when in planning mode
- [ ] Logic: On approve, commit event advancing to Stage 4, navigate back to Planning tab
- [ ] DoD: Operators navigate to the existing project page to plan tasks, then approve the plan to advance to Stage 4.

**Status**:

---

### Story 2.6 – Create project Stage 4 (Prioritized)

**User story**: _As an operator, I want to set my project's priority relative to other projects so it gets placed appropriately in my backlog._

**Dependencies**: Story 2.5

#### Tasks

- [ ] Schema: Add `priority` field to `projects.attributes` (number representing rank)
- [ ] Query: Filter projects by category and `attributes.status = 'backlog'`, order by `attributes.priority`
- [ ] UI: Stage 4 displays list of existing backlog projects with priority ranks
- [ ] UI: Show new project card with drag handle for positioning
- [ ] UI: Operators drag new project into desired position in priority list
- [ ] UI: Show stage progress indicator (4/4)
- [ ] UI: "Back to Stage 3", "Save as Low Priority", "Set Priority & Add to Backlog" buttons
- [ ] Logic: On complete, commit `projectAttributesUpdated` event with `planningStage: 4` and `priority` value
- [ ] DoD: Operators drag their Stage 4 project into priority order relative to existing projects, with visual positioning and clear completion action.

**Status**:

---

### Story 2.7 – Move Stage 4 project to Backlog

**User story**: _As an operator, I want Stage 4 completed projects to automatically move to the Backlog sub-tab so they're ready for activation._

**Dependencies**: Story 2.6

#### Tasks

- [ ] Logic: After completing Stage 4, update `attributes.status = 'backlog'` via `projectAttributesUpdated` event
- [ ] UI: Show confirmation modal: "Ready to add [Project Name] to your backlog?"
- [ ] UI: Modal options: "Add to Backlog" (primary), "Keep Planning" (secondary), "Cancel"
- [ ] UI: On add, commit event updating status to 'backlog'
- [ ] UI: Project moves from Project Plans to Backlog sub-tab (filtered by status)
- [ ] UI: Toast notification: "[Project] added to backlog at position #X"
- [ ] DoD: Completing Stage 4 prompts the operator to move the project to Backlog, which changes its status and relocates it to the Backlog sub-tab.

**Status**:

---

## Section 3: Project Plans Sub-Tab

### Story 3.1 – Display in-progress project plans

**User story**: _As an operator, I want to see all in-progress project plans (Stages 1-3) so I can continue developing incomplete plans._

**Dependencies**: Story 1.3, Story 2.1

#### Tasks

- [ ] Query: Filter projects by category and `attributes.status = 'planning'` and `attributes.planningStage < 4`
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

- [ ] Event: Use existing `v1.ProjectArchived` event (sets `archivedAt` timestamp)
- [ ] UI: Add "⋮" menu button on project plan cards
- [ ] UI: Menu options: "Archive Plan", "Delete Plan"
- [ ] UI: "Archive Plan" confirmation: "Archive [Project]? You can restore it later."
- [ ] UI: "Delete Plan" confirmation: "Delete [Project]? This cannot be undone." (shows warning if project has tasks or documents)
- [ ] Logic: Archive commits event setting `archivedAt` timestamp, removes from Project Plans view
- [ ] Logic: Delete updates `deletedAt` timestamp (soft delete), permanently removes from view
- [ ] UI: Show "View Archived Plans" link in Project Plans header with count
- [ ] DoD: Operators can archive or delete project plans from the Project Plans sub-tab with appropriate confirmations and warnings.

**Status**:

---

### Story 3.5 – Indicate idle project plans

**User story**: _As an operator, I want to see which project plans haven't been touched in a while so I can decide whether to resume or abandon them._

**Dependencies**: Story 3.1

#### Tasks

- [ ] Query: Calculate days since `updatedAt` for each project plan
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

- [ ] Query: Filter projects by category and `attributes.status = 'backlog'`, order by `attributes.priority`
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

- [ ] Event: Use `v1.ProjectAttributesUpdated` to update `attributes.priority` field
- [ ] UI: Enable drag-and-drop on backlog project cards (vertical reordering)
- [ ] UI: Show blue line indicator at drop position
- [ ] UI: Other cards shift to show insertion point
- [ ] Logic: On drop, commit event updating `priority` values for affected projects
- [ ] Logic: Priority order persists across sessions
- [ ] UI: Subtle toast: "[Project] moved to position #X"
- [ ] DoD: Operators can drag backlog projects to reorder priority, with visual feedback and persistent changes.

**Status**:

---

### Story 4.3 – Activate backlog project to Active state

**User story**: _As an operator, I want to activate a backlog project so it moves to the Active tab and I can start working on tasks._

**Dependencies**: Story 4.1

#### Tasks

- [ ] Event: Use `v1.ProjectAttributesUpdated` to update `attributes.status = 'active'` and `attributes.activatedAt`
- [ ] UI: Add "Activate" button on backlog project cards
- [ ] UI: Confirmation modal: "Activate [Project Name]? It will move to your Active projects."
- [ ] UI: Modal shows: Project title, archetype, task count, estimated duration
- [ ] Logic: On confirm, commit event setting `status = 'active'` and `activatedAt` timestamp
- [ ] Logic: Project removed from Backlog sub-tab (filtered by status)
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
- [ ] Query: Filter projects client-side by searching `name` and `attributes.objectives` fields
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
// Projects table (PR4 schema)
projects: {
  id: string
  name: string // Project title
  description: string | null
  category: string | null // 'health' | 'relationships' | 'finances' | etc.
  attributes: {
    // Planning workflow
    status?: 'planning' | 'backlog' | 'active' | 'completed'
    planningStage?: 1 | 2 | 3 | 4 // Only relevant when status = 'planning'

    // Stage 1 fields
    coverImage?: string // R2 URL

    // Stage 2 fields
    objectives?: string
    deadline?: number
    archetype?: 'quicktask' | 'discovery' | 'critical' | 'maintenance' | 'systembuild' | 'initiative'
    estimatedDuration?: number
    urgency?: 'low' | 'normal' | 'high' | 'critical'
    importance?: 'low' | 'normal' | 'high' | 'critical'
    complexity?: 'simple' | 'complicated' | 'complex' | 'chaotic'
    scale?: 'micro' | 'minor' | 'major' | 'epic'

    // Stage 4 fields
    priority?: number // Lower number = higher priority

    // Activity tracking
    activatedAt?: number
    lastActivityAt?: number
  } | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  archivedAt: number | null
}
```

### Event System

```typescript
// Use existing v1.ProjectCreated event with category field
export const projectCreated = Events.synced({
  name: 'v1.ProjectCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String),
    category: Schema.optional(Schema.String), // Category id
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// New event for updating project attributes (planning stages, status, etc.)
export const projectAttributesUpdated = Events.synced({
  name: 'v1.ProjectAttributesUpdated',
  schema: Schema.Struct({
    projectId: Schema.String,
    attributes: Schema.Record({ key: Schema.String, value: Schema.Unknown }), // Full attributes replacement
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// New event for cover image uploads
export const projectCoverImageSet = Events.synced({
  name: 'v1.ProjectCoverImageSet',
  schema: Schema.Struct({
    projectId: Schema.String,
    coverImageUrl: Schema.String, // R2 URL
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// Materializer examples
'v1.ProjectAttributesUpdated': ({ projectId, attributes, updatedAt }) => [
  projects.update({
    attributes, // Replace entire attributes object
    updatedAt
  }).where({ id: projectId }),
]

'v1.ProjectCoverImageSet': ({ projectId, coverImageUrl, updatedAt }) => {
  // Read current attributes, merge in coverImage, update project
  // Implementation handled by materializer logic
}
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

### Section 2: Project Creation Sub-Tab (7 stories)

Stories 2.1-2.7 implement the 4-stage project planning workflow from initial idea through prioritization and backlog placement, including cover image upload and AI generation.

### Section 3: Project Plans Sub-Tab (5 stories)

Stories 3.1-3.5 enable managing in-progress plans with full persistence, visual stage indicators, and options to archive or delete abandoned work.

### Section 4: Backlog Sub-Tab (5 stories)

Stories 4.1-4.5 provide priority-ordered backlog management with reordering, activation, editing, and filtering capabilities.

**Total: 20 user stories** (was 18, added 2 cover image stories)
