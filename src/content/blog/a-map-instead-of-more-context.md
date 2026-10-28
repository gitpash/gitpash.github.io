---
title: 'A map instead of more context'
description: 'How our documentation piled up during the move to agentic workflows, and why a small map file helps an agent more than loading extra context.'
pubDate: '2026-10-28'
tags: ['ai', 'agents', 'aap']
---

Our team went through a transition that, I suspect, many others have been through or are still in the middle of. We were adopting an agentic workflow, like everyone around us, and our lead installed Claude Code. It took off almost at once: the agents were fast, and the more interesting question became what we were asking them to read.

From the outside our documentation looked organised enough, with spaces, boards and folders that all had sensible names, a bit like a junk drawer with neat labels on the outside. Inside, things were not where the labels said they were, and it took some digging (and a colleague with a good memory) to find the one that was current.

Much of our work starts from a goal rather than a specification: a task arrives as an outcome somebody wants, and the technical requirements become clear while we work on it. Collecting them is ordinary engineering practice. We find the systems involved, learn the contracts between them, write those contracts down and only then say what has to change, which is not trivial in a big domain with a lot of legacy, many implicit dependencies and repositories we do not own. The knowledge for that was spread over Slack threads, Confluence, Jira tickets, loose files, somebody's personal notes and a retro that had been saved in a place nobody else looked at. A colleague can be asked where such a retro is, of course, whereas an agent starts every session without that colleague.

Around the same time we were moving from Jira to GitHub, so the question was no longer where to put one more file. We had to decide how the team keeps documentation at all, which is a bigger decision than it sounds when everything has to be moved first.

## First attempt: spec-kit

We started with the most popular option. GitHub was promoting spec-kit, it had a lot of stars, and it seemed sensible to follow what most people were adopting. I wrote one parser that ported the project documentation from Confluence into a wiki and a second one that pulled tickets and turned them into docs. The managers then ran Claude Code over the tickets to generate a machine-readable spec for each of them, in large quantities (the agent pulled code from the repositories, documented it and linked the result back to Jira). Documents did appear, as you would expect, and the result was a very large pile of generated markdown that grew with every ticket.

## A workflow on top

On top of spec-kit I proposed a stepwise way to break a task down. An architect agent goes first: it assesses the blast radius, the domains involved and the contracts between them, and produces a top-level picture of the change, which in effect is a map. A review step then pulls in the specification, and after that come implementation and verification, which is the standard loop.

The first step was the hard one, because the information an architect needs is scattered over code and text, so we tried to augment search over the whole domain with MCP, a context graph and several other technologies. The workflow itself changed shape a few times. At first it was driven by CI, with agents leaving comments on GitHub issues, and then we moved to a parent issue with sub-issues, which is the version that stuck (few comments are written now). A standardized dev harness came after that.

## Where it got stuck

The workflow settled down, but the documents did not, and the trouble came in three kinds. When an agent needed to write a document, it invented a path from habit (`docs/features`, `docs/changes`, `.specify`, `.claude`, `docs/architecture`, or a new directory), and every guess produced a duplicate and one more source of truth. A single change could touch a service, a schema, a consumer and a gateway, spread over repositories with different owners, and nothing told an agent which one to open next. The usual answer is to make the agent read more (every `CLAUDE.md`, every `AGENTS.md`, all the architecture documents and past decisions), but that raises the cost before the task has even started. It also leaves somebody to keep all of it current.

There was also the question of what to do with the pile itself. Some teams deleted their documentation, others did nothing and let it keep growing, and we decided that we needed a thin layer of surface documentation that stitches the contracts together. That raised the next question of how to roll it out, since multi-hour sessions spent rewriting all the docs made no sense and there was no time for them anyway.

## Asking the agent

To get started I asked the agent a few direct questions: what its native tools are, and whether it could go through the configs, harnesses and workflows and tell me where they are weak. Two things came out of that conversation: Markdown works well for agents, and Markdown with a YAML-like front matter (dates, fields) works even better. I took both and asked whether the contracts and main concerns of a workspace could be described in that structured form and little else.

The principle I wanted was simple: there is a lot of information, sometimes useful and sometimes not, so context should be loaded when it is needed, starting with the low-hanging fruit. The difficulty is doing that without overloading the system, and the existing solutions did not fit. They carried a maintenance burden and overhead, and they hid their complexity behind libraries (a newcomer could not tell where an MCP tool came from or in what order the commands ran). On top of that, everybody uses a different tool (Claude Code, OpenCode, Gemini CLI, DeepSeek), some with a harness and some with their own skills and local configs, so a system that suits all of them is hard to build.

## A small portal

What I ended up with is a small config file that lists the main concerns of the current workspace. It does not describe everything, it is not an index, and it forces nothing to be installed. To connect it to any harness and any model you add one line to your `CLAUDE.md` or its equivalent that says where to read. From there the agent goes deeper only when the task needs it (the file is human-readable too, which helps in review).

