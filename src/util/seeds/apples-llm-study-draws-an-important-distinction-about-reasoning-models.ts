export const applesLlmStudyDrawsAnImportantDistinctionAboutReasoningModels = `# Apple's LLM study draws important distinction on reasoning models - 9to5Mac
## By Marcus Mendes

There's a [new Apple research paper](https://9to5mac.com/2025/06/09/approaching-wwdc-apple-researchers-dispute-claims-that-ai-is-capable-of-reasoning/) making the rounds, and if you've seen the reactions, you'd think it just toppled the entire LLM industry. That is far from true, although it might be the best attempt to bring to the mainstream a discussion that the ML community has been having for ages. Here is why this paper matters.

The paper in question, [The Illusion of Thinking: Understanding the
Strengths and Limitations of Reasoning Models via the Lens of Problem
Complexity](https://machinelearning.apple.com/research/illusion-of-thinking),
is certainly interesting. It systematically probes so-called Large
Reasoning Models (LRMs) like Claude 3.7 and DeepSeek-R1 using controlled
puzzles (Tower of Hanoi, Blocks World, etc.), instead of standard math
benchmarks that often suffer from data contamination.

The results? LRMs do better than their LLM cousins at medium complexity
tasks, but collapse just as hard on more complex ones. And worse, as
tasks get harder, these "reasoning" models start thinking less, not
more, even when they still have token budget left to spare.

But while this paper is making headlines as if it just exposed some deep
secret, I'd argue: none of this is new. It's just clearer now, and
easier for the wider public to understand. That, in fact, is great news.

## What the paper shows

The headline takeaway is that models marketed for "reasoning" still fail
on problems a patient child can master. In the Tower of Hanoi, for
example, models like Claude and o3-mini fall apart after seven or eight
disks. And even when given the exact solution algorithm and asked to
simply follow it, performance doesn't improve.

In other words, they aren't reasoning, but rather iteratively extending
LLM inference patterns in more elaborate ways. That distinction matters,
and it's the real value of the Apple paper. The authors are pushing back
on loaded terms like "reasoning" and "thinking," which suggest symbolic
inference and planning when what's actually happening is just a layered
pattern extension: the model runs multiple inference passes until it
lands on something that sounds plausible.

This is not exactly a revelation. Meta's AI Chief Yann LeCun has long
claimed that today's LLMs are [less
smart](https://observer.com/2024/02/metas-a-i-chief-yann-lecun-explains-why-a-house-cat-is-smarter-than-the-best-a-i/)
than house cats, and has been vocal that AGI won't come from
Transformers. [Subbarao Kambhampati](https://cotopaxi.eas.asu.edu/) has
published for years about how "chains of thought" don't correspond to
how these models actually compute. And [Gary
Marcus](https://garymarcus.substack.com/p/a-knockout-blow-for-llms),
well, his long-held "deep learning is hitting a wall" thesis gets
another feather in its cap.

## Pattern matching, not problem solving

The study's most damning data point might be this: when complexity goes
up, models literally stop trying. They reduce their own internal
"thinking" as challenges scale, despite having plenty of compute budget
left. This isn't just a technical failure, but rather a conceptual one.

What Apple's paper helps clarify is that many LLMs aren't failing
because they "haven't trained enough" or "just need more data." They're
failing because they fundamentally lack a way to represent and execute
step-by-step algorithmic logic. And that's not something
chain-of-thought prompting or reinforcement fine-tuning can brute-force
away.

To quote the paper itself: "LRMs fail to use explicit algorithms and
reason inconsistently across puzzles." Even when handed a solution
blueprint, they stumble.

## So... Is This Bad News?

Yes. Just not *new* news.

These results don't come as a big surprise to anyone deeply embedded in
the ML research community. But the buzz they've generated highlights
something more interesting: the wider public might finally be ready to
grapple with distinctions the ML world has been making for years,
particularly around what models like these can and *can't* do.

This distinction is important. When people call these systems
"thinking," we start treating them as if they can replace things they're
currently incapable of doing. That's when the hallucinations and logic
failures go from interesting quirks to dangerous blind spots.

This is why Apple's contribution matters. Not because it "exposed" LLMs,
but because it helps draw clearer lines around what they are and what
they're not. And that clarity is long overdue.

**Update:** A previous version of this text stated that Yann LeCun had
compared current LLMs to house cats. In fact, his claim is that today's
LLMs are *less capable* than house cats. The text has been revised to
better reflect his position.
`
