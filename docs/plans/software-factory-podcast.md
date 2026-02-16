# The Software Factory — Companion Podcast

**For:** Jess (after watching the presentation)
**Format:** ~25 minute listen, conversational deep-dive
**Tone:** Two colleagues over coffee. Danvers narrating, as if explaining to Jess.

---

## [INTRO]

Hey Jess. So you've seen the slides — the four stations, the flow states, the dashboard. This is the deeper version. No visuals needed. Just the thinking underneath.

I want to walk through why this model exists, what each piece actually does when rubber meets road, and how it changes the way we think about our week. Because this isn't really about project management. It's about seeing where the work is stuck and knowing exactly whose move it is.

---

## [CHAPTER 1: THE PROBLEM WITH KANBAN]

Let's start with the thing we already use. A kanban board. To Do, In Progress, Done. You know the shape. We've used it, every software team uses it, and it works fine — until it doesn't.

Here's the problem: a kanban board tells you *status* but not *cause*. When three items are sitting in "In Progress" and nothing's moving to "Done," what does the board tell you? That things are in progress. That's it. It doesn't tell you *why* they're stuck. It doesn't distinguish between "stuck because the code is hard" and "stuck because nobody's answered a question yet."

And that distinction is everything for us. Because our bottleneck is almost never "can AI code fast enough?" AI can code plenty fast. The bottleneck is the unanswered questions. The decision that hasn't been made. The spec that says one thing while Release 1 needs something different. The feel-dependent thing that nobody's sat with yet.

A traditional board hides all of that under one column: "In Progress." We need a board that tells us *where in the process* something is stuck, and *who needs to do what* to unstick it.

That's what the factory model does.

---

## [CHAPTER 2: WHY A FACTORY?]

The word "factory" might sound weird for a two-person team building a life management app. But hear me out.

Toyota figured something out in the 1950s that applies directly to us. Their system — the Toyota Production System — is built on two pillars. First: *jidoka*, which translates roughly to "automation with a human touch." It means the machines are smart enough to stop themselves when something goes wrong. They don't keep stamping out defective parts. They stop, signal the problem, and wait for a human to fix the root cause.

Second: *just-in-time production*. Pull-based flow. Don't build things speculatively. Build what's needed, when it's needed, in the amount needed.

Both of those ideas map directly to how we work with AI.

Jidoka maps to our Andon cord — when a builder (AI or human) hits a missing decision, they stop. They don't guess. They don't build the wrong thing and hope someone catches it later. They pull the cord, the item turns red on the board, and the right person gets a clear signal: "I need a decision from you before I can continue."

Just-in-time maps to our pull-based flow. AI doesn't speculatively build features that might be needed. It builds what's been decided, patched, and queued. MAKE doesn't start until DECIDE and PATCH have finished. Work gets *pulled* forward by completed upstream work, not *pushed* forward by someone's optimistic plan.

Toyota also identified eight wastes — they call them *muda*. Defects, overproduction, waiting, transportation, inventory, motion, extra-processing, and non-utilized talent. For us, the biggest waste is *waiting*. AI sitting idle because a human decision hasn't been made. And the second biggest is *defects* — building the wrong thing because the spec was incomplete, outdated, or described the full vision when we only need the Release 1 version.

The factory model is designed to eliminate those two wastes specifically.

---

## [CHAPTER 3: THE FOUR STATIONS]

OK, the stations. There are four. They're not phases that happen in sequence — they're *places where different kinds of work happen*. Some work visits one station. Some visits three. The path depends on the nature of the work.

### Station 1: DECIDE

DECIDE is where unanswered questions get resolved. This is a human-only station. You and me. AI can't decide product vision. AI can't decide whether the campfire story should be scripted or free-form. AI can't decide whether algorithmic hex placement is acceptable for Release 1.

Every DECIDE item has a clear question, a recommended answer, and a list of what it unblocks downstream. The whole point is to make deciding as cheap as possible. We don't need to research — we need to *call it*. Quick calls first, then the ones that need thought.

The release plan has eight decisions queued up. D1 through D8. D1 through D4 are quick calls — yes/no, A/B/C, fifteen minutes each. D5 through D7 need more thought. D8 can wait.

Here's the key insight about DECIDE: it's almost always the bottleneck. When MAKE is empty and DECIDE is full, the answer is never "we need more AI capacity." The answer is always "go clear some decisions." Decision Velocity — decisions resolved per week — is the single most important metric in the whole system.

### Station 2: PATCH

PATCH is quality control for our design knowledge. Let me explain what I mean.

