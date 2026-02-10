# Job 6: Audit

**Purpose:** Verify correct typing. Detect atomicity violations. Check conformance.

**Trigger:** After library build, grading flags AUDIT SIGNALs, periodic, after new Standards created.

Audit ≠ Grading. Card can score A and still fail audit if misclassified.

## Procedure

1. **Select scope** — By type, zone, or full library.

2. **Apply decision tree to each card** (see Conan-Skill Type Taxonomy)
   ```
   Card: [Name]
   Step 1: WHY question? → Strategy/Principle/Standard
   Step 2: WHAT + Directors interact?
     - Navigate TO it? Top-level → Zone. Nested → Room.
     - Persistent across zones? → Overlay
     - Interact WITHIN? Spatial → Structure. Widget → Component.
       Content object → Artifact. Action/workflow → Capability.
     - Core data entity → Primitive
   Step 3: Invisible infrastructure? → System
   Step 4: AI team member? → Agent (implementation → Prompt)
   Step 5: Temporal? → Learning/Decision/Future
   Step 6: Shipping? → Initiative/Release
   Result: [type]
   Claimed: [type]
   Verdict: [PASS/MISCLASSIFIED]
   ```

3. **Check System vs Standard** — For cards typed as System:
   ```
   - Has runtime state? [yes/no]
   - Processes inputs? [yes/no]
   - Other things conform to it? [yes/no]
   No state + no processing + things conform → should be Standard
   ```

4. **Check conformance** — For product-layer cards (Rooms, Overlays, Structures, Components, Artifacts, Capabilities, Agents):
   ```
   Card: [Name]
   Governed domains touched:
   - Visual rendering? → needs Standard - Visual Language
   - Priority ordering? → needs Standard - Priority Score
   - Stream classification? → needs Standard - Three-Stream Portfolio
   - Project states? → needs Standard - Project States
   [See Library Reference for full list]
   
   Required: [list]
   Present: [list]
   Missing: [list]
   Verdict: [PASS/CONFORMANCE GAP]
   ```

5. **Check enumeration patterns** — Table in HOW with types/modes?
   - Would agent need different context for each? → separate cards

6. **Check atomicity** — Card answers multiple distinct questions?
   - Could remove section and still have complete card? → split
   - Different tasks need different portions? → split
   - 700+ words → signal to check

7. **Classify severity**
   | Severity | Definition | Action |
   |----------|------------|--------|
   | SEVERE | Wrong type | Must fix |
   | MODERATE | Atomicity violation, conformance gap | Evaluate |
   | LOW | Minor language, type correct | Optional |

8. **Produce fix recommendations**

## Violation Patterns

| Pattern | Signal | Detection |
|---------|--------|-----------|
| Layer Conflation | Wrong-layer language | Decision tree |
| System/Standard Confusion | Spec in System, or System with no state | System vs Standard test |
| Conformance Gap | Product-layer card touches governed domain, no Standard link | Conformance check |
| Enumerated Instances | HOW table with behavioral types | Context needed per type? |
| Atomicity Violation | Multiple distinct questions | Could sections stand alone? |

## Output

```
# Audit: [Scope]

Cards audited: [n]

## Summary
| Severity | Count | % |
|----------|-------|---|

## SEVERE Violations

### 1. [Card]
Claimed: [type] → Actual: [type]
Evidence: [bullets]
Decomposition: [new structure]
Relink count: [n]

## MODERATE Violations

### Conformance Gaps
| Card | Touches Domain | Missing Standard |
|------|---------------|------------------|

### Atomicity Violations
| Card | Issue | Recommendation |
|------|-------|----------------|

## Passed ([n])
[list]

## Fix Order
| Priority | Card | Issue Type | Blast Radius | Effort |
|----------|------|------------|--------------|--------|
```

## Principles

- Apply tree explicitly, don't intuit
- Language is evidence
- System vs Standard is most common misclassification
- Conformance is structural integrity, not optional
- Decomposition is expensive — only when concepts genuinely distinct
