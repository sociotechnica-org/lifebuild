# Principle - Guide When Helpful

## WHAT: The Principle

All capabilities are always available to find — active guidance follows the builder's demonstrated experience, not a predetermined education schedule.

## WHERE: Ecosystem

- Type: Design Principle
- Advances: [[Strategy - AI as Teammates]]
- Governs: Feature discoverability, [[Capability - Workspace Navigation]], [[Agent - Mesa]] (routing behavior)
- Rooms: [[Room - Council Chamber]], [[Room - Drafting Room]], [[Room - Sorting Room]], [[Room - Roster Room]]
- Related: [[Principle - First 72 Hours]] — first 72 hours need more active guidance than steady state
- Related: [[Principle - Earn Don't Interrogate]] — guidance method matters as much as timing

## WHY: Belief

The tension this principle resolves: "pain drives readiness" (original framing) could imply withholding capabilities. The correct framing: capabilities are always available, always self-explanatory, but active guidance follows demonstrated need.

This is the difference between a library (everything available, organized, discoverable) and a tutor (teaching what's relevant now). LifeBuild is both — a library you can browse freely, plus a tutor who notices when you're struggling and offers relevant help.

Every feature needs two explanations: a "browse mode" explanation (what is this, why does it exist, what problem does it solve) and an "active guidance" trigger (what situation causes the system to recommend this capability). The browse explanation is always accessible. The active guidance fires only when behavior suggests the builder would benefit.

The design pattern is NOT progressive disclosure (hiding complexity until the user "levels up"). It IS progressive guidance (all complexity is accessible, but the system's active help follows the builder's journey). Don't interrupt a thriving builder to educate them about features they haven't needed.

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** Agents are available in rooms (discoverable by navigating). But no active guidance triggers based on behavior, no progressive guidance system, no behavioral detection. Agents respond when visited but don't surface help proactively based on observed patterns.

## HOW: Application

Design every feature with both discoverability (findable when browsing) and guidance triggers (surfaced when relevant). When the builder hits a wall a capability would solve, bring it forward. Don't interrupt success to promote unused features.

### What Following This Looks Like

- A builder has been manually tracking recurring tasks for three weeks. The system notices the pattern and Mesa suggests: "You might find the Systems feature helpful for recurring work like this — want me to show you?" The guidance fires because behavior demonstrated need, not because it's "Week 3."
- A builder browses the Roster Room out of curiosity and finds clear explanations of each agent's capabilities — everything is discoverable without needing a trigger event. The browse-mode explanation answers "what is this?" without requiring the builder to be struggling first.
- A thriving builder running a smooth weekly cycle receives no notifications about the Adaptation feature they haven't used — the system respects that not needing a feature is a valid state, not a gap to fill.

### What Violating This Looks Like

- **Progressive disclosure that hides capabilities** — Locking features behind "levels" or hiding complexity until the user "unlocks" it is NOT this principle. All capabilities are always accessible. Progressive guidance means the system's active help follows the builder's journey, not that features are gated.
- **Interrupting a thriving builder to promote unused features** — A builder running a smooth weekly cycle doesn't need a notification about the Adaptation feature. Guidance fires when behavior suggests the builder would benefit, not when the system wants engagement.
- **A predetermined education schedule** — "Week 3: learn about Systems" violates the principle. Guidance follows demonstrated experience, not a curriculum. Some builders may never need certain features — that's fine.

### Tensions

- With [[Principle - First 72 Hours]] — first 72 hours require more proactive guidance to establish quick wins
- With feature promotion — marketing wants visibility; this principle demands relevance-based surfacing

### Test

Is this capability discoverable? And separately: are we highlighting it because the builder needs it now, or because we want them to know it exists?
