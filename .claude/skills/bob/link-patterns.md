# Link Patterns

Standard phrases for relationship context. No naked links — every `[[Note]]` gets a phrase.

---

## Conformance (Product-Layer Cards → Standards)

```markdown
- [[Standard - X]] — constrains [what aspect]
- [[Standard - X]] — specifies [colors/thresholds/states] used here
- [[Standard - X]] — defines [values/rules] this implements
```

**Examples:**

```markdown
- [[Standard - Visual Language]] — constrains color and indicator rendering
- [[Standard - Priority Score]] — specifies ranking formula used here
- [[Standard - Three-Stream Portfolio]] — defines stream classification this implements
- [[Standard - Project States]] — constrains lifecycle state handling
```

---

## Conforming Elements (Standards → Product-Layer Cards)

```markdown
- [[Room - X]] — must conform to this spec
- [[Structure - X]] — renders according to this standard
- [[Component - X]] — implements this specification
- [[Overlay - X]] — must conform to this spec
- [[Agent - X]] — must conform to this spec
```

**Examples:**

```markdown
- [[Structure - The Table]] — must conform to this spec
- [[Component - State Indicator]] — implements this specification
- [[Overlay - Work at Hand]] — renders according to this standard
```

---

## Dependencies (What This Needs)

```markdown
- [[X]] — provides [data/state] for [function]
- [[X]] — must exist before this can [function]
- [[X]] — supplies [input] that this [processes/displays/uses]
- [[X]] — handles [capability] that this relies on
```

**Examples:**

```markdown
- [[Priority Queue]] — provides candidate tasks for filtering
- [[User Preferences]] — stores selected mode between sessions
- [[SODA Cycle]] — determines when Bronze stack refreshes
```

---

## Dependents (What Needs This)

```markdown
- [[X]] — uses this to [function]
- [[X]] — displays/renders output from this
- [[X]] — breaks if this [changes/disappears]
- [[X]] — built on top of this [mechanism/data]
```

**Examples:**

```markdown
- [[Work at Hand]] — uses this to populate daily focus
- [[The Table]] — displays priorities this system ranks
- [[AI Suggestions]] — built on top of this scoring mechanism
```

---

## Systems (Cross-Cutting Mechanisms)

```markdown
- [[X]] — foundational mechanism for [what it enables]
- [[X]] — cross-cutting system handling [function]
- [[X]] — architectural layer providing [capability]
```

**Examples:**

```markdown
- [[Priority Queue]] — foundational mechanism for all task ordering
- [[SODA Cycle]] — cross-cutting system handling weekly rhythm
```

---

## Containment (Parent → Child)

Every card with a containment relationship must link to its parent.

```markdown
# Room → Zone

- [[Zone - X]] — parent workspace

# Structure → Room

- [[Room - X]] — where this structure lives

# Component → Structure/Room/Overlay

- [[Structure - X]] — parent element

# Artifact → Room

- [[Room - X]] — where this is created/edited

# Capability → Room(s)

- [[Room - X]] — where this is performed

# Prompt → Agent

- [[Agent - X]] — the agent this implements

# Overlay → Zone(s)

- [[Zone - X]] — where this is visible
```

---

## Zones and Rooms

```markdown
- [[Zone - X]] — parent workspace
- [[Room - X]] — [what you do there]
- [[Room - X]] — adjacent room for [navigation flow]
```

---

## Structures (Spatial Fabric)

```markdown
- [[Structure - X]] — spatial canvas for [what it provides]
- [[Structure - X]] — layout handling [arrangement]
```

---

## Components (UI Widgets)

```markdown
- [[Component - X]] — UI element handling [interaction]
- [[Component - X]] — widget providing [function]
```

---

## Artifacts (Content Objects)

```markdown
- [[Artifact - X]] — content object for [what it captures]
- [[Artifact - X]] — created during [workflow]
```

---

## Capabilities (Actions/Workflows)

```markdown
- [[Capability - X]] — action enabling [what directors do]
- [[Capability - X]] — workflow for [process]
```

---

## Agents and Prompts

```markdown
- [[Agent - X]] — AI team member handling [responsibility]
- [[Agent - X]] — coordinates with this agent on [handoff]
- [[Prompt - X]] — implementation of [[Agent - X]]
```

---

## Strategy/Principle Links (WHY Section)

```markdown
- [[Strategy - X]] — this implements [principle] by [how]
- [[Principle - X]] — guidance driving [aspect] of this card
- [[Strategy - X]] — philosophy behind [design choice]
```

**Examples:**

```markdown
- [[Strategy - Visual Work]] — this implements visibility by showing queue state
- [[Principle - Visual Recognition]] — guidance driving indicator design
```

---

## Standard → Principle Links

```markdown
- [[Principle - X]] — this standard makes [principle] testable
- [[Principle - X]] — judgment-based guidance this specification implements
```

**Examples:**

```markdown
- [[Principle - Visual Recognition]] — this standard makes instant recognition testable
```

---

## Decision Links (WHY Section)

```markdown
- [[Decision - X]] — key choice that [shaped/constrained] this card
- [[Decision - X]] — decision determining [specific aspect]
```

---

## Learning Links (WHY Section)

```markdown
- [[Learning - X]] — insight that informed [design choice]
- [[Learning - X]] — past experience shaping [aspect]
```

---

## Temporal Links (WHEN Section)

```markdown
Supersedes: [[X]] — replaced [old approach] because [reason]
Enables: [[X]] — foundation for [future capability]
Blocked by: [[X]] — can't proceed until [dependency resolved]
```

---

## Peer Relationships

```markdown
- [[X]] — complements this by [how they work together]
- [[X]] — alternative approach to [same problem]
- [[X]] — sibling card sharing [common parent/system]
```

---

## Quick Reference

| Relationship   | Pattern Start                                                     |
| -------------- | ----------------------------------------------------------------- |
| Conforms to    | "constrains", "specifies", "defines [values]"                     |
| Conforming     | "must conform", "implements this spec"                            |
| Containment    | "parent workspace", "where this lives", "where this is performed" |
| Zone/Room      | "parent workspace", "what you do there"                           |
| Structure      | "spatial canvas", "layout handling"                               |
| Component      | "UI element", "widget providing"                                  |
| Artifact       | "content object", "created during"                                |
| Capability     | "action enabling", "workflow for"                                 |
| Agent/Prompt   | "AI team member", "implementation of"                             |
| Depends on     | "provides", "must exist", "supplies"                              |
| Depended on by | "uses this to", "displays", "built on"                            |
| System         | "foundational mechanism", "cross-cutting"                         |
| Strategy       | "implements [principle] by"                                       |
| Principle      | "guidance driving", "makes testable"                              |
| Decision       | "key choice that", "decision determining"                         |
| Learning       | "insight that informed"                                           |
| Temporal       | "supersedes", "enables", "blocked by"                             |
