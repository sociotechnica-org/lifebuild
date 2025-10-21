# PR4: Project Categories - Detailed Implementation Plan

## Executive Summary

Add 8 predefined life area categories to projects as a simple string field, enabling better organization. This PR also completes the rename from "boards" to "projects" throughout the codebase while maintaining backwards compatibility, and adds full attributes JSON support for future extensibility.

## Current State Analysis

### Projects Schema

**Schema** (`packages/shared/src/livestore/schema.ts:39-56`):

```typescript
const boards = State.SQLite.table({
  name: 'projects', // ⚠️ Table name is 'projects' but variable is 'boards'
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
    deletedAt: State.SQLite.integer({ nullable: true }),
  },
})
```

**Events** (`packages/shared/src/livestore/events.ts:27-36`):

- Only `v1.ProjectCreated` exists
- No v2 project events yet
- No category support

**UI Components**:

- `CreateProjectModal` exists at `packages/web/src/components/projects/CreateProjectModal/`
- Currently uses v1.ProjectCreated event (line 49)
- Has name and description fields only

### Critical Issues to Address

1. **Server tools still create columns** (projects.ts:47-58): Must be removed since columns no longer exist.

2. **Inconsistent naming**: Variable is `boards` but table name is `projects`. Need to rename variable to `projects` for clarity.

3. **No v2 project events**: Need category and attributes support.

## PR4 Goals

1. ✅ Rename `boards` variable → `projects` throughout codebase
2. ✅ Add `category` string field to projects (union of 8 life areas)
3. ✅ Add `attributes` JSON field to projects (empty for now, used in PR5)
4. ✅ Add `archivedAt` field to projects (for PR6 archiving support)
5. ✅ Create v2 project events with category/attributes support
6. ✅ Update CreateProjectModal to include category selector
7. ✅ Update ProjectCard to display category badge
8. ✅ Remove column creation from server tools (critical bug fix)
9. ✅ Maintain backwards compatibility with v1.ProjectCreated events

## The 8 Life Area Categories

Categories are defined as string literal types - no database table needed.

| Category Value  | Display Name               | Description                                                 | Color     |
| --------------- | -------------------------- | ----------------------------------------------------------- | --------- |
| `health`        | Health & Well-Being        | Physical health, fitness, mental wellness, self-care        | `#10B981` |
| `relationships` | Relationships              | Family, friends, romantic relationships, social connections | `#EC4899` |
| `finances`      | Finances                   | Income, expenses, investments, financial planning           | `#3B82F6` |
| `growth`        | Personal Growth & Learning | Education, skills, personal development, hobbies            | `#8B5CF6` |
| `leisure`       | Leisure & Lifestyle        | Recreation, entertainment, travel, fun activities           | `#F59E0B` |
| `spirituality`  | Spirituality & Meaning     | Religion, philosophy, purpose, values, mindfulness          | `#6366F1` |
| `home`          | Home & Environment         | Living space, organization, home projects, environment      | `#14B8A6` |
| `contribution`  | Contribution & Service     | Community service, volunteering, giving back, impact        | `#EF4444` |

## Implementation Plan

### Phase 1: Schema Changes

#### 1.1 Rename `boards` → `projects`

**File**: `packages/shared/src/livestore/schema.ts:39-56`

**Change**: Rename variable from `boards` to `projects`:

```typescript
const projects = State.SQLite.table({
  name: 'projects',
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    name: State.SQLite.text({ default: '' }),
    description: State.SQLite.text({ nullable: true }),
    // NEW: Add category field (nullable - projects don't require a category)
    category: State.SQLite.text({ nullable: true }), // 'health' | 'relationships' | etc.
    // NEW: Add attributes for future extensibility (PR5)
    attributes: State.SQLite.text({
      nullable: true,
      schema: Schema.parseJson(
        Schema.Struct({
          // Future: scale, complexity, urgency, etc.
        })
      ),
    }),
    createdAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    updatedAt: State.SQLite.integer({
      schema: Schema.DateFromNumber,
    }),
    deletedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
    // NEW: Add archivedAt for project archiving (used in PR6)
    archivedAt: State.SQLite.integer({
      nullable: true,
      schema: Schema.DateFromNumber,
    }),
  },
})
```

#### 1.2 Update Type Exports

**File**: `packages/shared/src/livestore/schema.ts:327-347`

