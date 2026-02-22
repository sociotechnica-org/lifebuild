# Primitive - System

## WHAT: Definition

Planted infrastructure that generates work indefinitely. Unlike projects, systems have no finish line — they run until deliberately uprooted. Systems represent the builder's automated, recurring commitments.

## WHERE: Ecosystem

- Zone: [[Zone - Life Map]] — systems occupy hex tiles
- Implements: [[Standard - Three-Stream Portfolio]] — systems generate Bronze tasks
- Implements: [[Principle - Compound Capability]] — systems compound leverage over time
- Created in: [[Room - Drafting Room]] — systems are first-class entities created alongside projects
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
**Product owner decision (2026-02-21):** Systems are first-class entities created in the Drafting Room, not derived from Silver project completion. This diverges from GDD v0.2.
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
2. **Task Templates** — Recurring work items, each with its own cadence (daily/weekly/monthly/quarterly/annually). Simple systems have one template; complex ones have many.
3. **Controls** — Health metrics indicating smooth operation
4. **Inputs** — What feeds the system (time, events, data)
5. **Outputs** — What the system generates (tasks, events, alerts)
6. **Delegation Profile** — Who does what

**Systems are color-agnostic:** Systems don't have Gold/Silver/Bronze color. They generate work — the builder colors that work based on their relationship to it.

### Creation Pathway

Systems are a first-class entity type. The builder makes a binary choice on the **first screen** of the Drafting Room: **Project or System**. This is an explicit UI choice — not conversational, not something Marvin asks during dialogue. It happens upstream of everything else. Gold/Silver/Bronze purpose assignment only appears for projects, after the entity type choice. There is no project-to-system conversion pathway. Systems are planted from creation: they generate tasks immediately upon being planted.

The Drafting Room uses the same 3-stage flow as projects (Identify, Scope, Detail) but with system-specific fields:

| Stage       | Project Fields                                   | System Fields                                                                                            |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1. Identify | Title, description, category                     | Title, description, category                                                                             |
| 2. Scope    | Purpose (G/S/B), objectives, priority attributes | Purpose statement ("what does this system maintain?"), recurring task templates with individual cadences |
| 3. Detail   | Task list                                        | Health metrics/controls, delegation profile, refinements (lightweight in R3)                             |

Stage 2 is where the complexity lives for systems. Each recurring task template gets its own cadence. Simple systems (e.g., "weekly date night") have one template. Complex systems (e.g., "car maintenance") have many: oil change (every 3 months), tire rotation (every 6 months), annual inspection (yearly).

R3 cadence scope is time-based only: daily, weekly, monthly, quarterly, annually. For non-time triggers (e.g., "every 4,000 miles"), the builder enters an estimated time equivalent ("roughly every 3 months"). More sophisticated trigger types are deferred.

**Mid-cycle creation:** Because systems often represent something already happening in real life (e.g., "I already do meal prep every Sunday"), the builder sees a button: **"I'm mid-cycle and need to update this."** This is builder-initiated — the same UX pattern as "Have Marvin help you draft this." NOT Marvin asking, not agent-initiated. The builder taps it if relevant. This sets the initial health snapshot so the system does not show as stale or overdue on day one.

### Lifecycle States

| State       | Definition                                                  | Visual Treatment                                 |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Planning    | System being designed in Drafting Room, not yet operational | Outlined hex with gear icon, no health indicator |
| Planted     | System is live and generating work                          | Full hex tile with health indicator (green dots) |
| Hibernating | System temporarily paused, not generating work              | Dimmed hex tile with paused health indicator     |
| Uprooted    | System permanently decommissioned                           | Removed from hex grid, archived                  |

### Visual Representation

Hex tile with system icon, health indicator (filled/unfilled dots showing operational health), category color accent, "planted" visual treatment. No progress ring (systems don't progress toward completion — they maintain health).

Systems follow the same one-per-hex, manually-placed model as projects. One entity per hex (project OR system). When planting, the system suggests a position near related projects as default, but the builder places the tile.

### Examples

1. **"Weekly meal planning system"** — A system in the Home category. State: Planted. Three task templates, each with weekly cadence (Sundays): "plan meals," "create grocery list," "order groceries." Health indicator shows 4/5 dots — running smoothly with occasional missed weeks.

2. **"Morning exercise routine"** — A system in the Health category. State: Planted. One task template with daily cadence: "complete workout." Controls track streak length and completion rate. Created in the Drafting Room when the builder decided to formalize their existing workout habit as recurring infrastructure.

### Task Generation

Systems run whether or not the app is open. When a builder returns after absence, the System Board shows what has been missed and what went unlogged. AI assists the builder in catching up — making it easy to retroactively log instances where the work happened but reporting did not. Technical implementation details are left to the development team.

### Anti-Examples

- **Not a System:** "Run a 5K race" — that is a [[Primitive - Project]], not a System, because it has a finish line (race day) and completes.
- **Not a System:** "Do 20 push-ups right now" — that is a [[Primitive - Task]], not a System, because it is a single completable action, not recurring infrastructure.
- **Not a System:** A one-time annual event like "Plan surprise birthday party" — that is a [[Primitive - Project]] because it has a defined endpoint, even though it might recur next year as a new project.
