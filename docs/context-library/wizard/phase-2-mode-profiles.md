# Phase 2: Mode Profiles — LOCKED

Status: **Locked** (reviewed and approved)

## How This Document Works

Each mode profile defines:
1. **Primary risk** — what goes wrong without sufficient product knowledge at this mode
2. **Foundation tendency** — what must exist first regardless of novelty/complexity
3. **Novelty modulation** — how novelty shifts priority within the pool
4. **Complexity modulation** — how complexity shifts priority within the pool
5. **Interaction effects** — where novelty and complexity compound or counteract

These profiles are the reasoning engine behind Phase 3's 36 configuration tables. They produce the *why* behind every tier assignment.

### Tier definitions (from the design doc)

- **Foundation** — must exist first; other knowledge depends on these for coherence
- **Core** — primary value drivers for this configuration; what changes most between configurations
- **Amplifier** — makes foundation and core more effective; valuable but not prerequisite
- **Deprioritized** — in the pool but low urgency for this configuration; seed last

### Key structural principle

**Foundation is stable within a mode.** The same 2-5 areas are Foundation for all 9 configurations within a mode. Core, Amplifier, and Deprioritized shift based on novelty and complexity. This reflects reality: the bedrock knowledge a team needs doesn't change because their product is novel or complex — but what they build ON that bedrock does.

---

## Mode 1: No/Low AI

**Pool:** 10 areas
**Who this is:** A product team using the library as shared reference. AI assists with autocomplete or brainstorming but makes no independent product decisions.

### Primary Risk

**Implicit alignment.** The team thinks they agree but they don't. Product understanding lives in people's heads, and different heads hold different versions. New team members absorb conflicting mental models from different people. Decisions drift because nothing anchors them.

### Foundation (stable across all 9 configs)

| # | Knowledge Area | Why it's foundational |
|---|---|---|
| 1.1 | Product Vision | The anchor. Every other piece of knowledge references this. Without it, the graph has no center of gravity. |
| 2.2 | Noun Vocabulary | Shared language. If people call things by different names, every conversation has hidden misunderstandings. Vocabulary is referenced by every other card in the library. |
| 1.2 | Product Strategy | The bets the team is making. Without this, people optimize for different outcomes and don't realize they disagree. |

### Novelty Modulation

**What novelty affects at this mode:** Whether the team can rely on existing category conventions for identity and experience guidance.

| Novelty | Effect on priorities |
|---|---|
| **High** | Anti-Patterns (3.5) become critical — team members will unconsciously map the product to familiar categories. Emotional Goals (3.2) become critical — no existing category provides emotional direction. The team needs explicit guardrails against their own defaults. User Personas (1.3) become more important — can't infer users from a nonexistent category. |
| **Moderate** | Anti-Patterns matter for the novel aspects specifically. Emotional Goals help distinguish from the familiar-but-different space the product occupies. |
| **Low** | Anti-Patterns are less urgent — the category itself provides guardrails. Emotional Goals can be lighter — category conventions set user and team expectations. User Personas can lean on category norms. BUT Strategy (1.2) and the implicit competitive differentiation become MORE important. In an established category, "what we are NOT" matters less than "how we are DIFFERENT." |

**Novelty-sensitive areas (move toward Core at high novelty, toward Deprioritized at low):**
- 3.5 Anti-Patterns
- 3.2 Emotional / Aesthetic Goals
- 1.3 User Personas (Core at high, Amplifier at low — can infer from category at low novelty)

### Complexity Modulation

**What complexity affects at this mode:** How much structural knowledge the team needs to stay aligned on "what goes where."

| Complexity | Effect on priorities |
|---|---|
| **High** | Information Architecture (2.1) becomes critical — many spaces/screens means people will organize things differently without a shared map. Key Decisions Log (5.1) becomes critical — many interconnected decisions need tracking to prevent relitigation. Journey Maps (3.1) become important — complex flows need explicit documentation. |
| **Moderate** | IA and Decisions Log are important but not urgent. Journey Maps help for key flows but don't need exhaustive coverage. |
| **Low** | IA is lightweight — few screens need no detailed map. Journey Maps are simple — flows are self-evident. Decisions Log is still useful but fewer decisions to track, so less urgent. |

