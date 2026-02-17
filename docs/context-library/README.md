# LifeBuild Context Library

Documentation system giving AI builder agents implicit context for aligned micro-decisions during software development.

---

## The Core Idea

**If you'll need to say it again, put it in the library.**

Without specification context, agents produce technically correct but contextually wrong outputs. This library makes the implicit knowledge experienced developers absorb by osmosis — the WHERE, WHEN, and WHY — explicit and queryable.

---

## Quick Start

### For AI Agents

1. Read **reference.md** — type taxonomy, templates, naming, conformance obligations
2. Read **CONVENTIONS.md** — codebase patterns and gotchas
3. Before touching a feature, find its card and read the context (follow the wikilinks)
4. After completing work, update affected cards

### For Humans

1. Open this folder in **Obsidian** for full graph view, wikilink resolution, and backlinks
2. Review AI contributions to the library
3. Resolve ambiguities agents flag with `**HUMAN JUDGMENT NEEDED:**`

---

## Library Structure

### Rationale (`/rationale/`) — WHY we build

| Type       | Count | Purpose                                                   |
| ---------- | ----- | --------------------------------------------------------- |
| Strategies | 3     | Guiding philosophies — the bets we're making              |
| Principles | 11    | Judgment guidance — rules of thumb                        |
| Standards  | 16    | Testable specifications — concrete rules cards conform to |

### Product (`/product/`) — WHAT gets built

| Type         | Count | Purpose                                                    |
| ------------ | ----- | ---------------------------------------------------------- |
| Zones        | 3     | Top-level workspaces (Life Map, Strategy Studio, Archives) |
| Rooms        | 7     | Nested spaces within zones                                 |
| Overlays     | 1     | Cross-zone persistent elements (The Table)                 |
| Structures   | 2     | Spatial/visual fabric (Hex Grid, Kanban Board)             |
| Components   | 5     | Specific UI widgets                                        |
| Artifacts    | 2     | Content objects builders create/edit                       |
| Capabilities | 7     | Actions/workflows builders perform                         |
| Primitives   | 3     | Core data entities (Project, System, Task)                 |
| Systems      | 15    | Invisible mechanisms governing behavior                    |
| Agents       | 14    | AI team members                                            |

### Experience (`/experience/`) — HOW it feels

| Type       | Count | Purpose                         |
| ---------- | ----- | ------------------------------- |
| Loops      | 5     | Repeating engagement cycles     |
| Journeys   | 2     | Multi-phase progression arcs    |
| Aesthetics | 6     | Target emotional experiences    |
| Dynamics   | 8     | Emergent cross-system behaviors |

### Releases (`/releases/`) — WHAT ships

Release cards track the product roadmap from Release 1 (The Campfire) through Release 9 (The Seasons), organized in 4 narrative arcs.

### Sources (`/sources/`) — WHERE ideas came from

Frozen snapshot documents (GDDs, research, strategic memos) that informed the creation of cards. **Not searchable by agents** — used by humans and Conan for drift detection and error checking. See `sources/README.md` for conventions.

### Temporal (`/temporal/`) — WHEN decisions were made

Decision records, initiative tracking, and future vision cards. (Vision-vs-reality divergences live in each card's WHEN section, not in standalone files.)

---

## Key Documents

| Document            | Owns                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **README.md**       | Orientation and motivation (you're here)                                                          |
| **reference.md**    | Type taxonomy, card templates, folder structure, naming, conformance obligations, link quality    |
| **CONTRIBUTING.md** | Procedures for adding/editing cards, quality checklist, agent roles (Conan/Bob/Human)             |
| **CONVENTIONS.md**  | Codebase patterns, file organization, architecture decisions, gotchas, testing, git, dependencies |

---

## Browsing

For the best experience browsing and QA'ing this library, open this folder as an **Obsidian vault**. You'll get:

- Graph view showing the full card network
- Click-through `[[wikilink]]` navigation
- Backlinks panel showing what references each card
- Full-text search across all cards
