# Phase 6: Intake & Gap Analysis Engine

Status: **Draft**

---

## What This Phase Does

The wizard (Phases 1-5) produces a prioritized recommendation: "here's what you should seed and in what order." The intake engine compares that recommendation against what a team already has, scores the gaps, sequences the work, and provides solicitation prompts to extract the missing knowledge.

This is the **Estate Attorney Protocol** — a five-phase intake process.

---

## The Five Phases

### Phase A: Wizard Configuration

The team answers the three wizard questions. Output: a mode, novelty level, complexity level, and the corresponding tier assignments for all areas in the pool.

*This phase is already built (Phases 1-5).*

### Phase B: Knowledge Declaration

The team declares what they currently have. For each area in their pool, they report:

- **Status:** Absent / Partial / Present
- **Freshness:** Fresh / Stale / Unknown (only relevant when Status = Present or Partial)
- **Notes:** Free-text description of what exists (optional)

**Guidance for the team:**

> For each knowledge area, think about whether you could hand a new team member (or AI builder) a document right now that covers it. If yes, is it current? If partially, what's missing?

Teams don't need to declare every area. Undeclared areas default to Absent/Unknown.

### Phase C: Gap Scoring

Each area receives a priority score:

```
priority_score = tier_weight × gap_severity × freshness_penalty

tier_weight:
  foundation = 1.0
  core       = 0.75
  amplifier  = 0.5
  deprioritized = 0.25

gap_severity:
  absent  = 1.0
  partial = 0.6
  present = 0.0

freshness_penalty (only when status = present):
  stale   = 0.4
  unknown = 0.2
  fresh   = 0.0
```

**How it works:**

- An absent Foundation area scores 1.0 × 1.0 = **1.0** (highest priority)
- A partial Core area scores 0.75 × 0.6 = **0.45**
- A stale present Amplifier scores 0.5 × 0.4 = **0.20**
- A fresh present area scores 0.0 (no action needed)
- A deprioritized absent area scores 0.25 × 1.0 = **0.25**

The scoring naturally produces the right ordering: Foundation gaps first, then Core gaps, then stale items, then Amplifiers, then Deprioritized.

### Phase D: Sequencing

Areas with scores > 0 are sorted into a seeding sequence:

1. **Primary sort:** Priority score (descending)
2. **Tiebreaker 1:** Tier rank (Foundation > Core > Amplifier > Deprioritized)
3. **Tiebreaker 2:** Catalog order (1.1 before 1.2, etc.)

The sequence is presented in phases matching the tier of each gap:

- Phase 1: Foundation Gaps
- Phase 2: Core Gaps
- Phase 3: Amplifier Gaps
- Phase 4: Already Covered (no action needed)

Deprioritized gaps appear after Amplifier gaps as "Phase 3b: Low-Priority Gaps" only if they exist.

### Phase E: Solicitation & Impact

Each gap receives:
- An **impact statement** explaining what goes wrong without this knowledge, tailored to the team's mode and configuration
- A **solicitation prompt** designed to extract the knowledge from the team
- A **"what good looks like"** benchmark
- A **common pitfall** warning

---

## Solicitation Prompt Library

Each area has a base solicitation prompt, plus mode-sensitive variants where the framing changes based on who will consume the knowledge.

### 1.1 Product Vision

**Solicitation prompt:**
> In one sentence, what is your product and why does it exist? Then tell me: who is the target user, and what's the core value proposition they can't get elsewhere?

**What good looks like:** A vision statement that a new team member could read and immediately understand what the product is, who it's for, and why it matters — without jargon or aspirational padding.

**Common pitfall:** Writing a mission statement instead of a vision. "We empower teams to..." is a mission. "A real-time collaboration tool for distributed design teams who need to iterate on spatial layouts together" is a vision.

### 1.2 Product Strategy

**Solicitation prompt:**
> What are the 2-3 bets your team is making right now? For each one: what are you optimizing for, and what are you explicitly sacrificing? What would need to be true for each bet to pay off?

**What good looks like:** Named bets with explicit trade-offs. "We're betting on depth over breadth — fewer features, richer experience per feature. We sacrifice onboarding speed for long-term engagement."

**Common pitfall:** Listing goals instead of bets. "Increase retention" is a goal. "We're betting that progression mechanics drive retention better than content volume" is a strategy.

