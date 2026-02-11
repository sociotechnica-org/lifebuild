# Self-Check

Run before handing cards to Conan. Catches obvious issues.

## Per-Card Checklist

### Structure (30 seconds)

- [ ] All five sections present? (WHAT, WHERE, WHEN, WHY, HOW)
- [ ] Section headers match template?
- [ ] No empty sections?

### WHAT Section (30 seconds)

- [ ] **Standalone test:** Cover title. Read only WHAT. Understand what this is?
- [ ] 2-4 sentences?
- [ ] No unexplained jargon?

### WHERE Section (1 minute)

- [ ] At least 3 links?
- [ ] **Every link has context?** (No naked `[[Note]]`)
- [ ] **Containment parent linked?** (see below)
- [ ] At least one dependency?
- [ ] At least one dependent? (or noted as leaf)
- [ ] **Conformance links present?** (see below)

### Conformance Check

Does this card touch a governed domain?

| If the card…                                        | Must link to…                      |
| --------------------------------------------------- | ---------------------------------- |
| Renders visually                                    | Standard - Visual Language         |
| Has state indicators (saturation, glow, dimming)    | Standard - Visual Language         |
| Displays project illustrations                      | Standard - Image Evolution         |
| Involves priority ordering or scoring               | Standard - Priority Score          |
| Involves stream classification (Gold/Silver/Bronze) | Standard - Three-Stream Portfolio  |
| Has project lifecycle states                        | Standard - Project States          |
| Shows smoke signal indicators                       | Standard - Smoke Signal Thresholds |
| Has Bronze mode behavior                            | Standard - Bronze Mode Behaviors   |
| Involves service level awareness                    | Standard - Service Levels          |
| Renders Work at Hand in multiple locations          | Standard - Dual Presence           |
| Involves category assignment                        | Standard - Life Categories         |
| Is an Agent or Prompt                               | Standard - Agent Voice (if exists) |

If yes → conformance link must be in WHERE.
If Standard doesn't exist yet → flag for creation.

### Containment Check

