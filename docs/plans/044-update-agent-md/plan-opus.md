# CLAUDE.md Overhaul — Analysis & Recommendations

## Problem

The current `CLAUDE.md` is **726 lines** long. Research from Anthropic, HumanLayer, GitHub, and the AGENTS.md community converges on a clear consensus: bloated instruction files degrade agent performance. Key findings:

- **LLMs reliably follow ~150–200 instructions**; Claude Code's system prompt already consumes ~50 of those ([HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md))
- Anthropic's own docs warn: "If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise" ([Claude Code Best Practices](https://code.claude.com/docs/en/best-practices))
- The file even includes a system reminder saying it "may or may not be relevant" — non-universal instructions are **routinely deprioritized**
- GitHub's analysis of 2,500+ repos found that **specificity and conciseness** beat verbosity every time ([GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/))
- HumanLayer keeps their CLAUDE.md under 60 lines; targets should be **< 300 lines** for well-structured projects

**Goal**: Reduce CLAUDE.md to ~100–150 lines of universally-applicable, high-signal instructions. Move everything else into progressive-disclosure files, skills, or delete it entirely.

---

## Current File Audit

### Section-by-section assessment

| Lines   | Section                            | Verdict                           | Rationale                                                                                                                                                           |
| ------- | ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–16    | Critical: Before Pushing           | **KEEP (trim)**                   | Universally applicable. But duplicated at lines 207–213. Consolidate.                                                                                               |
| 17–66   | Essential Commands                 | **KEEP (trim)**                   | Commands Claude can't guess. Cut first-time setup (one-time, not every session). Cut deployment commands (rare).                                                    |
| 67–78   | Architecture overview              | **KEEP (trim)**                   | Useful high-level orientation. Cut to 3–5 bullet points max.                                                                                                        |
| 79–93   | Key Files (Monorepo)               | **MOVE → progressive disclosure** | Useful when navigating, but Claude can find files itself. Put in `.claude/skills/` or a separate doc.                                                               |
| 94–113  | Server Architecture Details        | **MOVE → `docs/` or skill**       | Detailed server internals. Only relevant for server work. Classic progressive-disclosure candidate.                                                                 |
| 114–125 | Effect-TS Patterns                 | **MOVE → `docs/` or skill**       | Only relevant when touching Effect-TS code.                                                                                                                         |
| 126–143 | LiveStore Repair Flow              | **MOVE → `docs/` or skill**       | Highly specialized.                                                                                                                                                 |
| 144–157 | Worker Architecture & Gotchas      | **MOVE → `docs/` or skill**       | Specialized knowledge for worker bugs.                                                                                                                              |
| 158–163 | Documentation links                | **KEEP (trim)**                   | 2–3 lines pointing to docs. Good.                                                                                                                                   |
| 164–191 | Context Library Retrieval          | **KEEP (trim)**                   | Important workflow. But 28 lines is too much for "quick lookup." Trim to essentials.                                                                                |
| 192–237 | Development Workflow & PR Creation | **TRIM heavily**                  | The "before pushing" section is duplicated from lines 1–16. PR creation workflow is overly detailed — most of it is standard `gh` usage Claude already knows.       |
| 238–320 | GitHub CLI commands                | **DELETE or move to skill**       | Claude already knows `gh` commands. This is reference documentation, not instructions. If custom patterns exist (like project board field IDs), extract just those. |
| 321–456 | Project Management (detailed)      | **MOVE → skill or separate doc**  | Extensive project management workflows. Only relevant when doing PM tasks. Perfect progressive-disclosure candidate.                                                |
| 457–468 | Important Guidelines               | **KEEP**                          | Core behavioral rules. But several repeat earlier content. Deduplicate.                                                                                             |
| 469–548 | Testing (detailed)                 | **MOVE → progressive disclosure** | Detailed testing patterns. Only needed when writing tests. Keep just the test commands.                                                                             |
| 549–670 | Storybook / Component Patterns     | **MOVE → skill**                  | 120+ lines of Storybook patterns. Only relevant when building UI components.                                                                                        |
| 671–726 | Deployment & Cursor Cloud          | **TRIM / MOVE**                   | Deployment is rare. Cursor Cloud section may be irrelevant for Claude Code. Port table is useful; rest can go.                                                      |

### Summary count

| Category                                  | Current Lines | Target           |
| ----------------------------------------- | ------------- | ---------------- |
| Keep (trimmed)                            | ~180          | ~100–120         |
| Move to progressive disclosure            | ~400          | 0 (in CLAUDE.md) |
| Delete (Claude already knows / duplicate) | ~150          | 0                |

---

## Recommended New Structure

### CLAUDE.md (~100–120 lines)

