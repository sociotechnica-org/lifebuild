# Job 4: Decision Resolution

**Purpose:** When a human resolves a decision (D-issue), propagate implications through the factory — update build issues, notify cascading decisions, produce library update checklists, and log provenance. This is the mechanism that converts a cleared human decision into machine-ready inputs.

As the companion podcast puts it: _"Clear the human work as fast as possible, so the machines can build."_ The closure event is the moment the human work is cleared — that's when the machines get their updated specs.

**Trigger:** Two paths, one primary and one safety net.

1. **Primary — `/george propagate` comment.** Human closes (or completes) a D-issue and adds a comment containing `/george propagate`. This is the explicit "go" signal. Clean, deliberate, works regardless of closed/open state or board column position.

2. **Safety net — Auto-scan at shift start.** Job 1 (Status Report) and Job 3 (Shift Plan) scan for recently-closed D-issues that lack a propagation log entry. If any are found, George flags them.

3. **Manual invocation.** "Run decision resolution on D5."

## Design Philosophy

**Two kinds of movement in the factory:**

- **Station movement** (cards move between DECIDE/PATCH/MAKE/SHAPE) — always a human action. AI never moves cards between stations. Mid-process work stays messy and cheap.
- **Finality propagation** (implications flow through the system) — triggered by closure events only. George reads the resolution, verifies clarity, then propagates.

This is the manufacturing ECO process adapted for the software factory: _"The engineering team revises the drawings, updates the bill of materials, and all downstream stations get the corrected spec."_

**Three principles:**

1. **Finality only.** No mid-SHAPE library updates. No partial propagation. The issue must be closed.
2. **Clarity before speed.** If the resolution is ambiguous, stop and ask. Don't pass ambiguity forward — the Andon principle applied to propagation.
3. **Split execution.** George does GitHub updates directly (factory floor bookkeeping). Library card and release card updates go to Conan + Sam as exact checklists.

## Procedure

### Step 0: Find propagation requests

If invoked via scan (not direct invocation), search for unprocessed requests:

```bash
# Find issues with /george propagate comments
gh search issues --repo sociotechnica-org/lifebuild "george propagate" --json number,title,state

# Also check for recently-closed D-issues
gh issue list -R sociotechnica-org/lifebuild --state closed --search "D" --json number,title,closedAt
```

Cross-reference against `docs/context-library/provenance-log.jsonl` — look for entries with `"task_type": "resolution"` matching the issue number. Check the `propagation_status` field:

- **No entry at all** → Decision was never propagated. Run full Mode 4.
- **`"propagation_status": "started"`** → Propagation was interrupted. Resume from where it left off (check which steps completed).
- **`"propagation_status": "complete"`** → Already propagated. Skip.

If invoked directly ("run decision resolution on D5"), skip to Step 1 with the specified issue.

### Step 1: Verify clarity (the Andon gate)

```bash
gh issue view <number> -R sociotechnica-org/lifebuild --comments
```

Look for a Resolution section, a closing comment that states the chosen option, or a `/george propagate` comment with the choice embedded. George needs:

- **Which option was chosen** (explicit, not implied)
- **Brief rationale** (even one sentence)

**If the resolution is ambiguous:** STOP. Do not propagate. Ask the human:

> _"D[N] was closed but I can't tell which option was chosen. What was the call? I need the chosen option and a one-sentence rationale before I can propagate."_

**If the resolution is clear but has no formal Resolution section:** George adds one as a comment:

```bash
gh issue comment <number> -R sociotechnica-org/lifebuild --body "## Resolution

- **Decided:** [date]
- **Chosen:** Option [X] — [name]
- **Rationale:** [from human's closing comment or /george propagate text]
- **Propagated:** [date]"
```

### Step 1.5: Log provenance (anchor entry)

**Log first, propagate second.** Write the provenance entry immediately after verifying clarity — before any downstream updates. This creates the anchor that the safety net checks against. If propagation is interrupted mid-way, the log entry means the safety net can detect "partially propagated" resolutions and resume from where they left off.

Append an initial resolution entry to `docs/context-library/provenance-log.jsonl`:

```json
{
  "timestamp": "[ISO-8601]",
  "session_id": "[uuid-v4]",
  "agent": "george",
  "task": {
    "description": "Decision resolution: D[N] - [title]",
    "target_type": "Decision",
    "task_type": "resolution"
  },
  "resolution": {
    "decision_id": "D[N]",
    "issue_number": "[number]",
    "chosen_option": "[option name]",
    "rationale": "[brief]",
    "propagation_map_present": null,
    "library_cards_affected": [],
    "issues_unblocked": [],
    "issues_moved_to_ready": [],
    "cascading_decisions_notified": [],
    "scope_changes": {
      "new_work": [],
      "eliminated_work": []
    },
    "propagation_status": "started"
  }
}
```

