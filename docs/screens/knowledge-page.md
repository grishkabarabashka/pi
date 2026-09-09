# Screen: knowledge page

The projection of an article. Read here, edited through proposals raised on a ticket. Third to fourth wave, but a link to this file exists in `../domain.md`, so the specification is fixed now.

## Content

**The article body** with blocks marked up by the structure of a procedure: applicability, steps, branch points, verification. For `reference` — free structure.

**Freshness signals in words**, not as a confidence number (I7): "confirmed 3 days ago, applied 14 times" or "not confirmed for 9 months". For `reference`, instead of confirmations — the date of the last attestation by the owner and the list of CI changes since then.

**An observations section** — separate from the canonical text, with the number of confirmations accumulated and how many remain until promotion. Observations are stored in the article body in ServiceNow, not on our side (I1).

**Neighbours** as a list, not a graph. The graph unfolds on demand.

**A change history** naming the source ticket of every edit and its author. One-click revert is the compensation for publishing without review (D2), so it must be in plain sight.

**A link to the original article in ServiceNow.**

## Blocks without an anchor

A block synthesised by the pipeline that has no counterpart in the article is marked explicitly and cannot be edited in place. Changes near it go as an append to the end of the article.

The limitation is shown honestly rather than masked: the person must understand why no pinpoint edit can be proposed here. A wording along the lines of "this fragment was assembled automatically, an edit will go to the end of the article".

## Editing from here

Possible, but it goes down the same path as a proposal from a ticket: anchor, hash check, write of a new version, rebuild. There is no separate write path (I1).

If the hash does not match — the article was changed in ServiceNow — the proposal is rebuilt against the new text, and this is shown. A silent overwrite is unacceptable: that is how the application owner's work gets erased.

## Acceptance criteria

- The freshness signal on the page matches the article type: for `reference` the ticket-derived confirmation counter is not shown
- Observations are visually separated from the canonical text
- Every history entry shows its source ticket
- A block without an anchor is marked and offers no pinpoint edit
- A hash conflict is shown to the user, not resolved automatically
