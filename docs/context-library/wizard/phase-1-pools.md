# Phase 1: Pool Membership — LOCKED

Status: **Locked** (reviewed and approved)

---

## Summary

Each AI mode selects a cumulative knowledge pool — a ceiling of which product knowledge areas the wizard can recommend. Higher modes include all knowledge from lower modes plus new areas. The pools are sized 10 → 13 → 18 → 22.

### Catalog count resolution

The catalog lists 23 numbered items but references "22 areas." Resolution: **5.2 Lessons Learned + 5.4 Historic Documents = one wizard area ("Institutional Memory").** The catalog keeps them as separate rows for granularity, but the wizard treats them as a single knowledge area recommendation.

### Key inferences from design doc

Two assignments were inferred rather than explicitly stated:

1. **Interaction Patterns (4.2) → Short-Order Cook** (design doc listed at Pair Programmer, but bounded-task executors need behavioral conventions for consistent UI implementation)
2. **Roadmap (5.3) → Pair Programmer** (design doc listed with Pair Programmer items, confirmed as design-participation context — builders proposing alternatives need to align with planned direction)

These resolve the design doc's counting discrepancies: Short-Order Cook names 2 but says "adds 3"; Pair Programmer names 6 but says "adds 5."

---

## Locked Pool Table

| # | Knowledge Area | Pool Entry | Cumulative Size |
|---|---|---|---|
| 1.1 | Product Vision | No/Low AI | 10 |
| 1.2 | Product Strategy | No/Low AI | 10 |
| 1.3 | User Personas / JTBD | No/Low AI | 10 |
| 2.1 | Information Architecture | No/Low AI | 10 |
| 2.2 | Noun Vocabulary | No/Low AI | 10 |
| 3.1 | User Journey Maps | No/Low AI | 10 |
| 3.2 | Emotional / Aesthetic Goals | No/Low AI | 10 |
| 3.5 | Anti-Patterns | No/Low AI | 10 |
| 4.1 | Design System | No/Low AI | 10 |
| 5.1 | Key Decisions Log | No/Low AI | 10 |
| 2.3 | Product Entities | Short-Order Cook | 13 |
| 4.2 | Interaction Patterns | Short-Order Cook | 13 |
| 4.3 | Prototypes / Mockups | Short-Order Cook | 13 |
| 1.4 | Competitive Analysis | Pair Programmer | 18 |
| 2.4 | System Design | Pair Programmer | 18 |
| 3.3 | Engagement Loops | Pair Programmer | 18 |
| 3.4 | Progression / Mastery | Pair Programmer | 18 |
| 5.3 | Roadmap | Pair Programmer | 18 |
| 1.5 | Market Requirements | Factory | 22 |
| 2.5 | Full GDD / PRD | Factory | 22 |
| 4.4 | Accessibility Standards | Factory | 22 |
| 5.2+5.4 | Institutional Memory | Factory | 22 |

---

## Pool Narratives

Each pool tells a distinct story about what the knowledge serves:

| Pool | Story | Additions serve... |
|---|---|---|
| **No/Low AI** (10) | Product alignment reference | Humans aligning with each other |
| **Short-Order Cook** (+3 → 13) | Implementation context for bounded tasks | Executor who can't ask mid-task |
| **Pair Programmer** (+5 → 18) | Strategic context for design participation | Collaborator proposing alternatives |
| **Factory** (+4 → 22) | Comprehensive context for full autonomy | Agent making every decision alone |

### No/Low AI — 10 areas

What any good product organization externalizes for its own alignment. Product knowledge flows primarily through conversation. The graph serves as shared reference and onboarding material.

- **Product identity:** Vision (1.1), Strategy (1.2), Anti-Patterns (3.5)
- **User understanding:** Personas (1.3), Journey Maps (3.1), Emotional Goals (3.2)
- **Product structure:** Information Architecture (2.1), Noun Vocabulary (2.2), Design System (4.1)
- **Institutional memory:** Key Decisions Log (5.1)

### Short-Order Cook — adds 3 (→ 13)

When product people hand off bounded tasks, implementation context must survive the handoff. Builders can't ask the product person mid-task.

- **Product Entities (2.3):** What objects exist in the product, their attributes, how they relate. Needed for any task touching product data.
- **Interaction Patterns (4.2):** How drag-and-drop, modals, transitions, and gestures work. Needed for consistent UI implementation.
- **Prototypes / Mockups (4.3):** Visual references for what screens look like. "Show, don't tell" for bounded tasks.

### Pair Programmer — adds 5 (→ 18)

When builders participate in product design, they need strategic and experiential context to propose aligned alternatives.

- **Competitive Analysis (1.4):** What exists in the space, what's differentiated. Needed to evaluate proposals against competitive landscape.
- **System Design (2.4):** How invisible product mechanisms work. Needed to propose changes to systems you can't see.
- **Engagement Loops (3.3):** What brings users back. Needed to evaluate whether feature proposals serve or break retention.
- **Progression / Mastery (3.4):** How the experience deepens over time. Needed to design for long-term engagement.
- **Roadmap (5.3):** What's coming and what's deferred. Needed to align design proposals with planned direction.

### Factory — adds 4 (→ 22)

When builders make every product micro-decision autonomously, all remaining product knowledge must be in the graph.

- **Market Requirements (1.5):** Evidence behind the strategy. Needed when the agent must evaluate WHY the strategy is what it is.
- **Full GDD / PRD (2.5):** Comprehensive product specification. The exhaustive reference for edge cases when no one is available to ask.
- **Accessibility Standards (4.4):** Compliance commitments. At lower modes, embedded in task specs; at Factory, must be independently known.
- **Institutional Memory (5.2+5.4):** Lessons learned, postmortems, superseded documents. Prevents repeating past mistakes when no one remembers to warn you.

---

## QA Notes

### Challenges tested and resolved

1. **Emotional Goals (3.2) at No/Low AI** — borderline (product person could answer "how should this feel?" in conversation), but the base pool is "what good product orgs document for human alignment," and emotional direction is a legitimate alignment artifact across multiple humans. **Stays.**

2. **Accessibility (4.4) at Factory vs. Short-Order Cook** — tempting to move down (concrete implementation constraint), but at Short-Order Cook the task spec handles accessibility requirements. At Factory, no one is writing it into tasks. **Stays at Factory.**

3. **Competitive Analysis (1.4) at Pair Programmer vs. No/Low AI** — any good product org knows their competition, but they don't need it externalized for their own alignment the way they need Vision or Vocabulary. Becomes structurally necessary when builders evaluate proposals against competitive landscape. **Stays at Pair Programmer.** (Note: at low novelty, the 3x3 can elevate its priority — handled by tier assignment, not pool membership.)

### Naming change

**Data Model (2.3) → Product Entities.** The original name sent a technical signal ("here's your schema"). The wizard is a product artifact. "Product Entities" says "these are the things that exist in our product world" without implying database design. Catalog description unchanged.

### Audience note

Teams primarily using AI for autocomplete or chat assistance (Levels 1-2 in engineering maturity frameworks) are not the primary audience for a context library. The wizard is designed for teams where AI executes tasks with some degree of independence. This doesn't change the modes or pools — it helps the right teams self-select into the wizard.
