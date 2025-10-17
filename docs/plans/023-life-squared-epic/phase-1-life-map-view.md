# Phase 1: Life Map View - User Stories

> Purpose: To build the primary navigation interface that displays all 8 Life Categories as an interactive grid, allowing operators to see project status at a glance and navigate to category detail views.

This phase establishes the foundational "home screen" of the life management system, showing operators the state of all their life areas in a single view. It emphasizes clarity, visual hierarchy, and seamless navigation to encourage daily engagement.

---

## Section 1: Core Display & Navigation

### Story 1.1 – Display 8 Life Category squares in grid

**User story**: _As an operator, I want to see all 8 Life Category squares when I login so I can quickly orient to my life system._

#### Tasks

- [x] Schema: Define hardcoded `LIFE_CATEGORIES` constant array with 8 categories: Health & Well-Being, Relationships, Finances, Personal Growth & Learning, Leisure & Lifestyle, Spirituality & Meaning, Home & Environment, Contribution & Service
- [x] Schema: Each category object includes: `id` (slug), `name`, `description`, `color` (hex), `icon` (emoji), `sortOrder` (1-8)
- [x] Query: Create helper function `getLifeCategoriesWithStats()` that combines hardcoded categories with project counts from `getProjects$` query
- [x] UI: Create `LifeMapView` component displaying 2x4 grid layout (desktop)
- [x] UI: Each grid square shows: category title, seal/icon (40x40px minimum), signature color
- [x] Routing: Create `/life-map` route as primary landing page after login
- [x] DoD: Logging in displays a 2x4 grid of 8 Life Category squares, each showing its title, icon, and color.

**Status**: ✅ **Completed in PR #248** (merged 2025-10-17)

---

### Story 1.2 – Display category descriptions on hover

**User story**: _As an operator, I want to hover over a category's information icon to see its description so I understand what types of projects belong there._

**Dependencies**: Story 1.1

#### Tasks

- [ ] UI: Add information icon (ⓘ) to each Life Category square
- [ ] UI: Create tooltip component that appears on hover
- [ ] UI: Tooltip displays category description text from database
- [ ] UI: Position tooltip to avoid screen edges, with arrow pointing to icon
- [ ] UI: Tooltip appears after 300ms hover delay, dismisses on mouse leave
- [ ] DoD: Each category square has an info icon that, when hovered, displays a tooltip with the category's description.

**Status**: ⏭️ **Deferred** (descriptions available in category detail view)

---

### Story 1.3 – Distinguish active vs inactive categories

**User story**: _As an operator, I want to visually distinguish between active and inactive life categories so I know where I have work happening versus areas I haven't started._

If life category has no projects, inactive

**Dependencies**: Story 1.1

#### Tasks