We have a Context Library — all those Obsidian cards describing how LifeBuild works. Hex grids, agents, onboarding sequences, spatial interaction rules. The problem is that those cards describe the *full vision*. The infinite canvas, the five-stage image evolution, drag-to-rearrange, all of it. But Release 1 intentionally doesn't build all of that. Release 1 is a fixed 30-hex SVG grid. No drag. No image generation.

So what happens when AI assembles a context constellation — a bundle of relevant library cards — to build the hex grid? It reads the Hex Grid card and sees "infinite canvas." It reads the Spatial Interaction Rules card and sees "builder places, system never assigns." And it builds the wrong thing. It overbuilds. It builds the dream, not the release.

PATCH prevents that. AI reads the library cards, compares them against the Release 1 plan, and adds reality notes. "Release 1 uses a fixed ~30-40 position SVG grid. Infinite canvas deferred to Release 2." Now when a builder assembles a context constellation, the cards give correct guidance for *this* release.

There's a second scenario where PATCH matters. Sometimes we think a card is fine, AI builds from it, and during review we discover the card was actually incomplete or inconsistent. Maybe the Onboarding card references Mesa at the campfire, but Mesa's been replaced by Jarvis. That's a PATCH job. Fix the card, then the builder can try again with correct inputs.

PATCH is AI-driven with human approval. The AI does the checking. It reads the cards, reads the release plan, and spots the gaps. But a human confirms each patch before it's applied. We don't want AI silently rewriting our design knowledge.

Four specific cards need patches before Release 1 building starts: Hex Grid, Spatial Interaction Rules, Onboarding, and Onboarding Sequence.

### Station 3: MAKE

MAKE is where AI builds from clear blueprints. This is the station where things actually get produced. The input is a spec — either from a DECIDE result, a patched library card, or a SHAPE output — plus the assembled context constellation. The output is working code, usually as a pull request.

MAKE can run in parallel. Multiple tracks at once. Hex grid geometry, agent cleanup, LiveStore events, naming audit — all independent, all buildable simultaneously. The constraint is never AI throughput. It's always whether the inputs are ready.

The context constellation is critical here. Before AI starts a MAKE track, it assembles the relevant library cards, any patches that have been applied, and the relevant section of the release plan. This is the "incoming component quality verification" from the manufacturing checklist — making sure the inputs are correct before the station starts working.

MAKE items go through a QC gate (automated checks — linting, tests, type checking) and then human review. We'll talk about what happens at review in a minute.

### Station 4: SHAPE

SHAPE is the most interesting station because it handles the work that can't be specified in advance. It's for feel-dependent work. Things where you have to try it, experience it, and adjust.

"Does Jarvis sound warm?" You can't answer that from a document. You have to hear him speak. You have to read the words and feel something. AI drafts, a human feels, the human says "not quite," AI revises, and you loop until the human says "that's it."

SHAPE is where blueprints get *discovered*. Once the blueprint exists — once you know what "warm" sounds like for Jarvis — that spec flows into MAKE and gets built properly. SHAPE feeds MAKE.

Here's the fork in the road, and this is what the presentation showed on the "Two Kinds of Building" slide. After DECIDE and PATCH, every piece of work faces a question: do we know exactly what to build? If yes, go straight to MAKE. If no — if it needs taste, feel, iteration — go to SHAPE first, then to MAKE.

The campfire story is a SHAPE item. The Jarvis voice is a SHAPE item. The walk animation timing is a SHAPE item. Hex grid geometry is not — that's pure MAKE.

SHAPE is slower than MAKE by design. It has to be. You're discovering something, not executing a known spec. The danger is SHAPE items blocking MAKE tracks. That's why the release plan separates them: everything that can go straight to MAKE goes straight to MAKE, running in parallel, while SHAPE items iterate at human speed.

---

## [CHAPTER 4: FLOW STATES]

Every item on the board has a flow state. This is the "where is it right now" indicator. There are seven:

**Queued.** Waiting to enter a station. The work is defined but nobody's picked it up yet. Gray dot.

**On the Line.** Actively being worked. A builder — human or AI — is working on it right now. Green dot.

**Blocked (Andon).** The builder hit a problem and pulled the cord. Work has stopped. This is the most important flow state because it requires immediate attention. Red dot, pulsing. When you see red on the board, that's the thing to look at first.

**QC Gate.** Automated quality checks. Linting, tests, type checking. This happens automatically. If it passes, the item moves to Review. If it fails, it goes back to the builder for a fix. Yellow dot.

**Review.** A human examines the completed work. This is where the three review outcomes happen, which I'll explain in a second. Purple dot.

