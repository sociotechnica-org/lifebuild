# Context Library: Story and Logic

A guide for engineering teams building tooling around the context library system.

**Purpose:** This document tells the full story of a context library — what happens, in what order, why, and what rules govern each step — so that software can be built to augment or replace agent-driven work where appropriate.

**Audience:** Engineers working on Issue #753 (Context Library Wizard Engine) and follow-on tooling.

**What this is not:** A user manual or onboarding guide. This document describes the mechanics of the system from the inside.

---

## Framing: What the Library Is and Why It Exists

Software development agents make hundreds of micro-decisions per session. Without domain context, they produce technically correct but contextually wrong outputs — the right abstraction in the wrong place, the right feature with the wrong interaction model, the right architecture that violates a product bet made six months ago.

The context library makes implicit knowledge explicit and queryable. It encodes the WHERE, WHEN, and WHY that experienced developers absorb by osmosis, then delivers that knowledge to agents at decision time.

The library is a knowledge graph, not a document collection. Cards are nodes. Wikilinks (`[[Type - Name]]`) are edges. The graph has typed nodes, typed edges, and directional traversal rules. Quality is measured across five dimensions per card. The whole thing is stored as markdown files in a folder structure that encodes the taxonomy.

**Important:** The context library system is designed to be architecture-agnostic. The LifeBuild implementation uses a specific type taxonomy drawn from its metroidvania-inspired product architecture (Zones, Rooms, Structures, etc.), but the underlying mechanics — typed knowledge graphs, retrieval profiles, traversal depth rules, mandatory categories, five-dimension quality rubrics — are general. Future implementations will use different noun sets appropriate to their architecture. Where this document uses LifeBuild-specific type names for concreteness, read them as illustrative examples of the general pattern: containment hierarchies, leaf vs. hub nodes, rationale chains, and governed domains.

**Scope boundary:** The context library encodes *product knowledge* — what to build, why, and how concepts relate. It does not encode technical knowledge (how to code, framework patterns, API usage). The library tells an agent "this component must conform to the Visual Rendering Standard and lives within the Map workspace" — it does not tell the agent how to write React components. Technical knowledge belongs in code, docs, and CONVENTIONS files. Product knowledge belongs in the library.

---

## Part 1: The Story (User Journey)

### Phase 1: Configuration

**What triggers it:** Someone decides to build a context library for a product domain, or a new domain area is being added to an existing library.

**Who does it:** Human (decides what matters) + the Wizard Engine (structures the decision into library requirements).

**The narrative:** Before a single card is written, someone needs to decide what knowledge areas are worth encoding. This is not obvious. A product with novel user-facing concepts has different needs than a product built primarily on standard patterns. A team that writes a lot of new agents has different needs than one that mostly modifies UI components.

The configuration decision is fundamentally a prioritization exercise: given finite time and attention, which knowledge domains will pay off most when agents can access them? Three dimensions drive this:

- **AI Mode** — How many agentic decisions happen per session? A heavily agentic workflow (agents writing other agents, complex orchestration) needs deeper WHY coverage. A lightly agentic workflow needs shallower coverage in more domains.
- **Domain Novelty** — How much does this product depart from standard patterns? Novel domains (custom data models, unique interaction paradigms, domain-specific rules) need richer WHAT and HOW coverage. Conventional domains can lean on general knowledge.
- **Product Complexity** — How many interconnected subsystems exist? High-complexity products need complete graph coverage; partial coverage creates dangerous gaps where an agent thinks they have context but is missing a critical dependency.

These three inputs produce a prioritized list of knowledge areas — specific card types and topic clusters to build first.

**What decisions require human judgment:** All of it. The Wizard Engine structures the question and scores the options, but the human decides what their product actually is. The Wizard cannot know that a particular API contract is more fragile than it looks, or that a specific agent is doing riskier work than its name implies.

**What can be automated:** The scoring engine (pool membership → sensitivity profiles → priority ranking → gap analysis). The output is a configuration document that seeds the inventory phase.

---

### Phase 2: Seeding

**What triggers it:** A configuration exists (or an existing library needs new content for a new zone/domain).

**Who does it:** Conan (inventory + grading) and Sam (card creation), with human oversight at gates.

**The narrative:** Seeding is the build phase — getting knowledge into the library for the first time. It follows a strict build order because cards reference each other, and you cannot write good downstream cards before upstream cards exist.

The sequence runs in this order, for good reason:

1. **Source Assessment (Job 0):** Before any cards are created, Conan audits the source material — game design documents, strategy memos, research notes, existing documentation — to determine whether it contains enough information to produce quality cards. The assessment scores coverage across five dimensions (WHAT, WHERE, WHY, HOW, WHEN) and identifies gaps that will cascade into weak cards. A source that describes product features without any rationale will produce cards with hollow WHY sections. A source with only positive descriptions and no anti-patterns produces cards without anti-examples. The output is a readiness classification: READY (proceed), GAPS (proceed with caution, flag issues), or BLOCKED (stop, need human input).

