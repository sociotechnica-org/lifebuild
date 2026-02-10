# System - Smoke Signals

## WHAT: Definition

The ambient notification mechanism that surfaces items needing attention through visual indicators on the Life Map — tile tints, effects, and subtle animations that inform without interrupting. Smoke Signals are visual states, not push alerts.

## WHERE: Scope

- Zone: [[Zone - Life Map]] — signals visible on grid
- Displayed on: [[Component - Hex Tile]] — visual treatments applied to tiles
- Sources: [[Primitive - System]] (health data), [[Primitive - Project]] (staleness data), [[System - Priority Queue Architecture]] (due dates)
- Monitored by: [[Agent - Mesa]] — can explain any signal
- Implements: [[Standard - Smoke Signal Thresholds]] — threshold and treatment specifications

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — ambient signals leverage spatial awareness
- Principle: [[Principle - Visibility Creates Agency]] — directors see problems early
- Principle: [[Principle - Guide When Helpful]] — helpful signals, not nagging alerts
- Driver: Directors need awareness without bombardment. Smoke Signals make problems visible without demanding immediate action.

## WHEN: Timeline
- Status: core
- Since: v1.0

## HOW: Mechanics

### State

- **Active signals**: Set of currently triggered smoke signals, each tied to a specific tile/category
- **Signal type per item**: The kind of condition detected (system health, project staleness, approaching deadline, etc.)
- **Visual treatment**: The specific tint, effect, or animation currently applied to each affected tile
- **Dismissal/snooze state**: Whether a director has dismissed or snoozed a specific signal

### Transitions

| From | Trigger | To | Side Effects |
|------|---------|-----|--------------|
| No signal | Threshold breached (e.g., system misses 3 cycles) | Signal active | Tile receives visual treatment (tint/effect); Processing Layer updates State Summary |
| Signal active | Underlying condition resolves (e.g., system cycles resume) | Signal cleared | Visual treatment removed; State Summary updated |
| Signal active | Director dismisses signal | Signal dismissed | Visual treatment removed for this instance; underlying condition still tracked |
| Signal active | Director snoozes signal | Signal snoozed (temporary) | Visual treatment removed temporarily; reappears after snooze period |
| Signal snoozed | Snooze period expires | Signal active (if condition persists) | Visual treatment reapplied |

### Processing Logic

**Visibility rules:**
- Signals visible at Working View and closer
- Horizon View shows aggregate (cluster has signals)
- Signals don't block interaction
- Directors can dismiss or snooze individual signals

**Agent awareness:**
- Mesa can explain any signal on request
- Agents may reference signals in conversations
- "That yellow tint means your workout system has missed three cycles"

**Design principle:**
- No sounds, no badges, no push notifications
- Directors see signals when they look at Life Map
- Ambient, not interruptive

### Examples

- A director opens their Life Map and notices a warm yellow tint on their Health category tile. They tap it and Mesa explains: "Your workout system has missed three consecutive cycles. Want to adjust the frequency or pause it for now?" The director adjusts the system's cadence from 3x/week to 2x/week. The condition resolves and the tint fades on the next Processing Layer cycle. The director was informed, not nagged.
- A Gold project "Career course" has a deadline in 5 days but no tasks have been completed this week. The project's tile shows a subtle pulsing effect. During a Life Map visit, the director notices it and opens the Project Board. They see the deadline approaching and decide to prioritize it. The smoke signal did its job: it created awareness at the moment the director was looking, without sending a push notification or interrupting their day.

### Anti-Examples

- **Sending a push notification to the director's phone when a smoke signal triggers** — Smoke Signals are explicitly ambient and visual. They appear on the Life Map when the director looks. Converting them to push alerts violates the "ambient, not interruptive" design principle and turns helpful awareness into nagging.
- **Stacking multiple signal types on a single tile until it becomes visually overwhelming** — if a tile has a health warning, a staleness indicator, and a deadline pulse simultaneously, the visual noise defeats the purpose. Signal priority should determine which single treatment is shown, or signals should be aggregated into one clear indicator.
