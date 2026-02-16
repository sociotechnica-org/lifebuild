# Primitive - System

## WHAT: Definition

Planted infrastructure that generates work indefinitely. Unlike projects, systems have no finish line — they run until deliberately uprooted. Systems represent the builder's automated, recurring commitments.

## WHERE: Ecosystem

- Zone: [[Zone - Life Map]] — systems occupy hex tiles
- Implements: [[Standard - Three-Stream Portfolio]] — systems generate Bronze tasks
- Implements: [[Principle - Compound Capability]] — systems compound leverage over time
- Created by: [[Primitive - Project]] — Silver projects plant systems on completion
- Depends on: [[Primitive - Task]] — systems generate tasks
- Governs: [[Room - System Board]] — monitoring interface for systems
- Components: [[Capability - System Actions]]
- Contrast: [[Primitive - Project]] — projects are bounded, systems are continuous

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — infrastructure reduces future cognitive load
- Principle: [[Principle - Compound Capability]] — planted systems make future weeks easier
- Driver: Builders need containers for recurring work that runs itself. The question for systems is: "Is it running smoothly?"

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-10):** No System primitive exists in the codebase. There is no `systems` table in the LiveStore schema, no system-related events, no health indicators, no cycle tracking, no task generation from systems. The `recurringTasks` table exists as legacy scaffolding from WorkSquared but is unrelated to this System concept. The entire System lifecycle (Planning → Planted → Hibernating → Uprooted) is unbuilt.

Core entity. Systems represent the infrastructure layer of a builder's LifeBuild — what runs automatically versus what requires active project management.

## HOW: Implementation

### Defining Characteristics

Systems are continuous. They don't complete — they run. Success is smooth operation, not completion.

| Dimension | Project           | System                     |
| --------- | ----------------- | -------------------------- |
| Shape     | Linear (------>)  | Loop                       |
| Metric    | Progress (% done) | Health (running smoothly?) |
| Work      | Contains it       | Generates it               |
| Success   | Completion        | Smooth operation           |
| Ends      | Yes -> Archives   | No (until uprooted)        |

**Six components:**

1. **Purpose** — What this system maintains or enables
2. **Pattern** — When work happens (cadences, triggers)
3. **Controls** — Health metrics indicating smooth operation
4. **Inputs** — What feeds the system (time, events, data)
5. **Outputs** — What the system generates (tasks, events, alerts)
6. **Delegation Profile** — Who does what

**Systems are color-agnostic:** Systems don't have Gold/Silver/Bronze color. They generate work — the builder colors that work based on their relationship to it.

### Lifecycle States

| State       | Definition                                     | Visual Treatment                                 |
| ----------- | ---------------------------------------------- | ------------------------------------------------ |
| Planning    | System being designed, not yet operational     | Outlined hex with gear icon, no health indicator |
| Planted     | System is live and generating work             | Full hex tile with health indicator (green dots) |
| Hibernating | System temporarily paused, not generating work | Dimmed hex tile with paused health indicator     |
| Uprooted    | System permanently decommissioned              | Removed from hex grid, archived                  |

### Visual Representation

Hex tile with system icon, health indicator (filled/unfilled dots showing operational health), category color accent, "planted" visual treatment. No progress ring (systems don't progress toward completion — they maintain health).

### Examples

1. **"Weekly meal planning system"** — A system in the Home category. State: Planted. Pattern: every Sunday. The system generates Bronze tasks each week (plan meals, create grocery list, order groceries). Health indicator shows 4/5 dots — running smoothly with occasional missed weeks.

2. **"Morning exercise routine"** — A system in the Health category. State: Planted. Pattern: daily at 6 AM. Generates a single Bronze task each day. Controls track streak length and completion rate. Originally planted by the Silver project "Build consistent workout habit."

### Anti-Examples

- **Not a System:** "Run a 5K race" — that is a [[Primitive - Project]], not a System, because it has a finish line (race day) and completes.
- **Not a System:** "Do 20 push-ups right now" — that is a [[Primitive - Task]], not a System, because it is a single completable action, not recurring infrastructure.
- **Not a System:** A one-time annual event like "Plan surprise birthday party" — that is a [[Primitive - Project]] because it has a defined endpoint, even though it might recur next year as a new project.
