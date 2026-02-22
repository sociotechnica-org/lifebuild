# Automation Strategy Conversation — "Whose Job Is It Anyway?"

> **Source document for Context Library atomization.** This captures the design conversation from February 17, 2026 about organizing factory and library work between humans and AI agents. Cards in the library should be atomized from this document — do not link back here from card bodies.
>
> **Snapshot date:** 2026-02-17
> **Participants:** Danvers + Claude (Opus 4.6)
> **Provenance index:** TBD — cards will be created as the project progresses

---

## Origin

The conversation started from a request to write an explainer document in the style of the existing "Software Factory" interactive presentation. The goal was to tell the story of what an automated or semi-automated library and factory team would look like — how they keep things updated without letting things fall through the cracks.

The core problem: when working with AI agents in Conductor, it's hard to tell when an agent is vibing (back-and-forth creative problem-solving) versus running a skill (executing a defined procedure). For general troubleshooting this doesn't matter, but for the factory and library workflow, the distinction is critical. Some work should be more like software — running set plays — and the question is which parts.

---

## Key Reframings

### From agent-centric to task-centric

The initial framing organized work by agent: "George does X, Conan does Y, Sam does Z." This was reorganized into two domains — **library jobs** and **factory jobs** — because the tasks, not the agents, are the primary unit of work. Agents are assigned to tasks based on what the task requires, not the other way around.

### From role lists to workflow sequences

Conan and Sam's library work was reorganized from flat job lists into five workflow sequences, because their jobs interleave — Conan evaluates, Sam executes, Conan verifies. The workflows are:

1. **Building new library content** (Source Assessment → Inventory → Create upstream cards → Spot-Check → Create product cards → Self-Check)
2. **Quality cycle** (Grade → Diagnose → Recommend → Fix → Self-Check → Review)
3. **Structural maintenance** (Audit → Surgery Plan → Surgery Execute → Downstream Sync)
4. **Ongoing monitoring** (Health Check → triggers other workflows)
5. **Serving builders** (Context Assembly, Release Planning)

### Detect-and-direct vs. execute

George and Conan are primarily about **detecting and directing** — reading instruments, evaluating quality, planning work, telling others where to go. Sam is almost entirely about **executing** — building and fixing cards per instructions. This maps to different cost profiles: detection/direction requires expensive models (judgment, evaluation); execution requires affordable models (following procedures with clear inputs).

### Routine maintenance vs. event-driven actions

Each agent's work splits into two categories:

- **Routine maintenance**: Things that happen on a cadence to prevent drift. George's status reports and shift plans. Conan's grades and health checks. Sam's self-checks.
- **Event-driven actions**: Things triggered by specific events. A decision resolves → George propagates. A builder needs context → Conan assembles. A card scores poorly → Conan diagnoses, Sam fixes.

### Gates prevent bad work from flowing downstream

The workflows have explicit gates — points where work cannot proceed without verification:

