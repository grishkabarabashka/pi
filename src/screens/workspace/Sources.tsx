import { useApp } from '@/store/app';
import { adapter } from '@/adapters/servicenow';
import type { Ticket } from '@/domain/types';
import { Empty, Panel, freshnessColor, freshnessLabel } from '@/ui/primitives';
import s from './Sources.module.css';

/**
 * Three separately labelled sections with different authority.
 * Not to be merged into a single ranked list.
 */
export function Sources({ ticket }: { ticket: Ticket }) {
  const suggestion = useApp((st) => st.suggestions[ticket.id]);
  const state = useApp((st) => st.suggestionState[ticket.id]);
  const openPage = useApp((st) => st.openPage);
  const toggleNotApplicable = useApp((st) => st.toggleNotApplicable);
  const proposals = useApp((st) => st.proposals[ticket.id]) ?? [];

  const history = suggestion?.alertHistory;
  const articles = suggestion?.articles ?? [];
  const similar = suggestion?.similarTickets ?? [];

  const isDiscarded = (articleId: string) => proposals.some(
    (p) => p.kind === 'not_applicable' && p.sourceArticleId === articleId && p.status === 'pending',
  );

  const articlesPanel = (
    <Panel title="Articles">
      {state === 'loading' && <Empty>the hint is being assembled</Empty>}
      {state === 'failed' && <Empty>the hint is unavailable</Empty>}
      {state === 'ready' && articles.length === 0 && <Empty>no matches</Empty>}
      {articles.map((a) => (
        <article
          key={a.articleId}
          className={`${s.article} ${isDiscarded(a.articleId) ? s.articleDiscarded : ''}`}
        >
          {/* The projection first: freshness, observations and history live there (D16). */}
          <button type="button" className={s.articleTitle} onClick={() => openPage(a.articleId, ticket.id)}>
            {a.title}
          </button>
          <p className={s.freshness} style={{ color: freshnessColor(a.freshness) }}>
            {freshnessLabel(a.freshness, a.lastConfirmedAt, a.useCount)}
          </p>
          <p className="faint">matched: {a.matchReason}</p>

          <div className={s.articleFoot}>
            {/* The only signal that corrects the matching rather than the content. */}
            <button
              type="button"
              className={s.notApplicable}
              onClick={() => toggleNotApplicable(ticket.id, a)}
              title="Corrects the matching, does not change the article text"
            >
              {isDiscarded(a.articleId) ? 'bring it back' : 'not about our case'}
            </button>
            <a
              className={`faint ${s.snLink}`}
              href={adapter.deepLink('article', a.articleId)}
              target="_blank"
              rel="noreferrer"
            >
              the original in ServiceNow
            </a>
          </div>
        </article>
      ))}
    </Panel>
  );

  return (
    <div className={s.sources}>
      {ticket.origin === 'alert' && (
        <Panel title="Past occurrences">
          {state === 'loading' && <Empty>the history is being assembled</Empty>}
          {state !== 'loading' && !history && <Empty>the occurrence history is empty</Empty>}
          {history && (
            <>
              <p className="mono faint">{history.signature}</p>
              <p>{history.commonResolution}</p>
              <p className="muted">exceptions: {history.exceptions}</p>
            </>
          )}
        </Panel>
      )}

      {articlesPanel}

      <Panel title={ticket.origin === 'alert' ? 'Similar tickets' : 'Similar requests'}>
        {state === 'ready' && similar.length === 0 && <Empty>nothing similar found</Empty>}
        {similar.map((t) => (
          <div key={t.ticketId} className={s.similar}>
            <a className="mono" href={adapter.deepLink('ticket', t.ticketId)} target="_blank" rel="noreferrer">
              {t.ticketId}
            </a>
            <span className="muted"> {t.outcome}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}
