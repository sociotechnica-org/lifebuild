# New UI Foundation Plan

> **Status: DONE** — The foundation described here was implemented and has since become the only UI. The legacy UI was fully removed in PR #572, and routes now live at the root level (`/life-map`, `/drafting-room`, etc.) rather than under `/new`. The `components/new/` directory still exists but is scheduled to be renamed as a follow-up.

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

### Key Files

- `packages/web/src/Root.tsx` - Main app routing with React Router (BrowserRouter, Routes, Route)
- `packages/web/src/constants/routes.ts` - Route constants and generators
- `packages/shared/src/livestore/queries.ts` - LiveStore query functions
- `packages/shared/src/livestore/schema.ts` - Schema definitions and types
- `packages/web/src/components/` - Existing component patterns (using Link from react-router-dom)

## Technical Implementation Plan

1. **Create new directory structure:**

   ```
   packages/web/src/components/new/
   ├── projects/
   │   ├── ProjectsListPage.tsx           # /new/projects page
   │   ├── ProjectsListPage.stories.tsx   # Storybook stories
   │   ├── ProjectDetailPage.tsx          # /new/projects/:projectId page
   │   └── ProjectDetailPage.stories.tsx  # Storybook stories
   └── README.md                           # Documentation for new UI structure
   ```

2. **Add new routes to Root.tsx:**
   - `/new/projects` - List all projects
   - `/new/projects/:projectId` - View specific project with tasks
   - Add route constants to `constants/routes.ts`

3. **Build ProjectsListPage component:**
   - Display simple text-based list of projects
   - Show project name using `<Link>` from react-router-dom (not `<a>` tags)
   - Handle empty state (no projects)
   - Fetch all projects using `useQuery(getProjects$)` with `?? []` fallback
   - Note: `useQuery` returns data synchronously; LiveStore handles loading internally
   - Create Storybook stories: Default (3-5 projects), Empty state, Single project

4. **Build ProjectDetailPage component:**
   - Display project name and description (if exists)
   - Display list of tasks (simple list, not kanban)
   - Show task info: title, status, assignee name(s), description indicator, comments indicator
   - Handle empty state (no tasks)
   - Use `<Link>` back to projects list
   - Data fetching strategy (avoid N+1 queries):
     - Fetch project: `useQuery(getProjectById$(projectId))` → single Project or undefined
     - Fetch all tasks: `useQuery(getProjectTasks$(projectId))` → Task[] (already filtered by projectId)
     - Fetch all users once: `useQuery(getUsers$)` → User[] (memoized by LiveStore)
     - Client-side join: Parse task.assigneeIds JSON, map to user names from users array
     - For comment counts: For each task, `useQuery(getTaskComments$(task.id))` returns memoized results
     - Note: LiveStore memoizes queries, so multiple useQuery calls don't cause N+1 DB hits
   - Handle not found: Check if project is undefined and show message
   - Create Storybook stories: Default (project + 5-10 tasks), Empty state, Single task, Many tasks (20+)

5. **Create README.md in `src/components/new/`:**
   - Explain purpose of new UI directory
   - Document structure and patterns
   - Link to this plan document

6. **Run quality checks:**
   - Run `pnpm lint-all`
   - Run `pnpm test`
   - Verify Storybook builds

## Data Requirements & Query Contract

### Available Queries (from `packages/shared/src/livestore/queries.ts`)

All queries are already implemented and ready to use:

1. **`getProjects$`** - Query object (not a function)
   - Returns: `Project[]` (non-deleted, non-archived projects)
   - Type: `{ id, name, description, category, attributes, createdAt, updatedAt, archivedAt, deletedAt }`

2. **`getProjectById$(projectId: string)`** - Query factory function
   - Returns: `Project | undefined` (single project or undefined if not found)

3. **`getProjectTasks$(projectId: string)`** - Query factory function
   - Returns: `Task[]` (non-archived tasks for this project, ordered by position)
   - Type: `{ id, projectId, title, description, status, assigneeIds, attributes, position, createdAt, updatedAt, archivedAt }`
   - Note: `assigneeIds` is a JSON string array that needs parsing: `JSON.parse(task.assigneeIds || '[]')`

4. **`getUsers$`** - Query object (not a function)
   - Returns: `User[]` (all users, ordered by name)
   - Type: `{ id, email, name, avatarUrl, isAdmin, createdAt, syncedAt }`

5. **`getTaskComments$(taskId: string)`** - Query factory function
   - Returns: `Comment[]` (all comments for a task, ordered by createdAt desc)
   - Type: `{ id, taskId, authorId, content, createdAt }`

### Data Fetching Strategy

**Projects List Page:**

```typescript
const projects = useQuery(getProjects$) ?? []
```

**Project Detail Page:**

```typescript
// Single queries - memoized by LiveStore
const project = useQuery(getProjectById$(projectId))
const tasks = useQuery(getProjectTasks$(projectId)) ?? []
const users = useQuery(getUsers$) ?? []

// Client-side processing
const enrichedTasks = tasks.map(task => {
  const assigneeIds = JSON.parse(task.assigneeIds || '[]') as string[]
  const assignees = assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean)
  const comments = useQuery(getTaskComments$(task.id)) ?? []

  return {
    ...task,
    assigneeNames: assignees.map(a => a.name).join(', '),
    hasDescription: !!task.description,
    hasComments: comments.length > 0,
  }
})
```

