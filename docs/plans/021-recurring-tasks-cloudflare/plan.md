# Plan 021: Cloudflare-Native Recurring Tasks Scheduler

## Goal
Implement the remaining recurring task automation milestones on top of the Cloudflare Worker stack introduced in LiveStore v0.4.0, replacing the temporary Node adapter scheduler from `feat/task-scheduler-sqlite-deduplication`.

## Context
- LiveStore v0.4.0 exposes a Cloudflare-focused sync provider and `@livestore/adapter-cloudflare` wrapper around the Durable Object RPC transport. The adapter wires HTTP, WebSocket, and DO RPC transports together so a single Worker can front all store traffic and accept server-side triggers. [^adapter]
- The Alchemy example shows how to bootstrap a LiveStore Worker: create a Durable Object with `makeDurableObject`, expose `makeWorker` for fetch handling, and authenticate incoming RPC calls with `validatePayload`. [^alchemy]
- Existing recurring task phases (docs/plans/014-email-drafting-via-mcp/recurring-tasks-implementation-todo.md) already define data model, execution events, and UX expectations; we now need infrastructure that can wake periodically and run the agentic loop without a Node host.

## Implementation Plan

### Phase 0 – Dependencies & Environment
- Confirm all LiveStore packages (including `@livestore/adapter-cloudflare`) are at `0.4.x` in `pnpm-lock.yaml` and `pnpm-workspace.yaml`, mirroring Plan 016 guidance.
- Update `wrangler.toml` (and environment secrets) with Durable Object bindings for the scheduler DO, LiveStore sync DO, queues, and KV/DO namespaces used by the adapter.
- Ensure `packages/worker` has access to `WRANGLER_SECRETS` needed by the agentic loop (OpenAI keys, Gmail MCP credentials, etc.).

### Phase 1 – Worker Entry & Adapter Wiring
- Create `packages/worker/src/livestore.ts` (or update `_worker.ts`) to instantiate the adapter:
  1. Build the Durable Object class via `makeDurableObject({ schema, storage })` (or the equivalent helper exported by `@livestore/adapter-cloudflare`).
  2. Export the DO for Wrangler registration (`export class LiveStoreDO extends makeDurableObject(...) {}`) and register the binding name in `wrangler.toml`.
  3. In the Worker `fetch`, call `makeWorker` with transports: `HttpTransport`, `HttpPushTransport`, `WebSocketTransport`, and `DurableObjectRpcTransport` using the DO namespace from `Env`. The Cloudflare adapter wraps these pieces but still requires env bindings for `SYNC`, `WS`, `STORE`, etc. [^adapter]
- Replace references to the Node adapter bootstrap (Express/Node server) with the Worker entry so all LiveStore connections hit Cloudflare directly.
- Repoint frontend clients (`packages/web`) to the Worker origin (`/livestore` HTTP + `wss://` sockets) and remove localhost Node URLs. Update Vite dev proxy if needed for local Wrangler.

### Phase 2 – Scheduler Durable Object
- Introduce a scheduler DO (per store/project) responsible for recurring task orchestration. It should:
  - Load LiveStore state via the Cloudflare adapter (e.g., `await env.LIVESTORE_DO.get(id).fetch(...)` or adapter helper) to read/write events without leaving the Worker.
  - Persist minimal scheduler state (`lastPollAt`, `inProgressTaskId`, retry metadata) in `state.storage`.
  - Expose an RPC endpoint (or HTTP route) invoked by alarms, queue consumers, or manual debugging triggers.
- Register the scheduler DO in `wrangler.toml` and ensure each LiveStore store can resolve its scheduler DO id (e.g., deterministic name `Scheduler:${storeId}`).

