# Phase 2: Life Category Planning - User Stories

> Purpose: To build the project planning system within Life Categories, enabling operators to create, develop, and prioritize projects through a structured 4-stage process before activation.

This phase introduces the Planning tab with three sub-tabs (Project Creation, Project Plans, Backlog) and implements the complete project planning workflow from initial idea to activation-ready projects. It emphasizes progressive planning with state persistence and intelligent tab selection.

## Progress Overview

- ✅ **Section 1: Planning Tab Structure & Navigation** (Stories 1.1-1.3) - COMPLETED in PR #246 (merged 2025-10-17)
- 🔄 **Section 2: Project Creation Sub-Tab** (Stories 2.1-2.7) - IN PROGRESS (AI cover outstanding)
  - ✅ Story 2.1 (Stage 1) - COMPLETED in PR #250 (merged 2025-10-17)
  - ✅ Story 2.2 (Cover Upload) - COMPLETED in PR #252 (merged 2025-10-21)
  - ⏸️ Story 2.3 (AI Cover) - NOT STARTED
  - ✅ Story 2.4 (Stage 2) - COMPLETED in PR #250 (merged 2025-10-17)
  - ✅ Story 2.5 (Stage 3) - COMPLETED in PR #254 (merged 2025-10-21)
  - ✅ Story 2.6 (Stage 4) - COMPLETED in PRs #254, #267 (merged 2025-10-21)
  - ✅ Story 2.7 (Move to Backlog) - COMPLETED in PR #254 (merged 2025-10-21)
- 🔄 **Section 3: Project Plans Sub-Tab** (Stories 3.1-3.9) - PARTIALLY COMPLETE
  - ✅ Story 3.1 (Display plans) - COMPLETED in PRs #250, #254
  - ✅ Story 3.2 (Resume planning) - COMPLETED in PRs #250, #254
  - ⏸️ Story 3.3 (Card visuals) - NEEDS DESIGN
  - ✅ Story 3.4 (Archive/delete) - COMPLETED (existing functionality)
  - ⏸️ Story 3.5 (Idle indicators) - NEEDS DESIGN
  - ✅ Story 3.6 (Dynamic routing context) - COMPLETED in PR #268 (merged 2025-10-21)
  - ✅ Story 3.7 (Category advisors) - COMPLETED in PR #266 (merged 2025-10-21)
  - ✅ Story 3.8 (Auto-select in category) - COMPLETED in PR #266 (merged 2025-10-21)
  - ⏸️ Story 3.9 (Auto-select in planning) - NOT STARTED
- 🔄 **Section 4: Backlog Sub-Tab** (Stories 4.1-4.5) - PARTIALLY COMPLETE
  - ✅ Story 4.1 (Display backlog) - COMPLETED in PR #267 (merged 2025-10-21)
  - ✅ Story 4.2 (Reorder) - COMPLETED in PR #267 (merged 2025-10-21)
  - ⏸️ Story 4.3 (Activate) - NOT STARTED
  - ✅ Story 4.4 (Edit) - COMPLETED (via EditProjectModal)
  - ⏸️ Story 4.5 (Filter/search) - DEFERRED

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

**Status**: ✅ **COMPLETED** in PR #252 (merged 2025-10-21)

#### Implementation Notes

**R2 Image Storage:**

- Production: Uses Cloudflare R2 bucket for persistent image storage
- Local Development: Uses Wrangler's local R2 preview (`wrangler r2 bucket create work-squared-images-local`)
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

- [x] UI: Stage 3 displays message: "Now let's plan your tasks" with "Open Project" button
- [x] Navigation: "Open Project" button navigates to existing project detail page (kanban board)
- [x] UI: Project page shows existing task management interface (from current Work Squared)
- [x] UI: Add "Approve Plan" or "Done Planning" button to project page header (visible when `planningStage = 3`)
- [x] Event: Use `v1.ProjectAttributesUpdated` to update `planningStage: 4` when approved
- [x] UI: Show stage progress indicator (3/4) on project page when in planning mode
- [x] Logic: On approve, commit event advancing to Stage 4, navigate back to Planning tab
- [x] DoD: Operators navigate to the existing project page to plan tasks, then approve the plan to advance to Stage 4.

**Status**: ✅ **COMPLETED** in PR #254 (merged 2025-10-21)

---

### Story 2.6 – Create project Stage 4 (Prioritized)