```typescript
export type Project = State.SQLite.FromTable.RowDecoded<typeof projects>
export type ProjectCategory =
  | 'health'
  | 'relationships'
  | 'finances'
  | 'growth'
  | 'leisure'
  | 'spirituality'
  | 'home'
  | 'contribution'

// Backwards compatibility alias (deprecated)
export type Board = Project
```

#### 1.3 Update Tables Export

**File**: `packages/shared/src/livestore/schema.ts:354-373`

```typescript
export const tables = {
  uiState,
  chatMessages,
  projects,
  users,
  tasks,
  conversations,
  comments,
  documents,
  documentProjects,
  workers,
  workerProjects,
  recurringTasks,
  eventsLog,
  settings,
  contacts,
  projectContacts,
  taskExecutions,
}
```

#### 1.4 Update All Materializers

**File**: `packages/shared/src/livestore/schema.ts`

**Search and replace**: `boards.` → `projects.` throughout materializers

**Update v1.ProjectCreated materializer** (line ~407):

```typescript
'v1.ProjectCreated': ({ id, name, description, createdAt, actorId }) => [
  projects.insert({
    id,
    name,
    description,
    category: null,    // PR4: v1 projects have no category
    attributes: null,  // PR4: v1 projects have no attributes
    createdAt,
    updatedAt: createdAt,
  }),
  eventsLog.insert({
    id: `project_created_${id}`,
    eventType: 'v1.ProjectCreated',
    eventData: JSON.stringify({ id, name, description }),
    actorId,
    createdAt,
  }),
],
```

### Phase 2: Constants

#### 2.1 Add Category Constants

**File**: `packages/shared/src/constants.ts`

**Add at end**:

```typescript
// ============================================================================
// PROJECT CATEGORIES
// ============================================================================

/**
 * Project category type
 */
export type ProjectCategory =
  | 'health'
  | 'relationships'
  | 'finances'
  | 'growth'
  | 'leisure'
  | 'spirituality'
  | 'home'
  | 'contribution'

/**
 * Default project categories for UI display
 * These are hardcoded options - no database table needed
 */
export const PROJECT_CATEGORIES = [
  {
    value: 'health' as const,
    name: 'Health & Well-Being',
    description: 'Physical health, fitness, mental wellness, self-care',
    colorHex: '#10B981',
  },
  {
    value: 'relationships' as const,
    name: 'Relationships',
    description: 'Family, friends, romantic relationships, social connections',
    colorHex: '#EC4899',
  },
  {
    value: 'finances' as const,
    name: 'Finances',
    description: 'Income, expenses, investments, financial planning',
    colorHex: '#3B82F6',
  },
  {
    value: 'growth' as const,
    name: 'Personal Growth & Learning',
    description: 'Education, skills, personal development, hobbies',
    colorHex: '#8B5CF6',
  },
  {
    value: 'leisure' as const,
    name: 'Leisure & Lifestyle',
    description: 'Recreation, entertainment, travel, fun activities',
    colorHex: '#F59E0B',
  },
  {
    value: 'spirituality' as const,
    name: 'Spirituality & Meaning',
    description: 'Religion, philosophy, purpose, values, mindfulness',
    colorHex: '#6366F1',
  },
  {
    value: 'home' as const,
    name: 'Home & Environment',
    description: 'Living space, organization, home projects, environment',
    colorHex: '#14B8A6',
  },
  {
    value: 'contribution' as const,
    name: 'Contribution & Service',
    description: 'Community service, volunteering, giving back, impact',
    colorHex: '#EF4444',
  },
] as const

/**
 * Helper to get category display information
 */
export function getCategoryInfo(category: ProjectCategory | null | undefined) {
  if (!category) return null
  return PROJECT_CATEGORIES.find(c => c.value === category) || null
}
```

### Phase 3: Events

#### 3.1 Add V2 Project Events

**File**: `packages/shared/src/livestore/events.ts`

**Add after task events** (around line 547):

