# Server Package Patterns

## Dynamic Import Order for Instrumentation

When integrating Sentry (or similar instrumentation), dynamically import it *after* environment variables are loaded (`dotenv.config()` must run first). Then dynamically import all other app modules *after* Sentry is initialized so `pinoIntegration` can instrument the logger. See `packages/server/src/index.ts` and `instrument.ts`.

## StoreManager Patterns

- **Idempotent monitoring**: `ensureMonitored` must handle idempotency — never re-add stores that are already managed.
- **Offline duration**: Use `networkStatus.disconnectedSince` (not `storeInfo.lastDisconnectedAt`) for `offlineDurationMs`. The former is tied directly to the network status event and accurately reflects the current disconnection period.
- **Stale data on reconnection**: When a store reconnects and a new LiveStore instance is created, reset internal monitoring state (`syncStatus`, `networkStatus`) to allow fresh monitoring of the new instance.
- **Fiber cleanup**: Always use `Fiber.interrupt` to stop monitoring fibers (`networkStatusFiber`, `syncStateFiber`) before creating new ones during reconnection or shutdown.

## API Response Serialization

- Convert `Date` objects to ISO strings (`toISOString()`) consistently when exposing `StoreInfo` timestamps in API responses. See `serializeStoreConnectionFields` pattern.
- When mapping internal types to API response types (e.g., `NetworkStatusInfo` to API's `NetworkStatus`), handle type conversions explicitly to avoid TypeScript errors.

## Graceful Shutdown

The `shutdown()` method in `StoreManager` must clear all timeouts (health check intervals) and shut down all managed stores. Always use `SIGTERM` first, then `SIGKILL` after a timeout for child processes.
