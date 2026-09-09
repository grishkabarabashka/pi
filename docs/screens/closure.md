# Screen: ticket closure

A review of what has accumulated, not the creation of something new. Unfolds in place of the workspace, mode `closing`. Going back to `work` is always available.

## Zones

```
┌──────────────────────────────────────────────────────────┐
│ Header: identifier, "Closure", back to work              │
├───────────────────────────┬──────────────────────────────┤
│ A. Into the ticket —      │ B. Into the knowledge base — │
│    specifics of this case │    for others                │
│    four slots             │    proposals from the basket │
│    [Accept and close]     │                              │
└───────────────────────────┴──────────────────────────────┘
```

Two columns of equal width. The split is spatial and deliberate: people confuse the specifics of a case with reusable knowledge, and separated, labelled columns teach the distinction without training.

---

## A. Resolution notes

The column subtitle says plainly where the text came from: assembled from the work trail, edit it where it is imprecise.

### Slots

A fixed set of four: symptom, cause, what was done, verification.

Each slot:

```
Symptom      from the alert description and the step marks
┌────────────────────────────────────────┐
│ Latency on GW-3 grew to 800 ms, …      │
└────────────────────────────────────────┘
```

- **The provenance label** sits to the right of the name. If a person sees where the text came from, they check it instead of signing blindly (I7).
- **An empty slot** is highlighted with a border and a background, the provenance label is replaced by the word "gap", and the field holds the agent's pinpoint question: "what confirmed that the latency returned to normal". Not a generic hint, but a specific question about this ticket.
- All slots are freely editable.

### The close button

`Accept and close` is **always** enabled (I3). Next to it a line: "1 gap will remain in the record" or "all slots are filled". Below, an explanation that closing is not blocked and the gap will simply remain visible in the team statistics.

The tone matters here: the message about a gap is information, not a reproach. Wordings such as "you did not fill in" and "required field" are not acceptable.

---

## B. Proposals

Subtitle: accumulated during the work, N of M reviewed.

### A proposal card

```
Correction · FIX gateway: latency diagnostics, step 3
┌──────────────────────────────────────────────┐
│ − Restart the gw-router service              │
│ + Check the MQ queue depth on upstream       │
└──────────────────────────────────────────────┘
Replace the gw-router restart with a queue depth check.
basis: step mark and pasted output
[Accept] [Edit] [Reject]
```

Mandatory elements:

- **Kind and target** — what the change is and into which article
- **A diff** for pinpoint edits: the line removed and the line added, in different colours
- **The final text** the article will receive. Shown **before** acceptance — without this I4 is broken: the person cannot check whether evidence has leaked into knowledge
- **The basis** — what it was derived from. Always filled in (I7)
- **For observations** — how many confirmations remain until promotion into the canon

### States

| Status | Appearance |
|---|---|
| `pending` | The buttons are visible |
| `accepted` | Confirmation border and background, the label "accepted", the buttons hidden |
| `rejected` | Muted, the label "rejected", the buttons hidden |

"Edit" turns the final text into an editable field. An edited proposal stays `pending` until "Accept" is pressed.

### Observations versus the canon

A proposal with `strength: weak` is labelled as an observation and states that it will go into a separate section of the article, and into the main text only after a second confirmation. This must be visible before acceptance, so that the person understands the weight of their action.

### The column footnote

A permanent text at the bottom: what is accepted is published to ServiceNow immediately, under your name, with one-click revert. Observations go into a separate section of the article.

---

## C. Publication of what was accepted

This is where the loop closes: without this section, accepted proposals reach `close_notes` and nothing else, and the master never learns about the edit (I1).

### What happens on "Accept and close"

The ticket is closed first, the publication follows. Closing does not wait for it and is not blocked by it (I3, D18).

Every accepted proposal is dispatched according to its kind:

| Kind | Where it goes | What is written |
|---|---|---|
| `correction`, `extension` | `publishArticleVersion` with the anchor | A new version of the article body |
| `creation` | `publishArticleVersion` without an anchor | A new article |
| `deprecation` | `publishArticleVersion` with the anchor | The article state |
| `confirmation` | Telemetry only (I6) | A Confirmation with the version, the engineer, the ticket and the time |
| `link` | Telemetry only | An `explicit_link` edge |
| `not_applicable` | Telemetry only | `notApplicableMarks` incremented |

A proposal with `strength: weak` is published into the observations section of the article rather than into the canonical text, with its `basis` and the source ticket. It moves into the canon only when the threshold is reached (D7), and that promotion is not part of closing.

### Conflicts

If `contentHash` did not match, the article was changed in ServiceNow while the work was going on. Then:

- the ticket stays closed, the resolution notes are already written
- the proposal is rebuilt against the new body and is preserved
- the after-closure screen shows this explicitly, with the article name and the reason

A silent overwrite is unacceptable: that is how the work of an owner who edited the article directly gets erased (`../servicenow.md`, "Conflicts").

### While the publication is in flight

The after-closure screen shows the state of each change: sending, published with a version, a conflict, or an error. Nothing spins over the work and nothing blocks the "Next ticket" button.

---

# Screen: after closure

Shows the composition of what went into ServiceNow. Replaces the workspace after a successful write.

## Content

1. **Resolution notes** — all four slots with their text. An empty slot is shown as "not filled in", not omitted.
2. **Additionally into the ticket** — the work chronology with the number of entries, the articles used with their versions, a link to the full review.
3. **Changes in the knowledge base** — only the accepted proposals, each with the state of its publication: sending, published with a version number, a conflict, or an error. If nothing was accepted, it says so.
4. The "Next ticket" button.

## Why

For the first weeks, until people believe the system writes sensible things. Later it collapses to a single line — but it must not be removed before that trust has formed.

---

## Acceptance criteria

- Closing goes through with all slots empty and the basket unreviewed (I3)
- An empty slot is written into ServiceNow as "not filled in", not omitted
- The final text of every proposal is visible before acceptance (I4)
- The `basis` field is non-empty on every proposal (I7)
- Leaving closure mode back into work loses neither the basket nor the slot edits
- A rejected proposal is not written into ServiceNow but stays in the work trail
- A proposal of kind `not_applicable` updates telemetry and does not change the article body
- Every accepted proposal that addresses an article reaches `publishArticleVersion`; nothing that changes text stops at `close_notes` (I1)
- A publication conflict does not roll back the closing and is shown to the person, not resolved automatically
- A `confirmation` writes telemetry and does not change the article body
