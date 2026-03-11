# Podcast Briefing: Context Library Wizard Findings

**For:** Jess Martin
**From:** Danvers + Claude
**Context:** You've seen the wizard design docs. This is what we found when we actually built the engine — the surprises, the patterns, and what it says about our own library.

**Important framing note for the podcast host:** This wizard is about *product knowledge*, not technical knowledge. All 22 knowledge areas are product categories (Vision, Vocabulary, Journey Maps, Engagement Loops, Anti-Patterns). Zero are technical categories. If you find yourself talking about "technical documentation" or "code architecture" or "API specs," you've drifted off-topic. The wizard is asking: what does the *product person's brain* contain that needs to be externalized so AI builders can make good *product* decisions?

---

## Part 1: The Four Ways Teams Build with AI

Before we get into what the wizard found, here's the landscape it operates on. Teams work with AI in one of four modes — and most teams don't realize they've chosen one:

**No/Low AI** — A product person makes every product decision. AI might autocomplete some code or help brainstorm, but a human decides what the product looks like, feels like, and does. *The team IS the product knowledge.*

**Short-Order Cook** — A product person writes a ticket: "build this modal with these fields and this validation." The AI executes bounded tasks without deciding what to build or how it should feel. *The task spec IS the product knowledge — but only for that task.*

**Pair Programmer** — The AI participates in design discussions. It proposes alternatives: "what if we used a spatial layout instead of a list?" A product person reviews and approves, but the AI is shaping the product. *The AI needs to understand the strategy to propose aligned designs.*

**Factory** — The AI is the primary implementer. It decides empty state copy, error message tone, default settings, information hierarchy — hundreds of product micro-decisions with no product person reviewing each one. *The AI needs everything the product person knows, because it's making their decisions for them.*

The wizard's first question asks: which mode are you in? This isn't about AI capability — it's about who has product decision authority. The answer determines how much product knowledge needs to be externalized from human brains into a library.

---

## Part 2: What the Wizard Does

Three questions → prioritized list of what product knowledge to document first.

1. **How much autonomy do your AI builders have?** (selects the knowledge pool — 10 to 22 areas)
2. **How novel is your product?** (prioritizes identity and experience knowledge)
3. **How complex is your product?** (prioritizes structural and system knowledge)

Output: every knowledge area in your pool assigned to Foundation (seed first) → Core (primary value) → Amplifier (multiplier) → Deprioritized (seed last).

36 total configurations. 4 modes × 9 novelty/complexity combos. We built all of them.

Important: questions 2 and 3 are about the *product*, not the AI. "How novel is your product?" measures how far the product is from anything in the AI's training data. "How complex is your product?" measures how interconnected the product's features are. These are stable product attributes that don't change when models improve.

---

## Part 3: The Obvious Findings

**More autonomy = more knowledge needed.** No surprise. But the *shape* is interesting — it's not linear. The pool goes 10 → 13 → 18 → 22. The jump from Short-Order Cook to Pair Programmer (+5 areas) is the biggest. That's where you cross the line from "execute what I tell you" to "help me decide what to build." That transition requires strategic context (competitive landscape, engagement loops, progression models, roadmap) that bounded task execution simply doesn't.

**High complexity makes everything important.** At Factory × High Complexity, there are zero Deprioritized areas regardless of novelty. When systems are interconnected, every piece of product knowledge has at least indirect relevance. The minimum tier at high complexity is Amplifier.

**Foundation areas widen with autonomy.** 3 → 3 → 4 → 5. Vision and Vocabulary are always Foundation (every mode). Strategy is Foundation at 3 of 4 modes. Anti-Patterns join at Pair Programmer. Emotional Goals join at Factory. The pattern: as autonomy increases, more knowledge becomes *prerequisite* rather than just *useful*.

---

## Part 4: The Surprising Findings

### Competitive Analysis is backwards

The most counter-intuitive pattern in the entire wizard. At high novelty, Competitive Analysis is *Amplifier* (low priority). At low novelty, it's *Core* (high priority).

Why: If you're building something truly new, there's no meaningful competition to analyze — your competition is "not doing this at all." But if you're building in an established category, the AI's training data contains *thousands* of similar products. Without explicit competitive differentiation, the AI will build the category-generic version. For a CRM, the AI will build Salesforce. For a todo app, it'll build Todoist. Competitive Analysis at low novelty IS the product identity.

