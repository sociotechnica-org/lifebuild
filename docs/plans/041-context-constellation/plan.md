# Context Constellation: Modified Project Plan

## Status

| Phase                          | Status          | Notes                                                     |
| ------------------------------ | --------------- | --------------------------------------------------------- |
| Phase 1: Protocol & Schema     | **Done**        | Consolidated into `.claude/skills/context-constellation/` |
| Phase 2: Subagents             | **Done**        | Conan & Bob enhanced with library maintenance roles       |
| Phase 3: Constellation Skill   | **Done**        | All skill files created and operational                   |
| Phase 4: CLAUDE.md Integration | **Done**        | Context Library Retrieval section added                   |
| Phase 5: Validation            | **Partial**     | 1/5 dry-runs completed (Kanban status filter — success)   |
| Phase 6: Feedback Loop         | **Not started** | Ongoing — requires more constellation assemblies          |

---

## Overview

Build a context retrieval system for the Context Library using Claude Code's native infrastructure — skills, subagents, and file tools — instead of a custom MCP server.

**Core Problem:** AI builders produce technically correct but contextually wrong outputs when they lack implicit architectural knowledge.

**Solution:** A Conan subagent + constellation skill that assembles context packages from the library using Glob/Grep/Read, guided by type-based retrieval profiles encoded as instructions.

**Key Insight:** The library's file structure IS the knowledge graph. Folder paths encode type taxonomy. Wikilinks encode relationship edges. Card names are unique identifiers. Claude Code can traverse this graph natively.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Code Session                        │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  /constellation  │───▶│   Bob (agent)    │                   │
│  │   (skill)        │    │   implements     │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Conan (agent)   │    │  Claude Code     │                   │
│  │  assembles       │    │  native tools    │                   │
│  │  constellation   │    │  Glob/Grep/Read  │                   │
│  └────────┬─────────┘    └──────────────────┘                   │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────┐                   │
│  │         CONTEXT_BRIEFING.md              │                   │
│  │  task_frame + primary + supporting +     │                   │
│  │  relationship_map + gap_manifest         │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Context Library (docs/context-library/)            │
│  ~100 markdown cards · 18 types · 5 dimensions · wikilinks     │
│  Folder structure = type taxonomy                               │
│  [[wikilinks]] = relationship edges                             │
│  File names = card identifiers                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why not an MCP server?

| Concern                   | Assessment                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| Library size (~100 cards) | Small enough for file-based retrieval                             |
| Search quality            | Card names + consistent terminology make keyword search effective |
| Graph traversal           | Wikilinks in cards are greppable relationship edges               |
| Type-based routing        | Folder structure = type taxonomy, no index needed                 |
| Scoring/ranking           | Mandatory card rules substitute for computed scores at this scale |
| Cost to build             | Skills/agents: days. MCP server: weeks.                           |
| Maintenance               | Zero infrastructure vs. database + embeddings + deployment        |

**When to revisit:** If the library exceeds ~300 cards, or if keyword search produces too many false negatives, add an MCP server with embeddings as an optimization layer on top of this foundation.

---

## Deliverables

| #   | Deliverable                   | Type      | Location                                                     | Effort |
| --- | ----------------------------- | --------- | ------------------------------------------------------------ | ------ |
| 1   | Constellation Protocol Spec   | Doc       | `.claude/skills/context-constellation/protocol.md`           | Medium |
| 2   | Conan Subagent Definition     | Agent     | `.claude/agents/conan.md`                                    | Low    |
| 3   | Bob Subagent Definition       | Agent     | `.claude/agents/bob.md`                                      | Low    |
| 4   | Constellation Skill           | Skill     | `.claude/skills/context-constellation/`                      | Medium |
| 5   | Type-Based Retrieval Profiles | Reference | `.claude/skills/context-constellation/retrieval-profiles.md` | Medium |
| 6   | Provenance Log Schema         | Doc       | `.claude/skills/context-constellation/provenance-schema.md`  | Low    |
| 7   | CLAUDE.md Integration         | Edit      | `CLAUDE.md`                                                  | Low    |
| 8   | Validation Scenarios          | Test      | Manual dry-run                                               | Medium |

---

## Phase 1: Protocol & Schema (Day 1)

### 1.1 Constellation Protocol Spec

**File:** `.claude/skills/context-constellation/protocol.md`

