# Job: Downstream Sync

After any structural library change, verify and fix all meta-files that reference library structure. These files drift silently whenever types are added, terminology is renamed, folder structure changes, or cards are created/deleted in bulk.

## When to Run

**Auto-trigger** after completing any maintenance job that:

- Adds, removes, or renames types in the taxonomy
- Creates or reorganizes folder structure
- Renames terminology across the library (e.g., Director → Builder, Worker → Attendant)
- Adds or removes significant numbers of cards
- Changes templates or section naming conventions

Also run on explicit request: "sync downstream" or "check the meta-files."

## The Manifest

Files that mirror library structure and must stay in sync with `docs/context-library/reference.md` (the canonical source of truth).

### Agent Definitions

| File | Sync Points |
| --- | --- |
| `.claude/agents/conan.md` | Target type list (Step 2), decision tree steps, containment relationships table, library structure description ("What You Know") |
| `.claude/agents/bob.md` | Library Organization table |

### Skill Files — Bob

| File | Sync Points |
| --- | --- |
| `.claude/skills/bob/decomposition.md` | Decision tree steps, common confusions table, SOT pattern table |
| `.claude/skills/bob/link-patterns.md` | Example card names, terminology |
| `.claude/skills/bob/self-check.md` | Example card names, terminology |

### Skill Files — Context Constellation

| File | Sync Points |
| --- | --- |
| `.claude/skills/context-constellation/retrieval-profiles.md` | One profile per type, example card names (must match actual cards), mandatory categories summary table |
| `.claude/skills/context-constellation/traversal.md` | Folder path examples in "Finding Cards" section |
| `.claude/skills/context-constellation/protocol.md` | Relationship types, target type mentions |

### Skill Files — Conan

| File | Sync Points |
| --- | --- |
| `.claude/skills/conan/rubrics.md` | Type signal table, terminology |
| `.claude/skills/conan/job-audit.md` | Decision tree reference, terminology |

### Library Reference

| File | Sync Points |
| --- | --- |
| `docs/context-library/reference.md` | Canonical type taxonomy, templates, folder structure, naming conventions — this is the SOURCE, not the target |

## Procedure

### Step 1: Establish current library state

Read `docs/context-library/reference.md` to get the canonical:

- Type list (all types with their folder paths)
- Template section headers per type
- Naming conventions and terminology
- Folder structure

Then Glob actual card files to get:

- Real card names per type folder (for example validation)
- Actual folder structure

### Step 2: Audit each manifest file

For each file in the manifest, read it and check each sync point against current library state. Flag any:

| Deviation | Example |
| --- | --- |
| **Missing type** | New type in reference.md but absent from a type list or decision tree |
| **Stale type** | Type listed in meta-file but removed from reference.md |
| **Wrong examples** | Example card names that don't match actual cards |
| **Stale terminology** | Old naming that was renamed (Director, Worker, Mesa, etc.) |
| **Missing folder paths** | New folders not reflected in path examples |
| **Missing retrieval profile** | Type exists but has no profile in retrieval-profiles.md |
| **Stale section headers** | Template section names changed but not reflected in meta-files |

### Step 3: Fix deviations

For each deviation found, make the edit directly. These are meta-files (agent definitions, skill procedures), not library cards — editing them is within Conan's scope for this job.

Priority order:

1. **Type lists and decision trees** — these gate classification decisions
2. **Retrieval profiles** — these gate context assembly quality
3. **Folder paths and examples** — these affect navigation
4. **Terminology** — consistency, but least likely to cause functional errors

### Step 4: Report

Output a summary:

```
DOWNSTREAM SYNC COMPLETE
Files checked: N
Files updated: N (list)
Files clean: N
Changes made:
- [file]: [what changed]
- [file]: [what changed]
Remaining issues: [any that need human judgment]
```

## Terminology Watch List

Known renames to check for (add to this list as renames happen):

| Old | New | When |
| --- | --- | --- |
| Director | Builder | 2026-02 |
| Worker (product concept) | Attendant | 2026-02 |
| Mesa (agent) | removed | 2026-02 |
| Cameron (agent) | removed | 2026-02 |
| Devin (agent) | removed | 2026-02 |

**Note:** "Worker" in infrastructure contexts (Cloudflare Worker, SharedWorker, web worker) is correct and should NOT be renamed.