Note: Each `useQuery` call is memoized by LiveStore, so querying comments for each task doesn't cause performance issues.

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
    ├── ProjectsListPage
    │   ├── Default
    │   ├── Empty State
    │   └── Single Project
    └── ProjectDetailPage
        ├── Default
        ├── Empty State
        ├── Single Task
        └── Many Tasks
```

## Component Pattern Example

Following CLAUDE.md patterns (using LiveStore directly in components and stories):

```typescript
// ProjectsListPage.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/livestore/queries'

export const ProjectsListPage: React.FC = () => {
  // useQuery returns data synchronously; LiveStore handles loading internally
  const projects = useQuery(getProjects$) ?? []

  return (
    <div>
      <h1>Projects</h1>
      {projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              {/* Use Link from react-router-dom, not <a> tags */}
              <Link to={`/new/projects/${project.id}`}>{project.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ProjectDetailPage.tsx - Full example with data fetching
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import {
  getProjectById$,
  getProjectTasks$,
  getUsers$,
  getTaskComments$,
} from '@work-squared/shared/livestore/queries'

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return <div>Invalid project ID</div>
  }

  const project = useQuery(getProjectById$(projectId))
  const tasks = useQuery(getProjectTasks$(projectId)) ?? []
  const users = useQuery(getUsers$) ?? []

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div>
      <Link to="/new/projects">← Back to projects</Link>
      <h1>{project.name}</h1>
      {project.description && <p>{project.description}</p>}

      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks in this project</p>
      ) : (
        <ul>
          {tasks.map(task => {
            // Parse assignee IDs and look up user names
            const assigneeIds = JSON.parse(task.assigneeIds || '[]') as string[]
            const assignees = assigneeIds
              .map(id => users.find(u => u.id === id))
              .filter(Boolean)
            const assigneeNames = assignees.map(a => a.name).join(', ')

            // Check for comments (memoized by LiveStore)
            const comments = useQuery(getTaskComments$(task.id)) ?? []
            const hasComments = comments.length > 0

            return (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span> [{task.status}]</span>
                {assigneeNames && <span> - {assigneeNames}</span>}
                {task.description && <span> 📝</span>}
                {hasComments && <span> 💬</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ProjectsListPage.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ProjectsListPage } from './ProjectsListPage.js'
import { schema, events } from '@work-squared/shared/livestore/schema'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

const adapter = makeInMemoryAdapter()

const meta: Meta<typeof ProjectsListPage> = {
  title: 'New UI/Projects/ProjectsListPage',
  component: ProjectsListPage,
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectsListPage>

export default meta
type Story = StoryObj<typeof meta>

const defaultSetup = (store: Store) => {
  store.commit(events.projectCreated({
    id: '1',
    name: 'Project Alpha',
    description: 'First project',
    category: 'work',
    createdAt: new Date(),
    actorId: '1'
  }))
  store.commit(events.projectCreated({
    id: '2',
    name: 'Project Beta',
    description: 'Second project',
    category: 'work',
    createdAt: new Date(),
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

### React Router Architecture

The app uses React Router v6 with the following structure:

- **Main router:** `Root.tsx` exports the `<App>` component
- **Component tree:** `<BrowserRouter>` → `<Routes>` → `<Route>` elements
- **Protected routes:** Most routes are wrapped in `<ProtectedApp>` which includes `<LiveStoreProvider>`
- **Route constants:** Defined in `constants/routes.ts` for consistency

### Routes to Add

**In `Root.tsx`** (inside the `<ProtectedApp>` Routes block):

```typescript
<Route
  path={ROUTES.NEW_PROJECTS}
  element={
    <Layout>
      <ErrorBoundary>
        <ProjectsListPage />
      </ErrorBoundary>
    </Layout>
  }
/>
<Route
  path={ROUTES.NEW_PROJECT}
  element={
    <Layout>
      <ErrorBoundary>
        <ProjectDetailPage />
      </ErrorBoundary>
    </Layout>
  }
/>
```

**In `constants/routes.ts`:**

```typescript
export const ROUTES = {
  // ... existing routes
  NEW_PROJECTS: '/new/projects',
  NEW_PROJECT: '/new/projects/:projectId',
} as const

export const generateRoute = {
  // ... existing generators
  newProject: (id: string) => `/new/projects/${id}`,
} as const
```

### Navigation Access

For this foundation PR, the new pages are **accessed manually**:

- Navigate directly to `/new/projects` in the browser
- No sidebar/nav links added yet (future PR)
- Use browser back/forward or the "Back to projects" link in the UI

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
- ✅ Components use LiveStore directly via `useQuery` hooks
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

- Storybook setup with LiveStore events (first time using this pattern extensively)

**No Identified High Risks** - This is a straightforward foundation-laying PR

## Next Steps

1. **Review and approve this plan** with clarifications
2. **Examine existing routing and queries** to understand patterns
3. **Create directory structure and basic files**
4. **Implement Projects list page** (component + stories)
5. **Implement Project detail page** (component + stories)
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
