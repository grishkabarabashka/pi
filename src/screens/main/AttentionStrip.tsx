import { useApp } from '@/store/app';
import { buckets } from '~fixtures/team';
import { age } from '@/ui/primitives';
import s from './AttentionStrip.module.css';

const emphasisColor: Record<string, string> = {
  swarm: 'var(--none)',
  attention: 'var(--stale)',
  handover: 'var(--agent)',
  plain: 'var(--weak)',
};

/**
 * Peripheral vision: numbers, dots, colour, position. Nothing pops up over
 * the work, and there is nothing to read while it is collapsed.
 */
export function AttentionStrip() {
  const tickets = useApp((st) => st.tickets);
  const expanded = useApp((st) => st.stripExpanded);
  const toggle = useApp((st) => st.toggleStrip);
  const select = useApp((st) => st.selectTicket);

  const inBucket = (id: string) => tickets.filter((t) => t.bucket === id && t.state !== 'closed');
  const total = tickets.filter((t) => t.bucket && t.state !== 'closed').length;

  return (
    <div className={s.strip}>
      <div className={s.bar}>
        <span className="caps">Attention strip</span>
        <div className={s.counters}>
          {buckets.map((b) => {
            const count = inBucket(b.id).length;
            const pulse = b.emphasis === 'swarm' && count > 0;
            return (
              <span key={b.id} className={s.counter}>
                <span
                  className={`${s.dot} ${pulse ? s.pulse : ''}`}
                  style={{ background: emphasisColor[b.emphasis] }}
                />
                <span className="muted">{b.label}</span>
                <span className={s.num}>{count}</span>
              </span>
            );
          })}
        </div>
        <div className={s.right}>
          <span className="faint">{total} marked</span>
          <button type="button" className={s.toggle} onClick={toggle}>
            {expanded ? 'collapse' : 'expand'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className={s.columns}>
          {buckets.map((b) => {
            const list = inBucket(b.id);
            return (
              <div key={b.id} className={s.column}>
                <div className={s.columnHead}>
                  <span
                    className={s.dot}
                    style={{ background: emphasisColor[b.emphasis] }}
                  />
                  <span>{b.label}</span>
                  <span className="faint">{list.length}</span>
                </div>
                {list.length === 0 && <p className={s.emptyCol}>Empty</p>}
                {list.map((t) => (
                  <button key={t.id} type="button" className={s.card} onClick={() => select(t.id)}>
                    <span className={s.cardTop}>
                      <span className="mono">{t.id}</span>
                      <span className="faint">{age(t.openedAt)}</span>
                    </span>
                    <span className={s.cardTitle}>{t.title}</span>
                    {b.emphasis === 'swarm' && <span className="faint">3 participants</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
