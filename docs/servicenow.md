# ServiceNow adapter

The only module that knows about ServiceNow. The rest of the application works through this interface and knows nothing about tables.

There are two implementations: `FixtureAdapter` (data from files, working today) and `LiveAdapter` (the real API, connected once the platform team answers). The application must not distinguish between them other than through configuration.

---

## Interface

```ts
interface ServiceNowAdapter {
  // reading
  listTickets(filter: TicketFilter): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket>;
  getTicketJournal(id: string): Promise<JournalEntry[]>;
  listPeople(): Promise<Person[]>;
  getChangesNearCi(ciId: string, window: TimeWindow): Promise<ChangeRef[]>;
  getArticle(sysId: string): Promise<ArticleBody>;
  searchArticles(query: SearchQuery): Promise<ArticleHit[]>;
  searchClosedTickets(query: SearchQuery): Promise<TicketHit[]>;

  // writing
  assignTicket(id: string, assignee: string): Promise<void>;      // see Q2
  pushNote(id: string, text: string): Promise<void>;
  closeTicket(id: string, pkg: ClosurePackage): Promise<void>;
  publishArticleVersion(req: PublishRequest): Promise<PublishResult>;
}
```

`PublishRequest` contains the `anchor`, the expected `contentHash` and the new text of the fragment. `PublishResult` is either success with a new version or `conflict` with the current article body, so that the proposal can be rebuilt (see I1 and the "Conflicts" section).

---

## Tables

The names are the standard ones. The instance has not been verified — see `open-questions.md`.

| Table | We read | We write |
|---|---|---|
| `incident` | fields, state, priority, assignment, description with enrichment | `close_notes`, `work_notes`, state, close code, category, CI |
| `universal_request` | universal requests | notes, state |
| `change_request` | changes on the CI within the incident window | — |
| `kb_knowledge` | body, version, state | a new version of the body, publication |
| `kb_knowledge_base`, `kb_category` | the structure of the base | — |
| `sys_journal_field` | the history of notes and comments | through the ticket API |
| `cmdb_ci`, `cmdb_ci_appl` | applications and systems | — |
| `task_ci` | the link between a ticket and a CI | — in the first stage |
| `sys_user`, `sys_user_group` | people, teams, owners | — |

Service requests are out of the pilot's scope.

**Customising the instance is not available.** No new fields, no business rules, no changes to workflows. Everything that is not in the standard model lives on our side (I6).

---

## What we write and when

Notes do not reach ServiceNow as a stream. Today they are hardly written at all, so a stream of separate entries would be noise, and text polished by the model would land in the audit record without a human glance.

| Moment | What we write |
|---|---|
| State change, handover | A consolidated note for the period |
| An explicit press on a note | That single note |
| Closure | The full package |

### ClosurePackage

```
Symptom: <slot.symptom>
Cause: <slot.cause>
What was done: <slot.action>
Verification: <slot.verification>

Chronology:
  <compressed work trail>

Articles used:
  <title, version, link>

Changes in the knowledge base:
  <list of accepted proposals>

Full review: <link>
```

A slot left empty is written as `not filled in`. Do not invent text and do not drop the line: the gap must be visible in the master.

A uniform structure in `close_notes` gives the slot completeness metric from day one, without separate analytics.

---

## The existing enrichment

Accepted as given, not touched. The automation launched from ServiceNow appends suggested steps and article links into the ticket description.

Our hint is built independently, from the knowledge projection. The existing text in the description is shown as is, as a separate block, and is not mixed with our hint.

The open question about the visibility of the description field to the requester — see `open-questions.md`.

---

## Conflicts when publishing an article

```
projection block ──► anchor { articleSysId, headingPath, contentHash }
                          │
                          ▼
                  does contentHash match the current body?
                    │                        │
                   no                       yes
                    │                        │
                    ▼                        ▼
        the article changed:          write the new version
        rebuild the proposal          and start a local
        and show it to the engineer   rebuild of the projection
```

Last write must not win: that silently erases the work of an application owner who edited the article directly.

The rebuild of the projection is asynchronous. The interface says so honestly and does not pretend to instant consistency.

---

## Jumping into ServiceNow

Full feature parity is not built. Some actions stay in the native interface, and this is shown openly.

Requirement: the "open in ServiceNow" link leads straight to the right screen, not to the home page. It is present on the ticket, on the article and in the place of a missing action.

Staying outside in the first stage: correspondence with the user, approvals, attachments, escalations, work with the change process.

---

## Fixtures

`FixtureAdapter` covers the scenarios on which the invariants are checked:

- an alert ticket with a strong match and a history of repeats
- an alert ticket with no matches at all
- a user request with a fulfilment procedure
- an article with anchors and an article with a block without an anchor
- a publication conflict: the `contentHash` did not match
- a slow and an unavailable model (for I2)
- an empty queue and an empty list of my tickets
