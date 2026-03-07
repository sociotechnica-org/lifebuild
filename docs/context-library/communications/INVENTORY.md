# Communications Section Inventory (Corrected)

Source: Founder strategic vision document (2026-03-07 session)
Date: 2026-03-07 (revised)
Scope: All cards needed to document LifeBuild's communications strategy and operations

---

## What This Section Is

The communications section documents **how the company does communications work** — its strategy, operating models, standards, and repeatable patterns. It is company operations documentation, not a new product wing.

Agents consume these cards to help founders do communications work: planning content, managing relationships, running groups, maintaining an editorial calendar. The card types should match how a communications professional thinks, not how a UI engineer thinks.

The previous inventory was wrong. It mapped everything onto product-layer types (Zones, Rooms, Structures, Artifacts, Components, Primitives) as if the company were building a communications feature. That was a misread of the source. The communications section parallels the rationale section — it is the WHY and HOW of doing the work, not the WHAT of building a UI.

---

## Type Taxonomy Fit Assessment

The existing taxonomy was built for product documentation. Some types transfer cleanly to communications operations; others don't fit; some concepts need new types.

### Types that transfer cleanly

| Type          | Communications use                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Strategy**  | The bets being made about communications (e.g., "structured socialization is infrastructure")         |
| **Principle** | Judgment guidance for communications decisions (e.g., division separation, inbound priority)          |
| **Standard**  | Testable specs governing communications quality, privacy, cadence                                     |
| **System**    | Invisible mechanisms running the communications operation (editorial calendar logic, health tracking) |
| **Agent**     | Dedicated communications agents (Arvin, Gretta, Kelvin) operating alongside product agents            |

### Types that do NOT transfer — do not use

| Type      | Why not                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone      | Product navigation concept. Communications sections are not navigable workspaces — they are documentation domains.                                                                                         |
| Room      | Product navigation concept. Same problem.                                                                                                                                                                  |
| Structure | Spatial canvas of a UI room. Doesn't apply.                                                                                                                                                                |
| Component | Discrete UI widget. Doesn't apply.                                                                                                                                                                         |
| Primitive | Core data entity in the app schema. Communications contacts and content items are not yet app primitives — they're operational concepts. Do not pre-emptively create Primitive cards for unbuilt features. |
| Artifact  | Content object that builders create/edit IN THE APP. Communications documents (briefs, playbooks) don't live in the app yet.                                                                               |
| Overlay   | Cross-zone UI element. Doesn't apply.                                                                                                                                                                      |

### New types needed

The following concepts appear in the source and don't fit any existing type:

| Proposed Type | Definition                                                                                                                                                                                                                             | Decision                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Division**  | A structurally distinct operating model within the communications operation. 1:1, Groups, and 1:Many each have different medium, privacy posture, agent staffing, and cadence. Not a product zone — an organizational unit.            | **Propose as new type.** These are load-bearing concepts; forcing them into System (invisible mechanism) is wrong — they have explicit operating models builders refer to.                                  |
| **Playbook**  | A documented repeatable pattern for a communications scenario: intro sequence, event follow-up, crisis comms, inbound triage. Not a capability (it's not an action) and not a system (it's not invisible). It's a documented protocol. | **Propose as new type.** Closest analogy: Standard (testable) + HOW detail. Could live as a specialized Standard subtype, but deserves its own folder given the volume expected. **HUMAN JUDGMENT NEEDED.** |
| **Channel**   | A communications medium with defined purpose, audience, cadence, and production model: LinkedIn, newsletter, blog, email, YouTube. Not a product zone (the builder doesn't navigate to LinkedIn in the app). Not a system.             | **Propose as new type.** Or: document each channel as a card within the Division - 1:Many card's HOW section rather than as standalone cards. **HUMAN JUDGMENT NEEDED on granularity.**                     |

**HUMAN JUDGMENT NEEDED:** Approve, reject, or rename the three proposed new types before Sam builds cards against them. If Division, Playbook, and Channel are approved, Sam should add them to `docs/context-library/reference.md` and create their folders. If rejected, provide the type they should use instead.

---

## Framing: Three Divisions

The source establishes three structurally distinct operating models:

- **1:1** — Relationship management. Functionally sales. CRM model: contact list categorized by objective, notes, health tracking. Heavily shaped by inbound. High selectivity required.
- **Groups** — Community leadership. Facilitation, events, shared documents. Different privacy context. Example: Silvering Chalices men's group.
- **1:Many** — Content and thought leadership. The "marketing factory." Blog, video, newsletter, social, contests. Production pipeline. Editorial calendar. Scale-oriented.

These divisions are not parallel product features — they are distinct operating models with different staff, privacy rules, and production rhythms. Cross-division coordination happens at the strategy level, not the production level.

---

## Expected Cards

**Total: 21 new cards**

### Strategy (2)

| Card                                       | Status    | Rationale                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strategy - Socialization as Infrastructure | Not built | The upstream bet: structured socialization across 1:1, Groups, and 1:Many is not a nice-to-have — it is infrastructure for a well-lived and well-operating company. The same rigor applied to software production applies to relationship and content production. Anchor for all communications cards.                                                 |
| Strategy - Content Factory Model           | Not built | The bet that the software factory model (Decide → Shape → Make → Patch) applies directly to communications production. Separate factories per division, coordinated at the strategy level. The key insight from the source: AI is better trained at communications than at code, making this factory potentially more effective than the software one. |

**Note:** [[Strategy - Superior Process]] and [[Strategy - AI as Teammates]] already exist and apply to communications. New cards should link to these rather than restate them.

### Principles (4)

| Card                                | Division(s) | Status    | Rationale                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ----------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principle - Division Separation     | All         | Not built | Context, tone, privacy posture, and agent access differ fundamentally across the three divisions. 1:1 relationship data must never bleed into 1:Many publishing. Group intelligence stays within the group. The rule of thumb that prevents cross-contamination errors in agent behavior.                  |
| Principle - Inbound Priority        | 1:1         | Not built | In 1:1 relationship management, who shows up shapes the list. Do not force outbound relationship building on contacts who haven't initiated. Reactive by design at this stage. The challenge: too many low-value inbound meetings require a framework for saying no.                                       |
| Principle - Human Approval Gate     | All         | Not built | No AI-drafted communications — emails, posts, messages, announcements — are dispatched without human review and approval. AI produces; human dispatches. Clear line of responsibility. Applies to all three divisions.                                                                                     |
| Principle - Strategy Before Factory | All         | Not built | The biggest problem identified in the source: no master strategy or end game exists for socialization. The factory should not be built before the strategy layer exists. Gap analysis and editorial calendar decisions must precede production ramp-up. Prevents building at scale in the wrong direction. |

### Standards (4)

| Card                                    | Division(s) | Status    | Rationale                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | ----------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard - Communications Privacy Rules | All         | Not built | Testable spec: what data in each division is private (1:1 contact notes), shared with AI agents (group strategic context), or publishable (1:Many content). Different rules per division. Every agent and every production workflow must conform. Most broadly constraining standard in the section. |
| Standard - Relationship Health Criteria | 1:1         | Not built | Testable spec for what constitutes a healthy vs. decaying 1:1 relationship: recency of meaningful contact, depth of interaction, objective progress, reciprocity signals. Used by the relationship health tracking system and by Arvin for strategic relationship counsel.                          |
| Standard - Content Type Definitions     | 1:Many      | Not built | Enumeration of content types (blog post, video script, newsletter, social post, contest) with distinct production stages, approval requirements, and channel targets. Governs the content factory. Multiple downstream cards conform to this.                                                        |
| Standard - Editorial Cadence Rules      | All         | Not built | Testable constraints on publishing rhythm: minimum and maximum frequency per channel, cross-division coordination windows, blackout periods, sprint cadence alignment. Prevents overproduction and burnout.                                                                                          |

### Systems (4)

Systems are invisible mechanisms that run continuously — the builder doesn't configure them session to session, they govern behavior behind the scenes.

| Card                                  | Division(s) | Status    | Rationale                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System - Editorial Calendar           | All         | Not built | The master mechanism governing the release schedule across all three divisions. Tracks planned content, relationship touchpoints, and group events in a unified timeline. This is the infrastructure-level object — not a document the founder edits, but the governing logic behind what's scheduled when. Inputs from all three divisions; outputs a coordinated production rhythm. |
| System - Relationship Health Tracking | 1:1         | Not built | Invisible mechanism that monitors recency and depth of 1:1 contacts, computes health scores against [[Standard - Relationship Health Criteria]], and surfaces decay signals (similar to [[System - Smoke Signals]] in product). Runs continuously; builder sees outputs, not the mechanism.                                                                                           |
| System - Content Production Pipeline  | 1:Many      | Not built | Invisible mechanism that moves content items through Decide → Shape → Make → Patch stages, tracks state per item and per channel, and enforces WIP limits. Parallel to [[System - Pipeline Architecture]] in product but scoped to communications production. Conforms to [[Standard - Content Type Definitions]] and [[Standard - Editorial Cadence Rules]].                         |
| System - Contact Classification       | 1:1         | Not built | Invisible mechanism that organizes contacts by objective type (peer, mentor, mentee, collaborator, investor, community member) and relationship tier. Determines which contacts surface in which contexts. Builder sets initial classification; system maintains it. Governs how the 1:1 division operates day-to-day.                                                                |

### Division (3 — proposed new type)

If the Division type is approved, these three cards document the operating model of each division. If Division is rejected, absorb this content into Strategy - Socialization as Infrastructure or create a single Standard card.

| Card                                   | Status    | Rationale                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Division - 1:1 Relationship Management | Not built | Operating model for high-value individual relationships. Objective categorization, contact notes, health tracking, inbound triage, meeting selectivity criteria. Functionally a CRM operation. Staffed by Arvin (strategic counsel) with health tracking system running in background. Privacy posture: highest — no contact data shared beyond the division.      |
| Division - Groups                      | Not built | Operating model for community leadership. Facilitation cadences, event planning, shared document conventions, group health monitoring, member roster management. Staffed by Arvin for strategic navigation. Privacy posture: group-level — intelligence shared within group context but not with 1:Many. Example context: Silvering Chalices political navigation. |
| Division - 1:Many                      | Not built | Operating model for content and thought leadership. Content factory (Decide → Shape → Make → Patch), channel strategy, editorial calendar governance, publishing approval workflow. The highest-volume and most systematizable division. Privacy posture: public — produced for external audiences. Staffed by Gretta for production management.                    |

### Playbook (variable — proposed new type)

Playbooks are documented repeatable patterns for specific communications scenarios. The number of playbooks is open-ended; the inventory identifies the highest-priority ones for the initial build.

**HUMAN JUDGMENT NEEDED:** If Playbook is approved as a type, how granular should the initial build be? The source doesn't enumerate specific playbooks — these are derived from what communications operations commonly require. The list below is a proposed starting set, not exhaustive.

| Card                              | Division(s) | Status    | Rationale                                                                                                                                                                                                                              |
| --------------------------------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Playbook - Inbound Triage         | 1:1         | Not built | How to evaluate and respond to meeting requests and relationship inbound. Framework for saying no gracefully, routing to async, or accepting. Addresses the source's stated challenge: too many low-value coffee meetings from locals. |
| Playbook - Content Briefing       | 1:Many      | Not built | The Decide → Shape handoff. How to move a content idea to a brief: audience identification, angle selection, format choice, success criteria. Arvin facilitates this with the founder.                                                |
| Playbook - Group Event            | Groups      | Not built | How to plan, facilitate, and archive a group event: pre-event preparation, facilitation structure, post-event capture, follow-up communications. Drawn from Silvering Chalices experience.                                             |
| Playbook - Relationship Follow-Up | 1:1         | Not built | After a meaningful 1:1 interaction: what to log, how to assess health signal change, whether a follow-up communication is warranted, how to draft it for human approval.                                                               |

### Channel (variable — proposed new type, or collapsed into Division - 1:Many)

If Channel is not approved as a standalone type, channel-specific guidance collapses into Division - 1:Many's HOW section. If approved, one card per active channel.

**HUMAN JUDGMENT NEEDED:** Is the founder operating enough distinct channels to warrant separate Channel cards, or is a single channel table in Division - 1:Many sufficient at this stage? The source mentions blog, video, newsletter, social, contests but doesn't give channel-level operational detail.

Proposed cards if type is approved:

| Card                 | Status    | Note                                                                     |
| -------------------- | --------- | ------------------------------------------------------------------------ |
| Channel - LinkedIn   | Not built | Audience, posting cadence, content types that perform, voice calibration |
| Channel - Newsletter | Not built | Subscriber relationship, cadence, format conventions, editorial position |
| Channel - Blog       | Not built | Long-form strategy, SEO posture, content types, update frequency         |

Lower priority — build only after Division - 1:Many card is stable.

---

## Communications Division Agents (separate from product agents)

The communications division has its own agent roster, separate from the software factory agents (George, Conan, Sam). These agents are defined in `.claude/agents/` and `.claude/skills/`, not as library cards.

| Agent              | Role                    | Status    | Definition                                    |
| ------------------ | ----------------------- | --------- | --------------------------------------------- |
| Arvin Gildencranst | Strategic Advisor / COO | Built     | `.claude/agents/arvin.md`                     |
| Gretta Von Trapp   | PM / Whip               | Not built | Deferred until operation has enough to manage |
| Kelvin Kiperbelt   | Analyst                 | Not built | Deferred until enough data exists to analyze  |

**Note:** The original inventory assumed communications work would be added to existing product agents (Jarvis, Marvin, Conan). This was revised — the communications division has its own dedicated agents. Product agents remain scoped to the software factory.

---

## Conformance Map

| Standard                                | Constrains                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Standard - Communications Privacy Rules | Division - 1:1, Division - Groups, Division - 1:Many, all Playbooks, Arvin (all divisions), Gretta (1:Many, Groups) |
| Standard - Relationship Health Criteria | System - Relationship Health Tracking, Division - 1:1, Playbook - Relationship Follow-Up                            |
| Standard - Content Type Definitions     | System - Content Production Pipeline, Division - 1:Many, Playbook - Content Briefing, Channel cards                 |
| Standard - Editorial Cadence Rules      | System - Editorial Calendar, Division - 1:Many, Channel cards                                                       |

---

## Build Order

Build in dependency order — most-depended-on first. Do not build Division, Playbook, or Channel cards until their type decisions are resolved.

### Phase 0: Human Decisions Required

Before Sam builds anything, resolve:

1. **Approve/reject Division type** — three cards depend on this
2. **Approve/reject Playbook type** — four cards depend on this
3. **Approve/reject Channel type** — three cards depend on this (low priority; can defer)
4. **Channel granularity** — does Division - 1:Many carry all channel detail, or do Channel cards exist?

### Phase 1: Strategy and Principles (independent anchors)

| Order | Card                                       | Rationale                                                                       |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| 1     | Strategy - Socialization as Infrastructure | Upstream anchor for everything. Build first.                                    |
| 2     | Strategy - Content Factory Model           | Second upstream anchor for 1:Many and cross-division.                           |
| 3     | Principle - Division Separation            | Most referenced principle — appears in WHY of all division and agent work.      |
| 4     | Principle - Inbound Priority               | Required before Division - 1:1 and Playbook - Inbound Triage.                   |
| 5     | Principle - Human Approval Gate            | Required before any playbook that involves AI-drafted communications.           |
| 6     | Principle - Strategy Before Factory        | Documents the sequencing constraint; relevant now, before factory build begins. |

### Phase 2: Standards

| Order | Card                                    | Rationale                                                              |
| ----- | --------------------------------------- | ---------------------------------------------------------------------- |
| 7     | Standard - Communications Privacy Rules | Most broadly constraining. Build before any Division or agent updates. |
| 8     | Standard - Relationship Health Criteria | Constrains 1:1 system and division card.                               |
| 9     | Standard - Content Type Definitions     | Constrains 1:Many system, division card, and playbooks.                |
| 10    | Standard - Editorial Cadence Rules      | Constrains editorial calendar system.                                  |

### Phase 3: Systems

| Order | Card                                  | Rationale                                                                  |
| ----- | ------------------------------------- | -------------------------------------------------------------------------- |
| 11    | System - Contact Classification       | Foundational for 1:1 division — governs how contacts are organized.        |
| 12    | System - Relationship Health Tracking | Depends on Standard - Relationship Health Criteria.                        |
| 13    | System - Content Production Pipeline  | Depends on Standard - Content Type Definitions.                            |
| 14    | System - Editorial Calendar           | Depends on all three division systems as inputs. Build last among systems. |

### Phase 4: Division Cards (if type approved)

| Order | Card                                   | Depends On                                     |
| ----- | -------------------------------------- | ---------------------------------------------- |
| 15    | Division - 1:1 Relationship Management | Standards 7–8, Systems 11–12, Principles 3–4   |
| 16    | Division - Groups                      | Standards 7, Principle 3                       |
| 17    | Division - 1:Many                      | Standards 7, 9, 10, Systems 13–14, Principle 3 |

### Phase 5: Playbooks (if type approved)

| Order | Card                              | Depends On                                                                                     |
| ----- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| 18    | Playbook - Inbound Triage         | Division - 1:1, Principle - Inbound Priority                                                   |
| 19    | Playbook - Content Briefing       | Division - 1:Many, Standard - Content Type Definitions                                         |
| 20    | Playbook - Group Event            | Division - Groups                                                                              |
| 21    | Playbook - Relationship Follow-Up | Division - 1:1, System - Relationship Health Tracking, Standard - Relationship Health Criteria |

### Phase 6: Channel Cards (if type approved and if not deferred)

Build after Division - 1:Many is stable. Low priority — defer until the factory is operational.

---

## What Was Removed from the Previous Inventory and Why

| Removed Card                       | Why Removed                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone - Socialization Hub           | Product navigation type. Communications sections are documentation domains, not navigable workspaces.                                                                                    |
| Room - Contact Room                | Product navigation type. Same problem.                                                                                                                                                   |
| Room - Group Room                  | Product navigation type. Same problem.                                                                                                                                                   |
| Room - Content Studio              | Product navigation type. Same problem.                                                                                                                                                   |
| Room - Outbox                      | Product navigation type. Same problem.                                                                                                                                                   |
| Room - Communications Dashboard    | Product navigation type. Same problem.                                                                                                                                                   |
| Structure - Contact List           | Spatial UI canvas type. Doesn't apply to operations documentation.                                                                                                                       |
| Structure - Content Kanban         | Spatial UI canvas type. Same problem.                                                                                                                                                    |
| Artifact - Contact Note            | Content object created in the app. No app feature exists yet for this. Do not document phantom features.                                                                                 |
| Artifact - Content Piece           | Same — phantom feature.                                                                                                                                                                  |
| Artifact - Group Brief             | Same — phantom feature.                                                                                                                                                                  |
| Artifact - Editorial Calendar View | Same — phantom feature.                                                                                                                                                                  |
| Primitive - Contact                | App data entity. Not yet in the app schema. Do not pre-emptively create Primitive cards for unbuilt features.                                                                            |
| Primitive - Content Item           | Same — phantom primitive.                                                                                                                                                                |
| Capability - Relationship Capture  | App workflow. No app feature exists.                                                                                                                                                     |
| Capability - Content Briefing      | App workflow. Replaced by Playbook - Content Briefing (operations documentation).                                                                                                        |
| Capability - Content Publishing    | App workflow. No app feature exists.                                                                                                                                                     |
| Capability - Group Facilitation    | App workflow. No app feature exists.                                                                                                                                                     |
| Capability - Editorial Planning    | App workflow. No app feature exists.                                                                                                                                                     |
| Capability - Communications Review | App workflow. No app feature exists.                                                                                                                                                     |
| Agent - Quill                      | New agent card for a role that the source does not establish as a separate agent. The source lists three agents: Jarvis, Marvin, Conan. Creating new agent cards goes beyond the source. |
| Agent - Keeper                     | Same — not established in source. Keeper's described role (relationship memory) is an extension of Jarvis's counselor function and Conan's analytics function, not a new agent.          |
| Prompt - Quill                     | Depends on Agent - Quill, which is removed.                                                                                                                                              |
| Prompt - Keeper                    | Depends on Agent - Keeper, which is removed.                                                                                                                                             |

**Note on Quill and Keeper:** The source is explicit about three agents. Creating new agents is an architectural decision that requires human approval, not an inventory inference. If the founder decides a content-specialist agent and a relationship-memory agent are warranted, they should be proposed as a HUMAN JUDGMENT NEEDED item, built as new agent cards only after approval, with Prompt cards following. This inventory does not pre-approve new agents from implications in the source.

---

## Summary

| Category            | Previous Count | Corrected Count | Delta                                                      |
| ------------------- | -------------- | --------------- | ---------------------------------------------------------- |
| Strategy            | 1              | 2               | +1                                                         |
| Principle           | 3              | 4               | +1                                                         |
| Standard            | 4              | 4               | 0                                                          |
| System              | 5              | 4               | -1 (Group Event Lifecycle absorbed into Division - Groups) |
| Division (new type) | 0              | 3               | +3                                                         |
| Playbook (new type) | 0              | 4               | +4                                                         |
| Channel (new type)  | 0              | 3 (deferred)    | deferred                                                   |
| Zone                | 1              | 0               | -1                                                         |
| Room                | 5              | 0               | -5                                                         |
| Structure           | 2              | 0               | -2                                                         |
| Artifact            | 4              | 0               | -4                                                         |
| Capability          | 6              | 0               | -6                                                         |
| Primitive           | 2              | 0               | -2                                                         |
| Agent (new)         | 2              | 0               | -2                                                         |
| Prompt              | 2              | 0               | -2                                                         |
| **New cards total** | **36**         | **21**          | **-15**                                                    |

**Decisions blocking build start:** 3 (Division type, Playbook type, Channel type/granularity)

## Flags

**HUMAN JUDGMENT NEEDED:**

1. **Approve Division as a new type** — Three cards (Division - 1:1, Division - Groups, Division - 1:Many) need this type to exist. Alternative: collapse division operating models into a single Standard or into the Strategy - Socialization as Infrastructure HOW section. Recommend: approve Division as a distinct type — the three divisions are the structural load-bearing concept of this entire section.

2. **Approve Playbook as a new type** — Four cards need this type. Alternative: write playbooks as Standards with a procedural HOW section. Recommend: approve Playbook as a type — it is fundamentally different from a Standard (it's a repeatable procedure, not a testable rule).

3. **Channel type decision** — Can defer. Start by building division detail into Division - 1:Many. Add Channel cards as standalone if the content grows unwieldy.

4. **Additional agents** — The communications division now has its own agents: Arvin (strategic advisor), Gretta (PM/whip, not yet built), Kelvin (analyst, not yet built). If additional specialist agents are needed, propose and build after approval.

5. **Group Event Lifecycle system** — The previous inventory had this as System - Group Event Lifecycle. This inventory absorbs event lifecycle into Division - Groups's HOW section. If group events are complex enough to warrant a standalone state-machine system, restore the card. HUMAN JUDGMENT: is the group event lifecycle as mechanically complex as the product's project lifecycle?