This is the finding that would most surprise a product person. "Don't worry about competitive analysis when your product is novel" runs against instinct. But the wizard is asking: *what does the AI need to build correctly?* And a pioneering AI builder needs to know what the product IS, not what it isn't — because there's nothing to confuse it with.

### Design System follows the activity, not the autonomy gradient

| Mode | Tier | Why |
|---|---|---|
| No/Low AI | Amplifier | Humans are in the room. Visual language is reference material. |
| Short-Order Cook | **Foundation** | Every bounded task produces UI. Design System is consumed on every task. |
| Pair Programmer | **Core** | Proposes AND implements. Proposals must be design-system-aware; the implementation that follows needs visual guidance. |
| Factory | **Core** | Autonomous UI production. The agent produces screens on every task with no review. |

The Foundation spike at Short-Order Cook is the distinctive feature — the mode where the Design System is consumed on *literally every task*. At Pair Programmer and Factory, it's Core because the builder doesn't just discuss designs in the abstract — it proposes designs and then builds them (or directs implementation). A proposal that violates the spacing system or uses the wrong component patterns produces a bad design that gets faithfully implemented.

This is the clearest example of the wizard measuring *what the AI actually does*, not *how capable it is*.

### Some configurations need almost nothing

No/Low AI at Moderate/Low, Low/Moderate, and Low/Low: **zero Core areas.** Foundation alone (Vision, Strategy, Vocabulary) provides the alignment a human-centric team needs. Everything else is nice-to-have reference. The category conventions and the team's own conversations do the alignment work.

This is important for positioning: the wizard doesn't always say "document everything." For a conventional, simple product with humans making every decision, the library is three documents. That's an honest recommendation, and it builds trust.

### The Decisions Log has a step function

At Short-Order Cook: always Amplifier (lowest priority in pool). At Pair Programmer: Core in most configs. The jump is sharp.

Why: Bounded task execution (Short-Order Cook) rarely encounters settled decisions — they're already baked into the task spec. But design participation (Pair Programmer) means proposing alternatives, which means relitigating decisions the team already resolved. "We considered X but chose Y because Z" prevents the most time-wasting proposals. The step function isn't a modeling error — it's a real discontinuity in *what activity the AI performs*.

---

## Part 5: The Simple Insight

**The wizard benchmarks to the product, not the AI.**

Questions 2 and 3 don't ask "how good is your AI?" They ask "how novel is your product?" and "how complex is your product?" These are stable attributes. They don't change when GPT-5 drops or when Claude gets better at reasoning.

The framing is about *inference gaps* — what can the AI figure out on its own vs. what must be explicitly documented? A conventional product has small inference gaps (training data covers it). A pioneering product has large inference gaps (nothing in training matches). But we measure the *product* side of the gap, not the *AI* side, because the product side is stable across model generations.

This means the wizard's recommendations won't expire every 6 months. A team's configuration changes when their product changes or when they change how they work with AI — not when the model improves.

---

## Part 6: The Complex Insight

**95% of the 432 tier assignments are generated by three composable rules. The other 5% reveal something about product knowledge itself.**

The three rules:
1. **Foundation check** — is this area bedrock at this mode?
2. **Sensitivity profiles** — how does this area respond to novelty and complexity independently?
3. **Mode floors** — what's the minimum tier at this mode?

These combine with a max() rule: if EITHER novelty or complexity pushes an area up, it goes up. This works because most product knowledge responds to one axis or the other, not both.

But three areas break the model:

**Progression / Mastery** has a genuine interaction effect. Novelty sets the ceiling (pioneering products need explicit mastery models), complexity modulates within it (complex products have more to master). You can't decompose this into independent novelty + complexity profiles — you need a 3×3 lookup table. This tells us something: progression is where novelty and complexity *interact* rather than operate independently. It's the only knowledge area where "how different is this?" and "how connected is this?" produce combined effects.

**Journey Maps at Pair Programmer** has a novelty-gated floor. Normally complexity-sensitive (more complex = more important). But at Pair Programmer specifically, Journey Maps stays at Amplifier even at low complexity — UNLESS novelty is also low. The AI proposing designs for a moderately novel product still needs to know the end-to-end flow, even if the product is simple, because the flow IS the novelty.

