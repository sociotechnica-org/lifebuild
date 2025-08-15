# Host Node.js Worker Service on Render.com

## Status

Accepted

## Last Updated

2025-08-15

## Context

Work Squared requires a Node.js backend service to run persistent AI workers that can:

- Execute long-running tasks beyond Cloudflare's 30-second limit
- Maintain persistent connections to LiveStore via WebSocket
- Process background jobs for hours if needed
- Store and query large document collections

We need to choose a hosting platform that supports:

- Node.js applications with persistent processes
- WebSocket connections
- Scheduled jobs (cron)
- Persistent disk storage for SQLite
- Reasonable pricing for a startup

Options evaluated:

1. **Cloudflare Workers + D1**: Stay within CF ecosystem but work around limitations
2. **Render.com**: Purpose-built for Node.js apps with integrated features
3. **Railway**: Similar to Render with good developer experience
4. **Traditional VPS**: Full control but more operational overhead

## Decision

We will host the Node.js worker service on Render.com while keeping the WebSocket sync server on Cloudflare Workers.

Architecture:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  CF Worker   │◀────│  Node.js    │
│  (CF Pages) │     │  (WebSocket) │     │  (Render)   │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                        ┌───▼───┐
                        │  R2   │ (Backups)
                        └───────┘
```

## Consequences

### Positive

- **Purpose-built for Node.js**: First-class support for long-running processes
- **Integrated features**: Built-in cron jobs, persistent disks, auto-scaling
- **Simple deployment**: Git push to deploy, automatic SSL, health checks
- **Cost-effective**: Free tier available, predictable pricing as we scale
- **Persistent storage**: Native support for SQLite with disk volumes
- **Great DX**: Excellent logs, metrics, and debugging tools

### Negative

- **Cross-cloud complexity**: Frontend on Cloudflare, backend on Render
- **Network latency**: Additional hop between services
- **Vendor lock-in**: Some Render-specific configurations
- **Cold starts**: Free tier has spin-down after inactivity

### Neutral

- Both Cloudflare and Render have good reliability records
- Can migrate to other providers if needed (containerized deployment)
- Cross-cloud setup is common for modern applications

## Implementation Notes

```yaml
# render.yaml
services:
  - type: worker
    name: worksquared-ai-workers
    runtime: node
    repo: https://github.com/your-org/worksquared
    branch: main
    rootDir: services/worker

    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start

    envVars:
      - key: NODE_ENV
        value: production
      - key: LIVESTORE_SYNC_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false

    disk:
      name: worker-data
      mountPath: /data
      sizeGB: 10

    healthCheckPath: /health

    # Scaling
    scaling:
      minInstances: 1
      maxInstances: 3
      targetCPUPercent: 70

# Cron jobs
crons:
  - type: worker
    name: backup-job
    runtime: node
    schedule: '0 */6 * * *' # Every 6 hours
    buildCommand: pnpm install
    startCommand: pnpm backup:create
```

## Migration Strategy

1. Start with Render's free tier for development
2. Use GitHub Actions for CI/CD pipeline
3. Monitor performance and costs
4. Scale up instances as usage grows
5. Consider migration only if we hit platform limitations
