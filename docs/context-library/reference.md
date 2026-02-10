# Context Library Reference

Lookup tables for building and auditing Context Library cards.

---

## Type Taxonomy

```
WHY we build things?
├─ Guiding philosophy → STRATEGY
├─ Judgment guidance → PRINCIPLE
└─ Testable specification → STANDARD

WHAT exists?
├─ Directors consciously interact?
│   ├─ Navigate TO it?
│   │   ├─ Top-level workspace → ZONE
│   │   └─ Nested within a zone → ROOM
│   ├─ Persistent across all zones? → OVERLAY
│   ├─ Interact WITHIN a zone/room?
│   │   ├─ Spatial/visual fabric? → STRUCTURE
│   │   ├─ Specific UI widget? → COMPONENT
│   │   ├─ Content object you create/edit? → ARTIFACT
│   │   └─ Action/workflow you perform? → CAPABILITY
│   └─ Core data entity? → PRIMITIVE
├─ NO + governs behavior invisibly → SYSTEM
└─ AI team member → AGENT
    └─ Agent implementation → PROMPT

WHEN?
├─ Historical → LEARNING / DECISION
└─ Future → FUTURE

WHAT ships?
├─ Shippable unit → INITIATIVE
└─ Version marker → RELEASE
```

### Decision Tree

**Step 1: Is this about WHY we build?**
- Guiding philosophy (a bet) → Strategy
- Judgment guidance (a rule of thumb) → Principle
- Testable spec (concrete rules) → Standard

**Step 2: Do directors consciously interact with this?**
*Gate: "Do directors say 'I'm using X'?" If NO → skip to Step 3 (System).*
*Having visible UI effects does not make something a Component.*

- Navigate TO it?
  - Top-level (header nav) → Zone
  - Nested within zone → Room
- Persistent across ALL zones? → Overlay
- Interact WITHIN a zone/room?
  - Spatial canvas/fabric → Structure
  - Specific UI widget you can point at → Component
  - Content object directors create/edit → Artifact
  - Action/workflow directors perform → Capability
- Core data entity → Primitive

**Step 3: Is this invisible infrastructure?**
- Mechanism/rule → System

**Step 4: Is this an AI team member?**
- The agent itself → Agent
- The agent's implementation → Prompt

**Step 5: Is this temporal?**
- Past insight → Learning
- Past choice → Decision
- Future vision → Future

**Step 6: Is this about shipping?**
- Shippable scope → Initiative
- Version marker → Release

### Classification Guardrails

Apply these checks IN ORDER when classifying. Each gate eliminates common errors.

**Gate 1 — Interaction Test (apply FIRST):**
"Do directors consciously invoke or say 'I'm using X'?" If NO → System, regardless of visible UI effects.
- Adaptation changes UI progressively → but directors never invoke it → System
- Service Level Progression adjusts tiers → invisible mechanism → System

**Gate 2 — Component Litmus Test:**
Can you point at ONE specific, discrete widget on screen? If not, it's NOT a Component.
- Gold Position slot on The Table → pointable widget → Component
- Zoom Navigation → no single widget, it's a process → Capability
- Three-Stream Filtering → no single widget, it's a workflow → Capability

**Gate 3 — Overlay requires cross-ZONE persistence:**
Overlay = visible across ALL zones simultaneously. Persistence within one zone ≠ Overlay.
- The Table persists across every zone → Overlay
- Kanban Board appears only in Project Board room → Structure

**Gate 4 — Action-words signal Capability:**
Verbs and process-words (zooming, filtering, planning, navigating, reviewing) → Capability, not Component.

#### Common Misclassifications

| Often Misclassified As | Actually | Example | Reasoning |
|------------------------|----------|---------|-----------|
| Component | System | Adaptation, Service Level Progression | Directors don't invoke it — fails Interaction Test |
| Component | Capability | Zoom Navigation, Three-Stream Filtering | Action/workflow, not a pointable widget |
| Component | System | Clustering, Bronze Stack | Mechanism with state, not a UI widget |
| Structure | Overlay | The Table | Persists across ALL zones |
| Component | Capability | Purpose Assignment, System Actions | Workflow directors perform |

---

## Templates

