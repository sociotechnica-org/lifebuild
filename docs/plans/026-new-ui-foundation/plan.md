# New UI Foundation Plan

## Overview

This plan establishes the foundation for a complete UI revamp of Work Squared. The goal is to create a new directory structure and basic routing for the new UI, starting with Project and Projects pages. This PR focuses solely on **getting the right things on the page** - no design work or styling, just the foundation.

## Goals

1. Create a new `/new` route hierarchy for the new UI
2. Set up `src/components/new/` directory structure
3. Create a new Storybook section for new UI components
4. Build basic Projects list page (`/new/projects`)
5. Build basic Project detail page (`/new/projects/:projectId`)
6. Display project tasks in a simple list format (not kanban)

## Non-Goals (for this PR)

- Design work or styling
- Component refinement
- Kanban board implementation
- Complex UI patterns
- Full feature parity with existing UI

## Current State Analysis

### Existing Project Page Structure

Need to examine:
- Current routing setup
- How projects are currently queried
- How tasks are currently displayed
- Existing data fetching patterns

### Key Files to Review

- `packages/web/src/App.tsx` - Routing configuration
- `packages/shared/src/queries.ts` - Query functions for projects and tasks
- `packages/shared/src/schema.ts` - Schema definitions
- `packages/web/src/components/` - Existing component patterns

## Technical Implementation Plan

1. **Create new directory structure:**
   ```
   packages/web/src/components/new/
   ├── projects/
   │   ├── ProjectsListPage.tsx        # Container for /new/projects
   │   ├── ProjectsListPresenter.tsx   # Presenter component
   │   ├── ProjectsListPresenter.stories.tsx
   │   ├── ProjectDetailPage.tsx       # Container for /new/projects/:projectId
   │   ├── ProjectDetailPresenter.tsx  # Presenter component
   │   └── ProjectDetailPresenter.stories.tsx
   └── README.md                        # Documentation for new UI structure
   ```

2. **Add new routes to Root.tsx:**
   - `/new/projects` - List all projects
   - `/new/projects/:projectId` - View specific project with tasks
   - Add route constants to `constants/routes.ts`

3. **Build ProjectsListPresenter component:**
   - Display simple text-based list of projects
   - Show project name
   - Link to project detail page
   - Handle empty state (no projects)
   - Create Storybook stories: Default (3-5 projects), Empty state, Single project

4. **Build ProjectsListPage container:**
   - Fetch all projects using `getProjects$()`
   - Pass data to presenter
   - Follow Container/Presenter pattern

5. **Build ProjectDetailPresenter component:**
   - Display project name and description (if exists)
   - Display list of tasks (simple list, not kanban)
   - Show task info: title, status, assignee(s), description indicator, comments indicator
   - Handle empty state (no tasks)
   - Link back to projects list
   - Create Storybook stories: Default (project + 5-10 tasks), Empty state, Single task, Many tasks (20+)

6. **Build ProjectDetailPage container:**
   - Fetch project by ID using `getProjectById$()`
   - Fetch tasks for project using `getProjectTasks$()`
   - Fetch users for assignee lookup
   - Query comments to determine which tasks have comments
   - Pass data to presenter
   - Handle loading/error states

7. **Create README.md in `src/components/new/`:**
   - Explain purpose of new UI directory
   - Document structure and patterns
   - Link to this plan document

8. **Run quality checks:**
   - Run `pnpm lint-all`
   - Run `pnpm test`
   - Verify Storybook builds

## Data Requirements

### Projects List Page

```typescript
interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

Query: Use existing `getAllProjects$()` or similar from queries.ts

### Project Detail Page

```typescript
interface ProjectWithTasks {
  project: Project
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  status: string
  columnId?: string
  createdAt: Date
  updatedAt: Date
}
```

Queries needed:
- Get project by ID
- Get tasks for project (may need to examine existing kanban queries)

## UI Specifications (Minimal)

### Projects List Page
- Page title: "Projects"
- Unordered list of project names
- Each project links to `/new/projects/:projectId`
- Empty state: "No projects yet"

### Project Detail Page
- Back link to projects list
- Project name as heading
- Project description (if exists)
- Section heading: "Tasks"
- Unordered list of tasks showing:
  - Task title
  - Task status (todo/doing/in_review/done)
  - Assignee name(s) - parse assigneeIds JSON and look up user names
  - "📝" indicator if task has description
  - "💬" indicator if task has comments
- Empty state: "No tasks in this project"

## Storybook Structure

```
New UI/
└── Projects/
    ├── ProjectsListPresenter
    │   ├── Default
    │   ├── Empty State
    │   └── Single Project
    └── ProjectDetailPresenter
        ├── Default
        ├── Empty State
        ├── Single Task
        └── Many Tasks