**Design System at No/Low AI** is complexity-sensitive only at this mode. At other modes, Design System's tier is determined by the activity (Foundation at Short-Order Cook, Core at Pair Programmer and Factory). But at No/Low AI — where humans make every decision — the only thing that makes Design System Core is having lots of screens that need visual consistency (high complexity). This is the one place where the human team's own needs, rather than the AI's needs, drive the recommendation.

These anomalies aren't bugs. They're places where the clean model reveals genuine complexity in how product knowledge works.

---

## Part 7: What the Wizard Says About Us

### LifeBuild's Configuration: Factory × High Novelty × High Complexity

This is the most demanding configuration in the wizard.

- **Factory** because Claude is the primary implementer — making hundreds of product micro-decisions (copy, layout, defaults, empty states) with no product person reviewing each one.
- **High Novelty** because nobody says "oh, it's like [familiar product]." Life Map? Hex tiles for life projects? Steward agents that grow with you? Systems with overgrowth mechanics? There's no established category. People immediately compare it to something it's not.
- **High Complexity** because everything is interconnected. Changing the Capacity Economy affects Bronze Stack, which affects Smoke Signals, which affects the daily check-in loop, which affects the Felt Experience slider, which affects what Marvin recommends. Wrong decisions cascade.

**Wizard output: 5 Foundation, 15 Core, 2 Amplifier, 0 Deprioritized.**

Every single area in the pool matters. Nothing gets deprioritized. This is the honest recommendation for a team running autonomous agents on a pioneering, interconnected product.

### The Assessment: What We Actually Have

We ran the wizard against our actual context library — 148 cards across 6 zones.

**Foundation (5 areas) — All Present ✅**

| Area | Status | Notes |
|---|---|---|
| 1.1 Product Vision | ✅ Present | Three Strategy cards + Aesthetic - Sanctuary. Clear and strong. |
| 1.2 Product Strategy | ✅ Present | Three named bets (AI as Teammates, Spatial Visibility, Superior Process). Well-articulated trade-offs. |
| 2.2 Noun Vocabulary | ✅ Present | Primitives (Project, System, Task), Life Categories, comprehensive type taxonomy. One of the library's strongest areas. |
| 3.2 Emotional Goals | ✅ Present | Six Aesthetic cards (Sanctuary, Clarity, Stewardship, Accomplishment, Being Known, The Shift). Explicitly designed emotional targets. |
| 3.5 Anti-Patterns | ✅ Present | Eight Dynamic cards (Bronze Flood, Over-Expansion, Rest Deficit Spiral, etc.) plus anti-examples throughout cards. Rich and actionable. |

**This is the good news.** The prerequisite layer is solid. Everything Claude builds has anchors to work from.

**Core (15 areas) — 10 Present, 1 Absent, 4 Partial**

| Area | Status | Notes |
|---|---|---|
| 2.1 Information Architecture | ✅ Present | Zones, Rooms, Overlays, Structures, Life Categories, Type Definition. Comprehensive spatial hierarchy. |
| 2.3 Product Entities | ✅ Present | 62 product cards. Primitives with lifecycle states, Components, Artifacts, Agents. The library's densest zone. |
| 2.4 System Design | ✅ Present | 18 System cards covering invisible mechanics. Pipeline Architecture, Priority Queue, Capacity Economy, Overgrowth, Smoke Signals. Exceptionally thorough. |
| 2.5 Full GDD / PRD | ✅ Present | GDD-v0.2 in sources + distributed PRD across all cards. The card structure IS the living PRD. |
| 3.1 Journey Maps | ✅ Present | 2 Journeys (Onboarding, Sanctuary Progression) + 5 Loops (Daily to Annual). Micro to macro coverage. |
| 3.3 Engagement Loops | ✅ Present | 5 Loop cards with full trigger → action → reward → investment structure. 8 Dynamic cards for emergent behaviors. |
| 3.4 Progression / Mastery | ✅ Present | Service Level Progression, Sanctuary Progression, Image Evolution. Builder arc from novice to seasoned steward. |
| 4.1 Design System | ✅ Present | Visual Language standard (colors, hex tiles, evolution stages), component specs, spatial interaction rules. |
| 4.2 Interaction Patterns | ✅ Present | 8 Capability cards, spatial interaction rules, table slot behaviors, four-verb vocabulary (Plant/Tend/Delegate/Restore). |
| 5.2+5.4 Institutional Memory | ✅ Present | 11 Principles (judgment heuristics), 3 Strategy cards, source documents with provenance. |
| 5.3 Roadmap | ✅ Present | 10 Release cards (R1 The Campfire through R9 The Seasons). Clear sequence with dependencies. |
| **1.3 User Personas** | ⚠️ Partial | "Builder" is implicit throughout but never explicitly defined. No persona card. No JTBD statement. Claude knows the *product* deeply but has to infer *who the user is* from context. |
| **4.3 Prototypes / Mockups** | ⚠️ Partial | Design specs exist. Visual evolution stages defined. But full mockups live in the codebase (Storybook stories), not in the library. Claude can reference code but not visual artifacts. |
| **5.1 Key Decisions Log** | ⚠️ Partial | Recent decisions tracked (D3 category rooms removed, D4 scope simplification). But the log isn't formalized. Older decisions are implicit in card evolution, not recorded with alternatives and reasoning. |
| **4.4 Accessibility Standards** | ❌ Absent | No accessibility cards. No WCAG level stated. No keyboard navigation spec. No screen reader requirements. |

