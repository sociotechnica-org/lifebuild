# System - Overgrowth

## WHAT: Definition

The visual and mechanical system for representing neglect on the hex grid. When planted system tasks go unattended for a threshold period, hexes gradually show dormancy signs — muted colors, autumn-like visual treatment. Recovery is always proportional to neglect. Nothing catastrophic. Nothing that requires rebuilding from scratch.

## WHERE: Scope

- Zone: [[Zone - Life Map]] — overgrowth appears on hex tiles
- Relates to:
  - [[Component - Hex Tile]] — tile visual treatment changes with overgrowth
  - [[Primitive - System]] — planted systems generate the tasks whose neglect triggers overgrowth
  - [[System - Capacity Economy]] — overgrowth recovery is a penalty sink (costs MORE than maintenance)
  - [[Dynamic - Over-Expansion]] — multiple territories showing overgrowth simultaneously
  - [[Dynamic - External Disruption]] — absence triggers overgrowth
  - [[Dynamic - Bronze Flood]] — overwhelming maintenance can cause selective neglect
  - [[Loop - Sanctuary Walk]] — overgrowth is identified and addressed during walks
  - [[Aesthetic - Stewardship]] — tending overgrowth should feel like garden care
  - [[Aesthetic - Sanctuary]] — overgrowth must never break the "sanctuary holds" promise
- Agents:
  - [[Agent - Jarvis]] — may surface overgrowth during sanctuary walks or check-ins
- Implements: [[Standard - Reward Philosophy]] — neglect is shown visually, never punished with notifications

## WHY: Rationale

- Strategy: [[Strategy - Spatial Visibility]] — overgrowth makes neglect visible on the map
- Principle: [[Principle - Visibility Creates Agency]] — seeing overgrowth creates agency to tend it
- Driver: Systems need maintenance. When maintenance lapses, the builder needs to see it — but gently, proportionally, and without guilt. Overgrowth is the sanctuary's way of saying "this garden corner needs watering" without saying "you failed."

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-12):** No overgrowth mechanic exists. Hex tiles have static visual treatment regardless of maintenance state. No dormancy indicators, no muting, no recovery mechanics. Depends on mature system primitives with recurring task generation.

## HOW: Mechanics

### Trigger

Planted system tasks go unattended for a threshold period. Starting assumption: 2-3 missed cycles (needs testing via Balance Doc).

### Visual Manifestation

Gradual. Not sudden. Not alarming.

- **Early overgrowth:** Slightly muted hex border colors. Like early autumn — things are getting quieter.
- **Moderate overgrowth:** Noticeably muted. Dormancy signs on the tile illustration. The hex looks like it's resting, not dying.
- **Significant overgrowth:** Clearly dormant. Tile illustration is muted and still. But not damaged. The structure beneath is intact.

The visual language is garden-like: seasons changing, not buildings collapsing.

### Recovery

Always proportional to neglect:

| Absence   | Recovery                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| < 1 week  | Trivial. Complete 1-2 missed tasks. Colors return immediately.                                             |
| 1-4 weeks | Light tending cycle. A few catch-up tasks. Colors return over a session.                                   |
| 1+ months | Focused tending cycle. More catch-up tasks, possibly some system reconfiguration. Colors return over days. |

Nothing requires rebuilding from scratch. The worst case is a focused tending cycle.

### What Overgrowth Is NOT

- **Damage** — hexes are dormant, not destroyed
- **Punishment** — there are no score penalties, no "you missed X days" counters
- **Push notifications** — overgrowth is visible when the builder visits, not pushed to their phone
- **Catastrophic** — even months of neglect don't destroy progress. The sanctuary holds.

### Examples

- Builder hasn't tended their exercise system in 10 days → the Health hex shows early autumn-like muting → during a sanctuary walk, the builder notices → handles 2 catch-up tasks → colors return → took 15 minutes
- Builder returns after a month-long absence → multiple hexes show significant dormancy → Jarvis: "The sanctuary held while you were away. Where would you like to start?" → builder picks one territory to tend first → gradual re-engagement at their own pace

### Anti-Examples

- **Red alert indicators on overgrown hexes** — overgrowth is natural. Gardens grow. The visual treatment should feel seasonal, not alarming.
- **"Your systems are failing!" language** — systems don't fail from neglect. They go dormant. They wait.
- **Requiring overgrowth resolution before other activities** — the builder can tend or not tend. They can start a Gold venture with overgrowth on the map. Their choice.
