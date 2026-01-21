# LifeBuild Context Library

A documentation system designed to capture holistic context for humans and AI agents working on LifeBuild.

---

## The Core Idea

**If you'll need to say it again, put it in the library.**

This library exists so that context doesn't live in people's heads or get repeated in every AI handoff. Write it once, link to it forever.

---

## Why This Exists

Agents (and new team members) struggle to make aligned decisions when they only receive:

- **WHAT**: Feature specs, requirements
- **HOW**: Code access, process instructions

They miss the implicit knowledge experienced developers absorb by osmosis:

- **WHERE**: What's adjacent? What breaks if you touch this wrong?
- **WHEN**: What did we try before? What's coming next?
- **WHY**: Why does this exist? Why these specific choices?

This library makes that implicit knowledge explicit and queryable.

---

## Quick Start

### For AI Agents

1. Read **CONTRIBUTING.md** — how to use and update this library
2. Read **CONVENTIONS.md** — code patterns and gotchas for this codebase
3. Before touching a feature, find its note and read the context
4. After completing work, update affected notes

### For Humans

1. Same as above, plus you're the authority on structural decisions
2. Review AI contributions to the library
3. Resolve ambiguities AI agents flag

---

## Folder Structure

```
/context-library/
├── README.md           # You are here
├── CONTRIBUTING.md     # How to add/edit notes (humans & AI)
├── CONVENTIONS.md      # Code patterns, naming, gotchas
│
├── /product/           # The thing itself (WHERE)
│   ├── /zones/         # Major product areas (Life Map, Strategy Studio)
│   ├── /systems/       # Cross-cutting mechanisms (Priority Queue, Work at Hand)
│   ├── /features/      # User-facing mechanics (The Table, Bronze Mode)
│   └── /components/    # Technical implementation details
│
├── /context/           # Why it's this way (WHY)
│   ├── /strategy/      # Guiding principles ("Visual work creates agency")
│   ├── /pressures/     # External forces (customer demands, market shifts)
│   └── /signals/       # Metrics & observations driving decisions
│
├── /timeline/          # How it got here, where it's going (WHEN)
│   ├── /past/          # Learnings, deprecated approaches
│   └── /future/        # Vision, roadmap items
│
├── /slugs/             # Pre-assembled context bundles for common tasks
└── /templates/         # Note templates (copy when creating new notes)
```

---

## Status Values (ca-when)

Every note has a temporal status:

| Status    | Meaning                                           | Example                            |
| --------- | ------------------------------------------------- | ---------------------------------- |
| `past`    | Historical—was tried, deprecated, or learned from | Urushi image evolution (cancelled) |
| `present` | Current—exists in codebase today                  | The Table, Drafting Room           |
| `planned` | Committed—has timeline, will be built soon        | Roster Room (Q1)                   |
| `future`  | Vision—in docs but no committed timeline          | Council Chamber, Archives          |

---

## How to Create a Note

See **CONTRIBUTING.md** for full details. Quick version:

1. Copy the right template from `/templates/`
2. Fill in frontmatter (dimensional coordinates)
   - Frontmatter uses flat fields like `ca-where-zone` and `ca-why-rationale` so links stay clickable in Obsidian Properties
3. Write content following template structure
4. Establish links with context
5. Verify links resolve

---

## Linking Conventions

Links should include context, not be naked pointers:

```markdown
# Good

- Depends on: [[priority-queue]] — provides candidate tasks for Bronze stack
- Part of: [[life-map]] — persistent element at top of workspace
- Supersedes: `[[old-bronze-mode]]` — replaced single-mode with three-mode system

# Bad

- Related: [[priority-queue]]
- See also: [[life-map]]
```

---

## Naming Conventions

- **Filenames:** `kebab-case.md` (e.g., `the-table.md`, `three-stream-model.md`)
- **Titles:** Title Case in frontmatter `title:` field
- **Links:** `[[filename]]` without `.md` extension

---

## For Conan (AI Librarian) — Slug Assembly

When assembling context slugs for a task:

1. **Identify the target artifact** — What feature/system is this task about?
2. **Pull dimensional coordinates** — WHERE/WHEN/WHY from frontmatter
3. **Follow links by weight** — Bug fix needs light context, feature build needs heavy
4. **Check for gaps** — Flag if WHY is missing or dependencies unclear

### Slug Recipes by Task Type

| Task Type     | WHERE  | WHEN   | WHY   | WHAT   | HOW   |
| ------------- | ------ | ------ | ----- | ------ | ----- |
| Bug fix       | Light  | Light  | Light | Medium | Heavy |
| Feature build | Medium | Heavy  | Heavy | Heavy  | Heavy |
| Refactor      | Heavy  | Medium | Light | Light  | Heavy |

---

## Key Documents

| Document            | Purpose                                |
| ------------------- | -------------------------------------- |
| **README.md**       | Overview and orientation (you're here) |
| **CONTRIBUTING.md** | How to add and edit notes              |
| **CONVENTIONS.md**  | Code patterns, naming, gotchas         |

---

## When to Update vs. When to Handoff

| Type of information    | Where it goes    |
| ---------------------- | ---------------- |
| Will need again        | Library (notes)  |
| One-time task context  | Handoff to agent |
| Code patterns          | CONVENTIONS.md   |
| How to work in library | CONTRIBUTING.md  |
| Feature context        | Feature note     |
| Strategic rationale    | Strategy note    |

**The test:** "Will I need to say this again next time?"

- **Yes** → Put it in the library
- **No** → Fine in the handoff

---

## Questions?

This library follows the Context Library framework. For methodology details, see the full guide.

For structural decisions or template changes, discuss with the human librarian before modifying.
