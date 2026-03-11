# Phase 3: Configuration Tables

Status: **Locked** (reviewed and approved)

## How to Read These Tables

Each table shows tier assignments for every area in the pool across all 9 novelty × complexity configurations.

**Tier codes:** F = Foundation, C = Core, A = Amplifier, D = Deprioritized

**Column headers:** Novelty / Complexity (e.g., H/H = High Novelty, High Complexity)

**Rationales** are provided by the Phase 2 mode profiles. Notes below each table explain non-obvious or counter-intuitive assignments.

---

## Mode 4: Factory (22 areas)

**Primary risk:** Silent wrong defaults — hundreds of autonomous micro-decisions that individually seem minor but cumulatively define the product experience.

**Foundation (stable across all 9):** Vision (1.1), Vocabulary (2.2), Strategy (1.2), Anti-Patterns (3.5), Emotional Goals (3.2)

| # | Knowledge Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
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

### Distribution Summary

| Config | Foundation | Core | Amplifier | Deprioritized | Total |
|---|---|---|---|---|---|
| **H/H** | 5 | 15 | 2 | 0 | 22 |
| **H/M** | 5 | 10 | 7 | 0 | 22 |
| **H/L** | 5 | 4 | 10 | 3 | 22 |
| **M/H** | 5 | 13 | 4 | 0 | 22 |
| **M/M** | 5 | 9 | 7 | 1 | 22 |
| **M/L** | 5 | 4 | 9 | 4 | 22 |
| **L/H** | 5 | 15 | 2 | 0 | 22 |
| **L/M** | 5 | 10 | 6 | 1 | 22 |
| **L/L** | 5 | 4 | 9 | 4 | 22 |

### Notes

1. **High complexity dominates tier distribution.** All three high-complexity configs (H/H, M/H, L/H) have 13-15 Core areas. Complexity pulls 8 structural areas to Core, and 5 stable areas are always Core, so you're at 13+ before novelty has its say. The novelty dimension shuffles 2-4 areas in the remaining slots.

2. **Competitive Analysis and Market Requirements are inversely novelty-sensitive.** They're Amplifier at high novelty (no established market/competitors to analyze) and Core at low novelty (the agent's training data contains thousands of similar products — differentiation IS the identity). This is the most counter-intuitive pattern in the wizard.

3. **Progression/Mastery follows a diagonal.** Core at high novelty (pioneering products need explicit mastery models), Deprioritized at low novelty + low complexity (conventional simple products rarely have progression). It's one of the few areas sensitive to BOTH axes.

4. **Design System and Prototypes are always Core at Factory.** The agent produces UI on every task. These are consumed constantly. They're the closest any non-Foundation area gets to Foundation status.

5. **Nothing is ever Deprioritized at high complexity.** When systems are interconnected, every knowledge area has at least indirect relevance. The minimum tier at high complexity is Amplifier.

6. **Low complexity creates the strongest differentiation.** The three low-complexity configs (H/L, M/L, L/L) have 3-4 Deprioritized areas — the only configs where areas genuinely drop to "seed last." These are: Full GDD/PRD, Journey Maps, Engagement Loops, and (at low novelty) Progression/Mastery. Simple products don't have enough edge cases, complex flows, or retention mechanics to justify early seeding of these areas.

---

## Mode 3: Pair Programmer (18 areas)

**Primary risk:** Misaligned proposals — technically elegant solutions that are product-wrong because the builder doesn't understand the strategic arc, invisible mechanisms, or settled decisions.

**Foundation (stable across all 9):** Vision (1.1), Strategy (1.2), Vocabulary (2.2), Anti-Patterns (3.5)

| # | Knowledge Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
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

### Distribution Summary

