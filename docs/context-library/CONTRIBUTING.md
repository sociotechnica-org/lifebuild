# Contributing to the Context Library

This guide is for **humans and AI agents** working on LifeBuild. If you're adding context, fixing cards, or assembling context briefings, start here.

---

## When to Add or Update Cards

### Add a new card when:

- You build a new feature, system, or component
- You make a strategic decision worth preserving
- You learn something from a failed approach
- You discover a pressure or signal driving decisions
- You're repeatedly explaining the same context in handoffs

### Update an existing card when:

- The implementation changes
- You discover the card is incomplete or wrong
- Dependencies or relationships change
- Implementation status changes (update the WHEN section)

### Don't create a card when:

- It's one-time task-specific context (put in handoff)
- It duplicates existing content (link instead)
- It's obvious from reading the code (avoid noise)

---

## How to Add a Card

### 1. Classify using the type taxonomy

Use the decision tree and folder table in `reference.md` to determine the card's type and folder.

### 2. Create the file

Name it `Type - Name.md` in the correct folder. See `reference.md` for naming conventions and templates.

### 3. Fill in all 5 dimensions and follow the template

Every card has WHAT, WHERE, WHY, WHEN, and HOW sections. See `reference.md` for the dimension requirements and type-specific templates. Keep it atomic — one card answers one complete question.

### 4. Establish links with context

Every `[[wikilink]]` must include a context phrase — no naked pointers. See `reference.md` for link quality rules and examples.

### 5. Verify links resolve

Check that `[[Type - Name]]` actually exists. Broken links break context briefing assembly.

### 6. Check conformance obligations

If your card touches a governed domain (visual rendering, priority scoring, stream classification, etc.), it must link to the constraining Standard. See the conformance table in `reference.md`.

---

## How to Update a Card

### 1. Update the WHEN section

Always update implementation status and add a reality note with today's date if the implementation has changed.

### 2. Preserve links

If you rename a card, update all cards that link to it. Obsidian can help with this.

### 3. Update status if needed

- Code shipped? Update WHEN status to "Implemented" or "Partial"
- Approach abandoned? Add a Learning card capturing what we learned
- Reality diverged from vision? Add a reality note in the WHEN section

### 4. Keep atomic

If a card is getting too long (>700 words), consider splitting into hub + spokes.

---

## For AI Agents

### Before starting work on a feature:

1. **Check if a card exists** for the feature/system you're touching
2. **Read the card** and follow its `[[wikilinks]]` to understand context
3. **Check WHERE** — what else connects to this? What Standards must you conform to?
4. **Check WHEN** — is this "Implemented" (real) or "Not started" (vision only)?
5. **Check WHY** — understand the rationale before changing things

### After completing work:

1. **Update affected cards** if implementation changed
2. **Add new cards** for new features/components you created
3. **Update WHEN sections** with reality notes on cards you confirmed are accurate
4. **Flag gaps** — if you needed context that didn't exist, note it

### When assembling context briefings:

Use the **Conan agent** (`.claude/agents/conan.md`) to assemble a context briefing before implementation. Conan reads the retrieval profiles and assembles the right cards based on what you're building.

1. Start from the target card
2. Follow retrieval profiles to gather related context
3. Write the briefing to `.context/CONTEXT_BRIEFING.md`
4. Flag any broken links or missing context in the Gap Manifest

---

## Quality Checklist

Before committing card changes:

- [ ] File named `Type - Name.md` in the correct folder
- [ ] All 5 dimension headers present (`## WHAT:`, `## WHERE:`, `## WHY:`, `## WHEN:`, `## HOW:`)
- [ ] WHEN section has implementation status and reality note (if applicable)
- [ ] All `[[Type - Name]]` links resolve to existing cards
- [ ] Links include context (not naked pointers)
- [ ] Content matches template structure from `reference.md`
- [ ] Card is atomic (one complete question, <700 words preferred)
- [ ] Conformance obligations met (links to constraining Standards)

---

## When You're Unsure

- **Unsure which type?** Check the decision tree in `reference.md`. Apply classification guardrails in order.
- **Unsure where it belongs?** Check similar cards, follow the pattern
- **Unsure if it's worth documenting?** If you needed to know it, someone else will too
- **Found conflicting information?** Flag it — `**HUMAN JUDGMENT NEEDED:** [question]`

---

## Agent Roles

- **Conan** (`.claude/agents/conan.md`): Assembles context briefings, grades cards, audits quality. Does NOT write cards.
- **Sam** (`.claude/agents/sam.md`): Creates cards, fixes per recommendations, runs self-checks. Does NOT grade.
- **Human librarian**: Priority decisions, resolve ambiguity, go/no-go.

---

## Key References

- `reference.md` — Templates, folder structure, naming conventions, conformance obligations
- `CONVENTIONS.md` — Codebase-specific patterns
- `.claude/skills/sam/` — Card-building procedures
- `.claude/skills/conan/` — Grading and audit procedures
