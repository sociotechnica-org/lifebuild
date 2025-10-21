# LifeSquared Epic

## What is LifeSquared?

Read about the vision and core concepts of LifeSquared in [the-living-world-of-life-squared.md](the-living-world-of-life-squared.md).

You can find definitions of key terms in the [LifeSquared Glossary](https://docs.google.com/document/d/e/2PACX-1vTjCmh6V7bO9Pz1qj0tfhR2xaIbpFnV8HaQQeDDPIK18rrihC17q9QuWGFe-66RpgOfZe35QiDcMaLc/pub).

## The Epic Plan

This epic plan provides an overview of all user stories organized across three sequential phases, that build the complete operator experience from initial navigation through detailed project and task management.

## Phase Structure

### Phase 1: Life Map View - **Complete** ✅

[View Phase 1 Document](phase-1-life-map-view.md)

**Purpose**: Build the primary navigation interface showing all 8 Life Categories as an interactive grid.

**Completed** (PRs #248, #249, #251, #253):

- ✅ 8-square grid display with colors and navigation
- ✅ Active vs. inactive category visualization
- ✅ Project count indicators (active, planning)
- ✅ Last activity timestamps
- ✅ Quick project creation from Life Map
- ✅ Empty category guidance with enlarged + icon
- ✅ Category icons (emojis)
- ✅ Responsive layouts (mobile/tablet/desktop)
- ✅ Last visited category persistence

**Deferred**:

- Story 1.2: Category description tooltips (descriptions available in category detail view)

**Key Features**:

- Real-time project count updates via LiveStore
- Smart tab selection based on category state
- Container/Presenter component architecture
- Fully responsive from mobile to desktop
- localStorage-based navigation persistence

**Story Count**: 12 stories (11 completed, 1 deferred)

### Phase 2: Life Category Planning - **Early Stage**

[View Phase 2 Document](phase-2-life-category-view.md)

**Purpose**: Build the project planning system with structured 4-stage development and backlog management.

**Completed** (PRs #246, #250):

- ✅ Three main tabs (Planning, Active, Completed)
- ✅ Smart default tab selection
- ✅ Three Planning sub-tabs (Project Creation, Project Plans, Backlog)
- ✅ Stage 1 (Identified): Title, description
- ✅ Stage 2 (Scoped): Objectives, deadlines, archetype, traits

**In Progress** (PR #252):

- 🔄 Cover image upload to Cloudflare R2

**Remaining Work**:

- AI-generated cover images
- Stage 3 (Task planning integration)
- Stage 4 (Priority ranking and backlog placement)
- Move completed plans to Backlog
- Project Plans sub-tab (view/resume in-progress plans)
- Backlog sub-tab (priority management, activation)

**Key Features Implemented**:

- Container/Presenter component architecture
- LiveStore event-driven state management
- Progressive planning workflow (Stages 1-2)
- Archetype auto-suggestion based on traits

**Story Count**: 20 stories (5 completed, 1 in progress, 14 remaining)

### Phase 3: Active Projects, Completion & Task Management (35 stories)

TBD!

[View Phase 3 Document](phase3_active_completion_detail.md)

**Purpose**: Build active project management with global prioritization, completion tracking, and detailed kanban-based task management.

**What's Included**:

**Global Featured Podium** (9 stories):

- Display 3 globally-featured priority projects
- Feature projects from backlog or active states
- Handle slot conflicts and replacements
- Manual unfeaturing
- Life Map featured indicators
- Navigation enhancements (breadcrumbs, category switcher)

**Completed Projects** (9 stories):

- Mark projects complete with celebration and reflection
- Display completed projects with filtering/sorting
- Search completed projects by title/objectives
- View detailed completion history
- Reopen completed projects if needed
- Archive old completions
- Bulk archive operations
- Comprehensive insights dashboard with metrics

**Project Detail & Kanban** (17 stories):

- Open projects to full detail view
- Three-column kanban board (To Do, In Progress, Done)
- Rich task cards with metadata
- Drag-and-drop task status updates
- 3-task In Progress limit enforcement
- Quick complete with checkboxes
- Add, edit, reorder tasks
- Emergency breakout tasks for maintenance loops
- Maintenance loop recurring task handling
- Project metadata editing
- Project actions menu
- Navigate between projects
- Bulk task operations
- AI agent activity tracking
- Comments and collaboration

**Key Features**:

- Global (not per-category) Featured Podium for cross-life-area prioritization
- Rich completion insights and learning
- Flexible kanban task management
- Special handling for maintenance loops and emergencies
- AI agent collaboration