**User story**: _As an operator, I want to set my project's priority relative to other projects so it gets placed appropriately in my backlog._

**Dependencies**: Story 2.5

#### Tasks

- [x] Schema: Add `priority` field to `projects.attributes` for explicit ranking
- [x] Query/UI: Filter Stage 4 projects (`planningStage = 4`) within the category and order by `attributes.priority` (fallback to append order when unset)
- [x] UI: Stage 4 backlog sub-tab displays prioritized list with numeric badges and stage indicator
- [x] UI: Provide drag handles/overlays so operators can reposition projects with DnD Kit
- [x] Logic: Persist reordered positions by updating `attributes.priority` for all affected projects
- [x] DoD: Stage 4 projects appear in backlog with a reorderable priority list; newly advanced projects land at the end until repositioned.

**Status**: ✅ **COMPLETED** in PRs #254, #267 (merged 2025-10-21)

#### Implementation Notes

- Dedicated Stage 4 confirmation buttons from the original concept are deferred; prioritization now happens directly within the backlog tab.
- Priority is stored on the project record and respected anywhere backlog ordering is required.

---

### Story 2.7 – Move Stage 4 project to Backlog

**User story**: _As an operator, I want Stage 4 completed projects to automatically move to the Backlog sub-tab so they're ready for activation._

**Dependencies**: Story 2.6

#### Tasks

- [x] Logic: Clicking "Done Planning" in Stage 3 commits `planningStage: 4` for the project
- [x] Navigation: Redirect operators to Planning → Backlog sub-tab immediately after advancing
- [x] UI: Newly advanced project appears in backlog list with Stage 4 badge and inherits reorder controls
- [x] DoD: Completing Stage 3 moves the project into the backlog-ready queue without manual intervention.

**Status**: ✅ **COMPLETED** in PR #254 (merged 2025-10-21)

#### Implementation Notes & Follow-ups

- Backlog membership keys off `planningStage = 4`; status remains `'planning'` until activation (Story 4.3 will flip to `'active'`).
- Original plan called for a confirmation modal and toast—defer until we validate whether the streamlined auto-move needs additional UX affordances.

---

## Section 3: Project Plans Sub-Tab

### Story 3.1 – Display in-progress project plans

**User story**: _As an operator, I want to see all in-progress project plans (Stages 1-3) so I can continue developing incomplete plans._

**Dependencies**: Story 1.3, Story 2.1

#### Tasks

- [x] Query: Filter projects by category and `attributes.status = 'planning'` and `attributes.planningStage < 4`
- [x] UI: Project Plans sub-tab displays cards for all in-progress projects
- [x] UI: Each card shows: Cover image (thumbnail), Title, Current stage indicator (1/4, 2/4, or 3/4), Last modified date
- [x] UI: "Continue Planning" button on each card
- [x] UI: Empty state: "No projects in planning. Start a new project in Project Creation."
- [x] DoD: The Project Plans sub-tab shows all projects in Stages 1-3 with clear stage indicators and last modified dates.