- [x] Query: Modify `getLifeCategoriesWithStats()` to filter projects by category field and count projects where `category` matches category id
- [x] UI: Categories with `projectCount > 0` display in full signature color
- [x] UI: Categories with `projectCount = 0` display in muted gray (Warm Stone #D4CCC8)
- [x] UI: Add visual indicator (dot, badge, or border) if category has projects
- [x] DoD: Life Category squares display in full color when active (have projects) and in muted gray when inactive (no projects yet).

**Status**: ✅ **Completed in PR #248** (merged 2025-10-17)

---

### Story 1.4 – Navigate to category detail on click

**User story**: _As an operator, I want to click on any Life Category square to enter that category's detail view so I can see and manage all projects within that life area._

**Dependencies**: Story 1.1

#### Tasks

- [x] Routing: Create `/category/:categoryId` route for Life Category detail view
- [x] UI: Make entire Life Category square clickable
- [x] UI: Add hover state with visual feedback (slight elevation, cursor pointer, subtle glow)
- [x] Navigation: Clicking square navigates to `/category/:categoryId` route
- [x] Logic: Navigation is instant with no loading delays for MVP (data prefetched or loaded quickly)
- [x] DoD: Clicking anywhere on a Life Category square navigates to that category's detail view with clear hover feedback.

**Status**: ✅ **Completed in PR #248** (merged 2025-10-17)

---

## Section 2: Project Status Indicators

### Story 2.1 – Display active project count

**User story**: _As an operator, I want to see how many active projects exist in each category so I understand my workload distribution across life areas._

What is an "active" project versus an "inactive" project

**Dependencies**: Story 1.3

#### Tasks

- [x] Query: Filter projects by `category` field and `attributes.status = 'active'` (or absence of archived/deleted status)
- [x] UI: Display text-based count on each category square (e.g., "3 Active")
- [x] UI: Position count prominently (bottom-center or corner of square)
- [x] UI: Count updates in real-time as projects change (via LiveStore reactive queries)
- [x] UI: Categories with zero active projects show "No active projects" or similar text
- [x] DoD: Each Life Category square displays a count of active projects that updates automatically when project states change.

**Status**: ✅ **Completed** (implemented with Stories 2.2 and 2.3)

---

### Story 2.2 – Display planning queue size

**User story**: _As an operator, I want to see how many projects are in planning for each category so I know what's coming up in my pipeline._

**Dependencies**: Story 2.1

#### Tasks

- [x] Query: Filter projects by `category` field and `attributes.status = 'planning'` per category
- [x] UI: Display planning count in smaller text (e.g., "2 Planning")
- [x] UI: Visually distinguish from active count (smaller size, lighter color, or different position)
- [x] UI: Count updates when projects move between planning and other states
- [x] DoD: Each category square shows the count of projects in planning state, visually distinct from the active project count.

**Status**: ✅ **Completed** (implemented with Stories 2.1 and 2.3)

---

### Story 2.3 – Show last activity indicator

**User story**: _As an operator, I want to see when I last worked in each category so I know if I'm neglecting any life areas._

**Dependencies**: Story 2.1

#### Tasks

- [x] Logic: Compute `lastActivityAt` by finding the most recent `updatedAt` timestamp from projects in the category, OR most recent task `updatedAt` for projects in the category
- [x] Logic: Store computed `lastActivityAt` in category's computed stats (can cache in `project.attributes.lastActivityAt` if needed for performance)
- [x] Logic: Create helper function to format timestamps as relative time ("Active today", "3 days ago", "2 weeks ago")
- [x] UI: Display formatted timestamp on category square (bottom or corner)
- [x] UI: Add subtle visual cue (amber/yellow indicator) for categories inactive >1 week
- [x] Logic: Activity can be from operator or any assigned support staff/AI agents
- [x] DoD: Each category shows when it was last active with human-readable relative time, with visual warnings for neglected categories.

**Status**: ✅ **Completed** (implemented with Stories 2.1 and 2.2)

---

## Section 3: Quick Actions

### Story 3.1 – Quick add project from Life Map

**User story**: _As an operator, I want to quickly add a new project to a category from the Life Map so I can capture ideas without navigating away from the overview._

**Dependencies**: Story 1.4

#### Tasks

- [ ] Event: Use existing `v1.ProjectCreated` event, adding `category` field to payload
- [ ] UI: Show "+" icon on category square hover (top-right corner)
- [ ] UI: Create `QuickAddProjectModal` component with fields: Project title (required), Category (pre-filled, read-only)
- [ ] UI: Modal includes "Create" and "Cancel" buttons
- [ ] Logic: On create, commit `projectCreated` event with `category` field set, project attributes include `status: 'planning'` and `planningStage: 1`
- [ ] UI: After creation, show toast: "[Project] added to [Category] Planning" with "Edit Now" link
- [ ] DoD: Hovering over a category reveals a plus icon that opens a quick-add modal for creating projects directly from the Life Map.

**Status**:

---

### Story 3.2 – Handle empty categories gracefully

**User story**: _As an operator, I want to see visual guidance on how to activate a dormant life category so I know how to get started in new life areas._

**Dependencies**: Story 1.3, Story 3.1

#### Tasks

- [ ] UI: When category has no projects (`projectCount = 0`), show "Get Started" message on square
- [ ] UI: Replace or overlay standard indicators with "Add First Project" call-to-action
- [ ] Logic: Clicking "Get Started" navigates to category's Planning tab
- [ ] UI: Alternatively, show enlarged "+" icon inviting project creation
- [ ] DoD: Empty Life Categories display clear visual guidance prompting the user to add their first project, with click behavior navigating to the category view.

**Status**:

---

## Section 4: Visual Enhancements

### Story 4.1 – Display unique category seals and icons

**User story**: _As an operator, I want to see unique visual icons for each life category so I can quickly identify categories beyond just text._

**Dependencies**: Story 1.1

#### Tasks

- [ ] Schema: Include `icon` field (emoji) in hardcoded `LIFE_CATEGORIES` constant
- [ ] UI: Each category displays its distinct icon/seal (emoji for MVP: 🧘‍♀️ for Health, 💗 for Relationships, etc.)
- [ ] UI: Icons sized at minimum 40x40px for recognizability
- [ ] UI: Icons maintain consistent visual style (same size, similar visual weight)
- [ ] UI: Icon positioned prominently (top-center or center of square)
- [ ] DoD: Each Life Category square displays a unique, recognizable icon in a consistent style and size.

**Status**:

#### Implementation Notes

- **MVP Icons**: Use emoji for initial implementation (🧘‍♀️, 💗, 💰, 🧠, 🌴, 🔮, 🏡, 🌍). Post-MVP can replace with custom SVG seals for more polished branding.

---

### Story 4.2 – Responsive grid layout for all devices

**User story**: _As an operator, I want the category grid to adapt to my screen size so I can use the system on desktop, tablet, or mobile._

**Dependencies**: Story 1.1

#### Tasks

- [ ] UI: Desktop (>1024px): 2x4 grid layout
- [ ] UI: Tablet (768-1024px): 2x4 grid layout (slightly narrower squares)
- [ ] UI: Mobile (<768px): 2x4 grid with vertical scroll OR 1x8 single-column scrollable list
- [ ] UI: All touch targets maintain minimum 44x44px size for accessibility
- [ ] UI: Grid spacing and margins adjust proportionally for each breakpoint
- [ ] UI: Test on iOS Safari, Android Chrome, and desktop browsers
- [ ] DoD: The Life Map displays correctly and is fully usable on desktop (2x4 grid), tablet (2x4 grid), and mobile (scrollable 2x4 or 1x8 list).

**Status**:

---

## Section 5: State Persistence

### Story 5.1 – Persist last visited category

**User story**: _As an operator, I want the system to remember which category I last visited so I can quickly return to my current focus area._

**Dependencies**: Story 1.4

#### Tasks

- [ ] Schema: Use existing `settings` table or browser localStorage to store `lastVisitedCategoryId`
- [ ] Logic: On category navigation, update `lastVisitedCategoryId` using `settingUpdated` event or localStorage
- [ ] Query: Use `getSettingByKey$('lastVisitedCategoryId')` query or read from localStorage
- [ ] UI: Add "Return to [Category Name]" quick action button on Life Map (if recent visit within 24 hours)
- [ ] Navigation: Clicking button navigates directly to last visited category
- [ ] DoD: The system remembers the last category visited and optionally provides a quick return button on the Life Map.

**Status**:

---

## Technical Implementation Notes

### Database Schema

```typescript
// Life Categories - HARDCODED CONSTANTS (not in database)
export const LIFE_CATEGORIES = [
  { id: 'health', name: 'Health & Well-Being', description: '...', color: '#...', icon: '🧘‍♀️', sortOrder: 1 },
  { id: 'relationships', name: 'Relationships', description: '...', color: '#...', icon: '💗', sortOrder: 2 },
  // ... 6 more categories
] as const

// Projects table (PR4 schema changes)
projects: {
  id: string
  name: string
  description: string | null
  category: string | null // 'health' | 'relationships' | 'finances' | etc.
  attributes: {
    status?: 'planning' | 'backlog' | 'active' | 'completed'
    planningStage?: 1 | 2 | 3 | 4
    lastActivityAt?: number
    // ... future attributes from Phase 2
  } | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  archivedAt: number | null
}

// Category activity tracking (computed on-the-fly)
// lastActivityAt calculated from:
// - MAX(project.updatedAt) for projects in category
// - MAX(task.updatedAt) for tasks in projects in category
```

### Query Patterns

```typescript
// Helper function that combines hardcoded categories with project data
function getLifeCategoriesWithStats(): LifeCategoryWithStats[] {
  const projects = useQuery(getProjects$) // Returns all projects

  return LIFE_CATEGORIES.map(category => {
    const categoryProjects = projects.filter(p => p.category === category.id)
    const activeCount = categoryProjects.filter(p => p.attributes?.status === 'active').length
    const planningCount = categoryProjects.filter(p => p.attributes?.status === 'planning').length
    const lastActivityAt = Math.max(...categoryProjects.map(p => p.updatedAt))

    return {
      ...category,
      projectCount: categoryProjects.length,
      activeProjectCount: activeCount,
      planningProjectCount: planningCount,
      lastActivityAt,
    }
  })
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
    category: Schema.optional(Schema.String), // Category id from LIFE_CATEGORIES
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

// Use existing settings events for navigation tracking
export const settingUpdated = Events.synced({
  name: 'v1.SettingUpdated',
  schema: Schema.Struct({
    key: Schema.String, // 'lastVisitedCategoryId'
    value: Schema.String, // category id
    updatedAt: Schema.Date,
  }),
})
```

### Performance Considerations

- **Reactive Queries**: Life Map should subscribe to project state changes and update counts in real-time
- **Prefetching**: Consider prefetching category detail data on hover to enable instant navigation
- **Animation**: Keep hover effects and transitions lightweight (<200ms) for responsiveness

### Testing Strategy

- **Unit Tests**: Query logic for counting projects, relative time formatting, responsive layout calculations
- **Integration Tests**: Navigation flows (Life Map → Category → Project), quick-add project flow
- **E2E Tests**: Full workflow: Login → View Life Map → Hover category → Quick add project → Navigate to category → Return to Life Map
- **Visual Regression**: Screenshot tests for grid layout at different breakpoints

---

## Story Summary

### Section 1: Core Display & Navigation (4 stories)

Stories 1.1-1.4 establish the fundamental Life Map grid with 8 categories, descriptions, active/inactive states, and navigation to category details.

### Section 2: Project Status Indicators (3 stories)

Stories 2.1-2.3 provide real-time visibility into workload distribution with active counts, planning queues, and activity timestamps across all categories.

### Section 3: Quick Actions (2 stories)

Stories 3.1-3.2 enable rapid project creation and provide clear guidance for activating empty categories directly from the Life Map.

### Section 4: Visual Enhancements (2 stories)

Stories 4.1-4.2 ensure recognizable category icons and responsive layouts that work across all devices.

### Section 5: State Persistence (1 story)

Story 5.1 remembers user navigation patterns to streamline returning to active work areas.

**Total: 12 user stories**
