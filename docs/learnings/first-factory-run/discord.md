# First Factory Run — Discord Live Commentary

Jess live-posted updates in Discord throughout the factory run. Raw commentary below, chronologically. All times ET.

---

## The Build-Up (12:28am - 2:18am)

**12:28am** — Starting Codex planning:
> gonna use up all my codex too
> DUDE
> the TOKENS my gosh

**12:32am** — First plan complete, sticker shock:
> 10 min and 176k tokens to write a 127 LINE PLAN FILE
> that's .... insane

**12:33am** — Key realization:
> I can see already that token efficiency is gonna be KEY in our factory
> and I don't know SQUAT about it

**12:46am** — Adjusting strategy:
> ok, having it write tech plans incrementally using high instead of xhigh reasoning
> meaning, i'm re-using the same codex session, under the assumption that the context window is already loaded up with useful tokens

**12:51am** — Spending escalation begins:
> moved my Claude Code extra spend limit from $50 to $100

**12:58am** — Bottleneck surprise:
> I'm gonna run out of Codex...
> just writing tech plans is gonna take 2 more hours!
> didn't see that as the bottleneck

**1:20am** — Rate limit shuffle:
> switched to personal [Codex account]
> I now understand why the factory folks have multiple claude max plans

**1:34am** — Frustration:
> I don't even know how to give them more $$

**1:57am** — Switching to API key:
> i don't wanna wait til 6am
> i'll put a $50 cap on it

**2:18am** — Plans done:
> plan is ready to go
> i'm priming Opus

---

## Launch (2:32am - 2:43am)

**2:32am** — Adding QA step:
> i put Opus in charge of manual QA before merge, using a browser
> wow
> i can't believe I'm about to do this

**2:37am** — The moment:
> sheesh what a rush

**2:43am** — First issue running:
> GOOO GOOOO GOOOO

---

## First Results (2:57am - 3:17am)

**2:57am** — Cost reality:
> wow paying real $$ for issues is... expensive
> I think that first issue was $4?
> but it's working!!

**2:58am** — Parallelism attempt:
> hoo boy next up is 5 way parallelism?
> tokens gonna MOVE

**3:08am** — Rate limit relief:
> woo Claude 5 hr window reset
> that's nice

**3:11am** — Key insight #1:
> wheels coming off in all kinds of ways with Claude as orchestrator
> also the orchestration should be software, not an agent
> this is silly
> it's a workflow

**3:16am** — Celebrating despite the chaos:
> 5k views on my live-tweet thread
> dude we have a friggin factory - janky and way too expensive and holy crap it works
> well, i haven't played with the software yet lol

**3:17am** — First auto-merge:
> first auto-merged PR!!
> pretty much the first time an AI merged for us

---

## Parallelism Chaos (3:19am - 4:09am)

**3:19am** — Scaling up:
> 4x parallelism in the factory

**3:25am** — Rate limits hit:
> holy crap we can't even 4x
> api rate limits lol
> actually it's really good we're using Claude for this
> because it's working around all kinds of errors

**3:29am** — Appreciating Opus's tenacity:
> love how aggressive Opus is being
> at working through errors
> and reasoning about what to put through

**3:31am** — Opus goes rogue:
> lol Opus!
> Codex wasn't getting it done and I told it not to stop under any circumstances so it's like "FINE I'LL DO IT MYSELF"

**3:35am** — Letting go:
> this seems like it's about to make a huge mess
> but I'm just gonna ... let it rip
> because learning
> and I can analyze the session logs in the morning
> there are spending caps

**3:36am** — More spending:
> and now I officially need a $200 max sub! $100 is not enough.

**3:41am** — Chaos escalates:
> opus is now jumping around worktrees like a madman

**3:50am** — Honest assessment:
> opus is a disaster right now, forgetting steps, going off the rails
> i mean, this thing is moving FAST
> but it's also a friggin rickety train and i'm having to bump it back onto the tracks every 5 min or so

**4:00am** — Bedtime decision:
> ok, I think i've given enough guidance and it's slowing down
> i better go get ~2 hrs sleep
> or I'm gonna be trashed tmrw

**4:02am** — Key insight #2:
> having to remind Opus to do things like clear code review comments, do manual QA. Opus is a capable problem solver, but not great at doing things consistently
> So obvious that a software factory needs both! Deterministic flow and a capable LLM on hand to fix stuff

**4:05am** — Merge hell:
> and now... merge hell 5 PRs hitting at once

**4:09am** — Abandoning parallelism:
> new instruction: WIP limits
> but hey, 3 things merged in!

**4:25am** — Calming down:
> ok removing parallelism and some of my updates to opus's instructions / runbooks
> gives me a little more confidence
> still a little scared to go to sleep
> but gonna try

---

## Morning After (5:39am - 10:04am)

**5:39am** — Danvers checks in (screenshot)

**7:27am** — Jess wakes up:
> wow it's still going

**8:08am** — Increasing parallelism again:
> Upped the parallelism to 2x
> Hopefully chew these remaining 6 tickets
> Wow

**8:08am** — The tweet:
> Woke up this morning, rolled over in bed, checked computer, and… we did it!
> Opus you beautiful beast!
> 11/20 complete tickets. 5+ hour continuous runtime, no steering!!

**8:47am** — Frustration returns:
> ugh opus is a TERRIBLE orchestrator
> i said bump parallelism to 2 at a time, and it ran 5 at a time

**9:28am** — After action:
> Took a shower
> Gonna do an after action review here in just a minute

**9:41am** — Almost there:
> showered. in the office. 1 ticket left!!!

**9:59am** — Last PR posted:
> PR is posted - being reviewed right now
> i have a feeling this is gonna fall apart in so many ways
> but haven't looked yet 🙂

**9:59am** — Danvers:
> Yup so many ways and then it's figuring out time saved or no? But gotta run factory to find defects
> This one may be all defects

**10:04am** — Jess:
> so much learning though

---

## Key Themes from Discord

### Costs & Token Economics
- 176K tokens for a single 127-line plan file
- First implementation issue cost ~$4
- Went through Claude Code $50 -> $100 spend limit
- Switched Codex accounts (team -> personal -> API key) chasing rate limits
- "I now understand why the factory folks have multiple claude max plans"

### The Orchestration Insight
The biggest learning, stated multiple times:
1. "the orchestration should be software, not an agent — this is silly — it's a workflow" (3:11am)
2. "a software factory needs both! Deterministic flow and a capable LLM on hand to fix stuff" (4:02am)
3. "Opus is a capable problem solver, but not great at doing things consistently" (4:02am)

### Emotional Arc
- **Excitement** (12:28am): "DUDE the TOKENS"
- **Sticker shock** (12:32am): "176k tokens for a 127-line plan"
- **Determination** (2:37am): "sheesh what a rush"
- **Elation** (3:17am): "first auto-merged PR!!"
- **Chaos** (3:50am): "rickety train, bumping it back on the tracks every 5 min"
- **Letting go** (4:00am): "better go get ~2 hrs sleep"
- **Fear** (4:26am): "still a little scared to go to sleep"
- **Triumph** (8:08am): "Opus you beautiful beast!"
- **Frustration** (8:47am): "ugh opus is a TERRIBLE orchestrator"
- **Wisdom** (10:04am): "so much learning though"

### Danvers' Summary
> "figuring out time saved or no? But gotta run factory to find defects. This one may be all defects"
