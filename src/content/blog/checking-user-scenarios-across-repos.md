---
title: 'Checking user scenarios across repos without a central catalog'
description: 'How journeys grew out of AAP as an optional plugin to trace user corridors across repositories, why one early bug catch kicked off a cross-domain rollout, and why we dropped per-PR CI for a local gate.'
cover: 'blocks'
pubDate: 2026-11-28
seoTitle: 'Journeys: checking user scenarios across repos without a central catalog'
series: 'aap'
seriesOrder: 4
tags: ['ai', 'agents', 'aap', 'testing', 'workflows']
---

When I first wrote down [AAP](/blog/a-map-instead-of-more-context/), the goal was a small router for coding agents, not a full map of a codebase. In our work, the hard part is rarely a single file or a clever algorithm; it is the tangle of contracts, upstream and downstream services, and hand-offs to other teams that never show up inside one repository. From the start I wanted a thin core with local overrides by default and optional plugins on top. Different nodes have different concerns (business context, mobile device checks or release rules), and stuffing all of that into one shared format only creates duplication.

Orientation solved the first half of the problem, since an agent could now find where things live without guessing. Once an agent starts editing code, though, a harder question comes up: if you widen an API or change a shared flow, which consumer breaks and where does that consumer even live? Unit tests inside your own checkout stay green while a flow in another repository quietly stops working.

## Corridors instead of a full dependency graph

What we wanted was a way to lower cognitive load, so a developer (or an agent) can focus on the change itself instead of keeping a mental list of every downstream caller. We started calling these paths "corridors" and eventually settled on **journeys**. Just like AAP is not an index of every file in a workspace, journeys are not a complete graph of every dependency in the system. People decide which user scenarios are the main arteries that actually matter, and the rest is left alone; as a feature gets more code and more changes, it naturally collects journeys around it.

A journey marks the corridor a scenario walks through: which code zones it touches and which contract entry points it crosses. We tried the idea first on our mobile application, extending an approach the team was already using there. On the very next pull request, a colleague made a change and the check immediately flagged that his diff had stepped into another scenario's corridor. He went to verify it and found a real bug before merge, which was concrete enough to convince us to roll the pattern out further.

