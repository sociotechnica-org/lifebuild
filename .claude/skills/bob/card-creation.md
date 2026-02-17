# Card Creation

Step-by-step procedure for building cards.

## Before You Start

Have these open:

- Conan's inventory for the zone
- Relevant SOT sections and companion docs
- Library Reference (templates, conformance obligations)
- Link patterns reference

---

## Product-Layer Card Procedure

This procedure applies to all product-layer types: Zones, Rooms, Overlays, Structures, Components, Artifacts, Capabilities, Primitives, Systems, Agents, and Prompts. Use the type-specific template from Library Reference (`reference.md`) for section structure.

### Step 1: Read (2-3 minutes)

1. Find the inventory entry
2. Read the source sections listed
3. Note: What is this? What does it do? What does it connect to?

Don't write yet. Absorb.

### Step 2: WHAT First (2-3 minutes)

Start with WHAT. It anchors the card.

Write 2-4 sentences:

- What is this thing?
- What does it do?
- Who uses it?

**Test:** Cover the title. Does WHAT make sense alone? If not, rewrite.

### Step 3: WHERE (3-5 minutes)

Map the ecosystem.

Use the WHERE template from Library Reference for your card's type. Key patterns:

- **Rooms** → link parent Zone, resident Agent, contained Structures/Artifacts/Capabilities
- **Structures** → link parent Room, contained Components
- **Components** → link parent Structure/Room/Overlay
- **Overlays** → link visibility scope (which Zones)
- **Artifacts** → link Room where created/edited
- **Capabilities** → link Room(s) where performed
- **Agents** → link home Room, coordinating Agents
- **Prompts** → link parent Agent
- **Primitives** → link Rooms/Capabilities that serve them

All types: include Conforms to links where obligated (see below).

**Conformance check:** Does this card touch a governed domain?

- Visual rendering → Standard - Visual Language
- Priority/ordering → Standard - Priority Score
- Stream classification → Standard - Three-Stream Portfolio
- Project states → Standard - Project States
- Project illustrations → Standard - Image Evolution
- Category assignment or category-based organization → Standard - Life Categories

See Library Reference for full conformance obligations table.

Every link gets context phrase. Use link-patterns.md.

**Check:** 3+ links? Context on each? Conformance present?

### Step 4: WHY (3-5 minutes)

Trace the rationale.

```markdown
## WHY: Rationale

- Strategy: [[Strategy]] — [how this implements it]
- Principle: [[Principle]] — [what guidance it follows]
- Driver: [[Signal/Pressure]] or Exploratory — [hypothesis]
```

**Critical:** Check that strategy/principle notes exist and aren't stubs.

If note doesn't exist → Create it now.
If note is stub → Enrich it now.

### Step 5: WHEN (1 minute)

Mark temporal status.

```markdown
## WHEN: Timeline

New concept — no past. Planned for v1.0.
```

Or if predecessor exists:

```markdown
Supersedes [[Past - Old Approach]] which [why it changed].
```

### Step 6: HOW (5-7 minutes)

Describe intended behavior with examples.

```markdown
## HOW: Implementation

### Behavior

[What it does. User-observable behavior. State transitions.]

### Examples

[Concrete input → output. At least 2.]

- Example 1: [input] → [output]
- Example 2: [input] → [output]

### Anti-Examples

[What wrong implementation looks like. At least 1.]

- Wrong: [what it shouldn't do and why]
```

**Check:** Could someone implement from this? Are examples concrete?

**If source lacks examples:** Flag for human input, or derive from behavior spec.

### Step 8: Quick Self-Check (1-2 minutes)

- [ ] All five sections present?
- [ ] WHAT standalone?
- [ ] 5+ links with context?
- [ ] Conformance links where obligated?
- [ ] Strategy note exists and is substantive?
- [ ] WHEN has temporal status?
- [ ] HOW has ≥2 examples?
- [ ] HOW has ≥1 anti-example?

Issues? Fix now. Unclear? Flag and move on.

---

## Standard Card Procedure

Standards are specifications that constrain product-layer cards. No runtime state.

**Standards belong in `/rationale/standards/`** — they are part of the rationale layer, not the product layer.

### Step 1: Read

Identify specification content in source:

- Tables of values (colors, thresholds, formulas)
- Rules with testable criteria
- Constraints multiple cards must follow

### Step 2: WHAT

```markdown
## WHAT: Definition

[What this standard specifies. What it constrains.]
```

Standards don't "do" — they define what implementations must match.

### Step 3: WHERE

