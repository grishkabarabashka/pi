# Screen: ticket workspace

The central part of the main screen in `work` mode. One chronological feed in which notes, step marks, evidence and agent remarks are interleaved.

## Zones

```
┌────────────────────────────────────┬──────────────────────┐
│ A. Header: ticket, tags, buckets   │ D. Sources           │
│ F. State, push into the ticket     │    (three sections)  │
├────────────────────────────────────┤    not about our case│
│ B. Feed                            ├──────────────────────┤
│    suggested steps                 │ E. Basket            │
│    changes nearby                  │                      │
│    notes, questions, agent replies │                      │
│    G. evidence                     │                      │
├────────────────────────────────────┤ [Go to closure]      │
│ H. Close as last time              │                      │
│ C. Input field                     │                      │
└────────────────────────────────────┴──────────────────────┘
```

---

## A. Header

Identifier, title, the "open in ServiceNow" link on the right. Below, the origin line: monitoring alert or user request, the number of past occurrences for an alert, the application, the age.

Below that — the ticket tags with a cross, the "tag" button, a separator, then the bucket buttons. The active bucket is highlighted. Pressing again removes it.

---

## B. Feed

### Suggested steps

The section heading states its purpose directly: mark them as you go, this is the feedback. Do not hide the meaning — the person must understand that the mark is needed by someone.

Each step is a button that cycles the state: `open → done → failed → open`. The colour of the bar on the left and the sign change together. A step in `failed` is struck through and labelled "did not help".

The transition into `failed` immediately adds a proposal of kind `correction` to the basket. Its strength follows the basis strength table in `agent.md`: with evidence attached to the ticket it is `strong` and changes the canonical text, without evidence it is `weak` and goes into the observations. Pasting evidence afterwards raises the strength of the corrections already in the basket.

(Earlier editions of this file said `strength: strong` unconditionally, which contradicted `agent.md`. The table in `agent.md` wins: a mark without evidence is one person's word, and one person's word does not rewrite verified text.)

### Changes nearby

Change records on the ticket's CI within the incident window. Identifier as a link, the system name, the time. When empty, the section is not shown.

### Feed events

Three kinds, distinguished by the colour of the bar on the left and by the label:

| Kind | Bar | Label |
|---|---|---|
| Note | neutral | `09:38 note` |
| Question | neutral | `09:42 question` |
| Agent reply | violet | `09:39 agent` |

**A note** shows `polished` when it is ready, otherwise `raw`. Under the text there is a link "show what I wrote" / "show the polished text". While the polished text is being prepared — the label "polishing in progress"; the text is already visible at that point (I2).

**An agent remark** may contain buttons. The typical case: "Step 3 did not work. Record as a deviation?" with "Record" and "Not now". The buttons disappear after the decision, the event stays in the feed.

---

## C. Input field

One field, two modes:

| Key | Mode | Agent behaviour |
|---|---|---|
| `Enter` | note | silent |
| `Cmd/Ctrl + Enter` | question | answers |

The hint about the modes is permanently visible next to the field.

By default the agent is silent and inserts a short remark only where it has noticed a deviation. If it comments on every note, people will stop using the feed within a week.

The field accepts anything: log lines, a link to a monitoring dashboard, a change number, a fragment of a thought. There is no type selector — the agent classifies, and it errs silently.

**The field competes with a scratchpad, not with ServiceNow.** If it is slower than a scratchpad, the loop will be left without fuel.

---

## D. Sources

Three sections, separately labelled. Not to be mixed: they carry different authority.

1. **Past occurrences** — only for `origin: alert`. Shown first. Wording of the form "12 of 14 times draining the MQ queue helped, twice it was a real problem".
2. **Articles** — a card per article: the title, the freshness signal in words and in colour, the reason for the match. Freshness is checkable: "confirmed 3 days ago, applied 14 times" or "not confirmed for 9 months". There are no hidden confidence numbers (I7).
3. **Similar tickets** — closed tickets with a link and one line about the outcome.

For `origin: user` the articles section comes first; instead of the occurrence history there are interaction procedures and similar requests.

---

### Not applicable

Each article card carries one more control: **"not about our case"**. It is the only signal that corrects the matching rather than the content (concept 6.1).

Pressing it puts a `not_applicable` proposal into the basket with `strength: weak` and the basis "marked as not matching on this ticket". The card stays in place but is muted, so that the person sees what they discarded and can undo it. Pressing again withdraws the proposal and restores the card.

The proposal is not written into the article body (I4, and `closure.md`): at closure it only increments `notApplicableMarks` in the telemetry.

### Confirming an article

Marking every step of an article `done` means the procedure worked. This is the main source of freshness, and it must not require a separate press: a `confirmation` proposal with `strength: strong` and the basis "all steps of the procedure marked as done on this ticket" goes into the basket by itself.

If afterwards any step is moved out of `done`, the confirmation is withdrawn — exactly like the `correction` raised by a `failed` mark.

A confirmation changes no text. At closure it adds a Confirmation to the article telemetry and refreshes `lastConfirmedAt` (I6).

---

## E. Basket

Visible at all times; it does not appear out of nowhere at closure. Each item: the kind in colour, a short text, nothing more. The details are on the closure screen.

The "Go to closure" button at the bottom of the panel.

---

## F. State and pushing to the ticket

Three controls in the header, on the right, next to the ServiceNow link. They exist because tickets getting stuck on people is named as one of the main losses of time, and because a person in ServiceNow must not see an empty ticket for two days (D9).