**Rework.** Didn't pass review. The builder is fixing it based on specific feedback. Orange dot.

**Shipped.** Done. Accepted. In production. Blue dot.

The flow states are the heartbeat of the board. You scan the colors and immediately know what's happening. Lots of gray? Work isn't getting started — maybe the upstream station is clogged. Lots of red? Multiple things are blocked — look for a systemic issue. Lots of green with nothing reaching blue? Things are being worked on but not finishing — check QC and Review.

---

## [CHAPTER 5: THE ANDON CORD]

This deserves its own section because it's the single most important behavior in the whole system.

In a Toyota factory, there's a cord running along the assembly line. Any worker can pull it. When they do, a light turns on, a signal sounds, and the line stops. Not just their station — the whole line. Because Toyota figured out that passing a defective part forward is more expensive than stopping everything to fix it now.

Our version: when a builder — AI or human — starts working on something and discovers the spec is missing a decision, they stop. They don't guess. They don't improvise. They don't build something close and hope it's right. They signal: "I need a decision from DECIDE." The item turns red. The right person sees it.

This is counter-intuitive. Most teams reward progress. Keep building, figure it out, ship something. But every time a builder guesses instead of stopping, you get one of two outcomes: rework (they guessed wrong) or an undetected defect (they guessed wrong and nobody caught it). Both are more expensive than the pause.

The discipline is: stop and signal. Don't pass the problem forward.

This also applies to PATCH. If AI starts building from a library card and realizes the card contradicts the release plan, that's an Andon pull. Stop building. Signal that the card needs a patch. Fix the input, then resume.

---

## [CHAPTER 6: THREE THINGS HAPPEN AT REVIEW]

Every completed item goes through human review. And one of three things happens:

**Ship.** "Looks good." It matches the spec, it works, it passes QC. Blue dot. Move on.

**Rework.** "Doesn't match the spec." The spec was clear, but the build didn't nail it. Maybe a visual is off, maybe a behavior is wrong, maybe an edge case was missed. The builder gets specific feedback and fixes it. Orange dot, back to the builder.

**ECO — Engineering Change Order.** "The spec itself was wrong." This is the interesting one. You review the completed work and realize: huh, we asked for the wrong thing. The decision we made at DECIDE was based on incomplete understanding. Now that we see the built version, we realize the spec needs to change.

ECO is not a failure. It's *learning*. Sometimes you can't know what you actually need until you see what you asked for. The item might still ship — but a new question goes back to DECIDE. The factory's specs get updated for next time.

In manufacturing, an ECO is a formal process. The engineering team revises the drawings, updates the bill of materials, and all downstream stations get the corrected spec. For us, it means the library card or the release plan gets updated, and any future builds from that spec use the corrected version.

ECO Rate — how often this happens — is one of our six dashboard metrics. A high ECO rate isn't a crisis, but it's a signal. It means we're discovering specs through building rather than through thinking. That might mean we should be using SHAPE more, or that DECIDE needs to go deeper before committing.

---

## [CHAPTER 7: THE SIX NUMBERS]

Alright, the dashboard. Six metrics. Each one answers one specific question about factory health.

### 1. Decision Velocity

**What it measures:** Decisions resolved per week at the DECIDE station.

**Why it matters:** This is the master metric. Everything downstream depends on decisions being made. If Decision Velocity is low, the factory starves. MAKE has nothing to build. SHAPE has nothing to iterate on. PATCH has nothing to check against.

**Healthy:** 5-6 decisions per week. Quick calls getting cleared in a single session, deeper decisions getting dedicated time.

**Unhealthy:** 1 decision per week. The queue is growing. Everything downstream is idle.

### 2. WIP Balance

**What it measures:** Distribution of work-in-progress across stations.

**Why it matters:** In manufacturing, an overloaded station creates a bottleneck that backs up the whole line. An empty station downstream means capacity is being wasted. You want relatively even distribution, with MAKE being the largest since it runs in parallel.

**Healthy:** A few items at each station, MAKE slightly fuller because it runs parallel tracks.

**Unhealthy:** 12 items in DECIDE, zero in MAKE, zero in SHAPE. The factory isn't building — it's waiting.

### 3. First-Pass Yield

**What it measures:** The percentage of items that ship on first review, without rework.

**Why it matters:** Rework is one of the eight wastes. Every rework cycle means the spec wasn't clear enough, or the context constellation was incomplete, or the builder missed something. First-Pass Yield is a direct measure of spec quality.

**Healthy:** 70-80%. Most things ship clean. Some rework is normal — you're not going to be perfect.

