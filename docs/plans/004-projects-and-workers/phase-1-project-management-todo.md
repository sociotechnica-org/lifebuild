# Phase 1.1 Project Management & Task System - User Stories

> Purpose: Build project management and task system incrementally, one user story at a time. Each slice delivers user-visible value and introduces only the minimal supporting infrastructure needed for the unified project system.

Based on the production plan, Phase 1.1 transforms the existing Kanban system into a unified project management system where projects organize both documents and tasks.

---

## Story 1 – View list of projects

**User story**: _As a user, I want to view a list of projects so I can see all my work organized by outcome._

**Context**: This replaces the current boards list with a more comprehensive project view that will eventually include documents, tasks, and workers.

### Tasks

- [x] Events: Rename `board.*` events to `project.*` events
- [x] Schema: Rename `boards` table to `projects` and add `description` field
- [x] Query: Update `getBoards` to `getProjects` with description support
- [x] UI: Update `BoardsPage` to `ProjectsPage` with project cards showing descriptions
- [x] Routing: Update `/boards` to `/projects`
- [x] Tests: Update existing board tests to work with project terminology
- [x] DoD: Visiting `/projects` shows existing projects with names and descriptions

### Implementation Notes

- **Progressive Enhancement**: Description field is optional, existing projects work without it
- **URL Updates**: Update `/boards` URLs to `/projects`

---

## Story 2 – Create a new project with description

**User story**: _As a user, I want to create a new project with a name and description so I can organize work toward a specific outcome._

**Dependencies**: Story 1 (need project list view)

### Tasks

- [x] Event: `project.created` with `{ id, name, description?, createdAt }`
- [x] UI: Update create project modal to include description field
- [x] Form: Add description textarea with character limit (500 chars)
- [x] Validation: Name required, description optional
- [x] Display: Show description in project cards and project header
- [x] Tests: Form validation, event emission, description display
- [x] DoD: New projects can be created with descriptions that appear in project lists and headers

### Implementation Notes

- **Rich Context**: Descriptions help distinguish projects and provide context for AI workers
- **Character Limit**: 500 characters provides enough context without overwhelming the UI
- **Optional Field**: Description is optional to maintain simplicity for quick project creation

---

## Story 3 – View project as unified workspace (Kanban + future documents)

**User story**: _As a user, I want to view a project as a workspace that shows tasks in Kanban columns, preparing for future document integration._

**Dependencies**: Story 2 (need projects with descriptions)

### Tasks

- [x] UI: Rename `KanbanBoard` component to `ProjectWorkspace`
- [x] Layout: Create tabbed interface with "Tasks" tab (Documents tab comes in Phase 1.2)
- [x] Header: Add project description display in workspace header
- [x] Breadcrumb: Add project name breadcrumb navigation
- [x] Routing: Update `/board/:id` to `/project/:id`
- [x] Context: Create ProjectContext for sharing project data across workspace tabs
- [x] Tests: Workspace layout, tab navigation, project context
- [x] DoD: Project workspace shows tasks in Kanban view with room for future document integration

### Implementation Notes

- **Future-Ready**: Tab structure prepares for documents without adding complexity
- **Consistent Navigation**: Breadcrumbs help users understand their location in the app
- **Semantic URLs**: `/project/:id` is clearer than `/board/:id` for the unified concept

---

## Story 4 – Support orphaned tasks (tasks without projects)

**User story**: _As a user, I want to create and manage tasks that don't belong to any specific project so I can capture work that doesn't fit project boundaries._

**Dependencies**: Story 3 (need project workspace foundation)

### Tasks

- [ ] Schema: Ensure `tasks.projectId` is optional (already implemented)
- [ ] Query: Create `getOrphanedTasks$` query for tasks with null projectId
- [ ] UI: Create "Orphaned Tasks" special project view accessible from main navigation
- [ ] Creation: Allow task creation without project assignment
- [ ] Assignment: Add ability to assign orphaned tasks to projects via drag-and-drop or modal
- [ ] Navigation: Add "Orphaned Tasks" link in main navigation
- [ ] Tests: Orphaned task queries, assignment flows, navigation
- [ ] DoD: Users can create, view, and manage tasks without project assignment