### Strategy

```markdown
# Strategy - [Name]

## WHAT: The Strategy
[One sentence articulating the bet. What we believe will work.]

## WHERE: Ecosystem
- Principles:
  - [[Principle]] — [what judgment guidance this generates]
- Standards:
  - [[Standard]] — [what specifications this generates]
- Zones:
  - [[Zone]] — [what product areas embody this]
- Tensions:
  - [[Strategy]] — [what other strategies this trades off against]

## WHY: Belief
[2-4 sentences. The reasoning behind this bet. What evidence or intuition supports it. What user truth it's grounded in.]

## WHEN: Timeline
- Status: experimental | evolving | stable
- Since: [version or date]
- Last validated: [date]

## HOW: Application

### What Following This Looks Like
[2-3 concrete examples. Observable design choices, agent behaviors, UI patterns.]

### What Violating This Looks Like
[2-3 concrete anti-patterns. Wrong implementations.]

### Decision Heuristic
[When facing a tradeoff, how does this strategy guide the choice?]
```

---

### Principle

```markdown
# Principle - [Name]

## WHAT: The Principle
[One sentence. A judgment-based rule that guides decisions.]

## WHERE: Ecosystem
- Strategy:
  - [[Strategy]] — [what bet this serves]
- Standards:
  - [[Standard]] — [what specifications make this testable]
- Governs:
  - [[Zone]] — [what areas this applies to]
  - [[Room]] — [what rooms this shapes]
  - [[Capability]] — [what behaviors this constrains]
- Related:
  - [[Principle]] — [complementary or contrasting principles]

## WHY: Belief
[2-4 sentences. Why we believe this. What goes wrong without it. What user truth grounds it.]

## WHEN: Timeline
- Status: experimental | evolving | stable
- Since: [version or date]
- Derived from: [[Decision]] — [if born from specific choice]

## HOW: Application

### What Following This Looks Like
[2-3 concrete examples. Observable design choices, agent behaviors, UI patterns.]

### What Violating This Looks Like
[2-3 concrete anti-patterns. What wrong looks like.]

### Tensions
[What other principles this trades off against. When to favor this vs. that.]

### Test
[A question to ask when evaluating whether a design follows this principle.]
```

---

### Standard

```markdown
# Standard - [Name]

## WHAT: Definition
[What this specifies. What it constrains. What conformance means. 2-3 sentences.]

## WHERE: Ecosystem
- Implements:
  - [[Principle]] — [what judgment guidance this makes concrete]
- Conforming:
  - [[Room]] — [must follow this]
  - [[Structure]] — [must follow this]
  - [[Component]] — [must follow this]
  - [[Overlay]] — [must follow this]
  - [[Agent]] — [must follow this]
- Related:
  - [[Standard]] — [complementary or overlapping standards]

## WHY: Rationale
- Principle: [[Principle]] — [what guidance this makes testable]
- Driver: [What breaks without this spec. Concrete failure mode.]

## WHEN: Timeline
- Status: draft | active | deprecated
- Since: [version or date]
- Last updated: [date]

## HOW: Specification

### Rules
[The spec. Concrete values, thresholds, behaviors. Tables preferred.]

| Property | Value | Notes |
|----------|-------|-------|
| [X] | [Y] | [Z] |

### Examples
[2+ concrete correct implementations.]

**Example 1:** [Scenario]
- Input: [X]
- Correct output: [Y]

**Example 2:** [Scenario]
- Input: [X]
- Correct output: [Y]

### Anti-Examples
[2+ concrete violations. What wrong looks like.]

**Violation 1:** [Scenario]
- What happened: [X]
- Why it's wrong: [Y]
- Correct alternative: [Z]

**Violation 2:** [Scenario]
- What happened: [X]
- Why it's wrong: [Y]
- Correct alternative: [Z]

### Conformance Test
[How to verify a card/implementation follows this standard.]
```

---

### Primitive