**Amplifier (2 areas) — Both Gaps**

| Area | Status | Notes |
|---|---|---|
| **1.4 Competitive Analysis** | ❌ Absent | No explicit competitive positioning. Claude's training data contains Notion, ClickUp, life coaching apps — without explicit differentiation, it borrows conventions from them. |
| **1.5 Market Requirements** | ⚠️ Partial | The psychological market constraint (overwhelm, burnout, lack of visibility) is articulated through Principles. But no user research, no surveys, no analytics, no evidence base. |

### What to Patch — Ranked by Actual Impact

The wizard assigns the same tier to all Core gaps. But the *practical impact* at our specific configuration is not equal. Here's the real priority order:

#### 🔴 Critical: Prototypes & Visual References (4.3)

**This is the gap that's hurting us most right now.**

LifeBuild is a *high novelty* product at *Factory* mode. Claude makes autonomous UI decisions on every task. And there is *nothing in Claude's training data* that looks like what we're building.

Hex tiles arranged in a spatial life map? A campfire that evolves through five visual stages? Systems with overgrowth mechanics rendered on a zoomable canvas? Smoke signals as health indicators on hexagonal tiles? Claude has never seen any of this. Every time it builds UI, it is *guessing* at spatial relationships, layout density, visual hierarchy, and component proportions — because the library tells it what things ARE but not what they LOOK LIKE.

The Design System standard describes colors and spacing rules. But rules without visual references are like sheet music without ever hearing the song. Claude can follow the notes but it doesn't know what the music sounds like.

**The fix:** Visual reference cards in the library — annotated screenshots or mockup images of key screens and components, organized by zone and state. Not pixel-perfect Figma files, but "this is what the Life Map looks like at neighborhood zoom" and "this is what a hex tile looks like in each of its five evolution stages." Even rough annotated screenshots would transform Claude's ability to make coherent visual decisions.

**Why the wizard underweighted this:** The wizard correctly identifies Prototypes as Core at Factory H/H. But the tier system doesn't capture the *multiplied* impact at high novelty. For a conventional product (low novelty), partial prototypes are survivable — Claude can infer visual patterns from similar products in its training data. For a pioneering product, partial prototypes mean Claude is flying blind on the most visible dimension of the product.

#### 🟡 Important: User Personas (1.3)

Claude knows LifeBuild's product model inside out — 62 entity cards, 18 system cards, the full vocabulary. But it has to *infer* who the user is from scattered context rather than having an explicit reference.

Who is the builder? What's their emotional state when they open the app? Are they rushed or exploratory? Are they planning or executing? What's their relationship with productivity tools — do they love them or resent them? What outcome makes them feel like the session was worthwhile?

These questions shape every micro-decision about copy tone, information density, default states, and error messages. Without an explicit persona, Claude defaults to a generic "productivity app user" — which is exactly the wrong mental model for a product about stewardship and sanctuary.

**The fix:** A single Persona card with JTBD statements, emotional context, and explicit "this user is NOT" boundaries.

#### 🟡 Important: Key Decisions Log (5.1)

