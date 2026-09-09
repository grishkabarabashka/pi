import { useApp } from '@/store/app';
import type { Ticket } from '@/domain/types';
import { KnowledgeDot, age } from '@/ui/primitives';
import { currentUser, tags as allTags } from '~fixtures/team';
import s from './TicketList.module.css';

const isToday = (iso?: string) =>
  iso != null && new Date(iso).toDateString() === new Date().toDateString();

export function TicketList() {
  const tickets = useApp((st) => st.tickets);
  const loaded = useApp((st) => st.ticketsLoaded);

  // The list on the left is about my own work. Other people's tickets are in the general queue.
  const mine = tickets.filter((t) => t.assignee === currentUser.id);
  const work = mine.filter((t) => t.state === 'work');
  const wait = mine.filter((t) => t.state === 'wait');
  // Closed today means closed today — the opening time is a different fact.
  const closed = mine.filter((t) => t.state === 'closed' && isToday(t.closedAt));
  const queue = tickets.filter((t) => t.state === 'queue');

  return (
    <nav className={s.list}>
      {!loaded && <p className={s.hint}>Loading…</p>}
      <Group title="In my work" items={work} />
      <Group title="Waiting for a reply" items={wait} />
      {closed.length > 0 && <Group title="Closed today" items={closed} />}
      <div className={s.divider} />
      <Group title="General queue" items={queue} takeable emptyText="The queue is empty" />
    </nav>
  );
}

function Group({
  title, items, takeable, emptyText,
}: {
  title: string; items: Ticket[]; takeable?: boolean; emptyText?: string;
}) {
  if (items.length === 0 && !emptyText) return null;
  return (
    <section className={s.group}>
      <header className={s.groupHead}>
        <span className="caps">{title}</span>
        <span className="faint mono">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className={s.hint}>{emptyText}</p>
      ) : (
        items.map((t) => <Row key={t.id} ticket={t} takeable={takeable} />)
      )}
    </section>
  );
}

function Row({ ticket, takeable }: { ticket: Ticket; takeable?: boolean }) {
  const selectedId = useApp((st) => st.selectedId);
  const select = useApp((st) => st.selectTicket);
  const take = useApp((st) => st.takeTicket);
  const selected = selectedId === ticket.id;

  return (
    <div
      className={`${s.row} ${selected ? s.rowSelected : ''}`}
      onClick={() => select(ticket.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') select(ticket.id); }}
    >
      <div className={s.rowTop}>
        <span className="mono">{ticket.id}</span>
        <span className={`mono ${s.priority}`}>{ticket.priority}</span>
        <span className={`faint ${s.age}`}>{age(ticket.openedAt)}</span>
      </div>
      <div className={s.rowTitle}>{ticket.title}</div>
      <div className={s.rowBottom}>
        <KnowledgeDot match={ticket.knowledgeMatch} />
        <span className="muted">{ticket.application}</span>
        {ticket.tags.map((id) => (
          <span key={id} className={s.tag}>
            {allTags.find((t) => t.id === id)?.label ?? id}
          </span>
        ))}
        {takeable && (
          <button
            type="button"
            className={s.take}
            onClick={(e) => { e.stopPropagation(); take(ticket.id); }}
          >
            take
          </button>
        )}
      </div>
    </div>
  );
}
