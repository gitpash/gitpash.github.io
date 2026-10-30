---
title: 'Trying things inside a standard harness'
description: 'Why I needed AAP: a big tool I could not measure, a rigid standard harness and a meta-repository full of lagging worktrees, and why that led to a small core, then how the format settled and reached CI.'
cover: 'beams'
pubDate: 2026-10-30
seoTitle: 'How AAP started: experimenting inside a standard agent harness'
series: 'aap'
seriesOrder: 2
tags: ['ai', 'agents', 'aap', 'claude-code', 'ci']
---

Our company decided to standardise on one agent harness, after a period in which we had tried a set of agents and skills for decomposing a task, estimating its blast radius, implementing it, verifying it and running QA. That was a sensible decision, since a standard is what lets a team share its habits. The harness had fixed steps and was wired into our infrastructure, and I wanted to keep trying approaches that did not fit those steps without breaking the convention everybody else relied on.

## What I was building, and what it taught me

Before the harness arrived I had been experimenting, alone, with a code-context graph built on public libraries and handed to the agent as about thirty tools. It was tested by one person, and I leave out how it works, because what it taught me matters more than its design.

It did not clearly improve results, and I could not find a way to measure whether it helped at all. More context and more tools sometimes made a session worse, since the agent had thirty tools to choose from and the output became cumbersome, and I could not tell whether a good answer came from the graph or from luck. That is my reading of experiments from a few months ago and not a measurement. In the end it was simpler to throw the tools out and go back to a dry, compact setup. I suspect harnesses used to be necessary and are now needed only in narrow places as models get stronger, but that is my own view, and I have no data behind it.

## How the meta-repository is organised

It helps to say how we work, because the rest depends on it. Beside the usual `CLAUDE.md`, the root of our meta-repository holds a constitution file in the way spec-kit uses the term. It describes the structure in layers. The top layer describes the contracts, and below it the file says what lies where, meaning services, clients and integrations, the upstream and downstream relations between them and how they are stitched together. Every submodule has the same kind of description of itself, so what we have is a graph of small descriptions and not one large file.

Work goes top-down. A business task arrives, and we first decide which domains it touches and build a shallow map that covers all the contracts involved. Only then do we go deeper, create subtasks and implement them, and that is how we worked before AAP existed.

This is also why a map per repository fits what the team already did. In AAP terms, a map points to the maps of related repositories through `nodes` and `self.parent`, and those hops are explicit and never preloaded ([SPEC.md, "Core model"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md)). The reading levels, from the map alone through a targeted path and one artifact down to the code, give the same shallow-first order in a form an agent can follow ([SPEC.md, "Progressive disclosure"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md)).

## Where the harness got in the way

The standard harness was rigid, and I found its way of searching crude, mostly plain text matching. Before dropping the graph I wanted to learn where it might still earn its place, so I wanted to try it at the blast-radius step, at the verification step, at different thresholds and in different workflows. That meant changing the text and the order of the methods again and again, and every change meant rewriting parts of the harness, adding overrides and encapsulating my code around it. I spent a large part of that time fighting the harness instead of testing the idea.

The structure added a second cost. The context of one task is spread over several repositories, I start from the root, and a task often touches more than one domain, so I split it by domain. Any experiment with a skill had to live on a feature branch, because the skills were standardised for the whole team. In practice that meant many checkouts, worktrees that fell behind, and a branch sync in the meta-repository that I regularly forgot. None of it was dramatic, but it was constant overhead, and it made each experiment more expensive than the idea deserved.

## What I wanted instead

After that lesson I wanted something very small that I could attach and detach, and that did not depend on the harness. The spec does cover part of this. A gitignored `map.local.yaml` holds machine-local navigation and, by convention, an index of local files. The cookbook describes "stream packs" there, small files that name the procedure for one kind of session, with exactly one opened per session ([SPEC.md, "Overlays"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md), [cookbook/local-bootstrap.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/local-bootstrap.md), [cookbook/stream-packs.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/stream-packs.md)). Overlays never grant write authority, AAP defines no plugin system of its own, and starting a tool such as a graph server remains the job of the harness. I did not measure whether this made experiments cheaper, and the stream-pack idea is something I believe the spec supports, not something I have shown in daily use.