```markdown
# Primitive - [Name]

## WHAT: Definition
[What foundational data entity. What it represents in the director's world. 2-4 sentences, standalone.]

## WHERE: Ecosystem
- Scope: [Cross-zone | specific zone]
- Implements:
  - [[Standard]] — [what spec constrains this]
- Primitives:
  - [[Primitive]] — [relationship to other primitives]
- Served by:
  - [[Room]] — [where directors interact with this]
  - [[Capability]] — [what actions operate on this]
  - [[Structure]] — [what displays this]
- Contrast:
  - [[Primitive]] — [how it differs from similar primitives]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Driver: [Why directors need this entity. What problem it solves.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]
- Origin: [What drove creation]

## HOW: Implementation

### Defining Characteristics
[What makes this primitive what it is. Required properties.]

### Lifecycle States
[States this primitive moves through. Table preferred.]

| State | Definition | Visual Treatment |
|-------|------------|------------------|
| [X] | [Y] | [Z] |

### Visual Representation
[How this primitive appears. Reference to standards.]

### Examples
[2+ concrete instances of this primitive.]

**Example 1:** [Scenario]
- Instance: [X]
- State: [Y]
- How director interacts: [Z]

**Example 2:** [Scenario]
- Instance: [X]
- State: [Y]
- How director interacts: [Z]

### Anti-Examples
[What is NOT this primitive. Common confusions.]

**Not a [Primitive]:** [Similar thing]
- Why it's different: [X]
```

---

### Zone

```markdown
# Zone - [Name]

## WHAT: Definition
[What workspace. Primary job-to-be-done. What cognitive mode directors are in here. 2-4 sentences, standalone.]

## WHERE: Ecosystem
- Rooms:
  - [[Room]] — [what you do there]
- Overlays:
  - [[Overlay]] — [what persists here]
- Adjacent:
  - [[Zone]] — [navigation relationship]
- Primitives:
  - [[Primitive]] — [what data entities live here]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this embodies]
- Principle: [[Principle]] — [what guidance shapes it]
- Separation: [Why this is distinct from other zones. What cognitive mode it serves.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Experience

### Navigation Pattern
- Entry points: [How directors arrive]
- Exit points: [Where directors go next]
- Hub-and-spoke: [If applicable — what's the hub, what are spokes]

### Cognitive Mode
[What mental state directors are in. Planning vs. executing vs. reflecting.]

### Typical Session
[What a director does during a typical visit. 3-5 steps.]

### Examples
[2+ concrete scenarios of zone usage.]

**Example 1:** [Scenario]
- Director arrives via: [X]
- Does: [Y]
- Leaves to: [Z]

**Example 2:** [Scenario]
- Director arrives via: [X]
- Does: [Y]
- Leaves to: [Z]

### Anti-Examples
[What this zone is NOT for. Common misuse.]
```

---

### Room

```markdown
# Room - [Name]

## WHAT: Definition
[What space. Primary job-to-be-done. What directors come here to accomplish. 2-4 sentences, standalone.]

## WHERE: Ecosystem
- Zone: [[Zone]] — [parent workspace]
- Agent: [[Agent]] — [who's here]
- Structures:
  - [[Structure]] — [spatial fabric]
- Artifacts:
  - [[Artifact]] — [content objects here]
- Capabilities:
  - [[Capability]] — [what you can do here]
- Adjacent:
  - [[Room]] — [navigation flow]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Separation: [Why this is its own room. What JTBD it serves.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Experience

### Entry
[How directors arrive. What triggers entry.]

### Workflow
[What a typical session looks like. 3-7 steps.]

1. [Step]
2. [Step]
3. [Step]

### Exit
[Where directors go next. What triggers exit.]

### Examples
[2+ concrete scenarios of room usage.]

**Example 1:** [Scenario]
- Director's goal: [X]
- What they do: [Y]
- Outcome: [Z]

**Example 2:** [Scenario]
- Director's goal: [X]
- What they do: [Y]
- Outcome: [Z]

### Anti-Examples
[What this room is NOT for. When to use a different room.]
```

---

### Overlay

