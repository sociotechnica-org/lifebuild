# Agentic Server (packages/server)

The Agentic Server is a Node.js backend that provides centralized AI/LLM processing for LifeBuild. It eliminates race conditions and duplicate API calls that would occur with client-side AI processing in multi-user scenarios.

## Overview

| Property     | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Package      | `packages/server`                                            |
| Platform     | Render.com                                                   |
| Runtime      | Node.js                                                      |
| Health Check | `GET /health`                                                |
| Source       | [packages/server/README.md](../../packages/server/README.md) |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  CF Worker   │     │  Agentic    │
│  (CF Pages) │     │  (WebSocket) │◀────│  Server     │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ • UI updates│     │ • Event relay│     │ • LLM calls │
│ • User input│     │ • WebSocket  │     │ • Tool exec │
│ • Real-time │     │ • Sync logic │     │ • Loop coord│
└─────────────┘     └──────────────┘     └─────────────┘
```

## Key Responsibilities

1. **Centralized AI Processing** - Single authority for LLM interactions
2. **LiveStore Integration** - Connects to sync worker via WebSocket
3. **Event Monitoring** - Tracks user messages, task creation, project updates
4. **Multi-Workspace Support** - Manages multiple workspace connections

## Environment Variables

### Required

- `NODE_ENV=production`
- `STORE_IDS` - Comma-separated workspace IDs to monitor
- `AUTH_TOKEN` - Authentication token for LiveStore
- `LIVESTORE_SYNC_URL` - WebSocket URL (`wss://sync.lifebuild.me`)
- `SERVER_BYPASS_TOKEN` - Token for internal worker communication
- `AUTH_WORKER_INTERNAL_URL` - Base URL for Auth Worker

### Optional

- `SENTRY_DSN` - Error tracking
- `BRAINTRUST_API_KEY` - LLM functionality
- `WORKSPACE_RECONCILE_INTERVAL_MS` - Override reconciliation cadence (default 5 min)

## Render CLI Commands

```bash
# Authenticate (one-time)
render login
render workspace set

# View service status
render services list --output json

# View logs
render logs --service-id <service-id> --tail

# List recent deploys
render deploys list --service-id <service-id> --output json

# Restart service (requires approval)
render restart --service-id <service-id>
```

## Health Check

The server exposes health endpoints:

- `GET /health` - JSON status
- `GET /` - HTML status page

Expected healthy response:

```json
{
  "status": "healthy",
  "storeId": "workspace-id",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "storage": "filesystem",
  "dataPath": "./data"
}
```

## Common Issues

### Server Won't Start

- Check Render logs for startup errors
- Verify environment variables are set
- Check if sync worker (`sync.lifebuild.me`) is reachable
- Review recent code changes that might affect startup

### WebSocket Connection Failures

- Verify `LIVESTORE_SYNC_URL` is correct
- Check sync worker status
- Verify `SERVER_BYPASS_TOKEN` matches between server and worker

### AI Processing Not Working

- Check `BRAINTRUST_API_KEY` is set
- Review Sentry for errors
- Check LiveStore event processing in logs

## Deployment

Render deploys automatically when code is pushed to `main`. Manual deployment:

1. Push changes to `main` branch
2. Render detects changes and builds
3. Health check runs before traffic is routed
4. Rollback available in Render dashboard if needed

## Related Docs

- [packages/server/README.md](../../packages/server/README.md) - Full server documentation
- [ADR 002: Node.js Hosting Platform](../../docs/adrs/002-nodejs-hosting-platform.md)
- [ADR 004: Distributed Agentic Processing](../../docs/adrs/004-distributed-agentic-loop-processing.md)
