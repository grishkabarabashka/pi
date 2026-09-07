import { useEffect } from 'react';
import { useApp } from '@/store/app';
import { adapter } from '@/adapters/servicenow';
import type {
  ArticleType, BlockSection, KnowledgePage, KnowledgePageSummary, Observation,
} from '@/domain/types';
import { Empty, Panel, age } from '@/ui/primitives';
import s from './Knowledge.module.css';

const typeLabel: Record<ArticleType, string> = {
  reference: 'reference',
  procedure_fault: 'fault procedure',
  procedure_fulfilment: 'fulfilment procedure',
  procedure_interaction: 'interaction procedure',
};

const sectionLabel: Record<BlockSection, string> = {
  applicability: 'Applicability',
  steps: 'Steps',
  branching: 'Branch points',
  verification: 'Verification',
  free: '',
};

const days = (iso: string) => Math.round((Date.now() - new Date(iso).getTime()) / 864e5);

/** Freshness in words and by article type. A reference article has no confirmation counter (I7). */
function freshnessLine(page: KnowledgePage | KnowledgePageSummary): string {
  const t = page.telemetry;
  if (page.type === 'reference') {
    const attested = t.lastAttestedAt
      ? `attested by the owner ${days(t.lastAttestedAt)} days ago`
      : 'not attested by the owner';
    const drift = t.ciChangesSinceAttestation
      ? `, ${t.ciChangesSinceAttestation} CI changes since then`
      : '';
    return attested + drift;
  }
  if (!t.lastConfirmedAt) return `no confirmations, applied ${t.useCount} times`;
  const d = days(t.lastConfirmedAt);
  const when = d < 45 ? `${d} days ago` : `${Math.round(d / 30)} months ago`;
  const stale = d > 90;
  return `${stale ? 'not confirmed for' : 'confirmed'} ${when}, applied ${t.useCount} times`;
}

function isStale(page: KnowledgePage | KnowledgePageSummary): boolean {
  const t = page.telemetry;
  if (page.type === 'reference') return (t.ciChangesSinceAttestation ?? 0) > 0;
  return !t.lastConfirmedAt || days(t.lastConfirmedAt) > 90;
}

export function Knowledge() {
  const load = useApp((st) => st.loadPageIndex);
  const openedPageId = useApp((st) => st.openedPageId);

  useEffect(() => { load(); }, [load]);

  return (
    <div className={s.screen}>
      <PageList />
      {openedPageId ? (
        <PageView pageId={openedPageId} />
      ) : (
        <div className={s.blank}>
          <p className="muted">Pick a projection on the left.</p>
        </div>
      )}
    </div>
  );
}