**Thesis nudge:** If the team is ready, push toward Product Thesis: "Can you state each bet as a falsifiable claim? What evidence would tell you the bet is wrong?"

### 1.3 User Personas / JTBD

**Solicitation prompt:**
> Describe your primary user. What's their job title or role? What outcome are they trying to achieve when they open your product? What context are they in — rushed? Exploratory? Habitual?

**Mode variants:**
- *Short-Order Cook / Pair Programmer:* "When your AI builder is implementing a feature, what does it need to know about the user to make good micro-decisions? Think about default values, error messages, empty states."
- *Factory:* "Your AI builder will make hundreds of decisions about copy, layout, and defaults without asking anyone. What user assumptions should it NEVER violate?"

**What good looks like:** A persona that includes context (when/where/why they use the product), not just demographics. JTBD format preferred: "When [situation], I want to [motivation], so I can [outcome]."

**Common pitfall:** Creating an idealized user instead of a real one. If your actual users are time-pressed managers who skim, don't describe a thoughtful explorer who reads every tooltip.

### 1.4 Competitive Analysis

**Solicitation prompt:**
> Name your top 3 competitors or closest alternatives (including "do nothing" or "use a spreadsheet"). For each: what do they do well that you don't? What do you do that they can't? Why would someone choose you over them?

**Mode variants:**
- *Pair Programmer:* "When your AI builder proposes a feature design, it needs to know what makes your product different from [competitor]. What should it NEVER copy from the category leader, and what conventions should it adopt?"
- *Factory:* "Your AI builder's training data includes thousands of products in your category. Without this, it will build the category-generic version. What specific design decisions differentiate you?"

**What good looks like:** A competitive position that names what you're deliberately NOT doing, not just what you're doing better.

**Common pitfall:** Only listing competitors you're clearly better than. The most useful competitive analysis includes the competitor that's genuinely better at something — and explains why you're not trying to match them.

### 1.5 Market Requirements

**Solicitation prompt:**
> What evidence supports your product strategy? User research, survey data, interview quotes, analytics, usage patterns. Where did the key insights come from, and how confident are you in them?

**What good looks like:** Named evidence linked to specific strategic decisions. "We shifted to mobile-first after analytics showed 72% of sessions under 3 minutes on mobile."

**Common pitfall:** Listing evidence that confirms the strategy without including evidence that challenged it. The most useful market requirements include the surprising finding that almost changed the plan.

### 2.1 Information Architecture

**Solicitation prompt:**
> Draw me a map of your product. What are the top-level spaces or screens? How does a user move between them? What's the hierarchy — what's one click away from the home screen, and what's buried three levels deep?

**Mode variants:**
- *Short-Order Cook:* "When your AI builder adds a new screen or feature, where does it go? What's the naming convention for navigation items? What's the maximum depth before you'd restructure?"
- *Factory:* "Your AI builder will decide where new features live in the navigation hierarchy. What rules govern placement, grouping, and progressive disclosure?"

**What good looks like:** A visual or structured map showing navigation paths, not just a list of screens. Include the "why" behind groupings.

**Common pitfall:** Documenting the current IA without explaining the organizing principle. "These screens are grouped because..." is more useful than just listing them.

### 2.2 Noun Vocabulary

**Solicitation prompt:**
> What do you call things in your product? List the key nouns — the objects, spaces, actions, and concepts that have specific names. For each: why that word? What's the metaphor family (e.g., spatial metaphors, manufacturing metaphors)?

**What good looks like:** A glossary that includes rejected alternatives. "We call them 'rooms' (not 'channels' or 'spaces') because the spatial metaphor extends to 'walking between rooms' and 'furniture' inside them."

**Common pitfall:** Listing terms without explaining the metaphor system. Individual names are less useful than the logic that generates them — because the AI needs to name NEW things consistently.

### 2.3 Product Entities

**Solicitation prompt:**
> What are the core objects in your product? For each: what are its key attributes? How does it relate to other objects? What's the lifecycle (created how, modified when, deleted or archived)?

**Mode variants:**
- *Short-Order Cook:* "When your AI builder implements a feature that touches [entity], what does it need to know about that object's attributes, relationships, and constraints?"
- *Factory:* "Your AI builder will create, modify, and display these objects hundreds of times. What invariants must NEVER be violated? What relationships are mandatory vs. optional?"

