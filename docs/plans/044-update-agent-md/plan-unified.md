# Unified Plan: CLAUDE.md / AGENTS.md Overhaul

## Problem Statement

The current `CLAUDE.md` is **726 lines** and `AGENTS.md` is an identical copy. Research from Anthropic, OpenAI, GitHub, and the AGENTS.md community converges: bloated instruction files degrade agent performance. Key evidence:

- LLMs reliably follow ~150–200 instructions; Claude Code's system prompt already consumes ~50 of those (HumanLayer)
- Anthropic's own docs: "If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise"
- The file is near OpenAI Codex's 32 KiB per-AGENTS.md limit
- Pre-push commands are duplicated in **four places** (lines 5–21, 47–66, 207–213, 710–717)
- GitHub's analysis of 2,500+ repos found that specificity and conciseness beat verbosity every time

**Goal**: Reduce CLAUDE.md to ~120–150 lines of universally-applicable, high-signal instructions. Move specialized content to where it naturally belongs — leveraging docs that already exist. Delete content Claude already knows.

---

## Decision Framework

Keep a line in root only if **all three** are true:

1. It is needed in **many** sessions (not just one domain)
2. It is **specific to this repo** (not generic coding advice Claude already knows)
3. Removing it would **likely cause repeated mistakes**

If any are false → move to a specialized file, link to an existing doc, or delete.

---

## Existing Documentation Inventory

Before deciding where to move content, we need to know what already exists. The repo has **excellent documentation coverage** that CLAUDE.md largely duplicates:

### Already well-documented (link, don't recreate)

| Topic                | Existing Doc                                                           | Lines     | Notes                                                                                 |
| -------------------- | ---------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| System architecture  | `docs/architecture.md`                                                 | 340       | Comprehensive: monorepo structure, packages, deployment, AI integration, tool calling |
| Deployment           | `docs/deployment.md` (also symlinked at `deploy/deployment.md`)        | 362       | Complete: GitHub Actions, manual deploy, env vars, secrets, troubleshooting           |
| Deploy playbooks     | `deploy/playbooks/001-server-down.md`, `002-clear-stale-store-data.md` | —         | Operational runbooks                                                                  |
| Deploy agent context | `deploy/AGENTS.md`                                                     | —         | Already exists as a scoped AGENTS.md for deploy tasks                                 |
| Server details       | `packages/server/README.md`                                            | 332       | Architecture, config, testing (fullstack, stub, smoke), LLM tools, deployment         |
| Web/frontend details | `packages/web/README.md`                                               | 325       | Architecture, LiveStore integration, E2E testing, PostHog analytics                   |
| Worker details       | `packages/worker/README.md`                                            | 279       | Architecture, environment setup, local testing, error handling                        |
| Auth details         | `packages/auth-worker/README.md`                                       | 329       | JWT setup, auth flow, environment config                                              |
| Shared schemas       | `packages/shared/README.md`                                            | 238       | Events, schema, queries, type safety patterns                                         |
| ADRs                 | `docs/adrs/001-008`                                                    | 9 files   | Architectural decisions (background jobs, hosting, auth, monorepo, security)          |
| LLM tool status      | `docs/llm-tools.md`                                                    | 201       | Tool implementation tracking, breaking changes, architecture                          |
| Workspace ops        | `docs/runbooks/workspace-orchestration.md`                             | —         | Operational procedures                                                                |
| Agent system         | `.claude/agents/README.md`                                             | 181       | All agents, their jobs, interactions, handoff patterns                                |
| PM board fields      | `.claude/skills/george/board-fields.md`                                | 263       | GitHub project board field IDs, option IDs, intake protocol                           |
| Context library      | `docs/context-library/`                                                | 123 cards | Product knowledge, conventions, retrieval profiles                                    |

### Missing (needs to be created)

