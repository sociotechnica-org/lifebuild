---
title: Visual Work
type: strategy
ca-when: present

ca-where:
  applies-to:
    - "[[life-map]]"
    - "[[the-table]]"
    - "[[category-cards]]"
    - "[[dual-presence]]"

ca-why:
  rationale: "Making work visible creates agency; directors should see commitments at a glance, not buried in lists"

last-verified: 2026-01-22
---

# Visual Work

**Core Principle:** Making work visible creates agency. Directors should see their commitments, priorities, and progress at a glance—not buried in lists or hidden behind navigation.

---

## The Insight

Most productivity tools hide work:
- Tasks buried in long lists requiring scrolling
- Projects nested in folders requiring navigation
- Priorities implicit, not visually distinct
- Progress invisible until you dig into details

This creates cognitive load and anxiety. Directors don't know what they've committed to, what matters most, or how they're progressing. Work becomes abstract and overwhelming.

**Visual Work inverts this.** Work is:
- **Spatially organized** — categories map to life domains
- **Persistently visible** — [[the-table]] never scrolls away
- **Visually distinct** — different states have different treatments
- **Progress-apparent** — rings, stages, and states show status

---

## How We Apply It

### Spatial Organization
Work lives in space, not just lists. [[life-map]] organizes projects across eight domains. Directors develop spatial memory: "My health projects are top-left."

### Persistent Priority
[[the-table]] stays visible at all altitudes. No navigation required to answer "what am I working on?" This is the most direct implementation of Visual Work.

### Visual State
Projects and tasks have treatments communicating state:

| State | Treatment | Meaning |
|-------|-----------|---------|
| Plans | Dimmed | Ready but not active |
| Live | Normal | Active, can work on |
| [[work-at-hand]] | Glowing, animated | Current priority |
| Paused | Desaturated | Temporarily halted |
| Completed | Archived | Done, celebrated |

### Progress Visibility
Progress rings show completion percentage. Image evolution (sketch → polish) communicates maturity. Directors see progress without opening anything.

---

## Implementing Features

Features embodying this principle:

- [[the-table]] — persistent priority spotlight; always visible regardless of navigation
- [[category-cards]] — spatial organization by life domain
- [[dual-presence]] — [[work-at-hand]] visible in both spotlight and domain context
- [[life-map]] — primary workspace making all work spatially accessible

---

## What This Principle Prevents

| Anti-Pattern | Visual Work Solution |
|--------------|---------------------|
| "I forgot about that project" | Projects always visible on [[category-cards]] |
| "What was I supposed to focus on?" | [[the-table]] shows current priorities |
| "I don't know if I'm making progress" | Progress rings update as tasks complete |
| "I have to dig to find things" | Spatial organization reduces navigation |
| "Everything looks the same urgency" | [[work-at-hand]] has distinct visual treatment |

---

## Tensions & Trade-offs

### Visibility vs. Overwhelm
Showing everything creates overwhelm. 
**Resolution:** Progressive disclosure (altitude levels) and filtering ([[the-table]] shows only [[work-at-hand]], not all Live work).

### Persistence vs. Real Estate
[[the-table]] takes space that could show more projects.
**Resolution:** Trade-off accepted—persistent priority awareness is worth the real estate.

### Visual Richness vs. Performance
Rich visuals cost render performance.
**Resolution:** Optimize for smooth experience; degrade gracefully on lower-end devices.

---

## Anti-Patterns to Avoid

- **List-ification** — Don't default to lists when spatial layouts would serve better
- **Hidden-by-default** — Don't hide important information behind clicks
- **Uniform treatment** — Don't make everything look the same; use visual distinction for meaning
- **Information overload** — Don't show everything at once; use progressive disclosure

---

## Related Strategies

- [[three-stream-model]] — provides structure for *what* is shown (Gold/Silver/Bronze)
- [[work-at-hand]] — determines *which* work gets premium visual treatment

---

## Design Implications

### Typography & Hierarchy
Information hierarchy guides attention. Most important (titles, progress) = prominent. Secondary (dates, tags) = accessible but not competing.

### Color Encodes Meaning
- Stream colors ([[gold-slot]]/[[silver-slot]]/[[bronze-stack]]) = work type
- Category colors = life domain
- State colors = status

### Animation Draws Attention Sparingly
- Breathing animation on [[work-at-hand]]
- Subtle hover effects
- Progress ring animations on state change

Too much animation = noise. Too little = lost benefit.

### Density & Breathing Room
Visual Work requires space. Better to show fewer items clearly than many items cramped.

---

## Open Questions

- [ ] How does Visual Work translate to mobile's smaller screen?
- [ ] Should there be a "focus mode" reducing visual complexity?
- [ ] How do we handle directors with 100+ projects?
