# Board Field Reference — Project Board #4

> **Project:** Release 1: The Campfire
> **Project ID:** `PVT_kwDOBzJqv84BPOmG`
> **Board URL:** https://github.com/orgs/sociotechnica-org/projects/4

## Field IDs and Option IDs

### Status (`PVTSSF_lADOBzJqv84BPOmGzg9sqAQ`)

| Option        | ID         |
|---------------|------------|
| Backlog       | `06bc7e24` |
| Ready         | `27164c6d` |
| In progress   | `206a38ee` |
| In review     | `a4fa5a44` |
| Blocked       | `03d0d9ef` |
| Done          | `ea38e33a` |

### Station (`PVTSSF_lADOBzJqv84BPOmGzg9srEk`)

| Option  | ID         |
|---------|------------|
| DECIDE  | `0d78f282` |
| PATCH   | `28254008` |
| MAKE    | `04d4fff3` |
| SHAPE   | `d28648b7` |

### Flow State (`PVTSSF_lADOBzJqv84BPOmGzg9srEo`)

| Option          | ID         |
|-----------------|------------|
| Queued          | `5bbc4dfb` |
| On the Line     | `0b7a880b` |
| Blocked (Andon) | `c6f03e83` |
| QC Gate         | `65ee4c47` |
| Review          | `c0a7f118` |
| Rework          | `41e2ab5c` |
| Shipped         | `03f954dc` |

### Takt (`PVTSSF_lADOBzJqv84BPOmGzg9srEs`)

| Option  | ID         |
|---------|------------|
| Danvers | `fa822e86` |
| Jess    | `5f5d716e` |
| AI      | `075c46fc` |

---

## Command Templates

### Look up a project item ID by issue number

```bash
gh project item-list 4 --owner sociotechnica-org --format json | \
  jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id'
```

Replace `ISSUE_NUMBER` with the actual issue number (no quotes — it's an integer).

### Set a field value

```bash
gh project item-edit \
  --project-id PVT_kwDOBzJqv84BPOmG \
  --id ITEM_ID \
  --field-id FIELD_ID \
  --single-select-option-id OPTION_ID
```

### Common Operations

**Move item to Done (Status):**
```bash
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9sqAQ --single-select-option-id ea38e33a
```

**Move item from Blocked to Ready (Status):**
```bash
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9sqAQ --single-select-option-id 27164c6d
```

**Set Flow State to Shipped:**
```bash
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id 03f954dc
```

**Set Flow State to Queued:**
```bash
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id 5bbc4dfb
```

**Set Flow State to Blocked (Andon):**
```bash
ITEM_ID=$(gh project item-list 4 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')
gh project item-edit --project-id PVT_kwDOBzJqv84BPOmG --id "$ITEM_ID" --field-id PVTSSF_lADOBzJqv84BPOmGzg9srEo --single-select-option-id c6f03e83
```

---

## Field Semantics

### Status vs Flow State — When to Change Which

These are two different fields serving different purposes:

| Field      | Purpose                        | Who changes it        |
|------------|--------------------------------|-----------------------|
| **Status** | Issue lifecycle (project board) | George during propagation, humans during work |
| **Flow State** | Factory floor position       | George during propagation, humans during work |

**Rules:**

1. When a D-issue is resolved: set **Status → Done** AND **Flow State → Shipped**
2. When a blocked item is unblocked: set **Status → Ready** AND **Flow State → Queued**
3. When work starts on an item: set **Status → In progress** AND **Flow State → On the Line**
4. When an item hits a blocker: set **Status → Blocked** AND **Flow State → Blocked (Andon)**
5. **Station** is NEVER changed by George — station movement is always a human action

### Flow State Transitions

```
Queued → On the Line → QC Gate → Review → Shipped
              ↓                              ↑
       Blocked (Andon) → (unblocked) ────────┤
                                              │
              Rework ─────────────────────────┘
```