| Topic                            | Why it's missing                                                                                                                                                       | Proposed location       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Testing strategy (cross-package) | Each package README has testing sections, but there's no unified guide covering the testing philosophy, when to write which kind of test, StubLLMProvider config, etc. | `docs/testing-guide.md` |

### Misplaced or stale (needs cleanup)

| File                                              | Issue                                                                                                               | Action                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `docs/product-management-options.md`              | Stale options doc from 2025-08-13, status "For Future Consideration." Decision was made (GitHub Issues + Projects). | **Delete**                                                                                                               |
| `docs/llm-tools.md`                               | Tracks tool implementation status — useful but feels disconnected from the tools themselves                         | **Move to `packages/shared/docs/llm-tools.md`** or keep in `docs/` but link from relevant package READMEs. Low priority. |
| Cursor Cloud section in CLAUDE.md (lines 685–727) | IDE-specific instructions mixed into universal agent guidance                                                       | **Move to `packages/web/CLAUDE.md`** (ports, env setup relevant to frontend dev)                                         |

---

## Keep / Move / Delete Decisions

### KEEP in root (trimmed)

| Content                                                                                  | Why Keep                                             | Target Lines |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| Pre-push quality gates                                                                   | High-frequency, high-impact. Single canonical block. | ~6           |
| Core dev commands (`dev`, `lint-all`, `test`, `test:e2e`, `build`)                       | Essential for most sessions, can't be guessed        | ~8           |
| Architecture snapshot (5–8 bullets)                                                      | Orientation for every task                           | ~8           |
| Key file paths (events, schema, queries)                                                 | Most-touched files, saves discovery time             | ~5           |
| Non-obvious gotchas (worker error propagation, adapter memoization, `shouldNeverHappen`) | Prevents expensive, recurring mistakes               | ~6           |
| Context Library retrieval (trimmed)                                                      | Repo-specific workflow, critical for product work    | ~6           |
| Workflow guardrails (branches, PRs, merge policy, Changelog, ADR policy)                 | Policy constraints that cause problems if ignored    | ~12          |
| Service ports table                                                                      | Quick reference needed in most dev sessions          | ~7           |
| Documentation links (architecture, deployment, ADRs, LiveStore, Context Library)         | Pointers to deeper context — the "index" function    | ~8           |

**Estimated root total: ~120–150 lines**

### MOVE to scoped CLAUDE.md files (auto-discovered by Claude Code)

Each package already has a comprehensive README.md. The scoped CLAUDE.md files should contain **agent-specific operational guidance** that complements the README — gotchas, patterns to follow, things not to do. The README explains _what_ and _why_; the CLAUDE.md says _how to work here safely_.

| File                        | Content from current CLAUDE.md                                                                                                                                                                                                                                   | Complements                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `packages/server/CLAUDE.md` | StoreManager patterns, Effect-TS idioms (Effect.gen, Layer, Stream, Scope), fiber cleanup rules, idempotent monitoring, API serialization, graceful shutdown, Sentry integration, health check mechanism, dependency flow                                        | `packages/server/README.md` (332 lines) |
| `packages/web/CLAUDE.md`    | Storybook story patterns (use real LiveStore events, never mock data), component architecture, `useMemo` for adapter configs, React performance with LiveStore, LiveStore repair flow, service ports table, Cursor Cloud env notes                               | `packages/web/README.md` (325 lines)    |
| `packages/worker/CLAUDE.md` | SharedWorker + Web Worker architecture, OPFS persistence, WebLock for cross-tab sync, fallback design, worker error propagation gotchas (errors don't propagate to main thread, Sentry must init inside workers, Effect-TS defects don't reach error boundaries) | `packages/worker/README.md` (279 lines) |

### MOVE to existing or new docs (linked from root)