| Control | Available in | Result |
|---|---|---|
| "Waiting for a reply" | `work` | `state: work → wait`, a `state_changed` event, a consolidated note is pushed to the ticket |
| "Resume" | `wait` | `state: wait → work`, a `state_changed` event, nothing is pushed |
| "Push into the ticket" | always | The current work trail as a consolidated note, one `pushed_to_sn` event |

The consolidated note is assembled from the trail since the previous push: the polished notes, the step marks, the state changes. It is assembled without the model as well — the raw texts are used then (I2).

The button does not become disabled while the write is in flight. If the write fails, a line appears in the feed saying the note has not reached ServiceNow, and the button offers to try again. Nothing is lost: the trail stays on our side.

---

## G. Evidence

Command output, a log fragment, a link to a monitoring dashboard. Pasting into the input field with the `Shift + Enter` combination creates an `evidence_added` event rather than a note.

Evidence is shown in the feed in a monospaced block, collapsed to five lines with a "show all" control.

**A link instead of a copy.** If what is pasted is recognised as a URL, only the link is stored, with the time window preserved. A permanent link to a dashboard is almost as useful as the data and removes the data classification question (concept 7.3).

Evidence lives on the ticket and never travels into an article by itself (I4). It strengthens the basis: a `correction` raised by a `failed` step mark on a ticket that has evidence gets `strength: strong` with the basis naming that evidence; without evidence the same mark yields `weak` (see the basis strength table in `agent.md`).

---

## H. The short path for a recurring alert

Available only when both conditions hold at once (concept 6.3, D13, D17):

- the ticket has an `alertSignature` and an occurrence history with a stable resolution
- every suggested step is marked `done`, and none is `failed`

Then a single line appears above the input field: what was done last time, on how many of how many occurrences, and one button — **"Close as last time"**. It fills the slots from the history and the step marks and takes the person to the closure screen with everything already assembled. It does not close the ticket itself: the person still sees the composition and presses "Accept and close" (`closure.md`).

With a weak match, with a diverged course, or with no signature the line does not appear at all. There is nothing to offer, and an offer would turn confirmation into a formality (`agent.md`, "Protection against formal confirmation").

---

## I. Agent interventions

By default the agent is silent. It has the right to insert one remark on the events below, and not more than one per event.

| Trigger | The remark | The buttons |
|---|---|---|
| A step marked `failed` | "Step N did not work. Record it as a deviation to the article?" | "Record" → the `correction` proposal is kept; "Not now" → the proposal raised by the mark is withdrawn |
| A suggested article has not been confirmed for more than 90 days and its steps are being marked | "This article has not been confirmed for N months. If it worked, confirm it at closure." | "Confirm" → a `confirmation` proposal; "Not now" |
| The alert history is stable and the course of the resolution matched it | No remark: the same fact is already stated by the short-path line in H, and saying it twice is noise | — |

The remark arrives asynchronously and never blocks anything. If the model is unavailable, the remark simply does not appear — the step mark raises its proposal anyway, because it is a structural signal (`agent.md`).

---

## J. Trail events on the sources

The sources panel emits two events, and they are the only source of the article application telemetry and of the `co_occurrence` edges (`domain.md`, EdgeKind):

- `article_suggested` — once per article, when the hint arrives
- `article_opened` — when the article title is pressed and the projection opens

Without these two events `useCount` cannot be earned and the graph does not improve on its own. They are written into the trail as `system` and `user` events respectively and are not shown in the feed: there is nothing to read there.

---

## Interactions and states

| Event | Result |
|---|---|
| Step marked `failed` | A `correction` proposal into the basket; `strong` with evidence, `weak` without |
| Step marked back to `done` | The proposal is withdrawn |
| All steps marked `done` | A `confirmation`, `strong` proposal into the basket |
| A step moved out of `done` after that | The confirmation is withdrawn |
| "Not about our case" on an article card | A `not_applicable`, `weak` proposal; the card is muted |
| The same control pressed again | The proposal is withdrawn, the card is restored |
| "Record" on an agent remark | A proposal of the matching kind into the basket |
| "Not now" | The remark is dismissed, no proposal is created |
| A question to the agent | The remark appears, the answer arrives asynchronously |
| `Shift + Enter` in the input field | An `evidence_added` event instead of a note |
| "Waiting for a reply" / "Resume" | A state change plus a `state_changed` event |
| "Push into the ticket" | A consolidated note into ServiceNow, a `pushed_to_sn` event |
| "Close as last time" | The slots are filled from the history, the transition into `closing` |
| The model is unavailable | Notes are written, the polished text is marked `failed`, `raw` is shown, there are no hints |

---

## Acceptance criteria

- The note text is visible no later than 100 ms after `Enter`, regardless of the state of the model (I2)
- No control is disabled for the duration of a request to the model
- Every article card has the freshness signal and the match reason filled in (I7)
- The source sections are not merged into a single list
- The basket is visible in `work` mode, before going to closure
- The raw text of a note is always available in one click
- Marking all steps `done` raises a `confirmation` proposal without a separate press
- The `not_applicable` proposal has a non-empty `basis` and does not change the article text
- Evidence never appears in a proposal verbatim (I4)
- The "Close as last time" line does not appear when there is no signature, when the match is weak, or when a step is `failed`
- A failed push into the ticket loses nothing: the trail stays and the action can be repeated
