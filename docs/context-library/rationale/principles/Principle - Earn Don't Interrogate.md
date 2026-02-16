# Principle - Earn Don't Interrogate

## WHAT: The Principle

Knowledge acquisition must never block progress, must feel helpful rather than invasive, must happen in context rather than in the abstract, and must respect cognitive load.

## WHERE: Ecosystem

- Type: Design Principle
- Serves: [[Need - Relatedness]] — learn like a colleague, not a bureaucrat
- Serves: [[Need - Autonomy]] — never block progress, respect boundaries
- Advances: [[Strategy - AI as Teammates]]
- Governs: All agent knowledge acquisition, [[Artifact - The Charter]], [[Artifact - The Agenda]], [[System - Progressive Knowledge Capture]], [[System - Smoke Signals]]
- Agents: [[Agent - Jarvis]], [[Agent - Mesa]], [[Agent - Marvin]], [[Agent - Conan]]
- Companion detail: Builder Knowledge & Intelligence System (companion document)
- Related: [[Principle - Guide When Helpful]] — both concern system-to-builder interaction timing

## WHY: Belief

The system learns like a good colleague: paying attention during real work, asking relevant questions at natural moments, building understanding over time. Not like a bureaucratic intake form demanding answers before providing value.

Five elicitation strategies govern knowledge acquisition:

1. **Explicit Structured** — Sliders, scales, option pickers during natural workflows (Purpose selector, Urgency rating)
2. **Explicit Conversational** — Agent-guided questions in dialogue ("How are you feeling about this week?")
3. **Embedded Extraction** — Captured from natural conversation without explicit questions (dread mentioned → emotional charge inferred)
4. **Behavioral Inference** — Patterns computed from observed behavior (effort underestimation factor, avoidance patterns)
5. **Integration Sourcing** — Data from external systems (calendar, sleep tracker, bank)

The mix shifts over time: early relationship favors explicit structured (low-cost capture during workflows) and embedded extraction (observe without asking). Mature relationship adds behavioral inference (patterns become significant) and integration sourcing (trust earned for external access).

Three sub-principles support this: Just-in-Time Over Just-in-Case (ask when relevant, not during onboarding), Confirm Don't Assume (surface inferences for validation), Priority Tracks to Pain (acquire knowledge about what's hurting first).

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** Four-Stage Creation captures project info progressively (follows spirit of principle). Agent conversations don't require profile completion before value. But no knowledge capture system, no behavioral inference, no integration sourcing, no Charter. The five elicitation strategies are aspirational.

## HOW: Application

Never require information before providing value. Capture during natural workflows. Ask when context makes questions relevant. Surface inferences for confirmation rather than treating them as fact.

### What Following This Looks Like

- During a weekly check-in conversation, Jarvis notices the builder mentions feeling overwhelmed and naturally asks "What's driving that this week?" — the question feels like genuine colleague interest because it's embedded in real context.
- Marvin captures the builder's energy level through a simple slider during project creation (Stage 2), not through a standalone survey — the data is gathered as part of a workflow the builder already values.
- After observing three weeks of consistent effort underestimation, Marvin surfaces the pattern: "I've noticed your Tuesday tasks tend to take about 1.5x your estimates — want me to factor that in?" — inference is confirmed, not silently applied.

### What Violating This Looks Like

- **Blocking progress until profile is complete** — Knowledge acquisition must never block progress. An onboarding flow that requires 20 fields before the builder can create their first project turns earning into interrogation.
- **Asking questions out of context** — "What's your energy level?" during project creation is a non-sequitur. The same question during a Council Chamber check-in is natural. Context makes questions helpful; absence of context makes them invasive.
- **Treating behavioral inferences as confirmed facts** — A builder who consistently underestimates effort has a behavioral pattern. Acting on it silently ("I adjusted your estimate because you always underestimate") violates Confirm Don't Assume. Surface the inference, let the builder validate.

### Tensions

- With comprehensive knowledge — full understanding requires data; resolution is earning it incrementally
- With onboarding — some baseline is needed; resolution is minimal capture, then learn through use

### Test

Would the builder think "why are you asking me this?" or "that's a helpful question"?
