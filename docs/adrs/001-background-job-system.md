# Use SQLite-based Task Queue for Background Jobs

## Status

Proposed

## Last Updated

2025-06-18

## Context

Work Squared requires a background job system to handle long-running AI worker tasks that can take minutes or hours to complete. These include:
- Processing complex document analysis requests
- Executing multi-step workflows
- Running autonomous worker agents
- Generating comprehensive reports

The current architecture using Cloudflare Workers has a 30-second timeout limit, making it unsuitable for these long-running operations.

We evaluated several options:
1. **In-process task management**: Simple async/await tracking without persistence
2. **SQLite-based queue**: Using LiveStore tables as a job queue
3. **BullMQ**: Redis-based queue with advanced features
4. **Temporal**: Full workflow orchestration engine

## Decision

We will implement a SQLite-based task queue using LiveStore tables for the initial implementation.

The queue will be implemented using these LiveStore tables:
- `workerTasks`: Stores task definitions, status, and metadata
- `taskExecutions`: Tracks execution history and logs

## Consequences

### Positive

- **No additional dependencies**: Leverages existing LiveStore infrastructure
- **Natural integration**: Tasks are events in the system, visible in activity streams
- **Persistence by default**: Tasks survive server restarts
- **Easy debugging**: Can query task status using familiar LiveStore queries
- **Consistent architecture**: Follows event-sourcing pattern throughout
- **Simple migration path**: Can move to BullMQ later if needed without changing APIs

### Negative

- **Basic features initially**: No advanced scheduling or complex retry strategies
- **Performance limitations**: SQLite not optimized for high-throughput queue operations
- **Manual implementation**: Need to build retry logic, timeouts, and monitoring
- **Single-node limitation**: No built-in support for distributed processing

### Neutral

- We can implement essential queue features (priority, retry, delay) with SQLite
- Performance should be adequate for dozens of concurrent workers
- Migration to BullMQ remains straightforward if we outgrow SQLite

## Implementation Notes

```typescript
// Task schema
interface WorkerTask {
  id: string
  workerId: string
  type: 'process_message' | 'analyze_documents' | 'execute_workflow'
  payload: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: Date
  processAfter: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

// Simple queue implementation
class LiveStoreTaskQueue {
  async enqueue(task: Omit<WorkerTask, 'id' | 'status' | 'attempts'>) {
    await store.mutate([
      events.taskQueued({
        ...task,
        id: crypto.randomUUID(),
        status: 'pending',
        attempts: 0,
        createdAt: new Date()
      })
    ])
  }
  
  async dequeue(): Promise<WorkerTask | null> {
    // Atomic claim of next task
    const task = await store.query(db => 
      db.table('workerTasks')
        .where('status', '=', 'pending')
        .where('processAfter', '<=', new Date())
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc')
        .first()
    )
    
    if (task) {
      await store.mutate([
        events.taskStarted({ 
          taskId: task.id, 
          startedAt: new Date() 
        })
      ])
    }
    
    return task
  }
}
```