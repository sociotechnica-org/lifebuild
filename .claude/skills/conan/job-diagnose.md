# Job 3: Diagnose

**Purpose:** Trace root causes. Calculate blast radius. Distinguish symptoms from causes.

**Trigger:** After grading (if zone < B), or "Why is [zone] scoring poorly?"

## Procedure

1. **Identify weakness clusters**
   - Section-based: Multiple cards weak in same section
   - Upstream-based: Multiple cards link to same weak note
   - Structural: Missing cards in same area
   - Conformance-based: Multiple cards missing same Standard link

2. **Trace backward through links**
   - WHY weakness → Check linked strategy/principle notes. Substantive or stubs?
   - WHERE weakness → Naked links? Missing links? Missing conformance?
   - HOW weakness → Downstream card notes missing? Source material thin?
   - WHAT weakness → Usually per-card, but check for shared unclear terminology

3. **Identify root causes**

   | Type              | Description                                           |
   | ----------------- | ----------------------------------------------------- |
   | Missing Note      | Should exist, doesn't                                 |
   | Stub Note         | Exists but too thin                                   |
   | Disconnected Note | Exists, substantive, but not linked                   |
   | Quality Gap       | Per-card issue, no upstream cause                     |
   | Structural Gap    | Cluster of missing cards                              |
   | Conformance Gap   | Standard exists, product-layer cards don't link to it |
   | Source Gap        | Source material doesn't contain needed info           |

4. **Calculate blast radius** — How many cards improve if this root cause is fixed?

5. **Distinguish fix types**
   - Upstream fix: Multiple cards share weakness pointing to same note
   - Card-level fix: Unique to this card, or card doesn't use upstream well
   - Conformance fix: Add links to existing Standard (low effort, high count)

## Output

```
# Diagnosis: [Scope]

Triggered by: [grading results]

## Root Causes (by blast radius)

### 1. [Type]: [Description]
Blast radius: [n] cards
Current state: [what's wrong]
Cards affected:
| Card | Current | Projected |
|------|---------|-----------|
Fix type: [upstream/card-level/conformance]
Effort: [low/medium/high]

## Card-Level Issues
| Card | Section | Issue | Fix |
|------|---------|-------|-----|

## Conformance Gaps
| Standard | Missing From |
|----------|--------------|

## Cascade Map
```

[Upstream note] ───┬──→ [Card 1]
├──→ [Card 2]
└──→ [Card 3]

```

## Source Gaps (need human input)
| Gap | What's Missing | Affects |
|-----|---------------|---------|

## Flags
- HUMAN JUDGMENT NEEDED: [items]
- SOURCE GAP: [items]
```
