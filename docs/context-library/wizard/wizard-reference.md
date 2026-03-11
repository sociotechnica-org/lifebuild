# Context Library Wizard — Reference Guide

Version: 1.0.0

---

## What This Wizard Does

The Context Library Wizard takes three inputs about your product and team, and produces a prioritized list of product knowledge areas to seed in your context library. It tells you **what to document first** based on how you work with AI, how novel your product is, and how complex it is.

### The Three Questions

**Question 1: How much product decision authority do your AI builders have?**

This determines your **knowledge pool** — the ceiling of which areas the wizard can recommend. Higher autonomy means more areas are relevant.

| Mode | Pool Size | Story |
|---|---|---|
| **No/Low AI** | 10 areas | Product alignment reference for your team |
| **Short-Order Cook** | 13 areas | Implementation context for bounded tasks |
| **Pair Programmer** | 18 areas | Strategic context for design participation |
| **Factory** | 22 areas | Comprehensive context for full autonomy |

*How to answer:* Think about the last 10 product decisions that were made (what copy to use, how a screen is laid out, what the default behavior is). How many did a product person explicitly make vs. how many did the builder decide on their own?

- **No/Low AI** — A product person is present for every product decision. AI helps with autocomplete or brainstorming, but a human decides how things look, feel, and behave.
- **Short-Order Cook** — A product person scopes each task explicitly. The AI executes bounded work — "build this modal," "add this validation" — but doesn't decide what to build or how it should feel.
- **Pair Programmer** — AI participates in design discussions. It proposes alternatives, evaluates trade-offs, and helps shape features — but a product person reviews and approves.
- **Factory** — AI is the primary implementer. It decides empty state copy, error message tone, default settings, information hierarchy — product micro-decisions that happen hundreds of times with no product person reviewing each one.

**Question 2: If you described your product in one sentence, would someone from your industry correctly guess what using it feels like?**

