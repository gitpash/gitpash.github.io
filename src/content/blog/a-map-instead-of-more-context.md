---
title: 'A map instead of more context'
description: 'An agent working in a repository does not need more context loaded up front. It needs to know where things are and where it is allowed to write.'
pubDate: '2026-10-28'
tags: ['ai', 'agents', 'aap']
---

Hi, I direct AI agents in a private research prototype, and today I'd like to talk about how I tell them where things are – not about what the prototype does.

When an agent behaves badly in a repository, the usual fix is to give it more: a longer instruction file, more documents pasted in, a bigger context. I believe the missing piece is often smaller. The agent needs to be able to *address* what exists (a name and a path) without having to *load* it.

Of course there is no silver bullet here. This is one possible solution that works for me, and below I'll try to show where it helps and where it doesn't.

## The idea

[AAP](https://github.com/gitpash/agent-artifact-protocol/tree/v0.2.1-prototype) is a small open spec I maintain, and this is its core idea. The first line of its SPEC says it makes repository context "addressable without requiring it to be loaded". It also says what it is not: not a context engine, not a retrieval protocol, not an authorization system.

## Without a map, with a map

Without a map, a new session looks like this:

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

The second version is not smarter, it just has less to guess.

## What is in the map

The minimal map has four parts:

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

Every layout value can be a plain path or an object with `access`. A plain string means `read-write`. A key can list several roots, and the durable write home is the first one that is not `read-only`. If there is no writable root, the agent must fail closed for a durable write and ask, rather than invent a parallel one.

That last rule is the one I use most. Agents love to create a new folder when the right one is not obvious, so a map with a clear write home removes the temptation.

## Progressive disclosure

The SPEC defines four levels, and the point is the order:

| Level | Read | When |
|---|---|---|
| L0 | map only | workspace orientation |
| L1 | targeted path or index | after choosing a layout key or node |
| L2 | one artifact | durable memory is needed |
| L3 | code and normal tools | implementation evidence |

The agent starts at L0, which is a few dozen lines, and goes deeper only when the task demands it. Essays, whole corpora and embeddings do not belong in the mandatory L0 read. A linked map is an explicit hop too: it must not be preloaded recursively, so if a task needs the related repository, the agent opens it deliberately.

## An example from my repository

In layout terms my map says this:

- `artifacts` has **one** writable home, `docs/features/`, where the feature pages live (see my earlier post on surface docs)
- `adr` points to `docs/adr/` and is `read-only`: 22 accepted decisions that are now history, typo fixes only
- `plans` is read-write, described as execution records that close only after the feature page is updated

The `description` field carries a short rule next to each path, so the agent reads the rule exactly where it needs it.

There is one node: a private "research inbox" repository, mounted as a git submodule, so that third-party research tooling stays away from the main repository. I did not give the agent the inbox contents, I gave it the *name* of the place. And the `write` field on that node is only a role hint – the SPEC says it does not grant filesystem permission.

## Key benefits and downsides

Benefits:

- less to guess at the start of every session
- one clear write home instead of a new folder per session
- read-only flags on everything I stopped touching

Downsides:

- **For one repository a map adds little.** An agent that can run `ls` finds `docs/` by itself. In my case the page template, the single entry file and the coverage check (see the first post) did more work than the map.
- **`access` is a fence for coordination, not security.** An agent that ignores the map can still write anywhere. More on this in the next post.
- **The map can drift.** It is text a human maintains; if I move a directory and forget the map, it becomes a confident lie. My first version also collected changelog comments, which I removed, because a map should say where things live, not narrate history.
- **I cannot tell you it makes agents better.** I have not run a controlled comparison. What I have is a narrower set of places an agent could plausibly write and an impression that sessions start with fewer wrong guesses – an impression, not a measurement.
- **It is a young spec.** The version I link is `0.2.1-prototype`, and the SPEC calls the core experimental. I have not seen it used by anyone but me.

## Conclusion

If you have many repositories, hops start to matter more. If you have one, start small: a map of five lines and a read-only flag on whatever you stopped touching, then see whether your sessions start with fewer wrong guesses. I hope you can take some useful ideas from this, thank you for reading, and see you in the next post.

*This post was drafted with an AI assistant and edited by me.*
