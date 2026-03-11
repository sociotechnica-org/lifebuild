# Context Library Intake — Output Template

This template defines the format produced by the Estate Attorney Protocol (Phase 6) when it compares wizard recommendations against a team's existing knowledge.

---

## Template

```markdown
# Context Library Assessment

**Configuration:** [Mode] × [Novelty] Novelty × [Complexity] Complexity
**Pool:** [N] knowledge areas | **Gaps:** [N] to create, [N] to refresh, [N] complete

---

## Your Library's Risk

> [Mode narrative risk statement]

[1-2 sentences explaining what this means for this specific configuration.]

---

## Seeding Sequence

### Phase 1: Foundation Gaps
[Only shown if Foundation gaps exist]

These must be seeded first — other knowledge depends on them for coherence.

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 1 | [Area Name] (ID) | Absent | Create | [Impact statement] |
| 2 | [Area Name] (ID) | Stale | Refresh | [Impact statement] |

### Phase 2: Core Gaps
[Only shown if Core gaps exist]

These are the primary value drivers for your configuration.

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 3 | [Area Name] (ID) | Absent | Create | [Impact statement] |
| 4 | [Area Name] (ID) | Partial | Update | [Impact statement] |

### Phase 3: Amplifier Gaps
[Only shown if Amplifier gaps exist]

These multiply the effectiveness of your Foundation and Core knowledge.

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 5 | [Area Name] (ID) | Absent | Create | [Impact statement] |

### Phase 4: Already Covered

These areas are present and fresh in your library. No action needed.

| Area | Status | Last Refreshed |
|---|---|---|
| [Area Name] (ID) | Present | [Date or "Current"] |

---

## Solicitation Prompts

For each gap, use these prompts to extract the knowledge from your team:

### [Area Name] (ID) — [Action: Create/Update/Refresh]

> [Solicitation prompt tailored to the area and the team's configuration]

**What good looks like:** [1 sentence describing a well-seeded version of this area]

**Common pitfall:** [1 sentence describing the most common mistake teams make when documenting this area]
```

---

## Field Definitions

### Status Values

| Status | Meaning |
|---|---|
| **Absent** | No documentation exists for this area |
| **Partial** | Some documentation exists but with significant gaps |
| **Present** | Documentation exists and covers the area adequately |

### Freshness Values

| Freshness | Meaning |
|---|---|
| **Fresh** | Documentation reflects current product state |
| **Stale** | Documentation exists but is outdated (product has evolved past it) |
| **Unknown** | Team isn't sure if documentation is current |

### Action Values

| Action | Trigger | Effort |
|---|---|---|
| **Create** | Status = Absent | Full authoring session |
| **Update** | Status = Partial | Targeted gap-filling |
| **Refresh** | Status = Present, Freshness = Stale | Review and update pass |
| **None** | Status = Present, Freshness = Fresh | No action needed |

### Priority Score

Composite of three factors:

```
priority_score = tier_weight × gap_severity × freshness_penalty

tier_weight:
  foundation = 1.0
  core = 0.75
  amplifier = 0.5
  deprioritized = 0.25

gap_severity:
  absent = 1.0
  partial = 0.6
  present = 0.0

freshness_penalty:
  stale = 0.4    (applied when status = present)
  unknown = 0.2  (applied when status = present)
  fresh = 0.0
```

Items with the same priority score are sequenced by tier (Foundation first), then by catalog order within tier.

---

## Example Output

```markdown
# Context Library Assessment

**Configuration:** Pair Programmer × High Novelty × Moderate Complexity
**Pool:** 18 knowledge areas | **Gaps:** 5 to create, 2 to refresh, 11 complete

---

## Your Library's Risk

> Misaligned proposals — technically elegant solutions that are product-wrong.

Your AI builders participate in design discussions and propose alternatives.
Without sufficient product context, proposals will be technically sound but
strategically misaligned — solving the wrong problem elegantly.

---

## Seeding Sequence

### Phase 1: Foundation Gaps

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 1 | Anti-Patterns (3.5) | Absent | Create | Without explicit "this is NOT that" guardrails, your AI builder will default to conventions from the most similar product in its training data — which is exactly what your pioneering product is trying to avoid. |

### Phase 2: Core Gaps

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 2 | Emotional Goals (3.2) | Absent | Create | Your builder can't infer how a pioneering product should FEEL from category norms (there is no category). Every design proposal will be emotionally neutral or borrowed from the wrong reference. |
| 3 | System Design (2.4) | Absent | Create | Your product's invisible mechanisms (scoring, state machines, recommendations) interact across features. Without this, proposals will break systems the builder can't see. |
| 4 | Decisions Log (5.1) | Stale | Refresh | Your builder will relitigate settled decisions. At Pair Programmer, this is the costliest error — it wastes proposal cycles on approaches already tried and rejected. |

### Phase 3: Amplifier Gaps

| Priority | Area | Status | Action | Impact |
|---|---|---|---|---|
| 5 | Information Architecture (2.1) | Partial | Update | Navigation structure is documented but missing the new dashboard section added last quarter. Proposals touching navigation may conflict with the current hierarchy. |
| 6 | Competitive Analysis (1.4) | Absent | Create | At high novelty, this is Amplifier (not Core) because there's no established category to analyze. But documenting what you're NOT helps constrain proposals. |
| 7 | Design System (4.1) | Stale | Refresh | Your visual language has evolved since this was last updated. Proposals will reference outdated component specs. |

### Phase 4: Already Covered

| Area | Status |
|---|---|
| Product Vision (1.1) | Present |
| Product Strategy (1.2) | Present |
| User Personas (1.3) | Present |
| Noun Vocabulary (2.2) | Present |
| Product Entities (2.3) | Present |
| User Journey Maps (3.1) | Present |
| Engagement Loops (3.3) | Present |
| Progression / Mastery (3.4) | Present |
| Interaction Patterns (4.2) | Present |
| Prototypes / Mockups (4.3) | Present |
| Roadmap (5.3) | Present |
```