```markdown
# Overlay - [Name]

## WHAT: Definition
[What persistent layer. What it displays. Why it travels across zones. 2-4 sentences, standalone.]

## WHERE: Ecosystem
- Visibility: [Which zones — or "all"]
- Displays:
  - [[Primitive]] — [what data it shows]
- Navigates to:
  - [[Room]] — [what clicking opens]
- Conforms to:
  - [[Standard]] — [what spec constrains this]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Persistence: [Why this must be always-visible. What breaks if hidden.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]
- Subtype: HUD | Panel | Toast | [other]

## HOW: Behavior

### Display States
[What visual states exist. Table preferred.]

| State | Trigger | Appearance |
|-------|---------|------------|
| [X] | [Y] | [Z] |

### Interaction
[What clicking/hovering does. What's interactive vs. display-only.]

### Updates
[When/how content refreshes. Real-time vs. on-action.]

### Examples
[2+ concrete scenarios.]

**Example 1:** [Scenario]
- Zone: [X]
- What's displayed: [Y]
- Director interaction: [Z]

**Example 2:** [Scenario]
- Zone: [X]
- What's displayed: [Y]
- Director interaction: [Z]

### Anti-Examples
[What this overlay should NOT do. Scope boundaries.]
```

---

### Structure

```markdown
# Structure - [Name]

## WHAT: Definition
[What spatial/visual element. What it provides as the room's fabric. 2-3 sentences, standalone.]

## WHERE: Ecosystem
- Room: [[Room]] — [where this lives]
- Contains:
  - [[Component]] — [UI widgets within this]
- Displays:
  - [[Primitive]] — [what data it shows]
- Conforms to:
  - [[Standard]] — [what spec constrains this]

## WHY: Rationale
- Principle: [[Principle]] — [what guidance shapes it]
- Purpose: [What directors use this structure for. Why it's spatial.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Implementation

### Layout
[Spatial organization. Dimensions. Regions.]

### Interaction Model
[How directors interact with this structure. Navigation, selection, manipulation.]

### Visual Behavior
[States, transitions, feedback.]

### Examples
[2+ concrete usage scenarios.]

**Example 1:** [Scenario]
- Director action: [X]
- Structure response: [Y]

**Example 2:** [Scenario]
- Director action: [X]
- Structure response: [Y]

### Anti-Examples
[What this structure should NOT be used for.]
```

---

### Component

```markdown
# Component - [Name]

## WHAT: Definition
[What specific UI widget. What it does. 1-2 sentences, standalone.]

## WHERE: Ecosystem
- Parent:
  - [[Structure]] | [[Room]] | [[Overlay]] — [where this lives]
- Conforms to:
  - [[Standard]] — [what spec constrains this]
- Related:
  - [[Component]] — [sibling or similar components]

## WHY: Rationale
- Principle: [[Principle]] — [what guidance shapes it]
- Purpose: [What interaction this enables.]

## WHEN: Timeline
- Status: active | deprecated
- Since: [version or date]

## HOW: Technical

### States
[Component states. Table preferred.]

| State | Trigger | Appearance | Behavior |
|-------|---------|------------|----------|
| [X] | [Y] | [Z] | [W] |

### Interactions
[Click, hover, drag, etc.]

### Accessibility
[Keyboard, screen reader, etc.]

### Examples
[2+ concrete usage scenarios.]

**Example 1:** [Scenario]
- User action: [X]
- Component response: [Y]

**Example 2:** [Scenario]
- User action: [X]
- Component response: [Y]

### Anti-Examples
[Misuse. Wrong context for this component.]
```

---

### Artifact

```markdown
# Artifact - [Name]

## WHAT: Definition
[What content object. What directors create, edit, or reference. 2-3 sentences, standalone.]

## WHERE: Ecosystem
- Room: [[Room]] — [where this is created/edited]
- Used in:
  - [[Room]] — [where this is referenced]
  - [[Capability]] — [what workflows use this]
- Contains:
  - [[Primitive]] — [what data this organizes]
- Conforms to:
  - [[Standard]] — [what spec constrains this]
- Related:
  - [[Artifact]] — [sibling artifacts]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Purpose: [What directors use this artifact for. What problem it solves.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Implementation

### Structure
[What sections/fields it contains. Table or outline.]

### Lifecycle
[How it's created, updated, archived.]

| Stage | Trigger | Who |
|-------|---------|-----|
| Created | [X] | [Y] |
| Updated | [X] | [Y] |
| Archived | [X] | [Y] |

### Ownership
[Who can view/edit. Permissions model if relevant.]

### Examples
[2+ concrete instances of this artifact.]

**Example 1:** [Scenario]
- Content: [X]
- Created when: [Y]
- Used for: [Z]

**Example 2:** [Scenario]
- Content: [X]
- Created when: [Y]
- Used for: [Z]

### Anti-Examples
[What this artifact should NOT contain. Scope boundaries.]
```

