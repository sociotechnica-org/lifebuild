# Principle - Bidirectional Loop

## WHAT: The Principle

External representation and internal understanding strengthen each other through iteration — builders who place, observe, reorganize, and re-observe their hex grid develop progressively clearer self-understanding.

## WHERE: Ecosystem

- Type: Design Principle
- Advances: [[Strategy - Spatial Visibility]] — spatial organization enables the loop
- Governs: [[Structure - Hex Grid]], [[System - Clustering]], [[Zone - Life Map]]
- Implemented by: [[Standard - Spatial Interaction Rules]] — makes builder spatial agency testable
- Related: [[Principle - Visibility Creates Agency]] — seeing enables understanding
- Informed by: Zhang & Norman (1994) — distributed cognition research

## WHY: Belief

Distributed cognition research shows external representations aren't just storage — they're part of the thinking process itself. The Life Map isn't a filing system; it's an extension of the builder's mind.

When builders place a project, they're making their internal understanding explicit. When they observe the result in context of other projects, they notice relationships, patterns, and imbalances they couldn't see internally. When they reorganize, their external representation better reflects their evolved understanding — which then reveals new patterns.

This flywheel justifies a critical design decision: builders place their own projects. The system does not assign locations. Placement reveals how the builder actually thinks about their life, which is itself valuable data for the AI team.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No hex grid, no spatial placement by builder, no drag-and-drop spatial arrangement. The bidirectional loop between external representation and internal understanding cannot function without the spatial substrate. Depends entirely on Hex Grid and Clustering, neither of which exist.

## HOW: Application

Design for builder agency over spatial organization. No auto-organization. Low-friction rearrangement (drag-and-drop). Treat clustering as meaningful — adjacent hexes carry builder-assigned meaning.

### What Following This Looks Like

- A builder drags a fitness project next to a nutrition project, realizes they think of health holistically, and creates a new category cluster — the spatial act revealed an internal mental model they hadn't articulated.
- After a major life change, a builder spends ten minutes reorganizing their hex grid, moving work projects away from a completed cluster and pulling creative projects closer to center — the rearrangement itself processes the transition.
- A builder notices two projects sitting adjacent for weeks and realizes they should be merged — proximity on the map surfaced a redundancy that a list view would never have revealed.

### What Violating This Looks Like

- **Auto-organizing the hex grid** — The system assigning locations destroys the loop. Placement reveals how the builder thinks about their life. Auto-organization imposes system logic where builder cognition should drive.
- **Preventing low-friction rearrangement** — If reorganizing requires multiple steps or confirmation dialogs, builders won't iterate. The loop depends on frequent, easy moves. Friction kills the flywheel.
- **Treating spatial arrangement as filing rather than thinking** — The grid isn't storage — it's an extension of the builder's mind. Designs that optimize for "correct" placement over "meaningful" placement miss the point of distributed cognition.

### Tensions

- With efficiency — auto-organization would be faster; resolution is builder agency trumps efficiency
- With AI assistance — agents can observe patterns but not reorganize without permission

### Test

Does this design preserve the builder's spatial choices, or impose system logic?
