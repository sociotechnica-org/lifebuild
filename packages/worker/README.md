# Worker Package (@work-squared/worker)

The Cloudflare Worker backend for Work Squared, providing WebSocket-based real-time sync and event relay services.

## Overview

This package contains the **WebSocket sync server only** for Work Squared (as of September 2025):

- **WebSocket Server**: Real-time synchronization using Cloudflare Durable Objects
- **Event Relay**: LiveStore event distribution across connected clients
- **JWT Validation**: Authentication token verification for WebSocket connections
- **Connection State Management**: Persistent WebSocket connection handling

**Note**: Static asset serving has been moved to Cloudflare Pages (`packages/web`).

## Architecture

### Core Components

- **Durable Objects**: `WebSocketServer` manages persistent WebSocket connections
- **D1 Database**: SQLite database for production data persistence
- **Event Sourcing**: Integration with LiveStore for real-time collaboration
- **WebSocket API**: HTTP upgrade handling for WebSocket connections

### Technologies

- **Cloudflare Workers**: Edge computing platform for global low-latency responses
- **Durable Objects**: Stateful coordination for WebSocket connections
- **D1 Database**: Serverless SQLite for persistent storage
- **LiveStore Sync**: Real-time event synchronization framework

## Development

### Prerequisites

- Cloudflare account with Workers and D1 access
- Wrangler CLI for local development and deployment
- Environment configured from monorepo root

### Local Development

```bash
# Start worker dev server (from root)
pnpm dev
# or run worker only
pnpm --filter @work-squared/worker dev

# Worker will be available at http://localhost:8787
```

### Development Commands

```bash
# Start development server
pnpm --filter @work-squared/worker dev

# Deploy to Cloudflare
pnpm --filter @work-squared/worker deploy

# Type checking
pnpm --filter @work-squared/worker typecheck

# Create D1 database
pnpm --filter @work-squared/worker wrangler d1 create work-squared-prod

# Manage D1 database
pnpm --filter @work-squared/worker wrangler d1 execute work-squared-prod --command "SELECT * FROM sqlite_master"
```

## Configuration

### wrangler.jsonc

Key configuration for the Cloudflare Worker:

```jsonc
{
  "name": "work-squared",
  "main": "./functions/_worker.ts",
  "assets": {
    "directory": "../web/dist", // Serves built React app
    "binding": "ASSETS",
  },
  "build": {
    "command": "pnpm --filter @work-squared/web build", // Builds web first
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "WEBSOCKET_SERVER",
        "class_name": "WebSocketServer",
      },
    ],
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "work-squared-prod",
    },
  ],
}
```

### Environment Variables

The worker requires these environment variables (configured via `.dev.vars` for development):

```bash
# Environment
ENVIRONMENT=development                          # development or production
REQUIRE_AUTH=true                               # Enable JWT authentication

# Authentication & Security
JWT_SECRET=dev-jwt-secret-change-me-in-production  # JWT signing secret (CRITICAL: use strong secret in production)
GRACE_PERIOD_SECONDS=86400                      # Token grace period (24 hours for development)
SERVER_BYPASS_TOKEN=dev-server-bypass-token      # Token for internal service-to-service calls

# Workspace Management

# R2 Image Storage
R2_PUBLIC_URL=http://localhost:8787/api/images  # Public URL for R2 image access

# Required for LLM functionality
BRAINTRUST_API_KEY="your-braintrust-api-key"
BRAINTRUST_PROJECT_ID="your-braintrust-project-id"
```

**Important Security Notes:**

- `JWT_SECRET`: Must be identical to the auth worker's JWT secret. Change from default in production.
- `SERVER_BYPASS_TOKEN`: Used for internal workspace validation calls to the auth worker. Must match auth worker configuration.
- `WORKSPACE_CLAIMS_VERSION`: KV namespace binding used to read workspace membership versions for JWT revocation.

Create the KV namespace once per environment:

```bash
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION
wrangler kv:namespace create WORKSPACE_CLAIMS_VERSION --preview
```

Copy the generated IDs into `wrangler.jsonc` so the worker can read the authoritative version map.

