---
title:
type: component
ca-when: present | planned | future

ca-where:
  zone: "[[zone-name]]"
  parent-feature: "[[feature-name]]"
  dependencies:
    - "[[system-or-component]]"

# Components inherit WHY from parent feature
# Only add rationale if there's component-specific reasoning
ca-why:
  rationale: null | "Component-specific design decision"

code-location: null | "src/components/path/to/file.tsx"
last-verified: YYYY-MM-DD
---

# [Component Name]

<!-- One paragraph: what this component is and what it renders/does. -->

---

## Purpose

<!-- Why does this component exist separately from its parent feature? -->

---

## Implementation

### Location
<!-- Where in the UI does this appear? -->

### Visual Treatment
<!-- Colors, animations, states -->

| Property | Value |
|----------|-------|
| ... | ... |

### Content Display
<!-- What information does it show? -->

### Interaction
<!-- How do users interact with it? -->

---

## Related Components

**Siblings:** (other components of same parent feature)
- [[component]] — relationship

**Uses:**
- [[component]] — how it uses this

---

## Dependencies

**Requires:**
- [[system-or-component]] — what this needs

---

## Technical Constraints

<!-- Implementation limits, performance considerations -->

---

## Testing Notes

<!-- Key scenarios to cover -->

---

## Open Questions

- [ ] Question