```
# CLAUDE.md

## Before Pushing (CRITICAL)
- pnpm lint-all (pre-push hook enforces formatting)
- pnpm test
- CI=true pnpm test:e2e

## Commands
- pnpm dev                              # Start all services
- pnpm lint-all                         # Lint + format + typecheck
- pnpm test                             # Unit tests
- pnpm test:e2e / CI=true pnpm test:e2e # E2E tests
- pnpm --filter @lifebuild/web build    # Build web

## Architecture (3–5 bullets)
- LiveStore event-sourced state → SQLite materialized views
- React 19 + TypeScript on Cloudflare Pages (packages/web)
- Cloudflare Workers + Durable Objects for sync (packages/worker)
- Node.js agentic server (packages/server)
- SharedWorker + OPFS for client-side persistence

## Key Patterns
- Events: packages/shared/src/events.ts
- Schema: packages/shared/src/schema.ts
- Queries: packages/shared/src/queries.ts
- Always use real LiveStore events in Storybook stories, never mock data
- Use Effect-TS patterns: Effect.gen, Layer, Stream, Scope
- Use useMemo for adapter configs; recreating adapters causes reconnections

## Documentation
- Context Library: docs/context-library/README.md
- Architecture: docs/architecture.md
- LiveStore: https://docs.livestore.dev/llms.txt
- Context briefing: use Conan subagent (.claude/agents/conan.md)

## Context Library
- Find cards: Glob for docs/context-library/**/[Type] - [Name].md
- Search by topic: Grep across docs/context-library/
- Follow 5-signal uncertainty protocol (.claude/agents/sam.md)
- After structural changes, run Conan's Downstream Sync (Job 9)

## Workflow
- Feature branches, PRs to main. Branch prefix: claude/ or jessmartin/
- Small, focused, demoable PRs
- Link issues: "Closes #XXX" in PR description
- All MAKE/PATCH items require a PR
- Never merge without asking the user
- No time estimates
- Test-driven bug fixes: failing test first

## Guidelines
- Always create Storybook stories for UI components
- Never commit directly to main
- Fix all feedback including neutral BugBot checks
- E2E tests sparingly, only for vital user flows

## Services (local dev)
| Service | Port |
|---------|------|
| Web     | 60001 |
| Worker  | 8787  |
| Auth    | 8788  |
| Server  | 3003  |
| Storybook | 6010 |
```

### Progressive Disclosure Files

Move detailed content into files that Claude reads on-demand:

| New File                                    | Content From                                                                   | When Claude Needs It          |
| ------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| `docs/agent-context/server-architecture.md` | Lines 79–157 (key files, server details, Effect-TS, worker arch)               | Working on server/worker code |
| `docs/agent-context/testing-patterns.md`    | Lines 469–548 (testing strategy, LiveStore testing, full-stack tests, logging) | Writing tests                 |
| `docs/agent-context/storybook-patterns.md`  | Lines 549–670 (Storybook stories, component patterns)                          | Building UI components        |
| `docs/agent-context/project-management.md`  | Lines 238–456 (gh commands, project board, issue workflows)                    | PM tasks, creating issues/PRs |
| `docs/agent-context/deployment.md`          | Lines 671–726 (deployment, env setup)                                          | Deploying                     |

These can also be implemented as `.claude/skills/` if the team prefers that mechanism.

### What to Delete Entirely

1. **Generic `gh` command reference** (lines 238–320) — Claude already knows these commands. Only keep project-specific patterns (board field IDs, custom workflows).
2. **Duplicated "before pushing" instructions** — appears at lines 1–16, 207–213, and 457. Consolidate to one place.
3. **First-time setup instructions** (lines 28–38) — one-time activity, not relevant to every session. Move to README or a setup script.
4. **Verbose Storybook code examples** — the 120-line Storybook section can be reduced to a few principles + a pointer to an example file in the codebase.
5. **Cursor Cloud section** (lines 685–727) — if agents work via Claude Code, not Cursor, this is noise. If needed, move to a separate file.

---

## Implementation Steps

### Phase 1: Create progressive disclosure files

1. Create `docs/agent-context/` directory
2. Extract server architecture details → `server-architecture.md`
3. Extract testing patterns → `testing-patterns.md`
4. Extract Storybook patterns → `storybook-patterns.md`
5. Extract project management workflows → `project-management.md`
6. Extract deployment details → `deployment.md`

### Phase 2: Rewrite CLAUDE.md

1. Write new concise CLAUDE.md (~100–120 lines)
2. Add `@` import references to progressive disclosure files where helpful
3. Ensure no duplication across sections

### Phase 3: Validate

1. Run `pnpm lint-all` to verify no issues
2. Review with team to confirm nothing critical was lost
3. Test a few sessions to see if Claude's behavior is better

---

## Key Principles Applied

From the research:

1. **"For each line, ask: Would removing this cause Claude to make mistakes? If not, cut it."** — [Anthropic](https://code.claude.com/docs/en/best-practices)
2. **Progressive Disclosure** — "Show just enough information to help agents decide what to do next, then reveal more details as they need them" — [Anthropic Skills Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
3. **Don't teach what Claude already knows** — `gh` commands, standard language conventions, "write clean code" — [Anthropic](https://code.claude.com/docs/en/best-practices)
4. **Concrete > abstract** — File paths and real examples beat prose descriptions — [GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
5. **Six core areas** — commands, testing, project structure, code style, git workflow, boundaries — [AGENTS.md spec](https://agents.md/)
6. **~150 instruction budget** — Don't exceed what the model can reliably follow — [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## Sources

- [Claude Code Best Practices (Anthropic)](https://code.claude.com/docs/en/best-practices)
- [Writing a Good CLAUDE.md (HumanLayer)](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [How to Write a Great agents.md (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [AGENTS.md Spec](https://agents.md/)
- [Improve Your AI Code Output with AGENTS.md (Builder.io)](https://www.builder.io/blog/agents-md)
- [Skill Authoring Best Practices (Anthropic)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Creating the Perfect CLAUDE.md (Dometrain)](https://dometrain.com/blog/creating-the-perfect-claudemd-for-claude-code/)