**What good looks like:** An entity-relationship description that covers lifecycle, not just structure. Include what CANNOT happen (e.g., "a task can never belong to two projects simultaneously").

**Common pitfall:** Describing the database schema instead of the product model. The AI needs to know "a project has members who can be owners or viewers" not "projects has a foreign key to users via project_members."

### 2.4 System Design

**Solicitation prompt:**
> What invisible mechanisms does your product have? Scoring systems, recommendation engines, progression mechanics, state machines, automation rules. For each: what are the inputs, what are the outputs, and what's the logic in between?

**Mode variants:**
- *Pair Programmer:* "When your AI builder proposes a change to a visible feature, which invisible systems might be affected? What are the unexpected connections?"
- *Factory:* "Your AI builder will implement features that feed into or consume from these systems. What interface contracts must be maintained?"

**What good looks like:** A system description that includes edge cases and failure modes, not just the happy path. "When the recommendation score is tied, we break ties by recency, not alphabetically."

**Common pitfall:** Describing the intended behavior without documenting the actual behavior. If the scoring system has known quirks or workarounds, document those too.

### 2.5 Full GDD / PRD

**Solicitation prompt:**
> Do you have a comprehensive product specification? If so, where does it live and how current is it? If not, what's the closest thing — a collection of feature specs, a wiki, a Notion database?

**What good looks like:** A document (or linked set of documents) that covers every feature's behavior, including edge cases, error states, and defaults. The test: could someone build the product from scratch using only this document?

**Common pitfall:** Treating the PRD as a historical artifact that captured the initial plan rather than a living document that reflects current behavior.

### 3.1 User Journey Maps

**Solicitation prompt:**
> Walk me through three key scenarios: (1) a first-time user's first 5 minutes, (2) a daily user's most common session, (3) what happens when something goes wrong (error, confusion, dead end). For each: what screens do they see, what decisions do they make, what emotions do they feel?

**What good looks like:** Journey maps that include emotional state, not just screens. "At this point the user is anxious because they just deleted something — the undo confirmation needs to be prominent and reassuring."

**Common pitfall:** Mapping the happy path only. The error recovery journey is often more revealing of product identity than the success path.

### 3.2 Emotional / Aesthetic Goals

**Solicitation prompt:**
> Pick 5 adjectives that describe how your product should feel. Now pick 5 that describe how it should NOT feel. For each pair (e.g., "calm, not clinical"), give me an example of a design decision that would cross the line.

**Mode variants:**
- *Factory:* "Your AI builder will choose copy tone, animation speed, color palette, spacing, and information density hundreds of times. What's the emotional north star it should use for every decision?"

**What good looks like:** Adjective pairs with concrete design implications. "Warm, not cutesy — we use rounded corners and soft shadows, but never cartoon illustrations or emoji in system messages."

**Common pitfall:** Listing only positive adjectives without the negative boundaries. "Friendly" means different things to different builders. "Friendly, not performative" is actionable.

### 3.3 Engagement Loops

**Solicitation prompt:**
> What brings your users back? Describe the daily, weekly, and (if applicable) seasonal rhythms. What triggers a return visit? What does the user get from coming back that they didn't have before?

**What good looks like:** Named loops with trigger → action → reward → investment structure. "Daily: notification of new activity (trigger) → review and respond (action) → social connection (reward) → contributing content that others will see (investment)."

**Common pitfall:** Describing notifications as the engagement loop. Notifications are triggers, not loops. The loop is the full cycle of trigger → value → reinvestment.

### 3.4 Progression / Mastery

**Solicitation prompt:**
> How is day 1 different from month 6? Does the product reveal complexity over time, unlock features, or change its behavior based on user expertise? What does a "power user" do that a beginner can't (or wouldn't think to do)?

**What good looks like:** A progression model with stages, thresholds, and what changes at each stage. "Beginners see simplified controls. After 10 completed projects, advanced filters and batch operations appear."

**Common pitfall:** Describing feature gating as progression. True progression is about the user's mental model deepening, not just unlocking UI elements.

### 3.5 Anti-Patterns

**Solicitation prompt:**
> Complete this sentence 5 times: "We are NOT a ___." For each, explain what that product/pattern does that you explicitly avoid, and why. Include at least one anti-pattern that someone on your team has accidentally built toward.

