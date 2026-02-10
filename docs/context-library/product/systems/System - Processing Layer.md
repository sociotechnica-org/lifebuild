# System - Processing Layer

## WHAT: Definition

The deterministic computation engine that transforms raw director data into State Summaries that agents consume. Handles calibration factors, smoke signal detection, and pattern computation — agents focus on conversation and nuance, not math.

## WHERE: Scope

- Zone: Backend — invisible to directors
- Implements: [[Standard - Knowledge Framework]] — processes knowledge into summaries
- Implements: [[System - Smoke Signals]] — detects signal conditions
- Feeds: All agents — they receive summaries, not raw data
- Related: [[Standard - Service Levels]] — processing enables service quality

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — agents need processed intelligence
- Principle: [[Principle - Compound Capability]] — processing layer compounds agent effectiveness by doing math once, not per-agent
- Driver: Separation of concerns. Deterministic logic (calibration math, pattern detection) shouldn't consume agent context windows. Agents add judgment and conversation quality.
- Decision: State Summaries ~250 tokens. Compact enough for agent context, rich enough for personalized service.

## WHEN: Timeline
- Status: core
- Since: v1.0

## HOW: Mechanics

### State

- **Raw director data**: Completion history, timing patterns, estimation accuracy, interaction logs
- **Calibration factors**: Computed accuracy ratios for time/effort estimation per director
- **Active smoke signal conditions**: Set of threshold breaches currently detected
- **State Summaries**: Compressed ~250-token snapshots of director state, refreshed on relevant data changes

### Transitions

| From | Trigger | To | Side Effects |
|------|---------|-----|--------------|
| Raw data updated | Director completes task, logs time, or interacts | Recomputation triggered | Calibration factors, patterns, and smoke signals recalculated |
| No smoke signals | Pattern threshold breached (e.g., 3 missed system cycles) | Smoke signal active | Signal condition added to State Summary; visual treatment applied on Life Map |
| Smoke signal active | Condition resolves (e.g., system cycles resume) | Smoke signal cleared | Signal removed from State Summary; visual treatment removed |
| State Summary stale | New computation completes | State Summary refreshed | All agents receive updated summary on next conversation start |

### Processing Logic

**Processing Layer computes:**

- Calibration factors (estimation accuracy over time)
- Smoke signal conditions (pattern thresholds)
- State Summaries (compressed director state)

**State Summary contents (~250 tokens):**

- Current capacity state
- Active smoke signals
- Key patterns detected
- Recent changes

**Agent consumption:**

- Agents receive State Summary at conversation start
- Summaries inform recommendations without requiring agents to compute
- Agents add interpretation, empathy, and judgment

### Examples

- A director consistently estimates tasks at 2 hours but actually takes 3.5 hours. The Processing Layer computes a calibration factor of 0.57 (they complete 57% of what they estimate). This factor appears in the State Summary. When Marvin helps plan a new project, Marvin sees the calibration factor and says "You estimated 8 hours for this — based on your patterns, it might take closer to 14. Want to adjust?" The Processing Layer did the math; Marvin added the judgment and conversational grace.
- A director's "Weekly meal prep" planted system has missed three consecutive cycles. The Processing Layer detects the threshold breach and activates a smoke signal. The State Summary now includes "Smoke signal: meal-prep system — 3 missed cycles." Mesa, on the director's next Life Map visit, can explain the yellow tint on the Home category tile: "Your meal prep system has missed a few weeks — want to adjust it or pause it?" The Processing Layer detected the pattern; Mesa provided the empathetic nudge.

### Anti-Examples

- **An agent computing calibration factors in its own context window** — this wastes tokens and risks inconsistency across agents. If Cameron computes a different calibration factor than Marvin because they used different windows of data, recommendations diverge. The Processing Layer computes once, all agents consume the same result.
- **Sending raw completion logs to agents instead of State Summaries** — a director with 6 months of history could have thousands of data points. Dumping raw data into an agent's context window wastes capacity and forces the agent to do math instead of conversation. The Processing Layer compresses to ~250 tokens.