The harder step is taking the same idea across domains (backend, frontend and shared services), which is the work we are actively doing now. To test the mechanics cleanly outside our internal setup, I pulled the pattern into [`aap-journeys`](https://github.com/gitpash/aap-journeys), an opt-in plugin for AAP with a reference implementation in about 340 lines of Node ESM and zero dependencies. There is no silver bullet here, of course, so below I show how the pieces fit together and where we are still figuring things out.

## One journey per scenario

A journey lives inside the repository that owns it and consists of a short markdown file, a walk test and one manifest entry. The markdown file holds a state-transition table (`state | event | guard | next`) alongside the contracts the flow depends on, while the walk test reads that table and asserts every row so documentation and code cannot drift apart quietly. Both are wired up in `docs/journeys/manifest.json` (the example below comes from the fictional shop in the public repository):

```json
{
  "version": 1,
  "journeys": [
    {
      "id": "place-order",
      "doc": "docs/journeys/place-order.md",
      "zone": ["src/checkout/", "src/queries/PlaceOrder"],
      "tests": ["src/checkout/walk.test.mjs"],
      "run": "node --test {files}",
      "seams": ["gql:Mutation.placeOrder"]
    }
  ]
}
```

Zones are plain path prefixes rather than globs, which keeps matching predictable and easy to audit in review. When a diff touches a zone, a journey doc, a listed test or a GraphQL operation whose root field matches a declared seam, only the affected journeys run. A repository without a manifest is simply reported as "not covered" rather than treated as an error, so adoption can stay incremental.

## Seams instead of a central catalog

One rule we kept firm from the start is that no central catalog of journeys or seams may exist. A hand-maintained cross-repo registry drifts the week someone renames a flow or retires an endpoint in another repository, and nobody wants another shared file to babysit. Instead, repositories meet only at **seams**, which are canonical server-side contract IDs (`gql:Mutation.placeOrder`, `grpc:shop.orders.OrderService/Cancel`, `event:orders.placed`, `rest:POST /v1/orders`).

```text
Diff in orders-api: placeOrder changes
  -> seam: gql:Mutation.placeOrder
  -> search manifests across repos (no central catalog)
       |- web-storefront  (place-order) -> run leg locally: PASS or FAIL
       |- mobile-app      (quick-buy)   -> not runnable here: UNVERIFIED (with reason)
       '- admin-portal    (no journey)  -> uncovered consumer
```

Each consumer repository declares the seams its journeys rely on, while the serving API repository never keeps a list of its callers. When a backend diff touches a schema, `.proto` file, route or topic, the agent runs `journeys discover gql:Mutation.placeOrder`, which prints plain search commands (`gh search code` or `git grep` over local clones) and never calls the network itself.

Because discovery is just search, partial adoption does not break anything. If a downstream repository has not added journeys yet, an optional bare-field search still surfaces it as an `uncovered consumer`, while every adopted repository stays self-contained even if full rollout takes months.

## Why we dropped per-PR CI (`v1` to `v2`)

The first version of the workflow (tagged `v0.1.0-v1-ci` in the repository) looked like most engineering tools: a soft-fail GitHub Actions job that posted a sticky comment on every pull request with touched journeys and neighbour discovery commands. Once the proposal was approved and we started merging it, the CI job actually ran and began posting comments full of shell commands that you still had to run locally to check neighbour seams.

Seeing it run once made the mismatch obvious. Waiting for a push and a CI run just to read commands the agent could run locally (in a workflow step or a git hook) was slower and noisier, and reviewers already scroll past bot comments. On top of that, our GitHub Actions bill was already high enough that we had been asked to trim CI spend. Paying for another per-commit workflow to render a table the agent already had locally made no sense.

In `v2` (tagged `v0.2.0-v2-local`), per-PR CI is gone and replaced by a local gate before push, a compact evidence block in the PR description and a periodic audit. Lint, types and unit tests remain hard stops, while journeys sit right after them as a graded check that never blocks a merge:

```text
lint/types (hard stop) -> unit tests (hard stop) -> journeys (graded, never blocks merge) -> review
```

To use it in a repository, you copy `core/*.mjs` (without `test/`) into `tools/journeys/`. Before pushing, the agent runs the local gate with `--md` and pastes the short block into the pull request body, so a reviewer reads four lines instead of digging through bot comments:

```bash
node tools/journeys/journeys.mjs check --base origin/main --md
```

```markdown
## Journeys
Escalation: none
Own: place-order PASS | stale: place-order (info)
Contract change: none
```

Several smaller rules tightened up alongside removing CI, mostly to cut noise and make non-pass states explicit. Comparing the two tagged slices makes the shift clear:

| Topic | v1 (per-PR CI) | v2 (local gate + audit) |
|---|---|---|
| Where it runs | Soft-fail GitHub Actions sticky comment | Locally before push (`--md`), pasted into PR body |
| Client neighbour output | Printed a neighbour-legs section in every repo | Client repos never print neighbour legs (a client cannot break another client) |
| Serving-side trigger | Prose duty only | Mechanical trigger when `git diff` touches schema, `.proto`, route or topic files |
| Non-pass outcomes | `SKIPPED` and `not verified` | `UNVERIFIED: <reason>` and `WAIVED: <test> - <why>` (via `--waive`) |
| Human escalation | None | Line 1 `Escalation: none` or `<reason>` on breaking unverified seams, unwaived FAIL or repeat waivers |
| Zero search hits | State which method was used | Always `Discovery: search, 0 hits (default branch only)`, never "no consumers" |

Instead of a bot on every commit, compliance is checked by a manual audit roughly every four weeks over merged pull requests in opted-in repositories. The audit looks at block presence (target at least 80%), honest reasons on `WAIVED` and `UNVERIFIED` rows (at least 90%), and waiver rate (under 20%). It also flags repeat waivers on the same journey within four weeks (zero, otherwise fix or demote it) and counts real catches before merge (at least one). Tightening should happen on evidence rather than habit, and only once baseline coverage becomes normal will specific seams earn targeted CI automation.

## Small things learned while building the runner

Building a zero-dependency runner turned up a few sharp edges that are easy to miss on paper. The nastiest one was a silent false pass inside Node's own test runner: when a journey command runs `node --test` inside a parent `node --test` process, the inherited `NODE_TEST_CONTEXT` environment variable turns the child run into a no-op that exits `0`. A failing journey looked green until we stripped `NODE_TEST_CONTEXT` from the child environment, which is a good reminder that a broken runner must never look green.

Diff inspection had its own trap around deleted operations. If `seam-touched` only parses the current working tree, removing or renaming a GraphQL operation makes it vanish from the check instead of triggering the journey that depended on it. Reading both the merge-base version (`git show <merge-base>:<file>`) and the current file catches deletions cleanly.

GraphQL naming needed a similar simplification. Clients name operations and field aliases however they like (`mutation SubmitCheckout { receipt: placeOrder(...) }` versus `mutation Buy { placeOrder(...) }`), whereas the contract is always the server-side root field. Ignoring operation names and aliases so every consumer resolves to `gql:Mutation.placeOrder` keeps the extractor tiny and lets separate repositories agree on one string without coordinating.

## What is and is not shown here

- **Cross-domain rollout is still in progress.** The single-repo mobile catch happened in real work, while the cross-domain seam workflow is still being rolled out and tuned across services, so I have no multi-team numbers yet (once we have results, I will write a follow-up).
- **Only GraphQL call seams are derived automatically.** gRPC, event and REST seams are hand-written in the manifest, and `seam-gone` does not make sense for repositories that only serve a GraphQL seam rather than calling it.
- **Seams are root-field grain.** A nested field change hides under the root field unless a journey declares a deeper coordinate by hand.
- **Neighbour legs are proven only when somebody runs them.** Otherwise the honest result is `UNVERIFIED: <reason>`, and code search covers default branches only with indexing lag.
- **Non-goals stay non-goals.** This does not generate tests, block merges on journey verdicts or maintain a central catalog.

## Try it

The reference implementation needs Node 20+ and `git`, with no dependencies to install. Clone the repository and run the test suite and the fictional shop demo:

```bash
git clone https://github.com/gitpash/aap-journeys.git
cd aap-journeys
node --test                  # 47 tests covering seams, mapper, runner, CLI and walks
node examples/shop/demo.mjs  # edits a shared operation, prints --md, finds the neighbour
```

If you already use [AAP](https://github.com/gitpash/agent-artifact-protocol), opting in takes two extension keys in `.aap/map.yaml` (`profiles.enabled: [journeys]` and `layout.journeys: docs/journeys/`), with no schema changes. Without AAP, the CLI simply defaults to `docs/journeys/`. You can also compare `v0.1.0-v1-ci` and `v0.2.0-v2-local` in git history to see how much simpler the setup got once per-PR CI was removed.

*This post was drafted with an AI assistant and edited by me.*
