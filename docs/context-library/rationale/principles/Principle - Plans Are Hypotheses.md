# Principle - Plans Are Hypotheses

## WHAT: The Principle

A weekly plan is a bet, not a commitment — adapting mid-week is engaged leadership, not failure.

## WHERE: Ecosystem

- Type: Design Principle
- Serves: [[Need - Autonomy]] — adaptation is leadership, not failure
- Serves: [[Need - Competence]] — calibration improves over time
- Advances: [[Strategy - Superior Process]]
- Governs: [[System - Adaptation]], [[System - Weekly Priority]], [[Room - Sorting Room]], [[Room - Council Chamber]]
- Implemented by: [[Standard - Planning Calibration]] — makes hypothesis framing testable
- Agents: [[Agent - Jarvis]] (tone in reviews), [[Agent - Marvin]] (priority adjustments)
- Metrics: Calibration accuracy over time, not completion rate
- Related: [[Principle - Empty Slots Strategic]] — both reject rigid planning

## WHY: Belief

Plan-as-contract framing creates a guilt cycle: make plan → life intervenes → feel guilty → avoid planning → life gets more chaotic → repeat. If plans feel like contracts, builders avoid planning altogether.

The hypothesis frame breaks this cycle: make hypothesis → test against reality → adapt → learn → better hypothesis next week. This reframes adaptation from failure to data collection.

Research on the planning fallacy (Kahneman & Tversky) shows people systematically underestimate effort and overestimate capacity. The system compensates by tracking estimation accuracy and helping calibrate over time. The metric that matters isn't "did you complete your plan?" but "is your planning getting more accurate?"

This principle touches everything: agent tone (Jarvis never says "you didn't complete your Gold this week"), success metrics (calibration accuracy, not completion rate), UI patterns (plan modification should feel like adjusting a strategy, not editing a failure report), and mid-week adaptation (the pause-and-replace pattern is legitimate, not shameful).

## WHEN: Timeline

**Build phase:** MVP (ongoing)
**Implementation status:** Partial
**Reality note (2026-02-10):** The Sorting Room doesn't use guilt language and builders can freely swap priorities. However, no weekly cadence exists (no Friday-to-Friday cycles), no calibration tracking, no plan-vs-reality comparison. The hypothesis framing is aspirational — the system doesn't yet have the temporal structure to test plans as hypotheses.

## HOW: Application

Design all planning interfaces to feel like strategy adjustment, not commitment management. Train agents to discuss plans as hypotheses being tested. Track and surface calibration accuracy as the primary planning metric.

### What Following This Looks Like

- A builder swaps their Gold project mid-week because a family situation changed priorities. Marvin acknowledges the swap neutrally: "Updated your Gold — makes sense given the week. We'll carry the original forward." No guilt language, no "deviation" logging.
- Jarvis opens the weekly review with "Let's look at what your plan taught you this week" rather than "Let's see how you did against your plan." The framing treats the week as an experiment that produced learning, not a contract that was or wasn't fulfilled.
- The planning dashboard shows calibration accuracy trending upward over 8 weeks — the builder's estimates are getting closer to reality. This metric is celebrated even though completion rate fluctuated, because better calibration is the real win.

### What Violating This Looks Like

- **Guilt-inducing language when plans change** — Jarvis saying "you didn't complete your Gold this week" frames adaptation as failure. The correct framing: "your Gold hypothesis was tested — what did you learn?" Language shapes whether builders avoid planning or embrace it.
- **Measuring completion rate as the primary metric** — Completion rate rewards rigid adherence. Calibration accuracy — how well plans predict reality — is the metric that improves planning over time. A builder who adapts every week but calibrates better each time is succeeding.
- **Making plan modification feel like editing a failure report** — If changing Work at Hand mid-week requires justification dialogs or is logged as "deviation," the UI treats adaptation as shameful. The pause-and-replace pattern should feel like adjusting a strategy.

### Tensions

- Contradicts most productivity tool assumptions — traditional tools reward completion, not calibration
- With accountability — some builders want commitment pressure; resolution: that's their choice, not the system's default

### Test

Would this design make a builder feel guilty for adapting their plan to reality?
