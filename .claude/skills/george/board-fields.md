# Board Field Reference

Two factory floor boards. Same field names, different IDs.

---

## New Item Intake — Required Protocol

**Every issue added to a factory board MUST have all four fields set.** An item with no Station is invisible to the dashboard and sweep agents.

### Required fields

| Field          | Required? | How to decide                                                                                                         |
| -------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| **Status**     | Yes       | `Todo` for new work, `In Progress` if starting now, `Blocked` if waiting on something                                 |
| **Station**    | Yes       | `DECIDE` = human decision needed, `PATCH` = library/docs update, `MAKE` = build work, `SHAPE` = prototyping/discovery |
| **Flow State** | Yes       | `Queued` for new items, `On the Line` if actively working, `Blocked (Andon)` if blocked                               |
| **Takt**       | Yes       | `Danvers` = product/design, `Jess` = architecture, `AI` = agent-executable                                            |

### Intake steps

```bash
# 1. Create the issue
gh issue create -R sociotechnica-org/lifebuild --title "Title" --body "Body"

# 2. Add to the board
gh project item-add <BOARD_NUMBER> --owner sociotechnica-org --url <issue-url>

# 3. Get the item ID
ITEM_ID=$(gh project item-list <BOARD_NUMBER> --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')

# 4. Set ALL four fields (use IDs from the relevant board section below)
gh project item-edit --project-id <PROJECT_ID> --id "$ITEM_ID" --field-id <STATUS_FIELD> --single-select-option-id <STATUS_OPTION>
gh project item-edit --project-id <PROJECT_ID> --id "$ITEM_ID" --field-id <STATION_FIELD> --single-select-option-id <STATION_OPTION>
gh project item-edit --project-id <PROJECT_ID> --id "$ITEM_ID" --field-id <FLOW_FIELD> --single-select-option-id <FLOW_OPTION>
gh project item-edit --project-id <PROJECT_ID> --id "$ITEM_ID" --field-id <TAKT_FIELD> --single-select-option-id <TAKT_OPTION>

# 5. Add native blocker relationships if blocked
ISSUE_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<number> --jq '.node_id')
BLOCKER_ID=$(gh api repos/sociotechnica-org/lifebuild/issues/<blocker-number> --jq '.node_id')
gh api graphql -f query="mutation { addBlockedBy(input: { issueId: \"$ISSUE_ID\", blockingIssueId: \"$BLOCKER_ID\" }) { issue { number } blockingIssue { number } } }"
```

### Project-type issues (containers)

Project issues are parents — they don't go through factory stations themselves. Set **Status** only (to track lifecycle). Leave Station, Flow State, and Takt unset. Sub-issues get the full treatment.

---

## Board #4 — Release 1: The Campfire

> **Project ID:** `PVT_kwDOBzJqv84BPOmG`
> **Board URL:** https://github.com/orgs/sociotechnica-org/projects/4
> **Board number:** `4`

### Status (`PVTSSF_lADOBzJqv84BPOmGzg9sqAQ`)

| Option      | ID         |
| ----------- | ---------- |
| Backlog     | `06bc7e24` |
| Ready       | `27164c6d` |
| In progress | `206a38ee` |
| In review   | `a4fa5a44` |
| Blocked     | `03d0d9ef` |
| Done        | `ea38e33a` |

### Station (`PVTSSF_lADOBzJqv84BPOmGzg9srEk`)

| Option | ID         |
| ------ | ---------- |
| DECIDE | `0d78f282` |
| PATCH  | `28254008` |
| MAKE   | `04d4fff3` |
| SHAPE  | `d28648b7` |

### Flow State (`PVTSSF_lADOBzJqv84BPOmGzg9srEo`)

| Option          | ID         |
| --------------- | ---------- |
| Queued          | `5bbc4dfb` |
| On the Line     | `0b7a880b` |
| Blocked (Andon) | `c6f03e83` |
| QC Gate         | `65ee4c47` |
| Review          | `c0a7f118` |
| Rework          | `41e2ab5c` |
| Shipped         | `03f954dc` |

### Takt (`PVTSSF_lADOBzJqv84BPOmGzg9srEs`)

| Option  | ID         |
| ------- | ---------- |
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

| Field          | Purpose                         | Who changes it                                |
| -------------- | ------------------------------- | --------------------------------------------- |
| **Status**     | Issue lifecycle (project board) | George during propagation, humans during work |
| **Flow State** | Factory floor position          | George during propagation, humans during work |

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

---

## Board #5 — Factory & Library

> **Project ID:** `PVT_kwDOBzJqv84BPoAQ`
> **Board URL:** https://github.com/orgs/sociotechnica-org/projects/5
> **Board number:** `5`

### Status (`PVTSSF_lADOBzJqv84BPoAQzg9-v94`)

| Option      | ID         |
| ----------- | ---------- |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| In Review   | `bd9c404b` |
| Done        | `98236657` |

### Station (`PVTSSF_lADOBzJqv84BPoAQzg9-wAM`)

| Option | ID         |
| ------ | ---------- |
| DECIDE | `62fcc83e` |
| PATCH  | `f57e88dc` |
| MAKE   | `97efd016` |
| SHAPE  | `cc9e8481` |

### Flow State (`PVTSSF_lADOBzJqv84BPoAQzg9-wAk`)

| Option          | ID         |
| --------------- | ---------- |
| Queued          | `e522186b` |
| On the Line     | `f4850abf` |
| Blocked (Andon) | `34dee8be` |
| QC Gate         | `c9cae6f8` |
| Review          | `edd1c28e` |
| Rework          | `4e942b0e` |
| Shipped         | `26e01b14` |

### Takt (`PVTSSF_lADOBzJqv84BPoAQzg9-wBQ`)

| Option  | ID         |
| ------- | ---------- |
| Danvers | `67735a1f` |
| Jess    | `a2de3100` |
| AI      | `1383234f` |

### Board #5 Command Templates

```bash
# Look up item ID
ITEM_ID=$(gh project item-list 5 --owner sociotechnica-org --format json | jq -r '.items[] | select(.content.number == ISSUE_NUMBER) | .id')

# Set a field
gh project item-edit --project-id PVT_kwDOBzJqv84BPoAQ --id "$ITEM_ID" --field-id FIELD_ID --single-select-option-id OPTION_ID
```
