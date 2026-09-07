# Screen: main

The screen the engineer does not leave during a shift. Switching between tickets changes the content, not the screen.

## Zones

```
┌───────────────────────────────────────────────────────────┐
│ A. Attention strip (collapsed)                            │
├──────────────────┬────────────────────────────────────────┤
│ B. Ticket        │ C. Workspace or closure                │
│    list          │    (see workspace.md, closure.md)      │
└──────────────────┴────────────────────────────────────────┘
```

The width of B is fixed. C takes the rest and contains its own right-hand sources panel.

---

## B. Ticket list

Three groups from top to bottom, each with a heading and a counter:

1. **In my work** — `state: work`
2. **Waiting for a reply** — `state: wait`
3. **Closed today** — `state: closed`, shown only when non-empty
4. **General queue** — `state: queue`, separated by a rule

Divided by state, not by priority: "in work" and "waiting" are different modes of attention.

### Ticket row

```
INC0448213  P2                              14 min
FIX gateway latency, EMEA
● FIX Gateway  [recurring]                 [take]
```

- Identifier and priority in monospace, age on the right
- Title on one or two lines
- Knowledge dot: `strong` teal, `weak` grey, `stale` amber, `none` pink
- Ticket tags
- The "take" button only in the "general queue" group

The selected row is marked with a bar on the left and a background.

### Interactions

| Action | Result |
|---|---|
| Click on a row | The ticket opens in C, mode `work` |
| "take" | `state: queue → work`, the ticket moves into the first group and opens in C |
| Empty queue | The line "The queue is empty" instead of the list |
| No ticket selected | A hint in C to pick one on the left or take one from the queue |

### Acceptance criteria

- Switching between tickets does not reload the screen and does not reset the attention strip
- Taking a ticket requires no jump into ServiceNow and opens no form
- The knowledge dot is visible before the ticket is opened
- The "closed today" group is not shown when empty

---

## A. Attention strip

Only what someone marked by hand ends up here. It is neither a queue nor a dashboard.

### Collapsed state (default)

A single line: the name, then for each bucket a dot, a label and a counter. The dot of a bucket with `emphasis: swarm` pulses when the counter is above zero. On the right, the total number marked and the toggle.

There is nothing to read — this is peripheral vision (see `agent.md`, the section on the periphery). Nothing pops up over the work.

### Expanded state

Columns by the number of buckets, each holding cards of the marked tickets: identifier, age, title, and for a swarm the number of participants. An empty bucket shows "Empty" rather than disappearing.

Clicking a card opens the ticket in C and leaves the strip expanded.

### Buckets

The set is a **property of the team**, not a constant of the application. Different teams have different handover times and a different rhythm.

By default: `Swarm in progress` (swarm), `Needs attention` (attention), `For the next shift` (handover).

### Marking and tags

Putting a ticket into a bucket and hanging a tag on it is possible **only from the workspace header**. There is no separate place for it — otherwise the temptation appears to give the card content of its own, which would break I5.

Default tags: waiting for the user, waiting for another team, recurring, attention of the next shift. The set is configurable by the team.

Buckets and tags live only on our side (I6) and are not visible in ServiceNow. For this function that is acceptable: today's board is already kept outside ServiceNow, by hand, in Microsoft Planner.

### Acceptance criteria

- The strip is collapsed on first open and remembers its state within the session
- Collapsed, it occupies one line and contains no text that has to be read
- A card has no fields of its own: the title comes from the ticket, there are no comments on the card (I5)
- The "for the next shift" bucket is available without configuration: it covers the basic handover
