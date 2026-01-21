# Deploy Agent Context

This directory contains deployment documentation, playbooks, and tooling for LifeBuild infrastructure.

## Architecture Overview

LifeBuild is deployed across multiple platforms:

| Service | Platform | Purpose | URL |
|---------|----------|---------|-----|
| Web App | Cloudflare Pages | React frontend | `https://app.lifebuild.me` |
| Sync Worker | Cloudflare Workers | WebSocket real-time sync | `wss://sync.lifebuild.me` |
| Auth Worker | Cloudflare Workers | Authentication & JWT | `https://auth.lifebuild.me` |
| PostHog Worker | Cloudflare Workers | Analytics proxy | `https://coconut.lifebuild.me` |
| Agentic Server | Render.com | Centralized AI/LLM processing | Internal |

See [deployment.md](./deployment.md) for full deployment documentation.

## Directory Structure

```
deploy/
├── AGENTS.md           # This file - agent context
├── CLAUDE.md           # Symlink to AGENTS.md
├── README.md           # Human-readable overview
├── deployment.md       # Symlink to docs/deployment.md
├── services/           # Per-service documentation
│   └── agentic-server.md
├── playbooks/          # Runbooks for common scenarios
│   └── 001-server-down.md
└── .claude/
    └── settings.local.json  # Permission constraints
```

## Agent Permissions Model

When working in this directory, the agent operates under restricted permissions:

### Allowed (No approval needed)
- Read any file in the codebase
- Search/grep across the codebase
- Read-only Render CLI commands:
  - `render services list`
  - `render logs`
  - `render deploys list`
  - `render whoami`

### Requires Approval
- `render restart`
- `render deploys create`
- Any git push or deployment commands
- Creating/modifying environment variables

### Blocked
- Direct database access in production
- `render ssh` to production instances
- Modifying secrets or tokens

## CLI Tools

### Render CLI (Agentic Server)
```bash
# Check auth
render whoami

# List services
render services list --output json

# View logs (read-only, safe)
render logs --resources <service-id> --output text --limit 100

# List recent deploys
render deploys list --resources <service-id> --output json

# Service ID for agentic server: srv-d281c9p5pdvs7382v5g0
```

### Cloudflare Wrangler (Workers)
```bash
# Check auth (may need `wrangler login` first)
wrangler whoami

# View worker logs (read-only, safe)
wrangler tail lifebuild-worker        # Sync worker
wrangler tail lifebuild-auth          # Auth worker
wrangler tail lifebuild-posthog-prod  # PostHog proxy

# List deployments
wrangler deployments list
```

### Sentry (Error Tracking)
```bash
# Install if needed: brew install getsentry/tools/sentry-cli
# Or: npm install -g @sentry/cli

# Check auth
sentry-cli info

# View recent issues (read-only)
sentry-cli issues list --project <project>

# View issue details
sentry-cli issues show <issue-id>
```

Dashboard: https://sentry.io (check for LifeBuild project)

### PostHog (Product Analytics)
No CLI - use dashboard at https://app.posthog.com

Useful for:
- User session replays during incidents
- Feature flag status
- Error tracking correlation

## Playbooks

Playbooks are structured runbooks for common operational scenarios. Each playbook includes:
- **Symptoms**: How to identify this situation
- **Diagnosis steps**: Read-only investigation
- **Resolution options**: Actions that require approval
- **Escalation**: When to involve humans

Available playbooks:
- [001-server-down](./playbooks/001-server-down.md) - Agentic server not responding

## Working with the Human Operator

This agent is designed for **collaborative debugging**, not autonomous remediation. The model:

1. **Agent investigates**: Runs read-only diagnostics, gathers logs, analyzes code
2. **Agent proposes**: Suggests specific fixes with rationale
3. **Human approves**: Reviews and authorizes any mutations
4. **Agent executes**: Implements approved changes through normal SDLC

For production changes, always go through the standard PR process rather than direct modification.