### Implementation Notes

- **Flexible Workflow**: Some work doesn't fit into projects and needs a place to live
- **Easy Assignment**: Orphaned tasks can be easily moved into projects when appropriate
- **Visible Access**: Orphaned tasks aren't hidden - they have their own navigation item

---

## Story 5 – Move tasks between projects

**User story**: _As a user, I want to move tasks from one project to another so I can reorganize work as project boundaries evolve._

**Dependencies**: Story 4 (need task assignment capabilities)

### Tasks

- [ ] Event: `task.moved` event to support cross-project moves (extend existing event)
- [ ] UI: Add "Move to Project" option in task modal
- [ ] Modal: Create project selector modal for task reassignment
- [ ] Validation: Ensure task positions are recalculated when moving between projects
- [ ] Drag-and-drop: Support dragging tasks between project workspaces (future enhancement)
- [ ] Query: Update task queries to handle project changes correctly
- [ ] Tests: Cross-project task moves, position recalculation, project assignment
- [ ] DoD: Tasks can be moved between projects while maintaining their column positions

### Implementation Notes

- **Project Evolution**: Projects evolve and tasks may need to move between them
- **Position Integrity**: Task positions are recalculated relative to the new project's columns
- **Audit Trail**: Task moves are tracked through events for future reporting

---

---

## ⏳ Deferred to Phase 2

### Story 6 – Global task search across all projects

**Reason**: Complex feature that requires search infrastructure. Better suited for Phase 2 when we have more projects and tasks to search.

### Story 7 – Project dashboard with task statistics

**Reason**: Nice-to-have feature that can wait until core project management is solid.

### Story 8 – Archive completed projects

**Reason**: Archival is important but not needed for initial project management functionality.

---

## Technical Implementation Notes

### Database Schema Changes

```typescript
// Updated schema for projects (renamed from boards)
projects: {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  archivedAt?: number
}

// Updated tasks schema (projectId becomes optional)
tasks: {
  id: string
  projectId?: string  // Optional - supports orphaned tasks
  title: string
  description?: string
  column: string
  position: number
  assigneeIds?: string[]
  dueDate?: string
  createdAt: number
  updatedAt: number
  archivedAt?: number
}
```

### Event System Updates

```typescript
// Project events (renamed from board events)
type ProjectEvent =
  | { type: 'project.created'; id: string; name: string; description?: string }
  | { type: 'project.updated'; id: string; updates: Partial<Project> }
  | { type: 'project.archived'; id: string; archivedAt: number }

// Extended task events
type TaskEvent =
  | { type: 'task.created'; id: string; projectId?: string; title: string; description?: string }
  | { type: 'task.moved'; id: string; projectId?: string; column: string; position: number }
  | { type: 'task.updated'; id: string; updates: Partial<Task> }
  | { type: 'task.archived'; id: string; archivedAt: number }
```

### Schema Evolution Strategy

1. **Direct Updates**: Update schema definitions directly
2. **Additive Changes**: Add new fields without breaking existing functionality
3. **Semantic Renaming**: Rename concepts in code
4. **Progressive Enhancement**: New features work alongside existing Kanban functionality

### Testing Strategy

- **Unit Tests**: Event handling, query results, component rendering
- **Integration Tests**: Cross-project task moves, project workspace functionality
- **E2E Tests**: Complete user workflows from project creation to task management

### Performance Considerations

- **Query Optimization**: Efficient queries for task and project operations
- **Real-time Updates**: LiveStore reactivity keeps UI synchronized
- **Component Optimization**: Efficient rendering for large task lists

---

## Implementation Guidelines

1. **Progressive Enhancement**: Each story adds value without breaking existing features
2. **Event-Driven**: All changes flow through LiveStore events
3. **Test Coverage**: Maintain >80% test coverage for all new functionality
4. **Mobile-First**: Ensure all features work well on mobile devices

## Success Metrics

- [ ] Projects can be created with descriptions and context
- [ ] Tasks can exist with or without project assignment
- [ ] Tasks can be moved between projects
- [ ] Project workspace provides unified view of project tasks

This foundation prepares for Phase 1.2 (Document System) and Phase 2 (AI Workers) while providing immediate value through improved project organization.