**Mode variants:**
- *Pair Programmer / Factory:* "Your AI builder's training data includes thousands of products. Without anti-patterns, it will default to the most common convention. What conventions from similar products would be WRONG for yours?"

**What good looks like:** Anti-patterns that reference specific, named products or patterns. "We are NOT Slack — we don't use threads, we don't have emoji reactions, and we don't show typing indicators. Our communication model is asynchronous by design."

**Common pitfall:** Writing anti-patterns that are too abstract to be actionable. "We're not corporate" doesn't help a builder. "We're not Salesforce — no dashboards with 15 charts, no configuration wizards with 7 steps" does.

### 4.1 Design System

**Solicitation prompt:**
> What's your visual language? Colors (with hex codes), typography (font families, sizes, weights), spacing system (base unit, scale), and component inventory (buttons, inputs, cards, modals). Where do these specs live?

**What good looks like:** A living reference (Figma library, Storybook, or design tokens file) that a builder can query directly. Includes both the specs and the rationale ("we use 8px base spacing because...").

**Common pitfall:** Documenting the design system without maintaining it. A stale design system is worse than no design system — the builder follows outdated specs confidently.

### 4.2 Interaction Patterns

**Solicitation prompt:**
> How do drag-and-drop, modals, transitions, tooltips, and gestures work in your product? For each interaction pattern you use: what triggers it, what does the user see, and what's the expected outcome? Are there patterns you explicitly avoid?

**What good looks like:** A pattern library with examples, not just descriptions. "Modal: triggered by destructive actions only. Always includes a cancel button. Never stacks (no modal-on-modal). Closes on Escape key."

**Common pitfall:** Documenting patterns in isolation without specifying when to use which one. "When should I use a modal vs. an inline expansion vs. a slide-over panel?" is the question the builder will ask.

### 4.3 Prototypes / Mockups

**Solicitation prompt:**
> Do you have visual references for what screens look like? Figma files, screenshots, Storybook stories, or even napkin sketches? For each key screen or flow, what's the most current visual reference?

**What good looks like:** A linked set of visual references organized by feature or flow, with annotations explaining intent — not just "here's what it looks like" but "here's why it looks this way."

**Common pitfall:** Having beautiful mockups for the initial design but no visual references for features added since launch. The AI builder needs references for the CURRENT product, not the launch version.

### 4.4 Accessibility Standards

**Solicitation prompt:**
> What's your accessibility commitment? WCAG level (A, AA, AAA)? Screen reader requirements? Keyboard navigation standards? Color contrast minimums? Do you have automated accessibility testing?

**What good looks like:** A standards document that includes both the requirements and the testing methodology. "WCAG 2.1 AA. All interactive elements must be keyboard-accessible. Color contrast minimum 4.5:1 for text. Tested with axe-core on every PR."

**Common pitfall:** Stating the WCAG level without specifying how it applies to your specific product. "WCAG AA" is a starting point, not a complete accessibility spec.

### 5.1 Key Decisions Log

**Solicitation prompt:**
> What are the 10 most important product decisions your team has made? For each: what was decided, what alternatives were considered, and why was this option chosen? Especially: what was explicitly rejected and why?

**Mode variants:**
- *Pair Programmer:* "Your AI builder will propose design alternatives. Which past decisions should it NEVER relitigate? What's the 'we already tried that' list?"
- *Factory:* "Your AI builder will encounter ambiguous situations where multiple approaches seem valid. Which decisions have already been settled, and what's the reasoning it should apply?"

**What good looks like:** A log that includes rejected alternatives with reasoning. "We chose event sourcing over CRUD because [reasons]. We considered but rejected GraphQL because [reasons]. These decisions are settled unless [conditions]."

**Common pitfall:** Logging decisions without recording the rejected alternatives. The most valuable entry in a decisions log is "we tried X and it failed because Y" — it prevents the costliest repeat mistakes.

### 5.2+5.4 Institutional Memory

**Solicitation prompt:**
> What are the lessons your team has learned the hard way? Failed approaches, postmortems, pivots, things that seemed like good ideas but weren't. What would you warn a new team member about on their first day?

**What good looks like:** A collection of "we learned that..." statements with context. "We learned that real-time collaboration requires conflict resolution at the data layer, not the UI layer — our first implementation caused data loss during concurrent edits."

