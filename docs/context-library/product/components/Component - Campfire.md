# Component - Campfire

## WHAT: Definition

A temporary compression phase -- the intimate space where the builder first encounters Jarvis and answers one question before the portal opens and the map reveals. The Campfire is the spring that loads before the release. It exists for the builder's first 60 seconds, then gives way to the world.

## WHERE: Ecosystem

- Parent:
  - [[Structure - Hex Grid]] -- exists at the edge of the grid (or as a pre-map overlay)
- Conforms to:
  - [[Standard - Visual Language]] -- warm glow, ink-and-color aesthetic visible up close
  - [[Standard - Onboarding Sequence]] -- the campfire is the compression step in the portal sequence
- Conforms to:
  - [[Principle - Compression and Release]] -- the Campfire IS the compression
  - [[Principle - Action Before Explanation]] -- one question, no explanation
- Related:
  - [[Journey - Builder Onboarding]] -- the campfire is wow beat #0 (compression)
  - [[Agent - Jarvis]] -- Jarvis is present, asks the question
  - [[Principle - First 72 Hours]] -- the campfire opens the 72-hour window
  - [[Component - Hex Tile]] -- sibling component on the hex grid

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] -- Jarvis is the first face
- Strategy: [[Strategy - Spatial Visibility]] -- the compression makes the spatial release land
- Principle: [[Principle - Compression and Release]] -- the Campfire exists TO create compression. Without it, the map reveal is just a screen loading.
- Driver: The builder needs an intimate, focused moment before the world opens. The compression loads the spring. The single question creates the builder's first action. The release rewards it.

## WHEN: Timeline

**Build phase:** Post-MVP
**Implementation status:** Not started
**Reality note (2026-02-12):** No Campfire component exists. Depends on Hex Grid, Jarvis agent, and the portal mechanic.

**Design decision (2026-02-26):** Campfire redesigned as compression phase. The 8-step MI conversation (D5) and 6-field scorecard (D6) are superseded. The campfire now asks ONE question and produces one field (`heavyThing`). MI research (Bordin, Co-Active, Stages of Change) remains valuable for post-onboarding Jarvis interactions but does not govern the campfire. Source: Power of the Portal.

**Design decision (GDD v0.2, 2026-02-13):** The campfire remains explicitly temporary -- NOT permanent. The campfire is a threshold, not a home.

## HOW: Implementation

### Visual Treatment

- Enclosed, intimate space -- the builder's view is narrowed, focused
- Warm, inviting, small -- ink-and-color aesthetic visible up close
- Jarvis is present -- the first time the builder sees the art style
- The map is NOT visible -- compression requires the world to be hidden

### The Sequence

1. Builder opens the app -> campfire renders (compression space)
2. Jarvis asks ONE question: "What's something you've been meaning to deal with?"
3. Builder types an answer (~15 seconds)
4. The portal opens -> view expands -> map reveals (this IS the crossing + release)
5. The campfire fades. The world is open.

### What the Campfire Accomplishes

- Creates emotional compression (intimate -> expansive contrast)
- Captures the builder's first input (`heavyThing` -- seeds the first project)
- Introduces Jarvis visually (the art style, the character)
- Does NOT: explain what LifeBuild is, describe the map, discuss AI teammates, establish a designed alliance, or identify a starting state through conversation

### Persistence

None. The campfire is gone once the portal opens. The map replaces it.

### Examples

- Builder opens LifeBuild for the first time -> campfire in an intimate space, Jarvis present -> one question -> builder types "I need to get my finances sorted" -> portal opens -> map reveals with sanctuary at center -> builder's words materialize as a hex -> the campfire fades. Total time: ~60 seconds.

- Builder opens the app on a mobile device -> same compression space, adapted to smaller screen -> Jarvis's question is prominent -> builder types a short answer -> the portal opens and the map reveals with the same spatial impact as desktop.

### Anti-Examples

- **Full MI conversation at the campfire** -- the campfire is 60 seconds, not 15 minutes. One question. The world teaches, not the conversation.
- **Campfire as permanent map feature** -- threshold, not fixture. Once crossed, gone.
- **Explaining LifeBuild before the portal** -- "Let me tell you about the sanctuary, the hex map, and your AI teammates" violates Action Before Explanation. The map SHOWS the builder what LifeBuild is.
- **Skipping the campfire** -- without compression, the map reveal is just a screen loading. The campfire exists to create the contrast that makes the release land.
- **Campfire at the center of the map** -- the campfire is at the EDGE or as a pre-map overlay. The sanctuary is at the center. Spatial distance creates the transition.