function PageList() {
  const index = useApp((st) => st.pageIndex);
  const state = useApp((st) => st.pageIndexState);
  const opened = useApp((st) => st.openedPageId);
  const openPage = useApp((st) => st.openPage);

  return (
    <nav className={s.list}>
      {state === 'loading' && <p className={s.hint}>The projections are being assembled…</p>}
      {state === 'failed' && <p className={s.hint}>The projection is unavailable. The work continues without it.</p>}
      {index.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`${s.listRow} ${opened === p.id ? s.listRowActive : ''}`}
          onClick={() => openPage(p.id)}
        >
          <span className={s.listTitle}>{p.title}</span>
          <span className="faint">{typeLabel[p.type]} · {p.application}</span>
          <span className={isStale(p) ? s.stale : s.fresh}>{freshnessLine(p)}</span>
          {p.observationsPending > 0 && (
            <span className="faint">observations awaiting promotion: {p.observationsPending}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

function PageView({ pageId }: { pageId: string }) {
  const page = useApp((st) => st.pages[pageId]);
  const state = useApp((st) => st.pageState[pageId]);
  const openPage = useApp((st) => st.openPage);

  if (!page) {
    return (
      <div className={s.blank}>
        <p className="muted">
          {state === 'failed'
            ? 'The projection of this article has not been assembled.'
            : 'Assembling…'}
        </p>
      </div>
    );
  }

  return (
    <div className={s.pane}>
      <article className={s.page}>
        <header className={s.head}>
          <h1 className={s.title}>{page.title}</h1>
          <p className="muted">
            {typeLabel[page.type]} · {page.application} · version {page.version}
          </p>
          <p className={isStale(page) ? s.stale : s.fresh}>{freshnessLine(page)}</p>
          {page.type !== 'reference' && page.telemetry.deviations > 0 && (
            <p className="faint">
              step deviations: {page.telemetry.deviations} ·
              not-applicable marks: {page.telemetry.notApplicableMarks}
            </p>
          )}
          <p className="faint">
            the pipeline rebuilt it {age(page.rebuiltAt)} ago · the rebuild is asynchronous
          </p>
          <a
            className={s.snLink}
            href={adapter.deepLink('article', page.articleSysId)}
            target="_blank"
            rel="noreferrer"
          >
            the original article in ServiceNow
          </a>
        </header>

        {page.blocks.map((b) => (
          <section key={b.id} className={s.block}>
            {sectionLabel[b.section] && <h2 className="caps">{sectionLabel[b.section]}</h2>}
            <p className={s.body}>{b.body}</p>
            {b.anchor === null && (
              // The limitation is shown honestly rather than masked.
              <p className={s.synthetic}>
                This fragment was assembled automatically by the pipeline and has no counterpart
                in the article. A pinpoint edit is impossible: a change will go as an append to
                the end of the article.
              </p>
            )}
          </section>
        ))}

        <section className={s.observations}>
          <h2 className="caps">Observations</h2>
          <p className="faint">
            Not canonical text. Promoted after confirmations on different tickets, or by a single
            confirmation from the owner.
          </p>
          {page.observations.length === 0 && <Empty>no observations</Empty>}
          {page.observations.map((o) => <ObservationRow key={o.id} observation={o} />)}
        </section>

        <section className={s.history}>
          <h2 className="caps">Change history</h2>
          {page.history.map((h) => (
            <div key={h.id} className={s.historyRow}>
              <span className="faint mono">{new Date(h.at).toLocaleDateString('en-GB')}</span>
              <span className={s.historySummary}>{h.summary}</span>
              <span className="muted">{h.author}</span>
              {h.sourceTicketId
                ? <TicketRef id={h.sourceTicketId} />
                : <span className="faint">no ticket</span>}
              {h.revertable && <button type="button" className={s.revert}>revert</button>}
            </div>
          ))}
        </section>
      </article>

      <aside className={s.side}>
        <Panel title="Neighbours">
          {page.neighbors.length === 0 && <Empty>no edges derived</Empty>}
          {page.neighbors.map((n) => (
            <div key={n.pageId} className={s.neighbor}>
              <button type="button" className={s.linkBtn} onClick={() => openPage(n.pageId)}>
                {n.title}
              </button>
              <p className="faint">
                {n.derivedFrom}{n.weight ? ` · weight ${n.weight}` : ''}
              </p>
            </div>
          ))}
          <p className="faint">The graph is never opened in full. It unfolds on demand.</p>
        </Panel>
      </aside>
    </div>
  );
}

/**
 * The source ticket. It opens on our side while it is still in the team's work;
 * otherwise a contextual jump into ServiceNow (D12) rather than a dead link.
 */
function TicketRef({ id }: { id: string }) {
  const known = useApp((st) => st.tickets.some((t) => t.id === id));
  const selectTicket = useApp((st) => st.selectTicket);
  if (known) {
    return (
      <button type="button" className={`mono ${s.linkBtn}`} onClick={() => selectTicket(id)}>
        {id}
      </button>
    );
  }
  return (
    <a className="mono" href={adapter.deepLink('ticket', id)} target="_blank" rel="noreferrer">
      {id}
    </a>
  );
}

function ObservationRow({ observation: o }: { observation: Observation }) {
  const left = Math.max(0, o.promotionThreshold - o.confirmations);
  return (
    <div className={s.observation}>
      <p>{o.text}</p>
      <p className="faint">basis: {o.basis}</p>
      <p className={s.promotion}>
        {left === 0
          ? 'enough confirmations, awaiting promotion into the canon'
          : `into the canon after ${left} more confirmation${left === 1 ? '' : 's'}`}
        {' · '}
        {o.sourceTicketIds.map((id) => <TicketRef key={id} id={id} />)}
      </p>
    </div>
  );
}
