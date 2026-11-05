---
title: 'From 111 plans and zero feature pages'
description: 'How I restructured the documentation of a one-person, agent-driven repository around one entry file, one page per feature and a coverage check, with all older documents frozen as read-only history.'
cover: 'stack'
pubDate: 2026-10-31
seoTitle: 'Surface docs for an agent-driven repo: one page per feature'
tags: ['ai', 'agents', 'documentation', 'aap', 'claude-code']
---

On the day I counted, a one-person, agent-driven research repo of mine held 111 plans, 22 architecture decision records (ADRs), 24 architecture documents, 14 cross-reviews and no feature pages at all. The `docs/features/` directory existed but was an empty stub, and these counts come from the plan that started the restructuring, so they describe how much text had accumulated and say nothing about how good it was.

"Current state" lived in three places: a long "Current focus" paragraph in the README, about forty lines of changelog written as comments inside a YAML map file, and the headers of the most recent plans. Agents had produced reviews of reviews of ADRs, nothing had ever been retired, and when a new session started neither the agent nor I could say which document was the current one. Agents are good at adding documents and poor at deciding that one is obsolete, so if you let them, the corpus only grows.

This is the follow-up to [the first post in this series](/blog/a-map-instead-of-more-context/), which described the map file. The repo here is a private research project that I direct mostly by writing plans for AI agents, and this post covers the structure and the tooling only, not what the project does.

## Five rules

The plan I wrote for the fix, which I accepted the same day, sets out the design in seven points. The core of it is five rules, and the agents follow them through the repo's instructions file.

1. **One entry point**, `docs/STATE.md`, meant to fit in two screens: a one-line north star, a table of feature, status and page, the open and closed permissions, the next three actions and a list of things not to do. Dated one-liners at the bottom double as the progress log, and the README keeps a two-line pointer.
2. **One page per feature** in `docs/features/`, built from a fixed template: purpose, current decision, interfaces, an evidence table, open questions, a dated decision log and links to the older documents it was distilled from.
3. **Theory stays in two version-locked files**, and feature pages point to them instead of copying them.
4. **Legacy becomes read-only.** ADRs, closed plans and review documents stay where they are, typos are fixed in place, and anything material goes into the feature page's decision log with a one-line pointer in the old document.
5. **A plan closes into a feature page.** A plan is not done until its page and `STATE.md` are updated.

Every page starts with a small block of front matter. It records the page's status and the code it covers, and it is also what the coverage check reads, as the next section explains:

```yaml
feature: <slug>
status: idea | proposed | in-progress | implemented | gated | parked | retired
last_verified: YYYY-MM-DD
owner_units: [apps/..., packages/...]
legacy: [docs/adr/..., docs/plans/...]
```

## What a page looks like

The real pages describe the private project, so here is an invented one for a neutral feature, offline export. Only the evidence table is shown, since it is the part that matters most.

| Claim | Evidence | What it does not show |
|---|---|---|
| Export of 10k records finishes without errors | Unit test with synthetic data | Real file sizes, any device other than the dev laptop |
| Output re-imports identically | Round-trip test on 5 fixtures | The fixtures were written by the same author as the exporter, so shared blind spots are possible |
| Export is "fast" | One timing of 1.8 s | Variance, cold start and memory, since a single run is an anecdote |

The third column is the one I care about most, because agents like to write evidence tables that only say good things. It forces the author, human or agent, to write the limit of each claim next to the claim, and an empty cell tells me to be suspicious.

## The plan-close rule and the coverage check

The rule is one sentence in the plan, and it works because the distilling step is part of the definition of done. The cost of keeping the surface current is then paid while the work is fresh, not in a later cleanup that nobody schedules. A rule that lives only in prose gets skipped, which is why there is also a script of about ninety lines, `tools/docs-coverage.py`. It fails when a directory under `apps/*` or `packages/*` is not named by any page's `owner_units`, when a page is missing a front matter key or has a malformed date, or when a path in `owner_units` or `legacy` does not exist. A stale `last_verified` only produces a warning, once it is older than 45 days.

This was the original reason for the whole exercise, and the goal was modest: a mechanical way to notice that code exists with no description. The first run after the restructuring reported 11 pages and 0 errors, and today it reports 15 pages, 0 errors and 0 warnings. It cannot tell whether a page is true, only that it exists, is dated and points at real paths. The rule that a closed plan means an updated page is still enforced by me and by the agents' instructions, not by tooling.

## What AAP contributed

I describe the repo layout for agents with AAP, [the small open spec behind the first post](https://github.com/gitpash/agent-artifact-protocol/tree/v0.3.0), and its optional `brownfield-artifacts` profile is meant for repos that already have a documentation corpus. In short, it asks for one writable artifacts home, keeps old roots addressable as `read-only` instead of moving them, and leaves a pointer behind when a material update creates a successor.

For a single repo that is nearly all it gives, a map with one write home and some read-only flags, and I deliberately skipped the parts that pay off across many repositories or teams. The value came from other things: the page template, the single entry point and the coverage check, none of which are AAP. I also moved the changelog comments out of the map into the `STATE.md` history, because a map should say where things live and not narrate what happened.

## What was risky

The risky part was distillation, because turning dozens of ADRs and plans into one current decision per feature is judgment work, and I delegated the first pass to agents running in parallel. What came back were drafts, and I labelled them as drafts in the plan, with an open-questions section on every page.

The agents did find real conflicts between older documents, such as ADRs whose status wording no longer matched what had been built and a priority question that two documents answered differently. Nobody had noticed because nobody had read them side by side, and the conflicts now sit in `STATE.md` under a heading for decisions that need an owner, which was a benefit I had not planned for. Distillation can also drop nuance, so every page links back to its sources and nothing was deleted. I have not audited all the pages line by line, and the plan says they are corrected on touch, which is a polite way of saying that some are probably wrong in small ways today.

## Limits

- **One repo, one person.** I have no evidence about how this works with a team.
- **Frozen, not smaller.** The old plans are still there, and I did not mark them superseded in bulk, so that happens when I touch them.
- **Maintenance has a cost.** Every plan close now includes a page update and a `STATE.md` edit, which I believe is cheaper than the confusion, although I have not measured it.
- **The numbers are counts.** "15 pages, 0 errors" says the structure is intact and nothing about whether the content is right.
- **It is young.** The plan-close rule applies from the day I wrote it, and I have not yet seen it survive a busy month.

## Try it

If you run an agent-heavy repo where nothing ever gets retired, the cheapest step is the entry file plus a read-only flag on history. Create `docs/STATE.md` with the table below, add the front matter block above to one page per feature, and run a coverage script like the one described here in your definition of done.

```markdown
# STATE (single entry point)

North star: <one line>

| Feature | Status | Page |
|---|---|---|
| <name> | <status> | features/<slug>.md |

Next three actions: ...
Do not: ...
```

Mark the old documents as `read-only` in the map from the first post, and let the agents write only into `docs/features/`. If you try it, I would like to hear what broke.

*This post was drafted with an AI assistant and edited by me.*
