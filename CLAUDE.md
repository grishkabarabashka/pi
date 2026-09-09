# CLAUDE.md

Rules for working in this repository. Documentation and code are in English.

## What this is

The interface of a knowledge feedback loop for application support engineers. An engineer works on their own tickets, receives a hint from the knowledge base, keeps notes and a dialogue with the agent, and at closure reviews the proposals about changing knowledge that have accumulated.

## Reading order

`docs/README.md` is the map of the documentation and lists reading routes by task.

1. `docs/concept.md` — **the whole idea in one document**: the knowledge cycle, the signals the work produces, the cybernetics of the interface. Read it first, and again whenever there is disagreement about intent
2. `docs/invariants.md` — rules that must not be broken. Read before writing code
3. `docs/domain.md` — entities, fields, states, the entity map
4. `docs/screens/main.md`, `workspace.md`, `closure.md`, `queue.md`, `knowledge-page.md` — screen specifications with acceptance criteria
5. `docs/servicenow.md` — the adapter contract
6. `docs/agent.md` — where the model is called
7. `docs/decisions.md` — what has already been decided and why
8. `docs/open-questions.md` — what is still unknown and what it blocks
9. `docs/roadmap.md` — the waves and the risks

Label mapping from the earlier Russian documents: И → I (invariants), Р → D (decisions), В → Q (open questions). The numbering is unchanged.

## Rules

**Invariants beat convenience.** If an implementation requires breaking an invariant from `invariants.md`, stop and say so instead of working around it. Especially I2: any `await` before updating interface state is a bug.

**ServiceNow only through the adapter.** No component except `adapters/servicenow/` knows about tables, `sys_id` or response shapes. `FixtureAdapter` is what runs today; do not write `LiveAdapter` before Q1–Q5 in `open-questions.md` are answered.

**The projection is read-only on our side.** `adapters/projection/` has no write method, and none is to be added (I1). An edit goes through a proposal with an anchor and comes back as a rebuild.

**Do not invent domain fields.** If a needed field is not in `domain.md`, propose an addition to the document first, then write code.

**Do not add mandatory fields.** No validation that blocks closing a ticket (I3).

**Do not mix knowledge sources.** Articles, similar tickets and the alert history are three separate lists with different labels. Do not merge them into one ranked list.

**Always show the basis.** A proposal without `basis` and a slot without `provenance` is an unfinished implementation (I7).

**State is not lost when switching views.** The open ticket, the closure mode, the input field draft, the queue filters and whether the strip is expanded live in the store, not in components (D15). Local `useState` for anything that must survive going to another view is a bug.

**From a ticket we lead to the projection, not to ServiceNow.** The ServiceNow link stays as a second line (D16).

**Do not close open questions by guessing.** If an answer to a question from `open-questions.md` is needed for the implementation, say so rather than silently picking an option.

## Stack

A proposal to be agreed; to be fixed after the first sprint:

- Vite, React, TypeScript
- State: local in components plus a small store for tickets and the basket. No Redux
- Styles: CSS variables and modules. No UI framework — the interface density is non-standard and ready-made components would get in the way
- Data: an adapter layer with the interface from `servicenow.md`, fixtures in `fixtures/`
- Tests: the scenarios from the "acceptance criteria" in the screen specs, plus invariant checks

## Structure

```text
src/
  adapters/servicenow/     the interface, FixtureAdapter, LiveAdapter later
  adapters/projection/     the projection pipeline, read-only (I1)
  adapters/telemetry/      counters, confirmations, not-applicable marks; never reaches SN (I6)
  domain/                  types and state transitions from domain.md
  agent/                   model calls, all asynchronous
  app/                     the header, view switching, the shell
  screens/
    main/                  the ticket list, the attention strip
    workspace/             the feed, steps, the input field, the sources
    closure/               slots, proposals, the after-closure screen
    queue/                 the team's general queue
    knowledge/             article projections
  store/                   state that survives switching views
  ui/                      small shared elements
fixtures/                  the scenarios from servicenow.md
docs/                      see above
```

## What not to do

- Do not build feature parity with ServiceNow. For missing actions — a contextual link outward (D12)
- Do not add contribution counters, author ratings or gamification
- Do not show hidden confidence numbers. Freshness in words and checkable
- Do not invent the content of an empty slot. A gap is better than invented text
- No modal dialogs and no toasts on top of the work
- Do not write telemetry into ServiceNow and do not keep the article body on our side as the source of truth (I6)