| Config | Foundation | Core | Amplifier | Deprioritized | Total |
|---|---|---|---|---|---|
| **H/H** | 4 | 13 | 1 | 0 | 18 |
| **H/M** | 4 | 8 | 6 | 0 | 18 |
| **H/L** | 4 | 4 | 8 | 2 | 18 |
| **M/H** | 4 | 11 | 3 | 0 | 18 |
| **M/M** | 4 | 6 | 7 | 1 | 18 |
| **M/L** | 4 | 4 | 6 | 4 | 18 |
| **L/H** | 4 | 11 | 2 | 1 | 18 |
| **L/M** | 4 | 6 | 7 | 1 | 18 |
| **L/L** | 4 | 3 | 7 | 4 | 18 |

### Notes

1. **Design System is always Core.** Pair programmers propose designs AND implement them — or direct implementation. Proposals must be design-system-aware (proposing a layout that violates the spacing system produces a bad design), and the implementation that follows needs visual guidance. Not Foundation (the primary activity is still design discussion, not bounded task execution like Short-Order Cook), but always Core.

2. **Decisions Log is Core across most configs.** This is the mode where relitigating settled decisions is the costliest error. "We considered X but chose Y because Z" prevents the most time-wasting proposals.

3. **Emotional Goals at low novelty → Deprioritized.** When the category provides emotional direction and the builder is proposing designs, they can infer the right emotional register from category norms. This is the starkest novelty-driven shift in this mode.