I think the missing piece is smaller than more context: the agent should be able to *address* what exists (a name and a path) without having to *load* it. In September I wrote this up as a proposal for the team, and it became [AAP](https://github.com/gitpash/agent-artifact-protocol/tree/v0.2.1-prototype), an open spec I maintain. There is no silver bullet here, of course, so below I show where it helps and where it doesn't.

## What the spec says

The SPEC says it makes repository context "addressable without requiring it to be loaded", and that it is not a context engine or an authorization system. The minimal map is a few lines, as you can see here:

```yaml
version: 2
workspace: { id: my-repository }
self: { id: my-repository, kind: repository, path: . }
layout: { code: src/, artifacts: docs/artifacts/ }
nodes: []
```

`layout` maps keys such as `code`, `tests`, `artifacts` and `scratch` (plus any extension keys you invent) to paths, while `nodes` are direct hops to related repositories, and the SPEC is explicit that they are "not a dependency graph". Let's take a look at how a new session goes without a map and with one (an illustration, not a real log):

```
# without a map
agent: where do decisions go?  -> grep, find docs/adr, docs/plans, docs/architecture...
agent: which of these is current? -> read several, guess
agent: may I write here?        -> no signal; writes where it found a similar file

# with a map
agent: read .aap/map.yaml (one small file)
       layout.artifacts -> docs/features/  (read-write)
       layout.adr       -> docs/adr/       (read-only)
       nodes            -> one related repo, not opened yet
agent: opens docs/features/ only when the task is about a feature
```

The agent in the second version is no smarter than in the first, it simply has less to guess, and that accounts for most of the benefit. The same idea scales up from a single repository to several, as the next sections show.

## Layers with gates

The word "protocol" is meant in the sense of a sequence of steps. The SPEC defines four levels, and what matters is their order: the agent starts at L0 and passes a gate to go deeper only when the task needs it (essays, whole corpora and embeddings stay out of that first read).

| Level | Read | When |
|---|---|---|
| L0 | map only | workspace orientation |
| L1 | targeted path or index | after choosing a layout key or node |
| L2 | one artifact | durable memory is needed |
| L3 | code and normal tools | implementation evidence |

You decide what goes into the map, and it can be everything about the workspace or only one or two things you care about. Each layout value can carry an `access` flag, `read-only` or `read-write`, and a plain path means `read-write`. A key can list several roots, in which case the durable write home is the first one that is not `read-only`. If there is no writable root, the agent must fail closed and ask before writing anything durable. That rule matters because an agent tends to create a new folder when the right one is not obvious, and a clear write home takes that option away. In my own project, a private repository, decisions that are now history are `read-only` and there is exactly one writable home for feature pages.

The structure is fractal: a node can point to the map of another repository, and that map can point further in the same shape, with any node carrying its own description. A linked map is an explicit hop and is never preloaded recursively, so the agent opens it on purpose. You can also connect things you do not own, such as an upstream data stream or another team's domain service, and in our maps nodes for things we do not own are `read-only`.

Cross-domain contracts are still an open question for us: who owns a contract between two domains, and where is it stored, has not been settled inside the company. I do not pretend that a map answers it, and I find it an interesting and hard problem.

## Rolling it out

A map is small, so there is nothing to rewrite up front, and old documents are migrated only when somebody touches them. I posted the proposal and the thread stayed quiet, so I made a small demo and showed it to the team. Some people did not get it, some said "cool", and some said they wanted to try it too.

My plan for the people in the third group was simple: everybody already has their own LLM and their own harness, so I would hand them the link to the AAP repository. Look at it, I would say, and discuss it with your LLM and your domain, then decide whether it fits and how much of it you need. I thought that was enough, but it was not: the public repository is hard to understand on a first read, and the questions started. Some looked excessive to me, so I asked Claude to write an `llms.txt`, a page that explains to an agent what the map is, what to open first and what the rules are. People could then ask the agent instead of me. Later I added a small skill that drafts a map, validates it, and leaves the nodes for a human to review before the map is promoted. Both live on our side, in the team repository (the public tag of AAP ships neither).

Validation is optional: it is a JSON schema, for the case when you do not want the agent to invent parameters and you want strict following of a pattern. Take the published schema as a base, but a schema of your own for your case is better. The agent then gets a verifiable base for building a complex orientation graph, which it loads into context before it works. There are two parts, a minimal compact core and whatever you decide to extend it with, and how it went in practice is a story for later posts.

## Downsides

- **For one repository or a monorepo you do not need this.** An agent that can run `ls` finds `docs/` by itself, and a good `CLAUDE.md` does the rest, so I tailored AAP to our situation, with many repositories and a lot of legacy.
- **`access` is a fence for coordination, not security.** An agent that ignores the map can still write anywhere.
- **The map can drift.** It is text a human maintains, so if I move a directory and forget the map, it becomes a confident lie. My first map also collected changelog comments, which I removed, because a map should say where things live, not narrate history.
- **I cannot tell you it makes agents better.** I have not run a controlled comparison, and the team has not surveyed how much it helps. What I have is a narrower set of places an agent could plausibly write, and an impression that sessions start with fewer wrong guesses, which is an impression, not a measurement.
- **It is a young spec.** The version I link is `0.2.1-prototype`, and the SPEC calls the core experimental. The maps now exist in about thirty of our repositories and four of us have committed to them, but beyond our team I have not seen it used by anyone.

If you have one repository, start small: a map of five lines and a read-only flag on whatever you stopped touching. Then watch whether your sessions start with fewer wrong guesses, and if they do not, shrink the map rather than adding to it, which is also what the spec recommends.

*This post was drafted with an AI assistant and edited by me.*
