# Work Squared Documentation

This directory contains the technical documentation for Work Squared, organized by purpose and chronological development.

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

## Architecture Decision Records (ADRs)

The `adrs/` directory contains formal architecture decisions:

- **[001-background-job-system.md](./adrs/001-background-job-system.md)** - SQLite-based task queue for long-running AI worker tasks
- **[002-nodejs-hosting-platform.md](./adrs/002-nodejs-hosting-platform.md)** - Render.com hosting for Node.js worker service
- **[003-backup-storage-strategy.md](./adrs/003-backup-storage-strategy.md)** - Cloudflare R2 for automated backup storage

## Navigation Guide

### For Implementation
1. **Current Architecture**: Start with [architecture.md](./architecture.md)
2. **Latest Plan**: See [004-projects-and-workers/](./plans/004-projects-and-workers/) for production roadmap
3. **Active Development**: Check Kanban and LLM chat plans for ongoing work

### For Architecture Decisions
- Browse [adrs/](./adrs/) for technical decision rationale
- Each ADR includes context, decision, and consequences
- ADRs are numbered chronologically

### For Historical Context
- Plans are numbered chronologically (000, 001, 002, etc.)
- Earlier plans show evolution of the system design
- Demo build (000) shows initial parallel development approach

## Document Status

- **Current**: Plans 002-004 represent active/recent development
- **Archived**: Plan 000 (demo build) is historical
- **Proposed**: ADRs marked as "Proposed" await implementation
- **Living**: Architecture.md updated as system evolves

---

*This documentation follows the principle of progressive enhancement - start simple, add complexity as needed.*