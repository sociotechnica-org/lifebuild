# Beadification Plan: Context Library as Composable Product Knowledge Harness

## Context

The AI software factory ecosystem is converging on a layered architecture:

| Layer | Purpose | Who builds it |
|-------|---------|---------------|
| **Coordination** | Work items, dependencies, ready-work | Beads, Engram, Claude Tasks, Jira/Linear |
| **Product Knowledge** | Domain concepts, rationale, constraints | **Us (nobody else has this)** |
| **Integration** | Connecting the above to agents | MCP (converging standard) |

The context library is the only serious product knowledge system in the ecosystem. Rather than absorbing beads or reimplementing coordination, we make the library **composable** — it plugs into any factory via MCP and works especially well with beads as the first integration target.

### Harmony with "Software-ify the Library" (CONTEXT_LIBRARY_STORY.md)

That document identifies 10 engineering opportunities. This plan delivers or enables all of them:

| Opportunity | Delivered in | How |
|---|---|---|
| #1 Wizard Engine | Phase 5 groundwork | `LibraryConfig` abstraction is the wizard's output format |
| #2 Inventory Scanner | Phase 1 | `cl_inventory` + SQLite `cards` table |
| #3 Graph Integrity Validator | Phase 1+2 | `cl_validate` tool |
| #4 Retrieval Profile Enforcer | Phase 2+4 | `cl_assemble` uses parsed profiles |
| #5 Provenance Analytics | Phase 3 | Extended provenance schema with bead cross-refs |
| #6 Quality Dashboard | Phase 1+2 | `cl_inventory` with metrics provides the data layer |
| #7 Graph Visualizer | Phase 1+2 | `cl_graph` tool provides traversal data |
| #8 Assembly Cache | Phase 4 | SQLite-backed pre-computed traversals |
| #9 Feedback Queue Processor | Phase 2+ | Extensible tool surface for queue parsing |
| #10 Downstream Sync | Phase 4 | Conan uses `cl_inventory` for meta-file verification |

---

## Phase 1: Foundation — Parser, Schema, SQLite Index

**Goal:** Build the engine everything else depends on.

### 1a. Package scaffolding

Create `packages/context-library/` following monorepo conventions (ESM, TypeScript, esbuild, vitest).

- `package.json` — `@lifebuild/context-library`, deps: `better-sqlite3`, `gray-matter`
- `tsconfig.json` — mirror `packages/shared/tsconfig.json`
- `vitest.config.ts`, `eslint.config.cjs`, `build.js`
- `CLAUDE.md` — scoped agent instructions
- Root `package.json` — add `dev:context-library`, `test:context-library` scripts

### 1b. Card schema types (`src/schema.ts`)

```typescript
interface CardFrontmatter {
  id: string          // stable hash, survives renames
  type: CardType      // explicit, not inferred
  status?: string     // from WHEN section
  version?: number    // monotonic
  modified?: string   // ISO-8601
}

interface Card {
  id: string
  name: string        // "Type - Name"
  type: CardType      // 24 types from reference.md
  path: string        // relative to library root
  frontmatter: CardFrontmatter | null  // null = pre-migration card
  dimensions: Record<Dimension, string>
  wikilinks: WikilinkRef[]
  raw: string
}

interface WikilinkRef {
  target: string      // "Type - Name"
  context: string     // surrounding phrase
  edgeType: EdgeType  // inferred from context patterns
  dimension: Dimension
}

type EdgeType = 'contains' | 'implements' | 'conforms-to' | 'depends-on' |
                'invokes' | 'extends' | 'coordinates-with' | 'operates-on' | 'manages'
```

### 1c. Card parser (`src/parser.ts`)

- Parse YAML frontmatter if present (gracefully handle cards without — all 122 current cards)
- Extract type from: (1) frontmatter, (2) filename prefix, (3) folder path
- Parse five `## WHAT:`, `## WHERE:`, `## WHY:`, `## WHEN:`, `## HOW:` sections (handle suffixed forms)
- Extract `[[Type - Name]]` wikilinks with context phrases
- Classify edge types from context using pattern table in `traversal.md`
- Generate stable ID: `sha256(lowercase(trim("Type - Name")))`

### 1d. Graph builder (`src/graph.ts`)

- Scan library directory, parse all cards, build directed adjacency list
- Traversal primitives: `neighbors()`, `shortestPath()`, `blastRadius()`, `orphans()`, `subgraph()`
- Validate wikilink resolution (detect broken links)
- Detect orphans and disconnected subgraphs

### 1e. SQLite index (`src/index-db.ts`, `src/queries.ts`)

Tables: `cards`, `dimensions`, `edges`, `card_fts` (FTS5 virtual table)

- `buildIndex(libraryPath)` — full scan, parse, insert
- `refreshIndex(libraryPath)` — incremental via file hash comparison
- Store at `.cache/context-library/index.db` (gitignored)
- **Markdown cards remain authoritative; index is acceleration only**

