# Learning - The System Primitive Gap

## Divergence

**Vision:** The System primitive represents recurring patterns in a director's life — habits, routines, and maintenance workflows that run semi-autonomously once configured. Systems have a pattern (what repeats), controls (frequency, thresholds), inputs, outputs, and a delegation profile. Silver projects are often "system-building" — creating a new system that reduces future Bronze load. This is central to Compound Capability: each planted system is future work that runs itself.

**Reality:** No `systems` table exists in the database schema. No System primitive in the data model. No system creation, configuration, or monitoring UI. Silver projects exist but the "system-building" variant has no special handling. The entire System concept — from configuration through Smoke Signals health monitoring — is absent.

## Scale

- [[Primitive - System]] — Not started. No table, no events, no UI.
- [[Room - System Board]] — Not started. Depends on System primitive.
- [[Capability - System Actions]] — Not started. Depends on System primitive.
- [[System - Smoke Signals]] — Not started. Depends on System health data.
- [[Standard - Smoke Signal Thresholds]] — Not started. Depends on Smoke Signals.

## Why It Exists

The System primitive is conceptually complex — it represents ongoing processes rather than completable work. Implementing it requires: (1) a different lifecycle model than projects (systems don't "complete"), (2) health monitoring (cycle tracking, missed check-ins), (3) a configuration UI (pattern, controls, inputs, outputs), and (4) integration with the Processing Layer for automated monitoring. The Project primitive was sufficient for MVP; Systems add a second entity type with different behavior.

## Implications

- Builders should not reference "systems" as if they exist in the data model. All user work is currently modeled as projects and tasks.
- Silver projects have no special "system-building" variant. A Silver project is just a project with Silver purpose classification.
- Any feature that references "system health," "cycle tracking," or "system configuration" is future state.
- The Processing Layer (server-side computation) is also not started — so even if Systems existed, automated monitoring wouldn't.
- This gap means the Compound Capability principle's "infrastructure" dimension (systems reduce future Bronze load) cannot yet be realized.

## When This Closes

When a `systems` table is added to the schema with appropriate events, and a System Board room provides configuration and monitoring UI. The Processing Layer is needed for automated health tracking.
