# First Factory Run — Session Token Usage

Token usage analysis for the overnight factory run (Feb 26-27, 2026).

---

## Summary

| Agent                  | Model           | Sessions               | Output                | Cache Read | Other Input                | Total Tokens | Est. Cost   |
| ---------------------- | --------------- | ---------------------- | --------------------- | ---------- | -------------------------- | ------------ | ----------- |
| Opus (orchestrator)    | claude-opus-4-6 | 1 session, 2,286 turns | 320K                  | 238.1M     | 5.7M cache write, 5K input | 244.0M       | $162.37     |
| Codex (planning)       | gpt-5.3-codex   | 18 sessions            | 308K + 193K reasoning | 49.9M      | 2.7M uncached input        | 53.1M        | $20.51      |
| Codex (implementation) | gpt-5.3-codex   | 35 sessions            | 652K + 321K reasoning | 174.1M     | 9.2M uncached input        | 184.3M       | $60.20      |
| **Combined**           |                 |                        | **1.8M**              | **462.1M** | **17.6M**                  | **480.9M**   | **$243.08** |

Estimated costs use current API list pricing ([Anthropic](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI](https://developers.openai.com/api/docs/pricing/)). Both agents ran on subscriptions (Claude Max, ChatGPT Pro) so actual out-of-pocket was lower.

Jess reported on Twitter: "This was EXPENSIVE. $115 on tokens over 9 hours. I burned through a Claude Max sub, a ChatGPT Pro sub, and then API tokens. Just Codex was 183M tokens!" (The 183M figure likely reflects the Codex dashboard's count, which may exclude cached tokens or measure differently than the session logs.)

---

## Opus (Claude Code Orchestrator)

Single continuous session: **Feb 26, 11:22am → Feb 27, 10:10am ET** (22.8 hours, 2,286 API turns).

### Token Totals

| Category               | Tokens          |
| ---------------------- | --------------- |
| Output                 | 319,798         |
| Cache read (input)     | 238,066,071     |
| Cache creation (input) | 5,651,091       |
| Direct input           | 4,641           |
| **Total**              | **244,041,601** |

The vast majority of tokens are **cache reads** — Opus re-reads its full context window on every turn. With 2,286 turns and a context window that grows over the session, cache reads dominate.

### Estimated Cost (Opus 4.6 API pricing)

| Category            | Tokens          | Rate    | Cost        |
| ------------------- | --------------- | ------- | ----------- |
| Cache read (input)  | 238,066,071     | $0.50/M | $119.03     |
| Cache write (input) | 5,651,091       | $6.25/M | $35.32      |
| Output              | 319,798         | $25/M   | $7.99       |
| Direct input        | 4,641           | $5/M    | $0.02       |
| **Total**           | **244,041,601** |         | **$162.37** |

Cache reads at $0.50/M are 10x cheaper than base input ($5/M), but with 238M of them they still account for 73% of the Opus cost. Without prompt caching, this session would have cost $1,193 in input alone.

Note: On Claude Max ($200/mo), this is covered by the subscription. Jess hit rate limits rather than a bill, and had to increase the extra-spend limit from $50 → $100 during the session.

### Hourly Breakdown

| Hour (ET)      | Turns   | Output     | Cache Read     | Cache Create  |
| -------------- | ------- | ---------- | -------------- | ------------- |
| Feb 26 11am    | 24      | 5,302      | 733,538        | 235,864       |
| Feb 26 12pm    | 28      | 9,730      | 1,721,681      | 198,698       |
| Feb 26 1pm     | 1       | 81         | 0              | 80,954        |
| Feb 26 9pm     | 29      | 6,664      | 2,484,899      | 184,515       |
| Feb 26 10pm    | 61      | 19,631     | 7,386,752      | 62,896        |
| Feb 26 11pm    | 159     | 31,853     | 15,442,640     | 215,411       |
| Feb 27 12am    | 111     | 19,682     | 12,513,442     | 2,001,316     |
| Feb 27 1am     | 63      | 7,667      | 2,751,501      | 108,106       |
| Feb 27 2am     | 151     | 25,441     | 14,938,992     | 301,288       |
| **Feb 27 3am** | **599** | **84,146** | **67,735,101** | **1,201,445** |
| Feb 27 4am     | 304     | 30,335     | 27,843,650     | 301,681       |
| Feb 27 5am     | 103     | 10,421     | 14,515,327     | 41,737        |
| Feb 27 6am     | 142     | 13,943     | 14,608,372     | 178,876       |
| Feb 27 7am     | 128     | 15,048     | 14,356,617     | 57,823        |
| Feb 27 8am     | 95      | 13,099     | 13,520,398     | 42,014        |
| Feb 27 9am     | 240     | 21,992     | 21,354,453     | 281,379       |
| Feb 27 10am    | 48      | 4,763      | 6,158,708      | 157,088       |

The 3am hour was the most intense — **599 turns** during the parallel implementation chaos. This is when Opus was managing multiple Codex sessions, merging PRs, doing QA, and fighting rate limits.

### Speed Modes

| Mode         | Turns |
| ------------ | ----- |
| Standard     | 1,213 |
| Fast         | 52    |
| Unknown/null | 1,021 |

### Context Resets

Approximately 1 context reset detected (large drop in cache_read tokens), corresponding to a session continuation after running out of context.

---

## Codex (Planning + Implementation Agent)

53 sessions across ~10 hours. All sessions used **gpt-5.3-codex** (one early planning session used gpt-5.2-codex).

Codex was used in two distinct phases: first to write technical implementation plans for each issue (12:13am–1:36am), then to implement the code (2:37am–10:01am). There was a ~1 hour gap between phases while Opus reviewed and prepared the plans.

### Token Totals

| Category         | Tokens          |
| ---------------- | --------------- |
| Input            | 235,900,137     |
| Cached input     | 223,974,784     |
| Uncached input   | 11,925,353      |
| Output           | 960,335         |
| Reasoning output | 513,969         |
| **Total**        | **236,860,472** |

### Planning vs Implementation Split

| Phase            | Sessions | Input    | Cached   | Output   | Reasoning | Total    | Est. Cost  |
| ---------------- | -------- | -------- | -------- | -------- | --------- | -------- | ---------- |
| Planning (plans) | 18       | 52.6M    | 49.9M    | 308K     | 193K      | 53.1M    | $20.51     |
| Implementation   | 35       | 183.3M   | 174.1M   | 652K     | 321K      | 184.3M   | $60.20     |
| **Combined**     | **53**   | **236M** | **224M** | **960K** | **514K**  | **237M** | **$80.71** |

Planning consumed **22% of Codex tokens but 25% of Codex cost** — the uncached input ratio is higher for planning because the first session (#699) loaded the full codebase from scratch. Implementation was more cache-efficient.

### Estimated Cost (GPT-5.3 Codex API pricing)

| Category           | Tokens          | Rate     | Cost       |
| ------------------ | --------------- | -------- | ---------- |
| Cached input       | 223,974,784     | $0.175/M | $39.20     |
| Uncached input     | 11,925,353      | $1.75/M  | $20.87     |
| Output + reasoning | 1,474,304       | $14/M    | $20.64     |
| **Total**          | **236,860,472** |          | **$80.71** |

Cached input is 10x cheaper than uncached ($0.175 vs $1.75/M). 95% of Codex input tokens hit cache, keeping costs manageable despite the massive token volume.

### Per-Issue Breakdown (Implementation Only)

| Issue | Sessions | Total Tokens | Est. Cost |
| ----- | -------- | ------------ | --------- |
| #699  | 3        | 14.2M        | $4.85     |
| #700  | 3        | 3.7M         | $1.56     |
| #701  | 3        | 6.7M         | $2.52     |
| #702  | 2        | 5.1M         | $1.72     |
| #703  | 2        | 2.4M         | $1.23     |
| #704  | 3        | 4.7M         | $1.78     |
| #705  | 1        | 6.6M         | $2.21     |
| #706  | 1        | 3.5M         | $1.13     |
| #707  | 1        | 17.3M        | $4.44     |
| #708  | 1        | 12.5M        | $3.23     |
| #709  | 1        | 2.6M         | $1.08     |
| #710  | 1        | 1.9M         | $0.73     |
| #711  | 1        | 10.6M        | $3.34     |
| #712  | 1        | 11.5M        | $3.28     |
| #713  | 2        | 13.5M        | $4.44     |
| #717  | 1        | 5.5M         | $2.17     |
| #718  | 1        | 19.0M        | $6.64     |
| #719  | 2        | 7.8M         | $2.66     |
| #720  | 1        | 14.7M        | $4.18     |
| #721  | 1        | 10.7M        | $3.62     |
| #727  | 1        | 6.9M         | $2.07     |
| #728  | 2        | 2.9M         | $1.30     |

Issues #727 and #728 are fix-up sessions for #704 and #705 respectively (rebases, e2e test fixes).

### Observations

- **Planning is expensive but front-loaded**: 18 planning sessions consumed 53M tokens ($20.51) to produce ~308K output tokens — the actual plan text. The first session (#699) alone was 20M tokens because it loaded the full codebase cold.
- **Implementation scales with complexity**: Simple removals (#700, #701, #703) cost $1–2.50. Complex conversation flows (#718, #707, #720) cost $4–7 each.
- **Input tokens dominate**: 95%+ cached input. Codex front-loads the full codebase context, then generates relatively small outputs.
- **Output is tiny**: Only 960K output tokens across 53 sessions — the actual code written is a small fraction of the context consumed.

---

## Combined Token Economics

### Estimated vs actual cost

At API list pricing, this session would cost **$243.08** ($162.37 Opus + $80.71 Codex). Per Jess's tweet, the actual out-of-pocket was ~$115, spread across:

- Claude Max subscription ($200/mo, rate-limited, not billed per token)
- ChatGPT Pro subscription ($200/mo, for Codex, rate-limited)
- API tokens (switched to API key at ~2am when rate limits were exhausted)

The $115 reflects only the API overage — the subscription costs are amortized across the month.

### Tokens per issue

With 20 issues and ~481M total tokens across planning and implementation:

- **Average Codex cost per issue (implementation only)**: ~$3/issue ($60.20 / 20 issues)
- **Average total cost per issue (Opus + Codex)**: ~$12/issue ($243.08 / 20 issues)
- **Range (implementation)**: 1.9M (#710, simple overlay shell) to 19.0M (#718, complex campfire conversation)

Opus orchestration ($162.37) accounts for **67% of total cost** — far more than the Codex implementation work itself. The orchestrator's cost comes from re-reading its full context window on every turn across 2,286 turns.

### Output efficiency

Across both agents, actual _output_ (new text/code generated) was only ~1.8M tokens out of 481M total — a **0.37% output-to-total ratio**. The rest is context window reads and cache operations.

This highlights the fundamental economics of agentic coding: the cost is overwhelmingly in _reading and understanding_ code, not _writing_ it.

### The cache read multiplier

Without prompt caching, the same session would cost dramatically more:

| Agent     | With caching | Without caching | Savings |
| --------- | ------------ | --------------- | ------- |
| Opus      | $162.37      | $1,228.30       | 87%     |
| Codex     | $80.71       | $432.72         | 81%     |
| **Total** | **$243.08**  | **$1,661.02**   | **85%** |

Prompt caching saved ~$1,418 — turning a $1,661 session into a $243 one.