The `"propagation_status": "started"` field distinguishes this anchor entry from a completed propagation. At Step 10, update the entry in-place (or append a completion entry) with the full propagation details and `"propagation_status": "complete"`.

**Why this matters:** The safety net scan (Step 0) checks the log for resolution entries. Without this anchor, a partially-propagated decision looks identical to an unpropagated one. With it, the scan can distinguish "never started" from "started but incomplete" and resume accordingly.

### Step 2: Read the Propagation Map

Check if the D-issue body has a `## Propagation Map` section.

**If present:** Use it. The signal paths are pre-wired. Read the chosen option's column from each table.

**If missing (fallback):** Reconstruct from available information:

1. Read the "Unblocks:" section in the D-issue for prose links
2. Read the release card (`docs/context-library/releases/Release - The Campfire.md`) for this decision's context in BUILD TRACKS and DECISION QUEUE
3. Search for the D-number across all open issues:
   ```bash
   gh issue list -R sociotechnica-org/lifebuild --state open --search "D[N]" --json number,title,body
   ```
4. Build a best-effort propagation list from what you find

Flag the output: `**Propagation Map: Reconstructed** — built from prose references. May be incomplete. Recommend adding Propagation Maps to remaining open D-issues.`

### Step 3: Update GitHub build issues (George executes directly)

For each issue in "Build Issues Unblocked" (from the Propagation Map or reconstructed list):

1. **Read the current issue:**

   ```bash
   gh issue view <number> -R sociotechnica-org/lifebuild
   ```

2. **Remove the blocker — two places:**

   **a) Remove the native GitHub blocker relationship (source of truth):**

   ```bash
   # Get node IDs
   ISSUE_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<number> --jq '.node_id')
   BLOCKER_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<D-number> --jq '.node_id')

   # Remove the relationship
   gh api graphql -f query="mutation { removeBlockedBy(input: { issueId: \"$ISSUE_ID\", blockingIssueId: \"$BLOCKER_ID\" }) { issue { number } } }"
   ```

   **b) Strike through the prose in the "Blocked by" section:** Edit the issue body to strike through the D[N] line and add ✅ Closed with a brief resolution note. This keeps the human-readable history.

3. **Add a decision context note** as a comment:

   ```bash
   gh issue comment <number> -R sociotechnica-org/lifebuild --body "> **D[N] resolved ([date]):** [one-sentence summary of chosen option and what it means for this build track]"
   ```

4. **Check remaining blockers.** Query native relationships to see if any active blockers remain:

   ```bash
   gh api graphql -f query='query { repository(owner: "sociotechnica-org", name: "lifebuild") { issue(number: <number>) { blockedBy(first: 10) { nodes { number title state } } } } }'
   ```

   If zero open blockers remain, move from Blocked to Ready on the project board. Use the board field reference (`.claude/skills/george/board-fields.md`) for field IDs and commands:

   ```bash
   # Get the project item ID
   ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == <issue-number>) | .id')

   # Set Status → Ready
   gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9sqAQ --single-select-option-id 27164c6d

   # Set Flow State → Queued
   gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id 5bbc4dfb
   ```

   **Always update both Status and Flow State together.** See board-fields.md for the full semantics.

5. **Flag for context briefing assembly.** Any newly-Ready MAKE item needs its context briefing verified before building starts — the "incoming component quality verification" from the manufacturing checklist. Note this in the output.

#### Adding blockers (when new blockers are discovered)

When a new blocker is identified during propagation or triage:

```bash
# Get node IDs
ISSUE_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<blocked-number> --jq '.node_id')
BLOCKER_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<blocker-number> --jq '.node_id')

# Add the relationship
gh api graphql -f query="mutation { addBlockedBy(input: { issueId: \"$ISSUE_ID\", blockingIssueId: \"$BLOCKER_ID\" }) { issue { number } blockingIssue { number } } }"
```

Also add a prose entry in the issue body's "Blocked by" section for human context.

### Step 4: Notify cascading decisions (George executes directly)

For each entry in "Cascading Decisions" (from the Propagation Map):

1. **Comment on the downstream D-issue** explaining how the upstream resolution affects its framing:

   ```bash
   gh issue comment <number> -R sociotechnica-org/lifebuild --body "**Upstream update:** D[N] resolved — [chosen option]. This affects D[M] because: [how the framing, options, or recommendation changes]."
   ```

