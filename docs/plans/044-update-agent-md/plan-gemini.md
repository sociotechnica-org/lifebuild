# Plan: Refactoring CLAUDE.md and Implementing AGENTS.md

## 1. Context & Web Wisdom Analysis

Based on current best practices for AI agent instruction files (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`), the core problem with the existing `CLAUDE.md` is **context bloat and low signal-to-noise ratio**.

Currently, `CLAUDE.md` acts as a monolithic catch-all (~500 lines) containing:

- Operational commands (good)
- Critical pre-push rules (good)
- Deep architectural patterns like Effect-TS and LiveStore (too specific for root)
- Lengthy GitHub CLI tutorials and Project Management rules (belongs in a skill/doc)
- Detailed Storybook component examples (belongs in frontend conventions/Cursor rules)

### The Ideal Setup

- **`AGENTS.md` (or core `CLAUDE.md`)**: The root "Operating System" file. It should be concise (max 150-200 lines). It defines the agent's persona, global boundaries (Traffic Light system: Always, Ask First, Never), critical commands, and acts as an index pointing to deeper contextual files.
- **Contextual/Modular Files**: Domain-specific rules should only be loaded when the agent is working in that domain. Cursor supports this natively via `.cursor/rules/*.mdc`. Claude CLI can handle this via skills (`.claude/skills/`) or by being instructed to read specific files when touching certain directories.

## 2. What to Keep in Root (`AGENTS.md` / `CLAUDE.md`)

The root file should be aggressively pruned to include only the absolute essentials for an AI agent to safely navigate and operate in the repository:

1. **Persona & Core Directives**:
   - E.g., "You are an expert full-stack engineer working on LifeBuild..."
   - Global boundaries: "NEVER push without running `pnpm lint-all`. ALWAYS ask for confirmation before running destructive DB commands."
2. **Critical Quality Gates (🚨 Before Pushing)**:
   - `pnpm lint-all`, `pnpm test`, `CI=true pnpm test:e2e`
3. **Essential Commands Cheat Sheet**:
   - How to start dev (`pnpm dev`, port usage).
   - How to build/deploy.
4. **High-Level Project Map**:
   - `packages/web` (React frontend)
   - `packages/server` (Node.js backend/Agentic Loop)
   - `packages/shared` (Schema/Events)
   - `packages/worker` (Cloudflare WebSocket sync)
5. **Pointers to Deep Context (Progressive Disclosure)**:
   - "For frontend component patterns, read `docs/conventions/frontend.md`."
   - "For architecture/LiveStore/Effect-TS, read `docs/architecture.md`."
   - "For project management & PR workflows, read `docs/conventions/workflow.md`."
6. **Context Library & Retrieval**:
   - Briefly mention the Context Library and Conan/Sam protocols, linking to their respective `.claude/agents/` files.

## 3. What to Cut and Where to Move It

The following sections should be extracted from `CLAUDE.md` into dedicated files:

### A. Extract to `docs/conventions/architecture-patterns.md` (or `.cursor/rules/backend.mdc`)

- **Architecture Details & Server Coding Patterns**: Moving the deep dive into `StoreManager`, `healthCheckInterval`, and `Fiber cleanup`.
- **Effect-TS Patterns**: Rules about `Effect.gen`, `shouldNeverHappen`, and error handling.
- **LiveStore Repair Flow & Worker Architecture**: Specific implementation details that agents only need when debugging sync or workers.
- **Logging conventions**: `createContextLogger`, etc.

### B. Extract to `docs/conventions/workflow.md` (and/or `.claude/skills/george/`)

- **Development Workflow**: Creating PRs, Changelog formatting.
- **GitHub CLI (`gh`) Commands**: The extensive tutorials on `gh pr view`, `gh issue list`.
- **Project Management**: Project/Sub-issue structures, Project Board Commands, Project Statuses.
  _(Note: An AI agent doesn't need a tutorial on how to use `gh`; it just needs the organization's specific workflow rules, such as setting board fields)._

### C. Extract to `docs/conventions/testing.md` (or `.cursor/rules/testing.mdc`)

- **Testing Strategy**: Details on Unit, E2E, LiveStore Testing, Full-Stack Integration Testing.
- **StubLLMProvider**: Configurations for testing the agentic loop.

### D. Extract to `docs/conventions/frontend.md` (or `.cursor/rules/storybook.mdc`)

- **Component Architecture Patterns (Storybook Stories)**: The multi-paragraph code examples for setting up LiveStore Providers in Storybook.

### E. Extract to IDE-Specific files (e.g., `.cursorrules`)

- **Cursor Cloud specific instructions**: Remove from the universal `CLAUDE.md` and put into a `.cursorrules` file or `.cursor/rules/global.mdc`.

## 4. Execution Strategy

1. **Create the target documentation directories** if they don't exist (e.g., `docs/conventions/`).
2. **Draft the extracted files** (`architecture-patterns.md`, `workflow.md`, `testing.md`, `frontend.md`).
3. **Draft the new `AGENTS.md`** incorporating the streamlined root content.
4. **Update `CLAUDE.md`** to mirror `AGENTS.md` (or simply symlink `CLAUDE.md` to `AGENTS.md` if the CLI supports it, or keep `CLAUDE.md` as a tiny wrapper pointing to `AGENTS.md`).
5. **Verify Context Linking**: Ensure that the new `AGENTS.md` explicitly instructs the agent to read the extracted files when working on relevant tasks.
