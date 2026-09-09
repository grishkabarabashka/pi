# Decision log

Decisions taken during design, with their reasons and the alternatives rejected. It exists so that in six months closed questions are not reopened and a decision is not reversed without knowing what stood behind it.

Label mapping from the original Russian documents: Р → D.

---

## D1. The source of truth for an article is ServiceNow

The wiki projection is derived. Engineers' edits are written into `kb_knowledge`, then the projection is rebuilt.

**Why.** A banking environment, audit, and application owners who work in ServiceNow directly. A second source of truth will inevitably diverge from the first.

**Rejected.** The projection as master — faster to build, but it creates a shadow knowledge base. Two-way synchronisation — constant conflicts with no gain.

**Cost.** Provenance anchors are required from the pipeline. The rebuild is asynchronous; there is no instant consistency.

---

## D2. Publishing without review

The engineer publishes a change immediately, under their own name.

**Why.** A review queue in a round-the-clock team means a day of delay and the death of the loop.

**Compensation.** Additive by default, versioning with authorship, one-click revert, a confirmation threshold instead of a reviewer.

---

## D3. Dialogue during the work, not at closure

Changes accumulate into the basket while the problem is being solved. The closure screen only reviews what has accumulated.

**Why.** A conversation at closure is recollection after the fact. Quality is lower and it takes more time.

**Reverses the earlier design**, in which the conversation with the agent happened at closure.

---

## D4. The main screen is my tickets and the queue; the board is demoted

The board became a collapsible strip at the top.

**Why.** The engineer lives in their own tickets. The board contains only what was marked by hand and is not a working list.

**Reverses the earlier design**, in which the board was the main view.

---

## D5. The card and the ticket are one object

**Why.** Today details are written into the notes of Microsoft Planner cards, outside ServiceNow. The cause of the leak is the gap between the card and the ticket. A single object removes the cause, not the symptom.

---

## D6. Buckets are a property of the team

The set of buckets and tags is configurable, not a constant.

**Why.** Different teams have different handover times and a different rhythm. A shared set will suit no one.

---

## D7. The promotion threshold for an observation is two engineers or the owner

**Why.** With fifteen engineers and five tickets a day, a threshold of three confirmations is unreachable for rare procedures: they are applied twice a year. The application owner is an authority and needs no quorum.

**Reverses an earlier threshold of three.**

---

## D8. Raw notes are stored alongside polished ones

**Why.** A raw note is evidence, a polished one is a record. Keeping only the second means losing the basis in an argument about wording and being unable to re-derive the text when the model gets better. Besides, a person does not recognise their own text once rewritten and stops trusting the system.

---

## D9. Notes reach ServiceNow at boundaries, not as a stream

On a state change or handover — a consolidated note; at closure — the full package; plus a button to send one manually.

**Why.** A stream of separate entries is noise in the ticket history. Besides, text polished by the model would land in the audit record without a single human glance.

**Rejected.** Sending every note immediately; sending only at closure (in which case a person in ServiceNow sees an empty ticket for two days).

---

## D10. The existing enrichment is left alone

The ServiceNow automation that appends steps into the description is accepted as given. Our hint is built independently.

**Why.** It is a previous stage, it works, reworking it is out of scope and does not block us.

**Open.** The visibility of the description field to the requester on universal requests — a potential leak of internal information outward.

---

## D11. A dark theme is not required

**Why.** The initial assumption that night shifts argue for a dark theme was not confirmed.

---

## D12. Feature parity with ServiceNow is not built

Some actions remain in the native interface, with a fast contextual jump.

**Why.** The long tail of features will eat the development effort. Three screens are built deeply, the rest is a link.

**Open.** Ticket assignment through the API — if available, we take it over: tickets getting stuck on people is named as one of the main losses of time.

---

## D13. The pilot runs on recurring alerts

**Why.** They are deterministic, frequent, and carry a machine-readable payload for precise matching of repeats. They give coverage fastest. User requests are blurred and require a different model of knowledge.

---

## D14. The slow loop comes after the fast one

Background clustering of closed tickets and the owner dashboard come after telemetry has accumulated.

**Why.** A dashboard built too early will show that everything is on fire and will undermine trust in the very idea of a freshness metric.

---

## D15. A header and three views: work, queue, knowledge

The work screen remains the home of the shift: it opens by default, and leaving any other view returns to it. The header adds two views — the general queue and knowledge — and takes nothing away from the work screen.

