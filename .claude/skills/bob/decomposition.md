# Decomposition

How to extract cards from source material. Use when Conan's inventory is sparse or when working directly from SOT.

## What Becomes a Card

### Step 1: Is this about WHY we build?

- Guiding philosophy (a bet) → **Strategy**
- Judgment guidance (a rule of thumb) → **Principle**
- Testable spec (concrete rules, values, thresholds) → **Standard**

### Step 2: Is this about WHAT exists that builders interact with?

**Navigate TO it?**

- Top-level workspace (header nav) → **Zone**
- Nested space within a zone → **Room**

**Persistent across zones?**

- Always-visible layer → **Overlay**

**Interact WITHIN a zone/room?**

- Spatial canvas/visual fabric → **Structure**
- Specific UI widget → **Component**
- Content object builders create/edit → **Artifact**
- Action/workflow builders perform → **Capability**

**Core data entity?**

- Foundational data type → **Primitive**

### Step 3: Is this invisible infrastructure?

- Mechanism with state, processes inputs → **System**

### Step 4: Is this an AI team member?

- The agent itself → **Agent**
- The agent's implementation → **Prompt**

### Step 5: Is this about the player experience over time?

- Repeating activity cycle → **Loop**
- Multi-phase progression arc → **Journey**
- Target emotional state → **Aesthetic**
- Emergent cross-system behavior → **Dynamic**

### Step 6: Is this temporal?

- Past insight → **Learning**
- Past choice → **Decision**
- Future vision → **Future**

### Common Confusions

| Question                                     | Answer A   | Answer B            |
| -------------------------------------------- | ---------- | ------------------- |
| Navigate TO it, or interact WITHIN it?       | Zone/Room  | Structure/Component |
| Builders say "I'm in X" or "I'm using X"?    | Zone/Room  | Structure/Component |
| Has runtime state? Processes inputs?         | System     | Standard            |
| Content builders create, or spatial fabric? | Artifact   | Structure           |
| Core data entity, or content object?         | Primitive  | Artifact            |
| Action/workflow, or spatial canvas?          | Capability | Structure           |

**When unsure:** Create the card, flag it, keep moving.

---

## System vs Standard

Most common confusion. Ask:

| Question                    | System    | Standard |
| --------------------------- | --------- | -------- |
| Has runtime state?          | Yes       | No       |
| Processes inputs?           | Yes       | No       |
| Things conform to it?       | Sometimes | Always   |
| Builder reads to implement? | Rarely    | Always   |
| Changes require code?       | Yes       | No       |

Examples:

- Processing Layer (computes calibration) → System
- Priority Score (defines formula) → Standard
- Visual Language (defines colors) → Standard
- Weekly Priority (manages state) → System

---

## Reading the SOT

### Structure Signals

| SOT Pattern                                 | Likely Card Type   |
| ------------------------------------------- | ------------------ |
| Top-level workspace/area                    | Zone               |
| Named space within a workspace              | Room               |
| Always-visible, cross-zone element          | Overlay            |
| Spatial canvas, grid, board layout          | Structure          |
| Specific UI widget, button, indicator       | Component          |
| Content object builders create/edit        | Artifact           |
| Action, workflow, process builders perform | Capability         |
| Core data entity (project, task)            | Primitive          |
| "The X System" or "X Architecture"          | System             |
| Mentioned across multiple sections          | System             |
| Table of values, thresholds, rules          | Standard           |
| "Must conform to" or "follows spec"         | Standard reference |
| AI personality, team member                 | Agent              |

### Extraction Pass

1. **First read:** Note every named thing. Don't judge.
2. **Second read:** Mark spaces builders navigate to (zone/room candidates).
3. **Third read:** Mark things within spaces (structure/component/artifact/capability candidates).
4. **Fourth read:** Mark cross-cutting mechanisms (system candidates).
5. **Fifth read:** Mark specification content (standard candidates).
6. **Compare to inventory:** Reconcile with Conan's list.

### Standard Extraction Signals

Source material contains:

- Hex codes, RGB values, specific colors
- Threshold numbers, score formulas
- State definitions with specific values
- Rules with testable criteria
- "Must be" / "should always" language

→ Extract as Standard, don't embed in product-layer cards.

---

## Atomicity

One card answers ONE complete question.

### Split When

- Card documents multiple concepts agent might need independently
- Removing a section still leaves a complete, useful card
- Different tasks would require different portions

### Don't Split When

- One concept with multiple aspects (use hub/spoke)
- Related information agent would always need together

### Hub/Spoke vs Separate Cards

**Hub/Spoke:** One concept, multiple aspects.

- "Room - Bronze Mode" with spokes for specific workflows
- Hub links to spokes, spokes link back

**Separate cards:** Distinct concepts that happen to relate.

- "Component - Minimal Mode" and "Component - Target Mode"
- Each stands alone

### Word Count as Signal

700+ words → review for atomicity violation. It's a trigger for inspection, not a splitting rule.

---

## Working with Companion Docs

SOT references companion docs for depth.

1. Start with SOT section (overview)
2. Pull detail from companion doc (depth)
3. Card synthesizes both — don't just copy

Companion docs often have better behavioral specs. SOT often has better strategic context.

---

## Discovered Cards

Found something inventory missed?

**Do:**

- Create the card
- Note as discovered: "Added: Room - X (not in inventory, found in SOT 2.3)"
- Flag for human to confirm

**Don't:**

- Skip because not in inventory
- Assume Conan was wrong (flag and move on)