2. **Inventory (Job 1):** Conan reads the source and produces a manifest of every card that should exist — card type, source reference, build order, and classification rationale. The inventory is the contract: Sam builds to this manifest, Conan grades against it. The build order within the manifest is strict: Standards first (they constrain everything), then Product Thesis and Principles (the WHY layer), then Systems (cross-cutting mechanisms), then Zones and Rooms (containers), then Overlays, Structures, Artifacts, and Capabilities, then Components (leaf nodes), and finally Agents and Prompts.

3. **Spot-Check Gate (Job 2.5):** After Standards are built but before product-layer cards begin, Conan spot-checks the upstream layer. A product-layer card with a well-intentioned WHY link to a stub Product Thesis is worse than a card with no WHY link — it signals coverage that doesn't exist. If upstream is hollow, downstream cards built against it will inherit the problem.

4. **Card Creation (Sam):** Sam builds cards in the manifest's prescribed order using type-specific templates. Each card has five dimensions: WHAT (standalone definition), WHERE (ecosystem relationships via wikilinks with context phrases), WHY (rationale chain linking to Product Thesis/Principles), WHEN (temporal status), and HOW (implementation detail with concrete examples and anti-examples). The creation procedure is sequential per card: read the source, write WHAT first (it anchors everything), then WHERE (mapping the ecosystem), then WHY (tracing rationale), then WHEN (marking temporal status), then HOW (implementation detail with examples). Sam runs a self-check before handing off to Conan — not as ceremony but because common issues (naked wikilinks, missing conformance links, stub WHY targets, HOW sections without examples) are caught most efficiently before grading.

5. **Grading (Job 2):** Conan grades every card against a rubric with five dimensions at equal weight (20% each). Each dimension has letter grades A through F with specific criteria. The overall card grade is a weighted average converted back to a letter. Zone scores aggregate card scores with a completeness cap (fewer than 25% of expected cards present = maximum grade of D, regardless of individual card quality). The system-wide score is the average of zone scores.

**Key fragility in the current process:** The handoff between Sam and Conan is entirely conversational. Sam reports readiness; Conan begins grading. There is no automated validation that all cards in the manifest exist, that every wikilink resolves to a real file, or that conformance links are reciprocal. These are all caught by Conan during grading, but catching them at grade-time rather than at write-time means Sam has already moved on to other cards.

**Human judgment required:** Source assessment readiness calls (BLOCKED vs. GAPS vs. READY), classification decisions when the taxonomy is ambiguous (Conan flags these as `HUMAN JUDGMENT NEEDED`), and decisions about whether to build cards for speculative future features or only for implemented behavior.

---

### Phase 3: Assembly

**What triggers it:** A builder agent needs to implement a task involving product concepts.

**Who does it:** Conan.

**The narrative:** Assembly is the library's primary runtime operation. When a builder agent is about to implement something that touches product concepts — a new component, a changed system, a new agent — Conan assembles a context briefing that gives the builder what they need without burying them in everything.

The assembly procedure runs in eight steps:

**Step 1: Load retrieval knowledge.** Conan reads the retrieval profiles, traversal guide, and protocol documents. These are the assembly rules.

**Step 2: Classify the task.** From the task description, Conan identifies the target card type (what kind of thing is being built?) and task type (feature addition, bug fix, refactoring, new component, or architecture change). The type classification determines which retrieval profile to apply.

**Step 3: Find seed cards.** Conan searches the library for cards directly related to the task using keyword searches and type-based glob patterns. Two to four cards are selected as seeds — the highest-relevance starting points.

**Step 4: Expand via retrieval profile.** Each card type has its own retrieval profile specifying what categories must be included, how many hops to traverse, and which dimensions to prioritize. For example, a leaf-node type (e.g., a UI component card) retrieves 1 hop (up to parent container, across to siblings, to conforming Standards) and prioritizes HOW and WHAT. A highly-connected type (e.g., an AI agent card) retrieves 3 hops (home workspace, capabilities, managed artifacts, rationale chain) and prioritizes WHY and WHERE. The profile also specifies lateral scope (narrow for Components and Structures, broad for Systems and Agents) because some card types affect many parts of the product.

Expansion works by reading each seed card, extracting all wikilinks, following mandatory upstream links (containment parents, WHY chains), and grepping for cards that reference the seeds (reverse edges). This produces a candidate set.

