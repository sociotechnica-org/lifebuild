# Job 7: Surgery

**Purpose:** Produce actionable project plans for builder agents to execute library fixes.

**Trigger:** After Diagnose or Audit identifies fixes, human approves scope.

Surgery ≠ Recommend. Recommend prioritizes options for human decision. Surgery produces execution plans after decisions are made.

## Procedure

1. **Confirm scope** — Human has approved which cards to fix and how.

2. **Generate plan** — Apply 6-phase protocol:
   - Phase 1: Inventory backlinks
   - Phase 2: Create replacements
   - Phase 3: Delete old cards
   - Phase 4: Update backlinks
   - Phase 5: Validate
   - Phase 6: Review

3. **Flag judgment calls** — Mark ambiguous decisions for human resolution.

4. **Deliver plan** — Output complete project plan for builder agent.

## The 6-Phase Protocol

### Phase 1: Inventory Backlinks

Search library for all references to cards being modified. Record every backlink. For scope edits, identify specific phrases to relocate.

### Phase 2: Create Replacements

Write complete replacement cards before any deletions. For edits, specify exact changes with before/after.

### Phase 3: Delete Old Cards

Only after Phase 2 complete. Never delete before replacement exists.

### Phase 4: Update Backlinks

Transform old references to new. Some require judgment — flag with decision tables.

### Phase 5: Validate

- Search for old link text — should return zero
- Verify symmetry — if A links B, B links A
- Confirm relocated content exists
- Check for stub references

### Phase 6: Review

Conan re-grades affected cards and confirms surgery success.

## Output

```
# Library Surgery: [Scope]

## Overview
| Card | Current Type | New Type | Action |

**Total work:** Delete X, Create X, Edit X, Relink ~X

## Phase 1-6
[tasks per phase]

## Summary Checklist
| Phase | Tasks | Est. Time |
```

## Plan Quality Criteria

| Criterion    | Requirement                            |
| ------------ | -------------------------------------- |
| Completeness | Every affected card addressed          |
| Sequence     | Create before delete                   |
| Specificity  | Full file paths, complete card content |
| Validation   | Explicit checks for broken links       |
| Closure      | Review tasks to confirm success        |

## Integration

| From             | To             | Handoff                          |
| ---------------- | -------------- | -------------------------------- |
| Job 4: Recommend | Job 7: Surgery | Human approves recommendations   |
| Job 6: Audit     | Job 7: Surgery | Human approves reclassifications |
| Job 7: Surgery   | Builder Agent  | Project plan delivered           |
| Builder Agent    | Job 5: Review  | Completed work returned          |

## Principles

- Never produce plans that delete before replacement exists
- Include time estimates per phase
- Flag deferred items with blockers
- Plans must be self-contained — builder agent has no prior context
