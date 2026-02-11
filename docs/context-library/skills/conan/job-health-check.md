# Job 8: Health Check

**Purpose:** Assess quality of existing library. Distinguish upstream gaps from card-level issues.

**Trigger:** Periodic (quarterly), after major source updates, "How healthy is the library?"

Health Check ≠ Grading. Grading scores cards. Health Check diagnoses the system and traces root causes.

## Procedure

Follow build order — upstream before downstream.

### Phase 1: Source Alignment

1. **List current source materials** — SOT, companion docs, brand standards, strategy docs
2. **Compare to library contents:**
   - Cards without source backing? → Orphan or outdated
   - Source content without cards? → Gap
   - Source changed since card created? → Drift risk

**Output:**

```
## Source Alignment

| Status | Count |
|--------|-------|
| Aligned | [n] |
| Drift risk | [n] |
| Orphaned | [n] |
| Source gaps | [n] |
```

### Phase 2: Inventory Reconciliation

1. **Run inventory on current sources** — What SHOULD exist?
2. **Compare to what DOES exist:**
   - Missing cards
   - Unexpected cards (not in source)
   - Misclassified cards

**Output:**

```
## Inventory Status

Expected: [n] | Exists: [n] | Missing: [n] | Unexpected: [n]

Missing by type:
| Type | Count | Examples |
|------|-------|----------|
```

### Phase 3: Standards Health

Spot-check ALL Standards.

| Check         | Pass Criteria                             |
| ------------- | ----------------------------------------- |
| WHAT          | Specifies something concrete              |
| WHY           | Links to ≥1 Principle                     |
| HOW           | Has actual spec (values/rules/thresholds) |
| Anti-examples | Shows what violation looks like           |
| Conformance   | ≥1 product-layer card links to it         |

**Output:**

```
## Standards Health

| Standard | WHAT | WHY | HOW | Anti-ex | Conforming | Verdict |
|----------|------|-----|-----|---------|------------|---------|

Standards without conforming cards: [list]
Standards missing anti-examples: [list]
```

### Phase 4: Strategy/Principle Health

Spot-check ALL Strategy and Principle notes.

| Check         | Pass Criteria                                   |
| ------------- | ----------------------------------------------- |
| WHAT          | Clear statement, not placeholder                |
| WHY           | Reasoning present ("because..."), not assertion |
| Anti-patterns | Shows what violating looks like                 |
| Downstream    | ≥1 downstream card links to it                  |

**Output:**

```
## Strategy/Principle Health

| Card | WHAT | WHY | Anti-patterns | Downstream | Verdict |
|------|------|-----|---------------|------------|---------|

Orphaned (no downstream links): [list]
Missing anti-patterns: [list]
Stub notes (assertion only): [list]
```

### Phase 5: Product Layer Sampling

Full grade on sample of product-layer cards (20% or 10 cards, whichever larger).

Select sample to include:

- Highest-linked (most depended on)
- Recently created
- One from each zone

Apply full rubric including:

- Examples in HOW (≥2)?
- Anti-examples in HOW (≥1)?
- Conformance links where obligated?

**Output:**

```
## Product Layer Sample

| Card | Grade | Top Deficiency |
|------|-------|----------------|

Patterns:
- [n] missing examples
- [n] missing anti-examples
- [n] missing conformance
```

### Phase 6: Cascade Analysis

For weak product-layer cards, trace upstream:

```
Card weak on WHY?
    └─ Check linked Strategy/Principle
        └─ Stub? → Upstream fix
        └─ Substantive? → Card-level fix

Card weak on HOW?
    └─ Check conforming Standard
        └─ Missing? → Standard gap
        └─ Vague? → Standard fix
        └─ Concrete? → Card-level fix
```

**Output:**

```
## Cascade Analysis

Upstream issues (fix these first):
| Upstream Card | Issue | Blast Radius |
|---------------|-------|--------------|

Card-level issues:
| Card | Issue | Fix Type |
|------|-------|----------|
```

## Output

```
# Library Health Check

Date: [date]
Scope: [full library / zone]

## Executive Summary

| Layer | Health | Top Issue |
|-------|--------|-----------|
| Source Alignment | [Good/Drift/Gap] | |
| Standards | [n]/[total] pass | |
| Strategy/Principles | [n]/[total] pass | |
| Product Layer (sampled) | [grade] | |

Overall: [Healthy / Needs Work / Critical]

## Phase 1: Source Alignment
[details]

## Phase 2: Inventory
[details]

## Phase 3: Standards
[details]

## Phase 4: Strategy/Principles
[details]

## Phase 5: Product Layer
[details]

## Phase 6: Cascade Analysis
[details]

## Recommended Fix Order

### Tier 1: Upstream (fix first)
| Card | Issue | Blast Radius |
|------|-------|--------------|

### Tier 2: Standards gaps
| Standard | Issue |
|----------|-------|

### Tier 3: Card-level
| Card | Issue |
|------|-------|

## Flags
- HUMAN JUDGMENT NEEDED: [items]
- SOURCE GAP: [items needing human input]
```

## Health Levels

| Level      | Definition                                                                           |
| ---------- | ------------------------------------------------------------------------------------ |
| Healthy    | >80% Standards pass, >80% Strategy/Principles pass, Product layer sample averages B+ |
| Needs Work | 60-80% pass rates, or Product layer sample averages B- to C+                         |
| Critical   | <60% pass rates, or Product layer sample below C                                     |

## Principles

- Upstream before downstream — always
- Distinguish root causes from symptoms
- Standards and Strategy gaps hurt most — prioritize finding them
- Sample product-layer cards strategically — high-link cards reveal more
- Anti-patterns gaps are fixable — flag but don't panic