2. **If the downstream D-issue was Blocked** (waiting on this decision), move it to Ready on the project board. Update both fields:

   ```bash
   ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == <issue-number>) | .id')

   # Set Status → Ready
   gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9sqAQ --single-select-option-id 27164c6d

   # Set Flow State → Queued
   gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id 5bbc4dfb
   ```

3. **If the resolution changes the downstream decision's option list or recommendation,** note that explicitly in the comment so the human re-evaluates before deciding.

### Step 5: Check the fork — MAKE or SHAPE?

For each newly-unblocked build item, check: does this item have clear specs now, or does it need discovery first?

- Read the issue's Mode field. If `MAKE` → specs are clear, ready to build.
- If `SHAPE` or `PROTOTYPE` → needs iteration before MAKE.
- If the Propagation Map or issue description mentions "feel-testing," "voice iteration," "prototype first," or similar → SHAPE path.

Note the routing in the output so the shift plan knows where each item goes.

### Step 6: Move D-issue to Done on project board

GitHub doesn't automatically move closed issues to "Done" on the project board. George does this as part of propagation. Update both Status and Flow State:

```bash
# Get the project item ID
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == <D-number>) | .id')

# Set Status → Done
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9sqAQ --single-select-option-id ea38e33a

# Set Flow State → Shipped
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id 03f954dc
```

See `.claude/skills/george/board-fields.md` for the full field reference and all option IDs.

### Step 7: Produce library update checklist (for Conan + Sam)

For each card in "Library Cards Affected" (from the Propagation Map), write the **exact** WHEN section updates. Don't leave interpretation to Conan or Sam — give them copy-paste text.

For each affected card:

1. **History entry** (reverse-chronological, newest first):

   ```
   > **[YYYY-MM-DD] — D[N]: [Decision Title]**
   > [What was decided. What it means for this card. What it replaced or changed.]
   ```

2. **Implications update** — if the decision creates or resolves a gap between the card's vision (WHAT/HOW) and reality:
   - Gap created: add or update the Implications subsection
   - Gap resolved: remove or update the relevant implication

3. **Reality update** — if the decision changes current-state understanding:
   - Update the Reality subsection with the new ground truth
   - Update the Reality date

### Step 8: Produce release card update checklist

For `docs/context-library/releases/Release - The Campfire.md` (or the relevant release):

- Mark the decision as resolved in the DECISION QUEUE section, noting the chosen option and date
- Update the BUILD TRACKS status table if tracks moved from BLOCKED to MAKE or SHAPE
- Update WHAT'S EXPLICITLY DEFERRED if the decision eliminated scope
- If the decision was a "Quick Call," check if all Quick Calls are now resolved (this may unlock a milestone)

### Step 9: Handle scope changes

Read the "Scope Changes" table from the Propagation Map for the chosen option.

**New work identified:**

- Present each item for human approval. Don't create issues without confirmation.
- Include a suggested title, mode (MAKE/SHAPE/DECIDE), and which existing items it relates to.

**Eliminated work:**

- Recommend closing the issue with a comment explaining why: `"Eliminated by D[N] resolution: [rationale]"`
- Present for human confirmation before closing.

### Step 10: Finalize provenance

Update the anchor entry logged at Step 1.5 (or append a completion entry) with the full propagation details:

```json
{
  "timestamp": "[ISO-8601]",
  "session_id": "[same session_id as Step 1.5]",
  "agent": "george",
  "task": {
    "description": "Decision resolution: D[N] - [title]",
    "target_type": "Decision",
    "task_type": "resolution"
  },
  "resolution": {
    "decision_id": "D[N]",
    "issue_number": "[number]",
    "chosen_option": "[option name]",
    "rationale": "[brief]",
    "propagation_map_present": true,
    "library_cards_affected": ["Card Name"],
    "issues_unblocked": [596, 598],
    "issues_moved_to_ready": [596],
    "cascading_decisions_notified": ["D6"],
    "scope_changes": {
      "new_work": [],
      "eliminated_work": []
    },
    "propagation_status": "complete"
  }
}
```

**Note:** The anchor entry at Step 1.5 has `"propagation_status": "started"`. This final entry has `"propagation_status": "complete"`. The safety net scan (Step 0) uses this to distinguish unpropagated, partially propagated, and fully propagated decisions.

## Output Format

