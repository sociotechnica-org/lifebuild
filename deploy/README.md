# LifeBuild Deployment

This directory contains deployment documentation, operational playbooks, and tooling for LifeBuild infrastructure.

## Quick Reference

| Service        | Platform           | Status Check                       |
| -------------- | ------------------ | ---------------------------------- |
| Web App        | Cloudflare Pages   | `https://app.lifebuild.me`         |
| Sync Worker    | Cloudflare Workers | `wss://sync.lifebuild.me`          |
| Auth Worker    | Cloudflare Workers | `https://auth.lifebuild.me/health` |
| Agentic Server | Render.com         | Render Dashboard                   |

## Directory Contents

- **[deployment.md](./deployment.md)** - Full deployment documentation (symlinked from docs/)
- **[services/](./services/)** - Per-service documentation and runbooks
- **[playbooks/](./playbooks/)** - Operational playbooks for common scenarios
- **[AGENTS.md](./AGENTS.md)** - Context for AI agents working in this directory

## Common Tasks

### Check Service Status

```bash
# Cloudflare workers
wrangler whoami
wrangler tail lifebuild-worker  # Sync worker logs

# Render services
render whoami
render services list
render logs --service-id <id> --tail
```

### Deploy Manually

See [deployment.md](./deployment.md) for full instructions.

```bash
# Cloudflare (from repo root)
pnpm --filter @lifebuild/auth-worker run deploy
pnpm --filter @lifebuild/worker run deploy
pnpm --filter @lifebuild/web run deploy

# Render deploys automatically from main branch
```

## Playbooks

| Playbook                                          | When to Use                                            |
| ------------------------------------------------- | ------------------------------------------------------ |
| [001-server-down](./playbooks/001-server-down.md) | Agentic server not responding or failing health checks |

## Getting Help

For AI-assisted debugging, start Claude Code in this directory:

```bash
cd deploy
claude
```

The agent will have context about the deployment architecture and access to diagnostic tools.
