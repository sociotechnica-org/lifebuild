# Worker Package (@work-squared/worker)

The Cloudflare Worker backend for Work Squared, providing WebSocket-based real-time sync, LLM proxy services, and static asset serving.

## Overview

This package contains the backend infrastructure for Work Squared:

- **WebSocket Server**: Real-time synchronization using Cloudflare Durable Objects
- **LLM Proxy**: Secure API calls to Braintrust for AI chat functionality
- **Asset Serving**: Static frontend assets from the web package
- **Event Relay**: LiveStore event distribution across connected clients

## Architecture

### Core Components

- **Durable Objects**: `WebSocketServer` manages persistent WebSocket connections
- **D1 Database**: SQLite database for production data persistence
- **Static Assets**: Serves the built React application from `../web/dist`
- **Event Sourcing**: Integration with LiveStore for real-time collaboration

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

The worker requires these environment variables (configured via `.dev.vars`):

```bash
# Required for LLM functionality
BRAINTRUST_API_KEY="your-braintrust-api-key"
BRAINTRUST_PROJECT_ID="your-braintrust-project-id"
```

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
