# Phase 4: Patterns & Compressed Engine

Status: **Locked** (reviewed and approved)

## What This Phase Does

Phase 3 produced 36 configuration tables — the complete decision output. Phase 4 finds the rules that generate them. The goal: a compressed model that can produce the right tier assignment for any (mode, novelty, complexity, area) input, replacing 432 individual cell lookups with a small set of composable rules.

This is what drives the wizard engine in Phase 5.

---

## The Three Mechanisms

Every tier assignment in the 36 tables is produced by three mechanisms operating in sequence:

```
1. FOUNDATION CHECK     → Is this area Foundation at this mode? If yes, done.
2. SENSITIVITY PROFILES → What tier do novelty and complexity imply?
3. MODE FLOOR           → What's the minimum tier at this mode?

final_tier = max(foundation, max(novelty_tier, complexity_tier), floor)
```

### Mechanism 1: Foundation Check

Foundation membership is determined solely by mode. It never changes with novelty or complexity.

| Area | No/Low AI | Short-Order Cook | Pair Programmer | Factory |
|---|---|---|---|---|
| 1.1 Product Vision | F | F | F | F |
| 1.2 Product Strategy | F | — | F | F |
| 2.2 Noun Vocabulary | F | F | F | F |
| 3.2 Emotional Goals | — | — | — | F |
| 3.5 Anti-Patterns | — | — | F | F |
| 4.1 Design System | — | F | — | — |

**Pattern:** Foundation widens monotonically with autonomy (3 → 3 → 4 → 5), with one exception: Design System is Foundation only at Short-Order Cook (every bounded task produces UI). At Pair Programmer and Factory it's Core — the builder proposes AND implements, so visual guidance is essential but not prerequisite for other knowledge.

### Mechanism 2: Sensitivity Profiles

Each non-Foundation area has a **novelty profile** and a **complexity profile** that determine what tier that axis implies.

#### Novelty Profiles

| Profile | High | Moderate | Low | Areas using it |
|---|---|---|---|---|
| **N+strong** | C | A | D | Anti-Patterns*, Emotional Goals*, Progression |
| **N+mild** | C | C | A | Personas |
| **N-standard** | A | C | C | Competitive Analysis |
| **N-delayed** | A | A | C | Market Requirements |
| **N-none** | — | — | — | All others |

*At modes where these areas are not Foundation.

**Reading the table:** "N+strong at High novelty implies Core" means that axis pushes the area toward Core. The other axis (complexity) may push differently; the combination rule resolves conflicts.

#### Complexity Profiles

| Profile | High | Moderate | Low | Areas using it |
|---|---|---|---|---|
| **C+strong** | C | A | D | IA, Journey Maps, GDD/PRD, Engagement Loops |
| **C+moderate** | C | C | A | Product Entities, System Design, Interaction Patterns, Decisions Log, Roadmap, Accessibility |
| **C+mild** | C | A | A | Institutional Memory |
| **C-none** | — | — | — | All others |

#### Combination Rule

When an area has both a novelty profile and a complexity profile, the combination rule is:

**`final = max(novelty_implied_tier, complexity_implied_tier)`**

This means: if EITHER axis pushes the area up, it goes up. High complexity can elevate an area even at low novelty, and vice versa. Being strong on one axis is sufficient.

**Example:** IA (2.1) has N-none + C+strong.
- At H/L: novelty=none, complexity=D → D (only complexity matters)
- At L/H: novelty=none, complexity=C → C (complexity dominates)
- At H/H: novelty=none, complexity=C → C

**Example:** Competitive Analysis (1.4) has N-standard + C-none.
- At H/H: novelty=A, complexity=none → A (novelty dominates, inversely)
- At L/L: novelty=C, complexity=none → C (inverse: MORE important at low novelty)

### Mechanism 3: Mode Floor

Each area has a **minimum tier** at each mode that prevents it from dropping below a threshold, regardless of what the sensitivity profiles imply. The floor reflects the structural importance of an area at that mode — some areas are never Deprioritized at Factory because the autonomous agent always needs at least a baseline of that knowledge.

#### Floor Table

