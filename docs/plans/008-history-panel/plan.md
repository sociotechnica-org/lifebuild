# History Panel Feature Plan

## Overview

Add a history panel to Work Squared that displays a reverse chronological stream of LiveStore events, allowing users to see all activity that has happened in their workspace. This feature will start as a text-based event stream and evolve into a rich, actionable activity feed.

## Goals

- **Primary**: Display LiveStore events in a user-friendly format
- **Secondary**: Establish patterns for per-event-type components
- **Future**: Enable actions from the history panel (undo, navigate, etc.)

## Architecture

### Event Display Strategy

We'll implement a component-per-event-type pattern:

```
packages/web/src/components/history/
├── HistoryPanel.tsx          # Main container component
├── EventList.tsx             # Scrollable event list
├── events/                   # Event-specific components
│   ├── BaseEventItem.tsx     # Shared layout/styling
│   ├── ProjectCreatedEvent.tsx
│   ├── TaskCreatedEvent.tsx
│   ├── ChatMessageEvent.tsx
│   └── index.ts              # Event type registry
└── types.ts                  # History-specific types
```

### Data Flow

1. **Event Stream**: Query LiveStore's event stream in reverse chronological order
2. **Event Filtering**: Initially show subset of events, expand over time
3. **Event Rendering**: Route events to specific components based on event type
4. **Real-time Updates**: Subscribe to new events and prepend to list

## Implementation Plan

### Phase 1: Basic History Panel (Initial Implementation)

#### 1.1 Navigation Integration

- Add "History" tab to top-level navigation in `Navigation.tsx`
- Add route constant in `routes.ts`
- Add route handler in `Root.tsx`
- Position: Fifth tab after Projects, Tasks, Team, Documents

#### 1.2 Core Components

Create basic history panel structure:

```typescript
// HistoryPanel.tsx - Main container
- Query event stream from LiveStore
- Handle loading/error states
- Pass events to EventList

// EventList.tsx - List renderer
- Render events in reverse chronological order
- Handle scrolling/pagination (future)
- Group events by date (future)

// BaseEventItem.tsx - Shared event layout
- Common styling (timestamp, user, action)
- Icon placeholder for event types
- Expandable details (future)
```

#### 1.3 Initial Event Types (Start Small)

Focus on these high-impact event types:

1. **Project Events**
   - `projectCreated` - "Created project 'Marketing Campaign'"
2. **Task Events**
   - `taskCreated` - "Created task 'Design homepage' in Backlog"
   - `taskMoved` - "Moved task 'Design homepage' to In Progress"
3. **Chat/Conversation Events**

   - `conversationCreated` - "Started conversation with Claude"
   - `chatMessageSent` - "Sent message to Claude" (truncated preview)

4. **Document Events**
   - `documentCreated` - "Created document 'Requirements'"

#### 1.4 Event Component Pattern

Each event component follows this structure:

```typescript
interface ProjectCreatedEventProps {
  event: ProjectCreatedEvent
  timestamp: Date
}

export function ProjectCreatedEvent({ event, timestamp }: ProjectCreatedEventProps) {
  return (
    <BaseEventItem
      icon={<FolderPlusIcon />}
      timestamp={timestamp}
      title={`Created project "${event.name}"`}
      details={event.description}
      actions={[
        { label: "View Project", onClick: () => navigate(`/projects/${event.id}`) }
      ]}
    />
  )
}
```

### Phase 2: Rich Event Display (Future)

#### 2.1 Visual Enhancements

- Event-specific icons and colors
- Rich formatting for different event types
- Avatars for user-generated events
- Syntax highlighting for code/technical content

#### 2.2 Grouping and Filtering

- Group events by date/time periods
- Filter by event type, user, or project
- Search functionality
- Bulk actions (mark as read, etc.)

#### 2.3 Interactive Actions

- Navigate to related objects from events
- Undo/redo support where applicable
- Quick actions (reply to chat, edit task, etc.)

### Phase 3: Advanced Features (Future)

#### 3.1 Performance Optimizations

- Virtual scrolling for large event lists
- Intelligent pagination
- Event caching and preloading

#### 3.2 Collaboration Features

- Real-time event indicators
- User presence in event stream
- Event notifications and digest emails

## Technical Considerations

### LiveStore Integration

Query events using LiveStore's event stream API:

```typescript
// In HistoryPanel.tsx
const events = useStore(db => db.table('events').orderBy('createdAt', 'desc').limit(100).all())
```

### Event Type Registry

Create a registry to map event types to components:

```typescript
// events/index.ts
export const eventComponentRegistry = {
  'v1.ProjectCreated': ProjectCreatedEvent,
  'v1.TaskCreated': TaskCreatedEvent,
  'v1.ConversationCreated': ConversationCreatedEvent,
  // ... other event types
} as const
```

### Routing

Add history route:

- Path: `/history`
- Component: `HistoryPanel`
- Navigation: Top-level tab

### Styling

Use existing Work Squared design system:

- Follow navigation tab patterns
- Use consistent colors and spacing
- Responsive design for mobile/desktop

## File Changes

### New Files

```
packages/web/src/components/history/
├── HistoryPanel.tsx
├── EventList.tsx
├── events/
│   ├── BaseEventItem.tsx
│   ├── ProjectCreatedEvent.tsx
│   ├── TaskCreatedEvent.tsx
│   ├── ConversationCreatedEvent.tsx
│   ├── DocumentCreatedEvent.tsx
│   └── index.ts
└── types.ts

packages/web/src/pages/HistoryPage.tsx
```

### Modified Files

```
packages/web/src/components/layout/Navigation.tsx    # Add History tab
packages/web/src/constants/routes.ts                # Add HISTORY route
packages/web/src/Root.tsx                          # Add history route handler
```

## Success Metrics

### Phase 1 Success Criteria

- [ ] History tab appears in main navigation
- [ ] Basic event list displays in reverse chronological order
- [ ] 4-5 event types render with meaningful descriptions
- [ ] Real-time updates work (new events appear at top)
- [ ] Basic styling matches app design system

### User Experience Goals

- Users can quickly understand recent activity
- Event descriptions are clear and actionable
- Performance remains smooth with 100+ events
- Mobile experience is usable

## Future Extensibility

This foundation enables:

- **Audit Trail**: Compliance and debugging features
- **Activity Digests**: Email summaries of workspace activity
- **Event Analytics**: Usage patterns and productivity insights
- **Workflow Automation**: Trigger actions based on event patterns
- **Collaboration Features**: Team activity feeds and notifications

## Risk Mitigation

### Performance Risks

- **Risk**: Large event lists slow down UI
- **Mitigation**: Start with limited events, add pagination

### Complexity Risks

- **Risk**: Too many event types overwhelm initial implementation
- **Mitigation**: Start with 4-5 high-value event types, expand incrementally

### User Experience Risks

- **Risk**: Information overload or noise
- **Mitigation**: Focus on meaningful events, add filtering options later
