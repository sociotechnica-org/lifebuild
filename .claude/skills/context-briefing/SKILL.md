# Context Briefing Skill

Assemble context from the Context Library for implementation tasks.

---

## When to Use

Use this skill when implementing features, fixing bugs, or making changes that touch product concepts described in the Context Library — rooms, agents, capabilities, systems, primitives, etc.

**Do not use** for pure infrastructure tasks (CI/CD, dependency updates, tooling) that don't touch product-layer concepts.

## The Context Library

Location: `docs/context-library/`

~100 markdown cards organized by type:

| Layer     | Folder                   | Types                        |
| --------- | ------------------------ | ---------------------------- |
| Rationale | `/rationale/strategies/` | Strategy (3)                 |
| Rationale | `/rationale/principles/` | Principle (15)               |
| Rationale | `/rationale/standards/`  | Standard (16)                |
| Product   | `/product/zones/`        | Zone (3)                     |
| Product   | `/product/rooms/`        | Room (7)                     |
| Product   | `/product/overlays/`     | Overlay (1)                  |
| Product   | `/product/structures/`   | Structure (2)                |
| Product   | `/product/components/`   | Component (5)                |
| Product   | `/product/artifacts/`    | Artifact (2)                 |
| Product   | `/product/capabilities/` | Capability (7)               |
| Product   | `/product/primitives/`   | Primitive (3)                |
| Product   | `/product/systems/`      | System (15)                  |
| Product   | `/product/agents/`       | Agent (14)                   |
| Temporal  | `/temporal/`             | Decision, Initiative, Future |

## Card Anatomy

Every card has 5 dimensions:

- **WHAT** — Standalone definition
- **WHERE** — Ecosystem relationships via `[[wikilinks]]`
- **WHY** — Strategic rationale (links to Strategies/Principles)
- **WHEN** — Build phase, implementation status, reality notes
- **HOW** — Implementation guidance, examples, anti-patterns

## How the Graph Works

The library IS a knowledge graph encoded in the file system:

- **Folder paths** = type taxonomy
- **File names** = card identifiers (e.g., `System - Bronze Stack.md`)
- **`[[wikilinks]]`** = relationship edges with context phrases
- **Card headers** = dimension boundaries (`## WHAT:`, `## WHY:`, etc.)

### Navigating the graph

| Need                          | Technique                                                    |
| ----------------------------- | ------------------------------------------------------------ |
| Find a card by name           | `Glob` for `docs/context-library/**/[Type] - [Name].md`      |
| Find cards about a topic      | `Grep` for topic terms across `docs/context-library/`        |
| Find a card's relationships   | Read the card, extract its `[[wikilinks]]`                   |
| Find cards referencing a card | `Grep` for `[[Card Name]]` across the library                |
| Search within a dimension     | `Grep` for content under `## WHY:` or `## HOW:` headers      |
| Check implementation status   | Read the card's WHEN section                                 |
| Find known divergences        | Read WHEN sections (Reality + Implications) on related cards |

## Assembly Process

See `retrieval-profiles.md` for type-specific instructions.
See `traversal.md` for detailed graph navigation techniques.
See `task-modifiers.md` for how task type affects retrieval emphasis.
See `protocol.md` for the CONTEXT_BRIEFING.md format.

## Quick Reference: Upstream Chain

```
Strategy (WHY we care)
    ↓ generates
Principle (judgment guidance)
    ↓ implemented by
Standard (testable specification)
    ↓ constrains
Product layer (Zones, Rooms, Components, etc.)
    ↑ powered by
System (invisible mechanism)
    ↑ operates on
Primitive (core data entity)
    ↑ supported by
Agent (AI team member)
```

Every product-layer card should trace back to at least one Strategy via its WHY chain. If it can't, that's a gap worth noting.