## How it shaped AAP

The lesson went into the design as a rule to keep the core small. The spec says maps stay sparse and that graph indexes, embeddings, adapters and workflow machinery do not belong in the mandatory first read. It also says that enabling an optional profile must not expand that read ([SPEC.md, "Progressive disclosure"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md), [SPEC.md, "Profiles block"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md)). A profile can therefore be switched off at any time and the core still works. The first post makes the same point for readers in its advice to shrink the map rather than add to it when sessions do not improve ([post 1](/blog/a-map-instead-of-more-context/)).

## How the format changed

The [first post in this series](/blog/a-map-instead-of-more-context/) tells how the demo was received and where the maps stand today, so I will not repeat that. It leaves out how the file format settled while we piloted on a few repositories.

There was no schema at the start. I sketched a structure and chose which fields would be required, which optional and what the statuses were, and the public history of the repository shows the steps that followed.

The first public draft, on 8 September, was a version 1 map built on `zones`. Each zone carried a `kind` and a list of roles allowed to write, and the schema required only `version` and `zones`:

```yaml
version: 1
zones:
  backend:
    path: services/backend
    kind: backend
    write: [domain]
    layout:
      code: src/
      tests: tests/
```

Three days later version 2 replaced it. The map now describes a `workspace`, the repository itself in `self` and direct hops to related repositories in `nodes`, and each layout path can carry an `access` flag (`CHANGELOG.md`, 0.2.0-draft). The same release added the optional `brownfield-artifacts` profile for repositories with an old documentation corpus. Old roots stay readable and are marked `read-only`, and exactly one path is the write home ([SPEC.md, "Brownfield artifacts profile"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md)). This is how an older style of documentation can be retired without deleting anything:

```yaml
version: 2
workspace: { id: service-repository }
self: { id: service-repository, kind: repository, path: . }
layout:
  artifacts:
    - path: docs/features/
      access: read-write
    - path: legacy/features/
      access: read-only
nodes: []
```

The role lists went away together with the zones, and the write fence moved onto the path itself. The latest release, 0.3.0, removed more than it added. It dropped the version 1 material and three cookbook pages about tooling the repository does not ship, and it added a skill that drafts a map for you.

## Validation in CI

Once a map becomes a shared standard, somebody has to be able to tell whether it is still well-formed, and for a team the natural place is CI. It needs no extra framework: pin a release tag, take the schema from the repository at that tag, and fail the pull request if the map does not validate ([cookbook/ci-validation.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/ci-validation.md), [cookbook/schema-pinning.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/schema-pinning.md)). The pin matters because validating against a branch tip or a gist can change CI behaviour without anyone upgrading anything.

In 0.3.0 the `$id` of the schema moved from a gist to the tagged raw URL, which leaves one place to look. The check proves that the file has the right shape. It does not prove that the paths are the right ones or that the descriptions are true, and `access` stays a coordination fence, not a permission system.

## What is and is not shown here

Everything about my own team is my experience of one meta-repository. I have not measured that experiments became cheaper, and the history of the format is the only part a reader can check. Whether this holds for other teams is an open question.

## Try it

This job fragment is adapted from the CI cookbook. It clones the protocol repository at a pinned tag, installs two libraries and validates the map in your repository:

```yaml
env:
  AAP_PIN: v0.3.0
steps:
  - run: git clone --depth 1 --branch "$AAP_PIN" https://github.com/gitpash/agent-artifact-protocol.git /tmp/aap
  - run: pip install pyyaml jsonschema
  - run: |
      python - <<'PY'
      import json, yaml, jsonschema
      schema = json.load(open("/tmp/aap/schemas/map.schema.json"))
      jsonschema.Draft7Validator(schema).validate(yaml.safe_load(open(".aap/map.yaml")))
      print("OK")
      PY
```

Bump the pin in a deliberate pull request, so that the schema and your maps change on purpose. If you also want to notice when a tag moves, record the schema's hash next to the pin.

*This post was drafted with an AI assistant and edited by me.*
