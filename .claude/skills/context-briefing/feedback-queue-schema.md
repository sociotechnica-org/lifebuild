# Feedback Queue Schema

Append-only log of actionable library improvement items discovered during context assembly.

**File:** `docs/context-library/feedback-queue.jsonl` (one JSON object per line)

---

## Entry Schema

```json
{
  "timestamp": "2026-02-19T14:30:00Z",
  "source_session_id": "uuid-v4",
  "items": [
    {
      "type": "gap | weak_card | retrieval_miss | relationship_discovery",
      "card": "Type - Name (if applicable)",
      "dimension": "WHAT | WHERE | WHY | WHEN | HOW",
      "severity": "low | medium | high",
      "description": "What was found",
      "suggested_action": "create_card | improve_dimension | add_link | update_retrieval_profile",
      "detail": "Specific recommendation"
    }
  ]
}
```

---

## Field Reference

### Top-level fields

| Field               | Type     | Required | Description                                     |
| ------------------- | -------- | -------- | ----------------------------------------------- |
| `timestamp`         | ISO-8601 | yes      | When the triage was performed                   |
| `source_session_id` | UUID v4  | yes      | Links to the assembly session in provenance-log |
| `items`             | object[] | yes      | Actionable feedback items (1+)                  |

### Item fields

| Field              | Type   | Required | Description                                         |
| ------------------ | ------ | -------- | --------------------------------------------------- |
| `type`             | string | yes      | Category of feedback                                |
| `card`             | string | no       | Card reference (null for gaps where no card exists) |
| `dimension`        | string | no       | Which dimension is affected                         |
| `severity`         | string | yes      | Impact on assembly quality                          |
| `description`      | string | yes      | What was found                                      |
| `suggested_action` | string | yes      | Recommended fix type                                |
| `detail`           | string | no       | Specific recommendation text                        |

### Feedback types

| Type                     | When to use                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `gap`                    | A card should exist but doesn't — gap manifest item is actionable  |
| `weak_card`              | Card exists but a dimension is too thin to be useful               |
| `retrieval_miss`         | Card exists but the retrieval profile didn't surface it            |
| `relationship_discovery` | Connection between cards noticed during traversal but not recorded |

### Severity guide

| Severity | Meaning                                                               |
| -------- | --------------------------------------------------------------------- |
| `high`   | Blocked assembly or forced builder to guess on a critical dimension   |
| `medium` | Degraded assembly quality — builder got context but it was incomplete |
| `low`    | Minor improvement — assembly worked fine but could be better          |

---

## Consumption

Feedback queue items are processed during library maintenance cycles:

- **Conan** reviews the queue during Health Check (Job 8) or Recommend (Job 4)
- **Sam** acts on items per Conan's recommendations
- Items are not deleted — they accumulate as a backlog for prioritization