- Source Assessment gates Inventory (don't plan cards from bad sources)
- Spot-Check gates the product layer build (don't build dependent cards on shaky foundations)
- Self-Check gates handoff to Conan (don't submit unvalidated work for grading)
- Andon gate in Decision Resolution (don't propagate ambiguous decisions)

### Safety nets catch things that fall through cracks

Three mechanisms prevent silent failures:

- **George's Step 0 scans**: At the start of every status report and shift plan, George scans for decision resolutions that were closed but never propagated. This catches the "someone closed the issue but forgot to tell the factory" failure mode.
- **Conan's Downstream Sync**: Auto-triggers after any maintenance job that changes library structure. Checks and fixes all meta-files that reference changed cards.
- **Sam's mandatory Self-Check**: Sam cannot hand off work without running the self-check procedure. This is a hard gate, not optional.

---

## Library Tasks

All tasks involved in maintaining the Context Library.

| Task | What happens | AI seniority | Human seniority |
|------|-------------|-------------|----------------|
| **Source Assessment** | Judge whether source material is good enough to build from | High — quality judgment | None |
| **Inventory** | Plan what cards should exist, in what order | High — architectural understanding | Low — approve the manifest |
| **Create Cards** | Write cards from inventory + source material | Low — following a defined procedure with clear inputs | None |
| **Spot-Check** | Verify upstream cards before dependents get built | High — quality gate | None |
| **Self-Check** | Run checklist on finished cards | Low — mechanical checklist | None |
| **Grade** | Score cards on 5 dimensions with rubrics | High — evaluative judgment | None |
| **Diagnose** | Trace root causes of quality issues, calculate blast radius | High — analytical reasoning | None |
| **Recommend** | Prioritize fixes by severity/effort/blast radius | High — prioritization judgment | Low — approve the priority order |
| **Fix Cards** | Update cards per recommendations | Low — prescribed fixes, clear inputs | None |
| **Review** | Re-grade after fixes, accept or send back | High — evaluative judgment | None |
| **Audit** | Verify typing, atomicity, conformance | Medium — decision tree with some judgment | None |
| **Surgery Plan** | Design multi-phase structural fix plans | High — architectural reasoning | Low — approve the plan |
| **Surgery Execute** | Build replacement cards, update links per plan | Low — following the plan | None |
| **Downstream Sync** | Update meta-files after structural changes | Low — mechanical reference checking | None |
| **Health Check** | Full 6-phase library assessment | High — comprehensive evaluation | Low — review findings |
| **Context Assembly** | Pull the right cards for a build task | High — understanding what a builder needs | None |
| **Release Planning** | Write release cards with propagation maps | High — strategic + structural | High — product vision input |

---

## Factory Tasks

All tasks involved in moving work through the factory stations.

| Task | What happens | AI seniority | Human seniority |
|------|-------------|-------------|----------------|
| **Status Report** | Read dashboard, rate metrics, recommend actions | Low — read instruments, apply known rubrics | Low — glance at the report |
| **Shift Plan** | Prioritize today's work, assign to people | Medium — priority algorithm with some judgment | Low — approve or adjust |
| **Triage** | Diagnose why the factory is stuck | High — root cause analysis across systems | Medium — validate diagnosis, agree on fix |
| **Decision Resolution** | Propagate a closed decision through GitHub + library | Medium — 10-step procedure, but mostly mechanical once decision is clear | Low — verify the cascade makes sense |
| **Build** (MAKE) | Implement a feature with context briefing | Medium-High — depends on complexity | None to High — depends on review needs |
| **Shape** (SHAPE) | Prototype iteratively to discover the right approach | High — creative problem-solving | High — taste, direction, feedback |
| **PR Review** | Review code for quality | Medium — pattern matching against known standards | Low — final approve |
| **Decide** (DECIDE) | Resolve open questions, make product calls | None | High — this is the human's core job |

---

## Four Cost-Tier Bundles

### Affordable AI bundle (the "shop floor")

Tasks: Create Cards, Fix Cards, Self-Check, Surgery Execute, Downstream Sync, Status Report, Decision Resolution (mechanical steps).

**Shared pattern:** Clear inputs, defined procedure, no judgment calls. An agent running these is executing a play, not vibing. These are candidates for full automation — triggered by events, running defined procedures, producing predictable outputs.

### Expensive AI bundle (the "senior engineer")

Tasks: Grade, Diagnose, Recommend, Context Assembly, Health Check, Source Assessment, Inventory, Release Planning, Surgery Planning, Triage, Shape.

**Shared pattern:** Evaluation, prioritization, or novel synthesis. The agent needs to reason about quality, relevance, or strategy. These benefit from back-and-forth with humans and from the most capable models.

### Affordable human bundle (the "shop mechanic")

Tasks: Approve manifests, approve priority orders, approve surgery plans, glance at status reports, approve shift plans, verify propagation cascades, spot-check PR reviews.

**Shared pattern:** Approve/reject AI-prepared work. Low decision load — the AI did the analysis, the human confirms it passes the smell test.

### Expensive human bundle (the "lead architect")

Tasks: Make product decisions (DECIDE), resolve ambiguity when the Andon gate fires, shape prototypes (SHAPE), provide product vision for Release Planning, validate triage diagnoses for systemic issues, strategic library direction.

**Shared pattern:** Taste, vision, ambiguity resolution. These are the things no model can substitute for because they require knowing what you *want*.

---

## The Automation Spectrum

The conversation identified a spectrum from fully manual to fully automated, with important distinctions:

| Level | Description | Example |
|-------|------------|---------|
| **Agent vibing** | Back-and-forth creative problem-solving. No predefined steps. | Shaping a prototype, debugging a novel issue |
| **Agent running a skill** | Executing a defined procedure (a "skill" file) but with agent judgment at decision points | Conan grading a card — follows rubrics but interprets edge cases |
| **Tool** | A callable function with defined inputs/outputs. Agent invokes it but doesn't improvise the steps | Running the factory dashboard script, checking board field IDs |
| **Software** | Code that runs on a trigger with no agent involved. Fully automated | Decision closes → GitHub webhook → propagation cascade runs → cards update |

The key insight: **the affordable AI bundle is almost entirely automatable as software today.** Those tasks could run on events — decision closes → propagation fires → cards get updated → self-check runs → downstream sync triggers. No human in the loop until the end. The expensive AI bundle is where agents earn their keep, and the expensive human bundle is where humans earn theirs.

---

## What This Means for the Project

The next steps identified:

1. **Map current state** — Document exactly how each task is performed today (manual, semi-auto, etc.)
2. **Define automation boundaries** — For each task, decide: software (code) vs tool (callable) vs skill (procedure) vs agent vibe
3. **Define skill needs** — What capabilities do humans and AI need for each remaining non-automated task?
4. **Bundle responsibilities** — Group tasks into cost-effective bundles, name the roles, map to specific agents/humans
5. **Write the explainer** — "Whose Job Is It Anyway?" interactive HTML explainer as an ice-breaker for the model
6. **Build the automation** — Actually implement the triggers, tools, and event flows

This document captures the thinking that precedes all of that work.
