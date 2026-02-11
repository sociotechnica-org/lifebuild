# Job 0: Source Assessment

**Purpose:** Audit source material quality BEFORE inventory. Identify gaps that will cascade into weak cards.

**Trigger:** Before building a new zone, or when source material is updated.

Source Assessment → Inventory → Build. This job gates inventory.

## Procedure

1. **Identify source material** — SOT sections, companion docs, brand standards, decision records for this zone.

2. **Assess coverage by dimension**

   For each dimension, scan source for:

   | Dimension | Looking For                                                             |
   | --------- | ----------------------------------------------------------------------- |
   | WHAT      | Clear definitions, card boundaries, user-facing descriptions            |
   | WHY       | Strategy rationale, decision history, constraints/tensions, "why not X" |
   | WHERE     | Ecosystem references, dependencies mentioned, cross-zone connections    |
   | HOW       | Behavior specs, technical approach, examples, edge cases                |
   | WHEN      | Timeline references, predecessors, future state                         |

3. **Check for Standard candidates**

   Flag specification content:
   - Tables of values (colors, sizes, thresholds, formulas)
   - "Must be" / "should always" / "never" language
   - Rules multiple cards reference
   - Testable constraints

4. **Check for anti-pattern content**

   Does source material include:
   - What NOT to do?
   - Past mistakes or lessons?
   - Explicit constraints or boundaries?
   - "Don't confuse X with Y"?

5. **Identify source gaps**

   | Gap Type       | Signal                                        |
   | -------------- | --------------------------------------------- |
   | WHY Gap        | Product cards described but rationale missing |
   | HOW Gap        | What it does but not how it works             |
   | Constraint Gap | No boundaries or anti-patterns documented     |
   | Standard Gap   | Spec content buried in prose, not extracted   |
   | Decision Gap   | Choices made but alternatives not documented  |

6. **Classify readiness**

   | Readiness | Definition                                    | Action                          |
   | --------- | --------------------------------------------- | ------------------------------- |
   | READY     | All dimensions covered, Standards extractable | Proceed to inventory            |
   | GAPS      | Some dimensions thin, addressable             | Flag gaps, proceed with caution |
   | BLOCKED   | Critical gaps requiring human input           | Do not proceed until resolved   |

## Output

```
# Source Assessment: [Zone]

Source material reviewed:
- [doc 1]
- [doc 2]

## Coverage by Dimension

| Dimension | Coverage | Notes |
|-----------|----------|-------|
| WHAT | [High/Med/Low] | [specific observations] |
| WHY | [High/Med/Low] | [specific observations] |
| WHERE | [High/Med/Low] | [specific observations] |
| HOW | [High/Med/Low] | [specific observations] |
| WHEN | [High/Med/Low] | [specific observations] |

## Standard Candidates

| Content | Source Location | Extraction Notes |
|---------|-----------------|------------------|
| [spec content] | [section] | [ready/needs cleanup] |

## Anti-Pattern Content

| Found | Location |
|-------|----------|
| [anti-pattern/constraint/boundary] | [section] |

(or: No anti-pattern content found. **Recommend human input.**)

## Source Gaps

### Critical (Blocks Build)
- [gap]: [what's missing, why it matters]

### Addressable (Proceed with Caution)
- [gap]: [what's missing, mitigation]

### Nice to Have
- [gap]: [would improve quality]

## Readiness: [READY / GAPS / BLOCKED]

[If GAPS or BLOCKED: specific items needed from human before proceeding]
```

## Gap Patterns

| Pattern              | Typical Signal                          | Typical Fix                              |
| -------------------- | --------------------------------------- | ---------------------------------------- |
| Strategy Orphan      | Product cards exist but no strategy doc | Human provides strategy rationale        |
| Spec Buried in Prose | "Colors should be consistent with..."   | Extract to Standard card                 |
| Decision Amnesia     | Card exists but no "why this approach"  | Human documents decision history         |
| Anti-Pattern Void    | Only positive descriptions              | Human provides "what wrong looks like"   |
| HOW Handwave         | "The system handles this"               | Human provides behavior spec or examples |

## Principles

- Run BEFORE inventory, not after
- WHY and HOW gaps hurt most — prioritize surfacing these
- Anti-pattern absence is itself a gap worth flagging
- Standard candidates are high-value extraction — don't miss them
- Some gaps are acceptable for Vision Capture phase — note but don't block
