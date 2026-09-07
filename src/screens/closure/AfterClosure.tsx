import { useApp } from '@/store/app';
import type { PublicationOutcome, Ticket } from '@/domain/types';
import { isGap } from '@/domain/types';
import { Button, kindLabel } from '@/ui/primitives';
import s from './Closure.module.css';
import a from './AfterClosure.module.css';

const publicationLabel: Record<PublicationOutcome['state'], string> = {
  sending: 'sending',
  published: 'published',
  conflict: 'conflict',
  failed: 'not published',
};

const publicationColor: Record<PublicationOutcome['state'], string> = {
  sending: 'var(--text-faint)',
  published: 'var(--strong)',
  conflict: 'var(--stale)',
  failed: 'var(--none)',
};

/** Shows the composition of what went into ServiceNow. It collapses to a line once trust has formed. */
export function AfterClosure({ ticket }: { ticket: Ticket }) {
  const pkg = useApp((st) => st.closureResult[ticket.id]);
  const publications = useApp((st) => st.publications[ticket.id]) ?? [];
  const tickets = useApp((st) => st.tickets);
  const select = useApp((st) => st.selectTicket);
  if (!pkg) return null;

  const next = tickets.find((t) => t.state === 'work' && t.id !== ticket.id)
    ?? tickets.find((t) => t.state === 'queue');

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <span className="mono">{ticket.id}</span>
        <h1 className={s.title}>Written to ServiceNow</h1>
      </header>

      <div className={a.body}>
        <section className={a.block}>
          <h2 className="caps">Resolution notes</h2>
          {pkg.slots.map((slot) => (
            <div key={slot.id} className={a.row}>
              <span className={a.rowLabel}>{slot.label}</span>
              <span className={isGap(slot) ? 'faint' : undefined}>
                {isGap(slot) ? 'not filled in' : slot.value}
              </span>
            </div>
          ))}
        </section>

        <section className={a.block}>
          <h2 className="caps">Additionally into the ticket</h2>
          <p className="muted">Work chronology: {pkg.trail.length} entries</p>
          {pkg.articlesUsed.length === 0 ? (
            <p className="muted">No articles were used</p>
          ) : (
            pkg.articlesUsed.map((art) => (
              <p key={art.title} className="muted">
                {art.title}, version {art.version} · <a href={art.url} target="_blank" rel="noreferrer">open</a>
              </p>
            ))
          )}
        </section>

        <section className={a.block}>
          <h2 className="caps">Changes in the knowledge base</h2>
          {pkg.acceptedProposals.length === 0 ? (
            <p className="muted">Nothing was accepted, the knowledge base is unchanged.</p>
          ) : (
            pkg.acceptedProposals.map((p) => {
              const outcome = publications.find((o) => o.proposalId === p.id);
              return (
                <div key={p.id} className={a.row}>
                  <span className={a.rowLabel}>{kindLabel[p.kind]}</span>
                  <span>
                    {p.text}
                    {outcome && (
                      <>
                        {' '}
                        <span style={{ color: publicationColor[outcome.state] }}>
                          {publicationLabel[outcome.state]}
                          {outcome.version ? ` v${outcome.version}` : ''}
                        </span>
                        {outcome.detail && <span className="faint"> — {outcome.detail}</span>}
                      </>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </section>

        {next && (
          <Button variant="solid" onClick={() => select(next.id)}>Next ticket</Button>
        )}
      </div>
    </div>
  );
}
