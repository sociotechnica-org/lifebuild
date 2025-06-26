export const theGapThroughWhichWePraiseTheMachine = `# The Gap Through Which We Praise the Machine
## By Ferd

In this post I'll expose my current theory of agentic programming:
people are amazing at adapting the tools they're given and totally
underestimate the extent to which they do it, and the amount of skill we
build doing that is an incidental consequence of how badly the tools are
designed.

I'll first cover some of the drive behind AI assistant adoption in
software, the stochastic-looking divide in expectations and
satisfactions with these tools, and the desire to figure out an
explanation for that phenomenon.

I'll then look at what successful users seem to do, explore the type of
scaffolding and skills they need to grow to do well with LLMs when
coding or implementing features. By borrowing analytical ideas from
French Ergonomists, I'll then explain how this extensive adaptive work
highlights a gap in interaction design from AI tool builders, which is
what results in tricky skill acquisition.

Basically, things could be much better if we spent less time
congratulating machines for the work people do and we instead supported
people more directly.

### Money Claps for Tinkerbell, and so Must You

A few months ago, Charity Majors and I gave the [closing plenary talk at
SRECon
Americas 2025](https://www.usenix.org/conference/srecon25americas/presentation/majors).
While we were writing the talk, trying to thread a needle between
skepticism and optimism, Charity mentioned one thing I hadn't yet
understood by then but was enlightening: investors in the industry
already have divided up companies in two categories, pre-AI and post-AI,
and they are asking "what are you going to do to not be beaten by the
post-AI companies?"

The usefulness and success of using LLMs are axiomatically taken for
granted and the mandate for their adoption can often come from above
your CEO. Your execs can be as baffled as anyone else having to figure
out where to jam AI into their product. Adoption may be forced to keep
board members, investors, and analysts happy, regardless of what
customers may be needing.

It does not matter whether LLMs can or cannot deliver on what they
promise: people calling the shots assume they can, so it's gonna happen
no matter what. *I'm therefore going to bypass any discussion of the
desirability, sustainability, and ethics of AI* here, and jump directly
to "well you gotta build with it anyway or find a new job" as a premise.
My main focus will consequently be on people who engage with the tech
based on these promises, and how they do it. There's a wide spectrum
where at one end you have "true believers," and at the other you have
people convinced of the opposite---that this is all fraudulent shit that
can't work.

In practice, what I'm seeing is a bunch of devs who derive real value
from it at certain types of tasks and workflows ranging from
copilot-as-autocomplete to full agentic coding, and some who don't and
keep struggling to find ways to add LLMs to their workflows (either
because they must due to some top-down mandate, or because they fear
they'll be left behind if they don't[1](#footnote-1){#footref-1}). I can
also find no obvious correlation between where someone lands on that
spectrum and things like experience levels; people fall here and there
regardless of where they work, how much trust I have in their ability,
how good they are at communicating, how much of a hard worker they are,
or how willing to learn they might be.

### A Theory of Division

So where does that difference come from? It could be easy to assign
dissatisfaction to "you just gotta try harder", or "some people work
differently", or "you go fast now but you are just creating more
problems for later." These all may be true to some degree, and the
reality is surely a rich multifactorial mess. We also can't ignore
broader social and non-individual elements like the type of
organizational culture people evolve in,[2](#footnote-2){#footref-2} on
top of variations that can be seen within single teams.

My gut feeling is that, on top of all the potential factors already
identified, people underestimate their own situatedness (how much they
know and interpret and adjust from "thing I am told to build" and tie
that to a richer contextualized "thing that makes sense to build" by
being connected participants in the real world and the problem space)
and how much active interpretation and steering work they do when using
and evaluating coding assistants.[3](#footnote-3){#footref-3} Those who
feel the steering process as taxing end up having a worse time and blame
the machine for negative outcomes; those for whom it feels easy in turn
praise the machine for the positive results.

This tolerance for steering is likely moderated or amplified by elements
such as how much people trust themselves and how much they trust the AI,
how threatened they might feel by it, their existing workflows, the
support they might get, and the type of "benchmarks" they choose (also
influenced by the preceding factors).[4](#footnote-4){#footref-4}

I'm advancing this theory because the people I've seen most excited and
effective about agentic work were deeply involved in constantly
correcting and recognizing bugs or loops or dead ends the agent was
getting into, steering them away from it, while also adding a bunch of
technical safeguards and markers to projects to try and make the agents
more effective. When willingly withholding these efforts, their agents'
token costs would double as they kept growing their context windows
through repeating the same dead-end patterns; oddities and references to
non-existing code would accumulate, and the agents would increasingly do
unhinged stuff like removing tests they wrote but could no longer pass.

I've seen people take the blame for that erratic behavior on themselves
("oh I should have prompted in *that* way instead, my bad"), while
others would just call out the agent for being stupid or useless.

The early frustration I have seen (and felt) seems to be due to hitting
these road blocks and sort of going "wow, this sucks and isn't what was
advertised." If you got more adept users around you, they'll tell you to
try different models, tweak bits of what you do, suggest better prompts,
and offer jargon-laden workarounds.

![remake of the old comic strip telling the user to \'write a map-reduce
in Erlang\' to query the DB and resulting in \'Did you just tell me to
go fuck myself?\' and \'I believe I did, Bob.\' This version has the
first character ask \'How do I make the AI learn things?\', with the
response \'It doesn\'t it grows stateless context\'. The next panel has
the character clarifying \'ok, it doesn\'t. How do I make it remember?\'
to which the other responds \'You have to use the LLM as its own MCP
server!\', which leads to an unchanged original panel (\'\... I believe
I did, Bob\')](https://ferd.ca/static/img/llm-as-its-own-mcp-server.jpg)

That gap between "what we are told the AI can do" and "what it actually
does out of the box" is significant. To bridge that gap, engineers need
to do a lot of work.

### The Load-bearing Scaffolding of Effective Users

There are tons of different artifacts, mechanisms, and tips and tricks
required to make AI code agents work. To name a few, as suggested by
vendors and multiple blog posts, you may want to do things such as:

- Play and experiment with multiple models, figure out which to use and
  when, and from which interfaces, which all can significantly change
  your experience.
- Agent-specific configuration files (such as
  [CLAUDE.md](https://www.anthropic.com/engineering/claude-code-best-practices),
  [AGENTS.md](https://agentsmd.net/), or other [rule
  files](https://windsurf.com/editor/directory)) that specify project
  structure, commands, style guidelines, testing strategies,
  conventions, potential pitfalls, and other information. There can be
  one or more of them, in multiple locations, and adjusted to specific
  users.
- Optimize your prompts by adding personality or character traits and
  special role-play instructions, possibly relying on [prompt
  improvers](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-improver).
- Install or create [MCP servers](https://modelcontextprotocol.io/) to
  extend the abilities of your agents. Some examples can include file
  management or source control, but can also do stuff like giving access
  to production telemetry data or issue trackers.
- Use files as memory storage for past efforts made by the agent.
- Specify
  [checkpoints](https://docs.devin.ai/essential-guidelines/instructing-devin-effectively#set-checkpoints)
  and [manage
  permissions](https://docs.anthropic.com/en/docs/claude-code/security)
  to influence when user input may be required.
- Monitor your [usage and
  cost](https://docs.anthropic.com/en/docs/claude-code/monitoring-usage).

There are more options there, and each can branch out into lots of
subtle qualitative details: workarounds for code bases too large for the
model's context, defining broader evaluation strategies, working around
cut-off dates, ingesting docs, or all preferences around specific
coding, testing, and interaction methods. Having these artifacts in
place can significantly alter someone's experience. Needing to come up
with and maintain these could be framed as increasing the effort
required for successful adoption.

I've seen people experimenting, even with these elements in place,
failing to get good results, and then being met with "yeah, of course,
that's a terrible prompt" followed with suggestions of what to improve
(things like "if the current solution works, say it works so the agent
does not try to change it", asking for real examples to try and prevent
fake ones, or being [more or less
polite](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5165270)).

For example, a coworker used a prompt that, among many other
instructions, had one line stating "use the newest version of
\`<component>\` so we can use \`<feature>\`". The agent ignored that
instruction and used an older version of the component. My coworker
reacted by saying "I set myself up for refactoring by not specifying the
exact version."

From an objective point of view, asking for the newest version of the
component is a very specific instruction: only one version is the
newest, and the feature that was specified only existed in that version.
There is no ambiguity. Saying "version \`$X.0\`" is semantically the same.
But my coworker knew, from experience, that a version number would yield
better results, and took it on themselves to do better next time.

These interactions show that engineers have internalized a complex set
of heuristics to guide and navigate the LLM's idiosyncrasies. That is,
they've built a mental model of complex and hardly predictable agentic
behavior (and of how it all interacts with the set of rules and
artifacts and bits of scaffolding they've added to their repos and
sessions) to best predict what will or won't yield good results, and
then do extra corrective work ahead of time through prompting
variations. This is a skill that makes a difference.

That you need to do these things might in fact point at how agentic AI
does not behave with cognitive fluency,[5](#footnote-5){#footref-5} and
instead, the user subtly does it on its behalf in order to be
productive.

Whether you will be willing to provide that skill for the machine may
require a mindset or position that I'll caricature as "I just need to
get better", as opposed to taking a stance of "the LLM needs to get
better". I suspect this stance, whether it is chosen deliberately or
not, will influence how much interaction (and course-correcting) one
expects to handle while still finding an agent useful or helpful.

I don't know that engineers even realize they're doing that type of
work, that they're essential to LLMs working for code, that the tech is
fascinating but maybe not that useful without the scaffolding and
constant guidance they provide. At least, people who speak of AI
replacing engineers probably aren't fully aware that while engineers
could maybe be doing more work through assisting an agent than they
would do alone, agents would still not do good work without the
engineer. AI is [normal
technology](https://knightcolumbia.org/content/ai-as-normal-technology),
in that its adoption, propagation, and the efforts to make it work all
follow predictable patterns. LLMs, as a piece of tech, mainly offer some
unrealized potential.

It may sound demeaning, like I'm implying people lack awareness of their
own processes, but it absolutely isn't. The process of adaptation is
often not obvious, even to the people doing it. There are lots of
strategies and patterns and behaviors people pick up or develop tacitly
as a part of trying to meet goals. Cognitive work that gets deeply
ingrained sometimes just feels effortless, natural, and obvious. Unless
you're constantly interacting with newcomers, you forget what you take
for granted---you just know what you know and get results.

By extension, my supposition is that those who won't internalize the
idiosyncrasies and the motions of doing the scaffolding work are
disappointed far more quickly: they may provide more assistance to the
agent than the agent provides to them, and this is seen as the AI
failing to improve their usual workflow and to deliver on the wonders
advertised by its makers.

### The Gap Highlighted Through Adaptive Work

What AI sells is vastly different from what it delivers, particularly
what it delivers out of the box. In their study of the difference
between [work-as-imagined (WAI) and work-as-done
(WAD)](https://humanisticsystems.com/2016/12/05/the-varieties-of-human-work/),
ergonomists and resilience engineers have developed a useful framing
device to understand what's going on.

Work-as-imagined describes the work as it is anticipated or expected to
happen, how it can be specified and described. The work-as-done
comprises the work as it is carried out, along with the supporting
tasks, deviations, meanings, and their relationships to the prescribed
tasks.

By looking at how people turn artifacts they're given into useful tools,
we can make sense of that gap.[6](#footnote-6){#footref-6} This
adjustment ends up transforming both the artifacts (by modifying and
configuring them) and the people using them (through learning and by
changing their behavior). The difference between the original artifact
developed by the people planning the work and the forms that end up
effectively used in the field offer a clue of the mismatch between WAI
and WAD.

Tying this back to our LLM systems, what is imagined is powerful agents
who replace engineers (at least junior ones), make everyone more
productive, and that will be a total game changer. LLMs are artifacts.
The scaffolding we put in place to control them are how we try to
transform the artifacts into tools; the learning we do to get better at
prompting and interacting with the LLMs is part of how they transform
us. If what we have to do to be productive with LLMs is to add a lot of
scaffolding and invest effort to gain important but poorly defined
skills, we should be able to assume that what we're sold and what we get
are rather different things.

That gap implies that better designed artifacts could have better
affordances, and be more appropriate to the task at hand. They would be
easier to turn into productive tools. A narrow gap means fewer
adaptations are required, and a wider gap implies more of them are
needed.

Flipping it around, we have to ask whether the amount of scaffolding and
skill required by coding agents is acceptable. If we think it is, then
our agent workflows are on the right track. If we're a bit baffled by
all that's needed to make it work well, we may rightfully suspect that
we're not being sold the right stuff, or at least stuff with the right
design.

### Bad Interaction Design Demands Greater Coping Skills

I fall in the baffled camp that thinks better designs are possible. In a
fundamental sense, LLMs can be assumed to be there to impress you. Their
general focus on anthropomorphic interfaces---just have a chat!---makes
them charming, misguides us into attributing more agency and
intelligence than they have, which makes it even more challenging for
people to control or use them predictably.
[Sycophancy](https://arxiv.org/html/2411.15287v1) is one of the many
challenges here, for example.

Coding assistants, particularly agents, are narrower in their interface,
but they build on a similar interaction model. They aim to look like
developers, independent entities that can do the actual work. The same
anthropomorphic interface is in place, and we similarly must work even
harder to peel the veneer of agency they have to properly predict them
and apply them in controlled manners.

You can see the outline of this when a coding agent reaches limits it
has no awareness of, like when it switches from boilerplate generation
(where we're often fine letting it do its thing) to core algorithms
(where we want involvement to avoid major refactors) without proper
hand-offs or pauses. Either precise prompting must be done to preempt
and handle the mode switch, or we find the agent went too far and we
must fix (or rewrite) buggy code rather than being involved at the right
time.

And maybe the issue is prompting, maybe it's the boilerplatey nature of
things, maybe it's because there was not enough training material for
your language or framework. Maybe your config files aren't asking for
the right persona, or another model could do better. Maybe it's that we
don't even know what exactly is the boundary where our involvement is
more critical. Figuring that out requires skill, but also it's kind of
painful to investigate as a self-improvement workflow.

Coding agents require the scaffolding, learning, and often demand more
attention than tools, but are built to look like teammates. This makes
them both unwieldy tools and lousy teammates. We should either have
agents designed to look like a teammate properly act like a teammate,
and barring that, have a tool that behaves like a tool. This is the
point I make in [AI: Where in the Loop Should Humans
Go?](https://ferd.ca/ai-where-in-the-loop-should-humans-go.html), where
a dozen questions are offered to evaluate how well this is done.

Key problems that arise when we're in the current LLM landscape include:

- AI that aims to improve us can ironically end up deskilling us;
- Not knowing whether we are improving the computers or augmenting
  people can lead to unsustainable workflows and demands;
- We risk putting people in passive supervision and monitoring roles,
  which is known not to work well;
- We may artificially constrain and pigeonhole how people approach
  problems, and reduce the scope of what they can do;
- We can adopt known anti-patterns in team dynamics that reduce overall
  system efficiency;
- We can create structural patterns where people are forced to become
  accountability scapegoats.

Hazel Weakly comes up with related complaints in [Stop Building AI Tools
Backwards](https://hazelweakly.me/blog/stop-building-ai-tools-backwards/),
where she argues for design centered on collaborative learning patterns
(Explain, Demonstrate, Guide, Enhance) to play to the strengths that
make people and teams effective, rather than one that reinforces people
into being ineffective.

Some people may hope that better models will eventually meet
expectations and narrow the gap on their own. My stance is that rather
than anchoring coding agent design into ideals of science fiction
(magical, perfect workers granting your wishes), they should be grounded
in actual science. The gap would be narrowed much more effectively then.
AI tool designers should study how to integrate solutions to existing
dynamics, and plan to align with known strength and limitations of
automation.

### We Oversell Machines by Erasing Ourselves

Being able to effectively use LLMs for programming demands a lot of
scaffolding and skills. The skills needed are, however, poorly defined
and highly context dependent, such that we currently don't have great
ways of improving them other than long periods of trial and
error.[7](#footnote-7){#footref-7}

The problem is that while the skills are real and important, I would
argue that the level of sophistication they demand is an accidental
outcome of poor interaction design. Better design, aimed more closely to
how real work is done, could drastically reduce the amount of
scaffolding and learning required (and increase the ease with which
learning takes place).

I don't expect my calls to be heard. Selling sci-fi is way too
effective. And as long as the AI is perceived as the engine of a new
industrial revolution, decision-makers will imagine it can do so, and
task people to make it so.

Things won't change, because people are adaptable and want the system to
succeed. We consequently take on the responsibility for making things
work, through ongoing effort and by transforming ourselves in the
process. Through that work, we make the technology appear closer to what
it promises than what it actually delivers, which in turn reinforces the
pressure to adopt it.

As we take charge of bridging the gap, the machine claims the praise.

------------------------------------------------------------------------

[1](#footref-1): Dr. Cat Hicks has shared some [great research on
factors related to
this](https://www.drcathicks.com/post/new-research-from-me-ai-skill-threat-contest-cultures-on-software-teams),
stating that competitive cultures that assume brilliance is innate and
internal tend to lead to a much larger perceived threat from AI
regarding people's skills, whereas learning cultures with a sense of
belonging lowered that threat. Upskilling can be impacted by such
threats, along with other factors described in the summaries and [the
preprint](https://osf.io/preprints/psyarxiv/2gej5_v2).

[2](#footref-2): Related to the previous footnote, Dr. Cat Hicks here
once again shares research on [cumulative
culture](https://osf.io/preprints/psyarxiv/tfjyw_v1), a framing that
shows how collaborative innovation and learning can be, and offers an
alternative construct to individualistic explanations for software
developers' problem solving.

[3](#footref-3): A related concept might be [Moravec's
Paradox](https://en.wikipedia.org/wiki/Moravec%27s_paradox). Roughly,
this classic AI argument states that we tend to believe higher order
reasoning like maths and logic is very difficult because it *feels*
difficult to us, but the actually harder stuff (perception and whatnot)
is very easy to us because we're so optimized for it.

[4](#footref-4): The concept of self-trust and AI trust is explored in
[The Impact of Generative AI on Critical
Thinking](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf)
by HPH Lee and Microsoft Research. The impact of AI skill threat is
better defined in [the research in footnote 1](#footnote-1). The rest is
guesswork.

The guess about "benchmarks" is based on observations that people may
use heuristics like checking how it does at things you're good at to
estimate how you can trust it at things you've got less expertise on.
This can be a useful strategy but can also raise criteria for elements
where expertise may not be needed (say, boilerplate), and high
expectations can lay the groundwork for easier disappointment.

[5](#footref-5): The [Law of
Fluency](https://github.com/lorin/resilience-engineering/blob/master/laws.md#law-of-fluency)
states that *Well-adapted cognitive work occurs with a facility that
belies the difficulty of resolving demands and balancing dilemmas*,
basically stating that if you've gotten good at stuff, you make it look
a lot easier than it actually is to do things.

[6](#footref-6): This idea comes from [a recent French ergonomics
paper](https://ferd.ca/notes/paper-when-resilience-engineering-questions-ergonomics.html).
It states that "Artifacts represent for the worker a part of the
elements of WAI. These artifacts can become tools only once the workers
become users, when they appropriate them. \[Tools\] are an aggregation
of artifacts (WAI) and of usage schemas by those who use them in the
field (WAD)."

[7](#footref-7): One interesting anecdote here is hearing people say
they found it challenging to switch from their personal to corporate
accounts for some providers, because something in their personal
sessions had made the LLMs work better with their style of prompting and
this got lost when switching.\
Other factors here include elements such as how [updating models can
significantly impact user
experience](https://openai.com/index/expanding-on-sycophancy/), which
may point to a lack of stable feedback that can also make skill
acquisition more difficult.
`