| Type       | Must Link To                                  |
| ---------- | --------------------------------------------- |
| Room       | Zone (parent workspace)                       |
| Structure  | Room (where it lives)                         |
| Component  | Structure or Room or Overlay (parent element) |
| Artifact   | Room (where it's edited)                      |
| Capability | Room(s) (where it's performed)                |
| Prompt     | Agent (what it implements)                    |
| Overlay    | Zone(s) (where it's visible)                  |

### Folder Placement Check

- [ ] **Card in correct layer?**
  - Strategy, Principle, Standard → `/rationale/` subtree
  - Zone, Room, Overlay, Structure, Component, Artifact, Capability, Primitive, System, Agent, Prompt → `/product/` subtree

### WHY Section (1 minute)

- [ ] Strategy or Principle link present with explanation?
- [ ] **Linked note exists?** (Check — don't link to nothing)
- [ ] **Linked note is substantive?** (Not a stub)
- [ ] Driver identified?

### WHEN Section (15 seconds)

- [ ] Temporal status present?
- [ ] Predecessor mentioned if exists in source?

### HOW Section (1 minute)

- [ ] Describes behavior, not rationale?
- [ ] Sufficient for builder to understand what to implement?
- [ ] Links to components if complex?
- [ ] **Has ≥2 concrete examples?** (input → output)
- [ ] **Has ≥1 anti-example?** (what wrong looks like)

### Links Overall (30 seconds)

- [ ] **Minimum 5 links?**
- [ ] **Links span 3+ dimensions?**
- [ ] Spot check 2-3: Do linked notes link back?

---

## Standard Card Checklist

Different structure than product-layer cards.

- [ ] WHAT describes what it specifies, not what it does?
- [ ] WHERE has "Conforming" section listing product-layer cards?
- [ ] WHY links to Principle? (Standards implement Principles)
- [ ] HOW contains actual spec? (values, rules, thresholds)
- [ ] **Has ≥1 anti-example?** (what violation looks like)
- [ ] Existing cards that should conform are linked?
- [ ] **Filed in `/rationale/standards/`?** (not `/product/`)

---

## Strategy/Principle Checklist

- [ ] WHY has reasoning, not just assertion?
- [ ] **Has Anti-Patterns section?** (what violating this looks like)
- [ ] Tensions documented?
- [ ] **Filed in `/rationale/strategies/` or `/rationale/principles/`?** (not `/product/`)

---

## Quick Tally

| Result     | Meaning               |
| ---------- | --------------------- |
| ✓ All pass | Ready for Conan       |
| 1-2 minor  | Fix now               |
| 3+ issues  | Fix before continuing |
| Unclear    | Flag for human        |

---

## Batch Check

After finishing a zone's cards:

### Inventory Reconciliation

- [ ] All inventory items have cards?
- [ ] Discovered cards noted?
- [ ] Skipped items have reason?

### Cross-Card Consistency

- [ ] Same terms used consistently?
- [ ] Related cards link to each other?
- [ ] Shared dependencies point to same note?

### Conformance Coverage

- [ ] All Standards have conforming cards linked?
- [ ] All product-layer cards touching governed domains have conformance links?

### Strategy/Principle Coverage

- [ ] Every linked strategy note exists?
- [ ] Strategy notes have substance?
- [ ] No orphan strategy notes?
- [ ] **All Strategy/Principle notes have Anti-Patterns section?**

### Examples & Anti-Patterns Coverage

- [ ] All product-layer card HOW sections have ≥2 examples?
- [ ] All product-layer card HOW sections have ≥1 anti-example?
- [ ] All Standards have anti-examples?
- [ ] Missing examples flagged for human input?

### Link Health

- [ ] No broken links?
- [ ] Bidirectional sample: Pick 5, verify they link back

---

## Common Issues

**Missing link context:**

```markdown
# Bad

- [[Priority Queue]]

# Good

- [[Priority Queue]] — provides candidate tasks for filtering
```

**WHAT not standalone:**

```markdown
# Bad

"The settings for Bronze mode. See [[Bronze Operations]]."

# Good

"Bronze Mode Settings let directors control how many operational tasks
appear in their Bronze queue each week..."
```

**WHY links to stub:**

```markdown
# The card says:

Strategy: [[Strategy - Visual Work]] — implements visibility

# But the strategy note is just:

"Visual work is important."

# Fix: Enrich the strategy note before handing off
```

**Missing conformance:**

```markdown
# Card renders visual indicators but WHERE has no Standard link

# Fix: Add

- [[Standard - Visual Language]] — constrains indicator rendering
```

**All links in one dimension:**

```markdown
# Bad (all WHERE)

Zone, System, Dependency, Dependency, Component

# Good (spread across dimensions)

Zone, System, Dependency (WHERE)
Strategy, Decision (WHY)
Future enhancement (WHEN)
```

**Missing examples in HOW:**

```markdown
# Bad

"The component displays priority scores for tasks."

# Good

"### Examples

- Task with score 85 → displays in Gold stream with amber glow
- Task with score 45 → displays in Bronze stream, dimmed"
```

**Missing anti-examples:**

```markdown
# Bad (no boundaries defined)

"Colors follow the visual language."

# Good

"### Anti-Examples

- Wrong: Using #FF0000 for errors (too harsh, not in palette)
- Wrong: Applying glow to Bronze items (reserved for Gold/Silver)"
```

**Strategy without anti-patterns:**

```markdown
# Bad

"We believe in spatial visibility."

# Good

"## Anti-Patterns

- Wrong: Hiding status in dropdown menus
- Wrong: Requiring hover to see critical info"
```

**Wrong folder placement:**

```markdown
# Bad

Standard - Life Categories filed in /product/standards/

# Good

Standard - Life Categories filed in /rationale/standards/
```

---

## Self-Check Report

```
Zone: [Name]
Cards checked: [N]
Passing: [N]
Fixed during check: [N]
Flagged for human: [N]

Issues found and fixed:
- [Card]: [Issue] → [Fix]

Conformance gaps addressed:
- [Card]: Added [[Standard - X]]

Folder placement issues:
- [Card]: Moved from [old] to [correct]

Flagged for human judgment:
- [Card]: [Question]

Ready for Conan: [Yes/No]
```
