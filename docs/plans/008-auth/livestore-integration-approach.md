# LiveStore Authentication Integration Approach

## Understanding the Challenge

After researching LiveStore's architecture, we discovered that:

1. **Separation of Execution Contexts**: The `validatePayload` function runs in the Cloudflare Worker, while `onPush`/`onPull` handlers run in the Durable Object. These are separate execution contexts with no built-in mechanism to pass data between them.

2. **No Connection Context API**: LiveStore doesn't provide a way to store connection-specific context (like userId) that can be accessed in event handlers.

3. **Client-Side Responsibility**: Events must include metadata when they're created on the client side, not injected on the server side.

## The Solution

### 1. Client-Side Metadata Injection

Since we can't inject metadata server-side, we must add it when events are created:

```typescript
// Instead of:
store.commit(events.taskCreated({ ... }))

// We need:
store.commit(events.taskCreated({ 
  ...,
  metadata: {
    userId: currentUser.id,
    timestamp: Date.now()
  }
}))
```

### 2. Helper Functions

To avoid updating every event creation in the codebase, we created helper functions:

```typescript
// utils/eventHelpers.ts
export function createEventMetadata() {
  const user = getCurrentUser()
  return {
    userId: user?.id || DEV_AUTH.DEFAULT_USER_ID,
    timestamp: Date.now()
  }
}

export function withMetadata<T extends { args: any }>(event: T): T {
  if (!event.args.metadata) {
    event.args.metadata = createEventMetadata()
  }
  return event
}
```

### 3. Server-Side Validation

The worker validates the auth token and accepts/rejects the connection:

```typescript
validatePayload: async (payload: any, env: any) => {
  const authResult = await validateSyncPayload(payload, env)
  // Can only accept/reject connection here
  // Cannot pass userId to Durable Object
}
```

### 4. Event Monitoring

In the Durable Object, we monitor that events have metadata:

```typescript
onPush: async function (message) {
  for (const event of message.batch) {
    if (!event.args.metadata) {
      console.warn(`Event ${event.name} missing metadata`)
    } else {
      console.log(`Syncing event ${event.name} from user ${event.args.metadata.userId}`)
    }
  }
}
```

## Implementation Options

### Option 1: Gradual Migration (Recommended)
1. Deploy with metadata monitoring but not enforcement
2. Update components incrementally to use `withMetadata` helper
3. Monitor logs to track progress
4. Enable enforcement once all events have metadata

### Option 2: Global Store Wrapper
Create a wrapped store that automatically injects metadata:

```typescript
// In LiveStoreProvider
const enhancedStore = new MetadataStore(store, getCurrentUser)
```

### Option 3: Build Tool Transform
Use a build-time transform to automatically wrap all event creations.

## Trade-offs

- **Pros**: Works within LiveStore's architecture, maintains type safety
- **Cons**: Requires client-side changes, larger bundle size with metadata

## Next Steps

1. Choose implementation approach
2. Update critical user-facing events first
3. Add monitoring to track metadata coverage
4. Gradually migrate remaining events
5. Enable server-side enforcement once ready