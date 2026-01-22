# Contributing to the Context Library

This guide is for **humans and AI agents** working on LifeBuild. If you're adding context, fixing documentation, or assembling slugs, start here.

---

## Core Principle

**If you'll need to say it again, put it in the library.**

Context that helps with one task will help with future tasks. Don't repeat yourself in handoffs — update the docs.

---

## When to Add or Update Notes

### Add a new note when:

- You build a new feature, system, or component
- You make a strategic decision worth preserving
- You learn something from a failed approach
- You discover a pressure or signal driving decisions
- You're repeatedly explaining the same context in handoffs

### Update an existing note when:

- The implementation changes
- You discover the note is incomplete or wrong
- Dependencies or relationships change
- Status changes (planned → present, present → past)

### Don't create a note when:

- It's one-time task-specific context (put in handoff)
- It duplicates existing content (link instead)
- It's obvious from reading the code (avoid noise)

---

## How to Add a Note

### 1. Choose the right template

| Documenting...           | Template        | Folder                 |
| ------------------------ | --------------- | ---------------------- |
| Major product area       | `_zone.md`      | `/product/zones/`      |
| Cross-cutting mechanism  | `_system.md`    | `/product/systems/`    |
| User-facing feature      | `_feature.md`   | `/product/features/`   |
| Technical implementation | `_component.md` | `/product/components/` |
| Strategic principle      | `_strategy.md`  | `/context/strategy/`   |
| External force           | `_pressure.md`  | `/context/pressures/`  |
| Metric/observation       | `_signal.md`    | `/context/signals/`    |
| Past approach/lesson     | `_learning.md`  | `/timeline/past/`      |
| Future plan              | `_vision.md`    | `/timeline/future/`    |

### 2. Copy and rename

```bash
cp templates/_feature.md product/features/my-feature.md
```

### 3. Fill in frontmatter completely

Every field matters for querying and slug assembly. Don't skip the dimensional coordinates.

### 4. Write content following the template structure

Keep it atomic — one note answers one complete question.

### 5. Establish links with context

```markdown
# Good

- Depends on: [[priority-queue]] — provides candidate tasks

# Bad

- See: [[priority-queue]]
```

### 6. Verify links resolve

Check that `[[linked-note]]` actually exists. Broken links break slug assembly.

---

## Linking Principles

### Every Reference Should Be a WikiLink

If you mention another concept that has (or should have) a note, make it a link:

```markdown
# Bad
The Table depends on the Priority Queue for candidates.

# Good
[[the-table]] depends on [[priority-queue]] for candidates.
```

Even if the target note doesn't exist yet, create the link. Broken links are useful—they show what documentation is missing.

### Links Need Context

Don't drop naked links. Explain the relationship:

```markdown
# Bad
Related:
- [[priority-queue]]

# Good
**Requires:**
- [[priority-queue]] — sources all candidates for The Table
```

### WHY Lives in Two Places

For features and systems, capture WHY in both:

1. **Metadata** (`ca-why` fields) — enables Conan to query relationships
2. **Content section** ("Why It Exists") — enables humans to understand rationale

This duplication is intentional. They serve different purposes:
- Metadata answers: "What features implement visual-work strategy?" (query)
- Content answers: "Why does The Table exist?" (understanding)

### Lateral Links Create Discovery

The "Related Features/Systems" section enables discovery of peer concepts:

```markdown
## Related Features

**Prerequisites:**
- [[sorting-room]] — where priorities are selected before appearing here

**Complements:**
- [[project-board]] — opened when clicking items on The Table

**Enables:**
- [[dual-presence]] — Work at Hand items appear in multiple places
```

Without these lateral links, notes become islands. With them, someone exploring one feature naturally discovers related features.

### Temporal Links Show Evolution

Even if Past/Future notes don't exist yet, include the Evolution section:

```markdown
## Evolution

**Supersedes:** null (new capability)
**Future:** [[future-bronze-quick-add]] — planned enhancement
```

This creates placeholders that:
- Show what documentation is needed
- Enable Conan to trace how features evolved
- Prevent repeating past mistakes

---

## Section Order (Features)

Follow this order for consistency:

1. **Title + intro paragraph** — what this is
2. **Why It Exists** — strategy links, drivers, rationale
3. **How It Works** — mechanics, interactions
4. **Related Features** — prerequisites, complements, enables
5. **Components** — child components with links
6. **Dependencies** — what this requires and enables
7. **Constraints** — hard limits
8. **Edge Cases** — unusual scenarios
9. **Evolution** — past and future
10. **Open Questions** — unresolved decisions

Not every section needs content, but the structure should be consistent.

---

## How to Update a Note

### 1. Update `last-verified` date

Always update the frontmatter date so we know when this was last confirmed accurate.

### 2. Preserve links

If you rename a note, update all notes that link to it. Obsidian can help with this.

### 3. Update status if needed

- Code shipped? `planned` → `present`
- Approach abandoned? `present` → `past`
- Feature deprecated? Create a `_learning.md` note capturing what we learned

### 4. Keep atomic

If a note is getting too long (>800 words), consider splitting into hub + spokes.

---

## For AI Agents

### Before starting work on a feature:

1. **Check if a note exists** for the feature/system you're touching
2. **Read the note** and follow its links to understand context
3. **Check `ca-where` dependencies** — what else might be affected?
4. **Check `ca-when`** — is this `present` (real) or `planned` (not yet built)?
5. **Check `ca-why`** — understand the rationale before changing things

### After completing work:

1. **Update affected notes** if implementation changed
2. **Add new notes** for new features/components you created
3. **Update `last-verified`** dates on notes you confirmed are accurate
4. **Flag gaps** — if you needed context that didn't exist, note it

### When assembling slugs:

1. Start from the target artifact note
2. Follow dimensional coordinates to gather context
3. Weight by task type (see README for recipes)
4. Flag any broken links or missing context
5. Keep slugs token-efficient — include what's needed, not everything

---

## Quality Checklist

Before committing note changes:

- [ ] Frontmatter is complete (no empty required fields)
- [ ] `ca-when` status is accurate
- [ ] `last-verified` date is today
- [ ] All `[[links]]` resolve to existing notes
- [ ] Links include context (not naked pointers)
- [ ] Content matches template structure
- [ ] Note is atomic (one complete question)

---

## When You're Unsure

- **Unsure which template?** → Pick closest match, can refactor later
- **Unsure where it belongs?** → Check similar notes, follow the pattern
- **Unsure if it's worth documenting?** → If you needed to know it, someone else will too
- **Found conflicting information?** → Flag it, ask human librarian to resolve

---

## Questions?

Human librarian has final authority on structural decisions. Flag ambiguities rather than guessing on:

- Template changes
- Folder reorganization
- Naming convention changes
- Merging or splitting notes