Query functions: `searchCards()`, `getCard()`, `getCardsByType()`, `getEdges()`, `getBlastRadius()` (recursive CTE), `getOrphans()`, `getBrokenLinks()`, `getInventory()`

### 1f. Frontmatter migration script (`scripts/add-frontmatter.ts`)

- Reads all cards, prepends YAML frontmatter (`id`, `type`, `status`, `version`, `modified`)
- Does NOT touch markdown body — agents grepping `## WHAT:` still work
- Idempotent, runs on a branch for review

**Tests:** Parser against real cards (snapshot tests per layer), index round-trips, graph queries against known relationships.

---

## Phase 2: MCP Server

**Goal:** Expose the knowledge graph via MCP. Immediately usable by Claude Code and any MCP client.

### 2a. Server core (`src/mcp/server.ts`, `src/mcp/index.ts`)

- MCP server using `@modelcontextprotocol/sdk`
- Refreshes SQLite index on startup
- stdio transport (for `.mcp.json`) and SSE transport (for remote)
- Config via env: `CL_LIBRARY_PATH`, `CL_CACHE_PATH`

### 2b. Seven MCP tools (`src/mcp/tools.ts`)

| Tool | Input | What it does |
|------|-------|-------------|
| `cl_card` | `{ identifier }` | Read a card by ID, name, or partial match |
| `cl_query` | `{ query?, type?, dimension?, limit? }` | FTS5 search + filters |
| `cl_assemble` | `{ task, target_type?, task_type?, max_cards? }` | Context briefing following protocol format |
| `cl_blast_radius` | `{ card, depth? }` | Transitive dependents via recursive CTE |
| `cl_validate` | `{ scope?, target? }` | Broken links, missing conformance, orphans |
| `cl_inventory` | `{ type?, include_metrics? }` | Card manifest with completeness scores |
| `cl_graph` | `{ seed, depth?, direction?, edge_types? }` | Subgraph traversal |

`cl_assemble` implements Conan's Steps 2-6 programmatically using parsed retrieval profiles. It does NOT log provenance (that remains Conan's workflow responsibility).

### 2c. Configuration

Add to `.mcp.json`:
```json
"context-library": {
  "command": "npx",
  "args": ["tsx", "packages/context-library/src/mcp/index.ts"],
  "env": { "CL_LIBRARY_PATH": "docs/context-library" }
}
```

**Tests:** Each tool against real library data. Verify mandatory categories, card counts, known relationships.

---

## Phase 3: Beads Integration

**Goal:** Install beads, establish cross-reference conventions, build the coordination-to-knowledge bridge.

### 3a. Install beads

`bd init` to create `.beads/`. Beads is git-native (JSONL tracked, SQLite gitignored).

### 3b. Cross-reference conventions (`docs/context-library/BEADS_INTEGRATION.md`)

- **Cards in beads:** Reference via `cl://Type - Name` or card ID in bead `spec`/`notes` fields
- **Beads in provenance:** Assembly entries include optional `bead_id` when triggered by a work item
- **Assembly trigger:** On bead claim, developer invokes `cl_assemble` with bead description (convention, not automated hook)

### 3c. Provenance schema extension

Add optional `bead_id` field to provenance-schema.md.

### 3d. Bridge module (`src/bridge/`)

Coordination-layer-agnostic abstraction:

```typescript
interface WorkItem {
  id: string
  title: string
  description: string
  source: 'beads' | 'linear' | 'github' | 'manual'
  metadata?: Record<string, unknown>
}
```

`bridge/beads.ts` — Given a bead ID, reads the issue, invokes `cl_assemble`, enriches with bead context. Checks for `.beads/` existence; gracefully degrades when absent.

### 3e. Optional MCP tool

`cl_assemble_for_bead` — Only registered when `.beads/` exists. Takes `{ bead_id }`, returns enriched briefing.

---

## Phase 4: Agent Migration

**Goal:** Migrate Conan/Sam from grep/glob to MCP tools. Assembly gets fast and cacheable.

### 4a. Update Conan's assembly procedure (`.claude/agents/conan.md`)

- Step 3 (seed finding): grep/glob -> `cl_query`
- Step 4 (expansion): manual wikilink following -> `cl_graph`
- Step 5 (mandatory categories): manual grep -> `cl_validate` + `cl_inventory`
- Step 6 (assembly): optionally use `cl_assemble` as draft, refine with judgment
- **Fallback note:** If MCP unavailable, fall back to grep/glob procedures

### 4b. Update Conan's maintenance jobs

- `job-inventory.md` -> use `cl_inventory`
- `job-diagnose.md` -> use `cl_blast_radius`
- `job-health-check.md` -> use `cl_validate` + `cl_inventory`
- `job-downstream-sync.md` -> use `cl_inventory` for meta-file verification

### 4c. Make retrieval profiles machine-parseable