---

### Capability

```markdown
# Capability - [Name]

## WHAT: Definition
[What action or workflow. What directors consciously do. 2-3 sentences, standalone.]

## WHERE: Ecosystem
- Room(s):
  - [[Room]] — [where this is performed]
- Uses:
  - [[Structure]] — [what spatial elements it uses]
  - [[Artifact]] — [what content objects it creates/edits]
  - [[Primitive]] — [what data it operates on]
- Enables:
  - [[Capability]] — [what this unlocks next]
- Conforms to:
  - [[Standard]] — [what spec constrains this]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Purpose: [Why directors need to do this. What goal it serves.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Behavior

### Trigger
[What initiates this capability. User action, system event, etc.]

### Steps
[What happens. 3-7 steps.]

1. [Step]
2. [Step]
3. [Step]

### Outcome
[What state changes. What's different after.]

### Examples
[2+ concrete scenarios.]

**Example 1:** [Scenario]
- Director's goal: [X]
- What they do: [Y]
- Outcome: [Z]

**Example 2:** [Scenario]
- Director's goal: [X]
- What they do: [Y]
- Outcome: [Z]

### Anti-Examples
[What this capability is NOT for. Common misuse. When to use a different capability.]
```

---

### System

```markdown
# System - [Name]

## WHAT: Definition
[What mechanism. What state it manages. What it governs invisibly. 2-4 sentences, standalone.]

## WHERE: Scope
- Zones:
  - [[Zone]] — [where this operates]
- Rooms:
  - [[Room]] — [where effects are visible]
- Capabilities:
  - [[Capability]] — [what actions invoke this]
- Primitives:
  - [[Primitive]] — [what data this manages]
- Implements:
  - [[Standard]] — [what spec it follows]

## WHY: Purpose
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Gap: [What breaks without this. What problem it solves invisibly.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]

## HOW: Mechanics

### State
[What state this system manages. What values it tracks.]

### Transitions
[How state changes. Table preferred.]

| From | Trigger | To | Side Effects |
|------|---------|-----|--------------|
| [X] | [Y] | [Z] | [W] |

### Processing Logic
[Rules, calculations, algorithms. Pseudocode if helpful.]

### Examples
[2+ concrete scenarios of system behavior.]

**Example 1:** [Scenario]
- Initial state: [X]
- Trigger: [Y]
- New state: [Z]
- Director observes: [W]

**Example 2:** [Scenario]
- Initial state: [X]
- Trigger: [Y]
- New state: [Z]
- Director observes: [W]

### Anti-Examples
[What this system should NOT do. Boundary conditions. Edge cases it explicitly ignores.]
```

---

### Agent

```markdown
# Agent - [Name]

## WHAT: Identity
[Role/title. One-sentence personality. Core responsibility. 2-4 sentences, standalone.]

## WHERE: Presence
- Home: [[Room]] — [primary location]
- Appears in:
  - [[Room]] — [secondary locations]
  - [[Zone]] — [zone-level presence if any]
- Manages:
  - [[Artifact]] — [what they own]
- Coordinates with:
  - [[Agent]] — [handoff relationships]

## WHY: Rationale
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes behavior]
- Gap: [What breaks without this agent. What need they fill.]

## WHEN: Timeline
- Status: core | evolving | proposed
- Since: [version or date]
- Service level: [current level on progression ladder]

## HOW: Behavior

### Responsibilities
[What they do. 3-7 bullet points.]

- [Responsibility]
- [Responsibility]
- [Responsibility]

### Voice
[Personality. Tone. Signature phrases. What they sound like. 2-3 sentences.]

### Boundaries
[What they do NOT do. When they hand off.]

- Does NOT: [X]
- Hands off to: [[Agent]] — [when]

### Tools Available
[What capabilities they can invoke.]

- [[Capability]] — [how they use it]
- [[Capability]] — [how they use it]

### Knowledge Domains
[What they know/track. What they learn over time.]

- [Domain]
- [Domain]

### Examples
[2+ concrete interaction scenarios.]

**Example 1:** [Scenario]
- Director says: [X]
- Agent does: [Y]
- Outcome: [Z]

**Example 2:** [Scenario]
- Director says: [X]
- Agent does: [Y]
- Outcome: [Z]

### Anti-Examples
[What this agent should NOT do. Scope violations.]

## PROMPT
- Implementation: [[Prompt - [Name]]]
- Context required: [What must be injected at runtime]
```

