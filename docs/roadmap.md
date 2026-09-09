# Sequence and risks

The order in which the loop from `concept.md` is built, and what can go wrong on the way. The
reasoning behind each choice lives in `concept.md`; the closed arguments in `decisions.md`.

---

## Waves

Each wave is shaped so that the engineer gets something usable from it before the next one exists.

| Wave | What is built | Why in this order |
|---|---|---|
| **1** | The main screen: my tickets, the queue with taking, the workspace with the hint, step marks, the notes feed, the dialogue with the agent. The attention strip with buckets and tags. The contextual jump into ServiceNow | The strip replaces the manual work in Planner — that is the lever for the transition. Everything here pays the engineer before it asks anything of them |
| **2** | The change basket, the closure screen, the after-closure screen, writing the package into ServiceNow. The pilot on recurring alerts | The loop starts producing. Alerts give coverage fastest (D13) |
| **3** | Confirmations, observations, the promotion threshold, freshness signals, write-back with anchors. Extension to user requests | Freshness only means something once there is a stream of applications to derive it from |
| **4** | The knowledge page, neighbours, search, changes as incident context | Reading with trust signals is needed earlier, in a minimal form, because of D16 — a suggested article opens on our side, not in ServiceNow |
| **5** | The slow loop over closed tickets, the owner dashboard, the graph | A dashboard built before telemetry accumulates shows that everything is on fire and destroys trust in the freshness metric (D14) |
| **separate track** | A full shift handover brief | The "for the next shift" bucket from wave 1 covers most of the need at a fraction of the cost |

---

## Risks

| Risk | Consequence | What we do about it |
|---|---|---|
| The interface waits for the model | Half the value is gone immediately: notes stop being written and the loop loses its fuel | Nothing waits on the model; the note is on screen in 100 ms regardless (I2) |
| The pipeline cannot emit anchors | Edits never reach the master and a shadow knowledge base appears unnoticed | Q7 is asked before development, not discovered later. It is the single largest technical dependency |
| The notes field is slower than a scratchpad | The loop is left without prose entirely | One field, no typing overhead, instant write. The draft is built on structural signals anyway, so prose is an addition |
| The agent comments too often | People stop using the feed within a week | Silent by default; it intervenes only on a deviation (`agent.md`) |
| Confirmation degenerates into a formality | Freshness becomes a false signal — worse than no signal, because it is believed | The one-press path only on a strong prediction (D17), quiet confirmation weights, selective questions, no counters |
| Evidence with customer data reaches an article | A data classification incident, not a defect | Evidence stays on the ticket; only an accepted generalised wording travels (I4). A link instead of a copy |
| Chasing parity with ServiceNow | The long tail of features eats the development effort | Three screens deep, everything else a contextual link (D12) |
| The owner dashboard is built too early | It shows that everything is on fire and undermines the idea of a freshness metric | Wave 5, after telemetry has accumulated (D14) |
| Observations are never promoted because volumes are low | The canon is not replenished and observations pile up unread | A threshold of two engineers, or one owner (D7) |

---

## What blocks what

Three answers are needed from outside the team. None of them blocks the first wave, which runs on
fixtures today.

| Question | Blocks |
|---|---|
| Q3 — can an article be published through the API without an approval workflow | D2 in full. If approval is mandatory, the model of publishing without review changes |
| Q7 — can the pipeline emit block provenance | The write-back path in full (I1) |
| Q10 — does a stable alert signature reach the ticket | Grouping of repeats, the occurrence history, closing "as last time" — the whole advantage of the alert pilot |

`LiveAdapter` waits on Q1–Q5. The full list, with what each one blocks, is in `open-questions.md`.
