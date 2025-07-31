# Shared Package (@work-squared/shared)

Common schemas, event definitions, and utilities shared between the web frontend and worker backend packages.

## Overview

This package provides the foundation for type-safe communication and data consistency across the Work Squared application. It contains:

- **Event Definitions**: LiveStore event schemas for real-time synchronization
- **Database Schema**: Materialized view definitions for data storage
- **Query Definitions**: Reusable database queries for common operations
- **Type Definitions**: Shared TypeScript interfaces and types

## Package Contents

### Core Files

```
src/
├── events.ts           # LiveStore event definitions
├── schema.ts          # Database schema and materializers
├── queries.ts         # Database query definitions
└── index.ts          # Public API exports
```

### Event Definitions (events.ts)

Defines all events that flow through the LiveStore event sourcing system:

**Project Events:**

- `project.create` - Create new projects
- `project.update` - Update project details
- `project.delete` - Remove projects

**Task Events:**

- `task.create` - Create tasks in projects
- `task.update` - Modify task details
- `task.move` - Change task position/column
- `task.delete` - Remove tasks

**Document Events:**

- `document.create` - Create new documents
- `document.update` - Update document content
- `document.delete` - Remove documents

**Worker Events:**

- `worker.create` - Create AI worker profiles
- `worker.update` - Update worker configuration

**Chat Events:**

- `chat.create` - Start new conversations
- `chat.message.add` - Add messages to chats

### Database Schema (schema.ts)

Defines materialized views that transform events into queryable tables:

**Core Tables:**

- `projects` - Project information and metadata
- `tasks` - Task data with status and assignments
- `documents` - Document content and organization
- `workers` - AI worker profiles and configuration
- `chats` - Conversation threads
- `chat_messages` - Individual messages in conversations

**Materializers:**
Transform events into table rows with proper indexing and relationships.

### Query Definitions (queries.ts)

Pre-built database queries for common operations:

- Project listing and details
- Task querying by project/status
- Document search and retrieval
- Chat history and message lookup

## Usage

### In Web Package

```typescript
import { schema, queries } from '@work-squared/shared'
import { useQuery, useMutation } from '@livestore/react'

// Use shared schema for LiveStore provider
<LiveStoreProvider schema={schema}>

// Use shared queries in components
const projects = useQuery(queries.getAllProjects)

// Use shared events for mutations
const createProject = useMutation('project.create')
```

### In Worker Package

```typescript
import { schema } from '@work-squared/shared'
import { makeWorker } from '@livestore/adapter-web/worker'

// Use shared schema for worker configuration
makeWorker({
  schema,
  sync: {
    /* sync config */
  },
})
```

## Event Sourcing

Work Squared uses event sourcing as its primary data architecture:

### Benefits

- **Audit Trail**: Complete history of all system changes
- **Real-time Sync**: Events enable live collaboration
- **Data Consistency**: Single source of truth for all state changes
- **Debugging**: Full event log for troubleshooting

### Event Flow

```
User Action → Event → LiveStore → Materialized Views → UI Updates
```

1. User performs action (create task, edit document, etc.)
2. Action generates typed event with validation
3. Event flows through LiveStore event stream
4. Schema materializers update relevant database tables
5. Queries react to changes and update UI

### Event Design Principles

- **Immutable**: Events are never modified once created
- **Type-Safe**: Full TypeScript validation for all event payloads
- **Versioned**: Schema evolution support for backwards compatibility
- **Self-Describing**: Events contain all context needed for processing

## Type Safety

The shared package ensures type safety across the entire application:

### Compile-Time Validation

- Event payloads validated against schemas
- Database queries return properly typed results
- Cross-package imports maintain type information

### Runtime Validation

- LiveStore validates events against schemas at runtime
- Invalid events are rejected with detailed error messages
- Schema migrations handle data evolution safely

## Development

### Adding New Events

1. **Define Event Schema** in `events.ts`:

   ```typescript
   'myEntity.create': event({
     id: S.String,
     name: S.String,
     // ... other fields
   })
   ```

2. **Add Materializer** in `schema.ts`:

   ```typescript
   myEntities: materializer({
     'myEntity.create': event => ({
       id: event.id,
       name: event.name,
       createdAt: new Date(),
     }),
   })
   ```

3. **Create Queries** in `queries.ts`:

   ```typescript
   getAllMyEntities: query(db => db.table('myEntities').orderBy('createdAt', 'desc'))
   ```

4. **Update Exports** in `index.ts`:
   ```typescript
   export { getAllMyEntities } from './queries'
   ```

### Schema Evolution

When modifying schemas:

1. Add new fields as optional to maintain backward compatibility
2. Use schema versioning for breaking changes
3. Test migrations thoroughly in development
4. Document schema changes in commit messages

## Dependencies

The shared package has minimal dependencies to avoid version conflicts:

- **@effect/schema**: Schema validation and type inference
- **@livestore/livestore**: Event sourcing framework
- **TypeScript**: Static type checking

## Best Practices

### Event Design

- Keep events atomic and focused on single actions
- Include all necessary context in event payload
- Use consistent naming conventions across events
- Validate event payloads thoroughly

### Schema Design

- Design for queries you need to make
- Index frequently accessed fields
- Keep materializers simple and focused
- Consider performance implications of complex joins

### Type Safety

- Prefer explicit types over `any`
- Use branded types for IDs to prevent mixups
- Export only necessary types from shared package
- Keep shared types minimal and focused
