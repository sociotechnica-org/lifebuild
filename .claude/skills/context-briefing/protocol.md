# Context Briefing Protocol

Contract for context delivery between the library system and consuming agents.

**Roles:**

- **Conan** (assembler) — assembles context briefings from the library
- **Builder agents** (code writers) — consume briefings during software implementation
- **Sam** (scribe) — writes and fixes library cards, NOT code

This protocol was originally written for a two-agent model. The current architecture has three roles: Conan assesses and assembles, builder agents consume briefings and write code, Sam writes library cards. Where this document says "the consumer," it means whichever agent is using the briefing — typically a builder agent writing code, but also Sam when writing cards that depend on product context.

---

## Context Briefing: CONTEXT_BRIEFING.md

Conan writes this file before the consuming agent begins work. The consumer reads it as primary context.

### Structure

```markdown
# Context Briefing

## Task Frame

**Task:** [what needs to be built/modified]
**Target type:** [System | Component | Room | Zone | Structure | Capability | Artifact | Overlay | Agent | Prompt | Primitive | Loop | Journey | Aesthetic | Dynamic]
**Task type:** [feature | bug | refactor | new | architecture]
**Constraints:** [non-negotiable boundaries]
**Acceptance criteria:** [how to know it's done]

## Primary Cards (full content)

### [Card Name]

**Type:** [card type]
**Relevance:** [why this card matters for this task]

[Full card content — all 5 dimensions]

### [Card Name]

...

## Supporting Cards (summaries)

| Card          | Type     | Key Insight                         |
| ------------- | -------- | ----------------------------------- |
| [[Card Name]] | System   | [one-line summary relevant to task] |
| [[Card Name]] | Standard | [one-line summary relevant to task] |

...

## Relationship Map

- Card_A depends-on Card_B (Card_A needs Card_B's state data)
- Card_B implements Standard_X (Card_B must conform to Standard_X's rules)
- Card_A invokes Capability_Y (Card_A triggers Capability_Y's workflow)
  ...

## Gap Manifest

| Dimension | Topic               | Searched | Found | Recommendation |
| --------- | ------------------- | -------- | ----- | -------------- |
| WHY       | [missing rationale] | yes      | no    | [what to do]   |

...
```

### Card budget by task complexity

| Complexity             | Primary Cards | Supporting Cards | Total |
| ---------------------- | ------------- | ---------------- | ----- |
| Simple (single file)   | 2-3           | 3-5              | 5-8   |
| Medium (single module) | 3-5           | 5-8              | 8-13  |
| Complex (cross-system) | 4-6           | 6-10             | 10-16 |
| Architecture change    | 5-8           | 8-12             | 13-20 |

---

## Ordering for Attention

LLMs exhibit U-shaped attention (beginning and end strongest). Order context accordingly:

1. **Beginning (highest attention):** Task frame + primary cards
2. **Middle (lowest attention):** Relationship map + supporting card summaries
3. **End (second-highest attention):** WHY/architectural cards + constraints + anti-patterns from HOW sections

When a card serves both primary and WHY-chain purposes, include it as a primary card at the beginning AND extract its anti-patterns to the end section.

---

## Inquiry Protocol (5-Signal Decision Matrix)

Any agent working with library content — builder agents during code implementation, Sam during card creation — uses this protocol when encountering uncertainty about product concepts.

### 5-Signal Decision Matrix

| Signal                 | Proceed Autonomously                           | Search the Library                                       |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **Reversibility**      | Easily undone (formatting, tests, comments)    | Hard to reverse (schema, API contracts, data migrations) |
| **Context coverage**   | All relevant dimensions present in briefing    | Missing cards in any dimension for affected area         |
| **Precedent**          | Similar pattern exists in briefing or codebase | Novel pattern with no precedent                          |
| **Blast radius**       | Change affects single file/card                | Change propagates across multiple systems                |
| **Domain specificity** | General patterns                               | Product-specific knowledge                               |

**Rule: 2+ "Search" signals → MUST search the library before proceeding**

