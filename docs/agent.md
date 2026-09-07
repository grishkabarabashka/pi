# The agent and the model

Where the model is called, what is blocked while it runs (nothing), and how the system behaves when the model is unavailable.

The main rule is I2: **the interface never waits for the model.** All model results are optional decoration on top of state that is already available instantly.

---

## Call sites

| Site | Synchronicity | What if it does not answer |
|---|---|---|
| The hint when a ticket is opened | asynchronous, after the ticket is rendered | The sources panel is empty with the label "hint unavailable". The ticket is open and workable |
| Polishing a note | asynchronous, after the raw text has appeared | `polishState: failed`, `raw` is shown. Nothing is lost |
| Classifying pasted evidence | asynchronous, in the background | The evidence stays in the trail as is |
| Detecting a deviation | asynchronous, in the background | There is no agent remark. The step mark still raises a proposal — it is a structural signal, not a model one |
| Answering a question | asynchronous, streamed | The label "the agent did not answer". The question stays in the feed |
| Assembling the resolution note slots | on the transition to closure, asynchronous | The slots are empty with their questions. Closing goes through anyway (I3) |
| Compressing the chronology for the package | at closure, asynchronous | An uncompressed trail goes into the package |

Step marks, changes nearby on the CI, the alert occurrence history and state changes are **structural signals**. They require no model and always work. That is exactly why the notes draft is built on them rather than on prose: notes are hardly written today, and they cannot be relied upon.

---

## The attention budget

How much the agent is allowed to say is determined by the novelty of the ticket, not by the seniority of the engineer.

| Situation | Agent behaviour |
|---|---|
| Strong match, the course of the resolution matched the prediction | Silent. At closure — a ready package and a single confirmation |
| Strong match, the course diverged | One short remark about the deviation |
| No match or a weak one | Proposes nothing, waits for a question |
| The article has not been confirmed for a long time | Explicitly asks for confirmation at closure |
| A recurring alert with a stable history | Offers to close it as last time |

By default the agent is silent. An unsolicited remark is the exception, not the norm.

---

## What the agent never does

- Does not publish a change itself. Publication happens only through human acceptance on the closure screen
- Does not carry evidence into the article text verbatim (I4). A proposal always carries a generalised wording, and it is visible before acceptance
- Does not block input, does not disable buttons, does not show modal dialogs
- Does not comment on every note
- Does not invent the content of a slot. An empty slot stays empty with a question; invented text is worse than a gap

---

## Basis strength

The agent marks every proposal with the strength of its basis, and that determines whether the canonical text changes.

| Basis | Strength | Where it goes |
|---|---|---|
| A `failed` step mark plus attached evidence | `strong` | Into the canonical text |
| A step mark without evidence | `weak` | Into observations |
| Only a remark in the dialogue | `weak` | Into observations |
| The alert repeat history over N cases | `strong` when N ≥ 3 | Into the canonical text |

The `basis` field is filled with human-readable text and is always shown (I7).

---

## The periphery

The attention strip and the counters are peripheral vision. The rules:

- Preattentive means only: numbers, dots, colour, position, slight movement
- No text that has to be read in order to understand the state
- Nothing pops up over the work. No modal dialogs, no toasts, no sound
- A change is noticed through movement, not through the appearance of a new block that shifts the layout
- Pulsing only for the swarm and only while it is in progress. Under `prefers-reduced-motion` the animation is disabled

---

## Protection against formal confirmation

The mechanisms work quietly, at the level of weights rather than prohibitions.

- **A short path only on a strong prediction.** With a weak match there simply is no one-press closing — there is nothing to offer
- **The weight of confirmations.** If an engineer's confirmations are regularly refuted by subsequent tickets, or the interval between opening an article and confirming it is consistently below a plausible reading time, the weight is lowered. Without notifications, without any reflection in the interface
- **Selectivity.** A pinpoint question is asked based on novelty plus a low-frequency random check. A question on every closure is automated away in a person's head within a week
- **No contribution counters and no ratings.** The only metric acceptable to show a person is how many times their article helped others

---

## Target times

| Action | Target |
|---|---|
| The raw note text appearing in the feed | 100 ms |
| The first token of the agent's answer | 1.5 s |
| The polished note being ready | 3 s, not critical |
| The hint when a ticket is opened | 3 s, not critical |

Exceeding the non-critical targets is not counted as a failure: the interface works without them.
