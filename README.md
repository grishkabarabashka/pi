# Knowledge loop — base implementation

The first and second waves: the main screen, the attention strip, the workspace, closure, the
after-closure screen, plus the general queue and the knowledge projections.
The data comes from `FixtureAdapter`. `LiveAdapter` is not written: it is blocked by questions
Q1–Q5 in `docs/open-questions.md`.

**The idea, and why the interface is shaped this way: [`docs/concept.md`](docs/concept.md).** It is
the one document that carries the whole picture — the knowledge cycle, the signals the work produces
without anyone writing, the cybernetics of the screen. The map of the rest of the documentation is
[`docs/README.md`](docs/README.md).

Documentation and code are in English. The label mapping from the earlier Russian documents is
И → I (invariants), Р → D (decisions), В → Q (open questions); the numbering is unchanged.

## Running

```sh
npm install
npm run dev
```

`npm run typecheck` — types, `npm test` — the invariant scenarios, `npm run build` — the build.

## What is where

| Path | What |
|---|---|
| `src/domain/types.ts` | The entities from `docs/domain.md`. Fields are not invented in code |
| `src/adapters/servicenow/` | The only module that knows about ServiceNow. `types.ts` — the contract, `FixtureAdapter.ts` — the implementation |
| `src/adapters/projection/` | The projection pipeline. Read-only by design: there is no write method (I1) |
| `src/adapters/telemetry/` | Application counters, confirmations and not-applicable marks. Never reaches ServiceNow (I6) |
| `src/agent/agent.ts` | All model calls. Modes `normal` / `slow` / `down` for checking I2 |
| `src/store/app.ts` | The Zustand store. User actions change state synchronously, the model draws in later |
| `src/app/` | The header, the loop strip, and the switching between views |
| `src/screens/main/` | The ticket list, the attention strip |
| `src/screens/workspace/` | The header, the feed, the steps, the input, the sources, the basket |
| `src/screens/closure/` | The slots, the proposals, the after-closure screen |
| `src/screens/queue/` | The team's general queue |
| `src/screens/knowledge/` | The article projections |
| `src/screens/docs/` | The documentation shelf: the files from `docs/` rendered in the app, and `canvas/` — the loop drawn, read in the same reader (D19) |
| `src/ui/` | Shared elements, the freshness wording, and the loop strip that names where an action lands (D20) |
| `fixtures/` | The scenarios from `docs/servicenow.md` |

## How the invariants are checked

**I1 — the projection is a function of the master.** Everything accepted at closure is dispatched
by `publishAccepted`: what changes text goes to `publishArticleVersion` with an anchor, the rest
goes to telemetry. The projection adapter has no write method at all. Tests cover both paths and
the hash conflict.

**I2 — the model does not block input.** The switch at the bottom of the screen changes the model's
behaviour. Under "unavailable" and "slow (30 s)" a note appears in the feed immediately, the field
is not disabled, and the polished text is labelled as not ready. The tests in
`src/store/app.test.ts` pin the synchronicity down.

**I3 — closing is not blocked.** The "Accept and close" button has no `disabled` and there is no
validation. Empty slots go into the package as "not filled in" (`renderClosureNote`). Publication
happens after the closing and never holds it up (D18).

**I4 — evidence is not carried over automatically.** Evidence lives in the trail as its own event
kind and never appears in a proposal by itself. The final text of a proposal is visible before
acceptance.

**I5 — the card and the ticket are one object.** A card on the attention strip has no fields of its
own; the bucket and the tags are set only from the workspace header.

**I6 — telemetry on our side.** Buckets, tags, confirmations, not-applicable marks and use counts
live in the store and in `adapters/telemetry`; nothing is written into ServiceNow.

**I7 — the basis is visible.** Every proposal has a non-empty `basis`, and a slot has either
`provenance` or an explicit "gap" label with a pinpoint question.

## Not closed yet

- `LiveAdapter` — after Q1–Q5
- Editing from the knowledge page (the anchor, the hash check and the rebuild are in the contract;
  the editing screen is not built) — fourth wave
- Promotion of an observation into the canon: `promotionLeft` states the distance to the canon
  (one more independent case, D7), but confirmations are not yet accumulated across tickets
- Search across knowledge, the neighbours graph, the owner dashboard, the slow loop — fifth wave
- The weight of confirmations from `agent.md` ("Protection against formal confirmation") is not
  computed yet
