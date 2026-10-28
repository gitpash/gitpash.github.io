---
title: 'A map instead of more context'
description: 'An agent working in a repository does not need more context loaded up front. It needs to know where things are and where it is allowed to write.'
pubDate: '2026-10-28'
tags: ['ai', 'agents', 'aap']
---

Nobody on our team set out to design a documentation system. We were adopting an agentic workflow, like everyone around us, and our lead installed Claude Code. It took off. The agents were fast, and the thing we handed them to read turned out to be a zoo.

## The zoo

We work in a big domain with a lot of legacy, plenty of implicit dependencies and many repositories we do not own. Business sends tasks that are not clear yet, and before anyone can say what to change, somebody has to know the contracts between the pieces and write them down.

Where did all of that live? In Slack threads. In Confluence. In Jira tickets. In loose files, in somebody's personal notes, in a retro that somebody kept somewhere nobody else looked. A person can ask a colleague where the retro is. An agent starts every session without that colleague.

Around the same time we were moving from Jira to GitHub, so the question got bigger than where to put one file. We had to decide how the team keeps documentation at all.

## First try: spec-kit

We took the most popular option. GitHub was promoting spec-kit, it had a lot of stars, and everyone else seemed to be going that way. I wrote a parser that ported the project documentation from Confluence into a wiki, and a second one that pulled tickets and turned them into docs. Managers then ran Claude Code over the tickets to generate a machine-readable spec for each one, in huge quantities. The agent pulled code from the repositories, documented it and linked the result back to Jira.

Documents certainly appeared. What we ended up with was a monster of Markdown, and it grew with every ticket.

## A workflow on top

On top of spec-kit I proposed a stepwise way to break a task down. An architect agent goes first. It assesses the blast radius, the domains involved and the contracts between them, and produces a top-level picture of the change, which in effect is a map. A review step then pulls in the specification. After that come implementation and verification, the usual loop.

The hard part was the first step. The information an architect needs is scattered across code and text, so we tried to augment search over the whole domain with MCP, a context graph and several other technologies.

The workflow itself kept changing shape. At first it was driven by CI, with agents leaving comments on GitHub issues. Then we switched to a parent issue with sub-issues, and that one stuck. Few comments are written now. A standardized dev harness came after that.

## What went wrong

The workflow settled down. The documents did not.

When an agent needed to write one, it invented a path from habit: `docs/features`, `docs/changes`, `.specify`, `.claude`, `docs/architecture`, or a brand new directory. Every guess produced a duplicate and one more source of truth. A single change could touch a service, a schema, a consumer and a gateway, spread over repositories with different owners, and nothing told an agent which one to open next.

The usual answer is to make the agent read more: every `CLAUDE.md`, every `AGENTS.md`, all the architecture documents, all the past decisions. The cost then grows before the task has even started, and somebody has to keep all of it current.

And there was the pile itself. Some teams deleted their documentation. Some did nothing, and the pile just grew. We decided we needed a thin layer of surface documentation that stitches the contracts together, and right away ran into the next question: how do you roll that out? Multi-hour sessions spent rewriting all the docs made no sense, and there was no time for them anyway.

## Asking the agent

So I asked the agent. What are your native tools? Go through the configs, the harnesses and the workflows, and tell me where they are weak.

Two things came out of that conversation. Markdown works well for agents. And Markdown with a YAML-like front matter (dates, fields) works even better. I latched onto both and asked a narrower question: can the contracts and the main concerns of a workspace be described in that structured form, and little else?

The principle I wanted was simple. There is a lot of information, sometimes useful and sometimes not, so load context when it is needed and take the low-hanging fruit first. The difficulty is doing that without overloading the system.

Existing solutions did not fit. They carried a maintenance burden and overhead, and they hid their complexity behind libraries, so a newcomer could not tell where an MCP tool came from or in what order the commands ran. On top of that, everybody on the team uses a different tool: Claude Code, OpenCode, Gemini CLI, DeepSeek. Some have a harness, some have their own skills and local configs. A system that suits all of them is hard to build.

## A small portal

What I ended up with is a small config file that lists the main concerns of the current workspace. It does not describe everything and it is not an index. It forces nothing to be installed. To connect it to any harness and any model, you add one line to your `CLAUDE.md` or its equivalent: read the map there. It is human-readable, and the agent goes deeper only when the task needs it.