| Area | No/Low AI | Short-Order Cook | Pair Programmer | Factory |
|---|---|---|---|---|
| 1.2 Product Strategy | F | A | F | F |
| 1.3 User Personas | A | A | A | A |
| 1.4 Competitive Analysis | — | — | A | A |
| 1.5 Market Requirements | — | — | — | A |
| 2.1 Information Architecture | D | D | A | A |
| 2.3 Product Entities | — | A | A | A |
| 2.4 System Design | — | — | A | A |
| 2.5 Full GDD / PRD | — | — | — | D |
| 3.1 User Journey Maps | D | D | D* | D |
| 3.2 Emotional Goals | D | D | D | F |
| 3.3 Engagement Loops | — | — | D | D |
| 3.4 Progression / Mastery | — | — | D | D |
| 3.5 Anti-Patterns | D | D | F | F |
| 4.1 Design System | A | F | C | C |
| 4.2 Interaction Patterns | — | A | A | A |
| 4.3 Prototypes / Mockups | — | C | C | C |
| 4.4 Accessibility Standards | — | — | — | A |
| 5.1 Key Decisions Log | A | A | A | A |
| 5.2+5.4 Institutional Memory | — | — | — | A |
| 5.3 Roadmap | — | — | A | A |

`—` = area not in pool at this mode. `*` = see anomalies.

**Key floor patterns:**

- **Prototypes:** Floor = C at Short-Order Cook and above. Always at least Core when in the pool, because visual reference is universally useful for implementation.
- **Design System:** Floor = C at Factory and Pair Programmer (the builder proposes AND implements), F at Short-Order Cook (implementation substrate), A at No/Low AI.
- **Factory has the highest floors.** Most areas are floored at A, meaning nothing beyond Foundation is ever Deprioritized at Factory. The autonomous agent always needs at least baseline knowledge of everything in its pool.

---

## Area Behavior Profiles

Each area's complete behavior across all modes, compressed into one entry.

### 1.1 Product Vision
**Foundation everywhere.** The anchor that every other piece of knowledge references. No exceptions, no sensitivity. The most stable area in the entire wizard.

### 1.2 Product Strategy
**Foundation at 3 of 4 modes.** Foundation at No/Low AI (team alignment), Pair Programmer (design participation), and Factory (autonomous decisions). Drops to Core at Short-Order Cook because bounded-task executors don't need strategic context — they need to execute a spec. Floor = A at Short-Order Cook (still useful for interpreting ambiguous specs). No novelty or complexity sensitivity.

