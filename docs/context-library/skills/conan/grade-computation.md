# Grade Computation

## Letter → Points

| Letter | Pts | Letter | Pts |
|--------|-----|--------|-----|
| A+ | 4.3 | C+ | 2.3 |
| A | 4.0 | C | 2.0 |
| A- | 3.7 | C- | 1.7 |
| B+ | 3.3 | D+ | 1.3 |
| B | 3.0 | D | 1.0 |
| B- | 2.7 | D- | 0.7 |
| | | F | 0.0 |

## Score → Letter

| Range | Letter |
|-------|--------|
| 4.15+ | A+ |
| 3.85-4.14 | A |
| 3.50-3.84 | A- |
| 3.15-3.49 | B+ |
| 2.85-3.14 | B |
| 2.50-2.84 | B- |
| 2.15-2.49 | C+ |
| 1.85-2.14 | C |
| 1.50-1.84 | C- |
| 1.15-1.49 | D+ |
| 0.85-1.14 | D |
| 0.50-0.84 | D- |
| <0.50 | F |

## Card Score

```
Card = (WHAT × 0.20) + (WHY × 0.20) + (WHERE × 0.20) + (HOW × 0.20) + (WHEN × 0.20)
```

Vision Capture: WHEN = PASS (4.0) or FAIL (0.0)

## Zone Score

```
Zone = Sum(all card scores including 0 for missing) / Expected card count
```

**Completeness cap:**

| Cards Exist | Max Grade |
|-------------|-----------|
| <25% | D |
| 25-49% | C |
| 50-74% | B |
| 75%+ | No cap |

## System Score

```
System = Average(all zone scores)
```

## Rage Meter

| System Grade | Rage Level |
|--------------|------------|
| A+ to A | Silent Smolder |
| A- to B+ | Low Simmer |
| B to B- | Low Simmer |
| C+ to C | Visible Frustration |
| C- to D+ | Active Anger |
| D | Fury |
| D- to F | Apoplectic |