---

### Prompt

```markdown
# Prompt - [Name]

## WHAT: Purpose
[What this prompt accomplishes. What agent it implements. 1-2 sentences.]

## WHERE: Parent
- Agent: [[Agent]] — [the agent this implements]
- Conforms to:
  - [[Standard]] — [prompt engineering standards if any]

## WHEN: Version
- Current: [version number]
- Status: draft | testing | production | deprecated
- Last updated: [date]

### Changelog
| Version | Date | Changes |
|---------|------|---------|
| [X] | [Y] | [Z] |

## HOW: Implementation

### Context Required
[What must be injected at runtime. User state, artifacts, conversation history.]

- [Context item]
- [Context item]

### Tools Available
[What capabilities the prompt can invoke.]

- [[Capability]] — [how it's used]
- [[Capability]] — [how it's used]

### The Prompt

```
[The actual system prompt text]
```

### Examples
[2+ example interactions showing prompt behavior.]

**Example 1:** [Scenario]
- User input: [X]
- Agent response: [Y]

**Example 2:** [Scenario]
- User input: [X]
- Agent response: [Y]

### Anti-Examples
[Responses this prompt should NOT produce.]

**Wrong response:** [X]
- Why it's wrong: [Y]
- Correct alternative: [Z]
```

---

### Decision

```markdown
# Decision - [Name]

## WHAT: The Choice
[What was decided. One sentence.]

## WHERE: Ecosystem
- Affects:
  - [[Zone]] — [how it shapes this]
  - [[Room]] — [how it shapes this]
  - [[Capability]] — [how it shapes this]
  - [[System]] — [how it shapes this]
- Governed by:
  - [[Principle]] — [what guided the choice]
  - [[Strategy]] — [what bet it serves]
- Generates:
  - [[Principle]] — [if this decision became a principle]
  - [[Standard]] — [if this decision became a standard]

## WHY: Rationale

### Context
[What situation prompted this decision. 2-3 sentences.]

### Options Considered
**Option A: [Name]**
- Description: [X]
- Pros: [Y]
- Cons: [Z]
- Rejected because: [W]

**Option B: [Name]** ← CHOSEN
- Description: [X]
- Pros: [Y]
- Cons: [Z]
- Chosen because: [W]

**Option C: [Name]** (if applicable)
- Description: [X]
- Pros: [Y]
- Cons: [Z]
- Rejected because: [W]

### Reversibility
[Is this reversible? What would trigger reconsideration?]

## WHEN: Timeline
- Decided: [date]
- Revisit trigger: [what would cause reconsideration]

## HOW: Implementation
[How this decision is implemented. What changed.]

### Examples
[2+ concrete examples of this decision in action.]

**Example 1:** [Scenario]
- Before decision: [X]
- After decision: [Y]

**Example 2:** [Scenario]
- Before decision: [X]
- After decision: [Y]
```

---

### Learning

