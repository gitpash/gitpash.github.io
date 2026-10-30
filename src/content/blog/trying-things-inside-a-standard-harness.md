---
title: 'Trying things inside a standard harness'
description: 'How AAP started as a way to experiment without breaking our team standard in a meta-repository, how the format changed in public, and how validation reached CI.'
cover: 'beams'
pubDate: 2026-10-31
seoTitle: 'How AAP started: experimenting inside a standard agent harness'
tags: ['ai', 'agents', 'aap', 'claude-code', 'ci']
---

Our company decided to standardise on one agent harness, after a period in which we had tried a set of agents and skills for decomposing a task, estimating its blast radius, implementing it, verifying it and running QA. That was a sensible decision, since a standard is what lets a team share its habits. At the same time I wanted to keep trying other approaches, and I was looking for a way to do that without breaking the convention everybody else relied on.

## The cost of an experiment

We work in a meta-repository, which means there are many repositories, the context of a task is spread over several of them, and I start work from the root. A task often touched more than one domain, so I split it by domain first. Any experiment with a different skill or a different step then had to live on a feature branch, because the skills were standardised for the whole team.

In practice that meant a lot of checkouts, and the worktrees fell behind all the time. The meta-repository kept syncing branches so that everyone had a fresh version while work ran in parallel. I regularly forgot to sync mine, and then the branch was behind and things around it had changed. None of it was dramatic, but it was constant overhead, and it made every small experiment more expensive than it needed to be.

## The idea

When the protocol took shape, I hoped it would help with several things at once. A map in every repository would let us describe the documentation of all modules in the same way, and my own tools could be connected in a clear, documented place. The configuration also allows local overrides, so I could keep my own sets of procedures on the main branch without extra checkouts.

The spec is more modest about the last point than that summary suggests, so it helps to say exactly what it contains. A gitignored `map.local.yaml` holds machine-local navigation and, by convention, an index of local files. The cookbook describes "stream packs" there, small files that name the procedure for one kind of session, with exactly one opened per session ([SPEC.md, "Overlays"](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/SPEC.md), [cookbook/local-bootstrap.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/local-bootstrap.md), [cookbook/stream-packs.md](https://github.com/gitpash/agent-artifact-protocol/blob/v0.3.0/cookbook/stream-packs.md)). Overlays never grant write authority, and AAP defines no plugin system of its own, so what the map offers is a clean place to keep such procedures and to choose one per session.

## Demo, lead, pilot

I built a small demo and showed it to our lead, who liked it straight away. I then drew a few diagrams and wrote up the theory of how it should work, and we agreed to try it as a pilot on a few repositories before deciding anything else. The [first post in this series](/blog/a-map-instead-of-more-context/) covers how the rollout went from there, so I will not repeat it.

## How the format changed

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