### Phase 3 – Wake & Run Cycle
- **Alarm scheduling:** After each execution cycle, call `state.storage.setAlarm(nextExecutionAt)` so Cloudflare wakes the DO when the next task is due. Alarms resume the DO with `alarm()` even if no traffic hits the Worker. [^alarms]
- **Due task scan:** On `alarm()` (or manual HTTP trigger), query LiveStore for tasks where `enabled=true`, `nextExecutionAt <= now`, and `inProgress` flags allow execution.
- **Execution lock:** Use DO storage to set a `running=true` flag (or compare-and-set) before launching the agentic loop, ensuring only one execution per scheduler DO at a time. This satisfies the “single execution” design decision from Phase 2 of the original plan.
- **Agentic loop handoff:** Invoke the existing agent executor inside the Worker environment. Pass project context, prompt, and LiveStore session token generated via `validatePayload` to keep parity with Node execution. [^alchemy]
- **Progress persistence:** Emit `task_execution.start` and `task_execution.complete` events through LiveStore so downstream materializers and UI remain unchanged. Update `lastExecutedAt`, compute new `nextExecutionAt`, and clear the `running` flag.

### Phase 4 – Long-Running Work Strategy
- Cloudflare Workers have a hard CPU ceiling (~5 minutes per invocation; ~15 minutes wall-clock for Cron/Queue consumers). [^limits]
- Break the agentic loop into slices (<5 minutes CPU each). At the end of a slice:
  1. Persist the execution cursor and partial output to LiveStore (or DO storage).
  2. Set a near-term alarm (e.g., `Date.now() + 5000`) to resume immediately.
  3. Exit the invocation cleanly so the next alarm re-enters `alarm()`.
- For flows predictably exceeding 10 minutes, enqueue follow-up work to a Queue consumer Worker that can process for up to 15 minutes wall-clock, still chunking to avoid CPU limits. [^queue-limits]
- Optionally add a cron trigger that pings the scheduler DO as a safety net in case alarms are missed (not expected, but useful for resilience).

### Phase 5 – Observability, Tests & Rollout
- Extend logging inside the scheduler DO (include task id, duration, retries) and forward to Workers Trace Events for debugging.
- Tests:
  - Unit-test scheduler logic with DO mocks (alarms, storage) to validate due-task filtering and lock handling.
  - Integration test via Wrangler Miniflare: create a store, seed recurring task, advance fake timers, ensure alarm triggers execution events.
  - E2E smoke: in staging, create a recurring task and verify execution history shows “Automatic”.
- Rollout sequentially: deploy to staging Worker, test with limited projects, then promote to production.

## Answers to Open Questions
- **How do we wake the worker?** Use Durable Object alarms. Each scheduler DO calls `state.storage.setAlarm(nextExecutionAt)`; when that timestamp is reached, Cloudflare automatically invokes the DO’s `alarm()` handler, letting us kick off the agentic loop without any always-on process or external cron. [^alarms]
- **How can it run for 10–20 minutes?** Split the loop into multiple invocations. Each chunk processes a slice of work under the 5-minute CPU limit, persists progress, and schedules the next alarm immediately. If a task needs longer wall-clock processing, hand off to a Queue consumer Worker, which can run up to ~15 minutes per message, still respecting the CPU limits by chunking work. [^limits] [^queue-limits]

## Risks & Mitigations
- **Alarm drift or missed executions:** keep a watchdog cron pinger and capture metrics on alarm latency.
- **Concurrent executions:** rely on DO storage locking; add guard events in LiveStore to ensure duplicates are ignored.
- **Agent failures:** reuse existing retry/backoff policy from the Node scheduler; store retries in DO state so alarms can resume after transient errors.
- **Schema changes:** ensure Cloudflare worker uses the same `@work-squared/shared` schema version as other packages.

## References
- [^adapter]: https://dev.docs.livestore.dev/reference/syncing/sync-provider/cloudflare/
- [^alchemy]: https://dev.docs.livestore.dev/guides/livestore-alchemy/cloudflare-worker-with-durable-object-sync/
- [^alarms]: https://developers.cloudflare.com/durable-objects/reference/alarms/
- [^limits]: https://developers.cloudflare.com/workers/platform/limits/#worker-execution
- [^queue-limits]: https://developers.cloudflare.com/queues/platform/limits/
