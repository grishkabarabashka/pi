# Invariants

Rules whose violation means the wrong thing has been built. Each one is checkable. If an implementation requires breaking an invariant, that is a reason to reopen the discussion, not to work around it.

Label mapping from the original Russian documents: И → I.

---

## I1. The projection is a function of the master

```
projection = f(kb_knowledge in ServiceNow)
```

Nothing reaches the knowledge projection bypassing ServiceNow. Knowledge from tickets, engineer observations, agent proposals — all of it goes through a write into the master and a subsequent rebuild.

**Why.** Otherwise, within a year half of the living knowledge will sit in a system that is not formally the source of truth, and the divergence will become irreparable.

**How it breaks unnoticed.** A "temporary" store of observations appears on our side so as not to touch the article. A projection cache appears, and something is written into it directly.

**Check.** There is no write path into the projection store in the code other than the output of the pipeline. Test: an attempt to write into the projection from any other module does not compile or fails.

---

## I2. The model never blocks input

No user action waits for a model response. A note appears in the feed before any processing. Classification, polishing and deviation detection are drawn in later. When the model is unavailable, the interface works without hints.

**Why.** A wait of several seconds kills the habit of writing notes, and without notes and marks the loop is left without fuel.

**How it breaks unnoticed.** An `await` before updating state. A spinner where text should be. Disabling the input field for the duration of a request.

**Check.** Scenario: the model answers after 30 seconds or does not answer at all. The note appears, the feed scrolls, the next note is typed. Target time to text appearing — 100 ms.

---

## I3. Closing a ticket is never blocked

Unfilled resolution note slots are visible and labelled, but the close button is always enabled. No mandatory fields added by us.

**Why.** Blocking produces text written to pass a control. Quality will drop while the completeness metric rises — the worst possible outcome.

**How it breaks unnoticed.** Form validation. `disabled` on the button. A confirmation dialog that reads as a reproach.

**Check.** Test: all slots empty, the whole basket unreviewed — closing goes through, the record reaches ServiceNow, the gaps are marked in the data.

---

## I4. Evidence is not carried into knowledge automatically

Command output, a link to a monitoring dashboard, a pasted log, a raw note — these live on the ticket. Only what a person accepted on the closure screen reaches the knowledge base article, and only in generalised form.

**Why.** Otherwise customer names, internal hostnames and production log contents will travel into the knowledge base. That is a data classification incident, not a small defect.

**How it breaks unnoticed.** The raw trail is handed to the agent and it quotes it verbatim in a proposal. A proposal is accepted with one press without showing the resulting text.

**Check.** A change proposal always contains the final text the article will receive, and that text is shown before acceptance. Test: evidence carrying a marker appears in no published change.

---

## I5. The card and the ticket are one object

There is no separate card entity on the attention strip. The mark, the bucket and the note belong to the ticket. There is no separate place for details.

**Why.** Today details are written into the notes of Microsoft Planner cards, that is, outside ServiceNow. The gap between the card and the ticket is exactly the cause of the leak.

**How it breaks unnoticed.** A "comment on the board" field appears. A card description appears that differs from the ticket title.

**Check.** There is no entity in the data model with its own textual content attached to a bucket.

---

## I6. Telemetry on our side, content in ServiceNow

The article body, observations and resolution notes live in ServiceNow. Application counters, confirmations, not-applicable marks, freshness, buckets and tags live on our side.

**Why.** Customising ServiceNow is not available, so there is nowhere to keep telemetry there. But keeping content on our side is not allowed either, or I1 breaks.

**Check.** No field carrying knowledge text is stored only on our side. No attempt to write telemetry into ServiceNow.

---

## I7. The basis is always visible

Every change proposal shows what it was derived from. Every filled resolution note slot shows its source. Every suggested article shows why it matched and when it was last confirmed.

**Why.** A person who sees the basis checks the text. A person who sees only the result signs blindly — and the confirmation becomes a false signal.

**Check.** Every proposal has a non-empty `basis` field. Every slot has a non-empty `provenance` or a gap flag.