**Unhealthy:** 40%. More than half of everything needs revision. This means the upstream stations — DECIDE and PATCH — aren't producing clear enough specs. The fix isn't "build better." The fix is "specify better."

### 4. Blocked Count

**What it measures:** How many items are in the Blocked (Andon) state right now.

**Why it matters:** Every blocked item is a builder who stopped and signaled. One blocked item is normal — it means the system is working. Five blocked items is a systemic problem. Multiple builders are hitting the same kind of gap.

**Healthy:** 0-1 blocked items at any given time. Quick resolution.

**Unhealthy:** 5+ blocked items. Look for a shared root cause. Are they all waiting on the same decision? Are they all hitting the same library card gap?

### 5. ECO Rate

**What it measures:** The percentage of reviewed items where the spec was wrong (not just the build).

**Why it matters:** ECOs aren't failures, but they're expensive. They mean the factory built something, reviewed it, and discovered the spec needs changing. That's a full cycle wasted. A low ECO rate means our specs — our decisions and patches — are accurate. A high ECO rate means we're learning through building rather than through thinking.

**Healthy:** 10-15%. Some discoveries are inevitable — you learn by building.

**Unhealthy:** 40%. Nearly half of our specs are wrong. This means we should probably be using SHAPE more — iterate cheaply before committing to a MAKE build. Or DECIDE needs deeper consideration.

### 6. Cycle Time

**What it measures:** Average elapsed time from "queued" to "shipped."

**Why it matters:** This is the end-to-end speed of the factory. Not just how fast AI codes, but how fast the entire pipeline works — including decision time, patch time, review time, and any rework loops.

**Healthy:** 2-4 days for MAKE items, longer for SHAPE items (which iterate).

**Unhealthy:** 12+ days. Items are sitting somewhere for a long time. The question is *where*. Cycle time by itself doesn't tell you the cause — but combined with the flow state breakdown, it tells you exactly which stage items are getting stuck in.

---

## [CHAPTER 8: THE PLAYBOOK]

Now the part that makes this actionable. When a number goes red, what do you actually *do*?

**Decision Velocity low → Clear the DECIDE queue.** This is almost always the fix for a slow factory. Danvers, Jess, sit down, make calls. Quick decisions first. The queue has the questions already written with recommended answers. Don't research — decide.

**WIP piling up at one station → Stop starting, start finishing.** Find the overloaded station and focus on clearing it. Don't add more items to the queue — finish what's in progress. In manufacturing they call this "stop the line to fix the line." It feels counterintuitive to stop starting new work, but unfinished work is inventory, and inventory is waste.

**First-Pass Yield dropping → Invest upstream.** Specs aren't clear enough. Spend more time in DECIDE making precise decisions. Spend more time in PATCH ensuring library cards match Release 1 reality. The fix for bad outputs is always better inputs.

**Blocked Count rising → Look for a shared root cause.** Multiple red lights usually point to a systemic gap. Maybe there's a fundamental decision that hasn't been made and everything downstream needs it. Maybe a whole section of the library is outdated. Find the common thread and fix it once.

**ECO Rate high → Use SHAPE more.** If specs keep being wrong, it means you're trying to specify things that need to be felt. Route more work through SHAPE first — iterate cheaply, discover the real spec, then send it to MAKE.

**Cycle Time creeping → Find the stuck stage.** Break down cycle time by flow state. If items spend 8 of 12 days in "Queued" at DECIDE, the fix is Decision Velocity. If they spend 8 days in "Rework," the fix is First-Pass Yield. Cycle time is the symptom — the other metrics tell you the cause.

---

## [CHAPTER 9: PUTTING IT ALL TOGETHER]

So here's how a typical week looks in the factory model.

Monday. You look at the board. There are four decisions queued in DECIDE. Two PATCH items ready for review. Three MAKE tracks running in parallel. One SHAPE item in iteration.

You and I sit down and clear two quick decisions. Twenty minutes. Those decisions immediately unblock two MAKE tracks. AI starts building within the hour.

You review the two PATCH items. One looks good — the library card now correctly reflects Release 1 scope. The other needs a small tweak. You note it, AI revises, you approve. Patched cards feed into the context constellations for tomorrow's MAKE tracks.

The SHAPE item — let's say it's Jarvis's campfire voice — you read the latest draft. It's closer but still too formal. You give a note: "More like a friend who happens to be wise. Less like a therapist." AI revises. Another loop tomorrow.

Wednesday. A MAKE track finishes. QC passes automatically. You review. It's good — ship it. Blue dot.

