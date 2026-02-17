# Graph Traversal Guide

How to navigate the Context Library's knowledge graph using Claude Code's native tools.

---

## The Library as a Graph

| Graph Concept | File System Equivalent                         |
| ------------- | ---------------------------------------------- |
| Node          | A card (markdown file)                         |
| Node type     | Folder path (`product/systems/` → System type) |
| Edge          | A `[[wikilink]]` inside a card                 |
| Edge label    | The context phrase after the wikilink          |
| Node ID       | File name (e.g., `System - Bronze Stack`)      |

---

## Finding Cards

### By name (exact)

```
Glob: docs/context-library/**/System - Bronze Stack.md
```

### By type (all cards of a type)

```
Glob: docs/context-library/product/systems/*.md
Glob: docs/context-library/rationale/principles/*.md
Glob: docs/context-library/experience/loops/*.md
Glob: docs/context-library/experience/dynamics/*.md
```

### By topic (keyword search)

```
Grep: pattern="priority queue" path="docs/context-library/"
```

Search tips:

- Use the concept name, not the file name prefix
- Try multiple terms: "priority" then "queue" then "planning queue"
- Card names use strict conventions — if you know the type, search within that folder
- **Skip `sources/`** — source documents are frozen provenance, not cards. If a topic search returns hits in `sources/`, ignore them during context assembly. Only Conan in audit mode reads sources.

### By dimension (content within a section)

To find cards with specific WHY content:

```
Grep: pattern="Spatial Visibility" path="docs/context-library/"
```

This finds all cards that reference the Spatial Visibility strategy in any section.

To narrow to a specific dimension header:

```
Grep: pattern="## WHY" path="docs/context-library/product/systems/" -A 10
```

Then scan the results for the concept you need.

---

## Following Edges (Wikilinks)

### Forward edges: from a card to its references

1. Read the card
2. Look for all `[[Type - Name]]` patterns
3. Each wikilink has a context phrase explaining the relationship:
   ```
   - [[System - Bronze Stack]] — powers the Bronze maintenance layer
   ```
4. To follow the edge, find the referenced card:
   ```
   Glob: docs/context-library/**/System - Bronze Stack.md
   ```

### Reverse edges: from other cards to this card

Find all cards that link TO a given card:

```
Grep: pattern="Bronze Stack" path="docs/context-library/"
```

This surfaces every card that references Bronze Stack, revealing reverse relationships.

### Edge types from context phrases

Common patterns in wikilink context phrases:

| Phrase Pattern                        | Relationship Type    |
| ------------------------------------- | -------------------- |
| "powers," "enables," "provides"       | depends-on (reverse) |
| "constrained by," "must conform to"   | constrained-by       |
| "lives within," "contained by"        | contained-by         |
| "performs," "invokes," "triggers"     | invokes              |
| "implements," "realizes"              | implements           |
| "coordinates with," "works alongside" | coordinates-with     |
| "operates on," "manages," "edits"     | operates-on          |

---

## Traversal Patterns

### WHY chain (upstream)

Follow the rationale hierarchy from a product card to its strategic foundation.

```
1. Read the product card's WHY section
2. Find [[Principle - ...]] links → Read those Principles
3. In each Principle's WHY section, find [[Strategy - ...]] links → Read those Strategies
4. Strategy is the top — stop here
```

**Depth:** Usually 2-3 hops (Card → Principle → Strategy).

**Why this matters:** The WHY chain explains design intent. Without it, a builder can implement the WHAT correctly but violate the WHY.

### Containment chain (upward)

Follow the spatial hierarchy from a leaf element to its workspace.

```
1. Read the card's WHERE section
2. Find the "lives within" or "contained by" link → Read the parent
3. Parent Room → find its Zone
4. Zone is the top
```

**Pattern:** Component → Structure → Room → Zone

### Dependency chain (lateral)

Follow what a card depends on and what depends on it.

```
1. Read the card — note all [[wikilinks]]
2. For each linked card, categorize the relationship:
   - Things this card NEEDS (inputs, dependencies)
   - Things that NEED this card (dependents, consumers)
3. For critical dependencies, read those cards too
```

### Blast radius assessment

Find everything affected by changing a card:

```
1. Grep for the card name across the entire library
2. Every match is a card that references this one
3. Count and categorize: how many Rooms? Capabilities? Standards?
4. High count = large blast radius = include more context
```

---

## Practical Examples

### Example: Assembling context for "Add a status filter to the Kanban Board"

**Target type:** Structure (Kanban Board)
**Task type:** Feature addition

1. **Seed:** `Glob` for `**/Structure - Kanban Board.md` → Read it
2. **Parent:** WHERE section shows `[[Room - Project Board]]` → Read it
3. **Standards:** WHERE section shows conforming Standards → Read those
4. **Components:** `Grep` for "Kanban" across `product/components/` → Read matches
5. **Primitives:** Card mentions `[[Primitive - Task]]` → Read it (task statuses are the filter values)
6. **WHY chain:** WHY section links to a Principle → Read it → follow to Strategy
7. **WHEN check:** Read WHEN sections of related cards for reality notes and divergences

**Result:** ~8 cards covering the Structure, its Room, conforming Standards, displayed Primitive, and strategic rationale.

### Example: Assembling context for "Implement the System primitive"

**Target type:** Primitive (System)
**Task type:** New component (creating something that doesn't exist)

1. **Seed:** `Glob` for `**/Primitive - System.md` → Read it
2. **WHEN check:** Reality note says "Not started" — this is vision, not reality
3. **Rooms:** `Grep` for "System" across `product/rooms/` → finds Room - System Board
4. **Capabilities:** `Grep` for "System" across `product/capabilities/` → finds Capability - System Actions
5. **Systems:** `Grep` for "System" across `product/systems/` → finds multiple
6. **WHEN check:** Read WHEN sections of related cards for reality notes and implications
7. **WHY chain:** Follow upstream to Strategy/Principle
8. **Standards:** Check what Standards define System properties

**Result:** ~12 cards covering the Primitive, its associated Room and Capabilities, gap analysis from WHEN sections, and the strategic rationale for why Systems matter.
