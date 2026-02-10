# System - Four-Stage Creation

## WHAT: Definition

The progressive project development process that separates four cognitive modes: capture (Stage 1), definition (Stage 2), planning (Stage 3), and evaluation (Stage 4). Each stage requires different thinking; separating them reduces decision fatigue.

## WHERE: Scope

- Zone: [[Room - Drafting Room]] — creation happens here with [[Agent - Marvin]]
- Implements: [[Principle - Earn Don't Interrogate]] — progressive investment
- Implements: [[Principle - Plans Are Hypotheses]] — stages allow iteration
- Feeds: [[System - Pipeline Architecture]] — stages determine queue placement
- Governs: [[Capability - Purpose Assignment]] — happens in Stage 2
- Governs: [[Standard - Image Evolution]] — visual stages map to creation stages

## WHY: Rationale

- Strategy: [[Strategy - Superior Process]] — structured process for project development
- Driver: Cognitive mode separation prevents overload. Brainstorming and critiquing at the same time degrades both.
- Decision: Four stages, not three or five, because the four cognitive modes (divergent capture, convergent definition, generative planning, evaluative comparison) are distinct enough to warrant separation.

## WHEN: Timeline

**Build phase:** MVP
**Implementation status:** Implemented
**Reality note (2026-02-10):** Four-Stage Creation fully operational. `Stage1Form.tsx` (Identifying), `Stage2Form.tsx` (Scoping), `Stage3Form.tsx` (Detailing) plus `StageWizard.tsx`. Marvin guides through all stages via CHORUS_TAG navigation. Stage 4 happens in the Sorting Room. `ProjectLifecycleState` tracks `stage: 1-4`.

## HOW: Mechanics

### State

- **Current stage**: One of Identified (1) / Scoped (2) / Drafted (3) / Prioritized (4) per project
- **Stage data captured**: Accumulates as the project progresses (title, description, category, purpose, objectives, priority attributes, task list, queue position)
- **Queue membership**: Planning Queue (Stages 1-3) or Priority Queue (Stage 4)

### Transitions

| From | Trigger | To | Side Effects |
|------|---------|-----|--------------|
| No project | Director initiates creation with Marvin | Stage 1: Identified | Project created with title, description, Life Category; enters Planning Queue |
| Stage 1: Identified | Director resumes with Marvin, provides purpose/objectives/priority data | Stage 2: Scoped | Stream assignment (Gold/Silver/Bronze), success criteria, priority attributes recorded |
| Stage 2: Scoped | Director works with Marvin to generate task list or system config | Stage 3: Drafted | Complete task list or system configuration attached |
| Stage 3: Drafted | Director reviews Priority Queue placement with Marvin | Stage 4: Prioritized | Project exits Planning Queue, enters Priority Queue with priority score |
| Any stage | Director abandons project | Archived | Project removed from active queues |

### Processing Logic

**Stage 1: Identified** — Capture before it evaporates

- Marvin asks: Title, brief description, Life Category
- Result: Project created, enters Planning Queue

**Stage 2: Scoped** — Define success and capture priority data

- Marvin asks: Purpose (-> stream), Objectives (1-3), Priority attributes (U/I/E), Deadline
- For system-building Silver: "Will this create something that runs continuously?"
- Result: Stream assignment, success criteria, priority data

**Stage 3: Drafted** — Create complete task list or configure system

- Standard projects: Generate and iterate task list
- System-building Silver: Configure pattern, controls, outputs, delegation
- Result: Complete task list OR system configuration

**Stage 4: Prioritized** — Decide where this ranks

- Marvin shows Priority Queue with scores
- Director places project within stream
- Result: Project exits Planning Queue -> enters Priority Queue

### Examples

- A director has a flash of inspiration about learning Spanish. They open the Drafting Room and tell Marvin "I want to learn conversational Spanish." Marvin captures the title and assigns Life Category = Growth. The project is now Stage 1: Identified, sitting in the Planning Queue. No pressure to define objectives or tasks yet — the idea is safely captured. Two days later, the director returns and Marvin walks them through Stage 2, discovering this is a Gold project about "Moving forward."
- A director has a Stage 3: Drafted project "Automate bill payments" (Silver stream). They return to Marvin, who shows the Priority Queue with current Silver candidates ranked by leverage score. The director sees this project scores higher than "Organize digital photos" but lower than "Set up meal planning system." They confirm placement and the project moves to Stage 4: Prioritized, now living in the Priority Queue ready for selection as Work at Hand.

### Anti-Examples

- **Requiring all four stages in a single session** — the entire point of stage separation is that directors can capture an idea in 30 seconds (Stage 1) and return later for definition. Forcing a director to provide objectives, tasks, and priority ranking in one sitting defeats the cognitive-mode-separation design.
- **Allowing a project to skip from Stage 1 directly to Stage 4** — each stage captures distinct data that downstream systems depend on. A project without purpose assignment (Stage 2) cannot be scored for priority. A project without a task list (Stage 3) cannot be executed. Stages must be completed in order.