```typescript
// ============================================================================
// V2 PROJECT EVENTS - With Categories & Attributes
// ============================================================================

export const projectCreatedV2 = Events.synced({
  name: 'v2.ProjectCreated',
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String),
    category: Schema.optional(
      Schema.Literal('health', 'relationships', 'finances', 'growth', 'leisure', 'spirituality', 'home', 'contribution')
    ),
    attributes: Schema.optional(
      Schema.Struct({
        // Future: scale, complexity, urgency, etc.
      })
    ),
    createdAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectUpdated = Events.synced({
  name: 'v2.ProjectUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    updates: Schema.Struct({
      name: Schema.optional(Schema.String),
      description: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
      category: Schema.optional(
        Schema.Union(
          Schema.Literal(
            'health',
            'relationships',
            'finances',
            'growth',
            'leisure',
            'spirituality',
            'home',
            'contribution'
          ),
          Schema.Null
        )
      ),
    }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectAttributesUpdated = Events.synced({
  name: 'v2.ProjectAttributesUpdated',
  schema: Schema.Struct({
    id: Schema.String,
    attributes: Schema.Struct({
      // Future: scale, complexity, urgency, etc.
    }),
    updatedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectArchived = Events.synced({
  name: 'v2.ProjectArchived',
  schema: Schema.Struct({
    id: Schema.String,
    archivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})

export const projectUnarchived = Events.synced({
  name: 'v2.ProjectUnarchived',
  schema: Schema.Struct({
    id: Schema.String,
    unarchivedAt: Schema.Date,
    actorId: Schema.optional(Schema.String),
  }),
})
```

### Phase 4: Materializers

#### 4.1 Add V2 Project Materializers

**File**: `packages/shared/src/livestore/schema.ts`

**Add after v2 task materializers** (around line 901):

```typescript
// ============================================================================
// V2 PROJECT MATERIALIZERS - With Categories & Attributes
// ============================================================================

'v2.ProjectCreated': ({ id, name, description, category, attributes, createdAt, actorId }) => [
  projects.insert({
    id,
    name,
    description,
    category: category || null,
    attributes: attributes || null,
    createdAt,
    updatedAt: createdAt,
    archivedAt: null,
  }),
  eventsLog.insert({
    id: `project_created_${id}_${createdAt.getTime()}`,
    eventType: 'v2.ProjectCreated',
    eventData: JSON.stringify({ id, name, description, category }),
    actorId,
    createdAt,
  }),
],

'v2.ProjectUpdated': ({ id, updates, updatedAt, actorId }) => {
  const updateData: Record<string, any> = { updatedAt }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.category !== undefined) updateData.category = updates.category

  return [
    projects.update(updateData).where({ id }),
    eventsLog.insert({
      id: `project_updated_${id}_${updatedAt.getTime()}`,
      eventType: 'v2.ProjectUpdated',
      eventData: JSON.stringify({ id, updates }),
      actorId,
      createdAt: updatedAt,
    }),
  ]
},

'v2.ProjectAttributesUpdated': ({ id, attributes, updatedAt, actorId }) => [
  projects.update({
    // Full replacement - caller must merge before emitting
    attributes,
    updatedAt,
  }).where({ id }),
  eventsLog.insert({
    id: `project_attributes_updated_${id}_${updatedAt.getTime()}`,
    eventType: 'v2.ProjectAttributesUpdated',
    eventData: JSON.stringify({ id, attributes }),
    actorId,
    createdAt: updatedAt,
  }),
],

'v2.ProjectArchived': ({ id, archivedAt, actorId }) => [
  projects.update({ archivedAt }).where({ id }),
  eventsLog.insert({
    id: `project_archived_${id}_${archivedAt.getTime()}`,
    eventType: 'v2.ProjectArchived',
    eventData: JSON.stringify({ id }),
    actorId,
    createdAt: archivedAt,
  }),
],

'v2.ProjectUnarchived': ({ id, unarchivedAt, actorId }) => [
  projects.update({ archivedAt: null, updatedAt: unarchivedAt }).where({ id }),
  eventsLog.insert({
    id: `project_unarchived_${id}_${unarchivedAt.getTime()}`,
    eventType: 'v2.ProjectUnarchived',
    eventData: JSON.stringify({ id }),
    actorId,
    createdAt: unarchivedAt,
  }),
],
```

### Phase 5: Queries

#### 5.1 Rename Query Variables

**File**: `packages/shared/src/livestore/queries.ts`

**Changes**:

```typescript
// Line 7-14: Already uses tables.boards, change to tables.projects
export const getBoards$ = queryDb(
  _get => {
    return tables.projects.select().where({
      // CHANGED from tables.boards
      deletedAt: undefined,
    })
  },
  { label: 'getBoards' }
)

// Similarly update all other queries that reference tables.boards
// Search for: tables.boards → tables.projects
```

#### 5.2 Add Category Filter Query

**File**: `packages/shared/src/livestore/queries.ts`

**Add at end** (around line 353):

```typescript
/**
 * Get projects by category
 */
export const getProjectsByCategory$ = (category: string) =>
  queryDb(
    tables.projects
      .select()
      .where({ category, deletedAt: null })
      .orderBy([{ col: 'updatedAt', direction: 'desc' }]),
    { label: `getProjectsByCategory:${category}` }
  )
```

