# Job 1: Inventory

**Purpose:** Manifest of expected cards with types and sources. Baseline for completeness scoring.

**Trigger:** New zone, source material updated, reassessment requested.

## Procedure

1. **Identify zone boundary** — Which source sections map to this zone?

2. **Extract entities** — List everything that should have a card.

3. **Classify each entity** — Apply Type Taxonomy (see Conan-Skill). Document rationale.

4. **Identify Standards** — Source has specification content?
   - Tables of values (colors, thresholds, formulas) → Standard
   - Rules multiple cards must follow → Standard
   - Testable constraints → Standard

5. **Check enumerations** — Source lists types/modes/kinds with distinct behaviors?
   - Would agent need different context for each? → Separate cards
   - Same pattern, different domains? → Single card with reference data

6. **Assess granularity** — One card or hub + spokes?
   - Hub/spoke signals: multiple subsections, distinct workflows, different ecosystem relationships

7. **Cross-reference existing** — Expected but missing? Exists but unexpected? Misclassified?

8. **Note source references** — Where does builder look for each card?

9. **Determine build order** — Sequence for Bob to build:
   - Standards first (they constrain everything)
   - Strategy/Principles next (WHY upstream)
   - Systems next (cross-cutting mechanisms)
   - Zones/Rooms (most-depended-on first)
   - Overlays, Structures, Artifacts, Capabilities
   - Components last (implementation details)
   - Agents + Prompts

## Output

```
# Zone Inventory: [Name]

Source: [sections]
Date: [date]

## Expected Cards

### Standards ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Strategy/Principles ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Systems ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Zones ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Rooms ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Overlays ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Structures ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Components ([count])
| Card | Parent | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Artifacts ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Capabilities ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Agents ([count])
| Card | Source | Status | Classification Rationale |
|------|--------|--------|-------------------------|

### Prompts ([count])
| Card | Agent | Status | Classification Rationale |
|------|-------|--------|-------------------------|

## Enumeration Decisions
| Entity | Types Found | Decision | Rationale |
|--------|-------------|----------|-----------|

## Conformance Map
| Standard | Constrains |
|----------|------------|

## Build Order

Build in this sequence (most-depended-on first):

### Phase 1: Standards
| Order | Card | Rationale |
|-------|------|-----------|

### Phase 2: Strategy/Principles
| Order | Card | Rationale |
|-------|------|-----------|

### Phase 3: Systems
| Order | Card | Rationale |
|-------|------|-----------|

### Phase 4: Zones/Rooms (by dependency)
| Order | Card | Depends On | Rationale |
|-------|------|------------|-----------|

### Phase 5: Overlays/Structures/Artifacts/Capabilities
| Order | Card | Depends On | Rationale |
|-------|------|------------|-----------|

### Phase 6: Components
| Order | Card | Parent |
|-------|------|--------|

### Phase 7: Agents/Prompts
| Order | Card | Depends On | Rationale |
|-------|------|------------|-----------|

## Summary
- Expected: [n]
- Existing: [n] ([%])
- Missing: [n]
- Misclassified: [n]

## Flags
- HUMAN JUDGMENT NEEDED: [items]
- AUDIT RECOMMENDED: [items]
```
