---
title: 'Writing the README for the agent'
description: 'What I put into llms.txt so an agent can use a spec without being coached, and what three test runs of the aap-map skill on repositories I do not own taught me about writing instructions for agents.'
cover: 'terrain'
pubDate: 2026-11-05
seoTitle: 'llms.txt and a tested skill: writing instructions for the agent that reads your spec'
series: 'aap'
seriesOrder: 3
tags: ['ai', 'agents', 'aap', 'llms-txt', 'skills']
---

When I shared the AAP repository with colleagues, I assumed that people would read it with their own LLM and decide for themselves. In practice the questions came to me, because the repository is hard to read on a first pass for anyone, human or not. The README explains an idea, the spec is normative and terse, and the cookbook holds optional profiles, so a newcomer (or an agent acting for one) has to guess which of those pages is the mandatory one. I told that part of the story briefly in [the first post](/blog/a-map-instead-of-more-context/). This post covers the two things I built so that people could ask the agent and not me: a page written for the agent to read, and a skill that writes the first map. Both are small, and both taught me something about writing instructions for an agent that I would not have guessed from writing for people.

## A page for the reader that will act

The file is `llms.txt` at the root of the repository ([llms.txt at v0.3.0](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/llms.txt)). I asked Claude to write the first version, and it ended up with three kinds of content that a README usually mixes together.

The first is a definition with its negatives. The opening says what AAP is, a checked-in map that tells an agent where things live, and in the same paragraph what it is not: a context engine, RAG, an agent framework, a dependency graph or an authorization system. For a human reader the negatives are a courtesy, whereas I expect an agent to fill the gap with the nearest familiar category, which for "context file for agents" is a retrieval system.

The second is a list of steps, and these are the reading levels from the spec ([SPEC.md, "Progressive disclosure"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md)) rewritten as instructions. In the spec they are a table of four levels with a "when" column. In `llms.txt` they became orders with a gate between each pair, abridged here:

```text
2. Read that one file. That is the whole orientation step (level L0).
   Do not open anything else yet.
3. Pick one `layout` key or one `nodes` entry for the task, and open
   only that path (L1).
4. Open a single durable artifact only if the task needs durable memory (L2).
   Use normal code tools for the rest (L3).
5. A node with a `map` pointer is a hop you may take on purpose.
   Never open linked maps recursively "to be safe".
6. Do not fetch this upstream repository or read SPEC.md at session start.
```

The phrase "do not open anything else yet" is the gate. A table tells a reader that L1 comes after L0, but it does not tell an agent to stop at L0, and an agent that has been told to be thorough will read the next level just in case. The sentence about "to be safe" is there for the same reason. The repository keeps a note on exactly this mistake ([examples/invalid/anti-recursive-preload.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/examples/invalid/anti-recursive-preload.md)). A session makes it by reading the shell map first, then every child map it points to, then the spec and the catalogs. Only after that does it begin the task. That is the context pollution the whole format exists to avoid, and it is the natural reading of "orient yourself first". Step 6 closes the loop on the spec itself, because the local map is the source of truth for the checkout and the spec is for the moments when a rule is in doubt.

The third kind of content is the handful of rules an agent would otherwise get wrong. The `access` section says in six lines what a missing flag means, which entry is the write home when a key lists several paths, and that when no entry is writable the agent should stop and ask. It also says, near the end, that all of this is a coordination fence and that real enforcement is Git permissions, CODEOWNERS and protected branches. I put the disclaimer in the agent's file and not only in the spec because an agent that believes `read-only` is a permission system will explain it to the user as one.

One more detail that I think matters is the pin. The file tells the agent to use the tag `v0.3.0` and not to read the default branch as authoritative. This is the same advice as in the schema-pinning cookbook ([cookbook/schema-pinning.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/schema-pinning.md)) applied to the reader of the page and not to CI.

The README of the repository now offers the link as the no-install route: give your LLM the URL, ask it to explain AAP or to work in a repository that has a map, and it will read the one page. I have not measured whether the questions to me went down, and the repository does not record a test of `llms.txt` of the kind described next, so what I can say is limited to what the page contains.

## A skill, tested on projects I do not own

The second thing was a skill that drafts the map, `aap-map` ([SKILL.md at v0.3.0](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/skills/aap-map/SKILL.md)). I first wrote it in our team repository, and that was the problem: a skill written from one private setup carries the setup's assumptions in places the author cannot see. So on 2026-10-28 I tested it on three public projects of different shapes. They were cloned shallow into a scratch directory: chalk (a small JavaScript library), requests (a Python library with a `src/` layout and Sphinx docs) and changesets (a pnpm TypeScript monorepo with 21 packages). In each run a fresh agent received only `SKILL.md` and followed it literally, and a separate reviewer read the skill afterwards looking for assumptions inherited from the private original. The notes are in [docs/skill-tests.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/docs/skill-tests.md).