```markdown
# Learning - [Name]

## WHAT: The Insight
[Generalized lesson. One sentence. What we now know.]

## WHERE: Applies To
- Informs:
  - [[Zone]] — [how this shapes it]
  - [[Room]] — [how this shapes it]
  - [[Capability]] — [how this shapes it]
  - [[System]] — [how this shapes it]
  - [[Agent]] — [how this shapes it]
- Became:
  - [[Principle]] — [if insight became principle]
  - [[Standard]] — [if insight became standard]
  - [[Decision]] — [if insight drove decision]

## WHY: Significance
[Why this insight matters. What goes wrong without it. 2-3 sentences.]

## WHEN: Origin
- Discovered: [date]
- Context: [What happened. What we tried. What failed or succeeded.]

## HOW: Application

### What We Do Differently
[Concrete behavior changes. What to do now that we know this.]

- [Change]
- [Change]

### Examples
[2+ concrete examples of applying this learning.]

**Example 1:** [Scenario]
- Old approach: [X]
- New approach: [Y]
- Result: [Z]

**Example 2:** [Scenario]
- Old approach: [X]
- New approach: [Y]
- Result: [Z]

### Anti-Examples
[What ignoring this learning looks like. How we might regress.]
```

---

### Initiative

```markdown
# Initiative - [Name]

## WHAT: The Goal
[What this achieves. What bet it represents. 2-3 sentences.]

## WHERE: The Cast
- Zones:
  - [[Zone]] — [launched/changed]
- Rooms:
  - [[Room]] — [launched/changed]
- Capabilities:
  - [[Capability]] — [launched/changed]
- Systems:
  - [[System]] — [launched/changed]
- Agents:
  - [[Agent]] — [launched/changed]

## WHY: The Driver
- Strategy: [[Strategy]] — [alignment]
- Principle: [[Principle]] — [guidance]
- Trigger: [What prompted this initiative. Metric, enterprise context, opportunity.]

## WHEN: The Arc
- Started: [date]
- Target: [date or version]
- Status: proposed | in-progress | shipped | paused | cancelled
- Releases:
  - [[Release]] — [milestone]

## HOW: Approach

### Scope
[What's in scope. What's explicitly out of scope.]

### Phases
[How this rolls out. Sequence.]

1. [Phase]
2. [Phase]
3. [Phase]

### Success Criteria
[How we know it worked. Measurable outcomes.]

## Learnings
- [[Learning]] — [insight gained]
```

---

### Release

```markdown
# Release [Version]

## WHAT: Summary
[What shipped. One paragraph.]

## WHERE: Affected
- Zones:
  - [[Zone]] — [launched/changed]
- Rooms:
  - [[Room]] — [launched/changed]
- Capabilities:
  - [[Capability]] — [launched/changed]
- Systems:
  - [[System]] — [launched/changed]
- Agents:
  - [[Agent]] — [launched/changed]

## WHY: Arc
- Part of: [[Initiative]] — [what initiative this advances]

## WHEN: Timeline
- Released: [date]
- Decisions:
  - [[Decision]] — [key choices made]
- Learnings:
  - [[Learning]] — [insights gained]
```

---

### Future

```markdown
# Future - [Name]

## WHAT: Vision
[What it will do. What it enables. 2-4 sentences.]

## WHERE: Position
- Zone: [[Zone]] — [where this lives]
- Room: [[Room]] — [where this lives, if known]
- Builds on:
  - [[Capability]] — [foundation]
  - [[System]] — [foundation]
- Blocked by:
  - [dependency or constraint]
- Enables:
  - [[Future]] — [what this unlocks]

## WHY: Driver
- Strategy: [[Strategy]] — [what bet this serves]
- Principle: [[Principle]] — [what guidance shapes it]
- Trigger: [What's prompting this. Metric, opportunity, request.]

## WHEN: Timeline
- Target: [version or quarter]
- Confidence: exploratory | low | medium | high
- Status: proposed | approved | in-progress | blocked | cancelled | shipped

## HOW: Approach

### Design Options
[If multiple approaches are being considered.]

**Option A: [Name]**
- Description: [X]
- Pros: [Y]
- Cons: [Z]

**Option B: [Name]**
- Description: [X]
- Pros: [Y]
- Cons: [Z]

### Open Questions
[What's unresolved. What needs answers before building.]

- [Question]
- [Question]

### Success Criteria
[How we'll know it worked.]
```

---

## Folder Structure