```

## Component Pattern Example

Following CLAUDE.md patterns:

```typescript
// ProjectsListPage.tsx (Container)
export const ProjectsListPage: React.FC = () => {
  const projects = useQuery(getAllProjects$())

  return <ProjectsListPresenter projects={projects} />
}

// ProjectsListPresenter.tsx (Presenter)
export interface ProjectsListPresenterProps {
  projects: Project[]
}

export const ProjectsListPresenter: React.FC<ProjectsListPresenterProps> = ({
  projects
}) => {
  // Pure presentation logic
  return (
    <div>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              <a href={`/new/projects/${project.id}`}>{project.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ProjectsListPresenter.stories.tsx
const defaultSetup = (store: Store) => {
  store.commit(events.projectCreated({
    id: '1',
    name: 'Project Alpha',
    actorId: '1'
  }))
  store.commit(events.projectCreated({
    id: '2',
    name: 'Project Beta',
    actorId: '1'
  }))
}

export const Default: Story = {
  decorators: [
    Story => (
      <LiveStoreProvider
        schema={schema}
        adapter={adapter}
        batchUpdates={batchUpdates}
        boot={defaultSetup}
      >
        <Story />
      </LiveStoreProvider>
    ),
  ],
}
```

## Routing Setup

Using React Router (already in use). Routes to add to `Root.tsx`:
- `/new/projects` - Projects list page
- `/new/projects/:projectId` - Project detail page

Also need to add route constants to `constants/routes.ts`:
- `NEW_PROJECTS: '/new/projects'`
- `NEW_PROJECT: '/new/projects/:projectId'`

## Task Display Fields

Based on schema analysis, tasks have:
- `title` - Main display
- `status` - 'todo' | 'doing' | 'in_review' | 'done'
- `assigneeIds` - JSON array of user IDs (need to look up names)
- `description` - Nullable, need to check if exists
- Comments - Need to query comments table by taskId to check if any exist

Display for each task:
- Title
- Status badge/text
- Assignee name(s) (if any)
- "Has description" indicator (if description exists)
- "Has comments" indicator (if comments exist)

## Success Criteria

- ✅ New directory structure created at `src/components/new/`
- ✅ Routes work: `/new/projects` and `/new/projects/:projectId`
- ✅ Projects list displays all projects in workspace
- ✅ Project detail displays project info and tasks
- ✅ All components follow Container/Presenter pattern
- ✅ Storybook stories created under "New UI" category
- ✅ Stories use real LiveStore events, not mock data
- ✅ All tests pass (`pnpm lint-all` and `pnpm test`)
- ✅ Documentation README created

## Out of Scope

- Styling and design work
- Task creation/editing
- Kanban board view
- Filtering/sorting
- Search functionality
- Responsive design considerations
- Accessibility enhancements
- Performance optimizations

## Risk Assessment

**Low Risk:**
- Creating new directory structure
- Adding new routes
- Basic data fetching with existing queries

**Medium Risk:**
- Ensuring Container/Presenter pattern is followed correctly
- Storybook setup with LiveStore events

**No Identified High Risks** - This is a straightforward foundation-laying PR

## Next Steps

1. **Review and approve this plan** with clarifications
2. **Examine existing routing and queries** to understand patterns
3. **Create directory structure and basic files**
4. **Implement Projects list page** (container + presenter + stories)
5. **Implement Project detail page** (container + presenter + stories)
6. **Run quality checks** (lint-all, tests)
7. **Create PR** following CLAUDE.md workflow

## Timeline Estimate

This is a foundation-only PR, focused on structure not design. Total estimated time: ~3.5 hours

## Follow-up PRs (Future Work)

After this foundation PR is merged:

1. **Design & Styling PR** - Apply visual design to new UI
2. **Component Library PR** - Extract reusable components
3. **Enhanced Features PR** - Add filtering, sorting, search
4. **Kanban View PR** - Add kanban board option for tasks
5. **Migration PR** - Gradually replace old UI with new UI
