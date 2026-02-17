# Task-Type Modifiers

How the type of task affects which dimensions to prioritize during context assembly.

---

## Feature Addition

**What you're doing:** Adding new functionality to an existing card/concept.

**Dimension emphasis:**

- **WHERE** (high) — Understand all the connections. A new feature touches existing relationships. What else uses this? What depends on it?
- **HOW** (high) — Need implementation patterns and anti-patterns from existing cards. What does "following this looks like"?
- **WHY** (normal) — Rationale matters but is usually stable for feature additions.
- **WHEN** (normal) — Check implementation status of related cards.

**Retrieval adjustment:** Expand lateral scope. Features often touch adjacent cards that the base profile might skip. `Grep` broadly for the feature's key terms.

---

## Bug Fix

**What you're doing:** Fixing something that doesn't match expected behavior.

**Dimension emphasis:**

- **HOW** (high) — What SHOULD be happening? Read HOW sections carefully for expected behavior.
- **WHEN** (very high) — What changed recently? Reality notes may explain the divergence. Check WHEN sections (Reality + Implications) on related cards for known gaps.
- **WHERE** (normal) — Understand connections but don't over-expand.
- **WHY** (normal) — Unless the bug is a design misalignment, in which case WHY becomes critical.

**Retrieval adjustment:** Prioritize temporal context. Read WHEN sections (Reality + Implications) of all related cards for known vision-vs-reality divergences that might explain the bug.

---

## Refactoring

**What you're doing:** Changing structure without changing behavior.

**Dimension emphasis:**

- **WHY** (very high) — You MUST understand the rationale before restructuring. Refactoring that preserves behavior but breaks strategic alignment is worse than the original.
- **WHERE** (high) — Understand the full blast radius. What references what you're changing?
- **HOW** (low) — You're changing the HOW, so current HOW is less useful.
- **WHEN** (normal) — Stability markers help — don't refactor evolving cards.

**Retrieval adjustment:** Expand upstream. Follow the full WHY chain to Strategy level. Read anti-patterns carefully — "What Breaks This" lists are especially relevant during refactoring.

---

## New Component (Creating Something New)

**What you're doing:** Building a card/concept that doesn't yet exist in the codebase.

**Dimension emphasis:**

- **WHY** (high) — Strategic alignment is critical for new things. Why does this need to exist?
- **HOW** (high) — Look at sibling cards for implementation patterns. How were similar things built?
- **WHERE** (normal) — Understand where this fits in the graph.
- **WHEN** (normal) — Check if related cards are implemented (you may be building on vision, not reality).

**Retrieval adjustment:** Look for sibling cards of the same type. If building a new System, read 2-3 existing System cards to understand the pattern. Check WHEN sections on related cards for reality notes about gaps — the gap itself is context.

---

## Architecture Change

**What you're doing:** Changing fundamental structure, patterns, or contracts.

**Dimension emphasis:**

- **WHY** (very high) — Every architectural decision must trace to strategic rationale. Missing WHY = risk of misalignment.
- **WHERE** (very high) — Full blast radius assessment. Everything connected to what you're changing.
- **WHEN** (high) — Stability matters. Don't change stable foundations without strong justification. Check what's evolving vs settled.
- **HOW** (normal) — Current implementation matters less since you're changing it.

**Retrieval adjustment:** Maximum upstream and lateral expansion. Use the full 3-hop depth. Read ALL related Strategies and Principles. Assess blast radius by `Grep`-ing for the concept name across the entire library — every match is something potentially affected.

---

## Quick Reference

| Task Type    | Primary Dimensions  | Retrieval Width      | Upstream Depth        |
| ------------ | ------------------- | -------------------- | --------------------- |
| Feature      | WHERE, HOW          | Broad lateral        | Profile default       |
| Bug fix      | HOW, WHEN           | Narrow + temporal    | Profile default       |
| Refactor     | WHY, WHERE          | Broad + blast radius | Maximum (to Strategy) |
| New          | WHY, HOW + siblings | Medium + patterns    | Profile default       |
| Architecture | WHY, WHERE, WHEN    | Maximum              | Maximum (to Strategy) |