Add structured YAML blocks to each profile in `retrieval-profiles.md`:
```yaml
config:
  traversal_depth: 3
  dimension_priority: [WHY, WHERE, HOW, WHAT]
  lateral_scope: broad
  mandatory_categories: [ProductThesis (1+), Standard (all conforming)]
```
Keep existing prose for agent consumption. Dual format = backward compatible.

### 4d. Assembly cache (`src/cache.ts`)

Pre-compute in SQLite: WHY chains, conformance maps, containment hierarchies. Invalidate on card file changes.

### 4e. Update traversal docs

Add "Programmatic Traversal" section to `traversal.md` documenting MCP tools as preferred method, keeping grep/glob as fallback.

---

## Phase 5: Composability Hardening

**Goal:** Standalone operation, CLI, external adoption readiness.

### 5a. CLI tool (`src/cli/index.ts`)

`cl index | query | card | blast-radius | validate | inventory | assemble | serve`

Lightweight, no heavy framework. Add `bin` field to package.json.

### 5b. Standalone verification tests

Integration test: MCP server starts and all tools work without `.beads/`, without beads CLI. `cl_assemble_for_bead` not registered.

### 5c. Configuration file (`cl.config.ts`)

```typescript
export default {
  libraryPath: 'docs/context-library',
  cachePath: '.cache/context-library',
  excludePaths: ['sources/'],
  frontmatterRequired: false,  // becomes true after migration
  beadsIntegration: 'auto',    // 'auto' | 'enabled' | 'disabled'
}
```

### 5d. Generic adapter (`src/adapters/generic.ts`)

Abstract the LifeBuild-specific type taxonomy:
```typescript
interface LibraryConfig {
  types: CardTypeDefinition[]
  containmentRules: ContainmentRule[]
  dimensionNames: string[]           // default: WHAT/WHERE/WHY/WHEN/HOW
  retrievalProfiles: RetrievalProfile[]
}
```
LifeBuild config is one instance. Other projects can define their own type systems.

### 5e. Documentation

- `packages/context-library/README.md` — usage, MCP setup, CLI, beads integration, API
- Root `CLAUDE.md` — add Key Paths and Services entries

---

## Dependency Graph

```
Phase 1 (Foundation)
  |
  v
Phase 2 (MCP Server)
  |
  +---> Phase 3 (Beads Integration)  \
  |                                    +--> Phase 5 (Composability)
  +---> Phase 4 (Agent Migration)    /
```

Phases 3 and 4 are parallelizable after Phase 2.

---

## Verification

After each phase:

- **Phase 1:** `pnpm test:context-library` passes. Parser handles all 122 cards. Index builds in <1s. `getBlastRadius("Product Thesis - Superior Process")` returns expected dependent count.
- **Phase 2:** MCP server starts via `.mcp.json`. Each tool returns correct results. `cl_assemble` for a System card includes mandatory categories per its retrieval profile.
- **Phase 3:** `bd init` succeeds. Cross-reference conventions documented. Bridge produces enriched briefing from a test bead.
- **Phase 4:** Conan assembly using MCP tools produces equivalent briefing to grep/glob method. Maintenance jobs use programmatic queries. Retrieval profiles parse as YAML.
- **Phase 5:** `cl validate` works from CLI. Server starts without `.beads/`. All existing `pnpm lint-all && pnpm test` still pass.

---

## Key Files

**New package:**
- `packages/context-library/src/schema.ts` — types
- `packages/context-library/src/parser.ts` — card parser
- `packages/context-library/src/graph.ts` — graph builder + traversal
- `packages/context-library/src/index-db.ts` — SQLite index
- `packages/context-library/src/queries.ts` — query functions
- `packages/context-library/src/mcp/server.ts` — MCP server
- `packages/context-library/src/mcp/tools.ts` — 7+1 MCP tools
- `packages/context-library/src/bridge/beads.ts` — beads bridge
- `packages/context-library/src/cli/index.ts` — CLI
- `packages/context-library/scripts/add-frontmatter.ts` — migration

**Existing files modified:**
- `.mcp.json` — add context-library server
- `.claude/agents/conan.md` — MCP tool usage in assembly
- `.claude/skills/context-briefing/retrieval-profiles.md` — add YAML blocks
- `.claude/skills/context-briefing/traversal.md` — add programmatic section
- `.claude/skills/context-briefing/provenance-schema.md` — add `bead_id`
- `.claude/skills/conan/job-*.md` — use MCP tools
- `CLAUDE.md` — add key paths and services
- `pnpm-workspace.yaml` — already globs `packages/*`, no change needed

**Reference files (read, not modified):**
- `docs/context-library/reference.md` — type taxonomy (2217 lines)
- `.claude/skills/context-briefing/retrieval-profiles.md` — assembly rules
- `.claude/skills/context-briefing/traversal.md` — graph navigation
- `.context/CONTEXT_LIBRARY_STORY.md` — engineering opportunities alignment
