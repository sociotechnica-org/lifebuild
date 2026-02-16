# Self-Determination Theory

## WHAT: Definition

A macro-theory of human motivation identifying three innate psychological needs — autonomy, competence, and relatedness — that when satisfied produce enhanced motivation and wellbeing, and when thwarted produce diminished functioning.

## WHERE: Ecosystem

- Type: Foundation (theoretical basis for LifeBuild's design)
- Core needs: [[Need - Autonomy]], [[Need - Competence]], [[Need - Relatedness]]
- Strategic bets derived from this: [[Strategy - Spatial Visibility]] (autonomy), [[Strategy - Superior Process]] (competence), [[Strategy - AI as Teammates]] (relatedness)
- Research: Ryan & Deci (2000), extensive empirical validation across domains

## WHY: Significance

LifeBuild's entire product architecture traces to SDT. This is the foundational assumption — that serving these three needs produces human flourishing, and that features serving other goals (engagement, retention, revenue) at the expense of these needs will ultimately fail builders.

The three Wows map directly to the three needs:

- Wow 1 (Visual/Spatial work) → Autonomy
- Wow 2 (AI staff) → Relatedness
- Wow 3 (Real results) → Competence

If SDT is wrong — if these aren't the core human needs, or if satisfying them doesn't produce the outcomes we expect — then LifeBuild's entire strategic foundation requires revision.

This is not a design principle we can simply update. It's the lens through which every design principle was derived. Invalidating SDT would mean re-examining every downstream decision.

## WHEN: Timeline

**Build phase:** Foundation
**Implementation status:** Stable
**Reality note (2026-02-10):** SDT is the theoretical foundation. It doesn't "implement" — it guides. All three needs are partially served: Autonomy through builder control over classification/priorities, Competence through structured process (three-stream, pipeline), Relatedness through agent teammates (3 active, 8 defined). The foundation holds; coverage deepens as features mature.

## HOW: Application

SDT governs feature design through a simple test: every feature must serve autonomy, competence, or relatedness. A feature that doesn't serve one of the three doesn't belong, regardless of how engaging or innovative it might be.

When evaluating any feature, agent behavior, or interface choice, trace it back to which need(s) it serves. If the answer is unclear or "none," that's a red flag.

**Anti-patterns SDT helps us avoid:**

- Gamification that creates dependency (serves engagement, not competence)
- Agent behaviors that do things for builders instead of teaching (undermines competence)
- Social features creating comparison rather than connection (undermines relatedness)
- Hiding information "for the user's benefit" (undermines autonomy)

## Infection Scope

If SDT is invalidated or revised:

- All three strategic bets require review
- All design principles require review
- All features governed by those principles require review
- This is a foundation-level change affecting the entire system
