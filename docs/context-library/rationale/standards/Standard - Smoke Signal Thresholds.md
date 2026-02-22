# Standard - Smoke Signal Thresholds

## WHAT: Definition

The specification for trigger conditions, visual treatments, and dismissal rules for the four smoke signal types. This standard defines when signals appear and how they look; System - Smoke Signals implements detection and surfacing.

## WHERE: Ecosystem

- Implemented by: [[System - Smoke Signals]] — detection mechanism
- Applied to: [[Component - Hex Tile]]
- Monitored by: [[Agent - Mesa]] — can explain any signal
- Implements: [[Principle - Visibility Creates Agency]] — builders see problems early
- Implements: [[Principle - Guide When Helpful]] — helpful signals, not nagging alerts

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — ambient signals leverage spatial awareness
- Principle: [[Principle - Visibility Creates Agency]] — builders see problems early
- Principle: [[Principle - Guide When Helpful]] — helpful signals, not nagging alerts
- Driver: Builders need awareness without bombardment. Smoke Signals make problems visible without demanding immediate action.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No smoke signal system exists. No threshold detection, no visual treatments, no ambient alerts. Depends on Hex Grid (tiles to apply signals to) and System primitive (health data to monitor), neither of which exist.

## HOW: Specification

### Rules

#### Health Warning Signal (Systems)

Health is a snapshot of right now — "do I need to act?" — not a rolling average of historical performance. The car maintenance analogy: if maintenance has been neglected for months but the builder just completed a major overhaul, the system is healthy and no action is needed. Health conveys the current state of care. Health is computed across all of a system's task templates — any template with overdue items contributes to the signal.

| Threshold | Visual                                                                                  |
| --------- | --------------------------------------------------------------------------------------- |
| Yellow    | One or more task templates have overdue or incomplete items needing attention           |
| Red       | System is significantly behind — multiple task templates have unmet current obligations |

**Treatment:** Tile background tint (yellow or red). Clears automatically when current obligations are met.

**Dismissal:** Builder can snooze for 1 week. Signal returns if condition persists.

#### Staleness Signal (Projects and Systems)

| Threshold      | Trigger                 |
| -------------- | ----------------------- |
| Default active | No activity for 14 days |
| Default paused | No activity for 6 weeks |

**Treatment:** Sepia overlay. Progressively more pronounced with time. Ambient, not alarming.

**Dismissal:** Builder can acknowledge ("still relevant") or archive.

#### Due Date Signal (Projects/Tasks)

| Threshold   | Visual                                |
| ----------- | ------------------------------------- |
| Appears     | Deadline within 7 days (configurable) |
| Intensifies | As deadline approaches                |

**Treatment:** Candle flicker animation. Ambient, not alarming. Calendar icon with date visible on inspection.

**Interaction:** Click opens relevant Project Board or task detail.

#### Pattern Concern Signal

| Trigger                                            | Examples                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Conan identifies statistically significant pattern | Project paused 3+ times, estimated vs. actual consistently off, same week slippage repeating |

**Treatment:** Subtle pulse animation. Less urgent than other signals.

**Interaction:** Click or Mesa query explains the pattern detected.

#### Visibility Rules (All Signals)

- Signals visible at Working View and closer
- Horizon View shows aggregate (cluster has signals)
- Signals don't block interaction
- No sounds, no badges, no push notifications
- Builders see signals when they look at Life Map

### Examples

**Example 1: Health Warning — snapshot-based assessment**

- Scenario: Builder has a planted system "Morning Meditation" with daily cycles. They missed several days but just caught up.
- Input: Builder completed 2/7 cycles earlier this week but did a makeup session today and is now current on all obligations.
- Correct output: No signal. Health is a snapshot of right now. Despite poor recent history, the system's current obligations are met. The builder does not need to act. If the builder had NOT caught up and still had overdue cycles, Yellow would appear for the unmet current obligations.

**Example 2: Staleness signal on an active project**

- Scenario: Builder's "Learn Guitar" project (Live state) has had no activity for 3 weeks.
- Input: Last activity timestamp is 21 days ago. Project state is Live (active).
- Correct output: Staleness signal appears after 14 days (default active threshold). Sepia overlay renders on the hex tile. Builder can acknowledge ("still relevant" — signal clears temporarily) or archive the project. The signal does NOT use push notifications, sounds, or badges — it is ambient, visible only when the builder looks at the Life Map.

### Anti-Examples

- **Using push notifications or badge counts for smoke signals** — Signals are ambient, not interruptive. No sounds, no badges, no push notifications. Builders see signals when they look at Life Map, not when signals demand attention.
- **Showing individual signals at Horizon View** — Horizon View shows aggregate only (cluster has signals). Rendering individual signal details at that zoom level creates visual noise where the builder needs landscape-level awareness.
- **Firing a Staleness signal after 1 week of inactivity on an active project** — Default active threshold is 14 days. Triggering too early turns awareness into nagging, violating the Guide When Helpful principle.

### Conformance Test

1. Verify that a system with one or more task templates having overdue obligations triggers a Yellow Health Warning signal, and that a system with multiple task templates significantly behind triggers Red. A system that was recently caught up (even after a period of poor performance) should show no signal — health is a snapshot of right now, not a rolling average. Health is computed per-template and aggregated to the system level.
2. Confirm that all smoke signals are ambient (no push notifications, no sounds, no badge counts) and visible only at Working View or closer — not rendered individually at Horizon View. Verify staleness uses sepia overlay and overdue uses candle flicker.
3. Check that the Staleness signal for an active project triggers at 14 days of inactivity (not earlier) and offers both "still relevant" and archive options.
