# LifeBuild Context Library

Documentation system giving AI builder agents implicit context for aligned micro-decisions during software development.

---

## The Core Idea

**If you'll need to say it again, put it in the library.**

Without specification context, agents produce technically correct but contextually wrong outputs. This library makes the implicit knowledge experienced developers absorb by osmosis — the WHERE, WHEN, and WHY — explicit and queryable.

---

## Quick Start

### For AI Agents

1. Read **reference.md** — templates, naming, conformance obligations
2. Read **CONVENTIONS.md** — codebase patterns and gotchas
3. Before touching a feature, find its card and read the context (follow the wikilinks)
4. After completing work, update affected cards

### For Humans

1. Open this folder in **Obsidian** for full graph view, wikilink resolution, and backlinks
2. Review AI contributions to the library
3. Resolve ambiguities agents flag with `**HUMAN JUDGMENT NEEDED:**`

---

## Two Layers

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
| Artifacts    | 2     | Content objects directors create/edit                      |
| Capabilities | 7     | Actions/workflows directors perform                        |
| Primitives   | 3     | Core data entities (Project, System, Task)                 |
| Systems      | 15    | Invisible mechanisms governing behavior                    |
| Agents       | 14    | AI team members                                            |

---

## Folder Structure

```
/context-library/
├── README.md              # You are here
├── CONTRIBUTING.md         # How to add/edit cards
├── CONVENTIONS.md          # Codebase patterns and gotchas
├── reference.md            # Templates, naming, conformance obligations
│
├── /rationale/             # WHY we build
│   ├── /strategies/        # Guiding philosophies
│   ├── /principles/        # Judgment guidance
│   └── /standards/         # Testable specifications
│
├── /product/               # WHAT gets built
│   ├── /zones/             # Top-level workspaces
│   ├── /rooms/             # Nested spaces
│   ├── /overlays/          # Cross-zone persistent elements
│   ├── /structures/        # Spatial/visual fabric
│   ├── /components/        # UI widgets
│   ├── /artifacts/         # Content objects
│   ├── /capabilities/      # Actions/workflows
│   ├── /primitives/        # Core data entities
│   ├── /systems/           # Invisible mechanisms
│   ├── /agents/            # AI team members
│   └── /prompts/           # Agent implementations (planned)
│
Agent skill procedures live at `.claude/skills/bob/` and `.claude/skills/conan/`.
```

---

## Card Anatomy

Every card has five dimensions:

| Dimension | Question             | Requirement                           |
| --------- | -------------------- | ------------------------------------- |
| **WHAT**  | What is this?        | Standalone definition                 |
| **WHERE** | What's connected?    | 3+ contextualized wikilinks           |
| **WHY**   | Why does this exist? | Strategy/Principle link + driver      |
| **WHEN**  | What's the status?   | Temporal status                       |
| **HOW**   | How does it work?    | Sufficient for a builder to implement |

---

## Naming Conventions

| Type      | Pattern                 | Example                             |
| --------- | ----------------------- | ----------------------------------- |
| Strategy  | `Strategy - [Name].md`  | `Strategy - Spatial Visibility.md`  |
| Principle | `Principle - [Name].md` | `Principle - Visual Recognition.md` |
| Standard  | `Standard - [Name].md`  | `Standard - Visual Language.md`     |
| Zone      | `Zone - [Name].md`      | `Zone - Life Map.md`                |
| Room      | `Room - [Name].md`      | `Room - Sorting Room.md`            |
| Component | `Component - [Name].md` | `Component - Hex Tile.md`           |
| System    | `System - [Name].md`    | `System - Adaptation.md`            |
| Agent     | `Agent - [Name].md`     | `Agent - Jarvis.md`                 |

---

## Linking Conventions

Links must include context — no naked pointers:

```markdown
# Good

- [[Zone - Life Map]] — primary execution workspace
- [[Standard - Visual Language]] — hex tiles render per spec

# Bad

- [[Zone - Life Map]]
- See: [[Standard - Visual Language]]
```

---

## Key Documents

| Document            | Purpose                                    |
| ------------------- | ------------------------------------------ |
| **README.md**       | Overview and orientation (you're here)     |
| **reference.md**    | Templates, naming, conformance obligations |
| **CONTRIBUTING.md** | How to add and edit cards                  |
| **CONVENTIONS.md**  | Codebase patterns, naming, gotchas         |

---

## Browsing

For the best experience browsing and QA'ing this library, open this folder as an **Obsidian vault**. You'll get:

- Graph view showing the full card network
- Click-through `[[wikilink]]` navigation
- Backlinks panel showing what references each card
- Full-text search across all cards

---

## Roles

| Role           | Responsibility                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| **Conan** (AI) | Quality guardian — grades, audits, diagnoses, recommends, creates surgery plans. Does NOT write cards. |
| **Bob** (AI)   | Builder — creates and fixes cards per surgery plans.                                                   |
| **Human**      | Priority decisions, ambiguity resolution, go/no-go.                                                    |
