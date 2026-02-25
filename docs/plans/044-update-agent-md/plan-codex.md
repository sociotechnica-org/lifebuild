# AGENTS.md / CLAUDE.md Refresh Plan (044)

## Goal

Create a slimmer, higher-signal `AGENTS.md` / `CLAUDE.md` that improves agent reliability, reduces instruction conflicts, and keeps repo-specific guidance easy to maintain.

## Why This Change Is Needed

Current state in this repo:

- `CLAUDE.md`: 726 lines, 30,745 bytes
- `AGENTS.md`: identical copy of `CLAUDE.md`
- File is near OpenAI Codex's `32 KiB` per-`AGENTS.md` limit
- Multiple repeated instruction blocks create noise and drift risk

Observed duplication examples in `CLAUDE.md`:

- Pre-push test commands repeated in four places (`5-21`, `47-66`, `207-213`, `710-717`)
- Deployment commands repeated in two sections (`62-65`, `679-682`)
- Extensive `gh` command cookbook duplicates operational docs (`239-458`)

## External Guidance (Official Sources)

### 1) Keep root instructions concise and high-signal

- Anthropic documents that `CLAUDE.md` is loaded as project memory and recommends concise, actionable instructions with examples.
- Anthropic also supports modularization via imports (`@path/to/file.md`) for large instruction sets.

### 2) Prefer scoped instruction files over one giant root file

- OpenAI Codex AGENTS guidance: AGENTS files are discovered hierarchically, with deeper files overriding higher-level ones.
- This directly supports moving specialized guidance into subdirectory AGENTS files.

### 3) Use a practical baseline structure

- OpenAI's generated starter AGENTS structure centers on: `Commands`, `Code style`, `Testing`, and `PR instructions`.
- AGENTS.md standard guidance emphasizes actionable build/test/lint commands, style conventions, test instructions, and environment/security notes.

### 4) Treat AGENTS as a table of contents for edge cases

- OpenAI's engineering guidance frames AGENTS as a compact index of project-specific pitfalls and workflows, not a full handbook.

## Audit Of Current File Contents

Largest sections (line counts):

- `Project Management`: ~133 lines
- `Storybook Stories`: ~124 lines
- `Architecture`: ~91 lines
- `GitHub CLI Commands`: ~87 lines
- `Testing`: ~79 lines

Assessment:

- The file currently mixes three different concerns in one place:
  - Universal day-to-day guardrails (should stay in root)
  - Specialized implementation playbooks (should move to focused docs or scoped AGENTS)
  - Full command reference material (should move out of root, often removable)

## Keep / Cut / Move Recommendations

| Section / Content                                                             | Recommendation                    | Reason                                                   |
| ----------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------- |
| Pre-push quality gates (`lint-all`, `test`, `CI=true test:e2e`)               | **KEEP (single canonical block)** | High-frequency, high-impact rules                        |
| Core dev commands (`dev`, `lint-all`, `test`, CI e2e, web build)              | **KEEP (condense)**               | Essential for most sessions                              |
| High-level architecture summary                                               | **KEEP (trim to 5-8 bullets)**    | Useful orientation                                       |
| Context library retrieval triggers + key references                           | **KEEP (trim)**                   | Repo-specific workflow critical for product-concept work |
| Non-obvious gotchas (worker error propagation, LiveStore adapter memoization) | **KEEP (short list)**             | Prevents common expensive mistakes                       |
| Branch/PR guardrails (no direct main, ask before merge)                       | **KEEP**                          | Important policy constraints                             |
| Server internals details (`StoreManager`, `Effect-TS`, repair flow)           | **MOVE**                          | Too detailed for every task; better as specialized guide |
| Full testing playbook incl. fullstack fixtures and polyfills                  | **MOVE**                          | Needed only when writing tests                           |
| Storybook long examples and boilerplate                                       | **MOVE**                          | Better in a dedicated storybook guidance file            |
| GitHub CLI command reference cookbook                                         | **CUT/MOVE**                      | Generic CLI docs are low-signal in root instructions     |
| Project management taxonomy and issue templates                               | **MOVE**                          | Operational process docs, not coding instructions        |
| One-time setup instructions (`cp .env.example`, extension installs)           | **MOVE**                          | Not relevant every session                               |
| Cursor Cloud section in root agent file                                       | **MOVE**                          | Environment-specific, should be in setup docs            |
| Repeated command blocks across sections                                       | **CUT**                           | Duplication increases drift and conflict                 |

