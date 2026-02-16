# Room - Roster Room

## WHAT: Definition

Marvin's delegation space — where builders assign Attendants to delegatable tasks, configure human delegation relationships, and optimize team composition for the week's work.

## WHERE: Ecosystem

- Zone: [[Zone - Strategy Studio]] — planning workspace
- Agent: [[Agent - Marvin]] — operational partner
- Adjacent:
  - [[Room - Council Chamber]] — strategic conversation
  - [[Room - Sorting Room]] — priority selection
  - [[Room - Drafting Room]] — project creation
- Implements: [[Strategy - AI as Teammates]] — team coordination
- Implements: [[Principle - Compound Capability]] — delegation patterns improve
- Assigns: Attendants — AI agents for task execution
- Configures: Human delegation — family, colleagues, contractors

## WHY: Rationale

- Strategy: [[Strategy - AI as Teammates]] — builders have a team
- Principle: [[Principle - Compound Capability]] — team effectiveness compounds over time
- Driver: Builders shouldn't do everything alone. The Roster Room is where delegation happens.
- Constraints: Delegation is always builder-initiated or builder-approved. Marvin recommends, the builder assigns. No autonomous task handoff. Human delegation tracking is reminder-based, not enforcement-based.

## WHEN: Timeline

**Build phase:** Future
**Implementation status:** Not started
**Reality note (2026-02-12):** No Roster Room exists in the codebase. Marvin will manage this space when built. Attendant tables (`workers`, `workerProjects`, `workerCategories`) exist in the schema as legacy scaffolding but are not used. Deferred until core advisor agents are stable.

Future feature. Attendant architecture and delegation framework are in design phase. Roster Room depends on mature Agent coordination (Level 4+ on AI as Teammates ladder) and standing job/permission definitions (Level 3).

## HOW: Implementation

**Attendant assignment flow:**

1. Builder opens Roster Room from Strategy Studio
2. Marvin presents delegatable tasks from the week's Work at Hand and Bronze stack
3. Builder reviews available Attendants and their capability profiles
4. Builder assigns Attendants to tasks, sets expectations and check-in cadence
5. Marvin tracks execution and surfaces results

**Human delegation:**

- Configure recurring delegation relationships (family members, colleagues, contractors)
- Track who does what and follow-up status
- Set accountability expectations and reminder cadence
- Historical delegation patterns inform future recommendations

**Marvin's role:**

- Recommend Attendant-to-task matches based on capability and past performance
- Surface delegation opportunities builders might miss ("this task looks similar to one you delegated last month")
- Track delegation patterns and improve recommendations over time
- Escalate when delegated work stalls or needs attention

**Output:** Tasks assigned to Attendants or humans, with accountability configured and check-in schedule set.

### Examples

- Marvin identifies 3 Bronze tasks that match past delegation patterns → presents: "These look like tasks you've delegated before — want to assign them?" → builder assigns 2 to Attendants, keeps 1 → sets Wednesday check-in → Marvin tracks execution and surfaces results on schedule.
- Builder configures recurring human delegation: "My assistant handles invoicing every Friday" → Marvin tracks this relationship → Friday passes without completion flag → Marvin surfaces follow-up: "Invoice task from Friday — want to check in?" → accountability without micromanagement.

### Anti-Examples

- **Auto-delegating tasks without builder approval** — delegation is a builder decision, not an AI optimization. Marvin suggests candidates and matches, but the builder assigns. Autonomous task delegation violates builder agency.
- **Presenting a catalog of all Attendant capabilities unprompted** — delegation opportunities should be surfaced in context (tasks that match attendant skills), not as a capabilities brochure. Show what's relevant, not everything that's possible.