Document the contract between Conan and Bob:

- **CONTEXT_BRIEFING.md structure** — Task Frame, Primary Cards (full), Supporting Cards (summaries), Relationship Map (linearized wikilink paths), Gap Manifest
- **Bob's inquiry protocol** — 5-signal decision matrix, structured uncertainty format, max 3 follow-up rounds
- **Ordering for attention** — Beginning: task frame + primary cards. Middle: relationship map + supporting summaries. End: WHY cards + anti-patterns + gaps.
- **Token budget guidance** — Simple: 3-5 cards. Medium: 5-10 cards. Complex: 10-15 cards.

### 1.2 Provenance Log Schema

**File:** `.claude/skills/context-constellation/provenance-schema.md`

Same schema from the original plan — session ID, task description, cards retrieved, cards delivered, gaps identified, decisions logged, outcomes tracked. The only change: entries are appended via file writes instead of MCP tool calls.

**Log location:** `docs/context-library/constellation-log.jsonl`

**Exit criteria:** Protocol reviewed and approved.

---

## Phase 2: Subagents (Day 1-2)

### 2.1 Conan Subagent

**File:** `.claude/agents/conan.md`

```markdown
---
name: conan
description: Context librarian that assembles documentation
  constellations before implementation begins. Use when starting
  a feature, fixing a bug, or making architectural changes that
  touch product concepts described in the Context Library.
tools: Glob, Grep, Read, Write
model: sonnet
---
```

Conan's job:

1. Parse the task → identify target card type + task type
2. Load retrieval profile for that type (from skill reference)
3. Find seed cards: `Grep` the library for key terms from the task
4. Expand via wikilinks: `Grep` for `[[` in seed cards, follow mandatory upstream links
5. Read primary cards in full, summarize supporting cards
6. Write `.context/CONTEXT_BRIEFING.md` with the standard package structure
7. Log assembly to `constellation-log.jsonl`

Conan does NOT implement. Conan prepares.

### 2.2 Bob Subagent

**File:** `.claude/agents/bob.md`

```markdown
---
name: bob
description: Curious builder that implements features using Context
  Library guidance. Use after Conan has prepared a context briefing,
  or for any implementation task where architectural alignment matters.
tools: all
model: opus
---
```

Bob's job:

1. Read `.context/CONTEXT_BRIEFING.md` if it exists
2. Implement the task
3. When uncertain, evaluate 5 signals (reversibility, coverage, precedent, blast radius, domain)
4. If 2+ signals say "query" → use Grep/Read to search the library directly
5. Log significant decisions to `constellation-log.jsonl`

### Key difference from original plan

The original plan had Bob calling MCP tools (`search_by_dimension`, `get_related_cards`). The modified plan has Bob calling the same Claude Code tools Conan uses — Grep and Read against `docs/context-library/`. The inquiry protocol is the same; the tools are different.

**Exit criteria:** Both agents invocable via Claude Code subagent system.

---

## Phase 3: Constellation Skill (Day 2-3)

### 3.1 Skill Definition

**Directory:** `.claude/skills/context-constellation/`

**File:** `SKILL.md`

```markdown
---
name: context-constellation
description: Assemble context from the Context Library for implementation tasks
---
```

The skill teaches any agent how to:

- Navigate the library structure (`docs/context-library/`)
- Understand the 5-dimension card anatomy (WHAT/WHY/WHERE/HOW/WHEN)
- Use wikilinks as relationship edges for graph traversal
- Follow type-based retrieval profiles
- Write a CONTEXT_BRIEFING.md

### 3.2 Retrieval Profiles (the core reference)

**File:** `.claude/skills/context-constellation/retrieval-profiles.md`

This replaces the scoring algorithm with prose instructions per type. Example:

```markdown
## When building/modifying a System

**Always include:**

- The System card itself (full content)
- At least 1 governing Strategy (follow WHY links from the card)
- All Principles referenced in the card's WHY section
- All Capabilities that invoke this system (Grep for the system name across capabilities/)
- All Rooms where this system is visible (Grep for the system name across rooms/)

**Traversal:** 3 hops upstream via wikilinks. Read the card → follow its [[links]] → follow THOSE cards' [[links]] for Strategy/Principle chains.

**Dimension priority:** WHY (0.35) > WHERE (0.30) > HOW (0.20) > WHAT (0.15)
→ When summarizing supporting cards, preserve WHY content, compress HOW.

**Anti-pattern check:** Always read the HOW section's "What Breaks This" for the primary card and all referenced Principles.
```

