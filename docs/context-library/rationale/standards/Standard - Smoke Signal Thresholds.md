# Standard - Smoke Signal Thresholds

## WHAT: Definition

The specification for trigger conditions, visual treatments, and dismissal rules for the four smoke signal types. This standard defines when signals appear and how they look; System - Smoke Signals implements detection and surfacing.

## WHERE: Ecosystem

- Implemented by: [[System - Smoke Signals]] — detection mechanism
- Applied to: [[Component - Hex Tile]]
- Monitored by: [[Agent - Mesa]] — can explain any signal
- Implements: [[Principle - Visibility Creates Agency]] — directors see problems early
- Implements: [[Principle - Guide When Helpful]] — helpful signals, not nagging alerts

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — ambient signals leverage spatial awareness
- Principle: [[Principle - Visibility Creates Agency]] — directors see problems early
- Principle: [[Principle - Guide When Helpful]] — helpful signals, not nagging alerts
- Driver: Directors need awareness without bombardment. Smoke Signals make problems visible without demanding immediate action.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No smoke signal system exists. No threshold detection, no visual treatments, no ambient alerts. Depends on Hex Grid (tiles to apply signals to) and System primitive (health data to monitor), neither of which exist.

## HOW: Specification

### Rules

#### Health Warning Signal (Systems)

| Threshold | Visual                                          |
| --------- | ----------------------------------------------- |
| Yellow    | Cycle completion < 80% over past 2 weeks        |
| Red       | Cycle completion < 50% OR 3+ consecutive misses |

**Treatment:** Tile background tint (yellow or red). Clears automatically when health improves.

**Dismissal:** Director can snooze for 1 week. Signal returns if condition persists.

#### Staleness Signal (Projects)

| Threshold      | Trigger                 |
| -------------- | ----------------------- |
| Default active | No activity for 3 weeks |
| Default paused | No activity for 6 weeks |

**Treatment:** Dust/fade overlay effect. Progressively more pronounced with time.

**Dismissal:** Director can acknowledge ("still relevant") or archive.

#### Due Date Signal (Projects/Tasks)

| Threshold   | Visual                                |
| ----------- | ------------------------------------- |
| Appears     | Deadline within 7 days (configurable) |
| Intensifies | As deadline approaches                |

**Treatment:** Calendar icon with date. Color intensifies yellow -> orange -> red.

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
- Directors see signals when they look at Life Map

### Examples

**Example 1: Health Warning escalating from Yellow to Red**

- Scenario: Director has a planted system "Morning Meditation" with daily cycles. Completion has been declining.
- Input: Week 1: 5/7 cycles completed (71%). Week 2: 3/7 cycles completed (43%).
- Correct output: After Week 1, Yellow signal appears (completion < 80% over 2 weeks is not yet met — needs sustained data). After Week 2, with 2-week average at ~57%, Yellow threshold is met (< 80%). If completion drops below 50% or hits 3+ consecutive misses, signal escalates to Red. Tile background tints accordingly. Signal clears automatically when health improves above thresholds.

**Example 2: Staleness signal on an active project**

- Scenario: Director's "Learn Guitar" project (Live state) has had no activity for 4 weeks.
- Input: Last activity timestamp is 28 days ago. Project state is Live (active).
- Correct output: Staleness signal appears after 3 weeks (default active threshold). Dust/fade overlay renders on the hex tile. Director can acknowledge ("still relevant" — signal clears temporarily) or archive the project. The signal does NOT use push notifications, sounds, or badges — it is ambient, visible only when the director looks at the Life Map.

### Anti-Examples

- **Using push notifications or badge counts for smoke signals** — Signals are ambient, not interruptive. No sounds, no badges, no push notifications. Directors see signals when they look at Life Map, not when signals demand attention.
- **Showing individual signals at Horizon View** — Horizon View shows aggregate only (cluster has signals). Rendering individual signal details at that zoom level creates visual noise where the director needs landscape-level awareness.
- **Firing a Staleness signal after 1 week of inactivity on an active project** — Default active threshold is 3 weeks. Triggering too early turns awareness into nagging, violating the Guide When Helpful principle.

### Conformance Test

1. Verify that a system with < 80% cycle completion over 2 weeks triggers a Yellow Health Warning signal, and that < 50% OR 3+ consecutive misses triggers Red — no signal should appear above the thresholds.
2. Confirm that all smoke signals are ambient (no push notifications, no sounds, no badge counts) and visible only at Working View or closer — not rendered individually at Horizon View.
3. Check that the Staleness signal for an active project triggers at 3 weeks of inactivity (not earlier) and offers both "still relevant" and archive options.