The first change was a decision and not a finding of the runs. The first version bundled a schema and a validator, and I cut the skill down to a single text file, because the validator added install friction and little value at install time. The skill now says plainly that it runs no tool. Its report ends with a line saying the map was read against a field list by hand, so it never claims the map is "validated".

The runs then turned up ten things, and the five below are the ones I would expect to apply to any skill that writes configuration. The full list is in the test notes.

| What happened | What I changed |
|---|---|
| A flow-style YAML example with a comma in a description split the value, and the validator gave a confusing error | The example is block style and descriptions are quoted |
| `code` could be `src/` or `src/requests/` | Pick the folder that holds the code and check with `ls` |
| 21 packages, and layout paths do not support globs | Use the parent folder |
| A docs website and a folder of working notes competed for `artifacts` | `artifacts` is working notes only, and the skill does not create a folder for it |
| A branch of the same repository was mentioned in a README | Not a node |

The reviewer's findings were of a different kind, and I could not have found them myself. They were: do not assume the project uses git, do not guess `locator.repo` or a host, and require written evidence before marking anything `read-only` (a folder name alone is not evidence). The reviewer also asked for ids slugified without reordering words, for the map to be edited as text so that comments survive, and for the skill never to overwrite a map or create a second one. The node rule came from the same pass. A node is admitted only when the skill can name a reason and point at evidence in the repository. Examples are a runtime client config, a schema or API definition that this repository consumes, or a named source of truth for requirements. In none of the three runs did the agent admit a node, which is the intended result for standalone repositories and also means that the positive case went untested.

Two design choices follow from the same lesson. Anything the skill is unsure of gets a `# REVIEW:` comment on that line and a mention in the report, so the human reads the guesses and not the whole file. The skill also does not interview the user, because a question that can be answered by looking at the repository is a cost the user did not need to pay.

## Why the review is the point

I built the skill because people did not know where to start, and the aim was that nobody has to fuss over the first map. You run the skill in your own domain, the agent drafts the file, and you read it. That human review is part of the design and not a formality. The map is short and readable for both sides. A few colleagues have told me that it is easy to read, which is a remark and not a survey. The person who knows the domain can check in a few minutes whether the agent named the right contracts and neighbouring repositories. This needs doing carefully once, and after that the file mostly sits still.

How much the agent has to figure out depends on how coupled your project is. Most developers already work with some architect-style agent that starts a task in their domain, and that is a natural agent to run the skill with, since it can ask you about a contract it cannot confirm from the code. The skill itself looks, decides and marks its guesses without interviewing you, so the conversation is yours to have.

AAP stays a convention and not a library or a framework, and in practice it works as a router for your agent: it states once where things live, so the agent does not have to rediscover it in every session. It is not a silver bullet. It pays off mostly when a domain has many dependencies, many contracts and a lot of material owned by other people, and for a single small repository it adds little.

## What is and is not shown here

- **Three runs are three runs.** The agents were Claude subagents on macOS, and other agents, Windows and a repository that already has a map were not tried, as the test notes say.
- **The positive node case was never exercised.** No run admitted a node, so I know the rule rejects the wrong candidates and not that it finds the right ones.
- **`llms.txt` has no test of its own.** I wrote it from the same experience as the skill, but I have not run fresh agents against it. The claim that the gates make an agent stop at L0 is therefore my reading of how agents behave and not a measurement.
- **I have no data on adoption.** I can say that the page and the skill exist and what is in them, and not that they reduced questions or produced better maps than people would have written.

## Try it

If you maintain a spec, a convention or a library that agents are going to meet, you can copy the shape in an afternoon. This skeleton is the structure of `llms.txt` without my content:

```text
# <Name>

> One paragraph: what it is, then what it is not.

Version: <x.y.z>. Pin the tag <vX.Y.Z>; do not read the default branch as authoritative.

## If you are an agent working in a repository
1. <First read, with "do not open anything else yet".>
2. <One narrowing choice, then open only that.>
3. <The deeper levels, each gated by a need.>
4. <The one mistake you expect: "never X to be safe".>
5. <What not to fetch at session start.>

## The rules agents get wrong
<A short list, including what the fence does not enforce.>

## Where to read next (only when needed)
<Links to the spec, the schema, the examples.>
```

To test a skill the way I did, pick three public projects that differ in shape, give a fresh agent only the skill file and no other context, and have it follow the file literally. Then ask a second agent to review the skill, looking only for assumptions that came from your own setup. Write down what changed and why in a short table next to the skill, so that a reader can see the trail.

If you only want to see the result on your own repository, the install line from the first post still works. The `llms.txt` page is at `https://raw.githubusercontent.com/gitpash/agent-artifact-protocol/v0.3.0/llms.txt`, and an issue on [the repository](https://github.com/gitpash/agent-artifact-protocol) is welcome if either the page or the skill sends an agent the wrong way.

```bash
npx skills add gitpash/agent-artifact-protocol
```

*This post was drafted with an AI assistant and edited by me.*
