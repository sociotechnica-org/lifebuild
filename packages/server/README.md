# LifeBuild Server

Node.js backend server for LifeBuild that provides centralized agentic loop processing and multi-user coordination.

## Overview

The LifeBuild Server is a Node.js service that connects to LiveStore instances via WebSocket and processes AI assistant interactions in a centralized manner. This eliminates race conditions and duplicate processing that would occur with client-side AI processing in multi-user scenarios.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  CF Worker   │     │  Node.js    │
│  (CF Pages) │     │  (WebSocket) │◀────│  Server     │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ • UI updates│     │ • Event relay│     │ • LLM calls │
│ • User input│     │ • WebSocket  │     │ • Tool exec │
│ • Real-time │     │ • Sync logic │     │ • Loop coord│
└─────────────┘     └──────────────┘     └─────────────┘
         │                  │                   │
         └──────────────────┴───────────────────┘
                            │
                      ┌─────▼─────┐
                      │ LiveStore │
                      │ (SQLite)  │
                      └───────────┘
```

## Features

- **Centralized AI Processing**: Single authority for LLM interactions eliminates duplicate API calls
- **LiveStore Integration**: Direct access to event store using Node.js adapter
- **WebSocket Sync**: Real-time synchronization with Cloudflare Worker
- **Event Monitoring**: Tracks and logs all workspace activity
- **Health Monitoring**: HTTP endpoints for deployment health checks
- **Multi-Store Ready**: Configurable for different workspace instances

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment template (from package directory)
cp .env.example .env

# Edit configuration
vim .env
```

## Configuration

Create a `.env` file with the following variables:

```env
# LiveStore Configuration
STORE_ID=lifebuild-default           # Unique identifier for this workspace
LIVESTORE_SYNC_URL=ws://localhost:8787  # WebSocket URL to Cloudflare Worker

# Server Bypass Token (required for production)
SERVER_BYPASS_TOKEN=dev-server-bypass-token  # Must match worker's SERVER_BYPASS_TOKEN

# Server Configuration
PORT=3003                              # HTTP health check port

# Development
NODE_ENV=development
```

### Environment Variables

| Variable              | Description                  | Default               | Required   |
| --------------------- | ---------------------------- | --------------------- | ---------- |
| `STORE_ID`            | Unique workspace identifier  | `lifebuild-default`   | No         |
| `LIVESTORE_SYNC_URL`  | WebSocket connection URL     | `ws://localhost:8787` | No         |
| `SERVER_BYPASS_TOKEN` | Token for server-worker auth | -                     | Production |
| `PORT`                | HTTP server port             | `3003`                | No         |
| `NODE_ENV`            | Node environment             | `development`         | No         |

## Development

```bash
# Development
pnpm dev                # Start development server with auto-reload
pnpm build              # Build for production
pnpm start              # Start production server

# Quality Checks
pnpm lint-all           # Run all quality checks (lint + format + typecheck)
pnpm typecheck          # TypeScript type checking
pnpm lint               # Run ESLint
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting
```

### Script Standards

This package follows the monorepo script conventions. All scripts are available in the root via:

```bash
# Run from monorepo root
pnpm --filter @lifebuild/server <script>

# Examples
pnpm --filter @lifebuild/server dev
pnpm --filter @lifebuild/server lint-all
```

## Testing

### Fullstack sync integration test

The fullstack harness boots the sync worker (Wrangler dev), starts the server, creates a local
LiveStore client, sends a message, simulates a disconnect by stopping the worker, and verifies
that the server recovers and delivers the response after the worker restarts.

Run it with:

```bash
pnpm --filter @lifebuild/server test:fullstack
# or from repo root:
pnpm test:fullstack
```

Useful environment variables:

- `FULLSTACK_WORKER_PORT` (default 8787)
- `FULLSTACK_SERVER_PORT` (default 3003)
- `FULLSTACK_STARTUP_TIMEOUT_MS` (default 60000)
- `FULLSTACK_RESPONSE_TIMEOUT_MS` (default 20000)
- `FULLSTACK_RECOVERY_TIMEOUT_MS` (default 30000)
- `FULLSTACK_NO_RESPONSE_WINDOW_MS` (default 2000)
- `FULLSTACK_TOTAL_TIMEOUT_MS` (default 120000)

The harness writes temporary data under `.context/fullstack-*` and cleans it up on exit.