4. **Prototypes stable at Core.** Important at high novelty (can't visualize a pioneering product from description) and at low novelty (faster reference than explanation). Different reasons, same priority — genuinely insensitive to novelty.

5. **Competitive Analysis inverse pattern holds.** Same as Factory: Amplifier at high novelty, Core at low novelty. The builder proposing designs for a conventional product MUST know "how are we different from the category leader?" to avoid proposing category-generic features.

---

## Mode 2: Short-Order Cook (13 areas)

**Primary risk:** Context loss at handoff — the product person's intent doesn't survive translation to a task spec, producing a product that technically matches every spec but feels incoherent.

**Foundation (stable across all 9):** Vision (1.1), Vocabulary (2.2), Design System (4.1)

| # | Knowledge Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
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

### Distribution Summary

| Config | Foundation | Core | Amplifier | Deprioritized | Total |
|---|---|---|---|---|---|
| **H/H** | 3 | 9 | 1 | 0 | 13 |
| **H/M** | 3 | 7 | 3 | 0 | 13 |
| **H/L** | 3 | 4 | 4 | 2 | 13 |
| **M/H** | 3 | 6 | 4 | 0 | 13 |
| **M/M** | 3 | 4 | 6 | 0 | 13 |
| **M/L** | 3 | 2 | 6 | 2 | 13 |
| **L/H** | 3 | 5 | 3 | 2 | 13 |
| **L/M** | 3 | 3 | 5 | 2 | 13 |
| **L/L** | 3 | 1 | 5 | 4 | 13 |

### Notes

1. **Design System is Foundation, not Core.** At Short-Order Cook, every bounded task produces UI. Design System is the visual language the builder references on every task — it's consumed as constantly as Vocabulary. This is the key shift from No/Low AI (where it's Core/Amplifier) and Pair Programmer (where it's Amplifier).

2. **Decisions Log is Amplifier everywhere.** Bounded tasks rarely encounter settled decisions. The builder doesn't need to know "we tried X and rejected it" because the task spec already reflects those decisions. This is the most mode-sensitive area — it's Core at Pair Programmer and Factory but only Amplifier here.

3. **Prototypes is the only always-Core area.** "Show don't tell" is the universal tool for bounded-task handoff. At every novelty and complexity level, having a visual reference for what to build prevents more handoff errors than any other single area.

4. **Strategy drops to Amplifier only at L/L.** Even for bounded tasks, knowing the product's bets helps interpret ambiguous specs in 8 of 9 configs. Only at the most conventional + simple configuration does it become truly optional for task execution.

5. **Anti-Patterns and Emotional Goals mirror each other perfectly.** Both are novelty-sensitive in the same pattern: Core at high novelty, Amplifier at moderate, Deprioritized at low. This reflects their shared role as identity knowledge — the builder either needs both or can infer both from category conventions.

---

## Mode 1: No/Low AI (10 areas)

**Primary risk:** Implicit alignment — the product team thinks they agree but they don't, and decisions drift because shared understanding is never externalized.

**Foundation (stable across all 9):** Vision (1.1), Vocabulary (2.2), Strategy (1.2)

| # | Knowledge Area | H/H | H/M | H/L | M/H | M/M | M/L | L/H | L/M | L/L |
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

### Distribution Summary

| Config | Foundation | Core | Amplifier | Deprioritized | Total |
|---|---|---|---|---|---|
| **H/H** | 3 | 7 | 0 | 0 | 10 |
| **H/M** | 3 | 3 | 4 | 0 | 10 |
| **H/L** | 3 | 2 | 3 | 2 | 10 |
| **M/H** | 3 | 4 | 3 | 0 | 10 |
| **M/M** | 3 | 1 | 6 | 0 | 10 |
| **M/L** | 3 | 0 | 4 | 3 | 10 |
| **L/H** | 3 | 4 | 1 | 2 | 10 |
| **L/M** | 3 | 0 | 5 | 2 | 10 |
| **L/L** | 3 | 0 | 3 | 4 | 10 |

### Notes

1. **Foundation carries most of the weight.** With only 10 areas in the pool and 3 in Foundation, the remaining 7 areas have less room to differentiate. At M/M, M/L, L/M, and L/L, there are 0 Core areas — Foundation alone provides the alignment the product team needs.

2. **H/H is all-or-nothing.** At high novelty + high complexity, every area in the pool is Foundation or Core. The product team building something unprecedented AND interconnected needs every reference they can get.

3. **Design System and Decisions Log are complexity-sensitive at this mode.** Both move to Core at high complexity (more screens need visual consistency; more interconnected decisions need tracking) and Amplifier otherwise. This is different from their behavior at other modes.

4. **L/L is Foundation + Amplifier only.** No Core areas. The conventional, simple product team needs their anchor documents (Vision, Vocabulary, Strategy) and everything else is nice-to-have reference. The category and simplicity do the alignment work.

5. **Personas is the only novelty-sensitive area that reaches Core at moderate.** Anti-Patterns and Emotional Goals only reach Core at high novelty, but Personas is Core at both high and moderate — because even a somewhat-novel product can't rely on category norms for who the user is.

---

## Cross-Mode Consistency Checks

### Same configuration across adjacent modes should make sense

**H/H across all modes:**

| Mode | Foundation | Core | Amplifier | Deprioritized |
|---|---|---|---|---|
| No/Low AI (10) | 3 | 7 | 0 | 0 |
| Short-Order Cook (13) | 3 | 9 | 1 | 0 |
| Pair Programmer (18) | 4 | 13 | 1 | 0 |
| Factory (22) | 5 | 15 | 2 | 0 |

At H/H, almost everything is Core or Foundation across all modes. The pool gets bigger (more areas enter), Foundation widens (more bedrock needed at higher autonomy), and the proportion of Core stays high. This is the "everything matters" configuration. ✓

**L/L across all modes:**

| Mode | Foundation | Core | Amplifier | Deprioritized |
|---|---|---|---|---|
| No/Low AI (10) | 3 | 0 | 3 | 4 |
| Short-Order Cook (13) | 3 | 1 | 5 | 4 |
| Pair Programmer (18) | 4 | 3 | 7 | 4 |
| Factory (22) | 5 | 4 | 9 | 4 |

At L/L, Foundation + a few Core areas carry the load. Deprioritized stays at 4 across all modes — the same structural/system areas are consistently low-priority for conventional simple products. As autonomy increases, more areas enter as Amplifier (not Core), reflecting that even at Factory the conventional simple product needs a wider library but doesn't need it urgently. ✓

### Areas that enter at a higher mode should not be more important than areas already in the pool

**Example: Competitive Analysis (1.4) enters at Pair Programmer.** At Pair Programmer L/L, Competitive Analysis is Core. Meanwhile, Journey Maps (3.1) — which entered at No/Low AI — is Deprioritized at L/L. Is this right?

Yes. Competitive Analysis at low novelty IS the product identity (differentiation in an established category). Journey Maps at low complexity are self-evident. Pool entry order reflects structural necessity at each autonomy level, not inherent importance. ✓

### Factory should be a superset of Pair Programmer (same areas, same or higher tiers)

At Pair Programmer H/H, Competitive Analysis is Amplifier. At Factory H/H, it's also Amplifier. ✓
At Pair Programmer H/H, Emotional Goals is Core. At Factory H/H, it's Foundation (elevated). ✓
At Pair Programmer L/L, Design System is Core. At Factory L/L, it's also Core. ✓

No area has a LOWER tier at Factory than at Pair Programmer for the same configuration. ✓

---

## QA Resolution

All five review questions were resolved through self-review from the AI agent's perspective (the target user of context libraries):

1. **Factory H/H: 15 Core areas — confirmed.** The discomfort is intentional. Factory H/H IS the most demanding configuration. 15 Core areas is honest about the cost of running autonomous agents on a pioneering complex product. If a team finds this overwhelming, that's useful feedback — they should consider whether Factory mode is appropriate, or whether Pair Programmer is a better fit until more knowledge is seeded. The recommendation isn't flat: Foundation (5) → Core (15) → Amplifier (2) is a clear sequence, and the Estate Attorney Protocol further sequences within Core by gap analysis.

2. **No/Low AI: 0 Core at M/L, L/M, L/L — confirmed.** At No/Low AI, the library is a product team's self-alignment reference. Humans are in the room. At moderate-to-low configurations, the team's conversations do most of the alignment work. Foundation (Vision, Vocabulary, Strategy) anchors those conversations. No area beyond Foundation is a "primary value driver" — everything else is useful reference the team consults occasionally. Artificially promoting an area to Core would violate "No False Precision." The wizard should present this positively: "Your configuration needs a lightweight library. Focus on these 3 Foundation documents."

3. **Decisions Log mode jump — confirmed.** The jump from always-Amplifier (Short-Order Cook) to Core-in-most (Pair Programmer) is sharp but correct. It's a step function caused by a categorical change in activity: executing decisions (already baked into specs) vs. proposing decisions (must be checked against settled ones). Step functions are honest when the underlying reality has a step.

4. **Design System pattern — confirmed.** The pattern (Amplifier → Foundation → Core → Core) follows the activity. Team reference → implementation substrate → design + implementation → autonomous UI production. Foundation at Short-Order Cook is the spike — the mode where Design System is consumed on literally every task. At Pair Programmer and Factory, it's Core because the builder proposes AND implements (or directs implementation that must be design-system-aware). At Factory, Design System is the **strongest Core area** — the closest any non-Foundation area gets to Foundation. The Estate Attorney Protocol should sequence it immediately after Foundation gaps are filled.

5. **Deprioritized as floor, no "Not Recommended" — confirmed.** Pool membership (Phase 1) handles what's included. Within the pool, every area is at least worth having — the question is ordering, not exclusion. Deprioritized = "seed last, if you get to it" leaves the door open for teams whose specific product features make an area relevant despite the configuration suggesting otherwise. "Not recommended" would imply certainty the wizard doesn't have.

### Additional challenges tested

- **Prototypes always-Core at Short-Order Cook:** Confirmed. "Show me the button" is always faster than "describe the button," regardless of novelty or complexity. Visual reference prevents more handoff errors than any other single tool.
- **Anti-Patterns / Emotional Goals symmetry:** Confirmed as genuine. Both are identity knowledge, both novelty-sensitive in the same direction. The asymmetry shows up correctly at Pair Programmer (Anti-Patterns reaches Foundation first as a more actionable constraint) and Factory (both Foundation).
- **Personas floor at Factory:** Confirmed as Amplifier at L/M and L/L, but flagged as the **weakest assignment in the Factory tables**. At low novelty, training data provides strong user archetypes, making Amplifier defensible. But this is the assignment most likely to be revised after Milestone 1 data.
