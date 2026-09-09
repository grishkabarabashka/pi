# Screen: general queue

The full view of the team's queue: what is not taken, what is taken and by whom. Opened from the header. The main screen remains the home; the queue is a place people enter and return from with a ticket.

## Why it is separate from the list on the left

The list on the main screen shows my tickets and the tail of the queue — it is about the work. The queue shows the team's load: who is busy with what, where things have piled up, what is hanging without an owner. They must not be merged: in the first case what matters is my next step, in the second the distribution.

This is not the owner dashboard and not a report. There are no charts and no aggregates over people (`../concept.md` §10 — no counters, no ratings): the "who has it" column exists so that one can get a contact or see that the ticket is already being worked on.

## Content

One table, grouped from top to bottom:

1. **Not taken** — `state: queue`, sorted by priority, then by age
2. **In work** — `state: work`, including other engineers' tickets
3. **Waiting for a reply** — `state: wait`
4. **Closed today** — collapsible

Columns: identifier and priority in monospace, the knowledge dot, the title, the application, the tags, who has it (name and region, "—" for untaken ones), the age, the action.

The action: "take" for untaken tickets, "open" for my own. Someone else's ticket opens read-only — we do not allow taking a ticket away from a colleague with one press; ServiceNow exists for that.

## Filters

A filter row without modal dialogs: application, origin (alert or user), mine only, no knowledge match only. The filter state survives going to another view and back.

The "no knowledge match" filter is the white spots in a living form: tickets for which there will be no hint.

## Acceptance criteria

- Going to the queue and back does not reset the open ticket, the closure mode, the note draft or the state of the attention strip
- "Take" moves the ticket into work and opens it on the main screen, with no form and no jump into ServiceNow
- Someone else's ticket offers no "take" action
- The knowledge dot is visible in the row before the ticket is opened
- Age and priority are readable without hovering