Claude relitigates settled decisions because it doesn't know they're settled. The library has D3 (category rooms removed) and D4 (scope simplification) logged, but dozens of foundational decisions aren't recorded:

- Why hex tiles instead of a list or Kanban board?
- Why spatial metaphors instead of productivity metaphors?
- Why systems "grow" rather than just "exist"?
- Why three streams (Gold/Silver/Bronze) instead of a priority ranking?
- Why a campfire instead of a dashboard?

Each of these comes up in implementation. Claude encounters the choice point, can't find a settled decision, and either re-derives it from first principles (slow, sometimes wrong) or asks (interrupts flow). A formalized log with rejected alternatives and reasoning would prevent both.

**The fix:** A structured Decisions Log card that captures the 15-20 most foundational product decisions with what was considered, what was chosen, and why.

#### 🟢 Worth doing: Accessibility Standards (4.4)

Real gap. At Factory mode, Claude makes UI decisions autonomously, and without accessibility standards, it applies them inconsistently. But context matters: we're in alpha, our testers aren't disabled, and the prototype will likely be rebuilt. A single card stating our WCAG commitment and basic requirements would help, and it's easy to create. But this isn't the gap that's degrading Claude's output quality today.

**The fix:** One card: WCAG level, contrast minimums, keyboard navigation requirements, screen reader expectations.

#### 🟢 Worth doing: Competitive Analysis (1.4) — Amplifier

Only Amplifier at our configuration (high novelty = no established category to compare against). But documenting "we are NOT Notion / ClickUp / life coaching apps / gamified habit trackers" would constrain Claude's tendency to borrow the most accessible conventions from its training data. Low urgency, but the anti-competitive framing would reinforce the anti-patterns we already have.

---

## Part 8: Podcast Talking Points

### For Jess — the "so what" summary

1. **The wizard is about product knowledge, not technical knowledge.** 22 product categories — Vision, Vocabulary, Journey Maps, Engagement Loops. Zero technical categories. When AI builders make bad product decisions, it's because they're missing product context, not technical context.

2. **Three questions, 36 configurations.** How much autonomy (selects the pool), how novel (prioritizes identity knowledge), how complex (prioritizes structural knowledge). Output: a prioritized seeding list.

3. **The most surprising finding: backwards competitive analysis.** High novelty = low priority. Low novelty = high priority. The AI's training data IS your competition when you're building in an established category.

4. **The most useful finding: we ran it on ourselves.** Factory × High × High — the most demanding configuration. Our library is ~85% complete, which is strong. Foundation is fully covered. But the wizard found a critical gap we'd been feeling but hadn't named: **Claude doesn't know what LifeBuild looks like.** We have 148 cards telling it what things ARE but almost nothing showing it what they LOOK LIKE. For a pioneering product where nothing in Claude's training resembles our UI, this means every visual decision is a guess.

5. **The meta-finding: the wizard works.** It told us things we didn't know about our own library. The prototypes gap was something we felt as friction ("why does Claude keep getting the spatial layout wrong?") but hadn't diagnosed as a knowledge gap. The wizard gave the friction a name and a fix.

### Potential discussion threads

- **"What if we're wrong about our mode?"** The wizard lets you run multiple configurations. If you're not sure whether you're Pair Programmer or Factory, run both and compare. The delta shows you exactly what additional knowledge Factory requires.

- **"How does this relate to the agent system?"** The wizard is mode-agnostic about WHICH agents you have. It cares about the autonomy level, not the agent architecture. Whether you have one agent or twelve, the product knowledge they need is the same.

- **"Could this be automated?"** Yes. The engine is deterministic — YAML in, prioritized list out. The solicitation prompts could drive an LLM-assisted intake session. The gap analysis could run against a library inventory automatically. Phase 6 (intake engine) is designed for this.

- **"What about the market?"** The wizard is the configuration layer for the context library product. Every team that buys a context library bundle runs the wizard first. It's the onboarding tool. And because it benchmarks to the product (not the AI), it doesn't go stale when models improve.

- **"Show me what the simplest recommendation looks like."** No/Low AI × Low Novelty × Low Complexity: three Foundation documents (Vision, Vocabulary, Strategy), three Amplifier references, four Deprioritized. The wizard says: "Your configuration needs a lightweight library. Your team's conversations do the alignment work." That honest, minimal recommendation is as important to credibility as the Factory H/H maximal one.
