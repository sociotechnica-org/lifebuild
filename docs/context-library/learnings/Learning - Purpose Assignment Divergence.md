# Learning - Purpose Assignment Divergence

## Divergence

**Vision:** Purpose is captured during Stage 2 of project creation with a single direct question: "What is this time investment for?" The director answers with one of three purposes — Gold (expansion/transformation), Silver (capacity/leverage), or Bronze (maintenance/operations). The question is subjective and personal per [[Principle - Familiarity Over Function]].

**Reality:** Stream classification is derived from two separate selections: archetype and scale. The director chooses a project archetype (e.g., "build," "learn," "fix," "maintain") and a scale (e.g., "major," "moderate," "minor"), and the system derives the Gold/Silver/Bronze stream from that combination. There is no single "What is this time investment for?" question.

## Why It Matters

This is a design divergence, not a missing feature. The current implementation *works* — directors end up with a stream classification. But the mechanism is different from what the context library describes:

- **Vision:** One subjective question about meaning → stream
- **Reality:** Two objective-ish selections (archetype + scale) → derived stream

The Familiarity Over Function principle says the director's *relationship* to the work determines classification. The archetype+scale approach is slightly more objective (a "fix" at "minor" scale derives to Bronze regardless of how the director feels about it). A director who considers a minor fix personally transformational would need to override the derivation.

## Implications

- The [[Capability - Purpose Assignment]] card describes the direct-question model. Builders should look at the actual Drafting Room UI and Four-Stage Creation flow to see what's implemented.
- The derived approach may be intentional — it reduces cognitive load compared to asking "what is this for?" which might feel abstract to new users.
- If the direct-question model is still the target, this is a UI change in the Drafting Room, not a data model change. The stream field on projects already exists.
- Marvin's prompt may need updating if the purpose assignment mechanism changes.

## When This Closes

When a deliberate decision is made: keep archetype+scale derivation (and update the Capability card) or switch to the direct question (and update the Drafting Room UI). Either resolution is valid.
