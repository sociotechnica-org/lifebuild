# R3 Progress: Planting Season

## S1 — System schema: tables, events, materializers [COMPLETE]

**Status:** Complete
**Date:** 2026-02-24

**What was built:**

- Added `systems` table with columns: id, name, description, category, purposeStatement, lifecycleState, plantedAt, hibernatedAt, uprootedAt, midCycleUpdatedAt, createdAt, updatedAt
- Added `systemTaskTemplates` table with columns: id, systemId, title, description, cadence, lastGeneratedAt, nextGenerateAt, position, createdAt, updatedAt
- Updated `hexPositions.entityType` to include `'system'` (both in events.ts HexEntityTypeLiteral and schema.ts table definition)
- Added 11 system events: SystemCreated, SystemUpdated, SystemPlanted, SystemHibernated, SystemResumed, SystemUprooted, SystemTaskTemplateAdded, SystemTaskTemplateUpdated, SystemTaskTemplateRemoved, SystemTaskGenerated, SystemMidCycleUpdated
- Added materializers for all 11 events following existing codebase patterns
- Added 4 system queries: getSystems$, getSystemById$, getSystemTaskTemplates$, getPlantedSystems$
- Exported types: System, SystemTaskTemplate, SystemLifecycleState, SystemCadence

**Files modified:**

- `packages/shared/src/livestore/events.ts` — 11 new event definitions, HexEntityTypeLiteral updated
- `packages/shared/src/livestore/schema.ts` — 2 new tables, type exports, materializers, tables object updated
- `packages/shared/src/livestore/queries.ts` — 4 new queries

**Decisions:**

- Used `Schema.optional` for most system creation fields (description, category, purposeStatement) to allow progressive fill-in during Drafting Room stages
- `SystemMidCycleUpdated` takes an array of `templateOverrides` to allow batch updating all template schedules at once
- `SystemTaskGenerated` updates the template's lastGeneratedAt/nextGenerateAt in its materializer (not the system itself)
- Category reuses the same 8 categories as projects (health, relationships, finances, growth, leisure, spirituality, home, contribution)

**Notes for next story (S2):**

- Queries are already in queries.ts — S2 adds additional queries (getSystemHexPositions$, getAllHexPositions$, getUnplacedSystems$) and the `computeNextGenerateAt` utility
- The `computeNextGenerateAt` utility goes in `packages/shared/src/utils/system-schedule.ts`
- Pre-existing test failures exist in hex-map/ tests (missing @react-three/drei) and hex-grid-prototype typecheck — not related to system changes
