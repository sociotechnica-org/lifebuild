# First Factory Run — Session Timeline

**Date:** February 26-27, 2026
**Session:** `0dfa7bbc-463b-4d8a-9913-8ec934976fb9`
**Duration:** ~10 hours (11:20am - 9:14am ET)
**Human turns:** 135
**Context compactions:** 5+

## Overview

First attempt at using Claude Opus as an autonomous orchestrator shelling out to Codex for implementation of a full release ("The Map-first UI Release", 20 issues). The session evolved from collaborative planning into a factory-style execution loop.

---

## Phase 1: Release Planning with Conan (~11:20am - 12:40pm ET)

- Kicked off planning "The Map-first UI Release" with Conan (context library agent)
- Shared a shapes diagram and talked through the design vision
- Key design decisions:
  - Map as always-visible canvas
  - Overlays instead of full-page routes ("like clicking a building in Warcraft")
  - Projects go from Workshop to Map
  - Chats move to left sidebar
- Discussed campfire/reveal/rail visibility states, task queue concept
- Conan ran uncertainty analysis, then wrote the release doc
- Created a PR to share with Danvers

## Phase 2: Issue Creation & Board Setup (~11:38pm - 11:50pm ET)

- Created GitHub Project Board #8 for the release
- Wrote user stories for ~20 issues (#699-#721) using preferred format (Motivation / Story / Acceptance Criteria)
- Consolidated duplicate journey stories, tagged everything with "ralph" label
- Marked already-done items (#714-716) as complete

## Phase 3: Context Briefings (~11:56pm - 12:10am ET)

- Had Conan generate context briefings for all 20 issues in parallel using subagents
- Briefings saved to `docs/issues/<number>/CONTEXT_BRIEFING.md`
- Committed all briefings

## Phase 4: Codex Integration & Planning (~12:13am - 1:40am ET)

- Started experimenting with shelling out to Codex for technical implementation plans
- First attempt on #699 — hit context/performance issues
- Dropped from `xhigh` to `high` effort level
- Scaled to 4 parallel Codex sessions for plan generation
- Plans saved to `docs/issues/<number>/PLAN.md`
- Debated whether "ralph loop" (bash loop orchestrator) was even needed — concluded Opus might be strong enough as orchestrator directly

## Phase 5: Orchestrator Design (~2:09am - 2:37am ET)

- Decided to use Opus as the orchestrator shelling out to Codex for implementation
- Designed the workflow: worktrees for parallelism, Codex implements, Opus QAs with Playwright MCP
- Wrote orchestrator playbook to survive compactions
- Key decisions:
  - First ticket goes solo end-to-end, then parallelize
  - QA via browser automation (Playwright MCP)
  - Update GitHub Project Board #8 status as work progresses
  - Resume Codex on failures
- Requested a TUI kanban status board updated every ~5 min
- **"GOOOOOOO!!!! 🔥"** — kicked off execution

## Phase 6: Execution & Issues (~2:38am - 9:14am ET)

- Started implementing #699 via Codex
- Accidentally created QA account in production instead of local
- Hit multiple context compactions (at least 5 continuations)
- Session kept auto-continuing through the night/morning

---

## Key Learnings

1. **Opus as orchestrator works** — no ralph loop (bash script orchestrator) needed. Opus can catch errors, retry, and keep state across compactions if given a playbook file.
2. **Parallel Codex via worktrees** is the scaling mechanism for concurrent implementation.
3. **Context blowout is real** — the session compacted 5+ times and kept going. Background task output and Codex logs consume context fast.
4. **Codex + Opus division of labor**: Codex implements, Opus orchestrates/QAs/reviews.
5. **Playwright MCP for QA** — browser automation enables manual-style testing by the orchestrator.
6. **Production vs local gotcha** — need to be explicit about which environment to use. QA account was accidentally created in prod.
7. **Effort level matters** — dropping Codex from `xhigh` to `high` helped with speed without noticeable quality loss for planning tasks.
8. **Playbook files are essential** — writing orchestration state to a markdown file lets the session survive compactions without losing the plan.

## Artifacts Produced

- Release doc: `docs/context-library/releases/Release - The Map-first UI.md`
- 20 GitHub issues: #699-#721
- Context briefings: `docs/issues/<number>/CONTEXT_BRIEFING.md`
- Technical plans: `docs/issues/<number>/PLAN.md`
- Orchestrator playbook: `docs/plans/045-ralph-loop-orchestration/orchestrator-playbook.md`
- GitHub Project Board #8
