# Orchestrator Playbook: Map-first UI Release

## Role

I am the release orchestrator for 20 issues (#699-#721). I dispatch work to Codex, monitor PRs, handle failures, and merge. I do not write code myself.

## Issue Lifecycle

```
planned → implementing → in-review → qa → merged
```

For each issue:

1. Create a git worktree: `git worktree add .claude/worktrees/<number> -b make/<number>-<short-desc> origin/main`
2. Write the implementation prompt with issue body + context briefing + plan
3. Dispatch to Codex: `codex exec -C .claude/worktrees/<number> < /tmp/codex-impl-<number>.md`
4. Codex writes code, opens PR, monitors its own CI, requests review via `@codex pls review`, resolves feedback
5. If Codex stops without a clean PR: resume it or launch a new session on the same branch with specific fix instructions
6. Once PR is green and review feedback resolved: **I do manual QA via Playwright MCP**
7. QA steps: start dev server, navigate the app in Chrome, verify the acceptance criteria from the issue
8. If QA finds issues: dispatch back to Codex with specific fix instructions, then re-QA
9. Once QA passes: merge, close issue, clean up worktree
10. Move to next issue respecting dependency order

## Manual QA Protocol

Before merging any PR, I verify it in the browser using Playwright MCP:

1. Start full dev stack: `pnpm dev` (runs web:60001, worker:8787, auth:8788, server:3003)
2. Navigate to `http://localhost:60001` via `browser_navigate`
3. First-time setup: go to `/signup` to create an account before logging in
4. Walk through the acceptance criteria from the issue
5. Use `browser_snapshot` to inspect the DOM/accessibility tree
6. Use `browser_take_screenshot` for visual verification
7. For agentic conversation features: need full stack running (server on :3003)
8. If anything is wrong: dispatch to Codex to fix, then re-QA
9. Only merge after QA passes

## Dependency Graph

```
Phase 1 (no deps, parallel): 699, 700, 701, 702, 703
Phase 2 (needs Phase 1):     704 [needs 699,700,701], 705 [needs 704], 706 [needs 704]
Phase 3 (needs Phase 2):     707 [needs 705], 708 [needs 703,705]
Phase 4 (needs Phase 3):     709 [needs 705], 710 [needs 705], 711 [needs 708], 712 [needs 709], 713 [needs 707,708,709,710], 717 [needs 712]
Phase 5 (needs Phase 3/4):   718 [needs 713], 719 [needs 709], 720 [needs 710], 721 [needs 708]
```

## Parallel Execution

- Use git worktrees so each Codex session has its own branch/working directory
- Run as many parallel sessions as dependencies allow
- Phase 1: all 5 can run simultaneously
- Later phases: run all unblocked issues in parallel

## Implementation Prompt Template

The prompt for each Codex session must include:

- The full issue body (from GitHub)
- The context briefing (`docs/issues/<number>/CONTEXT_BRIEFING.md`)
- The technical plan (`docs/issues/<number>/PLAN.md`)
- Instructions to: implement, open PR, monitor CI, fix failures, request review via `@codex pls review`, resolve all feedback
- The PR should include `Closes #<number>` in the body
- Branch naming: `make/<number>-<short-desc>`

## Codex Instance Tracking

Maintain a file at `/tmp/codex-instances.md` mapping issue numbers to Codex session IDs.
When dispatching: record the session ID from Codex output.
When resuming: use `codex exec resume --id <session-id>` with new instructions.

## Failure Recovery

- **Codex exits without clean PR**: Resume the Codex instance with targeted instructions
- **CI keeps failing**: Resume Codex with the specific error output
- **Review feedback unresolved**: Resume Codex pointing at the specific comments
- **QA finds issues**: Resume the Codex instance with screenshot/DOM evidence and fix instructions
- **QA itself is broken** (browser won't load, dev server crashes, etc.): **MERGE ANYWAY**. CI passing is sufficient. Do not let QA failures block progress.
- **Merge conflict**: Have Codex rebase onto latest main
- **Rate limited**: Wait, retry
- **Any other blocker**: Find a workaround. NEVER stop. The goal is all 20 tickets done.

## Rules

- I NEVER stop. If blocked on one issue, work on another.
- I always merge clean PRs — no waiting for human approval.
- If QA is broken or impossible: MERGE ANYWAY. CI green is sufficient.
- I only interact with code through Codex — I don't write code myself
- GitHub issues are the source of truth for status
- After merge, rebase any in-flight worktrees that depend on the merged work
- Goal: all 20 tickets done in one session. Go all night if needed.

## Done Condition

All 20 issues closed. All PRs merged to main. App builds, `pnpm test` passes, `CI=true pnpm test:e2e` passes.