**Status**: ✅ **COMPLETED** (implemented in PRs #250, #254)

#### Implementation Notes

- Projects in stages 1-2 navigate to Project Creation form when clicked
- Projects in stage 3-4 navigate to Project Workspace (kanban board) when clicked
- Routing logic in LifeCategoryView.tsx:146-168

---

### Story 3.2 – Resume project planning with persistence

**User story**: _As an operator, I want to click a project plan to resume at exactly where I left off so I can continue work without losing context._

**Dependencies**: Story 3.1

#### Tasks

- [x] UI: Clicking project card in Project Plans opens Project Creation sub-tab at the project's current stage
- [x] Logic: Load all previously entered data (title, description, cover, objectives, tasks, etc.)
- [x] Logic: Scroll position and form state preserved from last session
- [x] UI: Stage indicator updates to show current position (e.g., highlights Stage 2 if that's where user left off)
- [x] Logic: "Picking up" a plan automatically "puts down" any previously active plan (saves its state)
- [x] DoD: Clicking a project in Project Plans reopens it at its exact stage with all data preserved, enabling seamless continuation.

**Status**: ✅ **COMPLETED** (implemented in PRs #250, #254)

#### Implementation Notes

- Project data is persisted via LiveStore events and materialized views
- Stage-specific routing ensures users resume at the correct stage
- Stage 3 projects open in Project Workspace with task planning interface

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

**Status**: ⏸️ **NEEDS DESIGN**

---

### Story 3.4 – Archive or delete abandoned project plans

**User story**: _As an operator, I want to archive or delete project plans I'm no longer interested in so my Project Plans view stays focused._

**Dependencies**: Story 3.1

#### Tasks

- [x] Event: Use existing `v1.ProjectArchived` event (sets `archivedAt` timestamp)
- [x] UI: Archive functionality accessible from project page
- [x] Logic: Archive commits event setting `archivedAt` timestamp, removes from Project Plans view
- [x] Logic: Delete updates `deletedAt` timestamp (soft delete), permanently removes from view
- [x] DoD: Operators can archive or delete project plans with appropriate confirmations and warnings.

**Status**: ✅ **COMPLETED** (archive functionality implemented in existing Project Workspace)

#### Implementation Notes

- Archive functionality already exists in Project Workspace
- Projects can be archived from the project page (not from card menu in this implementation)
- Archived projects are filtered out of Life Category views

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

**Status**: ⏸️ **NEEDS DESIGN**

---

### Story 3.6 – Pass routing context to LLM on every message

**User story**: _As an operator, I want the LLM to understand which page I'm viewing when I send each message so I can use contextual references like "this project" naturally across different views._

**Dependencies**: Story 3.2

#### Tasks

- [x] Capture routing context (URL params, pathname, subtabs) whenever the operator sends a message
- [x] Extract `projectId`, `categoryId`, `taskId`, etc., and hydrate metadata from LiveStore
- [x] Attach navigation context to each `chatMessageSent` event and persist it to the database
- [x] Format navigation-aware system prompt inside the agentic loop for every LLM call
- [x] DoD: Every message sent to the LLM includes fresh routing context so operators can reference "this project" or "this category" naturally.

**Status**: ✅ **COMPLETED** in PR #268 (merged 2025-10-21)

#### Implementation Notes

- Introduced `useNavigationContext` hook in the web app to centralize context gathering.
- `chatMessageSent` event schema and materializer persist `navigationContext` per message.
- Agentic loop builds a contextual system prompt including current entity + related entities before invoking the provider.
- Handles Life Category views, project workspace (including subtabs), documents, and contacts; gracefully falls back when no contextual entity exists.

**Example Usage:**

```typescript
const navigationContext = useNavigationContext()
await sendMessage({
  body: draftMessage,
  navigationContext,
})
```

---

### Story 3.7 – Auto-create Life Category Advisor worker

**User story**: _As an operator, I want a dedicated AI advisor for each Life Category so I have consistent, context-aware planning support._

**Dependencies**: Story 3.6

#### Tasks

- [x] Schema: Added `workerCategories` table to persist advisor assignments
- [x] Events: Created `v1.WorkerAssignedToCategory` / `v1.WorkerUnassignedFromCategory`
- [x] Logic: `useCategoryAdvisor` hook auto-creates advisors the first time a category needs one
- [x] Logic: Automatically links advisors to categories immediately after creation
- [x] Conventions: `{category}-advisor` IDs with shared name, role, and prompt helpers
- [x] Prompts: Category-specific system prompts deliver tailored guidance
- [x] DoD: Each Life Category automatically gains a dedicated advisor with assignment tracking once projects exist.

**Status**: ✅ **COMPLETED** in PR #266 (merged 2025-10-21)

#### Implementation Notes

**Advisor System Prompts by Category:**

- **Health**: "You are the Health & Well-Being advisor for this Life Category. Help plan fitness routines, medical appointments, mental health practices, nutrition goals, and wellness projects."
- **Relationships**: "You are the Relationships advisor. Support planning for family time, friendships, romantic relationships, social connections, and relationship-building projects."
- **Finances**: "You are the Finances advisor. Assist with budgeting, saving goals, investment planning, debt management, and financial improvement projects."
- **Growth**: "You are the Personal Growth & Learning advisor. Guide skill development, education goals, career advancement, and self-improvement projects."
- **Leisure**: "You are the Leisure & Lifestyle advisor. Help plan hobbies, recreation, travel, entertainment, and enjoyment-focused projects."
- **Spirituality**: "You are the Spirituality & Meaning advisor. Support reflection practices, value alignment, purpose exploration, and meaning-making projects."
- **Home**: "You are the Home & Environment advisor. Assist with home improvement, organization, cleaning, maintenance, and living space projects."
- **Contribution**: "You are the Contribution & Service advisor. Guide volunteering, community service, charitable giving, and impact-focused projects."

**Implementation Pattern:**

```typescript
const { advisorId, isReady } = useCategoryAdvisor(category)
if (isReady) {
  // Advisor worker and category assignment now exist for downstream features
}
```

---

### Story 3.8 – Auto-select Life Category Advisor when navigating to Life Category

**User story**: _As an operator viewing a Life Category, I want the category advisor automatically selected in my chat so I can immediately get contextual help for planning._

**Dependencies**: Story 3.7

#### Tasks

- [x] Ensure category advisor exists (Story 3.7) before attempting selection
- [x] Search for existing advisor conversation by `workerId`; reuse if found
- [x] Auto-create advisor conversation with standardized title when missing
- [x] Auto-select advisor conversation by updating `conversationId` URL param on category entry
- [x] DoD: Navigating to a Life Category ensures the advisor conversation exists and is selected for immediate use.

**Status**: ✅ **COMPLETED** in PR #266 (merged 2025-10-21)

#### Implementation Notes

**Conversation Management:**

- One conversation per category advisor across all projects in that category
- Search pattern: `conversations.where({ workerId: categoryAdvisorId })`
- Auto-creation happens once per category (when first navigating to category view after advisor is created)
- Conversation is reused across all projects in the category
- User can manually switch to other workers if needed
- Implemented via `useCategoryAdvisorConversation`, which only sets `conversationId` when the URL does not already specify one.

**UI Behavior:**

- Advisor conversation auto-selects when entering any Life Category view
- Same conversation works across Project Creation, Project Plans, and Backlog sub-tabs
- Context is dynamic (Story 3.6), so advisor understands which project/view user is in
- Example: User can say "help me plan this project" in stage 3, and advisor knows which project based on routing context

---

### Story 3.9 – Auto-select Life Category Advisor in planning stage

**User story**: _As an operator in project planning stage, I want the category advisor automatically selected when I navigate to my project so I can immediately get task planning help._

**Dependencies**: Story 3.7, Story 3.8

#### Tasks

- [ ] Logic: When entering Project Workspace with `planningStage = 3`, check if category advisor exists
- [ ] Logic: Search for existing conversation with category advisor (by `workerId`)
- [ ] Logic: If conversation exists, auto-select it (set `conversationId` in URL params)
- [ ] Logic: If no conversation exists, auto-create conversation using pattern from Story 3.8
- [ ] UI: Chat sidebar auto-selects advisor conversation when entering stage 3
- [ ] UI: Routing context (Story 3.6) provides project awareness to advisor
- [ ] DoD: Entering planning stage 3 automatically selects the category advisor conversation, with dynamic context awareness of current project.

**Status**: ⏸️ **NOT STARTED**

#### Implementation Notes

**Conversation Reuse:**

- Same conversation as Story 3.8 - shared across category view and all projects in category
- No need to create project-specific conversations
- Context switching handled dynamically via routing context (Story 3.6)

**UI Behavior:**

- Advisor conversation auto-selects when entering stage 3 of any project
- User sees same conversation history from category-level planning
- Dynamic context makes it clear which project advisor is helping with
- Example flow:
  1. User navigates to Health category → Health Advisor auto-selected
  2. User creates "Morning Workout" project, advances to stage 3
  3. Same Health Advisor conversation auto-selected
  4. User says "help me create tasks for this" → Advisor knows it's Morning Workout project via routing context

---

## Section 4: Backlog Sub-Tab

### Story 4.1 – Display backlog projects in priority order

**User story**: _As an operator, I want to see all Stage 4 projects awaiting activation in priority order so I can review my pipeline._

**Dependencies**: Story 2.5

#### Tasks

- [x] Query: Filter projects by category and `attributes.planningStage = 4`
- [x] UI: Backlog sub-tab displays project cards in vertical list
- [x] UI: Each card shows: Title, Description preview, Stage indicator
- [x] UI: Cards numbered with position (#1, #2, #3...)
- [x] UI: Empty state: "No projects in backlog. Complete Stage 4 planning to add projects here."
- [x] Schema: Add `priority` field to `projects.attributes` for explicit ordering
- [x] Query/UI: Order backlog list by `attributes.priority` with sensible fallback when unset
- [x] DoD: The Backlog sub-tab shows all completed project plans in priority order with key details visible on each card.

**Status**: ✅ **COMPLETED** in PR #267 (merged 2025-10-21)

#### Implementation Notes

- Projects with `planningStage = 4` are sorted by `attributes.priority` (defaults to list order when undefined) and rendered with numbered badges.
- Newly advanced projects drop to the end of the list until the operator reorders them (Story 4.2).
- Empty-state messaging guides operators to complete Stage 4 planning.

**Remaining Enhancements (nice-to-have):**

- Surface additional metadata (cover thumbnail, archetype badge, estimates) on backlog cards for richer context.

---

### Story 4.2 – Reorder backlog projects

**User story**: _As an operator, I want to change the priority order of backlog projects so I can adapt as circumstances change._

**Dependencies**: Story 4.1

#### Tasks

- [x] Leverage `priority` field from Story 4.1 to determine ordering
- [x] Update `v1.ProjectAttributesUpdated` usage to persist new priority values
- [x] Enable drag-and-drop reordering with @dnd-kit/sortable
- [x] Provide insertion indicators / overlays during drag operations
- [x] Recalculate and commit sequential priorities for all affected projects on drop
- [x] Persist ordering so refreshes retain operator-defined priorities
- [x] Show toast notification confirming new position (e.g., "`Project` moved to position #3")
- [x] DoD: Operators can reorder backlog projects with clear feedback and durable priority changes.

**Status**: ✅ **COMPLETED** in PR #267 (merged 2025-10-21)

#### Implementation Notes

- Uses `@dnd-kit/sortable` for vertical list reordering with drag overlays.
- `isDragInProgress` guard prevents accidental navigation clicks immediately after dropping.
- Priorities are stored as zero-based integers and recalculated for the entire list on each drop.

---

### Story 4.3 – Activate backlog project to Active state

**User story**: _As an operator, I want to activate a backlog project so it moves to the Active tab and I can start working on tasks._

**Dependencies**: Story 4.1

#### Tasks

- [x] Schema: Ensure `activatedAt` field exists in `projects.attributes` for tracking activation time
- [x] Event/UI: Use `v2.ProjectAttributesUpdated` on activation to set `status = 'active'`, `activatedAt`, and clear backlog-only fields
- [x] UI: Add "Activate" CTA on backlog project cards
- [x] UI: Confirmation modal: "Activate [Project Name]? It will move to your Active projects."
- [x] UI: Modal surfaces project objective, archetype, deadline, and estimated duration when available
- [x] Logic: On confirm, commit attributes update, show success toast, and navigate to Active tab
- [x] Logic: Activated project disappears from Backlog (filtered by planning stage) and is visible under Active tab
- [x] UI: Error toast surfaces if activation fails
- [x] DoD: Backlog projects can be activated with confirmation, transition to the Active tab, and record activation timing.

**Status**: ✅ **COMPLETED** (this PR, 2025-10-22)

#### Implementation Notes

**Current Status Check:**

- Projects in Stage 4 now expose an Activate button with modal confirmation.
- Activation updates project attributes, records `activatedAt`, and removes backlog-only priority field.
- Post-activation, the view automatically pivots to the Active tab and shows a success toast.

---

### Story 4.4 – Edit backlog project details

**User story**: _As an operator, I want to edit backlog project details before activation so I can refine plans without going back to planning stages._

**Dependencies**: Story 4.1

#### Tasks

- [x] UI: Clicking backlog project navigates to Project Workspace
- [x] UI: Edit Project Modal accessible from Project Workspace
- [x] UI: Modal allows editing name, description, category, cover image, and all planning attributes
- [x] Logic: Changes saved via events persist to project
- [x] Logic: User can navigate back to Backlog sub-tab via Life Category view
- [x] DoD: Operators can edit backlog projects by opening them and using the Edit Project modal.

**Status**: ✅ **COMPLETED** (EditProjectModal implemented, accessible from Project Workspace)

#### Implementation Notes

**Implementation (ProjectWorkspace.tsx & EditProjectModal.tsx):**

- Clicking backlog project opens Project Workspace (LifeCategoryView.tsx:146-168)
- Edit Project modal accessible via project menu/header in workspace
- Modal supports editing:
  - Basic fields: name, description, category
  - Cover image via ImageUpload component
  - Custom attributes via ProjectAttributesEditor
- Changes committed via `v1.ProjectUpdated` and `v1.ProjectAttributesUpdated` events
- User navigates back to category via breadcrumbs or back button

**Note**: Original story envisioned opening Project Creation form, but current implementation uses modal which is more flexible and less disruptive.

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

**Status**: ⏸️ **DEFERRED** (nice-to-have feature for later)

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

// Worker Categories table (NEW - for Story 3.7)
workerCategories: {
  workerId: string
  category: string // 'health' | 'relationships' | 'finances' | etc.
}

// Note: Existing tables used by advisor system
// - workers: Stores worker metadata (name, systemPrompt, etc.)
// - workerProjects: Links workers to projects
// - conversations: Stores chat conversations with workers
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

// NEW EVENTS for Story 3.7 - Worker Category Assignment
export const workerAssignedToCategory = Events.synced({
  name: 'v1.WorkerAssignedToCategory',
  schema: Schema.Struct({
    workerId: Schema.String,
    category: Schema.String, // 'health' | 'relationships' | 'finances' | etc.
    assignedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const workerUnassignedFromCategory = Events.synced({
  name: 'v1.WorkerUnassignedFromCategory',
  schema: Schema.Struct({
    workerId: Schema.String,
    category: Schema.String,
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

'v1.WorkerAssignedToCategory': ({ workerId, category, assignedAt, actorId }) => [
  workerCategories.insert({ workerId, category }),
  eventsLog.insert({
    id: crypto.randomUUID(),
    eventType: 'v1.WorkerAssignedToCategory',
    eventData: JSON.stringify({ workerId, category }),
    actorId,
    createdAt: assignedAt,
  }),
]

'v1.WorkerUnassignedFromCategory': ({ workerId, category }) => [
  workerCategories.delete().where({ workerId, category }),
]
```

### Query Patterns for Category Advisors

```typescript
// Query to get category advisor worker
export const getCategoryAdvisor$ = (category: string) =>
  db
    .table('workers')
    .join('workerCategories', 'workers.id', 'workerCategories.workerId')
    .where('workerCategories.category', category)
    .where('workers.isActive', true)
    .select('workers.*')
    .first()

// Query to get conversation with category advisor
export const getCategoryAdvisorConversation$ = (workerId: string) =>
  db.table('conversations').where('workerId', workerId).orderBy('createdAt', 'desc').first()

// Check if category advisor exists
export const categoryAdvisorExists$ = (category: string) =>
  db
    .table('workerCategories')
    .where('category', category)
    .count()
    .then(count => count > 0)
```

### State Management Patterns

- **Single Active Plan**: Only one project plan can be "picked up" at a time within a category. Opening a new plan auto-saves the previous plan's state.
- **Stage Persistence**: All form data, scroll position, and UI state should persist when switching between plans or leaving the planning interface.
- **Real-time Updates**: Project plan cards should reactively update as stage progresses without page refresh.
- **Category Advisor Lifecycle**: Advisors are created once per category and persist indefinitely, maintaining conversation history across all projects in that category.

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

### Section 3: Project Plans Sub-Tab (9 stories)

Stories 3.1-3.9 enable managing in-progress plans with full persistence, contextual AI assistance through category advisors, and intelligent conversation management. Includes visual indicators for plan progress and idle state.

- **3.1-3.2**: Core plan viewing and resumption (✅ Completed)
- **3.3, 3.5**: Visual enhancements (⏸️ Needs design)
- **3.4**: Archive functionality (✅ Completed via existing Project Workspace)
- **3.6-3.9**: Contextual AI advisor system (⏸️ Not started)
  - Dynamic routing context on every message
  - Auto-created category advisors
  - Auto-selection in category view and planning stage
  - Single reusable conversation per category

### Section 4: Backlog Sub-Tab (5 stories)

Stories 4.1-4.5 provide priority-ordered backlog management with reordering, activation, editing, and filtering capabilities.

- **4.1**: Display backlog (🔄 Partially complete - display working, priority ordering needed)
- **4.2**: Drag-and-drop reordering (⏸️ Blocked by 4.1 priority field)
- **4.3**: Activate to Active tab (⏸️ Not started)
- **4.4**: Edit project details (✅ Completed via EditProjectModal)
- **4.5**: Filter and search (⏸️ Deferred as nice-to-have)

**Total: 24 user stories** (added 4 stories for contextual AI advisor system with dynamic routing context)
