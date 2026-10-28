---
title: 'A map instead of more context'
description: 'An agent working in a repository does not need more context loaded up front. It needs to know where things are and where it is allowed to write.'
pubDate: '2026-10-28'
tags: ['ai', 'agents', 'aap']
---

When an agent misbehaves in a repository, the usual fix is to give it more: a longer instruction file, more pasted documents, a bigger context. I think the missing piece is often smaller. The agent should be able to *address* what exists (a name and a path) without having to *load* it. [AAP](https://github.com/gitpash/agent-artifact-protocol/tree/v0.2.1-prototype), an open spec I maintain, is built around that idea, and I have tried it on real production code.

There is no silver bullet here. This is one solution that works for me, and below I show where it helps and where it doesn't.

## The idea

The SPEC says it makes repository context "addressable without requiring it to be loaded", and that it is not a context engine or an authorization system.

## Without a map, with a map

Without a map, a new session goes roughly like this (an illustration, not a real log):

```
agent: where do decisions go?  -> grep, find docs/adr, docs/plans, docs/architecture...
agent: which of these is current? -> read several, guess
agent: may I write here?        -> no signal; writes where it found a similar file
```

With a map:

```
agent: read .aap/map.yaml (one small file)
       layout.artifacts -> docs/features/  (read-write)
       layout.adr       -> docs/adr/       (read-only)
       nodes            -> one related repo, not opened yet
agent: opens docs/features/ only when the task is about a feature
```

The agent in the second version is no smarter. It simply has less to guess.

## What is in the map

The minimal map is a few lines:

```yaml
version: 2
workspace: { id: my-repository }
self: { id: my-repository, kind: repository, path: . }
layout: { code: src/, artifacts: docs/artifacts/ }
nodes: []
```

- `workspace` and `self` say which workspace and repository this is
- `layout` maps vocabulary keys (`code`, `tests`, `artifacts`, `scratch`, and extension keys you invent) to paths in this repository
- `nodes` are direct hops to *related* repositories; the SPEC is explicit that they are "not a dependency graph"

## Read-only vs read-write

Every layout value can be a plain path or an object with `access`. A plain string means `read-write`. A key can list several roots, and the durable write home is the first one that is not `read-only`. If there is no writable root, the agent must fail closed: ask before writing anything durable, and never invent a parallel root.

I rely on that last rule the most. When the right folder is not obvious, agents like to create a new one, and a clear write home takes that option away.

## Progressive disclosure

The SPEC defines four levels. What matters is the order:

| Level | Read | When |
|---|---|---|
| L0 | map only | workspace orientation |
| L1 | targeted path or index | after choosing a layout key or node |
| L2 | one artifact | durable memory is needed |
| L3 | code and normal tools | implementation evidence |

The agent starts at L0, one small file, and goes deeper only when the task needs it. Essays, whole corpora and embeddings stay out of that first read. A linked map is an explicit hop as well and must not be preloaded recursively, so if a task needs the related repository, the agent opens it on purpose.

## An example from my repository

In layout terms my map says this:

- `artifacts` has **one** writable home, `docs/features/`, where the feature pages live (see my earlier post on surface docs)
- `adr` points to `docs/adr/` and is `read-only`: 22 accepted decisions that are now history, typo fixes only
- `plans` is read-write, described as execution records that close only after the feature page is updated

Each path has a short rule in its `description` field, so the agent reads the rule right where it needs it.

There is one node: a private "research inbox" repository, mounted as a git submodule, so that third-party research tooling stays away from the main repository. The agent never gets the inbox contents, only the *name* of the place. The `write` field on that node is just a role hint, and the SPEC says it does not grant filesystem permission.

## Key benefits and downsides

Benefits:

- less to guess at the start of every session
- one clear write home instead of a new folder per session
- read-only flags on everything I stopped touching

Downsides:

- **For one repository a map adds little.** An agent that can run `ls` finds `docs/` by itself. In my case the page template, the single entry file and the coverage check (see the first post) did more than the map.
- **`access` is a fence for coordination, not security.** An agent that ignores the map can still write anywhere. More on this in the next post.
- **The map can drift.** It is text a human maintains; if I move a directory and forget the map, it becomes a confident lie. My first version also collected changelog comments, which I removed, because a map should say where things live, not narrate history.
- **I cannot tell you it makes agents better.** I have not run a controlled comparison. What I have is a narrower set of places an agent could plausibly write, and an impression that sessions start with fewer wrong guesses. That is an impression, not a measurement.
- **It is a young spec.** The version I link is `0.2.1-prototype`, and the SPEC calls the core experimental. I have not seen it used by anyone but me.

## Where to start

With many repositories, the hops start to matter more. With one, keep it small: a map of five lines and a read-only flag on whatever you stopped touching, then watch whether your sessions start with fewer wrong guesses.

*This post was drafted with an AI assistant and edited by me.*