### Phase 6: Server Tools

#### 6.1 Update Project Creation Tool

**File**: `packages/server/src/tools/projects.ts`

**Update imports**:

```typescript
import { PROJECT_CATEGORIES } from '@work-squared/shared'
```

**Remove DEFAULT_KANBAN_COLUMNS import** (line 9) - no longer needed

**Update type definitions**:

```typescript
interface CreateProjectParams {
  name: string
  description?: string
  category?: string // NEW: One of the 8 category values
}
```

**Update `createProjectCore` function** (lines 27-76):

```typescript
function createProjectCore(store: Store, params: CreateProjectParams, actorId?: string): CreateProjectResult {
  try {
    const projectId = crypto.randomUUID()
    const now = new Date()

    // Validate category if provided
    if (params.category) {
      const validCategory = PROJECT_CATEGORIES.find(c => c.value === params.category)
      if (!validCategory) {
        return {
          success: false,
          error: `Invalid category: ${params.category}. Must be one of: ${PROJECT_CATEGORIES.map(c => c.value).join(', ')}`,
        }
      }
    }

    // PR4: Use v2.ProjectCreated event with category support
    store.commit(
      events.projectCreatedV2({
        id: projectId,
        name: params.name,
        description: params.description,
        category: params.category as any, // Validated above
        attributes: undefined, // Will be used in PR5
        createdAt: now,
        actorId,
      })
    )

    // PR4: Column creation REMOVED
    // Columns table no longer exists after PR3
    // Tasks use status field directly

    return {
      success: true,
      project: {
        id: projectId,
        name: params.name,
        description: params.description,
        category: params.category,
        createdAt: now,
      },
    }
  } catch (error) {
    logger.error({ error }, 'Error creating project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
```

#### 6.2 Add Update Project Tool

**File**: `packages/server/src/tools/projects.ts`

**Add new function**:

```typescript
/**
 * Update project properties including category
 */
function updateProjectCore(
  store: Store,
  params: {
    projectId: string
    name?: string
    description?: string | null
    category?: string | null
  },
  actorId?: string
): { success: boolean; error?: string } {
  try {
    // Validate category if provided and not null
    if (params.category && typeof params.category === 'string') {
      const validCategory = PROJECT_CATEGORIES.find(c => c.value === params.category)
      if (!validCategory) {
        return {
          success: false,
          error: `Invalid category: ${params.category}`,
        }
      }
    }

    const now = new Date()

    store.commit(
      events.projectUpdated({
        id: params.projectId,
        updates: {
          name: params.name,
          description: params.description,
          category: params.category as any,
        },
        updatedAt: now,
        actorId,
      })
    )

    return { success: true }
  } catch (error) {
    logger.error({ error }, 'Error updating project')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export const updateProject = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => updateProjectCore(store, params, actorId))(store, params)
```

### Phase 7: UI Components

#### 7.1 Create ProjectCategoryBadge Component

**File**: Create `packages/web/src/components/projects/ProjectCategoryBadge.tsx`

```typescript
import React from 'react'
import { getCategoryInfo, type ProjectCategory } from '@work-squared/shared/constants'

interface ProjectCategoryBadgeProps {
  category: ProjectCategory
  size?: 'sm' | 'md' | 'lg'
}

export const ProjectCategoryBadge: React.FC<ProjectCategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const info = getCategoryInfo(category)
  if (!info) return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: info.colorHex }}
      title={info.description}
    >
      {info.name}
    </span>
  )
}
```

#### 7.2 Update CreateProjectModal

**File**: `packages/web/src/components/projects/CreateProjectModal/CreateProjectModal.tsx`

**Add imports**:

```typescript
import { PROJECT_CATEGORIES } from '@work-squared/shared/constants'
```

**Add state** (after line 16):

```typescript
const [category, setCategory] = useState<string>('')
```

**Update handleSubmit** (lines 48-56):

```typescript
// Create the project using v2 event
store.commit(
  events.projectCreatedV2({
    id: projectId,
    name: name.trim(),
    description: description.trim() || undefined,
    category: category || undefined,
    attributes: undefined, // Will be used in PR5
    createdAt,
    actorId: user?.id,
  })
)
```

**Update reset logic** (lines 61-64 and 74-77):

```typescript
// Add to both places:
setCategory('')
```

**Add category selector in form** (after description field, around line 179):