## Proposed New Root File Shape (Target: 120-180 lines)

Recommended root `AGENTS.md` / `CLAUDE.md` sections:

1. `Purpose + Scope` (2-4 lines)
2. `Critical Quality Gates` (single canonical pre-push block)
3. `Daily Commands` (5-8 commands)
4. `Architecture Snapshot` (5-8 bullets + key paths)
5. `Project-Specific Rules` (max ~10 bullets)
6. `Workflow Guardrails` (branch/PR/merge constraints)
7. `Where To Find Detailed Guides` (links or imports)

Hard limits to enforce:

- No duplicated command blocks
- No full command cookbooks in root
- No large code examples in root
- Keep under 20 KB to leave headroom (well below 32 KB hard cap)

## Recommended Splits For This Repo

Create focused companion docs (or scoped AGENTS files):

- `docs/agent-guides/server-architecture.md`
- `docs/agent-guides/testing-and-fullstack.md`
- `docs/agent-guides/storybook.md`
- `docs/agent-guides/project-ops.md`
- `docs/agent-guides/deployment-and-env.md`

Then keep root file as the entrypoint and link/import these only when needed.

## Implementation Plan

### Phase 1: Define cut line and ownership

- Freeze a target root size: `120-180 lines`
- Decide whether specialized guidance lives in:
  - `docs/agent-guides/*.md`, or
  - scoped `AGENTS.md` files in relevant subdirectories, or
  - both

### Phase 2: Extract specialized content

- Move server internals from `CLAUDE.md` into `server-architecture.md`
- Move testing deep-dive into `testing-and-fullstack.md`
- Move Storybook examples into `storybook.md`
- Move PM/project-board workflows into `project-ops.md`
- Move deployment/environment setup into `deployment-and-env.md`

### Phase 3: Rewrite root instructions

- Keep one canonical pre-push block
- Keep only high-frequency commands
- Keep only non-obvious constraints and pitfalls
- Replace verbose sections with short links/imports

### Phase 4: Add scoped AGENTS where useful

- Add `packages/server/AGENTS.md` for server-specific rules
- Add `packages/web/AGENTS.md` for storybook/UI-specific rules
- Add `packages/worker/AGENTS.md` for worker/runtime gotchas

This uses hierarchical discovery so guidance appears where relevant.

### Phase 5: Validate with task simulations

Run 5 representative tasks and verify the root file is sufficient:

- Web UI component task
- Server reconnect bugfix
- Worker error-handling task
- GitHub issue/PR workflow task
- Test-writing task

Success metric: agent reaches correct detailed guidance via links/scoped AGENTS without root-file bloat.

## Acceptance Criteria

- Root `AGENTS.md` and `CLAUDE.md` are concise and aligned (single source preferred)
- Root file <= 180 lines and no duplicated instruction blocks
- All moved sections exist in dedicated companion docs
- At least one scoped AGENTS file added where specialization is high
- Team can point to one canonical location for each instruction domain

## Risks And Mitigations

- Risk: Over-cutting removes important edge-case guidance
  - Mitigation: keep a short "Critical Pitfalls" list in root and test with representative tasks
- Risk: Drift between `AGENTS.md` and `CLAUDE.md`
  - Mitigation: pick one canonical file and generate/sync the other automatically
- Risk: Agents miss moved docs
  - Mitigation: explicit links/imports and scoped AGENTS in relevant directories

## Suggested Decision Rules (Line-By-Line)

Keep a line in root only if all are true:

- It is needed in many sessions
- It is specific to this repo (not generic coding advice)
- Removing it would likely cause repeated mistakes

If any of the above are false, move it to a specialized file.

## Source Links

- Anthropic Claude Code memory overview: https://docs.anthropic.com/en/docs/claude-code/memory
- Anthropic project instructions best practices: https://docs.anthropic.com/en/docs/claude-code/memory#project-memory
- OpenAI Codex AGENTS guide: https://developers.openai.com/codex/configuration/agents-md
- AGENTS.md standard site: https://agents.md/
- OpenAI engineering guidance on AGENTS usage: https://openai.com/index/introducing-codex/#harnessing-codex-effectively
