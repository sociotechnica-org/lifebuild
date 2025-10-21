# Phase 2: Life Category Planning - User Stories

> Purpose: To build the project planning system within Life Categories, enabling operators to create, develop, and prioritize projects through a structured 4-stage process before activation.

This phase introduces the Planning tab with three sub-tabs (Project Creation, Project Plans, Backlog) and implements the complete project planning workflow from initial idea to activation-ready projects. It emphasizes progressive planning with state persistence and intelligent tab selection.

## Progress Overview

- ✅ **Section 1: Planning Tab Structure & Navigation** (Stories 1.1-1.3) - COMPLETED in PR #246 (merged 2025-10-17)
- 🔄 **Section 2: Project Creation Sub-Tab** (Stories 2.1-2.7) - IN PROGRESS
  - ✅ Story 2.1 (Stage 1) - COMPLETED in PR #250 (merged 2025-10-17)
  - ✅ Story 2.2 (Cover Upload) - COMPLETED in PR #252 (merged 2025-10-21)
  - ⏸️ Story 2.3 (AI Cover) - NOT STARTED
  - ✅ Story 2.4 (Stage 2) - COMPLETED in PR #250 (merged 2025-10-17)
  - ✅ Story 2.5 (Stage 3) - COMPLETED in PR #254 (merged 2025-10-21)
  - ⏸️ Story 2.6 (Stage 4) - NOT STARTED
  - ⏸️ Story 2.7 (Move to Backlog) - NOT STARTED
- 🔄 **Section 3: Project Plans Sub-Tab** (Stories 3.1-3.9) - PARTIALLY COMPLETE
  - ✅ Story 3.1 (Display plans) - COMPLETED in PRs #250, #254
  - ✅ Story 3.2 (Resume planning) - COMPLETED in PRs #250, #254
  - ⏸️ Story 3.3 (Card visuals) - NEEDS DESIGN
  - ✅ Story 3.4 (Archive/delete) - COMPLETED (existing functionality)
  - ⏸️ Story 3.5 (Idle indicators) - NEEDS DESIGN
  - ⏸️ Story 3.6 (Dynamic routing context) - NOT STARTED
  - ⏸️ Story 3.7 (Category advisors) - NOT STARTED
  - ⏸️ Story 3.8 (Auto-select in category) - NOT STARTED
  - ⏸️ Story 3.9 (Auto-select in planning) - NOT STARTED
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

- [ ] Logic: Capture routing context (URL params, pathname) when user sends a message
- [ ] Logic: Extract `projectId`, `categoryId`, `taskId` from current route dynamically
- [ ] Query: Fetch current project/category/task details based on extracted IDs
- [ ] API: Include routing context in each LLM API call as system message or context parameter
- [ ] API: Format context dynamically based on current view:
  - Project Workspace: "The user is currently viewing Project '[name]' (ID: [id]) in category '[category]'"
  - Life Category: "The user is currently viewing the '[category]' Life Category"
  - Task view: "The user is currently viewing Task '[name]' in Project '[project]'"
- [ ] Logic: Context is calculated fresh for every message, not stored in conversation
- [ ] DoD: Every message sent to LLM includes current routing context, enabling contextual references across different views within the same conversation.

**Status**: ⏸️ **NOT STARTED**

#### Implementation Notes

**Dynamic Context Capture:**
- Read routing state from `useLocation()` and `useParams()` at message send time
- Parse current URL to extract relevant IDs (projectId, categoryId, taskId)
- Query LiveStore for entity details (names, descriptions) to enrich context
- Include context as part of message payload or system prompt for each API call

**Benefits:**
- Same conversation can be used across multiple projects in a category
- Advisor maintains context awareness as user navigates between views
- No need to create/switch conversations when moving between projects
- Natural UX: "help me plan this project" works regardless of which project is open

**Example Implementation:**
```typescript
const handleSendMessage = async (message: string) => {
  const routingContext = extractRoutingContext(location, params) // { projectId, categoryId, taskId }
  const contextDetails = await fetchContextDetails(store, routingContext)

  const contextPrompt = formatContextPrompt(contextDetails)
  // "The user is currently viewing Project 'Morning Workout Routine' in Health & Well-Being category"

  await sendToLLM({
    message,
    conversationId,
    contextPrompt, // Included with this specific message
  })
}
```

---

### Story 3.7 – Auto-create Life Category Advisor worker

**User story**: _As an operator, I want a dedicated AI advisor for each Life Category so I have consistent, context-aware planning support._

**Dependencies**: Story 3.6

#### Tasks

- [ ] Event: Watch for `v1.ProjectCreated` events with `category` field
- [ ] Logic: On first project creation in a category, check if category advisor worker exists
- [ ] Logic: If no advisor exists, auto-create worker with `v1.WorkerCreated` event
- [ ] Schema: Worker naming convention: `{category}-advisor` (e.g., "health-advisor", "finances-advisor")
- [ ] Prompts: Create category-specific system prompts that understand category context
- [ ] Prompts: Example for Health category: "You are the Health & Well-Being advisor. Help users plan and manage health-related projects including fitness, medical care, mental health, and nutrition."
- [ ] DoD: Each Life Category automatically gets a dedicated advisor worker when the first project is created.

**Status**: ⏸️ **NOT STARTED**

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
// Pseudocode for advisor auto-creation
materializer for 'v1.ProjectCreated': ({ category }) => {
  if (category) {
    const advisorId = `${category}-advisor`
    const existingAdvisor = db.workers.findOne({ id: advisorId })

    if (!existingAdvisor) {
      store.commit(events.workerCreated({
        id: advisorId,
        name: `${getCategoryInfo(category).name} Advisor`,
        systemPrompt: getCategoryAdvisorPrompt(category),
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      }))
    }
  }
}
```

---

### Story 3.8 – Auto-select Life Category Advisor when navigating to Life Category

**User story**: _As an operator viewing a Life Category, I want the category advisor automatically selected in my chat so I can immediately get contextual help for planning._

**Dependencies**: Story 3.7

#### Tasks

- [ ] Logic: When navigating to Life Category view, check if category advisor exists
- [ ] Logic: Search for existing conversation with category advisor (by `workerId`)
- [ ] Logic: If conversation exists, auto-select it (set `conversationId` in URL params)
- [ ] Logic: If no conversation exists, auto-create conversation with category advisor using `v1.ConversationCreated`
- [ ] Logic: Conversation title: "[Category Name] Planning" (e.g., "Health & Well-Being Planning")
- [ ] UI: Chat sidebar auto-selects advisor conversation when entering category view
- [ ] UI: Show indicator that advisor is context-aware (e.g., "Health Advisor")
- [ ] DoD: Entering a Life Category view automatically creates or selects a conversation with the category advisor, enabling immediate contextual support.

**Status**: ⏸️ **NOT STARTED**

#### Implementation Notes

**Conversation Management:**
- One conversation per category advisor across all projects in that category
- Search pattern: `conversations.where({ workerId: categoryAdvisorId })`
- Auto-creation happens once per category (when first navigating to category view after advisor is created)
- Conversation is reused across all projects in the category
- User can manually switch to other workers if needed

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

**Total: 24 user stories** (added 4 stories for contextual AI advisor system with dynamic routing context)