```
/rationale/
  strategies/
  principles/
  standards/

/product/
  zones/
  rooms/
  overlays/
  structures/
  components/
  artifacts/
  capabilities/
  primitives/
  systems/
  agents/
  prompts/
  [flat: Decision, Learning, Initiative, Future]

/releases/

/skills/
  conan/
  bob/

/templates/

reference.md
CONTRIBUTING.md
CONVENTIONS.md
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Strategy | Strategy - [Name] | Strategy - Spatial Visibility |
| Principle | Principle - [Name] | Principle - Visual Recognition |
| Standard | Standard - [Name] | Standard - Visual Language |
| Primitive | Primitive - [Name] | Primitive - Project |
| Zone | Zone - [Name] | Zone - Strategy Studio |
| Room | Room - [Name] | Room - Sorting Room |
| Room spoke | Room - [Parent] - [Aspect] | Room - Sorting Room - Gold Selection |
| Overlay | Overlay - [Name] | Overlay - The Table |
| Structure | Structure - [Name] | Structure - Hex Grid |
| Component | Component - [Name] | Component - Stream Filter Tabs |
| Artifact | Artifact - [Name] | Artifact - The Charter |
| Capability | Capability - [Name] | Capability - Weekly Planning |
| Capability spoke | Capability - [Parent] - [Aspect] | Capability - Weekly Planning - Bronze Review |
| System | System - [Name] | System - Adaptation |
| Agent | Agent - [Name] | Agent - Cameron |
| Prompt | Prompt - [Name] | Prompt - Cameron |
| Decision | Decision - [Choice] | Decision - Three Slot Limit |
| Learning | Learning - [Insight] | Learning - Queue Overwhelm |
| Initiative | Initiative - [Name] | Initiative - AI Prioritization |
| Release | Release [Version] | Release 2.3 |
| Future | Future - [Name] | Future - Context-Aware Slots |

---

## Conformance Obligations

Cards touching governed domains must link to constraining Standards.

| If the card… | Must link to… |
|--------------|---------------|
| Renders visually | Standard - Visual Language |
| Has state indicators (saturation, glow, dimming) | Standard - Visual Language |
| Displays project illustrations | Standard - Image Evolution |
| Involves priority ordering or scoring | Standard - Priority Score |
| Involves stream classification (Gold/Silver/Bronze) | Standard - Three-Stream Portfolio |
| Has project lifecycle states | Standard - Project States |
| Shows smoke signal indicators | Standard - Smoke Signal Thresholds |
| Has Bronze mode behavior | Standard - Bronze Mode Behaviors |
| Involves service level awareness | Standard - Service Levels |
| Renders Work at Hand in multiple locations | Standard - Dual Presence |
| Involves category assignment | Standard - Life Categories |
| Is an Agent or Prompt | Standard - Agent Voice (if exists) |

### When creating a Standard:
- Must implement ≥1 Principle
- Must have ≥1 conforming card
- Audit existing cards for conformance gaps

---

## Containment Relationships

| Type | Must Link To | Relationship |
|------|--------------|--------------|
| Room | Zone | Parent workspace |
| Structure | Room | Where it lives |
| Component | Structure or Room or Overlay | Parent element |
| Artifact | Room | Where it's edited |
| Capability | Room(s) | Where it's performed |
| Prompt | Agent | What it implements |
| Overlay | Zone(s) | Where it's visible |

---

## Link Quality Rules

Every link must have context. No naked links.

**Wrong:**
```
- [[Priority Queue]]
```

**Right:**
```
- [[Structure - Priority Queue]] — provides candidate tasks for filtering
```

---

## Sources to Mine

### Vision Capture Phase

| Source Type | Extract |
|-------------|---------|
| SOT + companion docs | Zone/Room definitions, capability specs, strategic reasoning |
| Strategy/vision docs | Strategy, Principle, Initiative goals |
| Brand standards docs | Standards (colors, typography, illustration rules) |
| Roadmap/planning docs | Future state, phasing, dependencies |
| Design docs/PRDs | Capability specs, user scenarios, edge cases |
| Decision records | Decision rationale, alternatives, Learning |

**Standard extraction signal:** Tables of values, testable rules, specs multiple cards must conform to → extract as Standard.

### Later Phases

| Source Type | Phase |
|-------------|-------|
| Codebase | Reality Grounding |
| Git history | Reality Grounding |
| Support tickets, feedback | Live Operations |
| Analytics, metrics | Live Operations |
| Retrospectives | Build Cycle onward |