This does not contradict the principle "the engineer does not leave the work screen": the principle forbids moving ticket work onto other screens, it does not forbid other views existing. Switching between tickets still changes the content, not the screen.

The condition without which this decision is harmful: **state survives the transition.** The open ticket, the closure mode, the draft in the input field, whether the attention strip is expanded, the queue filters — all of it is preserved. Going to an article and back must not cost a single lost line.

**Check.** Scenario: type text into the note field without sending it, go to a knowledge page, come back — the text is there, the feed and the basket are unchanged.

---

## D16. From a ticket we lead to the projection, not to ServiceNow

A suggested article on the sources panel opens the knowledge page inside our interface. The link to the original article in ServiceNow remains, but as a second, labelled line.

**Why.** Freshness signals, observations, the change history with source tickets, and neighbours exist only on our side (I6). A link into ServiceNow leads to text without a single trust signal — to exactly what people stopped reading. Sending them there with the first press devalues the whole loop.

**Consequence.** The knowledge page ceases to be fourth-wave work as far as reading is concerned: a minimal reading version is needed together with the sources panel. Editing from there, search and neighbours remain fourth-wave.

---

## D17. The short path exists only for a recurring alert with a matched course

"Close as last time" appears when the ticket has a stable alert signature with a history, all suggested steps are marked `done`, and none is `failed`. In every other case there is no short path.

**Why.** This is the fastest route to coverage (D13) and the only case where a confirmation costs no attention and stays honest: the course of the resolution is a structural signal, not a self-report. With a weak match, one press would produce exactly the formal confirmation that turns freshness into a false signal.

**Rejected.** A one-press closing available always — it looks convenient and destroys the value of every confirmation in the system.

**Cost.** The path is unavailable on the majority of tickets, and that is deliberate.

---

## D18. Publication happens after closing and never blocks it

On "Accept and close" the ticket is closed and the resolution notes are written first. Publication of the accepted proposals into `kb_knowledge` goes afterwards, asynchronously. The state of each publication — sending, published, conflict, error — is shown on the after-closure screen.

**Why.** I3 forbids anything from blocking closing. Publication touches a shared article, may hit a conflict and may be slow; making the closing of a ticket depend on it would mean an engineer waiting on someone else's edit.

**Consequence.** A conflict is discovered after the fact. That is acceptable: the proposal is preserved and rebuilt against the new body, and nothing is silently overwritten (I1).

**Rejected.** Publishing before closing with a check for conflicts — it turns every closure into a possible wait and reintroduces a blocking dialogue.

---

## D19. The documentation is readable from inside the mockup

A fourth view in the header, **Concept**, renders the files in `docs/` and links out to the
diagrams page at `/docs/canvas/`. It is a shelf, not a fifth product screen: nothing on it writes
anywhere, and it takes nothing away from the work screen.

**Why.** The mockup is shown to people who have to judge the idea, not only the screens. Sending
them to a repository to read the reasoning loses most of them; the documents are the argument, and
the argument should be one press from the thing it argues for.

**Relation to D15.** D15 fixes three product views. This one is deliberately outside that count and
is marked as such in the code: when the interface goes to a pilot, the shelf is the first thing that
comes out.

**Cost.** `marked` and `mermaid` as dependencies. Mermaid is loaded lazily, only when a document
containing a diagram is opened.

---

## D20. Every action says which part of the loop it feeds

A strip in the header names the link of the loop the screen is on — hint, signals, basket, review,
master, rebuild — and the controls that raise or dispatch something carry a one-line label saying
where the press lands: "every mark is a signal → the basket", "the record is written first,
publication follows", "the observations section, apart from the canon".

**Why.** The loop is the whole idea, and it was invisible in the interface: a person could press
every control on the screen without ever learning that a step mark is what keeps the knowledge base
alive. A person who can see that presses differently — and this is the cheapest possible way to say
it, because the label sits on the control that does it rather than in an onboarding tour.

**Constraint.** These are annotations, not instructions or interruptions: no modal, no toast,
nothing that appears over the work, and no number that cannot be checked (I7). A label states the
destination the code actually dispatches to, so it cannot drift into decoration.

**Rejected.** A tour or a help overlay — it is read once, by nobody. A permanent diagram in the
interface — the loop drawn is a document, and it lives at `/docs/canvas/`.
