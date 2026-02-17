# Provenance Log Schema

Append-only log tracking context assembly and decision provenance.

**File:** `docs/context-library/constellation-log.jsonl` (one JSON object per line)

---

## Entry Schema

```json
{
  "timestamp": "2026-02-11T14:30:00Z",
  "session_id": "uuid-v4",
  "agent": "conan | sam",

  "task": {
    "description": "Implement Bronze Mode toggle in Sorting Room",
    "target_type": "Component",
    "task_type": "feature"
  },

  "assembly": {
    "profile_used": "Component",
    "seeds": ["Component - Bronze Position", "Room - Sorting Room"],
    "candidates_found": 12,
    "retrieved": [
      "Component - Bronze Position",
      "Room - Sorting Room",
      "Standard - Table Slot Behaviors",
      "System - Bronze Stack"
    ],
    "delivered": {
      "primary": ["Component - Bronze Position", "Room - Sorting Room"],
      "supporting": ["Standard - Table Slot Behaviors", "System - Bronze Stack"]
    },
    "gaps": [
      {
        "dimension": "HOW",
        "topic": "Bronze Mode state transitions",
        "searched": true,
        "found": false
      }
    ]
  },

  "queries": [
    {
      "round": 1,
      "technique": "Grep",
      "terms": "Bronze Mode toggle states",
      "path": "docs/context-library/product/systems/",
      "result_count": 0,
      "action": "reported_gap"
    }
  ],

  "decisions": [
    {
      "id": "decision-001",
      "description": "Used binary toggle instead of multi-state selector",
      "confidence": "medium",
      "signals": {
        "reversibility": "proceed",
        "coverage": "search",
        "precedent": "proceed",
        "blast_radius": "proceed",
        "domain": "proceed"
      },
      "cards_used": ["Component - Bronze Position"],
      "default_used": true,
      "outcome": "pending"
    }
  ]
}
```

---

## Outcome Updates

After task completion, append an outcome entry:

```json
{
  "timestamp": "2026-02-11T16:00:00Z",
  "type": "outcome_update",
  "session_id": "uuid-v4",
  "decision_id": "decision-001",
  "outcome": "success | failure | partial",
  "notes": "PR approved without changes to toggle implementation"
}
```

---

## Field Reference

### Top-level fields

| Field        | Type     | Required | Description                           |
| ------------ | -------- | -------- | ------------------------------------- |
| `timestamp`  | ISO-8601 | yes      | When the entry was created            |
| `session_id` | UUID v4  | yes      | Groups entries from same task session |
| `agent`      | string   | yes      | Which agent created this entry        |

### task object

| Field         | Type   | Required | Description                                     |
| ------------- | ------ | -------- | ----------------------------------------------- |
| `description` | string | yes      | What needs to be built/modified                 |
| `target_type` | string | yes      | Card type being built (System, Component, etc.) |
| `task_type`   | string | yes      | feature, bug, refactor, new, architecture       |

### assembly object (Conan entries only)

| Field                  | Type     | Required | Description                         |
| ---------------------- | -------- | -------- | ----------------------------------- |
| `profile_used`         | string   | yes      | Which retrieval profile was applied |
| `seeds`                | string[] | yes      | Initial cards found via search      |
| `candidates_found`     | number   | no       | Total cards considered              |
| `retrieved`            | string[] | yes      | All cards read during assembly      |
| `delivered.primary`    | string[] | yes      | Cards included in full              |
| `delivered.supporting` | string[] | yes      | Cards included as summaries         |
| `gaps`                 | object[] | no       | Identified context gaps             |

### queries array (Sam entries)

| Field          | Type   | Required | Description                |
| -------------- | ------ | -------- | -------------------------- |
| `round`        | number | yes      | Query round (1-3)          |
| `technique`    | string | yes      | Grep, Glob, or Read        |
| `terms`        | string | yes      | Search terms used          |
| `path`         | string | no       | Search scope               |
| `result_count` | number | yes      | Number of results          |
| `action`       | string | yes      | What was done with results |

### decisions array (Sam entries)

| Field          | Type     | Required | Description                         |
| -------------- | -------- | -------- | ----------------------------------- |
| `id`           | string   | yes      | Unique decision identifier          |
| `description`  | string   | yes      | What was decided                    |
| `confidence`   | string   | yes      | high, medium, or low                |
| `signals`      | object   | yes      | 5-signal evaluation                 |
| `cards_used`   | string[] | yes      | Cards that informed decision        |
| `default_used` | boolean  | no       | Whether default assumption was used |
| `outcome`      | string   | yes      | pending, success, failure, partial  |

---

## Weekly Review Queries

Analyze `constellation-log.jsonl` weekly to answer:

1. **Which cards correlate with success?** Cards in successful sessions → validate quality. Cards in failures → review accuracy.
2. **Which cards are retrieved but unused?** High retrieval + low decision reference → over-weighted or poorly structured.
3. **What gaps repeat?** Same topic in multiple gap reports → priority for card creation.
4. **Where does confidence fail?** Medium confidence + failure → calibration needed. High confidence + failure → serious review.
5. **Which profiles under/over-retrieve?** Count cards per profile. Profiles with consistently large candidate sets may need narrowing.
