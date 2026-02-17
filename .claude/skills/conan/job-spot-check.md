# Job 2.5: Spot-Check

**Purpose:** Verify upstream cards (Standards, Strategy, Principles) before dependent product-layer cards are built.

**Trigger:** After Sam builds Standards or Strategy/Principle notes, before building product-layer cards (Rooms, Overlays, Structures, etc.).

Spot-Check gates product-layer builds. Catches upstream gaps before they cascade.

## Procedure

1. **Identify cards to check**
   - All Standards just built
   - All Strategy notes just built or enriched
   - All Principle notes just built or enriched

2. **Apply abbreviated rubric**

   Standards:
   | Check | Pass Criteria |
   |-------|---------------|
   | WHAT | Specifies something concrete, not vague guidance |
   | WHY | Links to ≥1 Principle with explanation |
   | HOW | Contains actual spec (values, rules, thresholds) |
   | Anti-example | Includes what violation looks like |

   Strategy/Principle:
   | Check | Pass Criteria |
   |-------|---------------|
   | WHAT | Clear statement, not placeholder |
   | WHY | Reasoning present, not just assertion |
   | Anti-pattern | Includes what violating this looks like |

3. **Classify results**

   | Result   | Definition       | Action                         |
   | -------- | ---------------- | ------------------------------ |
   | PASS     | All checks pass  | Proceed to product-layer build |
   | FIX      | Minor gaps       | Sam fixes before proceeding    |
   | ESCALATE | Substantive gaps | Human input needed             |

4. **Flag cascade risk**

   For each failing card, note:
   - How many product-layer cards will link to this?
   - What dimension will be weakened?

## Output

```
# Spot-Check: [Scope]

Cards checked: [n]

## Standards

| Card | WHAT | WHY | HOW | Anti-ex | Verdict |
|------|------|-----|-----|---------|---------|
| [name] | ✓/✗ | ✓/✗ | ✓/✗ | ✓/✗ | PASS/FIX/ESCALATE |

## Strategy/Principles

| Card | WHAT | WHY | Anti-pattern | Verdict |
|------|------|-----|--------------|---------|
| [name] | ✓/✗ | ✓/✗ | ✓/✗ | PASS/FIX/ESCALATE |

## Fixes Required

| Card | Issue | Cascade Risk |
|------|-------|--------------|
| [name] | [what's wrong] | [n downstream cards affected] |

## Gate: [PROCEED / FIX FIRST / ESCALATE]

[If FIX FIRST: Sam addresses issues before product-layer build]
[If ESCALATE: specific items for human]
```

## Abbreviated Rubrics

**Standard - HOW Check:**

- Contains table, list, or explicit values? → Pass
- Vague guidance only? → Fail

**Strategy - WHY Check:**

- Explains reasoning ("because...", "we believe...")? → Pass
- Just asserts ("X is important")? → Fail

**Anti-pattern Check:**

- Includes concrete wrong example? → Pass
- No negative guidance? → Fail (note: FIX, not ESCALATE)

## Principles

- Fast, not thorough — full grading comes later
- Focus on what will cascade into product-layer cards
- Anti-pattern gaps are fixable by Sam
- WHY gaps often need human input
- Better to catch now than rebuild downstream cards later
