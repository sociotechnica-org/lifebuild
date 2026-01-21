---
title: Component Name
type: component
ca-when: present # past | present | planned | future

ca-where:
  zone: '[[parent-zone]]'
  parent-feature: '[[parent-feature]]'
  dependencies:
    - '[[other-component]] — what this component needs'
  dependents:
    - '[[other-component]] — what relies on this component'

ca-why:
  rationale: 'Why this component exists as a distinct implementation unit'

# Technical coordinates (for code mapping)
code-location: 'src/components/path/to/component' # or null if not yet implemented

last-verified: YYYY-MM-DD
---

# Component Name

One-paragraph technical summary: what this component does in the implementation.

---

## Purpose

What problem does this component solve? What would break or be missing without it?

---

## Implementation

### Location

```
src/components/path/to/component
```

### Key Files

- `file-one.ts` — purpose
- `file-two.ts` — purpose

### Key Functions/Methods

- `functionName()` — what it does
- `otherFunction()` — what it does

---

## Data Flow

What data comes in? What goes out? What state does it manage?

```
Input → Processing → Output
```

---

## Dependencies

### Uses:

- [[other-component]] — how it's used

### Used by:

- [[parent-feature]] — how this component serves the feature

---

## Technical Constraints

- Constraint one (performance, compatibility, etc.)
- Constraint two

---

## Testing Notes

How should this component be tested? Key scenarios to cover:

- Scenario one
- Scenario two

---

## Open Questions

- [ ] Any unresolved technical questions