This determines how much **identity and experience knowledge** is prioritized. Novel products need more explicit documentation of what they are (and aren't).

- **Low (Established Category)** — "It's a CRM" and people immediately picture something close to what we're building.
- **Moderate (Familiar Space, Novel Approach)** — People recognize the space but not our approach. They'd get the purpose right but picture something very different.
- **High (Pioneering)** — There's no established category. People either look confused or immediately compare it to something it's NOT.

*Disambiguation prompts:*
- When you onboard a new team member, how long until they "get" the vision? Immediately → Low. A few conversations → Moderate. Weeks, and they keep reverting to wrong mental models → High.
- Do you frequently say "no, it's not like [familiar product]"? Rarely → Low. Sometimes → Moderate. Constantly → High.
- Could a competitor copy your product by looking at screenshots? Yes → Low. Partially → Moderate. They'd miss the entire point → High.

**Question 3: When you make a product decision about one feature, how many other features does it typically affect?**

This determines how much **structural and system knowledge** is prioritized. Complex products need more explicit documentation of how things connect.

- **Low (Single-Purpose)** — Most features are independent. Changing the settings page doesn't affect anything else.
- **Moderate (Interacting Features)** — Features interact. Adding a new view might affect 2-3 other views.
- **High (Interconnected Systems)** — Features create combined effects. Changing one system affects recommendations, which affects behavior, which affects retention. Wrong decisions cascade.

*Disambiguation prompts:*
- Think about the last time you changed a product decision. Did you update one spec, or several? One → Low. A few → Moderate. A chain reaction → High.
- Does your product have "invisible mechanisms" — scoring, recommendations, progression systems, state machines? None → Low. A few → Moderate. Several interconnected ones → High.
- If a new builder implements a feature perfectly per its spec but doesn't know the rest of the product, how likely is it to break something? Unlikely → Low. Possible → Moderate. Almost certain → High.

*Note: This is about PRODUCT complexity, not technical complexity. Your tech stack, framework choices, and deployment architecture don't factor in.*

### The Four Tiers

Every knowledge area in your pool is assigned one of four tiers:

| Tier | Meaning | Action |
|---|---|---|
| **Foundation** | Must exist first. Other knowledge depends on these for coherence. | Seed immediately — prerequisites for everything else. |
| **Core** | Primary value drivers for your configuration. | Seed after Foundation. This is where the library provides the most value. |
| **Amplifier** | Makes Foundation and Core more effective. Valuable but not prerequisite. | Seed when Foundation and Core are in place. |
| **Deprioritized** | In your pool but low urgency for your configuration. | Seed last, if you get to it. Useful reference but not a priority. |

---

## The 22 Knowledge Areas

### Domain 1: Vision & Strategy

| # | Area | Description | When Missing |
|---|---|---|---|
| 1.1 | **Product Vision** | What is this and why does it exist? Target user. Core value proposition. | The library has no anchor. Every card is based on inferences, producing technically accurate but strategically hollow knowledge. |
| 1.2 | **Product Strategy** | The bets the team is making. Trade-offs. What they're optimizing for and sacrificing. | People optimize for different outcomes and don't realize they disagree. |
| 1.3 | **User Personas / JTBD** | Who uses this? What outcomes do they want? What context are they in? | Builders create features for imagined users that don't match real ones. |
| 1.4 | **Competitive Analysis** | What exists in the space? What's the differentiated position? | Builders create category-generic features instead of differentiated ones. |
| 1.5 | **Market Requirements** | User research, surveys, interviews, analytics. The evidence behind the strategy. | Decisions are based on beliefs rather than evidence. |

### Domain 2: Architecture & Nouns

| # | Area | Description | When Missing |
|---|---|---|---|
| 2.1 | **Information Architecture** | What screens or spaces exist? How does the user navigate? What's the hierarchy? | Builders organize things differently, producing inconsistent navigation. |
| 2.2 | **Noun Vocabulary** | What do we call things? The metaphor family and why it was chosen. | Two builders working on adjacent features call the same thing by different names. |
| 2.3 | **Product Entities** | The core objects: what entities exist, their attributes, how they relate. | Product objects are reimplemented inconsistently each time they're touched. |
| 2.4 | **System Design** | How do invisible product mechanisms work? Scoring, progression, recommendations, state machines. | Invisible mechanisms are reimplemented differently each time they're touched. |
| 2.5 | **Full GDD / PRD** | Comprehensive product specification covering all features, behaviors, edge cases. | Edge cases are handled inconsistently or not at all. |

### Domain 3: Experience & Feel

| # | Area | Description | When Missing |
|---|---|---|---|
| 3.1 | **User Journey Maps** | End-to-end flows for key scenarios. First-time experience. Daily use. Error recovery. | Individual screens work but the end-to-end flow feels disconnected. |
| 3.2 | **Emotional / Aesthetic Goals** | How should this product feel? What adjectives describe the ideal experience? | The product is functionally correct but emotionally flat. |
| 3.3 | **Engagement Loops** | What brings people back? The daily, weekly, or seasonal rhythm. | The product is used once but doesn't become a habit. |
| 3.4 | **Progression / Mastery** | How does the experience deepen over time? What unlocks? Day 1 vs. month 6. | The experience feels the same at month 6 as day 1. |
| 3.5 | **Anti-Patterns** | Explicit "this is not that" statements. Guardrails that define identity by exclusion. | Builders default to conventions of whatever product category they're most familiar with. |

### Domain 4: Visual & Interaction

| # | Area | Description | When Missing |
|---|---|---|---|
| 4.1 | **Design System** | Colors, typography, spacing, component specs. The visual language. | Multiple builders produce screens that look like they belong to different products. |
| 4.2 | **Interaction Patterns** | How do drag-and-drop, modals, transitions, and gestures work? | Interactions feel inconsistent across the product. |
| 4.3 | **Prototypes / Mockups** | Visual references for what screens look like. Figma files, screenshots, Storybook stories. | Builders guess at layout and visual design, producing inconsistent results. |
| 4.4 | **Accessibility Standards** | WCAG level, screen reader requirements, keyboard navigation, color contrast minimums. | Accessibility is applied inconsistently or forgotten entirely. |

### Domain 5: Decision History

| # | Area | Description | When Missing |
|---|---|---|---|
| 5.1 | **Key Decisions Log** | What was decided, when, and why. Especially: what was rejected and why. | Settled decisions get relitigated. Past mistakes get repeated. |
| 5.2+5.4 | **Institutional Memory** | Lessons learned, postmortems, failed approaches, historic documents. | The most expensive failure: weeks rediscovering that an approach doesn't work. |
| 5.3 | **Roadmap** | What's coming. What's explicitly deferred. Release sequence. | Builders design features that conflict with planned work. |

---

## Pool Membership

Areas enter the pool at specific AI modes. Each mode includes all areas from lower modes plus new additions.

| Mode | Adds | Cumulative |
|---|---|---|
| **No/Low AI** | 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.5, 4.1, 5.1 | 10 |
| **Short-Order Cook** | 2.3 Product Entities, 4.2 Interaction Patterns, 4.3 Prototypes | 13 |
| **Pair Programmer** | 1.4 Competitive Analysis, 2.4 System Design, 3.3 Engagement Loops, 3.4 Progression/Mastery, 5.3 Roadmap | 18 |
| **Factory** | 1.5 Market Requirements, 2.5 Full GDD/PRD, 4.4 Accessibility, 5.2+5.4 Institutional Memory | 22 |

---

## All 36 Configurations

### Mode 1: No/Low AI (10 areas)

**Primary risk:** Implicit alignment — the team thinks they agree but they don't.

**Foundation (all configs):** Product Vision (1.1), Product Strategy (1.2), Noun Vocabulary (2.2)

| # | Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1 | Product Vision | F | F | F | F | F | F | F | F | F |
| 1.2 | Product Strategy | F | F | F | F | F | F | F | F | F |
| 1.3 | User Personas | C | C | C | C | C | A | A | A | A |
| 2.1 | Information Architecture | C | A | D | C | A | D | C | A | D |
| 2.2 | Noun Vocabulary | F | F | F | F | F | F | F | F | F |
| 3.1 | User Journey Maps | C | A | D | C | A | D | C | A | D |
| 3.2 | Emotional Goals | C | C | C | A | A | A | D | D | D |
| 3.5 | Anti-Patterns | C | C | C | A | A | A | D | D | D |
| 4.1 | Design System | C | A | A | C | A | A | C | A | A |
| 5.1 | Key Decisions Log | C | A | A | C | A | A | C | A | A |

**Distribution:**

| Config | F | C | A | D |
|---|---|---|---|---|
| H/H | 3 | 7 | 0 | 0 |
| H/M | 3 | 3 | 4 | 0 |
| H/L | 3 | 2 | 3 | 2 |
| M/H | 3 | 4 | 3 | 0 |
| M/M | 3 | 1 | 6 | 0 |
| M/L | 3 | 0 | 4 | 3 |
| L/H | 3 | 4 | 1 | 2 |
| L/M | 3 | 0 | 5 | 2 |
| L/L | 3 | 0 | 3 | 4 |

**Key patterns:**
- At M/L, L/M, and L/L there are 0 Core areas. Foundation alone provides the alignment a human-centric team needs at these configurations. Present this positively: "Your configuration needs a lightweight library."
- H/H is all-or-nothing: every area is Foundation or Core.
- Design System and Decisions Log are complexity-sensitive at this mode (Core at high complexity, Amplifier otherwise).

---

### Mode 2: Short-Order Cook (13 areas)

**Primary risk:** Context loss at handoff — the product person's intent doesn't survive translation to a task spec.

**Foundation (all configs):** Product Vision (1.1), Noun Vocabulary (2.2), Design System (4.1)

| # | Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1 | Product Vision | F | F | F | F | F | F | F | F | F |
| 1.2 | Product Strategy | C | C | C | C | C | C | C | C | A |
| 1.3 | User Personas | C | C | C | C | C | A | A | A | A |
| 2.1 | Information Architecture | C | A | D | C | A | D | C | A | D |
| 2.2 | Noun Vocabulary | F | F | F | F | F | F | F | F | F |
| 2.3 | Product Entities | C | C | A | C | C | A | C | C | A |
| 3.1 | User Journey Maps | C | A | D | C | A | D | C | A | D |
| 3.2 | Emotional Goals | C | C | C | A | A | A | D | D | D |
| 3.5 | Anti-Patterns | C | C | C | A | A | A | D | D | D |
| 4.1 | Design System | F | F | F | F | F | F | F | F | F |
| 4.2 | Interaction Patterns | C | C | A | C | C | A | C | C | A |
| 4.3 | Prototypes / Mockups | C | C | C | C | C | C | C | C | C |
| 5.1 | Key Decisions Log | A | A | A | A | A | A | A | A | A |

**Distribution:**

| Config | F | C | A | D |
|---|---|---|---|---|
| H/H | 3 | 9 | 1 | 0 |
| H/M | 3 | 7 | 3 | 0 |
| H/L | 3 | 4 | 4 | 2 |
| M/H | 3 | 6 | 4 | 0 |
| M/M | 3 | 4 | 6 | 0 |
| M/L | 3 | 2 | 6 | 2 |
| L/H | 3 | 5 | 3 | 2 |
| L/M | 3 | 3 | 5 | 2 |
| L/L | 3 | 1 | 5 | 4 |

**Key patterns:**
- Design System is Foundation (not Core). Every bounded task produces UI — the visual language is consumed as constantly as Vocabulary.
- Prototypes is always Core — "show don't tell" is the universal tool for bounded-task handoff.
- Decisions Log is always Amplifier. Bounded tasks rarely encounter settled decisions; the task spec already reflects them.
- Strategy drops to Amplifier only at L/L — the most conventional + simple configuration.
- Anti-Patterns and Emotional Goals mirror each other perfectly (both novelty-sensitive in the same pattern).

---

### Mode 3: Pair Programmer (18 areas)

**Primary risk:** Misaligned proposals — technically elegant solutions that are product-wrong.

**Foundation (all configs):** Product Vision (1.1), Product Strategy (1.2), Noun Vocabulary (2.2), Anti-Patterns (3.5)

| # | Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1 | Product Vision | F | F | F | F | F | F | F | F | F |
| 1.2 | Product Strategy | F | F | F | F | F | F | F | F | F |
| 1.3 | User Personas | C | C | C | C | C | C | A | A | A |
| 1.4 | Competitive Analysis | A | A | A | C | C | C | C | C | C |
| 2.1 | Information Architecture | C | A | A | C | A | A | C | A | A |
| 2.2 | Noun Vocabulary | F | F | F | F | F | F | F | F | F |
| 2.3 | Product Entities | C | C | A | C | C | A | C | C | A |
| 2.4 | System Design | C | C | A | C | C | A | C | C | A |
| 3.1 | User Journey Maps | C | A | A | C | A | A | C | A | D |
| 3.2 | Emotional Goals | C | C | C | A | A | A | D | D | D |
| 3.3 | Engagement Loops | C | A | D | C | A | D | C | A | D |
| 3.4 | Progression / Mastery | C | C | A | A | A | D | A | D | D |
| 3.5 | Anti-Patterns | F | F | F | F | F | F | F | F | F |
| 4.1 | Design System | C | C | C | C | C | C | C | C | C |
| 4.2 | Interaction Patterns | C | A | A | C | A | A | C | A | A |
| 4.3 | Prototypes / Mockups | C | C | C | C | C | C | C | C | C |
| 5.1 | Key Decisions Log | C | C | A | C | C | A | C | C | A |
| 5.3 | Roadmap | C | C | A | C | C | A | C | C | A |

**Distribution:**

| Config | F | C | A | D |
|---|---|---|---|---|
| H/H | 4 | 13 | 1 | 0 |
| H/M | 4 | 8 | 6 | 0 |
| H/L | 4 | 4 | 8 | 2 |
| M/H | 4 | 11 | 3 | 0 |
| M/M | 4 | 6 | 7 | 1 |
| M/L | 4 | 4 | 6 | 4 |
| L/H | 4 | 11 | 2 | 1 |
| L/M | 4 | 6 | 7 | 1 |
| L/L | 4 | 3 | 7 | 4 |

**Key patterns:**
- Design System is always Core. The pair programmer proposes designs AND implements them — proposals must be design-system-aware, and the implementation that follows needs visual guidance. Not Foundation (the primary activity is still design discussion), but always Core.
- Decisions Log is Core in most configs. This is the mode where relitigating settled decisions is the costliest error.
- Competitive Analysis is inversely novelty-sensitive: Amplifier at high novelty, Core at low novelty. Differentiation in an established category IS the identity.
- Prototypes is stable at Core across all configs — important at high novelty (can't visualize pioneering products from description) and at low novelty (faster reference than explanation).
- Emotional Goals at low novelty → Deprioritized. The category provides emotional direction; the builder can infer the right register.

---

### Mode 4: Factory (22 areas)

**Primary risk:** Silent wrong defaults — hundreds of autonomous micro-decisions that individually seem minor but cumulatively define the product experience.

**Foundation (all configs):** Product Vision (1.1), Product Strategy (1.2), Noun Vocabulary (2.2), Anti-Patterns (3.5), Emotional Goals (3.2)

| # | Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.1 | Product Vision | F | F | F | F | F | F | F | F | F |
| 1.2 | Product Strategy | F | F | F | F | F | F | F | F | F |
| 1.3 | User Personas | C | C | C | C | C | C | C | A | A |
| 1.4 | Competitive Analysis | A | A | A | C | C | C | C | C | C |
| 1.5 | Market Requirements | A | A | A | A | A | A | C | C | C |
| 2.1 | Information Architecture | C | A | A | C | A | A | C | A | A |
| 2.2 | Noun Vocabulary | F | F | F | F | F | F | F | F | F |
| 2.3 | Product Entities | C | C | A | C | C | A | C | C | A |
| 2.4 | System Design | C | C | A | C | C | A | C | C | A |
| 2.5 | Full GDD / PRD | C | A | D | C | A | D | C | A | D |
| 3.1 | User Journey Maps | C | A | D | C | A | D | C | A | D |
| 3.2 | Emotional Goals | F | F | F | F | F | F | F | F | F |
| 3.3 | Engagement Loops | C | A | D | C | A | D | C | A | D |
| 3.4 | Progression / Mastery | C | C | C | A | A | D | A | D | D |
| 3.5 | Anti-Patterns | F | F | F | F | F | F | F | F | F |
| 4.1 | Design System | C | C | C | C | C | C | C | C | C |
| 4.2 | Interaction Patterns | C | C | A | C | C | A | C | C | A |
| 4.3 | Prototypes / Mockups | C | C | C | C | C | C | C | C | C |
| 4.4 | Accessibility Standards | C | C | A | C | C | A | C | C | A |
| 5.1 | Key Decisions Log | C | C | A | C | C | A | C | C | A |
| 5.2+5.4 | Institutional Memory | C | A | A | C | A | A | C | A | A |
| 5.3 | Roadmap | C | C | A | C | C | A | C | C | A |

**Distribution:**

| Config | F | C | A | D |
|---|---|---|---|---|
| H/H | 5 | 15 | 2 | 0 |
| H/M | 5 | 10 | 7 | 0 |
| H/L | 5 | 4 | 10 | 3 |
| M/H | 5 | 13 | 4 | 0 |
| M/M | 5 | 9 | 7 | 1 |
| M/L | 5 | 4 | 9 | 4 |
| L/H | 5 | 15 | 2 | 0 |
| L/M | 5 | 10 | 6 | 1 |
| L/L | 5 | 4 | 9 | 4 |

**Key patterns:**
- High complexity dominates. All three high-complexity configs have 13-15 Core areas. Complexity pulls 8 structural areas to Core before novelty has its say.
- Design System and Prototypes are always Core — the closest any non-Foundation area gets to Foundation status.
- Competitive Analysis and Market Requirements are inversely novelty-sensitive. Amplifier at high novelty (no established market to analyze), Core at low novelty (the agent's training data contains thousands of similar products — differentiation IS the identity).
- Nothing is ever Deprioritized at high complexity. When systems are interconnected, every knowledge area has at least indirect relevance.
- Progression/Mastery follows a diagonal: Core at high novelty, Deprioritized at low novelty + low complexity. It's one of the few areas sensitive to BOTH axes.
- Factory H/H has 15 Core areas. This is intentional — autonomous agents on a pioneering complex product genuinely need that much context. If this feels overwhelming, consider whether Factory mode is appropriate.

---

## Cross-Mode Patterns

### Foundation Escalation

Foundation areas widen with autonomy:

| Mode | Foundation Areas | Count |
|---|---|---|
| No/Low AI | Vision, Strategy, Vocabulary | 3 |
| Short-Order Cook | Vision, Vocabulary, Design System | 3 |
| Pair Programmer | Vision, Strategy, Vocabulary, Anti-Patterns | 4 |
| Factory | Vision, Strategy, Vocabulary, Anti-Patterns, Emotional Goals | 5 |

Design System is Foundation only at Short-Order Cook (every bounded task produces UI). At Pair Programmer and Factory it's Core — the builder proposes AND implements, so visual guidance is essential but not prerequisite for other knowledge.

### Competitive Analysis Inverse Pattern

The most counter-intuitive pattern in the wizard:

| Novelty | Tier | Why |
|---|---|---|
| High | Amplifier | No established category to analyze. Your competition is "not doing this at all." |
| Moderate | Core | Clear competitive landscape. Differentiation strategy is known and must guide builders. |
| Low | Core | The agent's training data contains thousands of similar products. Without explicit competitive differentiation, it will build the category-generic version. |

### Design System: Activity-Dependent

Design System follows the activity at each mode, not the autonomy gradient:

| Mode | Tier | Why |
|---|---|---|
| No/Low AI | Amplifier (Core at high complexity) | Team reference — humans are in the room. |
| Short-Order Cook | **Foundation** | Implementation substrate — every bounded task produces UI. |
| Pair Programmer | **Core (always)** | Proposes AND implements — proposals must be design-system-aware, implementation needs visual guidance. |
| Factory | **Core (always)** | Autonomous UI production — the agent produces screens on every task. |

The Foundation spike at Short-Order Cook is the distinctive feature — the mode where Design System is consumed on literally every task.

### Deprioritized at L/L

Four areas are consistently Deprioritized at Low Novelty / Low Complexity across all modes where they're in the pool:

- Information Architecture (2.1)
- User Journey Maps (3.1)
- Emotional Goals (3.2)
- Anti-Patterns (3.5)

Simple, conventional products don't have enough edge cases, complex flows, or identity ambiguity to justify early seeding of these areas.

---

## How the Engine Works

Every tier assignment is produced by three mechanisms:

```
1. FOUNDATION CHECK  → Is this area Foundation at this mode? If yes → Foundation.
2. SENSITIVITY       → What tier do novelty and complexity each imply?
3. MODE FLOOR        → What's the minimum tier at this mode?

final_tier = max(foundation, max(novelty_tier, complexity_tier), floor)
```

The max() rule means: if EITHER novelty or complexity pushes an area up, it goes up. This works for 95%+ of cells.

### Anomalies (handled by override rules)

1. **Progression / Mastery (3.4):** Genuine interaction effect — novelty sets the ceiling, complexity modulates within it. Uses a 3×3 lookup table instead of independent profiles.
2. **Journey Maps at Pair Programmer (3.1):** Novelty-gated floor — Amplifier unless novelty is Low.
3. **Design System at No/Low AI (4.1):** Mode-specific complexity sensitivity — Core at high complexity, Amplifier otherwise.

---

## Strategy Note: Product Thesis

The wizard catalogs "Product Strategy" (1.2) because most teams start there. But the ceiling is **Product Thesis** — testable, falsifiable claims with counter-theses, validation criteria, and invalidation signals. Three subtypes: Problem Thesis, Solution Thesis, Plank Thesis.

The wizard's solicitation prompts for Strategy should nudge teams toward thesis-level articulation when they're ready for it. Strategy is the floor; Product Thesis is the ceiling.