I think the missing piece is smaller than more context. The agent should be able to *address* what exists (a name and a path) without having to *load* it. In September I wrote this up as a proposal for the team, and it became [AAP](https://github.com/gitpash/agent-artifact-protocol/tree/v0.2.1-prototype), an open spec I maintain.

There is no silver bullet here. This is one solution that works for us, and below I show where it helps and where it doesn't.

## What the spec says

The SPEC says it makes repository context "addressable without requiring it to be loaded", and that it is not a context engine or an authorization system. The minimal map is a few lines:

```yaml
version: 2
workspace: { id: my-repository }
self: { id: my-repository, kind: repository, path: . }
layout: { code: src/, artifacts: docs/artifacts/ }
nodes: []
```

`layout` maps keys such as `code`, `tests`, `artifacts` and `scratch` (plus any extension keys you invent) to paths. `nodes` are direct hops to related repositories, and the SPEC is explicit that they are "not a dependency graph".

Without a map, a new session goes roughly like this (an illustration, not a real log):

```
agent: where do decisions go?  -> grep, find docs/adr, docs/plans, docs/architecture...
agent: which of these is current? -> read several, guess
agent: may I write here?        -> no signal; writes where it found a similar file
```

With one:

```
agent: read .aap/map.yaml (one small file)
       layout.artifacts -> docs/features/  (read-write)
       layout.adr       -> docs/adr/       (read-only)
       nodes            -> one related repo, not opened yet
agent: opens docs/features/ only when the task is about a feature
```

The agent in the second version is no smarter. It simply has less to guess.

## Layers with gates

The word "protocol" is meant in the sense of a sequence of steps. The SPEC defines four levels, and what matters is the order:

| Level | Read | When |
|---|---|---|
| L0 | map only | workspace orientation |
| L1 | targeted path or index | after choosing a layout key or node |
| L2 | one artifact | durable memory is needed |
| L3 | code and normal tools | implementation evidence |

The agent starts at L0 and passes a gate to go deeper only when the task needs it. Essays, whole corpora and embeddings stay out of that first read.

You decide what goes into the map. It can be everything about the workspace or one or two things you care about. Each layout value can carry an `access` flag, `read-only` or `read-write`. A plain path means `read-write`. A key can list several roots, and the durable write home is the first one that is not `read-only`. If there is no writable root, the agent must fail closed and ask before writing anything durable. That rule matters because, when the right folder is not obvious, an agent tends to create a new one, and a clear write home takes that option away. In my own project, a private repository, I keep decisions that are now history as `read-only` and have exactly one writable home for feature pages.

The structure is fractal. A node can point to the map of another repository, and that map can point further, in the same shape. Any node can carry its own description. A linked map is an explicit hop and is never preloaded recursively, so the agent opens it on purpose. You can also connect things you do not own: an upstream data stream, another team's domain service. In our maps, nodes for things we do not own are `read-only`.

Cross-domain contracts are still an open question for us. Who owns a contract between two domains, and where is it stored? Nobody inside the company has settled that, and I will not pretend a map answers it. It is an interesting and hard problem.

## Rolling it out

Rollout was where the earlier question got its answer. A map is small, so there is nothing to rewrite up front: old documents are migrated only when somebody touches them. I made a small demo and showed it to the team. Some did not get it. Some said "cool". Some said they wanted to try it too.

It is easy to deploy through an `llms.txt` style instruction that explains to the agent what the map is. Validation is optional: a JSON schema, for the case when you do not want the agent to invent parameters and you want strict following of a pattern. Take the published schema as a base, but a schema of your own for your case is better. The agent then gets a verifiable base for building a complex orientation graph, loads it into context and works. There are two parts: a minimal compact core, and whatever you decide to extend it with.

How it went in practice is a story for later posts.

## Downsides

- **For one repository or a monorepo you do not need this.** An agent that can run `ls` finds `docs/` by itself, and a good `CLAUDE.md` does the rest. I tailored AAP to our situation, with many repositories and a lot of legacy.
- **`access` is a fence for coordination, not security.** An agent that ignores the map can still write anywhere.
- **The map can drift.** It is text a human maintains; if I move a directory and forget the map, it becomes a confident lie. My first map also collected changelog comments, which I removed, because a map should say where things live, not narrate history.
- **I cannot tell you it makes agents better.** I have not run a controlled comparison, and the team has not surveyed how much it helps. What I have is a narrower set of places an agent could plausibly write, and an impression that sessions start with fewer wrong guesses. That is an impression, not a measurement.
- **It is a young spec.** The version I link is `0.2.1-prototype`, and the SPEC calls the core experimental. The maps now exist in about thirty of our repositories and four of us have committed to them, and beyond our team I have not seen it used by anyone.

If you have one repository, start small: a map of five lines and a read-only flag on whatever you stopped touching, then watch whether your sessions start with fewer wrong guesses.

*This post was drafted with an AI assistant and edited by me.*
