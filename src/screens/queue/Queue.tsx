import { useApp } from '@/store/app';
import type { Ticket } from '@/domain/types';
import { KnowledgeDot, age } from '@/ui/primitives';
import { currentUser, tags as allTags } from '~fixtures/team';
import s from './Queue.module.css';

/**
 * The view of the team's load: what is not taken, what is taken and by whom.
 * Not the owner dashboard and not a report on people. The "who has it" column
 * exists so that a second person does not start working the same ticket.
 */
export function Queue() {
  const tickets = useApp((st) => st.tickets);
  const loaded = useApp((st) => st.ticketsLoaded);
  const filters = useApp((st) => st.queueFilters);
  const setFilters = useApp((st) => st.setQueueFilters);

  const applications = [...new Set(tickets.map((t) => t.application))].sort();

  const pass = (t: Ticket) =>
    (!filters.application || t.application === filters.application) &&
    (!filters.origin || t.origin === filters.origin) &&
    (!filters.mineOnly || t.assignee === currentUser.id) &&
    (!filters.noMatchOnly || t.knowledgeMatch === 'none');

  const visible = tickets.filter(pass);
  const byPriority = (a: Ticket, b: Ticket) =>
    a.priority.localeCompare(b.priority) || a.openedAt.localeCompare(b.openedAt);

  const free = visible.filter((t) => t.state === 'queue').sort(byPriority);
  const work = visible.filter((t) => t.state === 'work').sort(byPriority);
  const wait = visible.filter((t) => t.state === 'wait').sort(byPriority);
  const closed = visible.filter((t) => t.state === 'closed');

  return (
    <div className={s.screen}>
      <div className={s.filters}>
        <select
          value={filters.application ?? ''}
          onChange={(e) => setFilters({ application: e.target.value || null })}
        >
          <option value="">all applications</option>
          {applications.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={filters.origin ?? ''}
          onChange={(e) => setFilters({ origin: (e.target.value || null) as Ticket['origin'] | null })}
        >
          <option value="">any origin</option>
          <option value="alert">monitoring alerts</option>
          <option value="user">user requests</option>
        </select>

        <label className={s.check}>
          <input
            type="checkbox"
            checked={filters.mineOnly}
            onChange={(e) => setFilters({ mineOnly: e.target.checked })}
          />
          mine only
        </label>

        <label className={s.check} title="Tickets for which there will be no hint — the white spots in a living form">
          <input
            type="checkbox"
            checked={filters.noMatchOnly}
            onChange={(e) => setFilters({ noMatchOnly: e.target.checked })}
          />
          no knowledge match
        </label>
      </div>

      <div className={s.scroll}>
        {!loaded && <p className={s.hint}>Loading…</p>}
        <Section title="Not taken" items={free} emptyText="The queue is empty" />
        <Section title="In work" items={work} />
        <Section title="Waiting for a reply" items={wait} />
        {closed.length > 0 && <Section title="Closed" items={closed} />}
      </div>
    </div>
  );
}

function Section({ title, items, emptyText }: { title: string; items: Ticket[]; emptyText?: string }) {
  if (items.length === 0 && !emptyText) return null;
  return (
    <section className={s.section}>
      <header className={s.sectionHead}>
        <span className="caps">{title}</span>
        <span className="faint mono">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className={s.hint}>{emptyText}</p>
      ) : (
        <table className={s.table}>
          <tbody>{items.map((t) => <Row key={t.id} ticket={t} />)}</tbody>
        </table>
      )}
    </section>
  );
}

function Row({ ticket }: { ticket: Ticket }) {
  const people = useApp((st) => st.people);
  const select = useApp((st) => st.selectTicket);
  const take = useApp((st) => st.takeTicket);

  const owner = people.find((p) => p.id === ticket.assignee);
  const mine = ticket.assignee === currentUser.id;
  const free = ticket.state === 'queue';

  return (
    <tr className={s.row} onClick={() => select(ticket.id)}>
      <td className={`mono ${s.id}`}>{ticket.id}</td>
      <td className={`mono ${s.priority}`}>{ticket.priority}</td>
      <td className={s.dot}><KnowledgeDot match={ticket.knowledgeMatch} /></td>
      <td className={s.title}>
        {ticket.title}
        {ticket.tags.map((id) => (
          <span key={id} className={s.tag}>{allTags.find((t) => t.id === id)?.label ?? id}</span>
        ))}
      </td>
      <td className={`muted ${s.app}`}>{ticket.application}</td>
      <td className={s.owner}>
        {owner ? (
          <>
            <span className={mine ? s.me : undefined}>{owner.name}</span>
            <span className="faint"> {owner.region}</span>
          </>
        ) : (
          <span className="faint">—</span>
        )}
      </td>
      <td className={`faint mono ${s.age}`}>{age(ticket.openedAt)}</td>
      <td className={s.action}>
        {free ? (
          <button
            type="button"
            className={s.take}
            onClick={(e) => { e.stopPropagation(); take(ticket.id); }}
          >
            take
          </button>
        ) : mine ? (
          <span className="faint">open</span>
        ) : (
          // We do not let a colleague's ticket be taken away with one press (D12).
          <span className="faint">read only</span>
        )}
      </td>
    </tr>
  );
}