**Step 5: Check mandatory categories.** Each retrieval profile specifies categories that must be present regardless of what the traversal found. If a mandatory category is absent (no Standards card for a Component assembly, no Product Thesis for an Agent assembly), Conan searches specifically for it rather than proceeding with a gap.

**Step 6: Assemble and write.** Conan writes `.context/CONTEXT_BRIEFING.md` following the Context Briefing Protocol format: Task Frame (what needs to be built, constraints, acceptance criteria), Primary Cards (3-5 cards in full), Supporting Cards (summaries of expanded graph cards), Relationship Map (typed triples showing how cards connect), and Gap Manifest (topics where no card was found despite searching).

The protocol specifies card budgets by task complexity: simple tasks get 5-8 total cards, medium tasks get 8-13, complex cross-system tasks get 10-16, and architecture changes get 13-20. This is a constraint, not a target — the briefing should include what's needed, but not everything.

Ordering follows U-shaped attention: the beginning of the briefing gets primary cards (highest attention), the middle gets relationship maps and supporting card summaries (lowest attention), and the end gets WHY/anti-pattern content and constraints (second-highest attention). Cards that serve dual purposes (primary content AND WHY chain) appear at the beginning in full and have their anti-patterns extracted to the end section.

**Step 7: Check WHEN sections.** WHEN sections record vision-vs-reality divergences — features described as planned that haven't shipped, systems that exist in vision but not in code. Conan reads WHEN sections on seed and expanded cards and incorporates any temporal context into the briefing.

**Step 8: Log provenance and triage feedback.** Every assembly is logged to `provenance-log.jsonl`. After logging, Conan reviews the assembly for actionable library feedback: gap manifest entries that indicate cards should be created, cards encountered with thin dimensions, cards that should have been found by the retrieval profile but weren't, and relationship connections discovered during traversal that aren't recorded as wikilinks. Actionable items go to `feedback-queue.jsonl`.

**Key fragility:** The provenance log is written by the agent at the end of assembly. If the assembly skill is invoked directly (not through the Conan agent wrapper), logging is bypassed. The provenance data undercounts actual library usage. Additionally, assembly is stateless — each assembly starts from scratch. There is no caching, no pre-computation of common traversal paths, and no awareness of recent assemblies for related tasks.

---

### Phase 4: Implementation

**What triggers it:** A builder agent receives the completed context briefing.

**Who does it:** Builder agents (code-writing agents that are *not* Conan or Sam).

**The narrative:** The context briefing is handed off to whichever agent is doing the actual software work. The briefing is the contract: Conan says "here's what matters for this task," and the builder uses it as the governing reference for product-domain decisions during implementation.

**Clarification on roles:** Sam the Scribe writes *library cards*, not code. Conan assesses and decides; Sam writes cards. Builder agents write code. The division exists for practical reasons: Conan's assessment work benefits from a stronger reasoning model, Sam's card-writing work is high-volume and can use a faster/cheaper model, and builder agents need yet different capabilities (code generation, test writing, etc.). Keeping these roles separate also means each agent's context window stays focused on its job.

During implementation, builder agents encounter uncertainty about product concepts. The 5-signal decision matrix governs what to do:

- **Reversibility:** Easily undone (formatting, tests) → proceed. Hard to reverse (schema changes, API contracts, data migrations) → search the library.
- **Context coverage:** Briefing has relevant dimensions → proceed. Missing cards for the affected area → search.
- **Precedent:** Similar pattern in briefing or codebase → proceed. Novel pattern with no precedent → search.
- **Blast radius:** Change affects one file → proceed. Change propagates across systems → search.
- **Domain specificity:** General programming pattern → proceed. Product-specific concept → search.

Two or more "search" signals require the builder to search the library before proceeding. The search uses a structured query format: uncertainty dimension, topic, default assumption, impact if wrong, search terms. This logs the uncertainty for later review and prevents ad-hoc searches that don't surface useful information.

Loop prevention caps searches at three rounds per uncertainty, requires novel terms each round, and escalates to the human or proceeds with a documented default assumption when confidence doesn't improve. After task completion, the builder updates the provenance log with decision outcomes (success, failure, partial) — this closes the feedback loop for provenance analytics.

**Key fragility:** Builder self-searches during implementation are not always logged. The query format in the protocol captures the intent, but compliance depends on the builder following the procedure. Missed logs mean the system cannot learn which gaps in the briefing forced searches, which would be the highest-quality signal for improving retrieval profiles.

**Note:** Sam the Scribe *also* uses the 5-signal matrix, but during *card creation* (Phase 2), not during code implementation. When Sam encounters uncertainty about product concepts while writing a card — e.g., "is this a System or a Capability?" — the same search protocol applies. The matrix is a general uncertainty-resolution procedure, not implementation-specific.

---

### Phase 5: Feedback

