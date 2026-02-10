# Capability - Purpose Assignment

## WHAT: Definition

The moment during project creation (Stage 2) when a director declares what the time investment is for — Maintenance, Building leverage, or Moving forward — determining which stream (Bronze, Silver, Gold) the project belongs to.

## WHERE: Ecosystem

- Room(s):
  - [[Room - Drafting Room]] — where project creation happens
- Uses:
  - [[Primitive - Project]] — the entity being classified
  - [[System - Four-Stage Creation]] — Stage 2 (Scoped)
- Enables:
  - [[Capability - Three-Stream Filtering]] — purpose determines stream, which determines filter
  - [[Capability - Weekly Planning]] — stream classification feeds planning selection
- Conforms to:
  - [[Standard - Three-Stream Portfolio]] — purpose determines stream classification

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — stream assignment enables structural protection
- Principle: [[Principle - Familiarity Over Function]] — the same task is Gold for one person and Bronze for another
- Decision: Subjective classification over objective criteria. The director's relationship to the work is the only classification that matters.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Partial
**Reality note (2026-02-10):** Stream classification exists but not via the exact "What is this time investment for?" question described. Instead, stream is derived from archetype + scale during Stage 2 (Scoping) — e.g., initiative + major/epic → Gold, systembuild/discovery → Silver, quicktask/maintenance/micro → Bronze. Marvin's prompt includes stream assignment guidance. Directors can set archetypes via `Stage2Form.tsx`. The subjective purpose question as a distinct UX moment is not implemented.

Captured during Stage 2 of project creation. Purpose can be changed later if the director's relationship to the work shifts.

## HOW: Implementation

**The question:** "What is this time investment for?"

**Purpose options:**

| Purpose           | Stream | Description                       |
| ----------------- | ------ | --------------------------------- |
| Maintenance       | Bronze | Keeping things from falling apart |
| Building leverage | Silver | Creating future capacity          |
| Moving forward    | Gold   | Changing my life                  |

**Agent behavior:** Marvin asks the purpose question without suggesting an answer. Agents may notice unusual classifications ("you marked 'buy groceries' as Gold — did you mean to do that?") and ask once, gently, but never override.

**Changeability:** Directors can change purpose later. Sometimes they realize in-process that something transformational is just busy work, or vice versa.