### 1.3 User Personas
**N+mild, C-none.** Novelty-sensitive: Core at high + moderate novelty (can't infer users from a nonexistent or partially-familiar category), Amplifier at low novelty (category norms describe the user). No complexity sensitivity. Floor = A at all modes. The weakest assignment at Factory L/L (Amplifier) — most likely to be revised after Milestone 1 data.

### 1.4 Competitive Analysis
**N-standard, C-none.** Inversely novelty-sensitive: Amplifier at high novelty (no direct competitors), Core at moderate + low novelty (differentiation IS the product identity in established categories). No complexity sensitivity. Only in pool at Pair Programmer and Factory. Floor = A.

### 1.5 Market Requirements
**N-delayed, C-none.** Inversely novelty-sensitive with a delay: Amplifier at high + moderate novelty, Core at low novelty (evidence grounds the agent in this specific market, not the generic category). Only in pool at Factory. Floor = A.

### 2.1 Information Architecture
**N-none, C+strong.** Purely complexity-sensitive: Core at high complexity (many spaces need a shared map), Amplifier at moderate, Deprioritized at low (few screens need no map). Floor varies by mode: D at No/Low AI and Short-Order Cook, A at Pair Programmer and Factory.

### 2.2 Noun Vocabulary
**Foundation everywhere.** Shared language — every other card references product terms. Alongside Vision, the only area that never leaves Foundation regardless of mode, novelty, or complexity.

### 2.3 Product Entities
**N-none, C+moderate.** Complexity-sensitive: Core at high + moderate complexity (interconnected objects), Amplifier at low (simple objects). Floor = A at Short-Order Cook and above. No novelty sensitivity.

### 2.4 System Design
**N-none, C+moderate.** Same profile as Product Entities. Core at high + moderate complexity, Amplifier at low. Only in pool at Pair Programmer and Factory. Floor = A.

### 2.5 Full GDD / PRD
**N-none, C+strong.** Strongly complexity-sensitive: Core at high complexity (edge cases in complex products), Amplifier at moderate, Deprioritized at low (simple products have few edge cases). Only in pool at Factory. Floor = D (can be fully deprioritized at Factory low-complexity).

### 3.1 User Journey Maps
**N-none, C+strong.** Same complexity profile as IA, GDD/PRD, and Engagement Loops: Core at high, Amplifier at moderate, Deprioritized at low. Floor varies by mode: D at most modes. See anomaly note.

### 3.2 Emotional / Aesthetic Goals
**N+strong at non-Foundation modes, Foundation at Factory.** When not Foundation: Core at high novelty, Amplifier at moderate, Deprioritized at low. Mirrors Anti-Patterns' non-Foundation behavior exactly. Foundation at Factory because every autonomous micro-decision about tone, animation, and copy is an emotional decision.

### 3.3 Engagement Loops
**N-none, C+strong.** Purely complexity-sensitive: Core at high complexity (retention mechanics in interconnected products), Amplifier at moderate, Deprioritized at low (simple products may not have loops). Only in pool at Pair Programmer and Factory. Floor = D.

### 3.4 Progression / Mastery
**Special case — see anomalies.** The only area with a true interaction effect between novelty and complexity. Generally: novelty-primary, high novelty gives C regardless of complexity, but low novelty + low complexity drops to D. See detailed rule below.

### 3.5 Anti-Patterns
**N+strong at non-Foundation modes, Foundation at Pair Programmer + Factory.** When not Foundation: Core at high novelty (prevent mapping to wrong category), Amplifier at moderate, Deprioritized at low (category provides guardrails). Foundation at higher modes because the guardrails define the solution space boundary — prerequisite for evaluating all other knowledge.

### 4.1 Design System
**Activity-dependent — see floor table.** Foundation at Short-Order Cook (every bounded task produces UI — the implementation substrate). Core at Pair Programmer and Factory — the pair programmer proposes designs AND implements them (or directs implementation that must be design-system-aware), and the Factory agent produces UI autonomously. Amplifier at No/Low AI (humans reference it). Mild complexity sensitivity at No/Low AI only (Core at high complexity for multi-screen visual consistency).

### 4.2 Interaction Patterns
**N-none, C+moderate.** Complexity-sensitive: Core at high + moderate complexity, Amplifier at low. Only in pool at Short-Order Cook and above. Floor = A.

### 4.3 Prototypes / Mockups
**Stable at Core.** Floor = C at all modes where it's in the pool (Short-Order Cook and above). No novelty or complexity sensitivity. Important at high novelty (can't visualize from text), important at low novelty (faster than explanation). The most stable non-Foundation area in the wizard.

### 4.4 Accessibility Standards
**N-none, C+moderate.** Complexity-sensitive: Core at high + moderate complexity, Amplifier at low. Only in pool at Factory. Floor = A.

