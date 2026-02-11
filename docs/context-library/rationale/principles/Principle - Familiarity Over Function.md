# Principle - Familiarity Over Function

## WHAT: The Principle

Directors classify work by how it feels to them, not by objective criteria — the director's relationship to the work is the only classification that matters.

## WHERE: Ecosystem

- Type: Design Principle
- Serves: [[Need - Autonomy]] — director's classification is final
- Advances: [[Strategy - Superior Process]], [[Strategy - AI as Teammates]]
- Governs: [[Capability - Purpose Assignment]], [[Standard - Priority Score]], [[Room - Sorting Room]], [[System - Weekly Priority]]
- Agents: [[Agent - Cameron]] (priority recommendations), [[Agent - Marvin]] (purpose capture during creation)
- Related: [[Principle - Earn Don't Interrogate]] — both respect director sovereignty

## WHY: Belief

The same garage cleanout is Bronze for one person and Gold for another. A director who's been avoiding it for two years, for whom completing it would change how they feel in their home — that's Gold. For someone who tidies routinely, the same task is Bronze. The objective characteristics of the work (duration, complexity, domain) tell you nothing about what it means to this director.

This emerged from early design discussions: should purpose assignment use objective criteria or subjective criteria? The decision was clear: subjective. Objective classification would require the system to know things it can't know — the director's history with this task, their emotional relationship to it, what completing it would mean for them.

Purpose is captured during Stage 2 of project creation with a single question: "What is this time investment for?" The director chooses based on their relationship to the work. Agents may notice patterns ("you tend to classify home projects as Gold — that's interesting") and may ask curious questions, but never correct or suggest reclassification.

The one exception: if a classification seems like an error rather than a choice ("you marked 'buy groceries' as Gold — did you mean to do that?"), agents can ask once, gently.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Purpose assignment is director-driven — stream classification derives from the director's archetype+scale choice, not objective criteria. The Sorting Room respects director overrides. Agents don't auto-reclassify. The principle is well-embodied in the current implementation.

## HOW: Application

Design purpose assignment as a subjective question about meaning, not an objective assessment of task characteristics. Priority scores should suggest, never mandate — the director always overrides.

### What Following This Looks Like

- A director classifies "organize garage" as Gold. Marvin captures the choice without questioning it — the director's relationship to this work (two years of avoidance, emotional weight) makes it transformational for them, regardless of how it looks objectively.
- Cameron's priority recommendation shows a suggested ordering, but the director drags "call Mom" above a higher-scored item. The system accepts the override silently — no confirmation dialog, no "are you sure?" prompt.
- An agent notices a pattern: "You've classified three home projects as Gold this month — that's interesting. Sounds like home is where transformation is happening for you right now." The observation is curious, not corrective.

### What Violating This Looks Like

- **Classifying work by objective criteria** — Duration, complexity, or domain tell you nothing about what the work means to this director. A system that auto-classifies "garage cleanout" as Bronze based on task type overrides the director's relationship to the work.
- **Agents correcting stream classification** — An agent that says "this looks like Bronze to me" and reclassifies is violating director sovereignty. Agents may notice patterns and ask curious questions, but never correct or suggest reclassification beyond a gentle one-time error check.
- **Priority scores that mandate rather than suggest** — The score is a hypothesis, not a verdict. A design that prevents override or makes override feel like going against the system's judgment undermines the director's authority over their own work.

### Tensions

- With objective priority math — resolution: the score is a suggestion, the director always has final say
- With pattern recognition — agents can observe unusual classifications but never override director judgment

### Test

Does this design assume it knows better than the director what their work means to them?