**Common pitfall:** Only documenting dramatic failures. The most useful institutional memory includes small, repeated friction: "We keep discovering that [pattern] causes [problem] in [context]."

### 5.3 Roadmap

**Solicitation prompt:**
> What's coming in the next 3 months? What's explicitly deferred to later? What's the release sequence, and what depends on what? Are there features that are planned but should NOT be built yet (and why)?

**Mode variants:**
- *Pair Programmer:* "Your AI builder proposes features. What's already planned that it should align with? What's deliberately deferred that it should NOT try to implement early?"
- *Factory:* "Your AI builder will make implementation decisions that could conflict with planned work. What upcoming features should it design for, even if they're not being built yet?"

**What good looks like:** A roadmap with dependencies and rationale, not just a timeline. "Feature B depends on Feature A's data model. Feature C is deferred because we need user feedback from Feature A first."

**Common pitfall:** A roadmap that only shows what's being built, without showing what's explicitly NOT being built yet. The "not yet" list prevents premature implementation.

---

## Impact Statement Templates

Impact statements are generated by combining the area's `when_missing` description with the mode narrative. Templates:

**Foundation gap:**
> Without [area name], [when_missing effect]. At [mode], this means [mode-specific consequence]. This is a Foundation gap — other knowledge areas depend on it for coherence. Seed this first.

**Core gap:**
> [When_missing effect]. For your [novelty]-novelty, [complexity]-complexity product at [mode] mode, this is a primary value driver — [mode-specific explanation of why this area is Core at this config].

**Amplifier gap:**
> [When_missing effect]. This area multiplies the effectiveness of your Foundation and Core knowledge. With [area name] in place, [specific amplification effect].

**Deprioritized gap:**
> [When_missing effect]. At your configuration ([novelty] novelty, [complexity] complexity), this is lower priority because [reason it's deprioritized at this config]. Seed this after higher-priority areas are in place.

---

## Sequencing Algorithm

```
function sequence(wizard_output, knowledge_declaration):

  # 1. Score each area
  for each area in wizard_output.recommendations:
    declaration = knowledge_declaration.find(area.id) or { status: "absent", freshness: "unknown" }

    tier_weight = { foundation: 1.0, core: 0.75, amplifier: 0.5, deprioritized: 0.25 }[area.tier]

    if declaration.status == "present":
      gap_severity = 0.0
      freshness_penalty = { stale: 0.4, unknown: 0.2, fresh: 0.0 }[declaration.freshness]
      score = tier_weight × freshness_penalty
      action = freshness_penalty > 0 ? "refresh" : "none"
    else:
      gap_severity = { absent: 1.0, partial: 0.6 }[declaration.status]
      score = tier_weight × gap_severity
      action = declaration.status == "absent" ? "create" : "update"

    area.priority_score = score
    area.action = action

  # 2. Sort
  sort areas by:
    - priority_score descending
    - tier rank ascending (foundation=0, core=1, amplifier=2, deprioritized=3)
    - catalog order ascending

  # 3. Group into phases
  phase_1 = areas where tier == foundation AND action != none
  phase_2 = areas where tier == core AND action != none
  phase_3 = areas where tier == amplifier AND action != none
  phase_3b = areas where tier == deprioritized AND action != none
  phase_4 = areas where action == none

  return { phases: [phase_1, phase_2, phase_3, phase_3b, phase_4], sequence: sorted_area_ids }
```

---

## Edge Cases

### Empty declaration
If the team provides no knowledge declaration, every area is scored as Absent. The output is simply the wizard recommendation re-presented as a seeding sequence.

### Everything is present and fresh
Output is a clean bill of health: "Your library covers all [N] recommended areas. No gaps detected." Consider suggesting a refresh schedule.

### Foundation gaps with present Core areas
Flag this explicitly: "You have Core knowledge but missing Foundation prerequisites. The Core knowledge may be internally inconsistent without [Foundation area]. Prioritize Foundation gaps before building on Core."

### Team declares areas outside their pool
Ignore gracefully. The intake engine only scores areas within the wizard-selected pool. Knowledge the team has beyond their pool is a bonus, not a concern.

### Partial + Stale
If an area is both Partial and Stale, treat as Partial (gap_severity = 0.6). The freshness penalty only applies to Present items. Partial items need updating regardless of freshness.