### Braintrust provider with Pi

Set `LLM_PROVIDER=braintrust` to run Pi sessions through Braintrust's OpenAI-compatible proxy.

```bash
LLM_PROVIDER=braintrust \
BRAINTRUST_API_KEY="your-braintrust-api-key" \
BRAINTRUST_PROJECT_ID="your-braintrust-project-id" \
BRAINTRUST_MODEL="gpt-4o-mini" \
pnpm --filter @lifebuild/server dev
```

Optional settings:

- `BRAINTRUST_BASE_URL` (defaults to `https://api.braintrust.dev/v1/proxy`)
- `BRAINTRUST_MODEL` (defaults to `gpt-4o-mini`)

### Stub LLM provider (deterministic responses)

Set `LLM_PROVIDER=stub` to force deterministic responses without external LLM calls.
You can configure responses via JSON (inline or from a file) and use `{{message}}` in templates.

Inline example:

```bash
LLM_PROVIDER=stub \
LLM_STUB_RESPONSES='{"defaultResponse":"stub: {{message}}","responses":[{"match":"ping","response":"pong"},{"match":"reconnect-test","response":"reconnected"}]}' \
pnpm --filter @lifebuild/server dev
```

File-based example:

```bash
LLM_PROVIDER=stub \
LLM_STUB_FIXTURE_PATH=packages/server/scripts/stub-responses.json \
pnpm --filter @lifebuild/server dev
```

Response rules support:

- `matchType`: `exact` (default), `includes`, or `regex`
- `toolCalls`: optional tool call payloads for testing tool execution
- `defaultResponse`: used when no rules match (can also be set via `LLM_STUB_DEFAULT_RESPONSE`)

## Usage

### Starting the Server

```bash
# Development mode (with auto-reload)
pnpm dev

# Production mode
pnpm start
```

The server will:

1. Connect to the LiveStore sync backend
2. Begin monitoring events from the configured workspace
3. Start HTTP health check server on configured port
4. Log workspace activity and AI processing events

### Health Monitoring

The server provides HTTP endpoints for monitoring:

- **GET /health** - JSON health status with store information
- **GET /** - HTML status page with server information

Example health response:

```json
{
  "status": "healthy",
  "storeId": "lifebuild-default",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "storage": "filesystem",
  "dataPath": "./data"
}
```

### Data Storage

The server stores LiveStore data in the local filesystem:

```
./data/
├── events.db         # Event sourcing database
├── materialized.db   # Materialized views
└── sync.db          # Sync coordination
```

**Important**: Ensure the `./data` directory is persistent in production deployments.

## Event Processing

The server monitors LiveStore events and processes:

- **User Messages**: Triggers AI assistant responses
- **Task Creation**: Logs and tracks new tasks
- **Project Updates**: Monitors workspace changes
- **Document Modifications**: Tracks content changes

All events are logged with contextual information for debugging and monitoring.

## Multi-Store Support

The server currently supports a single workspace instance via the `STORE_ID` configuration. Future versions will support multiple workspaces simultaneously.

See [Multi-Store Server Support Plan](../../docs/plans/007-multiplayer/multi-store-server-support.md) for roadmap details.

## Deployment

Coming soon.

### Environment Setup

For production deployments:

1. **Set SERVER_BYPASS_TOKEN**: Use a strong random string that matches the worker's token
2. **Configure STORE_ID**: Set to your workspace identifier
3. **Set LIVESTORE_SYNC_URL**: Point to your Cloudflare Worker
4. **Ensure data persistence**: Mount `./data` directory
5. **Configure health checks**: Monitor `/health` endpoint

### Debugging

Enable verbose logging:

```bash
NODE_ENV=development pnpm dev
```

Check server logs for:

- WebSocket connection status
- Event processing activity
- AI assistant interactions
- Error messages and stack traces

## API Reference

### Health Endpoints

#### GET /health

Returns server health status and configuration.

**Response**:

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

#### GET /

Returns HTML status page for browser viewing.

## Related Documentation

- [LifeBuild Architecture](../../docs/architecture.md)
- [LiveStore Documentation](https://docs.livestore.dev)
- [Multi-Store Support Plan](../../docs/plans/007-multiplayer/multi-store-server-support.md)
- [Distributed Agentic Processing ADR](../../docs/adrs/004-distributed-agentic-loop-processing.md)
