# Job 8: Weekly Review

The primary recurring Operate mode job. Runs at the start of each week. **15 minutes max.**

## Trigger

Human asks "What should we focus on this week?" or "How are we tracking?" or starts a weekly review session.

## Key Principle

Research says attention drops from 91% to 73% after 30 minutes. Keep it tight. KPIs → Performance → Blockers → Next bets. If a deeper dive is needed on any section, flag it for a separate session.

## Procedure

**Step 1: Read context (before the meeting — Arvin does this silently)**

- Read the last weekly review from `.context/arvin-sessions/`
- Read any new source documents or library cards since last review
- Check the content backlog if one exists

**Step 2: Gather inputs from the human (2 min)**

- What happened last week? (Quick hits across all three divisions)
- Any new information? (Market signals, relationship developments, content performance)
- Anything planned that didn't happen? Why?

**Step 3: Division health scan (3 min)**

| Division | Health                  | Key Signal                          | Trend |
| -------- | ----------------------- | ----------------------------------- | ----- |
| 1:1      | Growing/Stable/Decaying | What moved? Any meaningful inbound? | ↑ ↓ → |
| Groups   | Growing/Stable/Decaying | Any events? Group dynamics?         | ↑ ↓ → |
| 1:Many   | Growing/Stable/Decaying | What shipped? Pipeline status?      | ↑ ↓ → |

**Step 4: Value channel check (3 min)**

| Value Channel                 | What Happened                                      | Signal | Trend |
| ----------------------------- | -------------------------------------------------- | ------ | ----- |
| Thought leadership (right 50) | Who saw our work? Any engagement from target-tier? |        | ↑ ↓ → |
| Open source traction          | Stars, forks, contributors, organic discovery?     |        | ↑ ↓ → |
| Internal champions            | Any signals from target companies?                 |        | ↑ ↓ → |

**Step 5: Circuit breaker check (2 min)**

- Is anything in the content pipeline past its appetite?
- If yes: kill it or reshape it into a smaller container
- Is any relationship in 1:1 getting investment without return? Flag it.

**Step 6: Next week's bets (3 min)**

- Top 3 priorities across all divisions
- Any bets to place or adjust
- Any activities to stop or deprioritize
- If the content backlog has shaped items ready, flag for a Betting Table session (Job 9)

**Step 7: Decisions needed (2 min)**

- Flag any items requiring human judgment
- Don't try to resolve them in the review — just surface them

**Step 8: Write session notes**
Write to `.context/arvin-sessions/[date]-weekly-review.md`.

## Output Template

```markdown
# Weekly Review — [date]

## Last Week (quick hits)

- 1:1: [what happened]
- Groups: [what happened]
- 1:Many: [what happened]

## Division Health

| Division | Health | Key Signal | Trend |
| -------- | ------ | ---------- | ----- |
| 1:1      |        |            |       |
| Groups   |        |            |       |
| 1:Many   |        |            |       |

## Value Channels

| Channel            | This Week | Signal | Trend |
| ------------------ | --------- | ------ | ----- |
| Thought leadership |           |        |       |
| Open source        |           |        |       |
| Internal champions |           |        |       |

## Circuit Breaker

- [Anything past appetite? Kill or reshape.]

## Next Week's Bets

1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

## Decisions Needed

- [Items requiring human judgment]
```