### 5.1 Key Decisions Log
**N-none, C+moderate. Mode-sensitive floor.** Complexity-sensitive: Core at high + moderate complexity, Amplifier at low. Floor = A at all modes (always at least Amplifier — settled decisions are always worth knowing). Most mode-sensitive area: always Amplifier at Short-Order Cook (bounded tasks don't encounter settled decisions), Core across most configs at Pair Programmer (relitigating settled decisions wastes the most time), Core across most configs at Factory.

### 5.2+5.4 Institutional Memory
**N-none, C+mild.** Mildly complexity-sensitive: Core at high complexity (past mistakes compound in interconnected systems), Amplifier at moderate + low. Only in pool at Factory. Floor = A.

### 5.3 Roadmap
**N-none, C+moderate.** Complexity-sensitive: Core at high + moderate complexity, Amplifier at low. Only in pool at Pair Programmer and Factory. Floor = A.

---

## Anomalies

### Progression / Mastery (3.4) — Interaction Effect

Progression is the only area where novelty and complexity don't combine via simple `max()`. Its tier depends on the combination:

| | High Complexity | Moderate Complexity | Low Complexity |
|---|---|---|---|
| **High Novelty** | C | C | C |
| **Moderate Novelty** | A | A | D |
| **Low Novelty** | A | D | D |

**Rule:** Novelty sets the ceiling. High novelty → C regardless of complexity. Below that, low values on EITHER axis can push the area down. This reflects reality: progression mechanics tend to exist in novel OR complex products, but conventional simple products almost never have them. At moderate levels, the presence of progression is uncertain — one low axis tips the balance.

**Implementation:** This area needs a lookup table rather than composed profiles. It's a 3×3 grid applied identically at all modes where it's in the pool (Pair Programmer, Factory). At modes where Progression is not in the pool, it's excluded.

### Journey Maps (3.1) — Novelty-Gated Floor at Pair Programmer

Journey Maps follows C+strong (H→C, M→A, L→D) at most modes. But at Pair Programmer, the low-complexity tier depends on novelty:

- H/L and M/L: Amplifier (floor prevents drop to D)
- L/L: Deprioritized (floor doesn't apply)

This means the floor at Pair Programmer is conditionally A unless novelty is Low. At low novelty + low complexity, the builder's category experience makes journey documentation unnecessary. At high/moderate novelty + low complexity, even a simple product needs journey documentation when the category is unfamiliar.

**Implementation:** Apply C+strong, then apply floor of A only when novelty is not Low. Or equivalently: the floor at Pair Programmer is `novelty == Low ? D : A`.

### Design System (4.1) — Activity-Dependent Across Modes

Design System's behavior across modes is:

| No/Low AI | Short-Order Cook | Pair Programmer | Factory |
|---|---|---|---|
| Core (high cmplx) / Amplifier | **Foundation** | **Core** | **Core** |

This follows the activity, not the autonomy gradient. The Foundation spike at Short-Order Cook reflects that every bounded task produces UI — the Design System is consumed on literally every task. At Pair Programmer and Factory, the builder proposes AND implements (or directs implementation), so the Design System is always Core — proposals must be design-system-aware, and the implementation that follows needs visual guidance. At No/Low AI, humans are in the room and reference the Design System occasionally. Implementation must handle Design System with a per-mode floor rather than a sensitivity profile.

---

## Structural Findings

### Finding 1: Complexity dominates tier distribution

At high complexity, 6-8 areas are pulled to Core by the complexity profiles alone. Combined with Foundation (3-5) and stable Core areas (Prototypes, Design System at some modes), this leaves very few areas below Core. The novelty dimension shuffles 2-4 areas in the remaining slots.

**Implication for the wizard:** High complexity configurations have the least variance. The recommendation is "you need almost everything." The wizard's value-add at high complexity is primarily in Foundation/Core sequencing (what to seed FIRST within Core), not in differentiating what's Core vs. Amplifier.

### Finding 2: Novelty creates the most distinctive recommendations

The off-diagonal configs (H/L, L/H) produce the most differentiated recommendations:
- **H/L (pioneering + simple):** Identity knowledge is Core, structural knowledge is Deprioritized. "What IS this?" matters; "how does it connect?" doesn't.
- **L/H (conventional + complex):** Structural knowledge is Core, identity knowledge is Deprioritized. "How does it connect?" matters; "what IS this?" is answered by the category.

**Implication for the wizard:** These configs are where the wizard provides the most surprising value. A team building a pioneering simple product wouldn't intuitively prioritize Anti-Patterns and Emotional Goals over IA and Journey Maps — but the wizard correctly does.

### Finding 3: Four areas are consistently Deprioritized at L/L

Across all modes, these four areas land at Deprioritized when both novelty and complexity are low:
- Information Architecture (2.1)
- User Journey Maps (3.1)
- Engagement Loops (3.3) — at modes where it's in the pool
- Progression / Mastery (3.4) — at modes where it's in the pool

These are the "you probably don't need to prioritize these" areas for conventional simple products. Plus GDD/PRD (2.5) and Anti-Patterns/Emotional Goals at modes where they're not Foundation.

### Finding 4: The sensitivity taxonomy is small

22 areas of product knowledge reduce to:
- 2 universal Foundation areas (Vision, Vocabulary)
- 3 escalating Foundation areas (Strategy, Anti-Patterns, Emotional Goals)
- 1 activity-dependent area (Design System)
- 1 anomalous area (Progression)
- 4 novelty-sensitive profiles (strong+, mild+, standard-, delayed-)
- 4 complexity-sensitive profiles (strong, moderate, mild, none)
- 1 stable always-Core area (Prototypes)

The entire wizard engine can be expressed as: Foundation lookup + sensitivity profile application + floor clamping, with one lookup table override for Progression.

### Finding 5: The max() combination rule works for 95%+ of cells

Of the 432 non-Foundation cells across all 36 configurations, the `max(novelty_tier, complexity_tier, floor)` rule correctly produces ~410+. The exceptions are:
- Progression/Mastery (~9 cells that need the lookup table)
- Journey Maps at Pair Programmer (~2-3 cells with the novelty-gated floor)
- Design System at No/Low AI (~3 cells with mode-specific complexity behavior)

This compression ratio (3 mechanisms + 1 override table → 432 cells) is strong enough to drive a wizard engine.

---

## Compressed Engine Specification

The following specification is sufficient to generate all 36 configuration tables:

### Input
```
mode:       "no_low_ai" | "short_order_cook" | "pair_programmer" | "factory"
novelty:    "high" | "moderate" | "low"
complexity: "high" | "moderate" | "low"
```

### Algorithm
```
for each area in catalog:
  1. If area not in pool(mode): skip
  2. If area is Foundation at mode: tier = Foundation
  3. Else:
     a. novelty_tier = novelty_profiles[area][novelty] or null
     b. complexity_tier = complexity_profiles[area][complexity] or null
     c. implied_tier = max(novelty_tier, complexity_tier) or Deprioritized
     d. tier = max(implied_tier, floor[area][mode])
  4. If area == "progression": tier = progression_lookup[novelty][complexity]
  5. If area == "journey_maps" and mode == "pair_programmer":
     apply novelty-gated floor
  6. If area == "design_system" and mode == "no_low_ai":
     tier = (complexity == "high") ? Core : Amplifier

return sorted areas by tier (Foundation → Core → Amplifier → Deprioritized)
```

### Data Tables Required

1. **Pool membership** (Phase 1) — 22 entries
2. **Foundation membership** — 6 area × 4 mode boolean table
3. **Novelty profiles** — 6 entries (4 profile types + none + stable)
4. **Complexity profiles** — 6 entries (4 profile types + none + stable)
5. **Floor table** — 22 area × 4 mode entries
6. **Progression lookup** — 3×3 grid
7. **Override rules** — 2-3 conditional rules

Total data: ~120 values to store. Generates 432 cells correctly.

---

## Wizard Question Framing & Guidance Prompts

The three wizard questions must be answerable by a product person without technical knowledge. Each question includes guidance prompts — concrete scenarios that help the user self-assess correctly.

### Important: Benchmark to the product, not the AI

The wizard measures **product attributes** (how novel, how interconnected), not AI capability gaps (what models are good/bad at). Product attributes are stable across model generations; AI capabilities change every 6 months. Even as AI improves, the priority ordering remains correct — a pioneering product will always need Anti-Patterns more than a conventional product.

The questions are framed as **inference gaps** ("would someone unfamiliar correctly guess?") without referencing AI capability. The "someone" is implicitly the AI, but it's also a new hire, a contractor, or a product person who just joined.

### Question 1: AI Mode

**"How much product decision authority do your AI builders have?"**

| Answer | Guidance prompt |
|---|---|
| **No/Low AI** | "A product person is present for every product decision. AI helps with autocomplete or brainstorming, but a human decides how things look, feel, and behave." |
| **Short-Order Cook** | "A product person scopes each task explicitly. The AI executes bounded work — 'build this modal,' 'add this validation' — but doesn't decide what to build or how it should feel." |
| **Pair Programmer** | "AI participates in design discussions. It proposes alternatives, evaluates trade-offs, and helps shape features — but a product person reviews and approves." |
| **Factory** | "AI is the primary implementer. It decides empty state copy, error message tone, default settings, information hierarchy — product micro-decisions that happen hundreds of times with no product person reviewing each one." |

**Disambiguation prompt:** "Think about the last 10 product decisions that were made (what copy to use, how a screen is laid out, what the default behavior is). How many of those did a product person explicitly make vs. how many did the builder decide on their own?"

### Question 2: Domain Novelty

**"If you described your product in one sentence, would someone from your industry correctly guess what using it feels like?"**

| Answer | Guidance prompt |
|---|---|
| **Low** | "We're in a well-known category. If I say 'it's a CRM' or 'it's a todo app,' people immediately picture something close to what we're building. Our users have strong expectations from existing products." |
| **Moderate** | "People recognize the space but not our approach. If I say 'it's a project management tool,' they'd get the purpose right but picture something very different from what we're actually building. We've taken a familiar problem and solved it in an unfamiliar way." |
| **High** | "There's no established category for what we're building. If I describe it in one sentence, people either look confused or immediately compare it to something it's NOT. We spend a lot of time explaining what the product ISN'T." |

**Disambiguation prompts:**
- "When you onboard a new team member, how long does it take them to 'get' the product vision? If the answer is 'immediately' → Low. If 'a few conversations' → Moderate. If 'weeks, and they keep reverting to wrong mental models' → High."
- "Do you find yourself frequently saying 'no, it's not like [familiar product]'? If rarely → Low. If sometimes → Moderate. If constantly → High."
- "Could a competitor copy your product by looking at screenshots? If yes → Low. If partially → Moderate. If they'd miss the entire point → High."

### Question 3: Product Complexity

**"When you make a product decision about one feature, how many other features does it typically affect?"**

| Answer | Guidance prompt |
|---|---|
| **Low** | "Our product does one thing well. Most features are independent — changing the settings page doesn't affect anything else. A wrong decision is contained to that feature." |
| **Moderate** | "Our features interact. Adding a new view might affect 2-3 other views. We sometimes discover that a change in one area broke something in another area. A wrong decision ripples to adjacent features." |
| **High** | "Our features create combined effects. Changing the scoring algorithm affects what gets recommended, which affects user behavior, which affects the engagement loop, which affects retention. A wrong decision can cascade through many interconnected systems." |

**Disambiguation prompts:**
- "Think about the last time you changed a product decision. Did you need to update one spec, or did you need to update several? One → Low. A few → Moderate. A chain reaction → High."
- "Does your product have 'invisible mechanisms' — things like scoring algorithms, recommendation engines, progression systems, or state machines that users don't directly see but that shape their experience? None → Low. A few → Moderate. Several interconnected ones → High."
- "If a new builder implements a feature perfectly according to its spec but doesn't know about the rest of the product, how likely is it to break something? Unlikely → Low. Possible → Moderate. Almost certain → High."

**Important: This question is about PRODUCT complexity, not technical complexity.** Your tech stack, framework choices, and deployment architecture don't factor in. A technically simple product (one framework, standard deployment) can have high product complexity (many interconnected features). A technically complex product (novel tech stack, distributed systems) can have low product complexity (one core workflow, independent features).

---

## QA Resolution

All four review questions were resolved through self-review from the AI agent's perspective:

1. **max() combination rule — confirmed.** If EITHER axis pushes an area up, it goes up. Having strong knowledge on one axis is sufficient. The axes operate on DIFFERENT areas, not on the SAME areas in opposing directions. High novelty + low complexity doesn't average out — it means strong identity knowledge and lightweight structural knowledge.

2. **Progression anomaly — accepted.** Progression is about a product feature that may or may not exist, not a knowledge dimension that's always relevant. Forcing it into max() would incorrectly make it Core at L/H (conventional complex products often DON'T have progression). The 3×3 lookup is 9 values — low cost, high accuracy.

3. **Design System activity-dependent — confirmed as feature.** It follows the activity, not the autonomy gradient. Foundation at Short-Order Cook (every task produces UI), Core at Pair Programmer and Factory (the builder proposes AND implements), Amplifier at No/Low AI (humans reference it). The per-mode floor handles this cleanly.

4. **Compression ratio — sufficient.** 120 values for the spec, ~40-50 unique values for implementation. Implementation can compress further; the spec should stay readable and debuggable.
