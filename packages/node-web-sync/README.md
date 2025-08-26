# Node/Web Adapter Materializer Hash Mismatch Reproduction

This is a minimal example that reproduces a materializer hash mismatch issue when using different LiveStore adapters.

## Problem

When a web client (using `@livestore/adapter-web`) and a Node.js client (using `@livestore/adapter-node`) connect to the same store, the Node.js client shuts down with a materializer hash mismatch error after the first event is synced from the web client.

## Setup

```bash
pnpm install
```

## Reproduction Steps

### 1. Start the sync server

```bash
# Terminal 1
pnpm sync-server  # or use `wrangler dev` if you have Cloudflare tools
```

### 2. Start the Node.js monitor

```bash
# Terminal 2
pnpm node-monitor
```

This should connect successfully and show "Node monitor connected".

### 3. Start the web client

```bash
# Terminal 3
pnpm web-client
```

The web client will create events every 5 seconds.

## Expected vs Actual Behavior

**Expected**: Node monitor should receive and display messages created by the web client.

**Actual**: Node monitor shuts down immediately after the first event from the web client with a materializer hash mismatch error.

## Error Details

The error occurs in LiveStore's `materializeEvent` function when it detects that the materializer hash from the Node.js adapter doesn't match the hash from the web adapter, even though both are using the exact same schema definition.

```
[timestamp] DEBUG: LiveStore shutdown complete
  debugInstanceId: xxxxx
  storeId: test-store
```

This happens because different adapters may compile/bundle the materializer functions differently, resulting in different hashes for the same logical function.

## Files

- `schema.ts` - Simple schema with one event type and one table
- `sync-server.ts` - Cloudflare Worker sync server
- `web-client.ts` - Web client that creates events (using web adapter)
- `node-monitor.ts` - Node.js monitor that should receive events (using node adapter)
- `wrangler.toml` - Cloudflare Worker configuration

## Question for LiveStore Team

Is this expected behavior? Should different adapter types be able to connect to the same store, or is this a fundamental limitation?

If it's expected to work, what's the recommended approach for ensuring materializer hash consistency across different environments?