Similar profiles for all 11 types (System, Component, Room, Zone, Structure, Capability, Artifact, Overlay, Agent, Prompt, Primitive).

### 3.3 Wikilink Traversal Instructions

**File:** `.claude/skills/context-constellation/traversal.md`

How to follow the knowledge graph using native tools:

```markdown
## Finding relationships from a card

1. Read the card
2. Extract all [[wikilinks]] — these are relationship edges
3. Each wikilink has a context phrase after the ]] explaining the relationship type
4. To find a linked card: Glob for the filename
   - `[[System - Bronze Stack]]` → Glob for `**/System - Bronze Stack.md`

## Finding cards that reference a given card

1. Grep for the card name across the library:
   - `Grep pattern="Bronze Stack" path="docs/context-library/"`
2. This surfaces all cards that link TO this card (reverse edges)

## Following a WHY chain upstream

1. Read the card's WHY section
2. Find the [[Principle - ...]] and [[Strategy - ...]] links
3. Read those cards
4. Check THEIR WHY sections for further upstream links
5. Stop when you reach a Strategy (top of the rationale hierarchy)
```

### 3.4 Task-Type Modifiers (reference)

**File:** `.claude/skills/context-constellation/task-modifiers.md`

Prose version of the dimension multipliers:

```markdown
## Feature addition

Focus on WHERE (what connects to this) and HOW (implementation patterns).
WHY context at normal weight — you need rationale but it's not the driver.

## Bug fix

Focus on HOW (what should be happening) and WHEN (what changed recently).
Temporal context critical — recent changes to related cards may explain the bug.

## Refactoring

Focus on WHY (understand the rationale before changing structure) and WHERE
(understand all the connections that might break). HOW is less important —
you're changing the HOW.

## Architecture change

Everything elevated. WHY is critical (don't break strategic alignment).
WHERE is critical (understand blast radius). WHEN matters (what's stable
vs. evolving).
```

**Exit criteria:** Skill invocable, retrieval profiles complete for all types.

---

## Phase 4: CLAUDE.md Integration (Day 3)

Add a section to CLAUDE.md that makes the constellation system discoverable:

```markdown
## Context Library Retrieval

When implementing features that touch product concepts (rooms, agents,
capabilities, systems, etc.), consult the Context Library:

1. **Quick lookup:** `Glob` for `docs/context-library/**/[Type] - [Name].md`
2. **Full constellation:** Use the Conan subagent for context assembly
3. **During implementation:** Follow Bob's 5-signal uncertainty protocol

See `docs/context-library/README.md` for library orientation.
See `.claude/skills/context-constellation/` for retrieval profiles.
```

**Exit criteria:** Any Claude Code session can discover and use the constellation system.

---

## Phase 5: Validation (Day 3-4)

### Dry-run scenarios

Test the system manually by running Conan against real tasks:

| Scenario                                  | What to test         | Success criteria                                                                                                                           |
| ----------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| "Add a status filter to the Kanban board" | Component build      | Conan retrieves: Structure - Kanban Board, Room - Project Board, Standard - Project States, related Capabilities                           |
| "Implement the System primitive"          | System build (broad) | Conan retrieves: Primitive - System, Strategy chain, all System-related capabilities, Room - System Board, Learning - System Primitive Gap |
| "Fix Bronze task ordering"                | Bug fix (narrow)     | Conan retrieves: System - Bronze Stack, System - Priority Queue Architecture, Standard - Priority Score, Overlay - The Table               |
| "Add Category Advisor routes"             | Feature (cross-zone) | Conan retrieves: all 8 Agent cards, Room - Category Studios, Zone - Strategy Studio, Learning - Category Advisor Accessibility             |
| "Refactor the Planning Queue"             | Refactoring          | WHY-heavy retrieval: Strategy - Superior Process, Principle - Plans Are Hypotheses, System - Planning Queue + all referencing cards        |

### Metrics to track

- **Retrieval relevance:** Did the briefing contain the cards a human would pick?
- **Gap detection:** Did Conan flag missing information?
- **Traversal completeness:** Were mandatory upstream cards found?
- **Token efficiency:** How many cards in a typical briefing?
- **Bob's query rate:** How often does Bob need to search beyond the briefing?

