# Lifebuild MCP Server

A Model Context Protocol (MCP) server that exposes Lifebuild project, task, document, contact, worker, and table tools to external MCP clients (Claude Desktop, Claude Code, ChatGPT MCP, etc.). It reuses the same server-side tool definitions the Lifebuild agents use, so external clients can query and mutate a Lifebuild workspace with the exact same semantics.

## What this server does

- Connects to a Lifebuild LiveStore workspace.
- Exposes Lifebuild agent tools (projects, tasks, documents, contacts, workers, sorting table).
- Speaks MCP over **stdio** (recommended by the MCP SDK for desktop apps and local integrations).

## Setup

1. Install dependencies from repo root:

```bash
pnpm install
```

2. Configure environment variables (required for runtime):

| Variable                                | Required | Purpose                                                                                                                     |
| --------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `LIFEBUILD_STORE_ID`                    | ✅       | Lifebuild workspace/store ID to connect to.                                                                                 |
| `LIFEBUILD_SYNC_URL`                    | ➖       | WebSocket sync endpoint (defaults to `ws://localhost:8787`). Set to an empty string to run offline against local data only. |
| `LIFEBUILD_STORE_DATA_PATH`             | ➖       | Local data directory (defaults to `./data`).                                                                                |
| `SERVER_BYPASS_TOKEN`                   | ➖       | Required in production when using sync auth. Uses the same token as the Lifebuild server.                                   |
| `LIFEBUILD_STORE_CONNECTION_TIMEOUT_MS` | ➖       | Store connection timeout (default `30000`).                                                                                 |
| `LIVESTORE_PING_INTERVAL_MS`            | ➖       | Sync ping interval (default `5000`).                                                                                        |
| `LIVESTORE_PING_TIMEOUT_MS`             | ➖       | Sync ping timeout (default `2000`).                                                                                         |

3. Run the MCP server:

```bash
pnpm --filter @lifebuild/mcp-server start
```

## Client configuration examples

The server is stdio-based, so most MCP clients can spawn it directly. Use the client’s MCP configuration file and include the `command`, `args`, and `env` values below.

### Claude Desktop (example)

```json
{
  "mcpServers": {
    "lifebuild": {
      "command": "pnpm",
      "args": ["--filter", "@lifebuild/mcp-server", "start"],
      "env": {
        "LIFEBUILD_STORE_ID": "your-workspace-id",
        "LIFEBUILD_SYNC_URL": "ws://localhost:8787",
        "SERVER_BYPASS_TOKEN": "your-server-bypass-token"
      }
    }
  }
}
```

### Claude Code / ChatGPT MCP (example)

Use the same `command`/`args`/`env` block in your MCP configuration file for that client.

```json
{
  "mcpServers": {
    "lifebuild": {
      "command": "pnpm",
      "args": ["--filter", "@lifebuild/mcp-server", "start"],
      "env": {
        "LIFEBUILD_STORE_ID": "your-workspace-id",
        "LIFEBUILD_SYNC_URL": "wss://your-sync-endpoint",
        "SERVER_BYPASS_TOKEN": "your-server-bypass-token"
      }
    }
  }
}
```

## Testing

Unit tests:

```bash
pnpm --filter @lifebuild/mcp-server test
```

Integration test (spawns the MCP server via stdio and calls `list_projects`):

```bash
pnpm --filter @lifebuild/mcp-server test:integration
```

## Best practices

- Use a dedicated service token (`SERVER_BYPASS_TOKEN`) for MCP access.
- Avoid running the MCP server against production data from untrusted clients.
- Prefer `LIFEBUILD_SYNC_URL` to connect to a running Lifebuild sync server; use an empty value only for offline/local data scenarios.