**What triggers it:** Conan completes an assembly (automatic triage) or Conan runs a Health Check (batch review of the feedback queue).

**Who does it:** Conan (triage), human (prioritization), Sam (fixes).

**The narrative:** Every assembly generates potential feedback. After writing the briefing and logging provenance, Conan reviews what happened during assembly:

- **Gap manifest entries** — did searches fail to find cards that should exist? Some gaps are expected (a card type that's not yet built), but others indicate the library needs new content.
- **Weak cards** — were any cards encountered with dimensions too thin to be useful? A card that was retrieved but contributed nothing to the briefing is a signal.
- **Retrieval misses** — did traversal surface cards that the retrieval profile should have found automatically but didn't? This indicates the profile itself needs updating.
- **Relationship discoveries** — were connections between cards noticed during traversal that aren't recorded as wikilinks? Missing edges degrade future traversals.

Feedback items are classified as noise (expected, not worth tracking) or actionable (library should be improved). Actionable items are written to `feedback-queue.jsonl` with type, severity, affected card, dimension, and suggested action.

The queue accumulates over time. During maintenance cycles (Health Checks, Recommend runs), Conan reviews the queue and prioritizes fixes. High-severity items (blocked assembly or forced builder to guess on a critical dimension) get addressed first.

**Key fragility:** The feedback queue is write-only from Conan's perspective. There is no automated prioritization, no deduplication of repeated gaps, and no mechanism to escalate high-severity repeated items to the human automatically. The human must manually review the queue during maintenance cycles to extract signal.

---

### Phase 6: Maintenance

**What triggers it:** Periodic schedule (quarterly health check), post-release (new cards needed), feedback queue accumulation (too many high-severity items), or explicit request ("how healthy is the library?").

**Who does it:** Conan (assessment and recommendations), Sam (fixes), human (priority decisions).

**The narrative:** The library is not self-maintaining. Cards drift from source material as the product evolves. Cards become weak as product complexity grows and HOW sections that were once sufficient no longer cover the full behavior. New Standards are created but product-layer cards that should conform to them aren't updated. The graph develops orphan nodes (cards with no incoming links) and broken edges (wikilinks to cards that were renamed or deleted).

Maintenance runs a job sequence:

**Health Check (Job 8):** The periodic assessment. Six phases in order: source alignment (do cards reflect current source?), inventory reconciliation (do cards exist for what should exist?), Standards health (spot-check all Standards), Product Thesis/Principle health (spot-check all rationale-layer cards), product-layer sampling (full grade on 20% of cards or 10 cards, whichever is larger, selected by highest-link-count cards), and cascade analysis (trace weak cards upstream to find root causes).

The cascade analysis is the critical step. A product-layer card weak on WHY might be a card-level issue (the writer just didn't fill it in) or it might be that the linked Product Thesis is a stub. Fixing the card-level problem without fixing the upstream stub means every other card linking to that Product Thesis has the same root-cause issue. Cascade analysis distinguishes between symptoms and root causes.

**Diagnose (Job 3):** When Health Check identifies a problem cluster, Diagnose traces it to root causes and calculates blast radius — how many other cards would be affected by a fix. Blast radius informs prioritization: a fix to one upstream card might resolve issues in twenty downstream cards.

**Recommend (Job 4):** Prioritizes fixes by cascade potential. High blast radius + upstream position = fix first.

**Surgery (Job 7):** Produces six-phase fix plans for Sam. Surgery does not directly edit cards — it tells Sam exactly what to fix, in what order, with what criteria for success.

**Review (Job 5):** After Sam applies fixes, Conan re-grades and produces a delta report showing before/after scores.

**Downstream Sync (Job 9):** After any structural change (new types, renames, folder changes, bulk card creation), Conan verifies and fixes meta-files — agent definitions, skill procedures, retrieval profiles — to prevent drift between the library structure and the tools that navigate it. This is the only maintenance job where Conan directly edits files (meta-files are infrastructure, not cards).

**Human judgment required:** Priority decisions across competing maintenance needs, go/no-go on structural changes (renaming a card type, reorganizing a folder), and resolution of HUMAN JUDGMENT NEEDED flags from grading.

---

### Phase 7: Evolution

**What triggers it:** Product changes (new zone, new feature area, changed architecture), team changes (new agents being added), or strategic changes (product thesis updates).

**Who does it:** Human (decides direction), Conan (assesses impact), Sam (builds new content), Conan (downstream sync).

**The narrative:** The library is a model of the product. When the product changes, the library must change. Evolution is different from maintenance — maintenance fixes quality problems in existing content, evolution adds or restructures content to reflect a new reality.

Common evolution triggers:

- **New domain area:** A new top-level workspace area requires inventory of all contained elements — sub-workspaces, UI elements, capabilities, agents, mechanisms. Run the full build sequence: Source Assessment → Inventory → Standards → Spot-Check → Product Thesis/Principles → Spot-Check → product-layer cards → Grade.
- **Architectural change:** A mechanism is redesigned, an agent is replaced, a core data entity gains new properties. Cards for the affected area need updates, and the blast radius assessment identifies all downstream cards that reference the changed card.
- **Type taxonomy changes:** Occasionally the card type taxonomy itself evolves (e.g., the addition of a new type, or splitting one type into two). These changes require Downstream Sync to update retrieval profiles, templates, and agent definitions.
- **Source update:** Source material (game design documents, strategy memos) is updated to reflect new decisions. Conan runs Source Assessment against the new material, identifies drift (cards that no longer reflect the source), and produces an update plan.

The auto-trigger rule for Downstream Sync is important: any job that changes library structure must be followed by Downstream Sync. This prevents the meta-files (retrieval profiles, templates, agent definitions) from drifting out of sync with the library they describe.

---

## Part 2: The Logic (Rules Engine)

### Configuration Logic

The Wizard Engine (#753) takes three inputs and produces a prioritized list of knowledge areas:

**Pool membership:** Each knowledge area is associated with a pool of card types. Different modes (AI-heavy, human-heavy, hybrid) have different pool sensitivities. An AI-heavy workflow weights Agent and Prompt cards higher; a human-heavy workflow weights Zone and Room cards higher.

**Sensitivity profiles:** Each card type has a base sensitivity that reflects how much damage a gap in that type causes to assembly quality. WHY-chain types (Product Thesis, Principles) have the highest sensitivity — a gap there propagates to every card in the downstream subgraph. Standards have high sensitivity because they constrain many product-layer cards. Components have low sensitivity because they are leaf nodes affecting only their immediate container.

**Mode floors:** Regardless of domain configuration, certain types have minimum coverage requirements. WHY-chain types always need at least baseline coverage. Standards for governed domains always need coverage before any product-layer cards in those domains are useful.

**Override rules:** Some combinations of inputs force specific coverage regardless of scoring. High domain novelty + any AI mode → Primitive and System cards are mandatory. High product complexity + high AI mode → the full graph must be covered, no exceptions.

**Gap scoring:** After the initial coverage plan is produced, the Wizard runs a gap analysis that scores the cost of each gap — how many assembly tasks would be degraded if this area is missing. High-cost gaps get surfaced first.

---

### Seeding Logic

**Build sequence:** Standards → Product Thesis/Principles → cross-cutting mechanisms → containers (top-level → nested) → contained elements (overlays, spatial elements, content objects, actions) → leaf UI elements → agents/prompts. The rationale: downstream cards reference upstream cards. A workspace card references its parent container (must exist), its resident agent (must exist), and its conforming Standards (must exist). Building in this order means every reference can be followed and verified as Sam writes.

**Spot-check gates:** Two mandatory gates in the build sequence: after Standards (before product-layer begins) and after Product Thesis/Principles (before product-layer begins). Gates catch hollow upstream cards before they become load-bearing references in dozens of downstream cards.

**Source assessment rubric:** Five-dimension coverage assessment against source material. WHY and HOW gaps are treated as most severe because they're hardest to recover from — if the source never explains why something works the way it does, a card author cannot invent that rationale without human input. WHAT gaps are less severe because card boundaries can often be inferred from context.

**Atomicity rule:** One concept per card. A card that answers multiple complete questions should be split. Signals: 700+ words, multiple subsections that could stand alone, different tasks need different portions. The hub/spoke distinction: one concept with multiple aspects = single card with subsections; distinct concepts that relate = separate cards with wikilinks.

---

### Assembly Logic

**Type-based retrieval profiles:** Each of the 15 card types has its own profile specifying what must be included, how many hops to traverse, dimension priority ordering, lateral scope, and anti-pattern requirements. Profiles are not suggestions — they are the rules. Missing a mandatory category is an assembly deficiency.

**Traversal depth rules:** Depth is determined by a card type's connectivity pattern, not its importance:

| Node Pattern | Hops | Rationale | LifeBuild Examples |
|------|------|-----|-----|
| Leaf nodes | 1 | Context is local — parent + siblings | Component, Structure |
| Mid-graph nodes | 2 | Local + immediate ecosystem | Workspace, Capability, Artifact, Overlay, Primitive, Aesthetic |
| Container nodes | 2 | Need contained elements | Zone, Loop |
| Hub nodes | 3 | Highly connected — need full subgraph | System, Agent, Journey |

**Mandatory categories by type:** Each retrieval profile specifies categories that must be present regardless of traversal results. The general pattern: leaf nodes must have their parent container and all conforming Standards. Hub nodes must have their home workspace, all managed artifacts, and at least one rationale-chain card. The specific mandatory categories vary by type taxonomy.

**Dimension priority ordering:** Each type weights the five dimensions differently. This affects which content is preserved when summarizing supporting cards. Cross-cutting mechanism types prioritize WHY > WHERE > HOW > WHAT (strategic and relational context matters most). Leaf UI types prioritize HOW > WHAT > WHERE > WHY (implementation detail matters most). Assembly uses these priorities when deciding what to summarize vs. include in full.

**Attention-aware ordering:** The U-shaped attention model (strongest at beginning and end) governs briefing structure. Primary cards + task frame go first. Relationship maps and supporting summaries go in the middle. WHY chains, constraints, and anti-patterns go at the end. This is not aesthetic — it is engineering for how LLM attention works.

**Card budgets:** Complexity-based caps prevent over-inclusion. Simple tasks: 5-8 cards total. Medium: 8-13. Complex: 10-16. Architecture: 13-20. Over-inclusion has real cost: it dilutes attention, buries the most relevant content in noise, and slows processing.

---

### Uncertainty Logic (5-Signal Decision Matrix)

Any agent working with library content — builder agents during code implementation, Sam during card creation — evaluates five signals when encountering uncertainty about product concepts:

| Signal | Proceed | Search |
|--------|---------|--------|
| Reversibility | Easily undone | Hard to reverse |
| Context coverage | All dimensions in briefing | Missing dimensions |
| Precedent | Pattern exists | Novel pattern |
| Blast radius | Single file/card | Cross-system |
| Domain specificity | General pattern | Product-specific |

**Rule:** 2+ search signals → must search before proceeding. This threshold balances speed against error risk. One search signal can often be handled with a reasonable default assumption. Two signals indicate meaningful uncertainty that a library query can resolve.

**Loop prevention:** Maximum 3 search rounds per uncertainty. Each round must use different search terms. If confidence doesn't improve after 3 rounds, proceed with documented default assumption. This prevents paralysis while ensuring uncertainty is always documented.

---

### Quality Logic

**Five-dimension rubric:** Each dimension is scored A through F against explicit criteria. All dimensions weighted equally at 20%.

| Dimension | A Criteria | F Criteria |
|-----------|-----------|------------|
| WHAT | Standalone, specific, complete, 2-4 sentences | Empty, placeholder, or pointer only |
| WHY | Full causal chain, alternatives acknowledged | Empty or no strategic connection |
| WHERE | Rich ecosystem map, all categories, conformance | Empty |
| HOW | Implementable, 2+ examples, 1+ anti-example | Empty |
| WHEN | Section exists, temporal status marked | Section missing |

**Conformance requirement:** Product-layer cards touching governed domains must link to constraining Standards. Missing conformance sets a ceiling of C for the WHERE dimension, regardless of link count.

**Four classification guardrails (in order):**

1. **Interaction Test:** Do builders say "I'm using X"? No → System (not Component or Capability).
2. **Component Litmus:** Can you point at one discrete widget? No → not Component.
3. **Overlay Test:** Persistence across ALL zones? No → not Overlay.
4. **Action-word Test:** Verbs in the name/description? → Capability (not Component).

**Two-layer quality model:** Structural integrity (correct types, sections, links, conformance) is assessed first. Functional utility (does the content actually serve assembly?) is assessed after structure passes. A structurally correct card with hollow WHY passes structural grading but fails functional utility.

**Heuristics:**

- **Purpose Frame:** Does this card give agents the implicit context that makes humans effective? Would an experienced developer know this without being told?
- **Six-Month Employee:** Would a developer with six months of product context say "that's not wrong, but it's missing the real story"? If yes, the card is hollow.
- **Trace Test:** Follow WHY links. Do they lead to substance or stubs?
- **Briefing Viability:** Does the assembled context for a typical task actually serve that task?

---

### Maintenance Logic

**Job dispatch:** The maintenance job system runs conditionally based on what's needed:

| Situation | Jobs to Run |
|-----------|------------|
| New zone being built | 0 → 1 → [Sam builds] → 2.5 → [Sam builds] → 2 |
| Regular health assessment | 8 → (3 → 4 if issues found) → (7 → Sam → 5 if fixes needed) |
| Structural library change | Any change job → 9 (always) |
| Post-release update | 0 → 1 → [build sequence] → 2 |

**Auto-trigger rule:** Job 9 (Downstream Sync) runs automatically after any structural change. No human prompt needed. This is the one rule most likely to prevent meta-file drift.

**Blast radius calculation:** Search for the card name across the entire library. Every match is a card that references it. Count by type: how many container cards? How many capability cards? How many Standards? High count + upstream type = large blast radius = fix first.

**Cascade analysis logic:**

- Card weak on WHY → check linked Product Thesis/Principle. Stub upstream = upstream fix (affects all downstream cards). Substantive upstream = card-level fix only.
- Card weak on HOW → check conforming Standard. Missing = Standard gap (affects all conforming cards). Vague = Standard fix. Concrete = card-level fix.
- Card weak on WHERE → check for missing containment links and conformance links. These are structural deficiencies, not content gaps.

---

## Part 3: Engineering Opportunities

### 1. The Wizard Engine (Issue #753) — Configuration + Gap Analysis

**Currently agent-driven:** A human or Conan manually assesses what knowledge areas to prioritize. No structured scoring.

**What software would do:** Accept three inputs (AI Mode, Domain Novelty, Product Complexity) as structured parameters. Apply pool membership rules, sensitivity profiles, mode floors, and override rules to produce a ranked list of knowledge areas with gap scores. Output a configuration document that seeds the inventory phase.

**What stays agent-driven:** The human judgment call about what "high domain novelty" actually means for their product. The final prioritization decision.

**How it connects to #753:** This is the core of #753. The engine produces the configuration; everything downstream depends on it being correct.

---

### 2. Library Inventory Scanner

**Currently agent-driven:** Conan reads the library folder structure and manually builds the manifest by inspecting filenames and contents.

**What software would do:** Scan `docs/context-library/` to produce an inventory of all existing cards by type (inferred from folder path and filename prefix), with link counts, wikilink targets, and last-modified timestamps. Diff against an expected inventory from configuration to identify gaps, unexpected cards, and naming convention violations.

**What stays agent-driven:** Classification judgment (is this a System or a Capability?), discovery of cards that should exist but aren't in the inventory yet.

**Connection to #753:** Follow-on to the Wizard. After configuration produces the expected inventory, the scanner validates what actually exists.

---

### 3. Graph Integrity Validator

**Currently agent-driven:** Conan checks for broken links, missing containment, and missing conformance links during grading. Catching these requires reading each card.

**What software would do:**
- Parse all wikilinks across all cards and verify they resolve to existing files.
- Verify containment links (Room links to a Zone, Component links to a Structure or Room, etc.) exist and are reciprocal.
- Verify conformance links: for each card type touching a governed domain, check that the appropriate Standard is linked.
- Report broken links, missing containment, and missing conformance as structured deficiencies.

**What stays agent-driven:** Judgment about whether a link's context phrase is substantive or naked. Structural validation is automatable; quality of the link description is not.

**Impact:** This catches the most common Sam-side errors before grading, reducing the grading round-trip. Currently these are caught at grade-time and require a fix cycle.

---

### 4. Retrieval Profile Enforcer

**Currently agent-driven:** Conan loads retrieval profiles from a markdown file and applies them manually during assembly. Profile compliance is not verifiable after the fact.

**What software would do:** Given a CONTEXT_BRIEFING.md, validate that mandatory categories for the declared target type are present. Check that card budget is within range for the declared complexity. Report mandatory category violations.

**What stays agent-driven:** The actual retrieval (finding and selecting the right cards), gap assessment (was the missing card missing because it doesn't exist or because Conan missed it?), and attention-ordering decisions.

**Impact:** Makes assembly quality auditable. Currently there is no way to know whether a briefing actually followed its retrieval profile without re-running the assembly.

---

### 5. Provenance Analytics

**Currently agent-driven:** The provenance log accumulates but analysis is manual (weekly review queries described in the schema documentation).

**What software would do:**
- Parse `provenance-log.jsonl` and produce usage metrics: which cards are retrieved most, which are never retrieved, which gaps repeat most often.
- Correlate assembly sessions with outcomes (success/failure) to identify cards that appear in failing sessions.
- Surface recurring gaps from the feedback queue for prioritization.
- Detect assemblies that bypassed the Conan wrapper (absence in provenance for tasks that should have produced an entry).

**What stays agent-driven:** Interpretation of the analytics. A card that's frequently retrieved but never decision-relevant might be a retrieval profile issue or might be appropriate context that happens not to generate explicit decisions.

**Connection to #753:** Gap analytics from provenance feed back into the Wizard's gap scoring — high-frequency gaps in assembly sessions inform which knowledge areas to prioritize.

---

### 6. Quality Dashboard

**Currently agent-driven:** Library quality is visible only when Conan runs a Health Check job. Between checks, the human has no visibility.

**What software would do:** Parse all card files and compute: dimension completeness (does each dimension section exist and have content?), link counts per card, conformance coverage percentage, inventory completeness by type, and overall zone/system scores using the grade computation formulas. Display as a dashboard with drill-down to problem areas.

**What stays agent-driven:** Actual grading (the rubric requires judgment). The dashboard shows completeness and structural signals, not quality scores.

**Impact:** Makes library health visible continuously rather than only at maintenance checkpoints. Enables the human to see degradation starting and trigger maintenance before it compounds.

---

### 7. Wikilink Browser / Graph Visualizer

**Currently agent-driven:** Graph traversal is done via sequential Grep and Glob calls, following one edge at a time. The full graph is never visible as a whole.

**What software would do:** Parse all wikilinks across all cards to build an actual graph data structure. Expose: shortest path between any two cards, blast radius query (all cards reachable from a given card), orphan detection (cards with no incoming edges), island detection (disconnected subgraphs), and visualization of the full card network.

**What stays agent-driven:** Interpreting why a path exists, deciding whether an orphan card should be connected or deleted, and assembly itself (the graph is used for retrieval, but retrieval still requires domain judgment).

**Connection to #753:** The Wizard's gap scoring could use graph data to calculate more accurate blast radius estimates. A missing card in a densely-connected region has higher cost than a missing card in a sparse region.

---

### 8. Assembly Cache / Pre-computation

**Currently agent-driven:** Every assembly starts from scratch. Common traversal paths (e.g., "what are all the conformance links for visual rendering?") are recomputed for each assembly.

**What software would do:** Cache the results of common traversal patterns (WHY chains for frequently-referenced Product Theses, conformance maps for each Standard, containment hierarchies). Invalidate cache entries when a card changes. Provide Conan with pre-computed subgraph data to reduce search rounds during assembly.

**What stays agent-driven:** The selection and assembly judgment — which cached subgraphs to include and how to weigh them against the task.

**Impact:** Reduces assembly time and search rounds. Currently Conan runs multiple sequential searches that could be pre-answered. This is most valuable for high-frequency assembly types (leaf UI elements and cross-cutting mechanisms tend to dominate assembly requests).

---

### 9. Feedback Queue Processor

**Currently agent-driven:** Feedback queue entries accumulate without prioritization, deduplication, or escalation. Human must manually review during maintenance cycles.

**What software would do:** Parse `feedback-queue.jsonl` to deduplicate repeated gaps (same card + dimension reported multiple times), score accumulated severity (a medium item reported 10 times = high effective priority), auto-escalate items above a severity threshold to a notification channel, and produce a prioritized work list for the next Sam maintenance session.

**What stays agent-driven:** The actual fix decisions (whether to create a new card, improve a dimension, or update a retrieval profile).

---

### 10. Downstream Sync Automation

**Currently agent-driven:** Conan manually checks all meta-files after structural changes. The scope of what needs checking is determined by reading the current state of the library.

**What software would do:** After a structural change (new type, rename, folder reorganization), automatically identify all meta-files that reference library structure (retrieval profiles, agent definitions, templates, reference.md) and diff them against the actual library state. Flag any divergence. Optionally apply deterministic updates (folder paths, card counts, type taxonomy tables) while leaving judgment-requiring content for Conan.

**What stays agent-driven:** Decisions about whether divergences are intentional (a retrieval profile intentionally handles a case the library hasn't built yet) or accidental.

---

## Summary: Automation Boundary

The rules of this library reveal a consistent pattern: **structural and mechanical operations are automatable; content quality and judgment calls are not**.

| Automatable | Requires Agent/Human |
|-------------|---------------------|
| Wikilink resolution checking | Judging whether link context phrase is substantive |
| Containment link existence | Deciding whether a card type is correct |
| Conformance link presence | Evaluating whether HOW is sufficient for a builder |
| Graph traversal and path-finding | Selecting which traversal results matter |
| Inventory diff (expected vs. actual) | Classification of ambiguous entities |
| Grade computation (arithmetic) | Grading each dimension (rubric application) |
| Provenance log parsing and analytics | Interpreting what the analytics mean |
| Feedback queue deduplication/scoring | Deciding what to fix and in what order |
| Cache invalidation | Assembly itself |

The Wizard Engine (#753) sits at the most valuable automation point: it transforms a configuration decision that currently requires significant Conan time into a structured scoring exercise. Everything downstream of good configuration — inventory, build order, seeding gates, assembly profiles — runs better when the library was built against the right priorities from the start.

---

*Document produced: 2026-03-13. Source files: `docs/context-library/README.md`, `.claude/skills/context-briefing/retrieval-profiles.md`, `.claude/skills/context-briefing/traversal.md`, `.claude/skills/context-briefing/protocol.md`, `.claude/skills/conan/rubrics.md`, `.claude/skills/conan/grade-computation.md`, `.claude/skills/sam/card-creation.md`, `.claude/skills/sam/self-check.md`, `.claude/skills/context-briefing/feedback-queue-schema.md`, `.claude/skills/context-briefing/provenance-schema.md`, `docs/context-library/reference.md`.*
