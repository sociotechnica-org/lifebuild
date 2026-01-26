# LifeBuild Codebase Conventions

This document captures patterns, conventions, and gotchas for working in the LifeBuild codebase. If you're writing code here — human or AI — follow these.

**Last updated:** YYYY-MM-DD  
**Maintainer:** [Human librarian reviews and approves changes]

---

## Code Style

> **TODO:** Fill in as patterns emerge. Examples of what goes here:

### Naming

- Components: `PascalCase` (e.g., `CategoryCard`, `BronzeStack`)
- Files: `kebab-case.ts` or `PascalCase.tsx` for components
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### File Organization

```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── utils/          # Pure utility functions
├── types/          # TypeScript types
├── stores/         # State management
└── ...
```

### Patterns We Use

- [Pattern name] — brief description, link to example

### Patterns We Avoid

- [Anti-pattern] — why we avoid it

---

## Architecture Decisions

> Link to relevant notes in `/context/strategy/` for the "why" behind conventions.

| Convention   | Rationale             |
| ------------ | --------------------- |
| [Convention] | See [[strategy-note]] |

---

## Gotchas & Landmines

Things that have bitten us before. Read before touching these areas.

### [Area/Component Name]

**The trap:** Description of what goes wrong  
**The fix:** How to avoid it  
**Related:** [[learning-note-if-exists]]

### [Another Area]

**The trap:** ...  
**The fix:** ...

---

## Testing Conventions

### What to Test

- [Guidance on test coverage expectations]

### How to Test

```bash
# Run tests
npm test

# Run specific test
npm test -- --grep "pattern"
```

### Test File Naming

- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests (or vice versa — pick one)

---

## Git Conventions

### Branch Naming

```
feature/short-description
fix/issue-description
refactor/what-changing
docs/what-documenting
```

### Commit Messages

```
type: short description

Longer explanation if needed.

Refs: #issue-number (if applicable)
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### PR Process

1. [Your PR process here]

---

## Environment & Setup

### Prerequisites

- Node.js version: X.X
- Other dependencies

### Local Development

```bash
# Install
npm install

# Run dev server
npm run dev

# Other common commands
```

### Environment Variables

| Variable   | Purpose      | Example         |
| ---------- | ------------ | --------------- |
| `VAR_NAME` | What it does | `example-value` |

---

## Dependencies

### Key Libraries

| Library   | Purpose            | Docs   |
| --------- | ------------------ | ------ |
| [Library] | What we use it for | [Link] |

### Adding Dependencies

- [Any guidance on when/how to add new deps]

---

## Deployment

### Environments

- `development` — local
- `staging` — [URL if applicable]
- `production` — [URL if applicable]

### Deploy Process

- [How deploys work]

---

## When Conventions Conflict

If you encounter a situation where:

- Existing code doesn't follow these conventions
- Two conventions seem to conflict
- A convention doesn't make sense for your case

**Don't guess.** Flag it for human review. We'd rather discuss and update conventions than accumulate inconsistency.

---

## Updating This Document

This is a living document. When you discover:

- A pattern that should be standardized → propose addition
- A gotcha that bit you → add it so others don't repeat
- A convention that's outdated → flag for review

Submit updates via PR. Human librarian approves convention changes.
