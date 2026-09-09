# Documentation map

**Start with [`concept.md`](concept.md).** It is the whole idea in one document: why the classical
knowledge base stays broken, how a unit of knowledge is born, confirmed, corrected and retired, what
signals the work produces without anyone writing, and why the interface is shaped the way it is.
Everything else in this folder is detail hanging off it.

---

## The documents

| Document | What it holds | When you need it |
|---|---|---|
| [`concept.md`](concept.md) | The idea, the knowledge cycle, the signals, the cybernetics of the interface | First. Also whenever there is disagreement about intent |
| [`invariants.md`](invariants.md) | I1–I7: rules whose violation means the wrong thing was built, each with how it breaks unnoticed and how to check it | Before writing code. Especially I2 |
| [`decisions.md`](decisions.md) | D1–D20: what was decided, why, and what was rejected | When you are about to reopen a settled question |
| [`open-questions.md`](open-questions.md) | Q1–Q17, each marked with what it blocks | When something cannot be decided from inside the team |
| [`domain.md`](domain.md) | Entities, fields, state transitions, the entity diagram | While implementing. Fields are not invented in code |
| [`screens/`](screens/) | Layout and acceptance criteria per screen | While building a screen |
| [`servicenow.md`](servicenow.md) | The adapter contract, tables, the write-back and conflicts, fixtures | While touching the adapter |
| [`agent.md`](agent.md) | Model call sites, what is blocked while they run (nothing), behaviour when the model is down, target times | While touching anything asynchronous |
| [`roadmap.md`](roadmap.md) | The waves, the risks, what blocks what | When planning |
| [`canvas/`](canvas/) | The same loop drawn: four frames, read in the mockup's Concept view or on their own page | When explaining it to someone, or checking your own picture of it |

Screens: [`main`](screens/main.md) · [`workspace`](screens/workspace.md) ·
[`closure`](screens/closure.md) · [`queue`](screens/queue.md) ·
[`knowledge-page`](screens/knowledge-page.md)

---

## Reading routes

**Deciding whether this gets built** — `concept.md` §1 (summary), §2 (why the usual approach
fails), §10 (scope and success). Then `roadmap.md`.

**Joining the team as an engineer** — `concept.md` end to end, then `invariants.md`, then the screen
you are about to build. `decisions.md` when a choice looks arbitrary.

**Implementing a screen** — `invariants.md` → `domain.md` → the file in `screens/`. Check the
acceptance criteria at the end of each screen document.

**Touching ServiceNow or the projection** — `invariants.md` I1, I4, I6 → `servicenow.md` →
`domain.md` sections on anchors and publication.

**Arguing about the product** — `concept.md` for intent, `decisions.md` for what was already
weighed. If the answer is in neither, it belongs in `open-questions.md` rather than in a guess.

---

## Conventions

A reference like `(I2)` or `(D17)` points at the numbered item in `invariants.md` or
`decisions.md`. `concept.md` cites them rather than restating them, so the rule has exactly one
home.