**Complexity-sensitive areas (move toward Core at high complexity, toward Deprioritized at low):**
- 2.1 Information Architecture
- 3.1 User Journey Maps
- 5.1 Key Decisions Log (intensity, not presence — always at least Amplifier)

### Interaction Effects

**High novelty + High complexity:** The most demanding configuration. The team is building something unprecedented AND interconnected. Every area in the pool matters. Anti-Patterns and Emotional Goals are critical (novel), and IA and Journey Maps are critical (complex). Leaves very little deprioritized.

**Low novelty + Low complexity:** The least demanding configuration. The team is building something conventional and simple. Foundation still matters (Vision, Vocabulary, Strategy), but most other areas can be lightweight. The product category and simplicity do most of the alignment work.

**High novelty + Low complexity:** A pioneering but simple product. Identity knowledge (Anti-Patterns, Emotional Goals) is critical. Structural knowledge (IA, Journey Maps) is lightweight. The challenge is "what IS this?" not "how does it all connect?"

**Low novelty + High complexity:** A conventional but complex product. Structural knowledge (IA, Journey Maps, Decisions Log) is critical. Identity knowledge is less urgent — the category provides it. The challenge is "how does it all connect?" not "what IS this?"

### Remaining Areas

- **1.3 User Personas / JTBD** — novelty-sensitive. Core at high novelty (can't infer users from the category), Amplifier at low novelty (category norms describe the user).
- **4.1 Design System** — stable at Core or Amplifier. Visual language matters for consistency but isn't a prerequisite for other knowledge. Slightly more important at higher complexity (more screens = more visual consistency needed).

---

## Mode 2: Short-Order Cook

**Pool:** 13 areas (No/Low AI + Product Entities, Interaction Patterns, Prototypes)
**Who this is:** Product people scope each task explicitly. Builders execute bounded tasks. Product context must survive the handoff — builders can't ask mid-task.

### Primary Risk

**Context loss at handoff.** The product person's intent doesn't survive translation to a task spec. The builder executes the letter of the task but misses the spirit. Across many tasks, this produces a product that technically matches every spec but feels incoherent — like it was built by different people who never talked to each other. Because they didn't.

### Foundation (stable across all 9 configs)

| # | Knowledge Area | Why it's foundational |
|---|---|---|
| 1.1 | Product Vision | Anchors interpretation of ambiguous task specs. When the spec doesn't say, the builder needs to know what the product IS. |
| 2.2 | Noun Vocabulary | Task specs use product terms. If the builder doesn't know the vocabulary, they'll misinterpret instructions. |
| 4.1 | Design System | Visual consistency across bounded tasks. Every task produces UI; it all needs to look like one product. |

**Shift from No/Low AI:** Strategy (1.2) drops from Foundation to Core. At this mode, the builder doesn't need to understand the team's bets — they need to execute a spec. Vision and Vocabulary are the interpretation anchors; Strategy is context that helps but isn't prerequisite.

### Novelty Modulation

**What novelty affects at this mode:** Whether the builder's existing mental models will correctly fill gaps in the task spec.

| Novelty | Effect on priorities |
|---|---|
| **High** | Anti-Patterns (3.5) become critical — when the task spec is ambiguous, builders will fill gaps with familiar category patterns. The gaps are where the product gets built wrong. Vocabulary (2.2) is even more important — unfamiliar terms in task specs get silently misinterpreted. Emotional Goals (3.2) matter — builders filling gaps will default to the wrong emotional register. User Personas (1.3) become Core — can't infer the user from the category. |
| **Moderate** | Anti-Patterns matter for the novel aspects. Vocabulary needs explicit definition for novel concepts but familiar terms can be inferred. |
| **Low** | The builder's existing mental models are correct. Category conventions fill spec gaps accurately. Anti-Patterns and Emotional Goals are less urgent. User Personas can lean on category norms. |

**Novelty-sensitive areas:**
- 3.5 Anti-Patterns (critical at high, deprioritized at low)
- 3.2 Emotional / Aesthetic Goals (Core at high, Amplifier at low)
- 1.3 User Personas (Core at high, Amplifier at low)
- 2.2 Noun Vocabulary (Foundation always, but depth increases with novelty)

### Complexity Modulation

**What complexity affects at this mode:** Whether bounded tasks are truly bounded, or whether they have tentacles into adjacent features.

| Complexity | Effect on priorities |
|---|---|
| **High** | Product Entities (2.3) become critical — tasks touch interconnected objects, and changing one affects others the builder doesn't see. Interaction Patterns (4.2) become critical — inconsistent interactions in a complex product compound into a disorienting experience. Information Architecture (2.1) becomes important — the builder needs to know where things live and what's adjacent. |
| **Moderate** | Product Entities and Interaction Patterns are important. Tasks occasionally touch adjacent features. |
| **Low** | Tasks are genuinely self-contained. Product Entities are simple. Interaction Patterns are few. The task spec covers most of what the builder needs. |

**Complexity-sensitive areas:**
- 2.3 Product Entities (critical at high, Amplifier at low)
- 4.2 Interaction Patterns (critical at high, Amplifier at low)
- 2.1 Information Architecture (Core at high, Deprioritized at low)

### Interaction Effects

**High novelty + High complexity:** The hardest handoff problem. Specs are ambiguous (novel product) AND tasks have hidden dependencies (complex product). Everything matters. Anti-Patterns, Vocabulary, Product Entities, Interaction Patterns are all critical. Very little can be deprioritized.

**Low novelty + Low complexity:** The easiest handoff. Category conventions fill gaps. Tasks are self-contained. Foundation + Prototypes covers most needs. Many areas are Amplifier or Deprioritized.

**High novelty + Low complexity:** Ambiguous specs (novel) but self-contained tasks (simple). Identity knowledge is critical. Structural knowledge is lightweight. The risk is "builder builds the wrong thing" not "builder breaks adjacent features."

**Low novelty + High complexity:** Clear specs (conventional) but tangled dependencies (complex). Structural knowledge is critical. Identity knowledge is lightweight. The risk is "builder breaks adjacent features" not "builder builds the wrong thing."

### Remaining Areas

- **1.2 Product Strategy** — Core in most configs. Helps interpret spec intent but isn't required to execute.
- **1.3 User Personas** — novelty-sensitive. Core at high novelty, Amplifier at low.
- **3.1 User Journey Maps** — Core at high complexity (tasks exist within larger flows), Deprioritized at low complexity.
- **4.3 Prototypes / Mockups** — stable at Core across most configs. "Show don't tell" is universally useful for bounded tasks. Important at high novelty (can't visualize a pioneering product from text alone) AND at low novelty (visual reference is faster than verbal explanation in familiar categories). Different reasons, same priority.
- **5.1 Key Decisions Log** — Amplifier across most configs. Prevents the builder from questioning settled decisions, but bounded tasks encounter this less than design-level work.

---

## Mode 3: Pair Programmer

**Pool:** 18 areas (Short-Order Cook + Competitive Analysis, System Design, Engagement Loops, Progression/Mastery, Roadmap)
**Who this is:** Builders participate in product design. They propose alternatives, evaluate trade-offs, and shape features. They need enough product understanding to make design-level suggestions that serve the product's strategic arc.

### Primary Risk

**Misaligned proposals.** The builder proposes solutions that are technically elegant but product-wrong. They optimize for the wrong metric, break an invisible mechanism they didn't know existed, duplicate an approach that was tried and rejected, or design toward a future that conflicts with the roadmap. The proposals are good engineering and bad product — and the team wastes cycles evaluating and redirecting.

### Foundation (stable across all 9 configs)

| # | Knowledge Area | Why it's foundational |
|---|---|---|
| 1.1 | Product Vision | Proposals must serve the vision. Without it, the builder optimizes for technical elegance. |
| 1.2 | Product Strategy | The bets and trade-offs. Proposals that ignore the strategy are well-intentioned but misaligned. Returns to Foundation at this mode because design participation requires strategic context. |
| 2.2 | Noun Vocabulary | Design discussions require shared language. Proposals using wrong terms create confusion. |
| 3.5 | Anti-Patterns | The guardrails that define the solution space boundary. A builder who doesn't know "we are NOT a todo list" will propose todo-list patterns. Anti-Patterns are prerequisite to evaluating all other knowledge correctly — a proposal can be well-designed for engagement AND well-integrated with systems but fundamentally something the product is NOT. Foundation because it constrains the space in which Core knowledge operates. |

**Shift from Short-Order Cook:** Strategy (1.2) returns to Foundation. Anti-Patterns (3.5) joins Foundation. When builders propose designs, they need to know both what the product IS (Vision, Strategy) and what it is NOT (Anti-Patterns) before any specific proposals can be evaluated.

### Novelty Modulation

**What novelty affects at this mode:** Whether the builder's design instincts point in the right direction.

| Novelty | Effect on priorities |
|---|---|
| **High** | Emotional Goals (3.2) become critical — design proposals must serve the right emotional register, and there's no category convention to provide it. Progression/Mastery (3.4) becomes critical — if the product has a mastery curve, proposals must serve it. User Personas (1.3) become Core — can't infer users from a nonexistent category. Competitive Analysis (1.4) is less about "how are we different from X" and more about "what adjacent categories can we learn from without copying." |
| **Moderate** | Emotional Goals matter for the novel aspects. Competitive Analysis helps position proposals against both the familiar category and the novel approach. |
| **Low** | Competitive Analysis (1.4) becomes MORE important — in an established category, every design proposal must be evaluated against "how does this differentiate us?" This is the primary novelty-sensitive area that goes UP at low novelty instead of down. Emotional Goals are lighter — the category provides emotional direction. Progression/Mastery may not apply (many conventional products don't have progression mechanics). User Personas can lean on category norms. |

**Novelty-sensitive areas:**
- 3.2 Emotional / Aesthetic Goals (Core at high, Amplifier at low)
- 3.4 Progression / Mastery (Core at high novelty AND high complexity, Deprioritized at low/low)
- 1.3 User Personas (Core at high, Amplifier at low)
- 1.4 Competitive Analysis (Core at low novelty, Amplifier at high novelty — inversely sensitive)

### Complexity Modulation

**What complexity affects at this mode:** The blast radius of design proposals.

| Complexity | Effect on priorities |
|---|---|
| **High** | System Design (2.4) becomes critical — proposals that touch invisible mechanisms without understanding them will break things. Engagement Loops (3.3) become critical — proposals must be evaluated for their effect on retention. Roadmap (5.3) becomes more important — in a complex product, proposals are more likely to conflict with planned work. Product Entities (2.3) remain important — design changes to one entity affect connected entities. Key Decisions Log (5.1) becomes critical — at this mode, proposing something already tried and rejected is the single biggest time waste. |
| **Moderate** | System Design and Engagement Loops are important. Proposals occasionally interact with invisible mechanisms. |
| **Low** | System Design is simpler — fewer invisible mechanisms. Engagement Loops may not exist. Proposals have contained blast radius. Roadmap is less critical — fewer conflicts possible. |

**Complexity-sensitive areas:**
- 2.4 System Design (critical at high, Amplifier at low)
- 3.3 Engagement Loops (critical at high, Deprioritized at low)
- 5.3 Roadmap (Core at high, Amplifier at low)
- 5.1 Key Decisions Log (Core at high, Amplifier at low — more mode-sensitive here than at Short-Order Cook)

### Interaction Effects

**High novelty + High complexity:** The highest-stakes design participation. The builder must propose designs for a pioneering, interconnected product. Every new area (Competitive Analysis, System Design, Engagement Loops, Progression/Mastery, Roadmap) is Core or higher. Emotional Goals and Anti-Patterns are critical. Almost nothing is deprioritized.

**Low novelty + Low complexity:** The lowest-stakes design participation. The builder proposes designs for a conventional, simple product. Competitive Analysis is Core (differentiation IS the game). Most other new areas are Amplifier or Deprioritized. The builder's category experience is an asset.

**High novelty + Low complexity:** Pioneering but simple. The builder needs deep identity context (Emotional Goals, Anti-Patterns, Progression/Mastery) to propose aligned designs, but the blast radius is small. System Design and Engagement Loops are less important.

**Low novelty + High complexity:** Conventional but complex. Competitive Analysis, System Design, and Engagement Loops are critical. Identity knowledge is less urgent — the category provides it. The builder needs to understand the topology of the product to propose designs that don't break it.

### Remaining Areas

- **1.3 User Personas** — novelty-sensitive. Core at high novelty (can't infer users from category), Amplifier at low.
- **2.1 Information Architecture** — Core at high complexity, Amplifier otherwise.
- **2.3 Product Entities** — Core at high complexity, Amplifier otherwise.
- **3.1 User Journey Maps** — Core at high complexity + high novelty, Amplifier otherwise.
- **4.1 Design System** — Core in all configs. The pair programmer proposes designs AND implements them (or directs implementation). Proposals must be design-system-aware, and the implementation that follows needs visual guidance. Not Foundation (the primary activity is still design discussion, not bounded task execution), but always Core.
- **4.2 Interaction Patterns** — Core at high complexity, Amplifier at low.
- **4.3 Prototypes / Mockups** — stable at Core across most configs. Visual reference is important at both high novelty (can't visualize from text) and low novelty (faster than explanation).
- **5.1 Key Decisions Log** — Core across most configs, especially at high complexity. Design proposals that relitigate settled decisions waste the most time at this mode.

---

## Mode 4: Factory

**Pool:** 22 areas (all)
**Who this is:** Builders are the primary implementers. They decide empty state copy, error message tone, information hierarchy, default settings — product decisions that happen hundreds of times with no product person in the room.

### Primary Risk

**Silent wrong defaults.** The agent makes hundreds of product micro-decisions per session. Each seems minor: what copy goes in this empty state? What's the default sort order? How does the error message sound? What information comes first? Individually these are small. Cumulatively they define the product experience. Without comprehensive product knowledge, the agent builds a technically functional product that feels like it was designed by no one — or worse, by someone who doesn't understand what the product is.

This risk is unique to Factory mode: at lower modes, a product person catches wrong defaults. At Factory, they accumulate silently until someone reviews the output and realizes it feels wrong without being able to point to any single broken thing.

### Foundation (stable across all 9 configs)

| # | Knowledge Area | Why it's foundational |
|---|---|---|
| 1.1 | Product Vision | Every micro-decision must serve the vision. The agent needs this as its primary filter for "does this belong in this product?" |
| 2.2 | Noun Vocabulary | The agent writes copy, names things, labels UI elements. Wrong vocabulary is the most visible product error. |
| 1.2 | Product Strategy | The agent must understand trade-offs to make aligned micro-decisions. "We optimize for simplicity over power" shapes hundreds of choices. |
| 3.5 | Anti-Patterns | Critical guardrails for autonomous operation. The agent's training data contains every product pattern that ever existed. Without Anti-Patterns, it will default to the most common pattern — which may be exactly what this product is NOT. |
| 3.2 | Emotional / Aesthetic Goals | Every micro-decision about tone, animation, feedback, and copy is an emotional decision. "Calm and focused" vs. "energizing and playful" produces completely different products. At Factory, this is Foundation, not Core — it's referenced by every other decision the agent makes. |

**Shift from Pair Programmer:** Emotional Goals (3.2) rises to Foundation. Anti-Patterns (3.5) was already Foundation. At Factory, both identity-guardrail areas are bedrock because the agent is making unmediated micro-decisions that these areas directly constrain. This is the widest Foundation of any mode — 5 areas instead of 3-4.

### Novelty Modulation

**What novelty affects at this mode:** Whether the agent's training data (which contains the entire internet's worth of product patterns) will lead it toward the right or wrong defaults.

| Novelty | Effect on priorities |
|---|---|
| **High** | This is the most dangerous configuration in the entire wizard. The agent has seen millions of conventional products in training. Without comprehensive identity knowledge, it will build the nearest conventional category product with high confidence. Vocabulary depth is critical. Progression/Mastery (3.4) is critical if the product has it. Every identity area must be Core or higher. User Personas (1.3) are critical — the agent literally cannot infer the user. |
| **Moderate** | The agent can infer some patterns from the familiar category aspects. Novel aspects still need explicit definition. Anti-Patterns are important for preventing the agent from collapsing novel elements to category conventions. |
| **Low** | The agent's training data is an asset, not a liability. Its existing knowledge of the category is mostly correct. Competitive Analysis (1.4) becomes MORE important — the agent needs to know how this product differs from the thousands of similar products it has seen. Market Requirements (1.5) help ground decisions in this specific market, not the generic category. User Personas can lean on category norms but still more important here than at lower modes. |

**Novelty-sensitive areas:**
- 3.4 Progression / Mastery (Core at high, Deprioritized at low unless the product has progression)
- 1.3 User Personas (Core at high, Amplifier at low — more important at Factory than lower modes even at low novelty)
- 1.4 Competitive Analysis (Core at low novelty — inversely sensitive, same pattern as Pair Programmer but stronger)
- 1.5 Market Requirements (Core at low novelty — evidence distinguishes this product from generic category)

### Complexity Modulation

**What complexity affects at this mode:** How far each autonomous micro-decision ripples.

| Complexity | Effect on priorities |
|---|---|
| **High** | System Design (2.4) becomes critical — the agent must understand every invisible mechanism to avoid breaking them. Engagement Loops (3.3) become critical — autonomous changes that subtly degrade the loop erode the product over time. Full GDD/PRD (2.5) becomes critical — edge cases in a complex product are where autonomous agents make the most damaging errors. Product Entities (2.3) and IA (2.1) are essential. Institutional Memory (5.2+5.4) prevents the agent from repeating past mistakes across complex systems. Key Decisions Log (5.1) becomes critical. |
| **Moderate** | System Design and Engagement Loops are important. GDD/PRD helps for edge cases. Some decisions ripple. |
| **Low** | Decisions are contained. System Design is simpler. GDD/PRD is less critical (fewer edge cases). The agent can work with less structural knowledge. |

**Complexity-sensitive areas:**
- 2.4 System Design (critical at high, Amplifier at low)
- 3.3 Engagement Loops (critical at high, Deprioritized at low)
- 2.5 Full GDD / PRD (Core at high, Deprioritized at low)
- 5.2+5.4 Institutional Memory (Core at high, Amplifier at low)
- 5.1 Key Decisions Log (Core at high, Amplifier at low)

### Interaction Effects

**High novelty + High complexity:** The most demanding configuration in the entire wizard. An autonomous agent building a pioneering, interconnected product. Every area in the pool should be Core or Foundation. The agent needs comprehensive product knowledge because its defaults are wrong (novel) AND its wrong defaults cascade (complex). This is the configuration that justifies the full 22-area library.

**Low novelty + Low complexity:** The least demanding Factory configuration — but still demanding because the agent is making every decision autonomously. Foundation (5 areas) is still critical. Competitive Analysis helps the agent understand differentiation. Most structural areas can be Amplifier. But even here, more knowledge is in play than Pair Programmer's High/High, because autonomous decision-making requires a higher floor.

**High novelty + Low complexity:** Pioneering but simple. The agent's wrong defaults are the primary risk, but they don't cascade. Identity knowledge is comprehensive; structural knowledge is lightweight. Focus on making sure every micro-decision aligns with the novel vision, less concern about system interactions.

**Low novelty + High complexity:** Conventional but complex. The agent's defaults are mostly right, but wrong decisions cascade. Structural knowledge is comprehensive; identity knowledge can lean on category conventions (with Competitive Analysis providing differentiation). Focus on system integrity and edge-case coverage.

### Remaining Areas

- **1.3 User Personas** — novelty-sensitive but higher floor than other modes. Core at high novelty, Core or Amplifier at low. The agent making user-facing decisions must know who the user is.
- **2.1 Information Architecture** — Core at high complexity, Amplifier otherwise.
- **2.3 Product Entities** — Core in most configs. The agent works with product objects constantly.
- **3.1 User Journey Maps** — Core at high complexity, Amplifier otherwise.
- **4.1 Design System** — Core in all configs. The agent produces UI constantly. At Factory, this is closer to Foundation than at other modes but remains Core because it's consumed rather than referenced by other knowledge.
- **4.2 Interaction Patterns** — Core in most configs. The agent implements interactions autonomously.
- **4.3 Prototypes / Mockups** — stable at Core across most configs. Visual reference for autonomous implementation. Important at both high novelty (can't visualize from text) and low novelty (efficient reference).
- **4.4 Accessibility Standards** — Core at moderate-to-high complexity, Amplifier at low. The agent must autonomously apply accessibility standards.
- **5.1 Key Decisions Log** — Core in most configs, critical at high complexity. Prevents the agent from revisiting settled questions.
- **5.3 Roadmap** — Core in most configs. The agent must avoid building toward the wrong future.

### Factory-Specific Note

The design doc's Open Question #1 is relevant here: "Does AI mode influence priority within the pool, not just pool size?" The answer, based on this analysis, is **yes**. At Factory mode, identity-guardrail areas (Anti-Patterns, Emotional Goals) are Foundation — they would be Core or Amplifier at the same novelty/complexity configuration in Pair Programmer mode. The agent cannot fill gaps from intuition, so the floor for identity knowledge is higher. This effect is captured by making the Factory Foundation wider (5 areas vs. 3-4 for other modes).

---

## Cross-Mode Patterns

### Foundation escalation

| Mode | Foundation areas | Count |
|---|---|---|
| No/Low AI | Vision, Vocabulary, Strategy | 3 |
| Short-Order Cook | Vision, Vocabulary, Design System | 3 |
| Pair Programmer | Vision, Vocabulary, Strategy, Anti-Patterns | 4 |
| Factory | Vision, Vocabulary, Strategy, Anti-Patterns, Emotional Goals | 5 |

**Vision and Vocabulary are Foundation in every mode.** They are the only two areas that never leave Foundation regardless of mode, novelty, or complexity.

**Strategy enters and exits Foundation.** It's Foundation at No/Low AI (team alignment), drops to Core at Short-Order Cook (builder doesn't need strategic context to execute specs), and returns to Foundation at Pair Programmer and Factory (design participation and autonomous decisions require strategic context).

**Anti-Patterns escalate.** Amplifier or Core at No/Low AI and Short-Order Cook; Foundation at Pair Programmer and Factory. The more product authority the builder has, the more critical the guardrails.

**Emotional Goals escalate.** Ranges from Deprioritized-to-Core at lower modes; Foundation at Factory. The more micro-decisions the builder makes about tone and feel, the more critical emotional direction becomes.

### Novelty-sensitive areas (consistent across modes)

These areas move toward Core at high novelty and toward Deprioritized at low novelty:
- 3.2 Emotional / Aesthetic Goals (at modes where not already Foundation)
- 3.4 Progression / Mastery
- 3.5 Anti-Patterns (at modes where not already Foundation)
- 1.3 User Personas (Core at high, Amplifier at low — more sensitive than initially assessed)

**Exception:** Competitive Analysis (1.4) is **inversely** novelty-sensitive — it becomes MORE important at low novelty because differentiation in an established category is the product identity.

### Complexity-sensitive areas (consistent across modes)

These areas move toward Core at high complexity and toward Deprioritized at low complexity:
- 2.1 Information Architecture
- 2.3 Product Entities
- 2.4 System Design
- 3.1 User Journey Maps
- 3.3 Engagement Loops
- 5.1 Key Decisions Log (especially at Pair Programmer and Factory, where proposing/implementing already-rejected approaches is the costliest error)

### Stable areas (insensitive to novelty and complexity)

- 1.1 Product Vision — always Foundation
- 2.2 Noun Vocabulary — always Foundation
- 4.3 Prototypes / Mockups — stable at Core across novelty levels (important at high novelty for accuracy, important at low novelty for efficiency — different reasons, same priority)
- 4.1 Design System — Core or Foundation at every mode (Foundation at Short-Order Cook, Core everywhere else)

---

## Strategy vs. Product Thesis Note

The wizard catalog uses "Product Strategy" (1.2) because that's what most teams will arrive with. However, a sharper format exists: **Product Thesis** — testable, falsifiable strategic claims with counter-theses, validation criteria, and invalidation signals.

The distinction:
- **Strategy** = "the bets we're making" — directional, narrative
- **Product Thesis** = "we believe X because Y, and we'd know we're wrong if Z" — testable, structured

Product Thesis has three subtypes: Problem Thesis (what's broken), Solution Thesis (how the pieces work together), and Plank Theses (individual strategic bets). This three-tier structure is more useful for AI agents because it provides different levels to reason against depending on the decision being made.

**For the wizard:** Strategy is the floor, Product Thesis is the ceiling. The catalog keeps "Product Strategy" for accessibility. The Estate Attorney Protocol intake includes a solicitation prompt to nudge teams toward thesis format: "Can you state your strategy as a belief? 'We believe [X] because [Y], and we'd know we're wrong if [Z].'" The librarian can help refine a strategy into a thesis over time.

---

## QA Resolution

All five review questions were resolved through self-review from the AI agent's perspective (the target user of context libraries):

1. **Foundation widening at Factory (5 areas)** — Confirmed. Anti-Patterns and Emotional Goals are the filter the agent runs every decision through. They're not context; they're the decision-making substrate.

2. **Strategy's movement** — Confirmed. At Short-Order Cook, Strategy adds quality but isn't structurally necessary for bounded task execution. At Pair Programmer and Factory, it's prerequisite for proposing or deciding anything.

3. **Competitive Analysis inverse sensitivity** — Confirmed strongly. At low novelty, the agent's training data contains thousands of similar products. Without Competitive Analysis, it builds the statistical average of the category. The differentiation IS the product identity.

4. **Anti-Patterns as Foundation at Pair Programmer** — Confirmed. Anti-Patterns define the solution space boundary. All other knowledge operates within that boundary. A proposal evaluated against Engagement Loops and System Design but not Anti-Patterns can be well-designed AND fundamentally something the product is NOT.

5. **Sensitivity adjustments** — Three corrections applied:
   - Key Decisions Log (5.1) is more mode-sensitive than initially described. At Pair Programmer, it's Core across most configs (not just Amplifier) because relitigating settled decisions is the costliest error at this mode.
   - User Personas (1.3) is more novelty-sensitive than initially described. At high novelty, can't infer users from a nonexistent category; at low novelty, category norms describe the user.
   - Prototypes/Mockups (4.3) is actually stable, not novelty-sensitive. Important at high novelty (can't visualize from text) and at low novelty (faster than explanation). Different reasons, same priority.
