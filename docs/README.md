# LifeBuild Documentation

This directory contains the technical documentation for LifeBuild, organized by purpose and chronological development.

## Architecture

**[architecture.md](./architecture.md)** - Current system architecture documentation

- LLM integration patterns
- Event-driven design with LiveStore
- Deployment configuration
- Development workflow

## Plans

The `plans/` directory contains implementation plans organized chronologically:

### [000-demo-build/](./plans/000-demo-build/)

Initial demo application planning and parallel development strategy for chat + Kanban features.

### [001-cf-deploy/](./plans/001-cf-deploy/)

**[cloudflare-deploy-todo.md](./plans/001-cf-deploy/cloudflare-deploy-todo.md)** - Cloudflare Pages deployment setup and configuration.

### [002-kanban/](./plans/002-kanban/)

**[kanban-todo.md](./plans/002-kanban/kanban-todo.md)** - Kanban board implementation with user story slices, drag-and-drop, task management, and LLM integration.

### [003-llm-chat/](./plans/003-llm-chat/)

**[llm-chat-todo.md](./plans/003-llm-chat/llm-chat-todo.md)** - LLM chat system implementation with conversations, streaming responses, and tool integration.

### [004-projects-and-workers/](./plans/004-projects-and-workers/)

**[work-squared-production-plan.md](./plans/004-projects-and-workers/work-squared-production-plan.md)** - Production system design with documents, projects, AI workers, and multi-user support.

### [007-multiplayer/](./plans/007-multiplayer/)

**[README.md](./plans/007-multiplayer/README.md)** - Multiplayer release plan for transitioning to server-side architecture with Node.js backend, event sync, and LLM processing migration.

## Runbooks

- **[workspace-orchestration.md](./runbooks/workspace-orchestration.md)** – Operational procedures for workspace provisioning, manual reconciliation, and incident escalation.

## Architecture Decision Records (ADRs)

The `adrs/` directory contains formal architecture decisions:

- **[001-background-job-system.md](./adrs/001-background-job-system.md)** - SQLite-based task queue for long-running AI worker tasks (Proposed)
- **[002-nodejs-hosting-platform.md](./adrs/002-nodejs-hosting-platform.md)** - Render.com hosting for Node.js worker service (Proposed)
- **[003-backup-storage-strategy.md](./adrs/003-backup-storage-strategy.md)** - Cloudflare R2 for automated backup storage (Proposed)
- **[004-distributed-agentic-loop-processing.md](./adrs/004-distributed-agentic-loop-processing.md)** - Server-side processing with single Node.js instance (Accepted)
- **[005-jwt-authentication-with-durable-objects.md](./adrs/005-jwt-authentication-with-durable-objects.md)** - JWT authentication for multi-user support (Proposed)
- **[006-monorepo-pnpm-workspaces.md](./adrs/006-monorepo-pnpm-workspaces.md)** - Use pnpm workspaces for monorepo structure (Accepted)

## Navigation Guide

### For Implementation

1. **Current Architecture**: Start with [architecture.md](./architecture.md)
2. **Active Plan**: See [007-multiplayer/](./plans/007-multiplayer/) for multiplayer release roadmap
3. **Production Roadmap**: [004-projects-and-workers/](./plans/004-projects-and-workers/) for overall system design
4. **Foundation Development**: Check Kanban and LLM chat plans for completed work

### For Architecture Decisions

- Browse [adrs/](./adrs/) for technical decision rationale
- Each ADR includes context, decision, and consequences
- ADRs are numbered chronologically

### For Historical Context

- Plans are numbered chronologically (000, 001, 002, etc.)
- Earlier plans show evolution of the system design
- Demo build (000) shows initial parallel development approach

## Document Status

- **Active**: Plan 007-multiplayer is the current development focus
- **Completed**: Plans 002-003 (Kanban, LLM chat) are implemented
- **Reference**: Plan 004 (projects/workers) provides overall system design
- **Archived**: Plan 000-001 are historical
- **Accepted**: ADRs 004, 006 are implemented decisions
- **Proposed**: ADRs 001-003, 005 await implementation
- **Living**: Architecture.md updated as system evolves

---

_This documentation follows the principle of progressive enhancement - start simple, add complexity as needed._
