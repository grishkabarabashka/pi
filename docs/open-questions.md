# Open questions

Each question is marked with what it blocks. Questions that block nothing do not prevent the work from starting.

Label mapping from the original Russian documents: В → Q.

---

## ServiceNow platform team

**Q1. Which table is used for universal requests in your instance.**
Blocks: `LiveAdapter`. Does not block the frontend on fixtures.

**Q2. Is assigning a ticket to another person or group available through the API.**
Blocks: the decision whether we take ticket handover into our interface. Tickets getting stuck on people is named as one of the main losses of time, so the question matters.

**Q3. Is publishing an article through the API allowed without going through an approval workflow.**
Blocks: D2 in full. If approval is mandatory, the whole model of publishing without review changes.

**Q4. Limits on the size of `close_notes` and `work_notes`.**
Blocks: the format of `ClosurePackage`. If the limit is hard, the chronology will have to move behind a link.

**Q5. How is a ticket linked to the affected CI in your instance.**
Blocks: the "changes nearby" section and matching articles by CI.

**Q6. Is the description field of a universal request visible to the requester.**
Blocks: nothing on our side, but it is a potential leak of internal information outward in the existing enrichment. To be checked on a concrete example.

---

## Owner of the projection pipeline

**Q7. Can the pipeline emit block provenance — the article identifier, the heading path, the fragment hash.**
Blocks: the write-back path in full (I1). Without anchors, edits do not reach the master. This is the main technical risk of the project.

**Q8. How local and idempotent is the rebuild.**
Blocks: the preservation of graph links on every edit.

**Q9. What share of projection blocks is synthesised by the pipeline and has no counterpart in the article.**
Blocks: the estimate of how much content cannot be edited in place at all.

---

## Monitoring system

**Q10. Does a stable alert signature identifier arrive on the ticket.**
Blocks: grouping of repeats, the occurrence history, closing "as last time". Without it the alert pilot loses its main advantage.

**Q11. Is a machine-readable alert payload available.**
Blocks: matching accuracy. Without it, matching is done on text and the quality is lower.

---

## Security and compliance

**Q12. Retention periods for the work trail relative to the retention periods in ServiceNow.**
Blocks: the audit construction. If our trail lives longer or shorter, a divergence appears between the official record and the real history.

**Q13. Is storing links to monitoring dashboards inside the trail acceptable.**
Blocks: the "a link instead of a copy" principle. If links are also problematic, we will have to store text descriptions only.

---

## The team

**Q14. Which set of buckets is needed at the start and who owns it.**
Blocks: the defaults. The current three are an assumption, not a fact.

**Q15. Which tags are actually used in Microsoft Planner today.**
Blocks: the default set of tags.

**Q16. The maximum acceptable response time for entering a note.**
Proposal: 100 ms until the text appears in the feed, everything else asynchronous. It needs to be fixed as a number before development starts, otherwise I2 is not checkable.

**Q17. The scale in the other regions.**
Does not block, but it affects whether the confirmation threshold is reachable for rare procedures.

---

## What can be done without waiting for answers

The first-wave frontend on `FixtureAdapter`: the main screen, the attention strip, the workspace, the closure screen. None of the questions above blocks this.

Do not start before the answers: `LiveAdapter` (Q1–Q5), write-back with anchors (Q7–Q9), alert grouping (Q10).