**Workspace Enforcement:**

The sync worker validates workspace ownership purely from JWT claims:

1. Extracts `instanceId` from the sync payload.
2. Verifies the `workspaces` claim in the JWT contains the requested workspace.
3. Reads the user's latest `workspaceClaimsVersion` from the shared KV namespace (with a short in-memory cache) and rejects tokens whose version is stale.
4. Logs payload sizes so oversized tokens can be trimmed before browsers hit header limits.

Each workspace (`instanceId`) is automatically routed to its own Durable Object instance, ensuring complete data isolation between workspaces—now without any per-connection calls to the Auth Worker.

## Features

### WebSocket Server (Durable Objects)

- **Connection Management**: Handles multiple concurrent WebSocket connections
- **Event Broadcasting**: Distributes LiveStore events to all connected clients
- **Connection Recovery**: Automatic reconnection and state synchronization
- **Message Ordering**: Ensures event delivery order consistency

### LLM Proxy Services

- **Secure API Calls**: Braintrust integration with API key protection
- **Tool Definitions**: Defines available tools for LLM interactions
- **Stream Processing**: Real-time response streaming to clients
- **Error Handling**: Graceful failure modes for LLM service issues

### Static Asset Serving

- **SPA Support**: Single-page application routing with fallback to index.html
- **Optimized Delivery**: Global CDN distribution via Cloudflare's network
- **Caching**: Efficient asset caching with proper cache headers

### LiveStore Integration

- **Event Sourcing**: Processes and stores LiveStore events in D1
- **Real-time Sync**: Coordinates state synchronization across clients
- **Conflict Resolution**: Handles concurrent updates gracefully

## Project Structure

```
src/
├── livestore.worker.ts    # LiveStore web worker configuration
└── otel.ts               # OpenTelemetry tracing setup

functions/
└── _worker.ts            # Main Cloudflare Worker entry point

wrangler.jsonc            # Cloudflare Worker configuration
package.json              # Package dependencies and scripts
```

## Deployment

### First-Time Setup

1. **Create D1 Database**:

   ```bash
   pnpm --filter @work-squared/worker wrangler d1 create work-squared-prod
   ```

2. **Update Configuration**:
   Add the database ID to `wrangler.jsonc`:

   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "work-squared-prod",
       "database_id": "your-database-id-here"
     }
   ]
   ```

3. **Set Environment Variables**:
   Configure Braintrust credentials:
   ```bash
   pnpm --filter @work-squared/worker wrangler secret put BRAINTRUST_API_KEY
   pnpm --filter @work-squared/worker wrangler secret put BRAINTRUST_PROJECT_ID
   ```

### Deployment Process

```bash
# Manual deployment
pnpm --filter @work-squared/worker deploy

# Via GitHub Actions (automatic on main branch)
git push origin main
```

### Build Process

The worker build automatically:

1. Builds the web package (`pnpm --filter @work-squared/web build`)
2. Copies built assets to be served by the worker
3. Bundles the worker code with all dependencies
4. Deploys to Cloudflare's global network

## Monitoring

### OpenTelemetry Integration

- **Distributed Tracing**: Request flow tracking across services
- **Performance Monitoring**: Latency and error rate tracking
- **Custom Metrics**: Business-specific observability

### Cloudflare Analytics

- **Request Metrics**: Volume, latency, and error rates
- **Geographic Distribution**: User traffic patterns
- **Resource Usage**: CPU, memory, and duration tracking

## Troubleshooting

### Common Issues

- **WebSocket Connection Failures**: Check Durable Object bindings and network configuration
- **D1 Database Errors**: Verify database creation and binding configuration
- **Asset Serving Issues**: Ensure web package build completes successfully
- **LLM Proxy Errors**: Validate Braintrust API credentials and project configuration

### Debugging Tools

```bash
# View live logs
pnpm --filter @work-squared/worker wrangler tail

# Inspect D1 database
pnpm --filter @work-squared/worker wrangler d1 execute work-squared-prod --command "SELECT * FROM events LIMIT 10"

# Test local worker
curl http://localhost:8787/websocket
```