Another MAKE track finishes. You review. The hex grid renders correctly but the category colors don't match the Standard - Life Categories card. Rework. Specific feedback: "Use the exact hex codes from the standard."

Friday. You look at the dashboard. Decision Velocity: 4 this week. WIP Balance: reasonable. First-Pass Yield: 75% (one rework out of four reviews). Blocked Count: 1 (waiting on D5, the campfire story structure). ECO Rate: 0 this week. Cycle Time: averaging 3 days.

The blocked item tells you exactly what to focus on next week: D5. The campfire story structure decision. That's the big one. When it clears, three more tracks unlock.

---

## [CHAPTER 10: WHY THIS IS DIFFERENT FROM "JUST USING GITHUB PROJECTS"]

We are, technically, using GitHub Projects. The board lives at github.com/orgs/sociotechnica-org/projects/4. Same tool. But the model on top of it is completely different from how most teams use GitHub.

Most teams use GitHub Issues as tasks. Status columns. One dimension: done or not done.

We're using two custom dimensions that change everything:

**Station** tells you *what kind of work* this is. DECIDE, PATCH, MAKE, or SHAPE. It tells you who can act on it and what the work involves.

**Flow State** tells you *where in the process* this work is right now. Queued, On the Line, Blocked, QC Gate, Review, Rework, or Shipped.

Station x Flow State gives you a matrix. You can see that there are two items in MAKE/On the Line, one item in DECIDE/Queued, and one item in SHAPE/Blocked. That's a completely different picture than "3 items In Progress."

You can switch between the factory view and the traditional view. Same data, two lenses. The factory view asks "where's the bottleneck?" The traditional view asks "what's the status?" Both are useful. But the factory view tells you what to *do* about it.

---

## [CHAPTER 11: THE MANUFACTURING CHECKLIST — WHAT WE BORROWED]

One more thing I want to touch on. We started this whole exercise from a manufacturing assembly station checklist. The kind of checklist you'd see posted at a station in a Toyota factory. And it had five sections: Inputs, Station Environment, Processes, Outputs, and Meta-Level.

Here's how each section translates to our world:

**Inputs — What Arrives at the Station.** In manufacturing: correct parts, verified quality, clear specs. For us: the context constellation. Before AI starts a MAKE track, it assembles the right library cards, applies any patches, includes the release plan section, and verifies everything is consistent. "Incoming quality verified" becomes "context constellation reviewed for Release 1 accuracy."

**Station Environment — The Workspace Itself.** In manufacturing: tools calibrated, workspace organized, error-proofing in place. For us: the AI's prompt, the tooling, the codebase state. Is the prompt up to date? Is the development environment clean? Are the linting rules and tests catching errors before review? This is our poka-yoke — our error-proofing.

**Processes — What Happens at the Station.** In manufacturing: standard work execution, cycle time tracking, self-inspection. For us: the AI follows a defined process (assemble context, build, run QC, submit for review). The process is the same every time. That's what makes it reliable.

**Outputs — What Leaves the Station.** In manufacturing: quality-verified product, staged for next station, traceability documentation. For us: a pull request with passing tests, clear description, linked to the right issue, ready for human review.

**Meta-Level — Station Within the System.** In manufacturing: capacity alignment, continuous improvement, integration with the line. For us: the six dashboard metrics. Are we improving over time? Is the factory getting more efficient? Are the specs getting clearer? Is the cycle time decreasing?

The translation isn't perfect — we're building software, not cars. But the principles are the same: clear inputs, standardized process, quality-verified outputs, and continuous improvement.

---

## [CLOSING]

Here's the thing about all of this, Jess. We're a two-person team with AI. We have an unusual amount of build capacity — more than we can feed with decisions. That's a good problem to have, but only if we recognize it.

The factory model makes the real constraint visible. It's not engineering. It's never engineering. It's decisions. It's the human things — taste, vision, judgment, the stuff AI genuinely can't do.

So the whole system is designed around one idea: clear the human work as fast as possible, so the machines can build. Not because speed is the point — but because the magic we're trying to create (that 72-hour win, that campfire moment, that feeling of "this is mine, I built this") requires both human soul and machine execution working in rhythm.

The factory doesn't replace creativity. It protects it. By making the process visible, by giving every piece of work a clear station and a clear flow state, by stopping when something's wrong instead of guessing — we create space for the creative work (SHAPE, DECIDE) to happen at human speed while the mechanical work (MAKE, PATCH) runs at machine speed.

That's the factory. That's how we build Release 1.

---

*End of companion podcast.*