```typescript
{/* Project Category */}
<div>
  <label
    htmlFor='project-category'
    className='block text-sm font-medium text-gray-900 mb-2'
  >
    Category
  </label>
  <select
    id='project-category'
    value={category}
    onChange={e => setCategory(e.target.value)}
    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  >
    <option value=''>No category</option>
    {PROJECT_CATEGORIES.map(cat => (
      <option key={cat.value} value={cat.value}>
        {cat.name}
      </option>
    ))}
  </select>
  {category && (
    <p className='mt-1 text-sm text-gray-500'>
      {PROJECT_CATEGORIES.find(c => c.value === category)?.description}
    </p>
  )}
</div>
```

#### 7.3 Update ProjectCard Component

**File**: `packages/web/src/components/projects/ProjectCard/ProjectCard.tsx`

**Add import**:

```typescript
import { ProjectCategoryBadge } from '../ProjectCategoryBadge.js'
```

**Add category display** (after line 43):

```typescript
{project.category && (
  <div className='mb-2'>
    <ProjectCategoryBadge category={project.category as any} size='sm' />
  </div>
)}
```

### Phase 8: Testing

#### 8.1 Unit Tests

**File**: Create `packages/shared/src/livestore/__tests__/project-categories.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { Store } from '@livestore/livestore'
import { schema, events } from '../schema.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'

describe('Project Categories (PR4)', () => {
  it('v1.ProjectCreated sets category to null', async () => {
    const store = new Store({ schema, adapter: makeInMemoryAdapter() })

    store.commit(
      events.projectCreated({
        id: 'proj-1',
        name: 'Test Project',
        description: 'Test',
        createdAt: new Date(),
        actorId: 'user-1',
      })
    )

    const projects = await store.query(db => db.table('projects').select())
    expect(projects[0].category).toBe(null)
    expect(projects[0].attributes).toBe(null)
  })

  it('v2.ProjectCreated accepts category', async () => {
    const store = new Store({ schema, adapter: makeInMemoryAdapter() })

    store.commit(
      events.projectCreatedV2({
        id: 'proj-1',
        name: 'Health Project',
        description: 'Fitness goals',
        category: 'health',
        createdAt: new Date(),
        actorId: 'user-1',
      })
    )

    const projects = await store.query(db => db.table('projects').select())
    expect(projects[0].category).toBe('health')
  })

  it('v2.ProjectCreated works without category', async () => {
    const store = new Store({ schema, adapter: makeInMemoryAdapter() })

    store.commit(
      events.projectCreatedV2({
        id: 'proj-1',
        name: 'Uncategorized',
        createdAt: new Date(),
      })
    )

    const projects = await store.query(db => db.table('projects').select())
    expect(projects[0].category).toBe(null)
  })

  it('v2.ProjectUpdated updates category', async () => {
    const store = new Store({ schema, adapter: makeInMemoryAdapter() })

    // Create project without category
    store.commit(
      events.projectCreatedV2({
        id: 'proj-1',
        name: 'Test',
        createdAt: new Date(),
      })
    )

    // Update to add category
    store.commit(
      events.projectUpdated({
        id: 'proj-1',
        updates: { category: 'finances' },
        updatedAt: new Date(),
      })
    )

    const projects = await store.query(db => db.table('projects').select())
    expect(projects[0].category).toBe('finances')
  })

  it('v2.ProjectUpdated can remove category', async () => {
    const store = new Store({ schema, adapter: makeInMemoryAdapter() })

    // Create with category
    store.commit(
      events.projectCreatedV2({
        id: 'proj-1',
        name: 'Test',
        category: 'health',
        createdAt: new Date(),
      })
    )

    // Remove category
    store.commit(
      events.projectUpdated({
        id: 'proj-1',
        updates: { category: null },
        updatedAt: new Date(),
      })
    )

    const projects = await store.query(db => db.table('projects').select())
    expect(projects[0].category).toBe(null)
  })
})
```

#### 8.2 Integration Tests

Test workflows:

- Create project without category via UI
- Create project with category via UI
- Update project category
- Remove category from project
- Verify category displays on card

#### 8.3 E2E Tests

**File**: Add to existing E2E test suite

Test user flows:

- User creates project with health category
- Category badge appears on project card
- User edits project and changes category
- User removes category from project

## Implementation Checklist

### Schema & Types

