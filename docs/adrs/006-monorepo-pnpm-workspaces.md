# Use pnpm Workspaces for Monorepo Structure

## Status

Accepted

## Last Updated

2025-07-21

## Context

Work Squared needs to transition from a single-package application to a monorepo structure to support:

- Frontend (React + Vite)
- Backend (Node.js + TypeScript)
- Shared code (TypeScript types, utilities)
- Cloudflare Worker
- Unified deployment

We evaluated several monorepo solutions:

1. **Nx**: Enterprise-grade with extensive tooling but high complexity
2. **Bun Workspaces**: Fast and simple but immature ecosystem
3. **pnpm Workspaces**: Lightweight, proven, already using pnpm
4. **Turborepo**: Good caching but limited features

## Decision

We will use pnpm workspaces for our monorepo structure.

The workspace will be organized as:

```
work-squared/
├── pnpm-workspace.yaml
├── packages/
│   ├── web/          # Current React app
│   ├── server/       # New Node.js backend
│   ├── shared/       # Shared types and utils
│   └── worker/       # Cloudflare Worker
└── docs/
```

## Consequences

### Positive

- **Zero learning curve**: Already using pnpm, team familiar with it
- **Proven compatibility**: Works well with Vite, TypeScript, and Wrangler
- **Simple configuration**: Just `pnpm-workspace.yaml` file needed
- **Fast and efficient**: Shared dependencies via hard links
- **Easy migration**: Can be completed in hours, not days
- **Future flexibility**: Can add Turborepo later for caching

### Negative

- **No built-in tooling**: Need to manage build order manually
- **No generators**: Must create boilerplate manually
- **No affected commands**: Can't run tests only for changed packages

### Neutral

- Manual orchestration fits our small team size
- Can migrate to more complex solutions if needed
- Aligns with our "start simple" philosophy

## Implementation Notes

1. Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

2. Update package names:

```json
{
  "name": "@work-squared/web",
  "dependencies": {
    "@work-squared/shared": "workspace:*"
  }
}
```

3. Root development scripts:

```json
{
  "scripts": {
    "dev": "pnpm --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test"
  }
}
```

## Future Path

If the project grows beyond 10 packages or 5 developers, we can:

1. Add Turborepo for caching while keeping pnpm workspaces
2. Consider full migration to Nx for enterprise features
