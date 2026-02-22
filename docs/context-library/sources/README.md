# Sources

Snapshot documents that informed the creation of Context Library cards. These are **provenance, not product truth** — the atomic cards in `/product/`, `/rationale/`, and `/experience/` are the canonical source of truth.

---

## Conventions

### What goes here

- Design documents (GDDs, briefs, specs) that seeded multiple cards
- Strategic memos or research notes that informed rationale cards
- External reference material archived for durability (links die)

### What does NOT go here

- Atomic cards (those go in their typed folders)
- Code documentation (that goes in CONVENTIONS.md or CLAUDE.md)
- Release plans (those go in `/releases/`)
- Temporal records like Decisions, Initiatives, Futures (those go in `/temporal/`)

### Rules

1. **Sources are frozen.** Once archived here, they are never edited. If the vision evolves, update the downstream cards — not the source.
2. **Cards never link to sources.** The knowledge graph flows between atomic cards. No `[[GDD-v0.2]]` wikilinks in card bodies.
3. **Sources link to cards.** Each source should include a provenance index listing which cards it informed. This makes error-checking directional: start from the source, check downstream cards.
4. **Agents do not search sources.** Retrieval profiles and agent traversal explicitly skip `sources/`. Agents work with cards. Humans (and Conan in audit mode) use sources for drift detection.
5. **Include a snapshot date.** Every source file should note when it was captured or last represented the team's thinking.

### Naming

No type prefix. Use the document's natural name:

```
sources/
├── README.md
├── GDD-v0.2.md
├── [future-research-note].md
└── [future-strategic-memo].md
```

---

## Current Sources

| Document | Snapshot Date | Scope                                         |
| -------- | ------------- | --------------------------------------------- |
| GDD-v0.2 | 2025-12       | Full game design — informed nearly every card |
| automation-strategy-conversation-2026-02-17 | 2026-02-17 | Factory & library automation strategy — task catalog, cost tiers, role bundles |