- [ ] Rename `boards` variable → `projects` in schema.ts
- [ ] Add `category` field to projects table (nullable string)
- [ ] Add `attributes` field to projects table (nullable JSON)
- [ ] Add `archivedAt` field to projects table (nullable)
- [ ] Update `Project` type export
- [ ] Add `ProjectCategory` type export
- [ ] Update `Board` type alias for backwards compat
- [ ] Update tables export to use `projects`
- [ ] Update all materializers: `boards.` → `projects.`

### Constants

- [ ] Add `ProjectCategory` type to constants.ts
- [ ] Add `PROJECT_CATEGORIES` array to constants.ts
- [ ] Add `getCategoryInfo()` helper to constants.ts

### Events

- [ ] Add v2.ProjectCreated event with category/attributes
- [ ] Add v2.ProjectUpdated event
- [ ] Add v2.ProjectAttributesUpdated event
- [ ] Add v2.ProjectArchived event
- [ ] Add v2.ProjectUnarchived event

### Materializers

- [ ] Update v1.ProjectCreated: set category=null, attributes=null
- [ ] Add v2.ProjectCreated materializer
- [ ] Add v2.ProjectUpdated materializer
- [ ] Add v2.ProjectAttributesUpdated materializer
- [ ] Add v2.ProjectArchived materializer
- [ ] Add v2.ProjectUnarchived materializer

### Queries

- [ ] Update all queries: `tables.boards` → `tables.projects`
- [ ] Add `getProjectsByCategory$` query

### Server Tools

- [ ] **CRITICAL**: Remove column creation from `createProjectCore`
- [ ] Update `createProjectCore` to use v2.ProjectCreated
- [ ] Update `createProjectCore` to accept category parameter
- [ ] Add category validation to `createProjectCore`
- [ ] Create `updateProjectCore` function
- [ ] Add category validation to `updateProjectCore`
- [ ] Export `updateProject` tool
- [ ] Remove DEFAULT_KANBAN_COLUMNS import

### UI Components

- [ ] Create `ProjectCategoryBadge` component
- [ ] Update `CreateProjectModal` to import PROJECT_CATEGORIES
- [ ] Add category state to CreateProjectModal
- [ ] Add category selector to CreateProjectModal form
- [ ] Update CreateProjectModal to use v2.ProjectCreated event
- [ ] Update category reset in CreateProjectModal
- [ ] Update `ProjectCard` to display category badge

### Testing

- [ ] Write unit tests for v1/v2 project materializers
- [ ] Write unit tests for category updates
- [ ] Write unit tests for category removal
- [ ] Add integration tests for project CRUD with categories
- [ ] Add E2E test for creating project with category
- [ ] Add E2E test for updating project category

### Final Checks

- [ ] Run `pnpm lint-all` - must pass
- [ ] Run `pnpm test` - must pass
- [ ] Run `CI=true pnpm test:e2e` - must pass
- [ ] Manual testing: Create project with each category
- [ ] Manual testing: Create project without category
- [ ] Manual testing: Update project category
- [ ] Manual testing: Remove category from project
- [ ] Verify v1 projects still work (no category)
- [ ] Verify category badges show correct colors
- [ ] Verify all "boards" references renamed to "projects"

## Expected Outcomes

After PR4 is complete:

✅ **Schema**: Projects have category and attributes fields
✅ **Types**: ProjectCategory type is string union of 8 values
✅ **Constants**: PROJECT_CATEGORIES array for UI dropdowns
✅ **Events**: V2 project events support categories and attributes
✅ **Server**: Tools use v2 events, support categories, no column creation
✅ **UI**: Category selector in modal, badge on cards
✅ **Naming**: Everything uses "projects" terminology consistently
✅ **Testing**: All tests pass, E2E flows work
✅ **Cleanup**: Column creation bug fixed

## Migration Impact

**Breaking Changes**: None - v1 events still work

**Backwards Compatibility**:

- Existing projects will have `category: null`
- v1.ProjectCreated events continue to work
- `Board` type alias maintained
- All v1 queries still work

**Data Migration**:

- No manual migration needed
- Categories are optional (nullable)
- No database seeding required

## Next Steps (PR5)

After PR4, PR5 will add:

- Project attributes usage (field already added in PR4)
- v2.ProjectAttributesUpdated event usage
- UI for managing project attributes
- Example attributes: scale, complexity, urgency

## References

- LiveStore patterns: https://docs.livestore.dev/llms.txt
- Current schema: `packages/shared/src/livestore/schema.ts`
- Current events: `packages/shared/src/livestore/events.ts`
- CreateProjectModal: `packages/web/src/components/projects/CreateProjectModal/CreateProjectModal.tsx`