```
# Decision Resolution: D[N] — [Title]

**Decided:** [date]
**Chosen:** [Option name]
**Rationale:** [one sentence]
**Propagation Map:** Present | Reconstructed

---

## Done (GitHub updates executed)

### Build Issues Updated

| Issue | Action Taken |
|-------|-------------|
| #[n] [title] | Removed D[N] blocker; added decision context |
| #[n] [title] | Removed D[N] blocker; moved Blocked → Ready; needs context briefing |

### Cascading Decisions Notified

| Decision | Comment |
|----------|---------|
| D[N] (#[n]) | [Summary of how upstream resolution affects framing] |

### Board Status

- D[N] moved to Done on project board
- [n] items moved from Blocked → Ready

---

## Checklist: Library Cards (for Conan + Sam)

### [Card Name]

**File:** `docs/context-library/[path]`

- [ ] **History entry:**
  > **[date] — D[N]: [title]**
  > [Exact text]

- [ ] **Implications:** [Exact change to make]

- [ ] **Reality:** [Exact change to make, if applicable]

### [Next card...]

---

## Checklist: Release Card

**File:** `docs/context-library/releases/Release - The Campfire.md`

- [ ] Mark D[N] as resolved: "[Option name]" ([date])
- [ ] Update BUILD TRACKS: [specific changes]
- [ ] Update DEFERRED: [if applicable]

---

## Scope Changes (needs human approval)

| Change | Type | Recommended Action |
|--------|------|--------------------|
| [desc] | New work | Create issue: "[suggested title]" (Mode: MAKE/SHAPE) |
| [desc] | Eliminated | Close #[n] with rationale |

---

## Factory Impact

- **Items unblocked:** [n]
- **Items now Ready:** #[n] [title], #[n] [title]
- **Items needing context briefing:** #[n], #[n]
- **Routing:** #[n] → MAKE, #[n] → SHAPE first
- **Cascade:** D[N] now unblocked → [n] more items downstream
- **Remaining blocked items:** [n] (waiting on: D[x], D[y])
```

## Decision Trees

### What if the Propagation Map is missing?

Reconstruct from prose (Step 2 fallback). Flag as incomplete. After processing, recommend the human add Propagation Maps to remaining open D-issues — this is a one-time retrofit that pays for itself on every subsequent resolution.

### What if the resolution is partial?

Sometimes a decision resolves part of the question but defers another part (e.g., D5 resolves "hybrid structure" but defers which beats are scripted).

1. Propagate what's resolved — follow the Propagation Map for the settled portion
2. Note the unresolved portion in the output
3. Recommend creating a new D-issue for the remainder if it blocks downstream work
4. Don't close the original D-issue — it's not fully resolved

### What if multiple decisions resolve simultaneously?

Process in dependency order:

1. Map decision dependencies (D5 before D6)
2. Process upstream first
3. When processing downstream, incorporate upstream effects
4. Produce a combined Resolution output
5. Log separate provenance entries for each

### What if a cascading decision's framing changes significantly?

If the upstream resolution invalidates an option or changes the recommendation on a downstream D-issue:

1. Comment with the full impact
2. If the downstream D-issue had a Propagation Map, note which rows may be stale
3. Flag for human review: _"D6's Option B assumed scripted campfire (from D5). Since D5 chose hybrid, D6's Option B may need revision."_
4. Do NOT update the downstream D-issue body — that's the human's job at DECIDE

### What if the chosen option creates new decisions?

Some options open new questions. For example, "hybrid campfire" means someone must decide which beats are scripted.

1. List each new decision point in the Scope Changes section
2. Classify: Quick Call or Needs Thought?
3. Present for human approval
4. If approved, suggest the D-issue template (with Propagation Map) for the new decision
5. Link the new D-issue as a sub-issue or blocker as appropriate

## Principles

- **Complete before fast.** Every card and issue in the Propagation Map gets addressed. Skipping one creates invisible drift that becomes a defect downstream.
- **Exact text, not instructions.** The checklist gives copy-paste History entries and Implications rewrites. Conan and Sam execute, they don't interpret.
- **Log first, propagate second.** The provenance-log anchor entry (Step 1.5) is written before any downstream updates. This is the safety net's source of truth. A missing entry means "never started." A "started" entry means "check what's done." A "complete" entry means "fully propagated." When someone asks "why did this card change?" six weeks later, the answer is in the log.
- **Don't pass ambiguity forward.** If you're not sure what was decided, ask. Five minutes of clarification beats propagating the wrong thing through the system.
- **Board status is George's job.** Moving items to Done, Blocked → Ready — this is factory floor bookkeeping. George does it directly.
