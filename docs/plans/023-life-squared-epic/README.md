# LifeSquared Epic

## What is LifeSquared?

Read about the vision and core concepts of LifeSquared in [the-living-world-of-life-squared.md](the-living-world-of-life-squared.md).

You can find definitions of key terms in the [LifeSquared Glossary](https://docs.google.com/document/d/e/2PACX-1vTjCmh6V7bO9Pz1qj0tfhR2xaIbpFnV8HaQQeDDPIK18rrihC17q9QuWGFe-66RpgOfZe35QiDcMaLc/pub).

## The Epic Plan

This epic plan provides an overview of all user stories organized across three sequential phases, that build the complete operator experience from initial navigation through detailed project and task management.

## Phase Structure

### Phase 1: Life Map View

[View Phase 1 Document](phase-1-life-map-view.md)

**Purpose**: Build the primary navigation interface showing all 8 Life Categories as an interactive grid.

**What's Included**:

- 8-square grid display with colors, icons, and descriptions
- Active vs. inactive category visualization
- Project count indicators (active, planning, featured)
- Last activity timestamps
- Quick project creation from Life Map
- Responsive layouts for desktop, tablet, mobile
- Navigation to category detail views

**Key Features**:

- Real-time project count updates
- Visual guidance for empty categories
- Smart state persistence
- Cross-device compatibility

**Story Count**: 12 stories across 5 sections

### Phase 2: Life Category Planning (20 stories)

[View Phase 2 Document](phase-2-life-category-view.md)

**Purpose**: Build the project planning system with structured 4-stage development and backlog management.

**What's Included**:

**Planning Tab Structure**:

- Three main tabs (Planning, Active, Completed)
- Smart default tab selection
- Three Planning sub-tabs (Project Creation, Project Plans, Backlog)

**4-Stage Project Creation**:

- Stage 1 (Identified): Title, description
- Cover Images: Upload or AI-generate cover images (2 separate stories)
- Stage 2 (Scoped): Objectives, deadlines, archetype, traits
- Stage 3 (Drafted): Navigate to existing project page for task planning, approve plan
- Stage 4 (Prioritized): Priority ranking and backlog placement

**Project Plans Management**:

- View all in-progress plans (Stages 1-3)
- Resume planning with full state persistence
- Dynamic card visuals showing stage progress
- Archive or delete abandoned plans
- Idle plan indicators

**Backlog Management**:

- Priority-ordered project display
- Drag-to-reorder prioritization
- Project activation to Active state
- Edit backlog projects before activation
- Search and filter capabilities

**Key Features**:

- Complete state persistence ("pick up/put down" metaphor)
- Progressive enhancement through stages
- AI-assisted task generation
- Flexible priority management

**Story Count**: 20 stories across 4 sections

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