**Exit criteria:** 4/5 scenarios produce useful briefings. Gaps in remaining scenarios documented.

---

## Phase 6: Feedback Loop (Ongoing)

### 6.1 Provenance Review

Weekly review of `constellation-log.jsonl`:

- Which cards appear in successful sessions?
- Which gaps repeat? → Priority for new card creation
- Which cards are retrieved but not referenced by Bob? → Review for relevance
- Where does Bob's confidence fail? → Improve retrieval profile for that type

### 6.2 Profile Tuning

After 10+ constellation assemblies:

- Are certain types consistently over/under-retrieving?
- Do the mandatory card rules need adjustment?
- Should any type profiles add or remove upstream hops?

### 6.3 Library Health

Feed constellation data back to Conan's existing grading/diagnosis jobs:

- Cards never retrieved → may be poorly named or disconnected
- Cards with weak wikilinks → Conan's diagnosis job can flag them
- Frequent gaps → Bob's card creation jobs can fill them

---

## Timeline

| Day     | Phase             | Deliverables                                             |
| ------- | ----------------- | -------------------------------------------------------- |
| 1       | Protocol & Schema | Protocol spec, provenance schema                         |
| 1-2     | Subagents         | Conan agent, Bob agent                                   |
| 2-3     | Skill             | Constellation skill, retrieval profiles, traversal guide |
| 3       | Integration       | CLAUDE.md updates                                        |
| 3-4     | Validation        | 5 dry-run scenarios                                      |
| Ongoing | Feedback          | Provenance review, profile tuning                        |

---

## Success Criteria

**Minimum Viable:**

- Conan can assemble a context briefing for any card type using Glob/Grep/Read
- Bob reads the briefing and queries for more context when uncertain
- Provenance logged for all sessions
- CLAUDE.md points to the system

**Full Success:**

- Retrieval profiles validated across all 11 types
- Briefings consistently contain the right cards (4/5+ scenarios)
- Bob asks rather than guesses on ambiguous decisions
- Feedback loop identifies library improvement opportunities
- No MCP server needed at current library scale

---

## Risks & Mitigations

| Risk                                             | Mitigation                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Keyword search misses semantically related cards | Card naming conventions are strict; Grep for multiple terms; wikilinks provide structural paths that bypass keyword limits |
| Retrieval profiles too rigid                     | Profiles are prose instructions, easy to iterate; Conan can use judgment beyond the rules                                  |
| Too many agentic turns for assembly              | Conan reads the retrieval profile once, then executes a focused search pattern — typically 5-10 tool calls                 |
| CONTEXT_BRIEFING.md gets stale mid-session       | Bob can query the library directly; briefing is a starting point, not the only source                                      |
| Provenance logging overhead                      | Append-only JSONL is minimal overhead; logging is optional in fast iterations                                              |

---

## What's Preserved from the Original Plan

- **Constellation Protocol** — Same context package structure (task frame, primary/supporting cards, relationship map, gap manifest)
- **Bob's Inquiry System** — Same 5-signal decision matrix, same uncertainty format, same loop prevention
- **Provenance Logging** — Same schema, file-based instead of MCP-based
- **Type-Based Retrieval** — Same profiles, encoded as instructions instead of computed weights
- **Attention-Optimized Ordering** — Same U-shaped pattern (beginning: task + primary, middle: relationships, end: WHY + anti-patterns)

## What's Changed

| Original                        | Modified                                    | Why                                              |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| MCP server (Python)             | Claude Code native tools                    | ~100 cards don't need a database                 |
| Embedding-based search          | Keyword search (Grep)                       | Strict naming conventions make this sufficient   |
| Computed scoring formula        | Mandatory card rules as prose               | Rules-based > scoring-based at small scale       |
| `search_context_cards` MCP tool | `Grep` + `Glob`                             | Same result, zero infrastructure                 |
| `get_card` MCP tool             | `Read`                                      | Literally the same operation                     |
| `explore_related` MCP tool      | Grep for wikilinks → Read                   | Wikilinks are greppable edges                    |
| `get_constellation` MCP tool    | Conan subagent following skill instructions | Agent judgment > computed pipeline at this scale |
| Weeks of infrastructure         | Days of configuration                       | Ship something, iterate                          |