```markdown
## WHERE: Ecosystem

- Implements:
  - [[Principle]] — [what guidance this makes testable]
- Conforming:
  - [[Room]] — [must follow this]
  - [[Structure]] — [must follow this]
  - [[Component]] — [must follow this]
  - [[Overlay]] — [must follow this]
  - [[Agent]] — [must follow this]
- Related:
  - [[Standard]] — [complementary or overlapping standards]
```

**Audit existing cards:** What product-layer cards should conform to this? Add links both directions.

### Step 4: WHY

```markdown
## WHY: Rationale

- Principle: [[Principle]] — [what guidance it makes concrete]
- Driver: [What goes wrong without this spec — the "Angry Birds" problem]
```

Standards must implement at least one Principle. No arbitrary rules.

### Step 5: WHEN

```markdown
## WHEN: Timeline

[Stability status. When established.]
```

### Step 6: HOW

```markdown
## HOW: Specification

[The actual spec. Values, rules, thresholds.]
[Tables preferred — scannable, unambiguous.]
```

This is what builders read to know what to produce.

### Step 7: Anti-Examples

```markdown
## Anti-Examples

[What violation looks like. Concrete wrong outputs.]

- Wrong: [specific violation and why it fails the spec]
```

**Critical for Standards:** Anti-examples define boundaries. Without them, builders may produce technically compliant but wrong outputs.

---

## Creating Supporting Notes

### Strategy Note (5-10 minutes)

Don't stub it. Conan traces these.

**Strategy notes belong in `/rationale/strategies/`.**

```markdown
# Strategy - [Name]

## WHAT: The Strategy

[One sentence articulating the bet.]

## WHERE: Ecosystem

- Principles:
  - [[Principle]] — [what judgment guidance this generates]
- Standards:
  - [[Standard]] — [what specifications this generates]
- Zones:
  - [[Zone]] — [what product areas embody this]
- Tensions:
  - [[Strategy]] — [what other strategies this trades off against]

## WHY: Belief

[Why we believe this — reasoning, not just assertion]

## HOW: Application

### What Following This Looks Like

[2-3 concrete examples.]

### What Violating This Looks Like

[2-3 concrete anti-patterns.]

### Decision Heuristic

[When facing a tradeoff, how does this strategy guide the choice?]
```

**Minimum viable:** 150+ words with real reasoning in WHY. Anti-patterns required.

### Principle Note (5-10 minutes)

**Principle notes belong in `/rationale/principles/`.**

```markdown
# Principle - [Name]

## WHAT: The Principle

[One sentence. Judgment-based guidance.]

## WHERE: Ecosystem

- Strategy:
  - [[Strategy]] — [what bet this serves]
- Standards:
  - [[Standard]] — [what specifications make this testable]
- Governs:
  - [[Zone]] — [what areas this applies to]
  - [[Room]] — [what rooms this shapes]
  - [[Capability]] — [what behaviors this constrains]
- Related:
  - [[Principle]] — [complementary or contrasting principles]

## WHY: Belief

[Why we believe this]

## HOW: Application

### What Following This Looks Like

[2-3 concrete examples.]

### What Violating This Looks Like

[2-3 concrete anti-patterns.]

### Tensions

[What other principles this trades off against.]

### Test

[A question to ask when evaluating whether a design follows this principle.]
```

### Decision Note (3-5 minutes)

```markdown
# Decision - [Name]

## WHAT: The Choice

[What was decided]

## WHERE: Ecosystem

- Affects:
  - [[Zone]] — [how it shapes this]
  - [[Room]] — [how it shapes this]
  - [[Capability]] — [how it shapes this]
- Governed by:
  - [[Principle]] — [what guided the choice]

## WHY: Rationale

Options considered:

- Option A: [rejected because]
- Option B: [chosen because]

## WHEN: Timeline

[When made, what phase]
```

---

## Batch Workflow

For a zone with 10 cards:

1. Read all source material (15-20 min)
2. Create cards in build order:
   - Standards first (they constrain everything)
   - Strategy/Principles next (WHY upstream)
   - Systems next (cross-cutting mechanisms)
   - Zones/Rooms (most-depended-on first)
   - Overlays, Structures, Artifacts, Capabilities
   - Components last (implementation details)
   - Agents + Prompts
3. After all created, batch self-check (15-20 min)
4. Fix issues found
5. Report and hand off

**Don't:** Create one, hand to Conan, wait, fix, repeat.
**Do:** Create all, self-check batch, hand off batch.

---

## Progress Reporting

During work:

```
Starting Life Map zone. 8 cards in inventory.
```

```
Done: 4/8 cards. Created Standard - Visual Language along the way.
```

After self-check:

```
Self-check complete.
- 8 product-layer cards ready
- 2 standards created
- 1 flag: Priority Queue — structure or system?

Ready for Conan.
```
