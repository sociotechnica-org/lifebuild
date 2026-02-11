# Learning - Category Advisor Accessibility

## Divergence

**Vision:** Eight Category Advisors (Maya, Atlas, Brooks, Grace, Reed, Finn, Indie, Sage) each have their own Category Studio within the Strategy Studio zone. Directors visit a studio to get domain-specific guidance on their Health, Purpose, Finance, Relationships, Home, Community, Leisure, or Personal Growth projects.

**Reality:** All eight category advisors are fully defined in `rooms.ts` with names, prompts, personalities, and domain specializations. But no Category Studios room exists. No route leads to these advisors. Directors cannot interact with any of them. They are infrastructure-ready but user-inaccessible.

## Why It Matters

This is the closest "almost there" gap in the codebase. The agent definitions exist — personality, prompt, boundaries, knowledge domains. What's missing is purely routing and UI:

1. A route that maps to a Category Studio (or a mechanism to reach category advisors)
2. A UI component that renders the studio conversation
3. Navigation from the Life Map to the appropriate studio

The agent infrastructure (prompt engineering, personality design) is the hard part. The routing is comparatively straightforward.

## Current Workaround

The Project Guide agent (used in the Project Board room) provides some category-aware guidance within project context. But this is a per-project agent, not a per-category advisor. A director wanting general Health guidance (not tied to a specific project) has no agent to talk to.

## Implications

- Builders looking to add category advisor access should know the agent definitions already exist in `rooms.ts`. The work is UI/routing, not prompt engineering.
- The Category Studios room card describes a hub model (one room per category within the Strategy Studio zone). An alternative: add category advisors as accessible from the Life Map's category cards, which already exist.
- The 8 category advisors plus the 3 active room agents (Cameron, Marvin, Mesa) represent 11 of 14 designed agents. Making category advisors accessible would jump agent coverage from 3/14 to 11/14.

## When This Closes

When a route and UI exists to reach category advisors — whether via Category Studios rooms, Life Map category cards, or another navigation pattern.
