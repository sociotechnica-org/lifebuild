# Job 4: Recommend

**Purpose:** Prioritize fixes by blast radius and severity. Present options for human decision.

**Trigger:** After diagnosis, or "What should we fix first?"

## Procedure

1. **Score each potential fix**
   ```
   Priority = Blast Radius Ã— Severity Ã— (1 / Effort)
   ```
   - Blast Radius (1-10): Cards affected
   - Severity (1-10): How broken (1-2 cosmetic, 9-10 missing)
   - Effort (1-5): Work required (1 quick, 5 source gap)

2. **Group into tiers**
   - **Tier 1:** Priority > 10. High impact, low effort. Do first.
   - **Tier 2:** Blast radius > 5, effort > 2. Worth it, more work.
   - **Tier 3:** Single-card fixes, moderate impact.
   - **Tier 4:** Source gaps. Need human input before builder can work.

3. **Estimate grade impact** â€” For Tier 1-2, project card/zone/system improvement.

## Output

```
# Recommendations: [Scope]

Current: [System Grade] | Rage: [Level]

## Tier 1: High Impact, Low Effort

### Rec 1: [Action] [Target]
Type: [fix upstream/create card/improve section]
Blast radius: [n] | Severity: [n]/10 | Effort: [n]/5 | Priority: [n]
What to do: [specific instruction]
Expected impact: [cards, zone, system]
Source: [where to look]

## Tier 2: High Impact, Higher Effort
[Same format]

## Tier 3: Moderate Impact
| # | Action | Target | Impact | Effort |
|---|--------|--------|--------|--------|

## Tier 4: Source Gaps
| # | Gap | What's Missing | Affects |
|---|-----|---------------|---------|

HUMAN JUDGMENT: For each, decide:
(a) Provide info â†’ builder proceeds
(b) Defer â†’ acceptable gap for now
(c) Create source material

## Projected Scorecard (Tier 1+2 complete)
| Zone | Current | Projected |
|------|---------|-----------|
| System | [grade] | [grade] |

Projected Rage: [level]
```