| Content                                                                               | Destination                                                                                                                                  | Rationale                                                                                                                                      |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Server architecture details                                                           | **Already in** `docs/architecture.md` + `packages/server/README.md` → just link                                                              | Don't recreate what exists                                                                                                                     |
| Deployment commands & details                                                         | **Already in** `docs/deployment.md` → just link                                                                                              | Same                                                                                                                                           |
| Testing strategy, LiveStore testing, full-stack integration, StubLLMProvider, logging | **New**: `docs/testing-guide.md`                                                                                                             | Only cross-cutting doc that doesn't exist yet. Each package has testing sections in its README, but there's no unified testing philosophy doc. |
| Project management (issue types, project boards, sub-issues)                          | **Mostly in** `.claude/skills/george/board-fields.md` (field IDs, intake protocol) + `README.md` (project management section) → link to both | The george skill already has the operational PM details. Root CLAUDE.md just needs the policy rules.                                           |
| First-time setup                                                                      | **Already in** package READMEs (each has setup sections) → link to package READMEs                                                           | One-time activity, well-documented per package                                                                                                 |
| ADR policy                                                                            | **Add brief note to root** linking to `docs/adrs/` with guidance on when to create ADRs                                                      | ADRs exist but CLAUDE.md never mentions them                                                                                                   |

### DELETE entirely

| Content                                            | Rationale                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Generic `gh` command reference (~87 lines)         | Claude already knows `gh` commands. Repo-specific patterns (board field IDs) are already in `.claude/skills/george/board-fields.md` |
| Duplicated pre-push blocks (3 extra copies)        | Consolidate to one canonical location                                                                                               |
| Duplicated deployment commands                     | Same                                                                                                                                |
| Verbose prose explaining standard tooling behavior | Low signal, wastes token budget                                                                                                     |
| `docs/product-management-options.md`               | Stale — decision was made, this is a dead artifact                                                                                  |

---

## Proposed Root CLAUDE.md Structure

```
# CLAUDE.md
<!-- Target: ≤150 lines. See Decision Framework in docs/plans/044-update-agent-md/plan-unified.md -->

## Before Pushing (CRITICAL)
[Single canonical block: lint-all, test, test:e2e. Pre-push hook enforces formatting.]

## Commands
[5-8 essential commands: dev, lint-all, test, test:e2e, build. Alt port syntax.]

## Architecture
[5-8 bullet summary: LiveStore event-sourced → SQLite, React 19 on CF Pages,
 CF Workers + Durable Objects for sync, Node.js agentic server, SharedWorker + OPFS]

## Key Paths
[events.ts, schema.ts, queries.ts, _worker.ts, server/src/index.ts]

## Critical Gotchas
[Worker errors don't propagate to main thread. useMemo for adapter configs.
 shouldNeverHappen won't reach error boundaries. resetPersistence for boot mismatches.]

## Context Library
[Quick lookup: Glob/Grep patterns. Conan for briefings. Sam for cards.
 5-signal uncertainty protocol. Downstream Sync after structural changes.]

## Workflow
[Feature branches → PRs to main. Branch prefix: claude/ or jessmartin/.
 Small focused PRs. "Closes #XXX" in descriptions. Changelog section for user-facing changes.
 All MAKE/PATCH items require a PR. Never merge without asking. No time estimates.
 Test-driven bug fixes. Storybook stories for UI components. Fix all BugBot feedback.
 ADRs for architectural decisions — see docs/adrs/.]

## Documentation
[Links to: docs/architecture.md, docs/deployment.md, docs/testing-guide.md,
 docs/adrs/, docs/context-library/README.md, docs/livestore.dev/llms.txt,
 .claude/agents/README.md, .claude/skills/george/board-fields.md]

## Services (local dev)
[Port table: Web 60001, Worker 8787, Auth 8788, Server 3003, Storybook 6010]
```

---

## Progressive Disclosure Strategy

### Principle: Link to existing docs, don't create parallel hierarchies

The repo already has comprehensive documentation. The problem isn't missing docs — it's that CLAUDE.md **duplicates** them instead of **linking** to them. The fix is primarily about making CLAUDE.md an index, not a handbook.

