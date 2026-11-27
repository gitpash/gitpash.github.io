---
title: 'Checking user scenarios across repos without a central catalog'
description: 'How journeys layer cross-repo scenario checks on top of unit tests using contract seams and plain search, and why we dropped per-PR CI for a local gate and periodic audit.'
cover: 'blocks'
pubDate: 2026-11-27
seoTitle: 'Journeys: checking user scenarios across repos without a central catalog'
series: 'aap'
seriesOrder: 4
tags: ['ai', 'agents', 'aap', 'testing', 'workflows']
---

Unit tests prove that a function works. They do not prove that a user scenario still holds after someone reshapes an API in another repository. In [the first post](/blog/a-map-instead-of-more-context/) I described AAP, a small checked-in map that helps a coding agent orient itself across repositories without loading all of them. Orientation is only half the problem, because once an agent knows where things live, it still needs a reliable way to know what its diff might break.

Take a simple flow: placing an order. A web storefront and a mobile app both call the same `placeOrder` mutation on an orders API, and every repository's unit tests are green. Then someone changes the input shape of `placeOrder` in the API repository. The author of that change may not know the mobile app calls it, and a coding agent working inside the API checkout knows even less because it only sees one repository.

I wanted a lightweight layer on top of unit tests that answers one question for both people and agents: which user scenarios does my diff touch, and do they still hold? The result is [`aap-journeys`](https://github.com/gitpash/aap-journeys), an opt-in extension of AAP with a reference implementation in about 340 lines of Node ESM and zero dependencies.

## One journey per scenario

A journey lives inside the repository that owns it and has three small pieces. The first is a short markdown file with a state-transition table (`state | event | guard | next`) and the contracts the flow uses. The second is a walk test that reads that table and asserts every row, so documentation and code cannot drift silently. The third is one entry in `docs/journeys/manifest.json`:

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

Zones are plain path prefixes rather than globs, which keeps matching predictable and easy to audit. When a diff touches a zone, a journey doc, a listed test, or a GraphQL operation whose root field matches a declared seam, only the affected journeys run. A repository with no manifest is simply reported as "not covered", never as an error.

## Seams instead of a central catalog

The central design rule is strict: no central catalog of journeys or seams exists, and none may be created. A hand-kept cross-repo registry drifts the moment someone adds, renames, or deletes a flow in another repository. Instead, repositories meet only at **seams**, which are canonical server-side contract IDs (`gql:Mutation.placeOrder`, `grpc:shop.orders.OrderService/Cancel`, `event:orders.placed`, `rest:POST /v1/orders`).

```text
Diff in orders-api: placeOrder changes
  -> seam: gql:Mutation.placeOrder
  -> search manifests across repos (no central catalog)
       |- web-storefront  (place-order) -> run leg locally: PASS or FAIL
       |- mobile-app      (quick-buy)   -> not runnable here: UNVERIFIED (with reason)
       '- admin-portal    (no journey)  -> uncovered consumer
```

Each consumer repository declares the seams its journeys depend on, while the serving API repository never lists its consumers. When a backend diff changes a schema, `.proto` file, route, or topic, the agent runs `journeys discover gql:Mutation.placeOrder`. That command prints plain search commands (`gh search code` or `git grep` over local clones) and never touches the network itself.

Discovery by search degrades gracefully when adoption is partial. If a consumer repository has not adopted journeys yet, nothing breaks, and an optional bare-field search still surfaces it as an `uncovered consumer`. Each adopted repository stays complete on its own, even if partial adoption lasts for years.

## What changed between v1 and v2: dropping per-PR CI

The first version of this workflow looked like most engineering tools (tagged `v0.1.0-v1-ci` in the repository). It ran journeys as a soft-fail GitHub Actions job that posted a sticky comment on every pull request, listing touched journeys, warnings, and neighbour discovery commands. That shape seemed obvious on paper, and three practical problems pushed me to rip it out within days.

First, nobody reads noisy bot comments. A soft-fail sticky comment blends into PR chatter, so reviewers scroll right past it. Second, CI cannot run the cross-repo half that matters most: neighbour legs need local clones or org-wide search tokens, so CI ended up printing commands it could not execute itself. Third, CI minutes are not free, and paying for another workflow on every push just to re-render a table the coding agent already ran locally is waste.

Workflow v2 (tagged `v0.2.0-v2-local`) replaces per-PR CI with a local gate before push, a compact evidence block in the PR body, and a periodic audit. Lint, types, and unit tests stay hard stops, while journeys sit right after them as a graded check that never blocks a merge:

```text
lint/types (hard stop) -> unit tests (hard stop) -> journeys (graded, never blocks merge) -> review
```

Before pushing, an agent in a client repository runs the local gate with `--md` and pastes the result directly into the PR body. A reviewer then reads only that short block instead of hunting through bot comments:

```bash
node tools/journeys/journeys.mjs check --base origin/main --md
```

```markdown
## Journeys
Escalation: none
Own: place-order PASS | stale: place-order (info)
Contract change: none
```

Several smaller rules changed alongside removing CI, and together they made the signal much cleaner. The table below compares the two tagged slices side by side:

| Topic | v1 (per-PR CI) | v2 (local gate + audit) |
|---|---|---|
| Where it runs | Soft-fail GitHub Actions sticky comment | Locally before push (`--md`), pasted into PR body |
| Client neighbour output | Printed a neighbour-legs section in every repo | Client repos never print neighbour legs (a client cannot break another client) |
| Serving-side trigger | Prose duty only | Mechanical trigger when `git diff` touches schema, `.proto`, route, or topic files |
| Non-pass outcomes | `SKIPPED` and `not verified` | `UNVERIFIED: <reason>` and `WAIVED: <test> - <why>` (via `--waive`) |
| Human escalation | None | Line 1 `Escalation: none` or `<reason>` on breaking unverified seams, unwaived FAIL, or repeat waivers |
| Zero search hits | State which method was used | Always `Discovery: search, 0 hits (default branch only)`, never "no consumers" |

Instead of running a bot on every commit, compliance is checked by a manual audit roughly every four weeks over merged PRs in opted-in repositories. The audit tracks block presence (target at least 80%), reason honesty on `WAIVED` and `UNVERIFIED` rows (at least 90%), and waiver rate (under 20%). It also flags repeat waivers on the same journey within four weeks (zero, otherwise fix or demote it) and counts real catches before merge (at least one). Tightening happens only on evidence, starting with a presence-only check if needed, never by blocking merges on journey verdicts.

## Small things learned while building the runner

Writing a small reference implementation with zero dependencies surfaced a few sharp edges right away. The first was a silent false pass inside Node's own test runner. When a journey command runs `node --test` inside a parent `node --test` process, the inherited `NODE_TEST_CONTEXT` environment variable turns the child test run into a no-op that exits `0`. A failing journey looked green until the runner stripped `NODE_TEST_CONTEXT` from the child environment, which is a concrete reminder that a broken runner must never look green.

The second edge was deleted operations. When checking whether a diff touched a GraphQL seam (`seam-touched`), inspecting only the working tree misses operations that were deleted or renamed. Reading both the merge-base version (`git show <merge-base>:<file>`) and the current version ensures that removing a call still triggers the journey that depended on it.

The third edge was GraphQL naming. Clients name operations and field aliases however they like (`mutation SubmitCheckout { receipt: placeOrder(...) }` versus `mutation Buy { placeOrder(...) }`), while the contract is always the server-side root field. Ignoring operation names and aliases so both resolve to `gql:Mutation.placeOrder` keeps the seam extractor small and lets every consumer agree on one string without coordinating.

## What is and is not shown here

- **Value outside one real multi-repo codebase is not yet measured.** The design was exercised in one real multi-repo setup, and the public repository uses a fictional shop example. Do not treat this as a proven standard until you measure it on your own pull requests.
- **Only GraphQL call seams are derived automatically.** gRPC, event, and REST seams are hand-written in the manifest, and `seam-gone` is misleading for repositories that only serve a GraphQL seam rather than calling it.
- **Seams are root-field grain.** A nested field change hides under the root field unless a journey declares a deeper coordinate by hand.
- **Neighbour legs are proven only when someone runs them.** Otherwise the honest result is `UNVERIFIED: <reason>`, and code search covers default branches only with indexing lag.
- **Non-goals stay non-goals.** This does not generate tests, block merges on journey verdicts, or maintain a central catalog.

## Try it

The reference implementation needs Node 20+ and `git`, with no dependencies to install. Clone the repository and run the test suite and the shop demo:

```bash
git clone https://github.com/gitpash/aap-journeys.git
cd aap-journeys
node --test                  # 47 tests covering seams, mapper, runner, CLI and walks
node examples/shop/demo.mjs  # edits a shared operation, prints --md, finds the neighbour
```

If you already use [AAP](https://github.com/gitpash/agent-artifact-protocol), opting in takes two extension keys in `.aap/map.yaml` (`profiles.enabled: [journeys]` and `layout.journeys: docs/journeys/`), with no schema changes. If you do not use AAP, the CLI simply defaults to `docs/journeys/`. You can also compare the two tagged slices (`v0.1.0-v1-ci` and `v0.2.0-v2-local`) in git history to see how much simpler the repository became once per-PR CI was removed.

*This post was drafted with an AI assistant and edited by me.*