**Note on Sam:** Sam the Scribe also uses this matrix, but during _card creation_, not code implementation. When Sam encounters uncertainty about product concepts while writing a card (e.g., "is this a System or a Capability?"), the same protocol applies. The signals map slightly differently: "reversibility" means how hard it is to fix a card classification error, "blast radius" means how many downstream cards would inherit a mistake.

### Query Format

When the consuming agent needs more context, log this before searching:

```
UNCERTAINTY: [dimension — WHAT/WHY/WHERE/HOW/WHEN]
TOPIC: [specific subject]
DEFAULT ASSUMPTION: [what I'll do if no answer]
IMPACT IF WRONG: [what changes]
SEARCH: Grep for "[terms]" in docs/context-library/
```

### Search Techniques

| Need                             | Technique                                                         |
| -------------------------------- | ----------------------------------------------------------------- |
| Find a card by name              | `Glob` for `**/[Type] - [Name].md`                                |
| Find cards about a topic         | `Grep` for topic terms across `docs/context-library/`             |
| Find cards in a dimension        | `Grep` for content under `## WHY:` or `## HOW:` headers           |
| Find cards that reference a card | `Grep` for `[[Card Name]]` across the library                     |
| Follow a WHY chain upstream      | Read card → follow `[[Principle -` and `[[Product Thesis -` links |

### Loop Prevention

- **Max rounds:** 3 follow-up searches per uncertainty
- **Novel query requirement:** Each search must use different terms than previous
- **Confidence check:** If confidence doesn't improve after a round, proceed with default assumption and document it
- **Escalation:** After max rounds, document uncertainty in provenance log and proceed with default OR flag for human input

---

## Handoff Flow

```
1. Task arrives (user request or issue)
       │
       ▼
2. Conan receives task description
       │
       ▼
3. Conan identifies target type + task type
       │
       ▼
4. Conan loads retrieval profile for that type
       │
       ▼
5. Conan searches library (Grep/Glob/Read)
       │
       ├── Seed cards found → expand via wikilinks
       ├── Mandatory categories checked
       └── Gaps identified
       │
       ▼
6. Conan writes .context/CONTEXT_BRIEFING.md
       │
       ▼
7. Conan logs assembly to provenance-log.jsonl
       │
       ▼
7.5. Conan triages assembly insights → actionable items
     to feedback-queue.jsonl (gaps, weak cards,
     retrieval misses, relationship discoveries)
       │
       ▼
8. Builder agent reads .context/CONTEXT_BRIEFING.md
       │
       ▼
9. Builder agent implements code, querying library
   when uncertain (5-signal matrix)
       │
       ▼
10. Builder agent logs decisions to provenance-log.jsonl
       │
       ▼
11. Builder agent updates decision outcomes after task
       │
       ▼
12. If implementation changed product concepts:
    Sam updates affected library cards
```

**Note:** Sam the Scribe also consumes briefings in a parallel workflow — when writing _library cards_ (not code) that depend on product context. Sam's handoff flow is: Conan assembles briefing → Sam reads briefing → Sam writes cards → Conan grades cards. This is distinct from the builder agent flow above.

---

## Relationship Types

When mapping relationships in the briefing, use these edge types:

| Relationship       | Meaning                     | Example                           |
| ------------------ | --------------------------- | --------------------------------- |
| `depends-on`       | Requires this to function   | System depends-on Primitive       |
| `implements`       | Realizes this specification | Room implements Standard          |
| `constrained-by`   | Must conform to this        | Component constrained-by Standard |
| `contains`         | Parent-child spatial        | Zone contains Room                |
| `invokes`          | Triggers this workflow      | Room invokes Capability           |
| `extends`          | Builds on this              | Principle extends Product Thesis  |
| `coordinates-with` | Peer relationship           | Agent coordinates-with Agent      |
| `operates-on`      | Acts on this data           | Capability operates-on Primitive  |
| `manages`          | Oversees lifecycle of       | Agent manages Artifact            |
