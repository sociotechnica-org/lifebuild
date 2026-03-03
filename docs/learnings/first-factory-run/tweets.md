# First Factory Run — Live Tweets

Jess live-tweeted the entire factory run on X/Twitter (@jessmartin). These are the relevant tweets in chronological order (all times ET).

---

## Pre-Run Context (Feb 25-26)

**Wed Feb 25, 2:14pm** — Setting the mood:

> as someone who really enjoys working and has had some really fun jobs... I have never had this much fun working in my life.
> AI-software super powers means I get to build the projects I've only dreamed of.
> So grateful!

**Thu Feb 26, 12:13pm** — Showing off the Campfire release work:

> Working on The Campfire release for lifebuild.me - really starting to come together!
> that's your Attendant, waiting for you by the campfire, to guide you to The Sanctuary where he helps you build your life

---

## The Factory Run (Feb 26 night - Feb 27 morning)

**Thu Feb 26, 10:31pm** — Kicking it off:

> today's attempt at raising my ambition: give Claude an entire release (~20-30 user stories) and have it ralph loop all night with codex as implementor.
> Can I hand off ~8 hours of work and have quality work come out?
> https://x.com/jessmartin/status/2027225015498813833

**Thu Feb 26, 11:52pm** — Stories written, ready to go:

> ok, set of user stories written (20 in all) - a bunch of supporting documentation from our context library created for the release
> now to test out the Claude -> Codex flow
> https://x.com/jessmartin/status/2027245334624125127

**Fri Feb 27, 12:16am** — Context briefings:

> next step in our process after is "context briefings"- we query our context docs to product extensive docs about the story so the implementing agent knows the larger product story around the feature.
> we've been using them for a few weeks, and they are BIG.
> Too big
> https://x.com/jessmartin/status/2027251500372631796

**Fri Feb 27, 2:30am** — Adding QA:

> I just put the Opus orchestrator in charge of QA using playwright MCP and Chrome.
> This should be interesting... I realize this might cause it to stop in the middle of the night. Plus, ain't gonna be cheap on them tokens!
> https://x.com/jessmartin/status/2027285121292763306

**Fri Feb 27, 2:35am** — The button:

> ok, it's been ~5 hours getting prepped for this... moment.
> About ready to push the button...
> https://x.com/jessmartin/status/2027286505316573220

---

## Morning After

**Fri Feb 27, 8:04am** — Success:

> Opus as Ralph Loop dispatching to Codex 5.3… just works. 🫣
> (Quote tweeting himself: "Woke up this morning, rolled over in bed, checked computer, and… we did it! Opus you beautiful beast!")
> https://x.com/jessmartin/status/2027369121860460578

**Fri Feb 27, 9:40am** — Almost done:

> we're almost there folks... wow. just one more ticket now...
> https://x.com/jessmartin/status/2027393589236424965

**Fri Feb 27, 9:40am** — Honest assessment:

> I said 2x, Opus! Not 5x!
> Opus is REALLY bad as an orchestrator which tells me two things:
>
> - I didn't give it the right tools to be able to see what was going on. The GH project board + bash background jobs is not sufficient
> - I need deterministic rules for the factory just like linting/typechecking/tests in a codebase
>   This is on me, not Opus. Admire the determination though!
>   https://x.com/jessmartin/status/2027393485045694615

---

## Key Themes from Tweets

1. **Ambition framing** — "raising my ambition" by handing off a full release
2. **5 hours of prep** — the planning/story-writing/briefing phase before pressing go
3. **Honest about tradeoffs** — acknowledging Opus was "REALLY bad as an orchestrator" but taking responsibility ("this is on me")
4. **The orchestrator needs deterministic rules** — key insight that LLM orchestration needs the same kind of guardrails as code (linting, type-checking)
5. **It worked** — despite the messiness, woke up to closed PRs