### Tier 1 — Scoped `CLAUDE.md` per package (auto-discovered)

Claude Code natively supports nested CLAUDE.md files — from the [Best Practices docs](https://code.claude.com/docs/en/best-practices):

> **Child directories**: Claude pulls in child CLAUDE.md files on demand when working with files in those directories

Each package already has a comprehensive README.md. The scoped CLAUDE.md adds **agent-specific operational notes** — the gotchas, invariants, and "how to work here safely" guidance that agents need but human developers might not. These should be concise (~50–100 lines each).

| File                        | Content (agent operational notes)                                                                                                                                    | Complements                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `packages/server/CLAUDE.md` | Effect-TS idioms, fiber cleanup, idempotent monitoring, API serialization, graceful shutdown, Sentry, health checks. Links to `README.md` for architecture overview. | `packages/server/README.md` |
| `packages/web/CLAUDE.md`    | Storybook patterns (real events, not mocks), `useMemo` for adapters, LiveStore repair flow, service ports. Links to `README.md` for setup.                           | `packages/web/README.md`    |
| `packages/worker/CLAUDE.md` | Worker error propagation gotchas, SharedWorker/OPFS/WebLock patterns, fallback design. Links to `README.md` for architecture.                                        | `packages/worker/README.md` |

### Tier 2 — New docs (only what doesn't exist yet)

| File                    | Content                                                                                                                                                                                                    | Why new                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `docs/testing-guide.md` | Unified testing philosophy: when to write unit vs E2E vs integration tests. LiveStore testing patterns. StubLLMProvider configuration. Full-stack test process management. WebSocket polyfill for Node.js. | Each package README has testing _how-to_, but no cross-package _strategy_ doc exists |

That's it. **One new doc.** Everything else already has a home.

### Tier 3 — Existing docs to link from root (no changes needed)

| Doc                                     | What root CLAUDE.md links to it for               |
| --------------------------------------- | ------------------------------------------------- |
| `docs/architecture.md`                  | System architecture deep dive                     |
| `docs/deployment.md`                    | Deployment procedures                             |
| `docs/adrs/`                            | Architectural decisions + when to create new ones |
| `docs/context-library/README.md`        | Product knowledge navigation                      |
| `docs/runbooks/`                        | Operational procedures                            |
| `.claude/agents/README.md`              | Agent system overview                             |
| `.claude/skills/george/board-fields.md` | Project board field IDs and intake protocol       |
| `https://docs.livestore.dev/llms.txt`   | LiveStore patterns                                |

---

## AGENTS.md vs CLAUDE.md Relationship

**Decision: Single source of truth in CLAUDE.md, with AGENTS.md as a symlink at every level.**

Rationale:

- Claude Code is our primary agent tool and reads CLAUDE.md natively
- AGENTS.md exists for cross-tool compatibility (Codex, Copilot)
- Maintaining two identical 726-line files is the current drift risk
- A symlink means zero drift by construction

**Recommendation**: CLAUDE.md is canonical at every level. Each CLAUDE.md gets a sibling `AGENTS.md` symlink (`ln -s CLAUDE.md AGENTS.md`) so that Codex, Copilot, and other AGENTS.md-aware tools get the same scoped instructions automatically. This applies at root and in each package directory.

Note: git stores symlinks natively and they work on macOS/Linux. Windows clones may need `core.symlinks=true` — acceptable since this is a macOS dev shop. The existing `deploy/AGENTS.md` is a standalone file (not a symlink) and should remain as-is since it has deploy-specific content distinct from any CLAUDE.md.

---

## Housekeeping (discovered during inventory)

| Action              | File                                 | Rationale                                                                                                                                    |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delete**          | `docs/product-management-options.md` | Stale — status "For Future Consideration" from Aug 2025. Decision was made (GitHub Issues + Projects). Dead artifact.                        |
| **Consider moving** | `docs/llm-tools.md`                  | Tracks LLM tool implementation status — useful but disconnected from the tools. Could move to `packages/shared/docs/` or stay. Low priority. |
| **Add ADR mention** | Root CLAUDE.md                       | ADRs exist (`docs/adrs/001–008`) but current CLAUDE.md never mentions them or when to create new ones. Add a brief note.                     |

---

## Implementation Plan

### Phase 1: Create scoped CLAUDE.md files per package

1. Create `packages/server/CLAUDE.md` (~50–100 lines) — agent operational notes for server work, linking to README.md for full context
2. Create `packages/web/CLAUDE.md` (~50–100 lines) — Storybook patterns, React/LiveStore gotchas, service ports
3. Create `packages/worker/CLAUDE.md` (~50–100 lines) — worker error propagation, SharedWorker/OPFS/WebLock gotchas
4. Symlink `AGENTS.md → CLAUDE.md` in each package directory (`ln -s CLAUDE.md AGENTS.md`)

### Phase 2: Create the one missing cross-cutting doc

1. Create `docs/testing-guide.md` — unified testing philosophy extracted from CLAUDE.md + package READMEs

### Phase 3: Rewrite root CLAUDE.md

1. Write new concise CLAUDE.md (~120–150 lines)
2. Include documentation links section pointing to existing docs
3. Ensure zero duplication across sections
4. Verify every line passes the 3-question decision framework
5. Add ADR reference and policy note

### Phase 4: Update root AGENTS.md

1. Delete the 726-line copy
2. Create symlink: `ln -s CLAUDE.md AGENTS.md` at repo root

### Phase 5: Housekeeping

1. Delete `docs/product-management-options.md`
2. Evaluate `docs/llm-tools.md` placement (low priority)

### Phase 6: Validate

1. Run `pnpm lint-all` to verify no breakage
2. Test 3–5 representative tasks to confirm agents reach correct guidance:
   - UI component task → should auto-discover `packages/web/CLAUDE.md`
   - Server bugfix → should auto-discover `packages/server/CLAUDE.md`
   - PR/issue workflow → should reach `board-fields.md` via root link
   - Testing task → should reach `docs/testing-guide.md` via root link
   - Architecture question → should reach `docs/architecture.md` via root link
3. Verify no critical instructions were lost by diffing old vs new

---

## Risks and Mitigations

| Risk                                             | Mitigation                                                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Over-cutting removes critical edge-case guidance | Keep a "Critical Gotchas" section in root for the most expensive mistakes. Validate with task simulations.                                                                 |
| Agents don't read scoped CLAUDE.md automatically | Claude Code docs confirm child-directory discovery. Test explicitly in Phase 6.                                                                                            |
| Agents miss linked docs (Tier 3)                 | Use `@path` import syntax where supported. Fall back to explicit "read X before doing Y" instructions.                                                                     |
| Content creep — root grows back over time        | Comment at top of CLAUDE.md with target line count and decision framework link. Periodic audits.                                                                           |
| Scoped CLAUDE.md duplicates README.md content    | Design principle: README = what/why (for humans too), CLAUDE.md = operational notes for agents only (gotchas, patterns, invariants). Different audiences, minimal overlap. |

---

## Acceptance Criteria

- [ ] Root CLAUDE.md is ≤ 150 lines with zero duplicated instruction blocks
- [ ] AGENTS.md is a symlink to CLAUDE.md at root and in each package directory
- [ ] Scoped CLAUDE.md files exist in `packages/server/`, `packages/web/`, `packages/worker/`
- [ ] `docs/testing-guide.md` exists with unified testing philosophy
- [ ] Root file links to existing docs (architecture, deployment, ADRs, context library, agent system, board fields)
- [ ] `docs/product-management-options.md` deleted
- [ ] Root file passes the 3-question test for every line
- [ ] Representative task simulations confirm agents reach correct guidance
